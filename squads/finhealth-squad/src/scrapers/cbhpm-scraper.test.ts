/**
 * Tests: CBHPM Scraper
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import {
  CbhpmScraper,
  UCH_VALOR_BASE,
  getDefaultPortes,
  getUchForPorte,
  getValorForPorte,
  getCoForPorte,
} from './cbhpm-scraper';
import type { ScraperDeps } from './types';

// ============================================================================
// Fixtures
// ============================================================================

const CBHPM_TABLE_HTML = `<html>
<body>
  <table class="cbhpm-table">
    <tr><th>Código</th><th>Descrição</th><th>Porte</th></tr>
    <tr><td>10.10.10.12</td><td>Consulta médica</td><td>1C</td></tr>
    <tr><td>31.01.01.12</td><td>Excisão de lesão</td><td>3A</td></tr>
  </table>
  <table class="portes">
    <tr><td>1A</td><td>40</td><td>0</td><td>0</td></tr>
    <tr><td>2B</td><td>100</td><td>15</td><td>0</td></tr>
  </table>
</body>
</html>`;

const PROCEDURES_ONLY_HTML = `<html>
<body>
  <table class="cbhpm-table">
    <tr><td>10.10.10.12</td><td>Consulta</td><td>1C</td></tr>
  </table>
</body>
</html>`;

const EMPTY_HTML = `<html><body><p>No data</p></body></html>`;

function createMockDeps(overrides?: Partial<ScraperDeps>): ScraperDeps {
  return {
    httpClient: { get: async () => ({ data: CBHPM_TABLE_HTML }) },
    llmClient: { chatCompletion: async () => ({ content: '{"isValid": true, "issues": []}' }) },
    fileSystem: {
      readFile: async () => '{}',
      writeFile: async () => {},
      exists: async () => false,
    },
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    ...overrides,
  };
}

function createScraper(deps?: Partial<ScraperDeps>) {
  return new CbhpmScraper(
    { outputPath: '/tmp/cbhpm.json' },
    createMockDeps(deps),
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('CbhpmScraper — parseHtml', () => {
  it('should extract procedures with XX.XX.XX.XX codes', async () => {
    const scraper = createScraper();

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data.procedures.length).toBe(2);
    expect(result.data.procedures[0].codigo).toBe('10.10.10.12');
    expect(result.data.procedures[0].porte).toBe('1C');
  });

  it('should extract porte table from HTML', async () => {
    const scraper = createScraper();

    const result = await scraper.scrape();

    expect(result.data.portes['1A']).toBeDefined();
    expect(result.data.portes['1A'].uch).toBe(40);
    expect(result.data.portes['2B']).toBeDefined();
  });

  it('should use default portes when none found in HTML', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: PROCEDURES_ONLY_HTML }) },
    });

    const result = await scraper.scrape();

    // Should have default 42 portes since no porte table in HTML
    expect(Object.keys(result.data.portes).length).toBe(42);
  });
});

describe('getDefaultPortes', () => {
  it('should return 42 porte entries', () => {
    const portes = getDefaultPortes();
    expect(Object.keys(portes).length).toBe(42);
  });

  it('should contain all porte codes from 1A to 14C', () => {
    const portes = getDefaultPortes();
    const expectedPortes = ['1A', '1B', '1C', '7B', '10A', '14C'];
    for (const porte of expectedPortes) {
      expect(portes[porte]).toBeDefined();
    }
  });

  it('should have positive UCH and valor values for all portes', () => {
    const portes = getDefaultPortes();
    for (const info of Object.values(portes)) {
      expect(info.uch).toBeGreaterThan(0);
      expect(info.valor).toBeGreaterThan(0);
    }
  });
});

describe('porte helper functions', () => {
  it('getUchForPorte should return correct UCH for known portes', () => {
    expect(getUchForPorte('1A')).toBe(40);
    expect(getUchForPorte('7B')).toBe(1800);
    expect(getUchForPorte('14C')).toBe(220000);
  });

  it('getUchForPorte should return default for unknown porte', () => {
    expect(getUchForPorte('99Z')).toBe(100);
  });

  it('getValorForPorte should return correct value', () => {
    expect(getValorForPorte('1A')).toBe(22.00);
    expect(getValorForPorte('2B')).toBe(55.00);
  });

  it('getCoForPorte should return correct CO value', () => {
    expect(getCoForPorte('1A')).toBe(0);
    expect(getCoForPorte('3A')).toBe(30);
    expect(getCoForPorte('99Z')).toBe(0); // Unknown returns default 0
  });
});

describe('CbhpmScraper — hasData', () => {
  it('should return true when procedures exist', async () => {
    const scraper = createScraper();
    const result = await scraper.scrape();
    expect(result.success).toBe(true); // hasData returned true
  });

  it('should return true when only portes exist (default fallback)', async () => {
    // Even empty HTML produces default portes, so hasData = true
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: EMPTY_HTML }) },
    });

    const result = await scraper.scrape();

    // Default portes are included, so hasData is true
    expect(result.success).toBe(true);
    expect(Object.keys(result.data.portes).length).toBe(42);
  });

  it('should have UCH base value', async () => {
    const scraper = createScraper();
    const result = await scraper.scrape();
    expect(result.data.uch_valor).toBe(UCH_VALOR_BASE);
  });
});

describe('CbhpmScraper — parseFallbackResponse', () => {
  it('should parse compound shape with procedures and portes', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [{ codigo: '10.10.10.12', descricao: 'Consulta', porte: '1C' }],
            portes: { '1A': { porte: '1A', uch: 40, valor: 22, co: 0, filme: 0 } },
            uch_valor: 0.55,
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data.procedures.length).toBe(1);
    expect(result.data.portes['1A']).toBeDefined();
  });

  it('should use default portes when not in response', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [{ codigo: '10.10.10.12', descricao: 'Consulta', porte: '1C' }],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(Object.keys(result.data.portes).length).toBe(42);
  });
});

describe('CbhpmScraper — buildCacheOutput', () => {
  it('should include componentes and auxiliares metadata', async () => {
    let writtenData = '';
    const scraper = createScraper({
      fileSystem: {
        readFile: async () => '{}',
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => false,
      },
    });

    await scraper.scrape();

    const output = JSON.parse(writtenData);
    expect(output.componentes).toBeDefined();
    expect(output.componentes.uch).toBe('Unidade de Custo Hospitalar');
    expect(output.auxiliares).toBeDefined();
    expect(output.auxiliares.primeiro_auxiliar).toBe(0.30);
  });
});

describe('CbhpmScraper — mergeWithExisting', () => {
  it('should merge procedures by codigo', async () => {
    let writtenData = '';
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: CBHPM_TABLE_HTML }) },
      fileSystem: {
        readFile: async () => JSON.stringify({
          procedures: [{ codigo: '99.99.99.99', descricao: 'Existing', porte: '1A', uch: 40, valor_porte: 22, custo_operacional: 0 }],
          portes: {},
        }),
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => true,
      },
    });

    await scraper.scrape();

    const output = JSON.parse(writtenData);
    // Should have existing + 2 new
    expect(output.procedures.length).toBe(3);
  });

  it('should preserve portes from both sources', async () => {
    let writtenData = '';
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: CBHPM_TABLE_HTML }) },
      fileSystem: {
        readFile: async () => JSON.stringify({
          procedures: [],
          portes: { 'CUSTOM': { porte: 'CUSTOM', uch: 1, valor: 1, co: 0, filme: 0 } },
        }),
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => true,
      },
    });

    await scraper.scrape();

    const output = JSON.parse(writtenData);
    expect(output.portes['CUSTOM']).toBeDefined();
    expect(output.portes['1A']).toBeDefined();
  });
});

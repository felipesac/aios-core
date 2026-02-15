/**
 * Tests: DATASUS SIGTAP Scraper
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { DatasusScraper, inferComplexidade, mergeSigtapProcedures } from './datasus-scraper';
import type { ScraperDeps, SigtapProcedure } from './types';

// ============================================================================
// Fixtures
// ============================================================================

const SIGTAP_TABLE_HTML = `<html>
<body>
  <table class="sigtap-table">
    <tr><th>Código</th><th>Descrição</th><th>SH</th><th>SP</th><th>Total</th></tr>
    <tr><td>0301010064</td><td>Consulta médica em atenção básica</td><td>10,00</td><td>6,30</td><td>16,30</td></tr>
    <tr><td>0202010503</td><td>Hemograma completo</td><td>2,73</td><td>1,85</td><td>4,58</td></tr>
    <tr><td>0407010025</td><td>Colecistectomia videolaparoscópica</td><td>350,00</td><td>200,00</td><td>550,00</td></tr>
  </table>
</body>
</html>`;

const ALT_SELECTOR_HTML = `<html>
<body>
  <table>
    <tr>
      <td class="codigo-sigtap" data-codigo-sigtap="0101010010">0101010010</td>
      <td class="descricao">Ações de promoção</td>
      <td>5,00</td>
      <td>3,00</td>
      <td>8,00</td>
    </tr>
  </table>
</body>
</html>`;

const COMMA_DECIMAL_HTML = `<html>
<body>
  <table class="sigtap-table">
    <tr><td>0301010064</td><td>Consulta</td><td>10,50</td><td>6,30</td><td>16,80</td></tr>
  </table>
</body>
</html>`;

const INVALID_CODES_HTML = `<html>
<body>
  <table class="sigtap-table">
    <tr><td>12345</td><td>Short code</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>ABC1234567</td><td>Not numeric</td><td>0</td><td>0</td><td>0</td></tr>
    <tr><td>0301010064</td><td>Valid code</td><td>10,00</td><td>5,00</td><td>15,00</td></tr>
  </table>
</body>
</html>`;

const EMPTY_HTML = `<html><body><p>No data</p></body></html>`;

function createMockDeps(overrides?: Partial<ScraperDeps>): ScraperDeps {
  return {
    httpClient: { get: async () => ({ data: SIGTAP_TABLE_HTML }) },
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
  return new DatasusScraper(
    { outputPath: '/tmp/sigtap.json' },
    createMockDeps(deps),
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('DatasusScraper — parseHtml', () => {
  it('should extract 10-digit SIGTAP codes', async () => {
    const scraper = createScraper();

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3);
    expect(result.data[0].codigo).toBe('0301010064');
    expect(result.data[0].descricao).toBe('Consulta médica em atenção básica');
  });

  it('should parse SUS values with comma-decimal format', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: COMMA_DECIMAL_HTML }) },
    });

    const result = await scraper.scrape();

    expect(result.data[0].valor_sh).toBe(10.5);
    expect(result.data[0].valor_sp).toBe(6.3);
    expect(result.data[0].valor_total).toBe(16.8);
  });

  it('should skip invalid codes (non-10-digit)', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: INVALID_CODES_HTML }) },
    });

    const result = await scraper.scrape();

    expect(result.data.length).toBe(1);
    expect(result.data[0].codigo).toBe('0301010064');
  });

  it('should handle alternative selectors', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: ALT_SELECTOR_HTML }) },
    });

    const result = await scraper.scrape();

    expect(result.data.length).toBe(1);
    expect(result.data[0].codigo).toBe('0101010010');
    expect(result.data[0].grupo).toBe('01');
  });
});

describe('inferComplexidade', () => {
  it('should return AC for grupos 04, 05', () => {
    expect(inferComplexidade('0401010010')).toBe('AC');
    expect(inferComplexidade('0501010010')).toBe('AC');
  });

  it('should return AB for grupo 01', () => {
    expect(inferComplexidade('0101010010')).toBe('AB');
  });

  it('should return MC for other grupos', () => {
    expect(inferComplexidade('0201010010')).toBe('MC');
    expect(inferComplexidade('0301010010')).toBe('MC');
    expect(inferComplexidade('0601010010')).toBe('MC');
    expect(inferComplexidade('0801010010')).toBe('MC');
  });
});

describe('mergeSigtapProcedures', () => {
  it('should merge by codigo without duplicates', () => {
    const existing: SigtapProcedure[] = [
      { codigo: '0301010064', descricao: 'Consulta', grupo: '03', subgrupo: '01', forma_organizacao: '01', valor_sh: 10, valor_sp: 5, valor_total: 15, complexidade: 'MC' },
    ];
    const newData: SigtapProcedure[] = [
      { codigo: '0301010064', descricao: 'Consulta (updated)', grupo: '03', subgrupo: '01', forma_organizacao: '01', valor_sh: 12, valor_sp: 6, valor_total: 18, complexidade: 'MC' },
      { codigo: '0202010503', descricao: 'Hemograma', grupo: '02', subgrupo: '02', forma_organizacao: '01', valor_sh: 3, valor_sp: 2, valor_total: 5, complexidade: 'MC' },
    ];

    const merged = mergeSigtapProcedures(existing, newData);

    expect(merged.length).toBe(2);
    expect(merged.find(p => p.codigo === '0301010064')?.descricao).toBe('Consulta (updated)');
  });

  it('should sort result by codigo', () => {
    const data: SigtapProcedure[] = [
      { codigo: '0301010064', descricao: 'B', grupo: '03', subgrupo: '01', forma_organizacao: '01', valor_sh: 0, valor_sp: 0, valor_total: 0, complexidade: 'MC' },
      { codigo: '0101010010', descricao: 'A', grupo: '01', subgrupo: '01', forma_organizacao: '01', valor_sh: 0, valor_sp: 0, valor_total: 0, complexidade: 'AB' },
    ];

    const merged = mergeSigtapProcedures([], data);

    expect(merged[0].codigo).toBe('0101010010');
    expect(merged[1].codigo).toBe('0301010064');
  });

  it('should handle empty arrays', () => {
    expect(mergeSigtapProcedures([], []).length).toBe(0);
  });
});

describe('DatasusScraper — parseFallbackResponse', () => {
  it('should parse { procedures: [...] } format', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [
              { codigo: '0301010064', descricao: 'Consulta', valor_sh: 10, valor_sp: 5, valor_total: 15, complexidade: 'MC' },
            ],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data[0].codigo).toBe('0301010064');
    expect(result.data[0].grupo).toBe('03');
  });

  it('should normalize field names', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [{ code: '0101010010', description: 'Action' }],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.data[0].codigo).toBe('0101010010');
    expect(result.data[0].descricao).toBe('Action');
    expect(result.data[0].complexidade).toBe('AB'); // inferred from grupo 01
  });

  it('should fill defaults for missing fields', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [{ codigo: '0301010064', descricao: 'Test' }],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.data[0].forma_organizacao).toBe('01');
    expect(result.data[0].valor_sh).toBe(0);
    expect(result.data[0].valor_total).toBe(0);
  });
});

describe('DatasusScraper — buildCacheOutput', () => {
  it('should include grupos and complexidades metadata', async () => {
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
    expect(output.grupos).toBeDefined();
    expect(output.grupos.length).toBe(8);
    expect(output.complexidades).toBeDefined();
    expect(output.complexidades.AC).toBe('Alta Complexidade');
  });

  it('should include _meta with correct source', async () => {
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
    expect(output._meta.source).toContain('DATASUS');
    expect(output._meta.procedure_count).toBe(3);
  });
});

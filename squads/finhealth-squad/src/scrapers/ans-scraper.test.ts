/**
 * Tests: ANS TUSS Scraper
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { AnsScraper, inferProcedureType, mergeTussProcedures } from './ans-scraper';
import type { ScraperDeps, TussProcedure } from './types';

// ============================================================================
// Fixtures
// ============================================================================

const TUSS_TABLE_HTML = `<html>
<body>
  <table class="tuss-table">
    <tr><th>Código</th><th>Descrição</th><th>Porte</th></tr>
    <tr><td>10101012</td><td>Consulta em consultório</td><td>1C</td></tr>
    <tr><td>40301010</td><td>Hemograma completo</td><td>1A</td></tr>
    <tr><td>30101012</td><td>Biópsia de pele</td><td>3A</td></tr>
  </table>
</body>
</html>`;

const DIV_FORMAT_HTML = `<html>
<body>
  <div class="codigo-tuss" data-codigo="40302040">40302040</div>
  <div class="descricao">Glicose</div>
  <div class="codigo-tuss" data-codigo="20101015">20101015</div>
  <div class="descricao">Curativo grau II</div>
</body>
</html>`;

const INVALID_CODES_HTML = `<html>
<body>
  <table class="tuss-table">
    <tr><td>123</td><td>Invalid short code</td></tr>
    <tr><td>not-a-code</td><td>Not numeric</td></tr>
    <tr><td>10101012</td><td>Valid code</td></tr>
  </table>
</body>
</html>`;

const EMPTY_HTML = `<html><body><p>No tables here</p></body></html>`;

function createMockDeps(overrides?: Partial<ScraperDeps>): ScraperDeps {
  return {
    httpClient: { get: async () => ({ data: TUSS_TABLE_HTML }) },
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
  return new AnsScraper(
    { outputPath: '/tmp/tuss.json' },
    createMockDeps(deps),
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('AnsScraper — parseHtml (table format)', () => {
  it('should extract procedures from TUSS table rows', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: TUSS_TABLE_HTML }) },
    });

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3);
    expect(result.data[0].codigo).toBe('10101012');
    expect(result.data[0].descricao).toBe('Consulta em consultório');
    expect(result.data[0].porte).toBe('1C');
  });

  it('should extract procedures from div/data-codigo format', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: DIV_FORMAT_HTML }) },
    });

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
    expect(result.data[0].codigo).toBe('40302040');
  });

  it('should skip invalid codes (non-8-digit)', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: INVALID_CODES_HTML }) },
    });

    const result = await scraper.scrape();

    expect(result.data.length).toBe(1);
    expect(result.data[0].codigo).toBe('10101012');
  });

  it('should return empty array for HTML with no matching selectors', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: EMPTY_HTML }) },
      llmClient: { chatCompletion: async () => ({ content: '{"procedures": [{"codigo": "10101012", "descricao": "Fallback"}]}' }) },
    });

    const result = await scraper.scrape();

    // Should fall back to LLM since parseHtml returns empty
    expect(result.source).toBe('llm_fallback');
  });
});

describe('inferProcedureType', () => {
  it('should map known prefixes correctly', () => {
    expect(inferProcedureType('10101012')).toBe('consulta');
    expect(inferProcedureType('40301010')).toBe('exame');
    expect(inferProcedureType('30101012')).toBe('cirurgia');
    expect(inferProcedureType('80101010')).toBe('internacao');
  });

  it('should return "outros" for unknown prefix', () => {
    expect(inferProcedureType('00101012')).toBe('outros');
    expect(inferProcedureType('99101012')).toBe('outros');
  });

  it('should map all defined prefixes', () => {
    const expected: Record<string, string> = {
      '10': 'consulta',
      '20': 'procedimento_clinico',
      '30': 'cirurgia',
      '40': 'exame',
      '50': 'terapia',
      '60': 'material',
      '70': 'medicamento',
      '80': 'internacao',
      '90': 'outros',
    };
    for (const [prefix, tipo] of Object.entries(expected)) {
      expect(inferProcedureType(`${prefix}000000`)).toBe(tipo);
    }
  });
});

describe('mergeTussProcedures', () => {
  it('should merge without duplicates', () => {
    const existing: TussProcedure[] = [
      { codigo: '10101012', descricao: 'Consulta', tipo: 'consulta' },
      { codigo: '40301010', descricao: 'Hemograma', tipo: 'exame' },
    ];
    const newData: TussProcedure[] = [
      { codigo: '40301010', descricao: 'Hemograma completo (updated)', tipo: 'exame' },
      { codigo: '30101012', descricao: 'Biópsia', tipo: 'cirurgia' },
    ];

    const merged = mergeTussProcedures(existing, newData);

    expect(merged.length).toBe(3); // No duplicate for 40301010
    const hemo = merged.find(p => p.codigo === '40301010');
    expect(hemo?.descricao).toBe('Hemograma completo (updated)'); // New overwrites
  });

  it('should sort by codigo', () => {
    const data: TussProcedure[] = [
      { codigo: '40301010', descricao: 'B', tipo: 'exame' },
      { codigo: '10101012', descricao: 'A', tipo: 'consulta' },
    ];

    const merged = mergeTussProcedures([], data);

    expect(merged[0].codigo).toBe('10101012');
    expect(merged[1].codigo).toBe('40301010');
  });

  it('should handle empty arrays', () => {
    expect(mergeTussProcedures([], []).length).toBe(0);
    expect(mergeTussProcedures([{ codigo: '10101012', descricao: 'A', tipo: 'consulta' }], []).length).toBe(1);
  });
});

describe('AnsScraper — parseFallbackResponse', () => {
  it('should parse { procedures: [...] } format', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [
              { codigo: '10101012', descricao: 'Consulta', tipo: 'consulta' },
              { codigo: '40301010', descricao: 'Hemograma', tipo: 'exame' },
            ],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
    expect(result.data[0].codigo).toBe('10101012');
  });

  it('should parse { data: [...] } format', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            data: [{ codigo: '40301010', descricao: 'Hemograma' }],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.data[0].codigo).toBe('40301010');
  });

  it('should handle alternative field names (code/description)', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({
          content: JSON.stringify({
            procedures: [{ code: '10101012', description: 'Consultation' }],
          }),
        }),
      },
    });

    const result = await scraper.scrape();

    expect(result.data[0].codigo).toBe('10101012');
    expect(result.data[0].descricao).toBe('Consultation');
    expect(result.data[0].tipo).toBe('consulta');
  });

  it('should return empty on completely malformed response', async () => {
    const scraper = createScraper({
      httpClient: { get: async () => { throw new Error('HTTP fail'); } },
      llmClient: {
        chatCompletion: async () => ({ content: '{"random": "data"}' }),
      },
    });

    const result = await scraper.scrape();

    expect(result.success).toBe(false);
    expect(result.data.length).toBe(0);
  });
});

describe('AnsScraper — buildCacheOutput', () => {
  it('should include _meta with correct fields', async () => {
    let writtenData = '';
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: TUSS_TABLE_HTML }) },
      fileSystem: {
        readFile: async () => '{}',
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => false,
      },
    });

    await scraper.scrape();

    const output = JSON.parse(writtenData);
    expect(output._meta).toBeDefined();
    expect(output._meta.source).toContain('ANS');
    expect(output._meta.procedure_count).toBe(3);
    expect(output._meta.last_update).toBeDefined();
  });

  it('should include procedures array in output', async () => {
    let writtenData = '';
    const scraper = createScraper({
      httpClient: { get: async () => ({ data: TUSS_TABLE_HTML }) },
      fileSystem: {
        readFile: async () => '{}',
        writeFile: async (_path, data) => { writtenData = data; },
        exists: async () => false,
      },
    });

    await scraper.scrape();

    const output = JSON.parse(writtenData);
    expect(Array.isArray(output.procedures)).toBe(true);
    expect(output.procedures.length).toBe(3);
  });
});

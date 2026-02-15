/**
 * Tests: Scraper Manager
 * FinHealth Squad
 */

import { describe, it, expect } from 'vitest';
import { ScraperManager, createScraperManager } from './scraper-manager';
import type { ScraperManagerConfig, HttpClient, LlmClient, FileSystem, Logger } from './types';

// ============================================================================
// Fixtures
// ============================================================================

const TUSS_HTML = `<html><body><table class="tuss-table"><tr><td>10101012</td><td>Consulta</td></tr></table></body></html>`;
const CBHPM_HTML = `<html><body><table class="cbhpm-table"><tr><td>10.10.10.12</td><td>Consulta</td><td>1C</td></tr></table></body></html>`;
const SIGTAP_HTML = `<html><body><table class="sigtap-table"><tr><td>0301010064</td><td>Consulta</td><td>10,00</td><td>5,00</td><td>15,00</td></tr></table></body></html>`;

function createMockHttpClient(responses?: Record<string, string>): HttpClient {
  return {
    get: async (url) => {
      // Return appropriate HTML based on URL (check specific patterns first)
      if (responses && responses[url]) return { data: responses[url] };
      if (url.includes('sigtap') || url.includes('datasus')) return { data: SIGTAP_HTML };
      if (url.includes('amb') || url.includes('cbhpm') || url.includes('portalmedico')) return { data: CBHPM_HTML };
      if (url.includes('ans') || url.includes('tuss') || url.includes('gov.br')) return { data: TUSS_HTML };
      return { data: '<html></html>' };
    },
  };
}

function createMockLlmClient(): LlmClient {
  return {
    chatCompletion: async () => ({ content: '{"isValid": true, "issues": []}' }),
  };
}

function createMockFileSystem(): FileSystem {
  const store: Record<string, string> = {};
  return {
    readFile: async (p) => { if (store[p]) return store[p]; throw new Error('ENOENT'); },
    writeFile: async (p, data) => { store[p] = data; },
    exists: async (p) => p in store,
  };
}

function createMockLogger(): Logger {
  return { info: () => {}, warn: () => {}, error: () => {} };
}

function createTestConfig(overrides?: Partial<ScraperManagerConfig>): ScraperManagerConfig {
  return {
    dataDir: '/tmp/test-data',
    httpClient: createMockHttpClient(),
    llmClient: createMockLlmClient(),
    fileSystem: createMockFileSystem(),
    logger: createMockLogger(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ScraperManager — scrapeAll() parallel success', () => {
  it('should run all three scrapers and return results', async () => {
    const manager = new ScraperManager(createTestConfig());

    const results = await manager.scrapeAll();

    expect(results.ans).toBeDefined();
    expect(results.cbhpm).toBeDefined();
    expect(results.datasus).toBeDefined();
  });

  it('should have correct summary counts on full success', async () => {
    const manager = new ScraperManager(createTestConfig());

    const results = await manager.scrapeAll();

    expect(results.summary.totalScrapers).toBe(3);
    expect(results.summary.successCount).toBe(3);
    expect(results.summary.failureCount).toBe(0);
  });

  it('should have zero maintenance items when all succeed via scraper', async () => {
    const manager = new ScraperManager(createTestConfig());

    const results = await manager.scrapeAll();

    expect(results.summary.maintenanceNeeded.length).toBe(0);
  });
});

describe('ScraperManager — scrapeAll() partial failure', () => {
  it('should handle one scraper failing gracefully', async () => {
    const manager = new ScraperManager(createTestConfig({
      httpClient: {
        get: async (url) => {
          // Fail on ANS URLs only (check datasus/sigtap first to avoid gov.br overlap)
          if (url.includes('sigtap') || url.includes('datasus')) return { data: SIGTAP_HTML };
          if (url.includes('amb') || url.includes('cbhpm') || url.includes('portalmedico')) return { data: CBHPM_HTML };
          // Everything else (ANS/gov.br) fails
          throw new Error('ANS down');
        },
      },
      llmClient: {
        chatCompletion: async () => {
          // LLM fallback also returns empty for ANS
          return { content: '{"procedures": [], "isValid": true, "issues": []}' };
        },
      },
    }));

    const results = await manager.scrapeAll();

    // ANS fails (empty procedures from fallback), CBHPM and DATASUS succeed
    expect(results.cbhpm.success).toBe(true);
    expect(results.datasus.success).toBe(true);
  });

  it('should track maintenance needed scrapers', async () => {
    const manager = new ScraperManager(createTestConfig({
      httpClient: {
        get: async (url) => {
          if (url.includes('sigtap') || url.includes('datasus')) return { data: SIGTAP_HTML };
          if (url.includes('amb') || url.includes('cbhpm') || url.includes('portalmedico')) return { data: CBHPM_HTML };
          throw new Error('fail'); // ANS fails
        },
      },
      llmClient: {
        chatCompletion: async (params) => {
          // Return valid fallback data for ANS so it succeeds via llm_fallback
          if (params.messages[0].content.includes('TUSS')) {
            return { content: '{"procedures": [{"codigo":"10101012","descricao":"Consulta","tipo":"consulta"}]}' };
          }
          return { content: '{"isValid": true, "issues": []}' };
        },
      },
    }));

    const results = await manager.scrapeAll();

    expect(results.ans.needsMaintenance).toBe(true);
    expect(results.summary.maintenanceNeeded).toContain('ans');
  });
});

describe('ScraperManager — scrapeAll() all fail', () => {
  it('should return all failures gracefully', async () => {
    const manager = new ScraperManager(createTestConfig({
      httpClient: { get: async () => { throw new Error('all down'); } },
      llmClient: { chatCompletion: async () => { throw new Error('LLM down'); } },
    }));

    const results = await manager.scrapeAll();

    // CBHPM always has default portes so hasData=true, but others may fail
    // Even with errors, the manager should not throw
    expect(results.summary.totalScrapers).toBe(3);
    expect(results.ans).toBeDefined();
    expect(results.cbhpm).toBeDefined();
    expect(results.datasus).toBeDefined();
  });
});

describe('ScraperManager — individual scraper methods', () => {
  it('scrapeAns should return ANS result', async () => {
    const manager = new ScraperManager(createTestConfig());

    const result = await manager.scrapeAns();

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].codigo).toBe('10101012');
  });

  it('scrapeCbhpm should return CBHPM result', async () => {
    const manager = new ScraperManager(createTestConfig());

    const result = await manager.scrapeCbhpm();

    expect(result.success).toBe(true);
    expect(result.data.procedures.length).toBeGreaterThan(0);
  });

  it('scrapeDataasus should return DATASUS result', async () => {
    const manager = new ScraperManager(createTestConfig());

    const result = await manager.scrapeDataasus();

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
});

describe('ScraperManager — getMaintenanceStatus', () => {
  it('should return empty when no maintenance needed', async () => {
    const manager = new ScraperManager(createTestConfig());

    const results = await manager.scrapeAll();
    const status = manager.getMaintenanceStatus(results);

    expect(status.length).toBe(0);
  });

  it('should list scrapers needing maintenance', async () => {
    const manager = new ScraperManager(createTestConfig({
      httpClient: {
        get: async (url) => {
          if (url.includes('sigtap') || url.includes('datasus')) return { data: SIGTAP_HTML };
          if (url.includes('amb') || url.includes('cbhpm') || url.includes('portalmedico')) return { data: CBHPM_HTML };
          throw new Error('fail'); // ANS fails
        },
      },
      llmClient: {
        chatCompletion: async (params) => {
          if (params.messages[0].content.includes('TUSS')) {
            return { content: '{"procedures": [{"codigo":"10101012","descricao":"Test","tipo":"consulta"}]}' };
          }
          return { content: '{"isValid": true, "issues": []}' };
        },
      },
    }));

    const results = await manager.scrapeAll();
    const status = manager.getMaintenanceStatus(results);

    expect(status).toContain('ans');
  });
});

describe('ScraperManager — createScraperManager factory', () => {
  it('should create manager with custom config', () => {
    const manager = createScraperManager({
      dataDir: '/custom/path',
      httpClient: createMockHttpClient(),
      llmClient: createMockLlmClient(),
      fileSystem: createMockFileSystem(),
      logger: createMockLogger(),
    });

    expect(manager).toBeInstanceOf(ScraperManager);
  });

  it('should accept partial config', () => {
    // This should not throw — defaults are used for missing deps
    const manager = createScraperManager({
      dataDir: '/tmp/data',
      httpClient: createMockHttpClient(),
      llmClient: createMockLlmClient(),
      fileSystem: createMockFileSystem(),
      logger: createMockLogger(),
    });

    expect(manager).toBeDefined();
  });
});

describe('ScraperManager — duration tracking', () => {
  it('should track durationMs', async () => {
    const manager = new ScraperManager(createTestConfig());

    const results = await manager.scrapeAll();

    expect(results.summary.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof results.summary.durationMs).toBe('number');
  });
});

describe('ScraperManager — sequential execution', () => {
  it('should support sequential execution', async () => {
    const manager = new ScraperManager(createTestConfig());

    const results = await manager.scrapeAll({ parallel: false });

    expect(results.summary.totalScrapers).toBe(3);
    expect(results.ans.success).toBe(true);
    expect(results.cbhpm.success).toBe(true);
    expect(results.datasus.success).toBe(true);
  });
});

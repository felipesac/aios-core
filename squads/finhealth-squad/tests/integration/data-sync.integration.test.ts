/**
 * Data Sync Integration Tests
 * FinHealth Squad
 *
 * Two categories:
 *   1. Data validation — always runs, no network (validates committed JSON files)
 *   2. Network tests — skipped in CI (validates live download from sources)
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadTussTable, loadCbhpmData } from '../../src/validators/tiss-validator';

const DATA_DIR = path.resolve(__dirname, '../../data');

// ============================================================================
// Category 1: Data Validation (no network, always runs)
// ============================================================================

describe('Data Validation — committed JSON files', () => {
  describe('tuss-procedures.json', () => {
    const filePath = path.join(DATA_DIR, 'tuss-procedures.json');

    it('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('has >= 4000 procedures with valid 8-digit codes', () => {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(data.procedures).toBeDefined();
      expect(data.procedures.length).toBeGreaterThanOrEqual(4000);

      for (const proc of data.procedures) {
        expect(proc.codigo).toMatch(/^\d{8}$/);
        expect(proc.descricao.length).toBeGreaterThan(0);
        expect(proc.tipo).toBeDefined();
      }
    });

    it('_meta does not contain "Amostra representativa"', () => {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const metaStr = JSON.stringify(data._meta);
      expect(metaStr).not.toContain('Amostra representativa');
    });

    it('loadTussTable() works correctly', () => {
      const table = loadTussTable(DATA_DIR);
      expect(table.length).toBeGreaterThanOrEqual(4000);
      expect(table[0].codigo).toBeDefined();
    });
  });

  describe('sigtap-procedures.json', () => {
    const filePath = path.join(DATA_DIR, 'sigtap-procedures.json');

    it('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('has >= 4000 procedures with valid 10-digit codes', () => {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(data.procedures).toBeDefined();
      expect(data.procedures.length).toBeGreaterThanOrEqual(4000);

      for (const proc of data.procedures) {
        expect(proc.codigo).toMatch(/^\d{10}$/);
        expect(proc.descricao.length).toBeGreaterThan(0);
        expect(proc.grupo).toBeDefined();
        expect(proc.complexidade).toMatch(/^(AB|MC|AC)$/);
      }
    });

    it('_meta does not contain "Amostra representativa"', () => {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const metaStr = JSON.stringify(data._meta);
      expect(metaStr).not.toContain('Amostra representativa');
    });
  });

  describe('cbhpm-values.json', () => {
    const filePath = path.join(DATA_DIR, 'cbhpm-values.json');

    it('file exists', () => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('has 42 portes (1A through 14C)', () => {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(data.portes).toBeDefined();
      expect(Object.keys(data.portes).length).toBe(42);

      // Verify all expected portes
      const expected = [];
      for (let i = 1; i <= 14; i++) {
        expected.push(`${i}A`, `${i}B`, `${i}C`);
      }
      for (const porte of expected) {
        expect(data.portes[porte]).toBeDefined();
      }
    });

    it('_meta does not contain "Amostra representativa"', () => {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const metaStr = JSON.stringify(data._meta);
      expect(metaStr).not.toContain('Amostra representativa');
    });

    it('loadCbhpmData() works correctly', () => {
      const cbhpm = loadCbhpmData(DATA_DIR);
      expect(cbhpm.uch_valor).toBeGreaterThan(0);
      expect(Object.keys(cbhpm.portes).length).toBe(42);
    });
  });

  describe('tiss-schemas/', () => {
    const schemasDir = path.join(DATA_DIR, 'tiss-schemas');

    it('directory exists', () => {
      expect(fs.existsSync(schemasDir)).toBe(true);
    });

    it('contains >= 3 XSD files', () => {
      const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.xsd'));
      expect(files.length).toBeGreaterThanOrEqual(3);
    });

    it('manifest.json exists with schema entries', () => {
      const manifestPath = path.join(schemasDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.schemas).toBeDefined();
      expect(manifest.schemas.length).toBeGreaterThanOrEqual(3);
      expect(manifest.source).toContain('ANS');

      // Each entry should have filename, sha256, sizeBytes
      for (const entry of manifest.schemas) {
        expect(entry.filename).toBeDefined();
        expect(entry.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(entry.sizeBytes).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// Category 2: Network Tests (skip in CI)
// ============================================================================

const SKIP_NETWORK = !!process.env.CI;

describe.skipIf(SKIP_NETWORK)('Network Tests — live source downloads', () => {
  it('TUSS download from ANS FTP succeeds', async () => {
    const { downloadFile } = await import('../../scripts/data-sync/shared');
    const url = 'http://ftp.dadosabertos.ans.gov.br/FTP/PDA/terminologia_unificada_saude_suplementar_TUSS/TUSS.zip';
    const buffer = await downloadFile(url, 120_000);
    expect(buffer.length).toBeGreaterThan(1000);
  }, 180_000);

  it('SIGTAP download from DATASUS succeeds', async () => {
    const { downloadFile } = await import('../../scripts/data-sync/shared');
    const url = 'http://sigtap.datasus.gov.br/tabela-unificada/app/download.jsp';
    const buffer = await downloadFile(url, 120_000);
    expect(buffer.length).toBeGreaterThan(100);
  }, 180_000);

  it('TISS XSD download from ANS portal succeeds', async () => {
    const { downloadFile } = await import('../../scripts/data-sync/shared');
    const url = 'https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-componente-organizacional';
    const buffer = await downloadFile(url, 60_000);
    expect(buffer.length).toBeGreaterThan(100);
  }, 120_000);
});

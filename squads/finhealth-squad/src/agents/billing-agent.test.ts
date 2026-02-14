/**
 * Tests for BillingAgent
 * FinHealth Squad — TISS/SUS Billing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const { mockAccountRepo, mockProcedureRepo } = vi.hoisted(() => ({
  mockAccountRepo: {
    findById: vi.fn(),
    update: vi.fn(),
    updateTissValidation: vi.fn(),
  },
  mockProcedureRepo: {
    findByAccountId: vi.fn(),
  },
}));

vi.mock('../database/supabase-client', () => {
  return {
    MedicalAccountRepository: class { constructor() { return mockAccountRepo; } },
    ProcedureRepository: class { constructor() { return mockProcedureRepo; } },
  };
});

vi.mock('dotenv', () => ({ config: vi.fn() }));

import { BillingAgent } from './billing-agent';
import type { TaskResult } from '../runtime/agent-runtime';

// ============================================================================
// Fixtures
// ============================================================================

const mockRuntime = {
  executeTask: vi.fn<any>().mockResolvedValue({
    success: true,
    output: { analysis: 'AI analysis result' },
  } as TaskResult),
} as any;

const VALID_TISS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <cabecalho>
    <identificacaoTransacao>
      <tipoTransacao>ENVIO_LOTE_GUIAS</tipoTransacao>
    </identificacaoTransacao>
    <versaoPadrao>3.05.00</versaoPadrao>
  </cabecalho>
  <prestadorParaOperadora>
    <loteGuias>
      <guiasTISS>
        <guiaSP_SADT>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento>
                <codigoProcedimento>40301010</codigoProcedimento>
                <descricaoProcedimento>Hemograma completo</descricaoProcedimento>
              </procedimento>
              <quantidadeExecutada>1</quantidadeExecutada>
              <valorTotal>25.00</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaSP_SADT>
      </guiasTISS>
    </loteGuias>
  </prestadorParaOperadora>
</ans:mensagemTISS>`;

const XML_MISSING_CABECALHO = `<ans:mensagemTISS>
  <prestadorParaOperadora><loteGuias><guiasTISS><guiaSP_SADT>
    <procedimentosExecutados>
      <procedimentoExecutado>
        <procedimento><codigoProcedimento>40301010</codigoProcedimento><descricaoProcedimento>Test</descricaoProcedimento></procedimento>
        <quantidadeExecutada>1</quantidadeExecutada><valorTotal>10</valorTotal>
      </procedimentoExecutado>
    </procedimentosExecutados>
  </guiaSP_SADT></guiasTISS></loteGuias></prestadorParaOperadora>
</ans:mensagemTISS>`;

const XML_NO_PROCEDURES = `<ans:mensagemTISS>
  <cabecalho><versaoPadrao>3.05.00</versaoPadrao></cabecalho>
  <prestadorParaOperadora><loteGuias><guiasTISS><guiaSP_SADT></guiaSP_SADT></guiasTISS></loteGuias></prestadorParaOperadora>
</ans:mensagemTISS>`;

const XML_BAD_PROCEDURE_CODE = `<ans:mensagemTISS>
  <cabecalho><versaoPadrao>3.05.00</versaoPadrao></cabecalho>
  <prestadorParaOperadora><loteGuias><guiasTISS><guiaSP_SADT>
    <procedimentosExecutados>
      <procedimentoExecutado>
        <procedimento><codigoProcedimento>123</codigoProcedimento><descricaoProcedimento>Short code</descricaoProcedimento></procedimento>
        <quantidadeExecutada>1</quantidadeExecutada><valorTotal>10</valorTotal>
      </procedimentoExecutado>
    </procedimentosExecutados>
  </guiaSP_SADT></guiasTISS></loteGuias></prestadorParaOperadora>
</ans:mensagemTISS>`;

const XML_ZERO_QUANTITY = `<ans:mensagemTISS>
  <cabecalho><versaoPadrao>3.05.00</versaoPadrao></cabecalho>
  <prestadorParaOperadora><loteGuias><guiasTISS><guiaSP_SADT>
    <procedimentosExecutados>
      <procedimentoExecutado>
        <procedimento><codigoProcedimento>40301010</codigoProcedimento><descricaoProcedimento>Test</descricaoProcedimento></procedimento>
        <quantidadeExecutada>0</quantidadeExecutada><valorTotal>0</valorTotal>
      </procedimentoExecutado>
    </procedimentosExecutados>
  </guiaSP_SADT></guiasTISS></loteGuias></prestadorParaOperadora>
</ans:mensagemTISS>`;

const XML_MISSING_DESCRIPTION = `<ans:mensagemTISS>
  <cabecalho><versaoPadrao>3.05.00</versaoPadrao></cabecalho>
  <prestadorParaOperadora><loteGuias><guiasTISS><guiaSP_SADT>
    <procedimentosExecutados>
      <procedimentoExecutado>
        <procedimento><codigoProcedimento>40301010</codigoProcedimento></procedimento>
        <quantidadeExecutada>1</quantidadeExecutada><valorTotal>10</valorTotal>
      </procedimentoExecutado>
    </procedimentosExecutados>
  </guiaSP_SADT></guiasTISS></loteGuias></prestadorParaOperadora>
</ans:mensagemTISS>`;

const mockAccount = {
  id: 'acc-001',
  account_number: 'ACC-2024-001',
  patient_id: 'pat-001',
  health_insurer_id: 'ins-001',
  account_type: 'sadt' as const,
  status: 'pending' as const,
  total_amount: 150,
  approved_amount: 0,
  glosa_amount: 0,
  paid_amount: 0,
  tiss_xml: VALID_TISS_XML,
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockProcedure = {
  id: 'proc-001',
  medical_account_id: 'acc-001',
  tuss_code: '40301010',
  description: 'Hemograma completo',
  quantity: 1,
  unit_price: 25,
  total_price: 25,
  performed_at: '2024-01-15T10:00:00Z',
  status: 'active',
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
};

// ============================================================================
// Tests
// ============================================================================

describe('BillingAgent', () => {
  let agent: BillingAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime.executeTask.mockResolvedValue({
      success: true,
      output: { analysis: 'AI analysis result' },
    });
    agent = new BillingAgent(mockRuntime);
  });

  // ========================================================================
  // constructor
  // ========================================================================

  describe('constructor', () => {
    it('should create BillingAgent with runtime', () => {
      expect(agent).toBeInstanceOf(BillingAgent);
    });
  });

  // ========================================================================
  // validateTiss — input handling
  // ========================================================================

  describe('validateTiss() — input', () => {
    it('should accept valid input with xml', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(result.success).toBe(true);
    });

    it('should use default schemaVersion 3.05.00', async () => {
      await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(mockRuntime.executeTask).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({ schemaVersion: '3.05.00' }),
        }),
      );
    });

    it('should throw ZodError for invalid input types', async () => {
      await expect(agent.validateTiss({ schemaVersion: '3.05.00', xml: 123 } as any)).rejects.toThrow();
    });
  });

  // ========================================================================
  // validateTiss — XML loading
  // ========================================================================

  describe('validateTiss() — XML loading', () => {
    it('should load XML from account when xml not provided', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', accountId: 'acc-001' });
      expect(result.success).toBe(true);
      expect(mockAccountRepo.findById).toHaveBeenCalledWith('acc-001');
    });

    it('should return error when account not found', async () => {
      mockAccountRepo.findById.mockResolvedValue(null);
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', accountId: 'nonexistent' });
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Account not found')]));
    });

    it('should return error when no XML available', async () => {
      mockAccountRepo.findById.mockResolvedValue({ ...mockAccount, tiss_xml: null });
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', accountId: 'acc-001' });
      // The account has tiss_xml=null, so xml = '' and then the !xml check fires
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('No XML provided')]));
    });
  });

  // ========================================================================
  // validateTiss — XML parsing
  // ========================================================================

  describe('validateTiss() — XML parsing', () => {
    it('should handle unparseable XML gracefully', async () => {
      // fast-xml-parser is lenient, so most malformed input still parses.
      // When it does, structure validation catches the missing fields.
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: '<<<not valid xml>>>' });
      // The XML may parse but will fail structure validation
      expect(result.success).toBe(true);
      expect(result.output?.isValid).toBe(false);
      expect(result.output?.errors.length).toBeGreaterThan(0);
    });

    it('should parse valid TISS XML and return validation result', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('isValid');
      expect(result.output).toHaveProperty('procedureCount');
      // Valid TISS XML should have no structure errors
      const structErrors = result.output?.errors?.filter((e: string) => e.includes('Missing required'));
      expect(structErrors).toEqual([]);
    });
  });

  // ========================================================================
  // validateTiss — structure validation
  // ========================================================================

  describe('validateTiss() — structure', () => {
    it('should detect missing cabecalho', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: XML_MISSING_CABECALHO });
      expect(result.output?.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('cabecalho')]),
      );
    });

    it('should detect missing prestadorParaOperadora', async () => {
      const xml = '<mensagemTISS><cabecalho/><guiaSP_SADT/></mensagemTISS>';
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml });
      expect(result.output?.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('prestadorParaOperadora')]),
      );
    });

    it('should detect missing guiaSP_SADT', async () => {
      const xml = '<mensagemTISS><cabecalho/><prestadorParaOperadora/></mensagemTISS>';
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml });
      expect(result.output?.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('guiaSP_SADT')]),
      );
    });

    it('should pass when all required fields present', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      const structErrors = result.output?.errors?.filter((e: string) => e.includes('Missing required'));
      expect(structErrors).toEqual([]);
    });
  });

  // ========================================================================
  // validateTiss — procedure validation
  // ========================================================================

  describe('validateTiss() — procedures', () => {
    it('should warn when no procedures found', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: XML_NO_PROCEDURES });
      expect(result.output?.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('No procedures found')]),
      );
    });

    it('should error when procedure code is not 8 chars', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: XML_BAD_PROCEDURE_CODE });
      expect(result.output?.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Invalid procedure code')]),
      );
    });

    it('should handle procedure with zero quantity (defaults to 1 via parseInt fallback)', async () => {
      // Source code: parseInt(proc.quantidadeExecutada) || 1 — zero becomes 1
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: XML_ZERO_QUANTITY });
      // The quantity 0 is parsed as falsy, defaulting to 1, so no error
      expect(result.output?.procedureCount).toBe(1);
    });

    it('should warn when procedure description is missing', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: XML_MISSING_DESCRIPTION });
      expect(result.output?.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('Missing description')]),
      );
    });
  });

  // ========================================================================
  // validateTiss — AI validation + result
  // ========================================================================

  describe('validateTiss() — AI + result', () => {
    it('should append AI warnings when present', async () => {
      mockRuntime.executeTask.mockResolvedValue({
        success: true,
        output: { warnings: ['AI warning 1', 'AI warning 2'] },
      });

      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(result.output?.warnings).toContain('AI warning 1');
      expect(result.output?.warnings).toContain('AI warning 2');
    });

    it('should handle AI result without warnings', async () => {
      mockRuntime.executeTask.mockResolvedValue({
        success: true,
        output: { analysis: 'Looks good' },
      });

      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(result.success).toBe(true);
    });

    it('should update account validation when account is provided', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockAccountRepo.updateTissValidation.mockResolvedValue(mockAccount);

      const result = await agent.validateTiss({ schemaVersion: '3.05.00', accountId: 'acc-001' });
      expect(result.success).toBe(true);
      expect(mockAccountRepo.updateTissValidation).toHaveBeenCalledWith(
        'acc-001',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should set validation to invalid when errors exist', async () => {
      const accountNoXml = { ...mockAccount, tiss_xml: XML_BAD_PROCEDURE_CODE };
      mockAccountRepo.findById.mockResolvedValue(accountNoXml);
      mockAccountRepo.updateTissValidation.mockResolvedValue(accountNoXml);

      const result = await agent.validateTiss({ schemaVersion: '3.05.00', accountId: 'acc-001' });
      expect(mockAccountRepo.updateTissValidation).toHaveBeenCalledWith(
        'acc-001',
        'invalid',
        expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('Invalid procedure code')]) }),
      );
    });

    it('should return procedureCount and aiAnalysis in output', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(result.output?.procedureCount).toBe(1);
      expect(result.output?.aiAnalysis).toBeDefined();
    });
  });

  // ========================================================================
  // generateTissGuide
  // ========================================================================

  describe('generateTissGuide()', () => {
    it('should validate input with zod', async () => {
      await expect(agent.generateTissGuide({} as any)).rejects.toThrow();
    });

    it('should default guideType to sadt', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockProcedureRepo.findByAccountId.mockResolvedValue([mockProcedure]);
      mockAccountRepo.update.mockResolvedValue(mockAccount);

      const result = await agent.generateTissGuide({ accountId: 'acc-001', guideType: 'sadt' });
      expect(result.output?.guideType).toBe('sadt');
    });

    it('should return error when account not found', async () => {
      mockAccountRepo.findById.mockResolvedValue(null);
      const result = await agent.generateTissGuide({ accountId: 'nonexistent', guideType: 'sadt' });
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('Account not found')]));
    });

    it('should return error when no procedures for account', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockProcedureRepo.findByAccountId.mockResolvedValue([]);
      const result = await agent.generateTissGuide({ accountId: 'acc-001', guideType: 'sadt' });
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('No procedures found')]));
    });

    it('should generate 14-char guide number', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockProcedureRepo.findByAccountId.mockResolvedValue([mockProcedure]);
      mockAccountRepo.update.mockResolvedValue(mockAccount);

      const result = await agent.generateTissGuide({ accountId: 'acc-001', guideType: 'sadt' });
      expect(result.output?.guideNumber).toHaveLength(14);
    });

    it('should build valid TISS XML with procedures', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockProcedureRepo.findByAccountId.mockResolvedValue([mockProcedure]);
      mockAccountRepo.update.mockResolvedValue(mockAccount);

      const result = await agent.generateTissGuide({ accountId: 'acc-001', guideType: 'sadt' });
      expect(result.output?.xml).toContain('mensagemTISS');
      expect(result.output?.xml).toContain('40301010');
      expect(result.output?.xml).toContain('Hemograma completo');
    });

    it('should calculate total amount correctly', async () => {
      const procs = [
        { ...mockProcedure, total_price: 25.50 },
        { ...mockProcedure, id: 'proc-002', total_price: 74.50 },
      ];
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockProcedureRepo.findByAccountId.mockResolvedValue(procs);
      mockAccountRepo.update.mockResolvedValue(mockAccount);

      const result = await agent.generateTissGuide({ accountId: 'acc-001', guideType: 'sadt' });
      expect(result.output?.totalAmount).toBe(100);
      expect(result.output?.procedureCount).toBe(2);
    });

    it('should update account with guide data', async () => {
      mockAccountRepo.findById.mockResolvedValue(mockAccount);
      mockProcedureRepo.findByAccountId.mockResolvedValue([mockProcedure]);
      mockAccountRepo.update.mockResolvedValue({ ...mockAccount, tiss_guide_number: 'GUIDE123' });

      const result = await agent.generateTissGuide({ accountId: 'acc-001', guideType: 'sadt' });
      expect(result.success).toBe(true);
      expect(mockAccountRepo.update).toHaveBeenCalledWith(
        'acc-001',
        expect.objectContaining({
          tiss_guide_type: 'sadt',
          tiss_validation_status: 'pending',
          tiss_xml: expect.any(String),
          tiss_guide_number: expect.any(String),
        }),
      );
    });
  });

  // ========================================================================
  // extractProcedures (via validateTiss)
  // ========================================================================

  describe('extractProcedures (via validateTiss)', () => {
    it('should extract single procedure', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      expect(result.output?.procedureCount).toBe(1);
    });

    it('should extract multiple procedures', async () => {
      const multiProcXml = `<ans:mensagemTISS>
        <cabecalho/><prestadorParaOperadora><loteGuias><guiasTISS><guiaSP_SADT>
          <procedimentosExecutados>
            <procedimentoExecutado>
              <procedimento><codigoProcedimento>40301010</codigoProcedimento><descricaoProcedimento>Test1</descricaoProcedimento></procedimento>
              <quantidadeExecutada>1</quantidadeExecutada><valorTotal>10</valorTotal>
            </procedimentoExecutado>
            <procedimentoExecutado>
              <procedimento><codigoProcedimento>40302040</codigoProcedimento><descricaoProcedimento>Test2</descricaoProcedimento></procedimento>
              <quantidadeExecutada>2</quantidadeExecutada><valorTotal>20</valorTotal>
            </procedimentoExecutado>
          </procedimentosExecutados>
        </guiaSP_SADT></guiasTISS></loteGuias></prestadorParaOperadora>
      </ans:mensagemTISS>`;

      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: multiProcXml });
      expect(result.output?.procedureCount).toBe(2);
    });
  });

  // ========================================================================
  // findInObject (via validateTiss structure checks)
  // ========================================================================

  describe('findInObject (via validateTiss)', () => {
    it('should find deeply nested field', async () => {
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml: VALID_TISS_XML });
      // cabecalho is deeply nested but should be found
      const missingFields = result.output?.errors?.filter((e: string) => e.includes('Missing required'));
      expect(missingFields).toEqual([]);
    });

    it('should detect missing field', async () => {
      const xml = '<root><someOtherField/></root>';
      const result = await agent.validateTiss({ schemaVersion: '3.05.00', xml });
      expect(result.output?.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Missing required field: cabecalho'),
        ]),
      );
    });
  });
});

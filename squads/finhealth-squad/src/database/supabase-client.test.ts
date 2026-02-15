/**
 * Tests for Supabase Client & Repository Classes
 * FinHealth Squad — Database Layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mock Supabase
// ============================================================================

const mockChain: any = {};
const chainMethods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit'];

for (const m of chainMethods) {
  mockChain[m] = vi.fn().mockReturnValue(mockChain);
}
// Terminal: single() returns a promise
mockChain.single = vi.fn().mockResolvedValue({ data: null, error: null });
// Make the chain itself thenable for non-single queries
mockChain.then = undefined; // reset per-test

function setChainResult(result: { data: any; error: any }, useSingle = true) {
  if (useSingle) {
    mockChain.single.mockResolvedValue(result);
  }
  // For list queries that don't call .single()
  mockChain.then = (resolve: any) => Promise.resolve(result).then(resolve);
}

function resetChain() {
  for (const m of chainMethods) {
    mockChain[m].mockClear().mockReturnValue(mockChain);
  }
  mockChain.single.mockClear().mockResolvedValue({ data: null, error: null });
  mockChain.then = undefined;
}

const mockCreateClient = vi.fn().mockReturnValue(mockChain);

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

// ============================================================================
// Tests
// ============================================================================

describe('supabase-client', () => {
  beforeEach(() => {
    vi.resetModules();
    resetChain();
    mockCreateClient.mockClear().mockReturnValue(mockChain);
    // Default env vars
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
    delete process.env.SUPABASE_ANON_KEY;
  });

  // ========================================================================
  // getSupabaseClient
  // ========================================================================

  describe('getSupabaseClient()', () => {
    it('should throw when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      const { getSupabaseClient } = await import('./supabase-client');
      expect(() => getSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('should throw when both keys are missing', async () => {
      delete process.env.SUPABASE_SERVICE_KEY;
      delete process.env.SUPABASE_ANON_KEY;
      const { getSupabaseClient } = await import('./supabase-client');
      expect(() => getSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('should create client with SUPABASE_SERVICE_KEY', async () => {
      const { getSupabaseClient } = await import('./supabase-client');
      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
        expect.objectContaining({
          auth: { autoRefreshToken: true, persistSession: false },
        }),
      );
    });

    it('should fall back to SUPABASE_ANON_KEY', async () => {
      delete process.env.SUPABASE_SERVICE_KEY;
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      const { getSupabaseClient } = await import('./supabase-client');
      getSupabaseClient();
      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.any(Object),
      );
    });
  });

  // ========================================================================
  // MedicalAccountRepository
  // ========================================================================

  describe('MedicalAccountRepository', () => {
    async function createRepo() {
      const mod = await import('./supabase-client');
      return new mod.MedicalAccountRepository('test-org-id');
    }

    const mockAccount = {
      id: 'acc-001',
      account_number: 'ACC-2024-001',
      status: 'pending',
      total_amount: 150,
      approved_amount: 0,
      glosa_amount: 0,
      paid_amount: 0,
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('findById', () => {
      it('should return account when found', async () => {
        setChainResult({ data: mockAccount, error: null });
        const repo = await createRepo();
        const result = await repo.findById('acc-001');
        expect(result).toEqual(mockAccount);
        expect(mockChain.from).toHaveBeenCalledWith('medical_accounts');
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'acc-001');
      });

      it('should return null when data is null', async () => {
        setChainResult({ data: null, error: null });
        const repo = await createRepo();
        const result = await repo.findById('nonexistent');
        expect(result).toBeNull();
      });

      it('should throw when error is returned', async () => {
        setChainResult({ data: null, error: { message: 'DB error', code: '500' } });
        const repo = await createRepo();
        await expect(repo.findById('acc-001')).rejects.toEqual({ message: 'DB error', code: '500' });
      });
    });

    describe('findByAccountNumber', () => {
      it('should return account when found', async () => {
        setChainResult({ data: mockAccount, error: null });
        const repo = await createRepo();
        const result = await repo.findByAccountNumber('ACC-2024-001');
        expect(result).toEqual(mockAccount);
        expect(mockChain.eq).toHaveBeenCalledWith('account_number', 'ACC-2024-001');
      });

      it('should return null when PGRST116 (not found)', async () => {
        setChainResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
        const repo = await createRepo();
        const result = await repo.findByAccountNumber('NONEXISTENT');
        expect(result).toBeNull();
      });

      it('should throw on other error codes', async () => {
        setChainResult({ data: null, error: { code: '500', message: 'Server error' } });
        const repo = await createRepo();
        await expect(repo.findByAccountNumber('ACC-001')).rejects.toEqual({ code: '500', message: 'Server error' });
      });
    });

    describe('findPendingAccounts', () => {
      it('should return pending accounts', async () => {
        const accounts = [mockAccount];
        setChainResult({ data: accounts, error: null }, false);
        const repo = await createRepo();
        const result = await repo.findPendingAccounts();
        expect(result).toEqual(accounts);
        expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
        expect(mockChain.limit).toHaveBeenCalledWith(100);
      });

      it('should return empty array when data is null', async () => {
        setChainResult({ data: null, error: null }, false);
        const repo = await createRepo();
        const result = await repo.findPendingAccounts();
        expect(result).toEqual([]);
      });

      it('should accept custom limit', async () => {
        setChainResult({ data: [], error: null }, false);
        const repo = await createRepo();
        await repo.findPendingAccounts(50);
        expect(mockChain.limit).toHaveBeenCalledWith(50);
      });
    });

    describe('create', () => {
      it('should insert and return created account', async () => {
        setChainResult({ data: mockAccount, error: null });
        const repo = await createRepo();
        const result = await repo.create(mockAccount as any);
        expect(result).toEqual(mockAccount);
        expect(mockChain.insert).toHaveBeenCalled();
      });

      it('should throw on insert error', async () => {
        setChainResult({ data: null, error: { message: 'Insert failed' } });
        const repo = await createRepo();
        await expect(repo.create(mockAccount as any)).rejects.toEqual({ message: 'Insert failed' });
      });
    });

    describe('update', () => {
      it('should update and return account', async () => {
        const updated = { ...mockAccount, status: 'validated' };
        setChainResult({ data: updated, error: null });
        const repo = await createRepo();
        const result = await repo.update('acc-001', { status: 'validated' } as any);
        expect(result).toEqual(updated);
        expect(mockChain.update).toHaveBeenCalled();
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'acc-001');
      });

      it('should throw on update error', async () => {
        setChainResult({ data: null, error: { message: 'Update failed' } });
        const repo = await createRepo();
        await expect(repo.update('acc-001', {} as any)).rejects.toEqual({ message: 'Update failed' });
      });
    });

    describe('updateTissValidation', () => {
      it('should set status to validated when valid', async () => {
        setChainResult({ data: mockAccount, error: null });
        const repo = await createRepo();
        await repo.updateTissValidation('acc-001', 'valid', { errors: [] });
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          tiss_validation_status: 'valid',
          status: 'validated',
        }));
      });

      it('should set status to pending when invalid', async () => {
        setChainResult({ data: mockAccount, error: null });
        const repo = await createRepo();
        await repo.updateTissValidation('acc-001', 'invalid', { errors: ['err'] });
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          tiss_validation_status: 'invalid',
          status: 'pending',
        }));
      });
    });

    describe('updateAuditScore', () => {
      it('should update audit_score and glosa_risk_score', async () => {
        setChainResult({ data: mockAccount, error: null });
        const repo = await createRepo();
        await repo.updateAuditScore('acc-001', 85, 15, { issues: [] });
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          audit_score: 85,
          glosa_risk_score: 15,
          audit_issues: { issues: [] },
        }));
      });
    });
  });

  // ========================================================================
  // ProcedureRepository
  // ========================================================================

  describe('ProcedureRepository', () => {
    async function createRepo() {
      const mod = await import('./supabase-client');
      return new mod.ProcedureRepository('test-org-id');
    }

    const mockProc = {
      id: 'proc-001',
      medical_account_id: 'acc-001',
      tuss_code: '40301010',
      description: 'Hemograma',
      quantity: 1,
      unit_price: 25,
      total_price: 25,
      status: 'active',
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
    };

    describe('findByAccountId', () => {
      it('should return procedures', async () => {
        setChainResult({ data: [mockProc], error: null }, false);
        const repo = await createRepo();
        const result = await repo.findByAccountId('acc-001');
        expect(result).toEqual([mockProc]);
        expect(mockChain.eq).toHaveBeenCalledWith('medical_account_id', 'acc-001');
      });

      it('should return empty array when no data', async () => {
        setChainResult({ data: null, error: null }, false);
        const repo = await createRepo();
        const result = await repo.findByAccountId('acc-001');
        expect(result).toEqual([]);
      });
    });

    describe('create', () => {
      it('should insert and return procedure', async () => {
        setChainResult({ data: mockProc, error: null });
        const repo = await createRepo();
        const result = await repo.create(mockProc as any);
        expect(result).toEqual(mockProc);
      });

      it('should throw on error', async () => {
        setChainResult({ data: null, error: { message: 'Insert error' } });
        const repo = await createRepo();
        await expect(repo.create(mockProc as any)).rejects.toEqual({ message: 'Insert error' });
      });
    });

    describe('createMany', () => {
      it('should insert multiple procedures', async () => {
        const procs = [mockProc, { ...mockProc, id: 'proc-002' }];
        setChainResult({ data: procs, error: null }, false);
        const repo = await createRepo();
        const result = await repo.createMany([mockProc, mockProc] as any);
        expect(result).toEqual(procs);
      });

      it('should return empty array when data is null', async () => {
        setChainResult({ data: null, error: null }, false);
        const repo = await createRepo();
        const result = await repo.createMany([mockProc] as any);
        expect(result).toEqual([]);
      });
    });
  });

  // ========================================================================
  // GlosaRepository
  // ========================================================================

  describe('GlosaRepository', () => {
    async function createRepo() {
      const mod = await import('./supabase-client');
      return new mod.GlosaRepository('test-org-id');
    }

    const mockGlosa = {
      id: 'glo-001',
      medical_account_id: 'acc-001',
      glosa_code: 'G001',
      original_amount: 100,
      glosa_amount: 20,
      appeal_status: 'pending',
      priority_score: 80,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('findByAccountId', () => {
      it('should return glosas ordered by priority_score desc', async () => {
        setChainResult({ data: [mockGlosa], error: null }, false);
        const repo = await createRepo();
        const result = await repo.findByAccountId('acc-001');
        expect(result).toEqual([mockGlosa]);
        expect(mockChain.order).toHaveBeenCalledWith('priority_score', { ascending: false });
      });

      it('should return empty array when no data', async () => {
        setChainResult({ data: null, error: null }, false);
        const repo = await createRepo();
        const result = await repo.findByAccountId('acc-001');
        expect(result).toEqual([]);
      });
    });

    describe('findPendingAppeals', () => {
      it('should return pending appeals with default limit', async () => {
        setChainResult({ data: [mockGlosa], error: null }, false);
        const repo = await createRepo();
        const result = await repo.findPendingAppeals();
        expect(result).toEqual([mockGlosa]);
        expect(mockChain.eq).toHaveBeenCalledWith('appeal_status', 'pending');
        expect(mockChain.limit).toHaveBeenCalledWith(50);
      });

      it('should accept custom limit', async () => {
        setChainResult({ data: [], error: null }, false);
        const repo = await createRepo();
        await repo.findPendingAppeals(10);
        expect(mockChain.limit).toHaveBeenCalledWith(10);
      });
    });

    describe('create', () => {
      it('should insert and return glosa', async () => {
        setChainResult({ data: mockGlosa, error: null });
        const repo = await createRepo();
        const result = await repo.create(mockGlosa as any);
        expect(result).toEqual(mockGlosa);
      });

      it('should throw on error', async () => {
        setChainResult({ data: null, error: { message: 'Insert error' } });
        const repo = await createRepo();
        await expect(repo.create(mockGlosa as any)).rejects.toEqual({ message: 'Insert error' });
      });
    });

    describe('updateAppeal', () => {
      it('should set appeal_sent_at when status is sent', async () => {
        setChainResult({ data: mockGlosa, error: null });
        const repo = await createRepo();
        await repo.updateAppeal('glo-001', 'Appeal text', 'sent');
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          appeal_text: 'Appeal text',
          appeal_status: 'sent',
          appeal_sent_at: expect.any(String),
        }));
      });

      it('should not set appeal_sent_at when status is not sent', async () => {
        setChainResult({ data: mockGlosa, error: null });
        const repo = await createRepo();
        await repo.updateAppeal('glo-001', 'Appeal text', 'in_progress');
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          appeal_text: 'Appeal text',
          appeal_status: 'in_progress',
          appeal_sent_at: undefined,
        }));
      });
    });
  });

  // ========================================================================
  // PaymentRepository
  // ========================================================================

  describe('PaymentRepository', () => {
    async function createRepo() {
      const mod = await import('./supabase-client');
      return new mod.PaymentRepository('test-org-id');
    }

    const mockPayment = {
      id: 'pay-001',
      health_insurer_id: 'ins-001',
      payment_date: '2024-06-01',
      total_amount: 5000,
      matched_amount: 0,
      unmatched_amount: 5000,
      reconciliation_status: 'pending',
      metadata: {},
      created_at: '2024-06-01T00:00:00Z',
    };

    describe('findById', () => {
      it('should return payment when found', async () => {
        setChainResult({ data: mockPayment, error: null });
        const repo = await createRepo();
        const result = await repo.findById('pay-001');
        expect(result).toEqual(mockPayment);
        expect(mockChain.from).toHaveBeenCalledWith('payments');
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'pay-001');
      });

      it('should throw on error', async () => {
        setChainResult({ data: null, error: { message: 'DB error' } });
        const repo = await createRepo();
        await expect(repo.findById('pay-001')).rejects.toEqual({ message: 'DB error' });
      });
    });

    describe('findByInsurerId', () => {
      it('should return payments for insurer', async () => {
        setChainResult({ data: [mockPayment], error: null }, false);
        const repo = await createRepo();
        const result = await repo.findByInsurerId('ins-001');
        expect(result).toEqual([mockPayment]);
        expect(mockChain.eq).toHaveBeenCalledWith('health_insurer_id', 'ins-001');
      });
    });

    describe('findUnreconciled', () => {
      it('should return unreconciled payments', async () => {
        setChainResult({ data: [mockPayment], error: null }, false);
        const repo = await createRepo();
        const result = await repo.findUnreconciled();
        expect(result).toEqual([mockPayment]);
        expect(mockChain.neq).toHaveBeenCalledWith('reconciliation_status', 'reconciled');
      });
    });

    describe('create', () => {
      it('should insert and return payment', async () => {
        setChainResult({ data: mockPayment, error: null });
        const repo = await createRepo();
        const result = await repo.create(mockPayment as any);
        expect(result).toEqual(mockPayment);
        expect(mockChain.insert).toHaveBeenCalled();
      });
    });

    describe('updateReconciliation', () => {
      it('should update reconciliation status', async () => {
        setChainResult({ data: { ...mockPayment, reconciliation_status: 'reconciled' }, error: null });
        const repo = await createRepo();
        const result = await repo.updateReconciliation('pay-001', 'reconciled', 5000);
        expect(result.reconciliation_status).toBe('reconciled');
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          reconciliation_status: 'reconciled',
          matched_amount: 5000,
        }));
      });
    });
  });

  // ========================================================================
  // HealthInsurerRepository
  // ========================================================================

  describe('HealthInsurerRepository', () => {
    async function createRepo() {
      const mod = await import('./supabase-client');
      return new mod.HealthInsurerRepository();
    }

    const mockInsurer = {
      id: 'ins-001',
      ans_code: '123456',
      name: 'Test Insurer',
      tiss_version: '3.05.00',
      config: {},
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('findById', () => {
      it('should return insurer when found', async () => {
        setChainResult({ data: mockInsurer, error: null });
        const repo = await createRepo();
        const result = await repo.findById('ins-001');
        expect(result).toEqual(mockInsurer);
        expect(mockChain.from).toHaveBeenCalledWith('health_insurers');
      });
    });

    describe('findByAnsCode', () => {
      it('should return insurer by ANS code', async () => {
        setChainResult({ data: mockInsurer, error: null });
        const repo = await createRepo();
        const result = await repo.findByAnsCode('123456');
        expect(result).toEqual(mockInsurer);
        expect(mockChain.eq).toHaveBeenCalledWith('ans_code', '123456');
      });

      it('should return null when PGRST116', async () => {
        setChainResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
        const repo = await createRepo();
        const result = await repo.findByAnsCode('000000');
        expect(result).toBeNull();
      });
    });

    describe('findAll', () => {
      it('should return active insurers', async () => {
        setChainResult({ data: [mockInsurer], error: null }, false);
        const repo = await createRepo();
        const result = await repo.findAll();
        expect(result).toEqual([mockInsurer]);
        expect(mockChain.eq).toHaveBeenCalledWith('active', true);
      });
    });
  });

  // ========================================================================
  // PatientRepository
  // ========================================================================

  describe('PatientRepository', () => {
    async function createRepo() {
      const mod = await import('./supabase-client');
      return new mod.PatientRepository('test-org-id');
    }

    const mockPatient = {
      id: 'pat-001',
      name: 'Maria Silva',
      cpf: '12345678901',
      organization_id: 'test-org-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    describe('findById', () => {
      it('should return patient when found', async () => {
        setChainResult({ data: mockPatient, error: null });
        const repo = await createRepo();
        const result = await repo.findById('pat-001');
        expect(result).toEqual(mockPatient);
        expect(mockChain.from).toHaveBeenCalledWith('patients');
        expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'test-org-id');
      });
    });

    describe('findByCpf', () => {
      it('should return patient by CPF', async () => {
        setChainResult({ data: mockPatient, error: null });
        const repo = await createRepo();
        const result = await repo.findByCpf('12345678901');
        expect(result).toEqual(mockPatient);
        expect(mockChain.eq).toHaveBeenCalledWith('cpf', '12345678901');
      });

      it('should return null when PGRST116', async () => {
        setChainResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
        const repo = await createRepo();
        const result = await repo.findByCpf('00000000000');
        expect(result).toBeNull();
      });
    });

    describe('create', () => {
      it('should insert and return patient', async () => {
        setChainResult({ data: mockPatient, error: null });
        const repo = await createRepo();
        const result = await repo.create(mockPatient as any);
        expect(result).toEqual(mockPatient);
        expect(mockChain.insert).toHaveBeenCalled();
      });
    });

    describe('anonymize', () => {
      it('should anonymize patient PII', async () => {
        mockChain.then = (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve);
        const repo = await createRepo();
        await repo.anonymize('pat-001');
        expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({
          name: expect.stringContaining('Paciente Anonimizado'),
          cpf: null,
          birth_date: null,
          email: null,
        }));
      });
    });
  });
});

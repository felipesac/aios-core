/**
 * Tests for AgentRuntime
 * FinHealth Squad — Execution Engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mocks
// ============================================================================

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('openai', () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
    constructor(_opts: any) {}
  }
  return { default: MockOpenAI };
});

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { AgentRuntime, createRuntime } from './agent-runtime';
import * as fs from 'fs';

// ============================================================================
// Fixtures
// ============================================================================

const AGENT_MD_WITH_YAML = `---
name: billing-agent
role: Billing Specialist
---
# Billing Agent

## Role
Handles TISS billing and validation

## Capabilities
- Validate TISS XML
- Generate guides
- Check procedures

## Commands
### validate-tiss
Validates TISS XML structure

### generate-guide
Generates a TISS guide
`;

const AGENT_MD_SIMPLE = `# Simple Agent

## Role
Simple testing agent

## Capabilities
- Basic testing
`;

const AGENT_MD_NO_YAML_NO_HEADERS = `Just a plain text agent file with no structure`;

// ============================================================================
// Tests
// ============================================================================

describe('AgentRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key-123';
  });

  // ========================================================================
  // Constructor
  // ========================================================================

  describe('constructor', () => {
    it('should create instance with provided API key', () => {
      const runtime = new AgentRuntime({
        squadPath: '/test/squad',
        openaiApiKey: 'custom-key',
      });
      expect(runtime).toBeInstanceOf(AgentRuntime);
    });

    it('should use process.env.OPENAI_API_KEY as fallback', () => {
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      expect(runtime).toBeInstanceOf(AgentRuntime);
    });

    it('should throw when no API key available', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new AgentRuntime({ squadPath: '/test/squad' })).toThrow(
        'OpenAI API key not provided',
      );
    });

    it('should default model to gpt-4o-mini', () => {
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      // Verify via executeTask metadata later
      expect(runtime).toBeInstanceOf(AgentRuntime);
    });
  });

  // ========================================================================
  // initialize
  // ========================================================================

  describe('initialize()', () => {
    it('should throw when agents directory does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      await expect(runtime.initialize()).rejects.toThrow('Agents directory not found');
    });

    it('should load .md files from agents directory', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['billing-agent.md', 'auditor-agent.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_SIMPLE);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      await runtime.initialize();

      expect(runtime.listAgents()).toEqual(['billing-agent', 'auditor-agent']);
      logSpy.mockRestore();
    });

    it('should skip non-.md files', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['agent.md', 'README.txt', '.gitkeep'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_SIMPLE);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      await runtime.initialize();

      expect(runtime.listAgents()).toEqual(['agent']);
      logSpy.mockRestore();
    });

    it('should log agent names when verbose is true', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['billing-agent.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_SIMPLE);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad', verbose: true });
      await runtime.initialize();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Loaded agent: billing-agent'));
      logSpy.mockRestore();
    });
  });

  // ========================================================================
  // loadAgent (tested via initialize)
  // ========================================================================

  describe('loadAgent (via initialize)', () => {
    async function initWithContent(content: string, filename = 'test-agent.md') {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([filename] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(content);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      await runtime.initialize();
      logSpy.mockRestore();
      return runtime;
    }

    it('should parse YAML front matter', async () => {
      const runtime = await initWithContent(AGENT_MD_WITH_YAML, 'billing-agent.md');
      const agent = runtime.getAgent('billing-agent');
      expect(agent?.name).toBe('billing-agent');
      expect(agent?.role).toBe('Billing Specialist');
    });

    it('should parse markdown headers', async () => {
      const runtime = await initWithContent(AGENT_MD_SIMPLE);
      const agent = runtime.getAgent('test-agent');
      expect(agent?.name).toBe('Simple Agent');
      expect(agent?.role).toContain('Simple testing agent');
    });

    it('should extract capabilities from bullet list', async () => {
      const runtime = await initWithContent(AGENT_MD_WITH_YAML, 'billing-agent.md');
      const agent = runtime.getAgent('billing-agent');
      expect(agent?.capabilities).toContain('Validate TISS XML');
      expect(agent?.capabilities).toContain('Generate guides');
      expect(agent?.capabilities).toContain('Check procedures');
    });

    it('should extract commands from ### subheadings', async () => {
      const runtime = await initWithContent(AGENT_MD_WITH_YAML, 'billing-agent.md');
      const agent = runtime.getAgent('billing-agent');
      expect(agent?.commands.length).toBeGreaterThanOrEqual(1);
      expect(agent?.commands[0]).toEqual(
        expect.objectContaining({ name: 'validate-tiss', description: 'Validates TISS XML structure' }),
      );
    });

    it('should fall back to filename when no name in YAML or markdown', async () => {
      const runtime = await initWithContent(AGENT_MD_NO_YAML_NO_HEADERS, 'fallback-agent.md');
      const agent = runtime.getAgent('fallback-agent');
      expect(agent?.name).toBe('fallback-agent');
    });
  });

  // ========================================================================
  // getAgent
  // ========================================================================

  describe('getAgent()', () => {
    async function initRuntime() {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['billing-agent.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_SIMPLE);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      await runtime.initialize();
      logSpy.mockRestore();
      return runtime;
    }

    it('should return agent by ID', async () => {
      const runtime = await initRuntime();
      const agent = runtime.getAgent('billing-agent');
      expect(agent).toBeDefined();
      expect(agent?.name).toBe('Simple Agent');
    });

    it('should strip @ prefix', async () => {
      const runtime = await initRuntime();
      const agent = runtime.getAgent('@billing-agent');
      expect(agent).toBeDefined();
    });

    it('should return undefined for unknown agent', async () => {
      const runtime = await initRuntime();
      const agent = runtime.getAgent('nonexistent');
      expect(agent).toBeUndefined();
    });
  });

  // ========================================================================
  // listAgents
  // ========================================================================

  describe('listAgents()', () => {
    it('should return loaded agent IDs', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['a.md', 'b.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_SIMPLE);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      await runtime.initialize();
      logSpy.mockRestore();

      expect(runtime.listAgents()).toEqual(['a', 'b']);
    });

    it('should return empty array when no agents loaded', () => {
      const runtime = new AgentRuntime({ squadPath: '/test/squad' });
      expect(runtime.listAgents()).toEqual([]);
    });
  });

  // ========================================================================
  // executeTask
  // ========================================================================

  describe('executeTask()', () => {
    async function initRuntime(opts?: Partial<{ verbose: boolean }>) {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['billing-agent.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_WITH_YAML);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = new AgentRuntime({ squadPath: '/test/squad', ...opts });
      await runtime.initialize();
      logSpy.mockRestore();
      return runtime;
    }

    it('should return error when agent not found', async () => {
      const runtime = await initRuntime();
      const result = await runtime.executeTask({
        agentId: 'nonexistent',
        taskName: 'test',
        parameters: {},
      });
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Agent not found: nonexistent');
    });

    it('should call OpenAI with correct parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"success": true, "data": {}}' } }],
        usage: { total_tokens: 100 },
      });

      const runtime = await initRuntime();
      await runtime.executeTask({
        agentId: 'billing-agent',
        taskName: 'validate-tiss',
        parameters: { xml: '<test/>' },
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        }),
      );
    });

    it('should parse JSON response and return success', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"success": true, "data": {"result": 42}}' } }],
        usage: { total_tokens: 150 },
      });

      const runtime = await initRuntime();
      const result = await runtime.executeTask({
        agentId: 'billing-agent',
        taskName: 'test',
        parameters: {},
      });

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ success: true, data: { result: 42 } });
      expect(result.metadata?.tokensUsed).toBe(150);
      expect(result.metadata?.model).toBe('gpt-4o-mini');
    });

    it('should return error when response has no content', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }], usage: {} });

      const runtime = await initRuntime();
      const result = await runtime.executeTask({
        agentId: 'billing-agent',
        taskName: 'test',
        parameters: {},
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No response from OpenAI');
    });

    it('should return error when OpenAI throws', async () => {
      mockCreate.mockRejectedValue(new Error('Rate limit exceeded'));

      const runtime = await initRuntime();
      const result = await runtime.executeTask({
        agentId: 'billing-agent',
        taskName: 'test',
        parameters: {},
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Rate limit exceeded');
      expect(result.metadata?.agent).toBe('billing-agent');
    });

    it('should log execution when verbose', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"success": true}' } }],
        usage: { total_tokens: 50 },
      });

      const runtime = await initRuntime({ verbose: true });

      // Spy AFTER initialization so we only capture executeTask logs
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await runtime.executeTask({
        agentId: 'billing-agent',
        taskName: 'validate-tiss',
        parameters: {},
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing task: validate-tiss'),
      );
      logSpy.mockRestore();
    });
  });

  // ========================================================================
  // createRuntime (factory)
  // ========================================================================

  describe('createRuntime()', () => {
    it('should create and initialize runtime', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['agent.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(AGENT_MD_SIMPLE);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const runtime = await createRuntime({ squadPath: '/test/squad' });
      logSpy.mockRestore();

      expect(runtime).toBeInstanceOf(AgentRuntime);
      expect(runtime.listAgents()).toEqual(['agent']);
    });

    it('should propagate initialization errors', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(
        createRuntime({ squadPath: '/nonexistent' }),
      ).rejects.toThrow('Agents directory not found');
    });
  });
});

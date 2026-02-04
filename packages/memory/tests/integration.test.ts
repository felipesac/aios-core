/**
 * AIOS Memory Layer - Integration Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createMemoryLayer, isMemoryLayerInitialized, MemoryLayer } from '../src/index';
import { ensureDirectoryStructure, getMemoryPaths } from '../src/files/directory';

describe('Memory Layer Integration', () => {
  let testDir: string;
  let memory: MemoryLayer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `aios-memory-integration-${Date.now()}`);
    memory = await createMemoryLayer({
      basePath: testDir,
      enableVectorSearch: false // Disable for tests (no extension)
    });
  });

  afterEach(() => {
    memory.close();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Initialization', () => {
    it('should create directory structure', () => {
      const paths = getMemoryPaths(testDir);

      expect(fs.existsSync(paths.base)).toBe(true);
      expect(fs.existsSync(paths.facts)).toBe(true);
      expect(fs.existsSync(paths.daily)).toBe(true);
      expect(fs.existsSync(paths.persistent)).toBe(true);
      expect(fs.existsSync(paths.sessions)).toBe(true);
    });

    it('should create index.db', () => {
      const paths = getMemoryPaths(testDir);

      expect(fs.existsSync(paths.index)).toBe(true);
    });

    it('should create .gitignore', () => {
      const paths = getMemoryPaths(testDir);

      expect(fs.existsSync(paths.gitignore)).toBe(true);

      const content = fs.readFileSync(paths.gitignore, 'utf-8');
      expect(content).toContain('index.db');
    });

    it('should report as initialized', () => {
      expect(isMemoryLayerInitialized(testDir)).toBe(true);
    });
  });

  describe('Facts Lifecycle', () => {
    it('should add, retrieve, and supersede facts', async () => {
      // Add a fact
      const fact1 = await memory.addFact({
        entity: 'user',
        fact: 'Prefers TypeScript',
        category: 'preference',
        priority: 'high'
      });

      expect(fact1.id).toBeDefined();
      expect(fact1.status).toBe('active');

      // Retrieve facts
      const facts = await memory.getFacts({ entity: 'user' });
      expect(facts.length).toBe(1);
      expect(facts[0].fact).toBe('Prefers TypeScript');

      // Supersede the fact
      const fact2 = await memory.supersedeFact(fact1.id, 'Strongly prefers TypeScript');

      expect(fact2.supersedes).toBe(fact1.id);
      expect(fact2.fact).toBe('Strongly prefers TypeScript');

      // Check superseded status
      const superseded = await memory.getFacts({ status: 'superseded' });
      expect(superseded.length).toBe(1);
    });

    it('should filter facts correctly', async () => {
      await memory.addFact({ entity: 'user', fact: 'Fact 1', category: 'preference', priority: 'high' });
      await memory.addFact({ entity: 'user', fact: 'Fact 2', category: 'context', priority: 'low' });
      await memory.addFact({ entity: 'project', fact: 'Fact 3', category: 'preference', priority: 'high' });

      const userFacts = await memory.getFacts({ entity: 'user' });
      expect(userFacts.length).toBe(2);

      const highPriority = await memory.getFacts({ priority: 'high' });
      expect(highPriority.length).toBe(2);

      const preferences = await memory.getFacts({ category: 'preference' });
      expect(preferences.length).toBe(2);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await memory.addFact({ entity: 'user', fact: 'User prefers TypeScript programming', category: 'preference', priority: 'high' });
      await memory.addFact({ entity: 'user', fact: 'User likes React framework', category: 'preference', priority: 'medium' });
      await memory.addFact({ entity: 'project', fact: 'Project uses SQLite database', category: 'context', priority: 'high' });
    });

    it('should search by keyword', async () => {
      const results = await memory.search('TypeScript');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('TypeScript');
    });

    it('should respect search options', async () => {
      const results = await memory.search('user OR project', { limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Index Statistics', () => {
    it('should report correct statistics', async () => {
      await memory.addFact({ entity: 'user', fact: 'Test 1', category: 'preference', priority: 'high' });
      await memory.addFact({ entity: 'user', fact: 'Test 2', category: 'context', priority: 'low' });

      const stats = await memory.getIndexStats();

      expect(stats.total_memories).toBeGreaterThanOrEqual(2);
      expect(stats.by_type.entity).toBeGreaterThanOrEqual(2);
      expect(stats.by_status.active).toBeGreaterThanOrEqual(2);
      expect(stats.index_size_bytes).toBeGreaterThan(0);
    });
  });

  describe('Index Rebuild', () => {
    it('should rebuild index from files', async () => {
      // Add some facts
      await memory.addFact({ entity: 'user', fact: 'Fact 1', category: 'preference', priority: 'high' });
      await memory.addFact({ entity: 'user', fact: 'Fact 2', category: 'context', priority: 'low' });

      // Rebuild index
      const stats = await memory.rebuildIndex();

      expect(stats.total_memories).toBeGreaterThanOrEqual(2);
      expect(stats.last_rebuild).toBeDefined();
    });

    it('should recover from missing index', async () => {
      // Add a fact
      await memory.addFact({ entity: 'test', fact: 'Test fact', category: 'context', priority: 'medium' });

      // Close and delete index
      memory.close();
      const paths = getMemoryPaths(testDir);
      fs.unlinkSync(paths.index);

      // Recreate memory layer (should auto-rebuild)
      const newMemory = await createMemoryLayer({
        basePath: testDir,
        autoIndex: true,
        enableVectorSearch: false
      });

      // Search should still work
      const results = await newMemory.search('Test');
      expect(results.length).toBeGreaterThan(0);

      newMemory.close();
    });
  });

  describe('Session Traces', () => {
    it('should trace actions', async () => {
      await memory.traceAction({
        agent: 'dev',
        action: 'read',
        target: 'src/index.ts',
        input: 'Reading file',
        output: 'File contents returned'
      });

      // Traces are stored per session, so we can check the file was created
      const paths = getMemoryPaths(testDir);
      const sessionFiles = fs.readdirSync(paths.sessions);

      expect(sessionFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Persistent Memory', () => {
    it('should update and read persistent memory', async () => {
      await memory.updatePersistent('user_preferences', 'Prefers TypeScript');
      await memory.updatePersistent('user_preferences', 'Uses VSCode');
      await memory.updatePersistent('constraints', 'Must work offline');

      const persistent = await memory.getPersistent();

      expect(persistent.user_preferences).toContain('Prefers TypeScript');
      expect(persistent.user_preferences).toContain('Uses VSCode');
      expect(persistent.constraints).toContain('Must work offline');
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent fact additions', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          memory.addFact({
            entity: 'concurrent',
            fact: `Concurrent fact ${i}`,
            category: 'context',
            priority: 'low'
          })
        );
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      expect(new Set(results.map(r => r.id)).size).toBe(10); // All unique IDs

      const facts = await memory.getFacts({ entity: 'concurrent' });
      expect(facts.length).toBe(10);
    });
  });
});

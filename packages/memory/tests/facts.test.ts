/**
 * AIOS Memory Layer - Facts Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { addFact, getFacts, supersedeFact, getFactById } from '../src/files/facts';
import { ensureDirectoryStructure, getMemoryPaths } from '../src/files/directory';

describe('Facts Module', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    testDir = path.join(os.tmpdir(), `aios-memory-test-${Date.now()}`);
    ensureDirectoryStructure(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('addFact', () => {
    it('should add a fact and return it with generated ID', async () => {
      const fact = await addFact({
        entity: 'user',
        fact: 'Prefers TypeScript over JavaScript',
        category: 'preference',
        priority: 'high'
      }, testDir);

      expect(fact.id).toMatch(/^fact-/);
      expect(fact.entity).toBe('user');
      expect(fact.fact).toBe('Prefers TypeScript over JavaScript');
      expect(fact.category).toBe('preference');
      expect(fact.priority).toBe('high');
      expect(fact.status).toBe('active');
      expect(fact.created).toBeDefined();
    });

    it('should persist fact to JSONL file', async () => {
      await addFact({
        entity: 'project',
        fact: 'Uses SQLite for local storage',
        category: 'context',
        priority: 'medium'
      }, testDir);

      const paths = getMemoryPaths(testDir);
      const filePath = path.join(paths.facts, 'entities.jsonl');

      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content.trim());

      expect(parsed.entity).toBe('project');
      expect(parsed.fact).toBe('Uses SQLite for local storage');
    });

    it('should validate required fields', async () => {
      await expect(addFact({
        entity: '',
        fact: 'Test',
        category: 'context',
        priority: 'low'
      }, testDir)).rejects.toThrow('entity');
    });

    it('should validate category values', async () => {
      await expect(addFact({
        entity: 'test',
        fact: 'Test',
        category: 'invalid' as any,
        priority: 'low'
      }, testDir)).rejects.toThrow('category');
    });
  });

  describe('getFacts', () => {
    beforeEach(async () => {
      // Add some test facts
      await addFact({
        entity: 'user',
        fact: 'Fact 1',
        category: 'preference',
        priority: 'high'
      }, testDir);

      await addFact({
        entity: 'user',
        fact: 'Fact 2',
        category: 'context',
        priority: 'low'
      }, testDir);

      await addFact({
        entity: 'project',
        fact: 'Fact 3',
        category: 'decision',
        priority: 'high'
      }, testDir);
    });

    it('should return all facts without filter', async () => {
      const facts = await getFacts(undefined, testDir);
      expect(facts.length).toBe(3);
    });

    it('should filter by entity', async () => {
      const facts = await getFacts({ entity: 'user' }, testDir);
      expect(facts.length).toBe(2);
      expect(facts.every(f => f.entity === 'user')).toBe(true);
    });

    it('should filter by priority', async () => {
      const facts = await getFacts({ priority: 'high' }, testDir);
      expect(facts.length).toBe(2);
      expect(facts.every(f => f.priority === 'high')).toBe(true);
    });

    it('should filter by category', async () => {
      const facts = await getFacts({ category: 'preference' }, testDir);
      expect(facts.length).toBe(1);
      expect(facts[0].category).toBe('preference');
    });

    it('should respect limit', async () => {
      const facts = await getFacts({ limit: 2 }, testDir);
      expect(facts.length).toBe(2);
    });
  });

  describe('supersedeFact', () => {
    it('should supersede a fact and create new one', async () => {
      const original = await addFact({
        entity: 'user',
        fact: 'Original fact',
        category: 'preference',
        priority: 'medium'
      }, testDir);

      const newFact = await supersedeFact(
        original.id,
        'Updated fact content',
        testDir
      );

      expect(newFact.fact).toBe('Updated fact content');
      expect(newFact.supersedes).toBe(original.id);
      expect(newFact.status).toBe('active');

      // Original should be superseded
      const facts = await getFacts({ status: 'superseded' }, testDir);
      expect(facts.length).toBe(1);
      expect(facts[0].id).toBe(original.id);
    });

    it('should throw if fact not found', async () => {
      await expect(supersedeFact(
        'non-existent-id',
        'New content',
        testDir
      )).rejects.toThrow('not found');
    });
  });

  describe('getFactById', () => {
    it('should return fact by ID', async () => {
      const added = await addFact({
        entity: 'test',
        fact: 'Test fact',
        category: 'context',
        priority: 'low'
      }, testDir);

      const found = await getFactById(added.id, testDir);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(added.id);
      expect(found!.fact).toBe('Test fact');
    });

    it('should return null for non-existent ID', async () => {
      const found = await getFactById('non-existent', testDir);
      expect(found).toBeNull();
    });
  });
});

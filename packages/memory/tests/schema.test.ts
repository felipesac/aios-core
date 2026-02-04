/**
 * AIOS Memory Layer - Schema Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createConnection,
  createInMemoryConnection,
  closeConnection,
  ConnectionInfo
} from '../src/db/connection';
import {
  createSchema,
  isSchemaValid,
  getSchemaVersion,
  setMetadata,
  getMetadata,
  dropAllTables,
  getTableCounts
} from '../src/db/schema';
import { ensureDirectoryStructure } from '../src/files/directory';

describe('Schema Module', () => {
  let conn: ConnectionInfo;

  describe('In-Memory Database', () => {
    beforeEach(() => {
      conn = createInMemoryConnection({ enableVectorSearch: false });
    });

    afterEach(() => {
      closeConnection(conn);
    });

    it('should create schema successfully', () => {
      createSchema(conn);

      expect(isSchemaValid(conn.db)).toBe(true);
    });

    it('should set schema version', () => {
      createSchema(conn);

      const version = getSchemaVersion(conn.db);
      expect(version).toBe('1.0.0');
    });

    it('should create all required tables', () => {
      createSchema(conn);

      const tables = conn.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name LIKE 'aios_%'
      `).all() as Array<{ name: string }>;

      const tableNames = tables.map(t => t.name);

      expect(tableNames).toContain('aios_memories');
      expect(tableNames).toContain('aios_memory_relations');
      expect(tableNames).toContain('aios_session_traces');
      expect(tableNames).toContain('aios_metadata');
    });

    it('should create FTS5 virtual table', () => {
      createSchema(conn);

      const fts = conn.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name = 'aios_memories_fts'
      `).all();

      expect(fts.length).toBe(1);
    });

    it('should create indexes', () => {
      createSchema(conn);

      const indexes = conn.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='index' AND name LIKE 'idx_%'
      `).all() as Array<{ name: string }>;

      expect(indexes.length).toBeGreaterThan(5);
    });
  });

  describe('Metadata', () => {
    beforeEach(() => {
      conn = createInMemoryConnection({ enableVectorSearch: false });
      createSchema(conn);
    });

    afterEach(() => {
      closeConnection(conn);
    });

    it('should set and get metadata', () => {
      setMetadata(conn.db, 'test_key', 'test_value');

      const value = getMetadata(conn.db, 'test_key');
      expect(value).toBe('test_value');
    });

    it('should update existing metadata', () => {
      setMetadata(conn.db, 'test_key', 'value1');
      setMetadata(conn.db, 'test_key', 'value2');

      const value = getMetadata(conn.db, 'test_key');
      expect(value).toBe('value2');
    });

    it('should return null for non-existent key', () => {
      const value = getMetadata(conn.db, 'non_existent');
      expect(value).toBeNull();
    });
  });

  describe('Table Operations', () => {
    beforeEach(() => {
      conn = createInMemoryConnection({ enableVectorSearch: false });
      createSchema(conn);
    });

    afterEach(() => {
      closeConnection(conn);
    });

    it('should drop all tables', () => {
      dropAllTables(conn.db);

      expect(isSchemaValid(conn.db)).toBe(false);
    });

    it('should get table counts', () => {
      // Insert some test data
      conn.db.prepare(`
        INSERT INTO aios_memories (id, memory_type, content, source_file, created_at)
        VALUES ('test-1', 'entity', 'Test content', 'test.jsonl', datetime('now'))
      `).run();

      const counts = getTableCounts(conn.db);

      expect(counts.memories).toBe(1);
      expect(counts.relations).toBe(0);
      expect(counts.traces).toBe(0);
    });
  });

  describe('File-Based Database', () => {
    let testDir: string;

    beforeEach(() => {
      testDir = path.join(os.tmpdir(), `aios-memory-schema-test-${Date.now()}`);
      ensureDirectoryStructure(testDir);
      conn = createConnection({ basePath: testDir, enableVectorSearch: false });
    });

    afterEach(() => {
      closeConnection(conn);
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should create database file', () => {
      createSchema(conn);

      const dbPath = path.join(testDir, 'index.db');
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it('should persist data across connections', () => {
      createSchema(conn);

      // Insert data
      conn.db.prepare(`
        INSERT INTO aios_memories (id, memory_type, content, source_file, created_at)
        VALUES ('persist-test', 'entity', 'Persistent content', 'test.jsonl', datetime('now'))
      `).run();

      closeConnection(conn);

      // Reconnect
      const conn2 = createConnection({ basePath: testDir, enableVectorSearch: false });

      const row = conn2.db.prepare(
        'SELECT * FROM aios_memories WHERE id = ?'
      ).get('persist-test') as { content: string };

      expect(row.content).toBe('Persistent content');

      closeConnection(conn2);
    });
  });
});

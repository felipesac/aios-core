/**
 * AIOS Memory Layer - Connection Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createConnection,
  createInMemoryConnection,
  closeConnection,
  databaseExists,
  deleteDatabase,
  getDatabaseSize,
  ConnectionInfo
} from '../src/db/connection';
import { ensureDirectoryStructure, getMemoryPaths } from '../src/files/directory';
import { createSchema } from '../src/db/schema';

describe('Connection Module', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `aios-memory-conn-test-${Date.now()}`);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createConnection', () => {
    it('should create database connection', () => {
      const conn = createConnection({
        basePath: testDir,
        enableVectorSearch: false
      });

      expect(conn.db).toBeDefined();
      expect(conn.vectorSearchEnabled).toBe(false);

      closeConnection(conn);
    });

    it('should create directory structure', () => {
      const conn = createConnection({
        basePath: testDir,
        enableVectorSearch: false
      });

      expect(fs.existsSync(testDir)).toBe(true);

      closeConnection(conn);
    });

    it('should use default config values', () => {
      ensureDirectoryStructure(testDir);
      const conn = createConnection({ basePath: testDir });

      expect(conn.vectorDimensions).toBe(384);

      closeConnection(conn);
    });
  });

  describe('createInMemoryConnection', () => {
    it('should create in-memory database', () => {
      const conn = createInMemoryConnection({ enableVectorSearch: false });

      expect(conn.db).toBeDefined();

      // Verify it's in-memory by checking we can create schema
      createSchema(conn);

      closeConnection(conn);
    });

    it('should use custom vector dimensions', () => {
      const conn = createInMemoryConnection({
        enableVectorSearch: false,
        vectorDimensions: 768
      });

      expect(conn.vectorDimensions).toBe(768);

      closeConnection(conn);
    });
  });

  describe('closeConnection', () => {
    it('should close connection without error', () => {
      const conn = createInMemoryConnection({ enableVectorSearch: false });

      expect(() => closeConnection(conn)).not.toThrow();
    });

    it('should handle closing already closed connection', () => {
      const conn = createInMemoryConnection({ enableVectorSearch: false });
      closeConnection(conn);

      // Second close should not throw (graceful handling)
      expect(() => closeConnection(conn)).not.toThrow();
    });
  });

  describe('databaseExists', () => {
    it('should return false when database does not exist', () => {
      expect(databaseExists(testDir)).toBe(false);
    });

    it('should return true when database exists', () => {
      const conn = createConnection({
        basePath: testDir,
        enableVectorSearch: false
      });
      createSchema(conn);
      closeConnection(conn);

      expect(databaseExists(testDir)).toBe(true);
    });
  });

  describe('deleteDatabase', () => {
    it('should delete database file', () => {
      const conn = createConnection({
        basePath: testDir,
        enableVectorSearch: false
      });
      createSchema(conn);
      closeConnection(conn);

      expect(databaseExists(testDir)).toBe(true);

      deleteDatabase(testDir);

      expect(databaseExists(testDir)).toBe(false);
    });

    it('should handle non-existent database', () => {
      expect(() => deleteDatabase(testDir)).not.toThrow();
    });

    it('should delete WAL files if present', () => {
      const conn = createConnection({
        basePath: testDir,
        enableVectorSearch: false
      });
      createSchema(conn);

      // Force WAL file creation by doing some operations
      conn.db.exec("INSERT INTO aios_metadata (key, value, updated_at) VALUES ('test', 'value', datetime('now'))");

      closeConnection(conn);
      deleteDatabase(testDir);

      const paths = getMemoryPaths(testDir);
      expect(fs.existsSync(paths.index)).toBe(false);
      expect(fs.existsSync(paths.index + '-wal')).toBe(false);
      expect(fs.existsSync(paths.index + '-shm')).toBe(false);
    });
  });

  describe('getDatabaseSize', () => {
    it('should return 0 for non-existent database', () => {
      expect(getDatabaseSize(testDir)).toBe(0);
    });

    it('should return size for existing database', () => {
      const conn = createConnection({
        basePath: testDir,
        enableVectorSearch: false
      });
      createSchema(conn);
      closeConnection(conn);

      const size = getDatabaseSize(testDir);
      expect(size).toBeGreaterThan(0);
    });
  });
});

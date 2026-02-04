/**
 * AIOS Memory Layer - Directory Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getMemoryPaths,
  ensureDirectoryStructure,
  isDirectoryStructureValid,
  getCurrentDateString,
  getDailyNotePath,
  getSessionTracePath,
  listFactFiles,
  listDailyNotes,
  listSessionFiles
} from '../src/files/directory';

describe('Directory Module', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `aios-memory-dir-test-${Date.now()}`);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getMemoryPaths', () => {
    it('should return all required paths', () => {
      const paths = getMemoryPaths(testDir);

      expect(paths.base).toBe(path.resolve(testDir));
      expect(paths.facts).toContain('facts');
      expect(paths.daily).toContain('daily');
      expect(paths.persistent).toContain('persistent');
      expect(paths.sessions).toContain('sessions');
      expect(paths.index).toContain('index.db');
      expect(paths.gitignore).toContain('.gitignore');
    });

    it('should use default path when not specified', () => {
      const paths = getMemoryPaths();

      expect(paths.base).toContain('.aios/memory');
    });
  });

  describe('ensureDirectoryStructure', () => {
    it('should create all directories', () => {
      const paths = ensureDirectoryStructure(testDir);

      expect(fs.existsSync(paths.base)).toBe(true);
      expect(fs.existsSync(paths.facts)).toBe(true);
      expect(fs.existsSync(paths.daily)).toBe(true);
      expect(fs.existsSync(paths.persistent)).toBe(true);
      expect(fs.existsSync(paths.sessions)).toBe(true);
    });

    it('should create .gitignore', () => {
      const paths = ensureDirectoryStructure(testDir);

      expect(fs.existsSync(paths.gitignore)).toBe(true);
      const content = fs.readFileSync(paths.gitignore, 'utf-8');
      expect(content).toContain('index.db');
    });

    it('should create MEMORY.md placeholder', () => {
      const paths = ensureDirectoryStructure(testDir);
      const memoryPath = path.join(paths.persistent, 'MEMORY.md');

      expect(fs.existsSync(memoryPath)).toBe(true);
      const content = fs.readFileSync(memoryPath, 'utf-8');
      expect(content).toContain('# Project Memory');
    });

    it('should not overwrite existing .gitignore', () => {
      const paths = ensureDirectoryStructure(testDir);
      fs.writeFileSync(paths.gitignore, 'custom content', 'utf-8');

      ensureDirectoryStructure(testDir);

      const content = fs.readFileSync(paths.gitignore, 'utf-8');
      expect(content).toBe('custom content');
    });
  });

  describe('isDirectoryStructureValid', () => {
    it('should return true for valid structure', () => {
      ensureDirectoryStructure(testDir);

      expect(isDirectoryStructureValid(testDir)).toBe(true);
    });

    it('should return false for missing directories', () => {
      expect(isDirectoryStructureValid(testDir)).toBe(false);
    });

    it('should return false if a subdirectory is missing', () => {
      ensureDirectoryStructure(testDir);
      const paths = getMemoryPaths(testDir);
      fs.rmSync(paths.facts, { recursive: true });

      expect(isDirectoryStructureValid(testDir)).toBe(false);
    });
  });

  describe('getCurrentDateString', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const dateStr = getCurrentDateString();

      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDailyNotePath', () => {
    it('should return path for today by default', () => {
      const dailyPath = getDailyNotePath(testDir);
      const today = getCurrentDateString();

      expect(dailyPath).toContain(today);
      expect(dailyPath).toContain('.md');
    });

    it('should return path for specified date', () => {
      const dailyPath = getDailyNotePath(testDir, '2026-01-15');

      expect(dailyPath).toContain('2026-01-15.md');
    });
  });

  describe('getSessionTracePath', () => {
    it('should return path for session', () => {
      const sessionPath = getSessionTracePath(testDir, 'session-123');

      expect(sessionPath).toContain('session-123.jsonl');
      expect(sessionPath).toContain('sessions');
    });
  });

  describe('listFactFiles', () => {
    it('should return empty array for non-existent directory', () => {
      const files = listFactFiles(testDir);

      expect(files).toEqual([]);
    });

    it('should list all JSONL files', () => {
      ensureDirectoryStructure(testDir);
      const paths = getMemoryPaths(testDir);

      fs.writeFileSync(path.join(paths.facts, 'entities.jsonl'), '{}', 'utf-8');
      fs.writeFileSync(path.join(paths.facts, 'project.jsonl'), '{}', 'utf-8');
      fs.writeFileSync(path.join(paths.facts, 'ignored.txt'), 'text', 'utf-8');

      const files = listFactFiles(testDir);

      expect(files.length).toBe(2);
      expect(files.every(f => f.endsWith('.jsonl'))).toBe(true);
    });
  });

  describe('listDailyNotes', () => {
    it('should return empty array for non-existent directory', () => {
      const files = listDailyNotes(testDir);

      expect(files).toEqual([]);
    });

    it('should list all MD files sorted by date', () => {
      ensureDirectoryStructure(testDir);
      const paths = getMemoryPaths(testDir);

      fs.writeFileSync(path.join(paths.daily, '2026-02-01.md'), '# Feb 1', 'utf-8');
      fs.writeFileSync(path.join(paths.daily, '2026-01-15.md'), '# Jan 15', 'utf-8');
      fs.writeFileSync(path.join(paths.daily, '2026-02-04.md'), '# Feb 4', 'utf-8');

      const files = listDailyNotes(testDir);

      expect(files.length).toBe(3);
      expect(files[0]).toContain('2026-01-15');
      expect(files[2]).toContain('2026-02-04');
    });
  });

  describe('listSessionFiles', () => {
    it('should return empty array for non-existent directory', () => {
      const files = listSessionFiles(testDir);

      expect(files).toEqual([]);
    });

    it('should list all session JSONL files', () => {
      ensureDirectoryStructure(testDir);
      const paths = getMemoryPaths(testDir);

      fs.writeFileSync(path.join(paths.sessions, 'session-1.jsonl'), '{}', 'utf-8');
      fs.writeFileSync(path.join(paths.sessions, 'session-2.jsonl'), '{}', 'utf-8');

      const files = listSessionFiles(testDir);

      expect(files.length).toBe(2);
      expect(files.every(f => f.endsWith('.jsonl'))).toBe(true);
    });
  });
});

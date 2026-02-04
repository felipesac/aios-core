/**
 * AIOS Memory Layer - Search Tests
 */

import {
  createInMemoryConnection,
  closeConnection,
  ConnectionInfo
} from '../src/db/connection';
import { createSchema } from '../src/db/schema';
import {
  searchFTS,
  searchLike,
  searchVector,
  indexEmbedding,
  getMemoryById,
  getMemoriesByEntity,
  getMemoriesByType,
  getHighPriorityMemories,
  getRecentMemories
} from '../src/db/search';

describe('Search Module', () => {
  let conn: ConnectionInfo;

  beforeEach(() => {
    conn = createInMemoryConnection({ enableVectorSearch: false });
    createSchema(conn);

    // Insert test data
    const insertStmt = conn.db.prepare(`
      INSERT INTO aios_memories (
        id, memory_type, entity, content, category, priority, status,
        source_file, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    insertStmt.run('mem-1', 'entity', 'user', 'User prefers TypeScript programming', 'preference', 'high', 'active', 'test.jsonl');
    insertStmt.run('mem-2', 'entity', 'user', 'User likes JavaScript frameworks', 'preference', 'medium', 'active', 'test.jsonl');
    insertStmt.run('mem-3', 'entity', 'project', 'Project uses SQLite database', 'context', 'high', 'active', 'test.jsonl');
    insertStmt.run('mem-4', 'daily', null, 'Discussed memory architecture today', 'context', 'medium', 'active', 'daily.md');
    insertStmt.run('mem-5', 'entity', 'user', 'Old preference superseded', 'preference', 'low', 'superseded', 'test.jsonl');
  });

  afterEach(() => {
    closeConnection(conn);
  });

  describe('Full-Text Search (FTS5)', () => {
    it('should find memories by content keyword', () => {
      const results = searchFTS(conn.db, 'TypeScript');

      expect(results.length).toBe(1);
      expect(results[0].content).toContain('TypeScript');
    });

    it('should find memories by partial match', () => {
      const results = searchFTS(conn.db, 'prefer*');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by memory_type', () => {
      const results = searchFTS(conn.db, 'memory OR architecture', {
        memory_type: 'daily'
      });

      expect(results.every(r => r.memory_type === 'daily')).toBe(true);
    });

    it('should filter by status (default: active)', () => {
      const results = searchFTS(conn.db, 'preference');

      expect(results.every(r => r.status === 'active')).toBe(true);
    });

    it('should respect limit', () => {
      const results = searchFTS(conn.db, 'user OR project', { limit: 2 });

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array for no matches', () => {
      const results = searchFTS(conn.db, 'nonexistent_term_xyz');

      expect(results.length).toBe(0);
    });
  });

  describe('LIKE Search (Fallback)', () => {
    it('should find memories by content pattern', () => {
      const results = searchLike(conn.db, 'SQLite');

      expect(results.length).toBe(1);
      expect(results[0].content).toContain('SQLite');
    });

    it('should be case-insensitive', () => {
      const results = searchLike(conn.db, 'typescript');

      expect(results.length).toBe(1);
    });

    it('should search in entity field too', () => {
      const results = searchLike(conn.db, 'project');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Query Helpers', () => {
    describe('getMemoryById', () => {
      it('should return memory by ID', () => {
        const memory = getMemoryById(conn.db, 'mem-1');

        expect(memory).not.toBeNull();
        expect(memory!.id).toBe('mem-1');
        expect(memory!.entity).toBe('user');
      });

      it('should return null for non-existent ID', () => {
        const memory = getMemoryById(conn.db, 'non-existent');

        expect(memory).toBeNull();
      });
    });

    describe('getMemoriesByEntity', () => {
      it('should return memories for entity', () => {
        const memories = getMemoriesByEntity(conn.db, 'user');

        expect(memories.length).toBe(2); // Only active ones
        expect(memories.every(m => m.entity === 'user')).toBe(true);
      });

      it('should return empty array for non-existent entity', () => {
        const memories = getMemoriesByEntity(conn.db, 'non-existent');

        expect(memories.length).toBe(0);
      });
    });

    describe('getMemoriesByType', () => {
      it('should return memories by type', () => {
        const memories = getMemoriesByType(conn.db, 'entity');

        expect(memories.length).toBe(3); // Only active entity memories
        expect(memories.every(m => m.memory_type === 'entity')).toBe(true);
      });

      it('should respect limit', () => {
        const memories = getMemoriesByType(conn.db, 'entity', 2);

        expect(memories.length).toBe(2);
      });
    });

    describe('getHighPriorityMemories', () => {
      it('should return high priority memories', () => {
        const memories = getHighPriorityMemories(conn.db);

        expect(memories.length).toBe(2);
        expect(memories.every(m => m.priority === 'high')).toBe(true);
      });
    });

    describe('getRecentMemories', () => {
      it('should return recent active memories', () => {
        const memories = getRecentMemories(conn.db, 3);

        expect(memories.length).toBe(3);
        expect(memories.every(m => m.status === 'active')).toBe(true);
      });

      it('should order by created_at desc', () => {
        const memories = getRecentMemories(conn.db);

        // All should have created_at, most recent first
        for (let i = 1; i < memories.length; i++) {
          expect(memories[i - 1].created_at >= memories[i].created_at).toBe(true);
        }
      });
    });
  });

  describe('Vector Search (sqlite-vec)', () => {
    let vecConn: ConnectionInfo;

    beforeEach(() => {
      vecConn = createInMemoryConnection({ enableVectorSearch: true });
      createSchema(vecConn);

      // Insert test data
      const insertStmt = vecConn.db.prepare(`
        INSERT INTO aios_memories (
          id, memory_type, entity, content, category, priority, status,
          source_file, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      insertStmt.run('vec-1', 'entity', 'user', 'User prefers TypeScript', 'preference', 'high', 'active', 'test.jsonl');
      insertStmt.run('vec-2', 'entity', 'user', 'User likes React', 'preference', 'medium', 'active', 'test.jsonl');
      insertStmt.run('vec-3', 'entity', 'project', 'Project uses Node.js', 'context', 'high', 'active', 'test.jsonl');
    });

    afterEach(() => {
      closeConnection(vecConn);
    });

    it('should index embeddings successfully', () => {
      // Create a 384-dimensional embedding (default dimension)
      const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));

      const result = indexEmbedding(vecConn, 'vec-1', embedding);

      expect(result).toBe(true);
    });

    it('should search by vector similarity', () => {
      // Index some embeddings
      const embedding1 = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));
      const embedding2 = new Array(384).fill(0).map((_, i) => Math.cos(i * 0.1));
      const embedding3 = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.2));

      indexEmbedding(vecConn, 'vec-1', embedding1);
      indexEmbedding(vecConn, 'vec-2', embedding2);
      indexEmbedding(vecConn, 'vec-3', embedding3);

      // Search with similar embedding to vec-1
      const searchEmbedding = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1 + 0.01));
      const results = searchVector(vecConn, searchEmbedding, 3);

      expect(results.length).toBeGreaterThan(0);
      // First result should be most similar to vec-1
      expect(results[0].id).toBe('vec-1');
    });

    it('should return empty array when vector search disabled', () => {
      const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));

      // Use connection without vector search
      const results = searchVector(conn, embedding, 10);

      expect(results).toEqual([]);
    });

    it('should return false when indexing with vector search disabled', () => {
      const embedding = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));

      // Use connection without vector search
      const result = indexEmbedding(conn, 'mem-1', embedding);

      expect(result).toBe(false);
    });

    it('should handle multiple embeddings for same memory (upsert)', () => {
      const embedding1 = new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1));
      const embedding2 = new Array(384).fill(0).map((_, i) => Math.cos(i * 0.1));

      // Index twice - should update, not fail
      const result1 = indexEmbedding(vecConn, 'vec-1', embedding1);
      const result2 = indexEmbedding(vecConn, 'vec-1', embedding2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should respect limit in vector search', () => {
      // Index embeddings for all memories
      const embeddings = [
        new Array(384).fill(0).map((_, i) => Math.sin(i * 0.1)),
        new Array(384).fill(0).map((_, i) => Math.cos(i * 0.1)),
        new Array(384).fill(0).map((_, i) => Math.sin(i * 0.2))
      ];

      indexEmbedding(vecConn, 'vec-1', embeddings[0]);
      indexEmbedding(vecConn, 'vec-2', embeddings[1]);
      indexEmbedding(vecConn, 'vec-3', embeddings[2]);

      // Search with limit of 2
      const searchEmbedding = new Array(384).fill(0.5);
      const results = searchVector(vecConn, searchEmbedding, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});

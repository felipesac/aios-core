/**
 * AIOS Memory Layer - Search Functions
 *
 * Full-text search (FTS5) and vector similarity search.
 */

import Database from 'better-sqlite3';
import { Memory, SearchResult, SearchOptions, MemoryType, FactStatus } from '../types';
import { ConnectionInfo } from './connection';

// =============================================================================
// Full-Text Search (FTS5)
// =============================================================================

/**
 * Search memories using FTS5 full-text search.
 */
export function searchFTS(
  db: Database.Database,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    limit = 20,
    memory_type,
    status = 'active'
  } = options;

  // Build the query with optional filters
  let sql = `
    SELECT
      m.*,
      bm25(aios_memories_fts) as score
    FROM aios_memories_fts fts
    JOIN aios_memories m ON fts.rowid = m.rowid
    WHERE aios_memories_fts MATCH ?
  `;

  const params: (string | number)[] = [query];

  if (memory_type) {
    sql += ' AND m.memory_type = ?';
    params.push(memory_type);
  }

  if (status) {
    sql += ' AND m.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY score LIMIT ?';
  params.push(limit);

  try {
    const rows = db.prepare(sql).all(...params) as Array<Memory & { score: number }>;

    return rows.map(row => ({
      ...row,
      score: Math.abs(row.score) // BM25 returns negative scores
    }));
  } catch (error) {
    // If FTS query fails (e.g., syntax error), return empty
    console.warn('FTS search error:', error);
    return [];
  }
}

/**
 * Search memories using LIKE pattern matching (fallback).
 */
export function searchLike(
  db: Database.Database,
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    limit = 20,
    memory_type,
    status = 'active'
  } = options;

  let sql = `
    SELECT * FROM aios_memories
    WHERE (content LIKE ? OR entity LIKE ?)
  `;

  const likePattern = `%${query}%`;
  const params: (string | number)[] = [likePattern, likePattern];

  if (memory_type) {
    sql += ' AND memory_type = ?';
    params.push(memory_type);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as Memory[];

  return rows.map(row => ({
    ...row,
    score: 1 // No real score for LIKE
  }));
}

// =============================================================================
// Vector Similarity Search
// =============================================================================

/**
 * Search memories using vector similarity (requires sqlite-vec).
 */
export function searchVector(
  conn: ConnectionInfo,
  embedding: number[],
  limit: number = 10
): SearchResult[] {
  const { db, vectorSearchEnabled } = conn;

  if (!vectorSearchEnabled) {
    console.warn('Vector search not available. sqlite-vec not loaded.');
    return [];
  }

  try {
    // Query the vector index
    const sql = `
      SELECT
        v.memory_id,
        v.distance,
        m.*
      FROM aios_memories_vec v
      JOIN aios_memories m ON m.id = v.memory_id
      WHERE v.embedding MATCH ?
        AND k = ?
      ORDER BY v.distance
    `;

    // Convert embedding array to the format expected by sqlite-vec
    const embeddingBlob = Buffer.from(new Float32Array(embedding).buffer);

    const rows = db.prepare(sql).all(embeddingBlob, limit) as Array<Memory & { distance: number }>;

    return rows.map(row => ({
      ...row,
      score: 1 - row.distance // Convert distance to similarity score
    }));
  } catch (error) {
    console.warn('Vector search error:', error);
    return [];
  }
}

/**
 * Add embedding to vector index.
 */
export function indexEmbedding(
  conn: ConnectionInfo,
  memoryId: string,
  embedding: number[]
): boolean {
  const { db, vectorSearchEnabled } = conn;

  if (!vectorSearchEnabled) {
    return false;
  }

  try {
    const embeddingBlob = Buffer.from(new Float32Array(embedding).buffer);

    // Virtual tables don't support UPSERT, so use DELETE + INSERT
    db.prepare('DELETE FROM aios_memories_vec WHERE memory_id = ?').run(memoryId);
    db.prepare('INSERT INTO aios_memories_vec (memory_id, embedding) VALUES (?, ?)').run(memoryId, embeddingBlob);

    return true;
  } catch (error) {
    console.warn('Failed to index embedding:', error);
    return false;
  }
}

// =============================================================================
// Query Helpers
// =============================================================================

/**
 * Get a memory by ID.
 */
export function getMemoryById(db: Database.Database, id: string): Memory | null {
  const row = db.prepare('SELECT * FROM aios_memories WHERE id = ?').get(id) as Memory | undefined;
  return row || null;
}

/**
 * Get memories by entity.
 */
export function getMemoriesByEntity(
  db: Database.Database,
  entity: string,
  status: FactStatus = 'active'
): Memory[] {
  return db.prepare(`
    SELECT * FROM aios_memories
    WHERE entity = ? AND status = ?
    ORDER BY created_at DESC
  `).all(entity, status) as Memory[];
}

/**
 * Get memories by type.
 */
export function getMemoriesByType(
  db: Database.Database,
  memoryType: MemoryType,
  limit: number = 100
): Memory[] {
  return db.prepare(`
    SELECT * FROM aios_memories
    WHERE memory_type = ? AND status = 'active'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(memoryType, limit) as Memory[];
}

/**
 * Get high-priority memories.
 */
export function getHighPriorityMemories(
  db: Database.Database,
  limit: number = 50
): Memory[] {
  return db.prepare(`
    SELECT * FROM aios_memories
    WHERE priority = 'high' AND status = 'active'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as Memory[];
}

/**
 * Get recent memories.
 */
export function getRecentMemories(
  db: Database.Database,
  limit: number = 20
): Memory[] {
  return db.prepare(`
    SELECT * FROM aios_memories
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as Memory[];
}

/**
 * Get related memories.
 */
export function getRelatedMemories(
  db: Database.Database,
  memoryId: string
): Array<Memory & { relation_type: string; confidence: number }> {
  return db.prepare(`
    SELECT m.*, r.relation_type, r.confidence
    FROM aios_memory_relations r
    JOIN aios_memories m ON m.id = r.target_id
    WHERE r.source_id = ?
    ORDER BY r.confidence DESC
  `).all(memoryId) as Array<Memory & { relation_type: string; confidence: number }>;
}

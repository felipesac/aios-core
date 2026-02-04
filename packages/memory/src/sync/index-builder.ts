/**
 * AIOS Memory Layer - Index Builder
 *
 * Rebuilds SQLite index from source JSON/MD files.
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { ConnectionInfo } from '../db/connection';
import { createSchema, dropAllTables, setMetadata } from '../db/schema';
import {
  getMemoryPaths,
  listFactFiles,
  listDailyNotes,
  listSessionFiles
} from '../files/directory';
import { Fact, SessionTrace, IndexStats, MemoryType } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface RebuildProgress {
  phase: 'init' | 'facts' | 'daily' | 'sessions' | 'complete';
  filesProcessed: number;
  totalFiles: number;
  recordsIndexed: number;
  errors: string[];
}

export type ProgressCallback = (progress: RebuildProgress) => void;

// =============================================================================
// ID Generation
// =============================================================================

function generateMemoryId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mem-${timestamp}-${random}`;
}

function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `trace-${timestamp}-${random}`;
}

// =============================================================================
// JSONL Parsing
// =============================================================================

function parseJsonlFile<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  const results: T[] = [];
  for (const line of lines) {
    try {
      results.push(JSON.parse(line) as T);
    } catch {
      // Skip invalid lines
    }
  }

  return results;
}

// =============================================================================
// Markdown Parsing
// =============================================================================

interface DailyNoteExtraction {
  date: string;
  sessions: Array<{
    session_id: string;
    content: string;
  }>;
}

function parseDailyNote(filePath: string): DailyNoteExtraction | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath, '.md');

  // Extract date from filename (YYYY-MM-DD.md)
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (!dateMatch) {
    return null;
  }

  const date = dateMatch[1];

  // Parse sessions from markdown
  const sessions: Array<{ session_id: string; content: string }> = [];

  // Simple parsing: look for ## Session: {id} headers
  const sessionRegex = /^## Session:\s*(\S+)/gm;
  const parts = content.split(/^## Session:/gm);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const firstLine = part.split('\n')[0];
    const sessionId = firstLine.trim().split(/\s/)[0];
    const sessionContent = part.substring(firstLine.length).trim();

    if (sessionId) {
      sessions.push({
        session_id: sessionId,
        content: sessionContent
      });
    }
  }

  return { date, sessions };
}

// =============================================================================
// Index Building
// =============================================================================

/**
 * Index facts from JSONL files into the database.
 */
function indexFacts(
  db: Database.Database,
  basePath: string,
  onProgress?: ProgressCallback
): { filesProcessed: number; recordsIndexed: number; errors: string[] } {
  const factFiles = listFactFiles(basePath);
  let recordsIndexed = 0;
  const errors: string[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO aios_memories (
      id, memory_type, entity, content, category, priority, status,
      source_file, source_session, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertRelation = db.prepare(`
    INSERT INTO aios_memory_relations (id, source_id, target_id, relation_type, confidence, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Map to track fact IDs for relations
  const factIdMap = new Map<string, string>();

  for (let i = 0; i < factFiles.length; i++) {
    const filePath = factFiles[i];
    const relativeFile = path.relative(basePath, filePath);

    try {
      const facts = parseJsonlFile<Fact>(filePath);

      for (const fact of facts) {
        const memoryId = generateMemoryId();

        insertStmt.run(
          memoryId,
          'entity',
          fact.entity,
          fact.fact,
          fact.category,
          fact.priority,
          fact.status,
          relativeFile,
          fact.source_session || null,
          fact.created,
          fact.updated || null
        );

        factIdMap.set(fact.id, memoryId);
        recordsIndexed++;
      }

      // Second pass: create relations for superseded facts
      for (const fact of facts) {
        if (fact.supersedes && factIdMap.has(fact.supersedes)) {
          const sourceId = factIdMap.get(fact.id);
          const targetId = factIdMap.get(fact.supersedes);

          if (sourceId && targetId) {
            insertRelation.run(
              generateMemoryId(),
              sourceId,
              targetId,
              'supersedes',
              1.0,
              new Date().toISOString()
            );
          }
        }
      }
    } catch (error) {
      errors.push(`Error processing ${relativeFile}: ${error}`);
    }

    if (onProgress) {
      onProgress({
        phase: 'facts',
        filesProcessed: i + 1,
        totalFiles: factFiles.length,
        recordsIndexed,
        errors
      });
    }
  }

  return { filesProcessed: factFiles.length, recordsIndexed, errors };
}

/**
 * Index daily notes from markdown files into the database.
 */
function indexDailyNotes(
  db: Database.Database,
  basePath: string,
  onProgress?: ProgressCallback
): { filesProcessed: number; recordsIndexed: number; errors: string[] } {
  const dailyFiles = listDailyNotes(basePath);
  let recordsIndexed = 0;
  const errors: string[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO aios_memories (
      id, memory_type, entity, content, category, priority, status,
      source_file, source_session, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < dailyFiles.length; i++) {
    const filePath = dailyFiles[i];
    const relativeFile = path.relative(basePath, filePath);

    try {
      const note = parseDailyNote(filePath);
      if (!note) continue;

      for (const session of note.sessions) {
        if (session.content.trim()) {
          insertStmt.run(
            generateMemoryId(),
            'daily',
            null, // No specific entity for daily notes
            session.content,
            'context',
            'medium',
            'active',
            relativeFile,
            session.session_id,
            `${note.date}T00:00:00Z`,
            null
          );
          recordsIndexed++;
        }
      }
    } catch (error) {
      errors.push(`Error processing ${relativeFile}: ${error}`);
    }

    if (onProgress) {
      onProgress({
        phase: 'daily',
        filesProcessed: i + 1,
        totalFiles: dailyFiles.length,
        recordsIndexed,
        errors
      });
    }
  }

  return { filesProcessed: dailyFiles.length, recordsIndexed, errors };
}

/**
 * Index session traces from JSONL files into the database.
 */
function indexSessionTraces(
  db: Database.Database,
  basePath: string,
  onProgress?: ProgressCallback
): { filesProcessed: number; recordsIndexed: number; errors: string[] } {
  const sessionFiles = listSessionFiles(basePath);
  let recordsIndexed = 0;
  const errors: string[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO aios_session_traces (
      id, session_id, agent_id, action, target, input_summary, output_summary,
      tools_called, cost_usd, user_feedback, source_file, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < sessionFiles.length; i++) {
    const filePath = sessionFiles[i];
    const relativeFile = path.relative(basePath, filePath);

    // Extract session ID from filename
    const sessionId = path.basename(filePath, '.jsonl');

    try {
      const traces = parseJsonlFile<SessionTrace>(filePath);

      for (const trace of traces) {
        insertStmt.run(
          generateTraceId(),
          sessionId,
          trace.agent,
          trace.action,
          trace.target || null,
          trace.input || null,
          trace.output || null,
          trace.tools_called ? JSON.stringify(trace.tools_called) : null,
          trace.cost_usd || null,
          trace.user_feedback ?? null,
          relativeFile,
          trace.ts
        );
        recordsIndexed++;
      }
    } catch (error) {
      errors.push(`Error processing ${relativeFile}: ${error}`);
    }

    if (onProgress) {
      onProgress({
        phase: 'sessions',
        filesProcessed: i + 1,
        totalFiles: sessionFiles.length,
        recordsIndexed,
        errors
      });
    }
  }

  return { filesProcessed: sessionFiles.length, recordsIndexed, errors };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Rebuild the entire index from source files.
 */
export function rebuildIndex(
  conn: ConnectionInfo,
  basePath: string = '.aios/memory',
  onProgress?: ProgressCallback
): IndexStats {
  const { db, vectorSearchEnabled, vectorDimensions } = conn;

  const startTime = Date.now();
  let totalRecords = 0;
  const allErrors: string[] = [];

  // Initialize progress
  if (onProgress) {
    onProgress({
      phase: 'init',
      filesProcessed: 0,
      totalFiles: 0,
      recordsIndexed: 0,
      errors: []
    });
  }

  // Drop existing tables and recreate schema
  dropAllTables(db);
  createSchema(conn);

  // Index facts
  const factsResult = indexFacts(db, basePath, onProgress);
  totalRecords += factsResult.recordsIndexed;
  allErrors.push(...factsResult.errors);

  // Index daily notes
  const dailyResult = indexDailyNotes(db, basePath, onProgress);
  totalRecords += dailyResult.recordsIndexed;
  allErrors.push(...dailyResult.errors);

  // Index session traces
  const tracesResult = indexSessionTraces(db, basePath, onProgress);
  allErrors.push(...tracesResult.errors);

  // Update metadata
  const now = new Date().toISOString();
  setMetadata(db, 'last_rebuild', now);
  setMetadata(db, 'rebuild_duration_ms', (Date.now() - startTime).toString());

  if (allErrors.length > 0) {
    setMetadata(db, 'rebuild_errors', JSON.stringify(allErrors));
  }

  // Complete progress
  if (onProgress) {
    onProgress({
      phase: 'complete',
      filesProcessed: factsResult.filesProcessed + dailyResult.filesProcessed + tracesResult.filesProcessed,
      totalFiles: factsResult.filesProcessed + dailyResult.filesProcessed + tracesResult.filesProcessed,
      recordsIndexed: totalRecords,
      errors: allErrors
    });
  }

  // Return stats
  return getIndexStats(conn, basePath);
}

/**
 * Get current index statistics.
 */
export function getIndexStats(conn: ConnectionInfo, basePath: string = '.aios/memory'): IndexStats {
  const { db } = conn;
  const paths = getMemoryPaths(basePath);

  // Count by type
  const byType: Record<MemoryType, number> = {
    entity: 0,
    daily: 0,
    persistent: 0
  };

  const typeRows = db.prepare(`
    SELECT memory_type, COUNT(*) as count FROM aios_memories GROUP BY memory_type
  `).all() as Array<{ memory_type: MemoryType; count: number }>;

  for (const row of typeRows) {
    byType[row.memory_type] = row.count;
  }

  // Count by status
  const byStatus: Record<string, number> = {
    active: 0,
    superseded: 0,
    archived: 0
  };

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count FROM aios_memories GROUP BY status
  `).all() as Array<{ status: string; count: number }>;

  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  // Total counts
  const totalMemories = (db.prepare('SELECT COUNT(*) as count FROM aios_memories').get() as { count: number }).count;
  const totalRelations = (db.prepare('SELECT COUNT(*) as count FROM aios_memory_relations').get() as { count: number }).count;
  const totalTraces = (db.prepare('SELECT COUNT(*) as count FROM aios_session_traces').get() as { count: number }).count;

  // Last rebuild time
  const lastRebuildRow = db.prepare(
    'SELECT value FROM aios_metadata WHERE key = ?'
  ).get('last_rebuild') as { value: string } | undefined;

  // Index file size
  let indexSize = 0;
  try {
    if (fs.existsSync(paths.index)) {
      indexSize = fs.statSync(paths.index).size;
    }
  } catch {
    // Ignore errors
  }

  return {
    total_memories: totalMemories,
    by_type: byType,
    by_status: byStatus as Record<'active' | 'superseded' | 'archived', number>,
    total_relations: totalRelations,
    total_traces: totalTraces,
    last_rebuild: lastRebuildRow?.value || null,
    index_size_bytes: indexSize
  };
}

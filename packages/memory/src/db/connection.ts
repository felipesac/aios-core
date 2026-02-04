/**
 * AIOS Memory Layer - SQLite Connection
 *
 * Handles SQLite database connection with sqlite-vec extension support.
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import { MemoryLayerConfig } from '../types';
import { getMemoryPaths, ensureDirectoryStructure } from '../files/directory';

// =============================================================================
// Types
// =============================================================================

export interface ConnectionInfo {
  db: Database.Database;
  vectorSearchEnabled: boolean;
  vectorDimensions: number;
}

// =============================================================================
// Extension Loading
// =============================================================================

/**
 * Try to load sqlite-vec extension.
 * Returns true if successful, false otherwise.
 */
function tryLoadSqliteVec(db: Database.Database): boolean {
  try {
    // Try to load sqlite-vec extension
    // The extension path varies by platform
    const sqliteVec = require('sqlite-vec');
    sqliteVec.load(db);
    return true;
  } catch (error) {
    // sqlite-vec not available - vector search will be disabled
    console.warn('sqlite-vec extension not available. Vector search disabled.');
    return false;
  }
}

// =============================================================================
// Connection Factory
// =============================================================================

/**
 * Create a new database connection with optional sqlite-vec support.
 */
export function createConnection(config: MemoryLayerConfig = {}): ConnectionInfo {
  const {
    basePath = '.aios/memory',
    enableVectorSearch = true,
    vectorDimensions = 384
  } = config;

  // Ensure directory structure exists
  ensureDirectoryStructure(basePath);

  const paths = getMemoryPaths(basePath);
  const dbPath = paths.index;

  // Create database connection
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Try to load sqlite-vec if enabled
  let vectorSearchEnabled = false;
  if (enableVectorSearch) {
    vectorSearchEnabled = tryLoadSqliteVec(db);
  }

  return {
    db,
    vectorSearchEnabled,
    vectorDimensions
  };
}

/**
 * Create an in-memory database connection (for testing).
 */
export function createInMemoryConnection(config: Partial<MemoryLayerConfig> = {}): ConnectionInfo {
  const {
    enableVectorSearch = true,
    vectorDimensions = 384
  } = config;

  const db = new Database(':memory:');

  db.pragma('foreign_keys = ON');

  let vectorSearchEnabled = false;
  if (enableVectorSearch) {
    vectorSearchEnabled = tryLoadSqliteVec(db);
  }

  return {
    db,
    vectorSearchEnabled,
    vectorDimensions
  };
}

/**
 * Close a database connection safely.
 */
export function closeConnection(conn: ConnectionInfo): void {
  try {
    conn.db.close();
  } catch (error) {
    console.warn('Error closing database connection:', error);
  }
}

/**
 * Check if a database file exists.
 */
export function databaseExists(basePath: string = '.aios/memory'): boolean {
  const paths = getMemoryPaths(basePath);
  const fs = require('fs');
  return fs.existsSync(paths.index);
}

/**
 * Delete the database file (for rebuild).
 */
export function deleteDatabase(basePath: string = '.aios/memory'): void {
  const paths = getMemoryPaths(basePath);
  const fs = require('fs');

  // Delete main database file
  if (fs.existsSync(paths.index)) {
    fs.unlinkSync(paths.index);
  }

  // Delete WAL files if they exist
  const walPath = paths.index + '-wal';
  const shmPath = paths.index + '-shm';

  if (fs.existsSync(walPath)) {
    fs.unlinkSync(walPath);
  }
  if (fs.existsSync(shmPath)) {
    fs.unlinkSync(shmPath);
  }
}

/**
 * Get database file size in bytes.
 */
export function getDatabaseSize(basePath: string = '.aios/memory'): number {
  const paths = getMemoryPaths(basePath);
  const fs = require('fs');

  if (!fs.existsSync(paths.index)) {
    return 0;
  }

  const stats = fs.statSync(paths.index);
  return stats.size;
}

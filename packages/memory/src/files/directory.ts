/**
 * AIOS Memory Layer - Directory Management
 *
 * Handles creation and management of the memory directory structure.
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_BASE_PATH = '.aios/memory';

const DIRECTORY_STRUCTURE = {
  facts: 'facts',
  daily: 'daily',
  persistent: 'persistent',
  sessions: 'sessions'
} as const;

const GITIGNORE_CONTENT = `# AIOS Memory Layer
# Track source files, ignore derived index

# Ignore SQLite index (can be rebuilt from files)
index.db
index.db-shm
index.db-wal

# Track everything else
!facts/
!daily/
!persistent/
!sessions/
`;

// =============================================================================
// Types
// =============================================================================

export interface MemoryPaths {
  base: string;
  facts: string;
  daily: string;
  persistent: string;
  sessions: string;
  index: string;
  gitignore: string;
}

// =============================================================================
// Functions
// =============================================================================

/**
 * Get all memory-related paths based on a base directory.
 */
export function getMemoryPaths(basePath: string = DEFAULT_BASE_PATH): MemoryPaths {
  const resolvedBase = path.resolve(basePath);

  return {
    base: resolvedBase,
    facts: path.join(resolvedBase, DIRECTORY_STRUCTURE.facts),
    daily: path.join(resolvedBase, DIRECTORY_STRUCTURE.daily),
    persistent: path.join(resolvedBase, DIRECTORY_STRUCTURE.persistent),
    sessions: path.join(resolvedBase, DIRECTORY_STRUCTURE.sessions),
    index: path.join(resolvedBase, 'index.db'),
    gitignore: path.join(resolvedBase, '.gitignore')
  };
}

/**
 * Ensure the complete memory directory structure exists.
 * Creates directories and .gitignore if missing.
 *
 * @returns The paths object for the created structure
 */
export function ensureDirectoryStructure(basePath: string = DEFAULT_BASE_PATH): MemoryPaths {
  const paths = getMemoryPaths(basePath);

  // Create all directories
  const directories = [
    paths.base,
    paths.facts,
    paths.daily,
    paths.persistent,
    paths.sessions
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Create .gitignore if it doesn't exist
  if (!fs.existsSync(paths.gitignore)) {
    fs.writeFileSync(paths.gitignore, GITIGNORE_CONTENT, 'utf-8');
  }

  // Create MEMORY.md placeholder if it doesn't exist
  const memoryMdPath = path.join(paths.persistent, 'MEMORY.md');
  if (!fs.existsSync(memoryMdPath)) {
    const memoryMdContent = `# Project Memory

## User Preferences
*No preferences recorded yet.*

## Architectural Decisions
*No decisions recorded yet.*

## Learned Patterns
*No patterns recorded yet.*

## Constraints
*No constraints recorded yet.*
`;
    fs.writeFileSync(memoryMdPath, memoryMdContent, 'utf-8');
  }

  return paths;
}

/**
 * Check if the memory directory structure exists and is valid.
 */
export function isDirectoryStructureValid(basePath: string = DEFAULT_BASE_PATH): boolean {
  const paths = getMemoryPaths(basePath);

  const requiredDirs = [
    paths.base,
    paths.facts,
    paths.daily,
    paths.persistent,
    paths.sessions
  ];

  return requiredDirs.every(dir => {
    try {
      return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * Get the current date in YYYY-MM-DD format.
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the path for today's daily note.
 */
export function getDailyNotePath(basePath: string = DEFAULT_BASE_PATH, date?: string): string {
  const paths = getMemoryPaths(basePath);
  const dateStr = date || getCurrentDateString();
  return path.join(paths.daily, `${dateStr}.md`);
}

/**
 * Get the path for a session trace file.
 */
export function getSessionTracePath(basePath: string = DEFAULT_BASE_PATH, sessionId: string): string {
  const paths = getMemoryPaths(basePath);
  return path.join(paths.sessions, `${sessionId}.jsonl`);
}

/**
 * List all fact files in the facts directory.
 */
export function listFactFiles(basePath: string = DEFAULT_BASE_PATH): string[] {
  const paths = getMemoryPaths(basePath);

  if (!fs.existsSync(paths.facts)) {
    return [];
  }

  return fs.readdirSync(paths.facts)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => path.join(paths.facts, file));
}

/**
 * List all daily note files.
 */
export function listDailyNotes(basePath: string = DEFAULT_BASE_PATH): string[] {
  const paths = getMemoryPaths(basePath);

  if (!fs.existsSync(paths.daily)) {
    return [];
  }

  return fs.readdirSync(paths.daily)
    .filter(file => file.endsWith('.md'))
    .sort() // Sort by date (YYYY-MM-DD format sorts correctly)
    .map(file => path.join(paths.daily, file));
}

/**
 * List all session trace files.
 */
export function listSessionFiles(basePath: string = DEFAULT_BASE_PATH): string[] {
  const paths = getMemoryPaths(basePath);

  if (!fs.existsSync(paths.sessions)) {
    return [];
  }

  return fs.readdirSync(paths.sessions)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => path.join(paths.sessions, file));
}

/**
 * AIOS Memory Layer - Fact File Operations
 *
 * Handles JSONL file operations for facts (Layer 1: Entity Knowledge).
 */

import * as fs from 'fs';
import * as path from 'path';
import { Fact, FactInput, FactFilter, FactCategory, Priority, FactStatus } from '../types';
import { getMemoryPaths, ensureDirectoryStructure } from './directory';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_FACTS_FILE = 'entities.jsonl';
let factCounter = 0;

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generate a unique fact ID.
 */
function generateFactId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  factCounter++;
  return `fact-${timestamp}-${random}-${factCounter}`;
}

// =============================================================================
// File Locking (Simple Implementation)
// =============================================================================

const lockFiles = new Map<string, boolean>();

async function acquireLock(filePath: string, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  while (lockFiles.get(filePath)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Lock timeout for file: ${filePath}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  lockFiles.set(filePath, true);
}

function releaseLock(filePath: string): void {
  lockFiles.delete(filePath);
}

// =============================================================================
// Validation
// =============================================================================

const VALID_CATEGORIES: FactCategory[] = ['preference', 'context', 'decision', 'learning', 'constraint'];
const VALID_PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const VALID_STATUSES: FactStatus[] = ['active', 'superseded', 'archived'];

function validateFact(fact: Partial<Fact>): void {
  if (!fact.entity || typeof fact.entity !== 'string') {
    throw new Error('Fact must have a valid entity string');
  }

  if (!fact.fact || typeof fact.fact !== 'string') {
    throw new Error('Fact must have a valid fact string');
  }

  if (!fact.category || !VALID_CATEGORIES.includes(fact.category)) {
    throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!fact.priority || !VALID_PRIORITIES.includes(fact.priority)) {
    throw new Error(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
}

function validateFactStatus(status: string): status is FactStatus {
  return VALID_STATUSES.includes(status as FactStatus);
}

// =============================================================================
// JSONL Operations
// =============================================================================

/**
 * Append a fact to a JSONL file.
 */
async function appendToJsonl(filePath: string, fact: Fact): Promise<void> {
  await acquireLock(filePath);

  try {
    const line = JSON.stringify(fact) + '\n';

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(filePath, line, 'utf-8');
  } finally {
    releaseLock(filePath);
  }
}

/**
 * Read all facts from a JSONL file.
 */
function readFromJsonl(filePath: string): Fact[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  return lines.map((line, index) => {
    try {
      return JSON.parse(line) as Fact;
    } catch (error) {
      console.warn(`Invalid JSON at line ${index + 1} in ${filePath}`);
      return null;
    }
  }).filter((fact): fact is Fact => fact !== null);
}

/**
 * Read facts from all JSONL files in the facts directory.
 */
function readAllFacts(basePath: string): Fact[] {
  const paths = getMemoryPaths(basePath);

  if (!fs.existsSync(paths.facts)) {
    return [];
  }

  const files = fs.readdirSync(paths.facts)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => path.join(paths.facts, file));

  const allFacts: Fact[] = [];
  for (const file of files) {
    allFacts.push(...readFromJsonl(file));
  }

  return allFacts;
}

/**
 * Update a fact in place by rewriting the file.
 */
async function updateFactInFile(filePath: string, factId: string, updates: Partial<Fact>): Promise<Fact | null> {
  await acquireLock(filePath);

  try {
    const facts = readFromJsonl(filePath);
    let updatedFact: Fact | null = null;

    const updatedFacts = facts.map(fact => {
      if (fact.id === factId) {
        updatedFact = {
          ...fact,
          ...updates,
          updated: new Date().toISOString()
        };
        return updatedFact;
      }
      return fact;
    });

    if (updatedFact) {
      const content = updatedFacts.map(f => JSON.stringify(f)).join('\n') + '\n';
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    return updatedFact;
  } finally {
    releaseLock(filePath);
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Add a new fact to the facts store.
 */
export async function addFact(input: FactInput, basePath: string = '.aios/memory'): Promise<Fact> {
  // Validate input
  validateFact(input);

  // Ensure directory structure
  ensureDirectoryStructure(basePath);

  const paths = getMemoryPaths(basePath);
  const filePath = path.join(paths.facts, DEFAULT_FACTS_FILE);

  const fact: Fact = {
    id: generateFactId(),
    entity: input.entity,
    fact: input.fact,
    category: input.category,
    priority: input.priority,
    status: 'active',
    supersedes: input.supersedes,
    source_session: input.source_session,
    created: new Date().toISOString()
  };

  await appendToJsonl(filePath, fact);

  return fact;
}

/**
 * Get facts with optional filtering.
 */
export async function getFacts(filter?: FactFilter, basePath: string = '.aios/memory'): Promise<Fact[]> {
  let facts = readAllFacts(basePath);

  if (filter) {
    if (filter.entity) {
      facts = facts.filter(f => f.entity === filter.entity);
    }
    if (filter.category) {
      facts = facts.filter(f => f.category === filter.category);
    }
    if (filter.priority) {
      facts = facts.filter(f => f.priority === filter.priority);
    }
    if (filter.status) {
      facts = facts.filter(f => f.status === filter.status);
    }
    if (filter.limit && filter.limit > 0) {
      facts = facts.slice(0, filter.limit);
    }
  }

  return facts;
}

/**
 * Get a single fact by ID.
 */
export async function getFactById(factId: string, basePath: string = '.aios/memory'): Promise<Fact | null> {
  const facts = readAllFacts(basePath);
  return facts.find(f => f.id === factId) || null;
}

/**
 * Supersede an existing fact with a new one.
 * Marks the old fact as 'superseded' and creates a new fact.
 */
export async function supersedeFact(
  oldFactId: string,
  newFactContent: string,
  basePath: string = '.aios/memory'
): Promise<Fact> {
  // Find the old fact
  const oldFact = await getFactById(oldFactId, basePath);
  if (!oldFact) {
    throw new Error(`Fact not found: ${oldFactId}`);
  }

  const paths = getMemoryPaths(basePath);

  // Find which file contains the old fact and update it
  const files = fs.readdirSync(paths.facts)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => path.join(paths.facts, file));

  for (const file of files) {
    const updated = await updateFactInFile(file, oldFactId, { status: 'superseded' });
    if (updated) break;
  }

  // Create the new fact
  const newFact = await addFact({
    entity: oldFact.entity,
    fact: newFactContent,
    category: oldFact.category,
    priority: oldFact.priority,
    supersedes: oldFactId,
    source_session: oldFact.source_session
  }, basePath);

  return newFact;
}

/**
 * Archive a fact (soft delete).
 */
export async function archiveFact(factId: string, basePath: string = '.aios/memory'): Promise<boolean> {
  const paths = getMemoryPaths(basePath);

  const files = fs.readdirSync(paths.facts)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => path.join(paths.facts, file));

  for (const file of files) {
    const updated = await updateFactInFile(file, factId, { status: 'archived' });
    if (updated) return true;
  }

  return false;
}

/**
 * Get facts by entity.
 */
export async function getFactsByEntity(entity: string, basePath: string = '.aios/memory'): Promise<Fact[]> {
  return getFacts({ entity, status: 'active' }, basePath);
}

/**
 * Get high-priority active facts.
 */
export async function getHighPriorityFacts(basePath: string = '.aios/memory'): Promise<Fact[]> {
  return getFacts({ priority: 'high', status: 'active' }, basePath);
}

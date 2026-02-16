/**
 * Data Sync — Shared Utilities
 * FinHealth Squad
 *
 * Common functions used by all sync scripts: HTTP download, ZIP extraction,
 * JSON file I/O, and metadata builder.
 */

import axios from 'axios';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 90_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

// ============================================================================
// HTTP Download
// ============================================================================

/**
 * Download a file from URL with retry logic.
 * Returns the response data as a Buffer.
 */
export async function downloadFile(
  url: string,
  timeout: number = DEFAULT_TIMEOUT,
): Promise<Buffer> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        headers: {
          'User-Agent': 'FinHealth-Squad/1.0 (data-sync)',
        },
      });
      return Buffer.from(response.data);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`  Attempt ${attempt}/${MAX_RETRIES} failed for ${url}: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`Failed to download ${url} after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

// ============================================================================
// ZIP Extraction
// ============================================================================

/**
 * Extract all files from a ZIP buffer.
 * Returns an array of { name, buffer } for each entry.
 */
export function extractZip(buffer: Buffer): Array<{ name: string; buffer: Buffer }> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  return entries
    .filter(entry => !entry.isDirectory)
    .map(entry => ({
      name: entry.entryName,
      buffer: entry.getData(),
    }));
}

// ============================================================================
// JSON File I/O
// ============================================================================

/**
 * Load existing JSON data file safely. Returns null if file doesn't exist.
 */
export function loadExistingData<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Write data to a JSON file with formatted output.
 */
export function writeDataFile(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ============================================================================
// Metadata Builder
// ============================================================================

export interface DataFileMeta {
  description: string;
  source: string;
  version: string;
  last_update: string;
  procedure_count?: number;
  note?: string;
}

/**
 * Build a standard `_meta` block for data files.
 */
export function buildMeta(
  description: string,
  source: string,
  count: number,
  note?: string,
): DataFileMeta {
  return {
    description,
    source,
    version: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    last_update: new Date().toISOString(),
    procedure_count: count,
    ...(note ? { note } : {}),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resolve the data directory path (relative to squad root).
 */
export function getDataDir(): string {
  return path.resolve(__dirname, '../../data');
}

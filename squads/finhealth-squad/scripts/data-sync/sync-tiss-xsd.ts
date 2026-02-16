/**
 * TISS XSD Schema Sync
 * FinHealth Squad — Data Sync Pipeline
 *
 * Downloads official TISS XSD schemas and saves to data/tiss-schemas/.
 *
 * Strategy:
 *   1. Try ANS official portal ZIP packages (gov.br/ans, ans.gov.br)
 *   2. Fallback: individual XSD files from GitHub (dudanogueira/tiss)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { downloadFile, extractZip, writeDataFile, getDataDir } from './shared';

// ============================================================================
// Sources
// ============================================================================

/**
 * ANS publishes TISS schemas as ZIP packages. URLs vary across
 * gov.br/ans and ans.gov.br domains.
 */
const ANS_TISS_SCHEMA_ZIPS = [
  'https://www.ans.gov.br/arquivos/extras/tiss/Padrao_TISS_Representacao_de_Conceitos_em_Saude_202505.zip',
  'https://www.ans.gov.br/arquivos/extras/tiss/Padrao_TISS_Representacao_de_Conceitos_em_Saude_202501.zip',
];

/**
 * Fallback: individual XSD files from dudanogueira/tiss GitHub repo.
 * Uses GitHub API raw content endpoint for reliable downloads.
 * These are the official ANS schemas republished for developer access.
 */
const GITHUB_API_BASE = 'https://api.github.com/repos/dudanogueira/tiss/contents/tiss/xsd/';

const TISS_XSD_FILES = [
  'tissV3_03_01.xsd',
  'tissGuiasV3_03_01.xsd',
  'tissComplexTypesV3_03_01.xsd',
  'tissSimpleTypesV3_03_01.xsd',
  'tissWebServicesV3_03_01.xsd',
  'tissMonitoramentoV3_03_01.xsd',
  'tissMonitoramentoQualidadeV3_03_01.xsd',
  'tissAssinaturaDigital_v1.01.xsd',
  'xmldsig-core-schema.xsd',
];

// ============================================================================
// Schema manifest
// ============================================================================

interface SchemaManifestEntry {
  filename: string;
  sha256: string;
  sizeBytes: number;
}

interface SchemaManifest {
  version: string;
  source: string;
  downloaded_at: string;
  schemas: SchemaManifestEntry[];
}

function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// ============================================================================
// Download strategies
// ============================================================================

async function tryAnsZipDownload(): Promise<Array<{ name: string; buffer: Buffer }>> {
  for (const url of ANS_TISS_SCHEMA_ZIPS) {
    try {
      console.log(`  [TISS-XSD] Trying ANS ZIP: ${url}`);
      const zipBuffer = await downloadFile(url, 120_000);

      const files = extractZip(zipBuffer);
      const xsdFiles = files.filter(f =>
        f.name.toLowerCase().endsWith('.xsd') &&
        !f.name.startsWith('__MACOSX'),
      );

      if (xsdFiles.length > 0) {
        console.log(`  [TISS-XSD] Found ${xsdFiles.length} XSD files`);
        return xsdFiles;
      }

      // Try nested ZIPs
      for (const nested of files.filter(f => f.name.toLowerCase().endsWith('.zip'))) {
        try {
          const innerFiles = extractZip(nested.buffer);
          const innerXsd = innerFiles.filter(f =>
            f.name.toLowerCase().endsWith('.xsd') &&
            !f.name.startsWith('__MACOSX'),
          );
          if (innerXsd.length > 0) {
            console.log(`  [TISS-XSD] Found ${innerXsd.length} XSD files in nested ZIP`);
            return innerXsd;
          }
        } catch {
          // Not a valid ZIP
        }
      }
    } catch (err) {
      console.warn(`  [TISS-XSD] ANS ZIP failed: ${err}`);
    }
  }
  throw new Error('ANS ZIP sources failed');
}

async function tryGitHubIndividualDownload(): Promise<Array<{ name: string; buffer: Buffer }>> {
  console.log('  [TISS-XSD] Trying GitHub individual XSD downloads...');
  const results: Array<{ name: string; buffer: Buffer }> = [];

  for (const filename of TISS_XSD_FILES) {
    try {
      const url = GITHUB_API_BASE + filename;
      const buffer = await downloadFile(url, 30_000);

      // GitHub API with raw accept header returns the file content directly
      // but downloadFile uses arraybuffer, so we may get JSON or raw content
      let content: Buffer;
      try {
        const parsed = JSON.parse(buffer.toString('utf-8'));
        if (parsed.content) {
          content = Buffer.from(parsed.content, parsed.encoding || 'base64');
        } else {
          content = buffer;
        }
      } catch {
        content = buffer;
      }

      results.push({ name: filename, buffer: content });
      console.log(`  [TISS-XSD] Downloaded: ${filename} (${content.length} bytes)`);
    } catch (err) {
      console.warn(`  [TISS-XSD] Failed to download ${filename}: ${err}`);
    }
  }

  if (results.length < 3) {
    throw new Error(`Only ${results.length} XSD files downloaded, need at least 3`);
  }

  return results;
}

// ============================================================================
// Main sync
// ============================================================================

export async function syncTissXsd(): Promise<void> {
  const dataDir = getDataDir();
  const schemasDir = path.join(dataDir, 'tiss-schemas');

  console.log('[TISS-XSD] Starting TISS XSD schema sync...');

  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true });
  }

  let xsdFiles: Array<{ name: string; buffer: Buffer }>;

  // Strategy 1: ANS ZIP
  try {
    xsdFiles = await tryAnsZipDownload();
  } catch {
    // Strategy 2: GitHub individual files
    xsdFiles = await tryGitHubIndividualDownload();
  }

  // Remove old .gitkeep if it exists
  const gitkeepPath = path.join(schemasDir, '.gitkeep');
  if (fs.existsSync(gitkeepPath)) {
    fs.unlinkSync(gitkeepPath);
  }

  // Write XSD files and build manifest
  const manifestEntries: SchemaManifestEntry[] = [];

  for (const file of xsdFiles) {
    const filename = path.basename(file.name);
    const outPath = path.join(schemasDir, filename);

    fs.writeFileSync(outPath, file.buffer);

    manifestEntries.push({
      filename,
      sha256: computeSha256(file.buffer),
      sizeBytes: file.buffer.length,
    });
  }

  const manifest: SchemaManifest = {
    version: detectVersion(xsdFiles.map(f => f.name)),
    source: 'ANS - Agência Nacional de Saúde Suplementar (gov.br/ans)',
    downloaded_at: new Date().toISOString(),
    schemas: manifestEntries.sort((a, b) => a.filename.localeCompare(b.filename)),
  };

  writeDataFile(path.join(schemasDir, 'manifest.json'), manifest);

  console.log(`[TISS-XSD] Done — wrote ${xsdFiles.length} XSD files + manifest.json`);
}

function detectVersion(filenames: string[]): string {
  for (const name of filenames) {
    const match = name.match(/tiss[Vv]?(\d+)[_.](\d+)[_.](\d+)/i);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}`;
    }
  }
  return 'unknown';
}

// ============================================================================
// CLI entry point
// ============================================================================

if (require.main === module) {
  syncTissXsd().catch(err => {
    console.error('[TISS-XSD] Fatal error:', err);
    process.exit(1);
  });
}

/**
 * GET /api/squads — List Available Squads
 *
 * Returns all locally installed squads with their agents, tasks, and workflows.
 */

import { NextResponse } from 'next/server';
import { getSquadLoader } from '@/lib/orchestration-bridge';
import type { SquadInfo, SquadManifest } from '@/lib/orchestration-bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const loader = getSquadLoader();
    const squads: SquadInfo[] = await loader.listLocal();

    const results = [];

    for (const squad of squads) {
      try {
        const manifest: SquadManifest = await loader.loadManifest(squad.path);

        results.push({
          name: squad.name,
          version: manifest.version || '0.0.0',
          description: manifest.description || '',
          slashPrefix: manifest.slashPrefix || squad.name.replace(/-squad$/, ''),
          agents: (manifest.components?.agents || []).map(
            (f: string) => f.replace('.md', ''),
          ),
          tasks: (manifest.components?.tasks || []).map(
            (f: string) => f.replace('.md', ''),
          ),
          workflows: (manifest.components?.workflows || []).map(
            (f: string) => f.replace('.yaml', '').replace('.yml', ''),
          ),
          tags: manifest.tags || [],
        });
      } catch (error) {
        results.push({
          name: squad.name,
          error: `Failed to load manifest: ${error instanceof Error ? error.message : 'Unknown'}`,
        });
      }
    }

    return NextResponse.json({
      squads: results,
      count: results.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /squads] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list squads',
        message: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 },
    );
  }
}

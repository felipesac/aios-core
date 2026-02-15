/**
 * GET /api/agents — List All Available Agents
 *
 * Returns core agents and squad agents registered through AgentInvoker.
 * Squad agents are auto-discovered from local squads directory.
 */

import { NextResponse } from 'next/server';
import { getAgentInvoker } from '@/lib/orchestration-bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const invoker = await getAgentInvoker();

    // Core agents
    const coreAgents = invoker.getSupportedAgents();
    const coreList = Object.entries(coreAgents).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ([name, config]: [string, any]) => ({
        name,
        displayName: config.displayName,
        capabilities: config.capabilities,
        type: 'core' as const,
      }),
    );

    // Squad agents (auto-discovered via loadSquads)
    const squadAgents: Map<string, Record<string, unknown>> = invoker.getSquadAgents();
    const squadList = Array.from(squadAgents.entries()).map(
      ([name, config]) => ({
        name,
        displayName: config.displayName as string,
        squadName: config.squadName as string,
        squadAgentId: config.squadAgentId as string,
        capabilities: config.capabilities as string[],
        type: 'squad' as const,
      }),
    );

    // Invocation summary (audit data)
    const summary = invoker.getInvocationSummary();

    return NextResponse.json({
      agents: [...coreList, ...squadList],
      coreCount: coreList.length,
      squadCount: squadList.length,
      totalCount: coreList.length + squadList.length,
      invocationSummary: summary,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /agents] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list agents',
        message: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 },
    );
  }
}

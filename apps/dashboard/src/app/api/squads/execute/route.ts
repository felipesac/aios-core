/**
 * POST /api/squads/execute — Execute Squad Agent Task
 *
 * Bridges HTTP requests to SquadExecutor for squad agent task execution.
 * Communicates with squad entry.ts via stdin/stdout JSON protocol.
 */

import { NextResponse } from 'next/server';
import { getSquadExecutor } from '@/lib/orchestration-bridge';
import {
  validateKebabCase,
  validateParameters,
  validateRequired,
  collectErrors,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long-running tasks

interface ExecuteSquadRequest {
  squadName: string;
  agentId: string;
  taskName: string;
  parameters?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    let body: ExecuteSquadRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    // Validate inputs
    const errors = collectErrors(
      validateRequired(body.squadName, 'squadName'),
      validateKebabCase(body.squadName, 'squadName'),
      validateRequired(body.agentId, 'agentId'),
      validateKebabCase(body.agentId, 'agentId'),
      validateRequired(body.taskName, 'taskName'),
      validateKebabCase(body.taskName, 'taskName'),
      validateParameters(body.parameters, 'parameters'),
      validateParameters(body.context, 'context'),
    );

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 },
      );
    }

    const executor = getSquadExecutor();

    // Verify squad has entry point
    const hasEntry = await executor.hasEntryPoint(body.squadName);
    if (!hasEntry) {
      return NextResponse.json(
        { error: `Squad "${body.squadName}" has no entry point (src/entry.ts)` },
        { status: 404 },
      );
    }

    const result = await executor.executeSquadTask(
      body.squadName,
      body.agentId,
      body.taskName,
      body.parameters || {},
      body.context || {},
    );

    return NextResponse.json({
      ...result,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /squads/execute] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Squad execution failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 },
    );
  }
}

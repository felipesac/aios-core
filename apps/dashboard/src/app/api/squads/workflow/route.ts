/**
 * POST /api/squads/workflow — Execute Squad Workflow
 *
 * Bridges HTTP requests to SquadExecutor for workflow pipeline execution.
 * The squad entry point detects workflow mode when workflowName is present.
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
export const maxDuration = 300; // 5 minutes for long-running workflows

interface WorkflowRequest {
  squadName: string;
  workflowName: string;
  parameters?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    let body: WorkflowRequest;
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
      validateRequired(body.workflowName, 'workflowName'),
      validateKebabCase(body.workflowName, 'workflowName'),
      validateParameters(body.parameters, 'parameters'),
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

    const result = await executor.executeWorkflow(
      body.squadName,
      body.workflowName,
      body.parameters || {},
    );

    return NextResponse.json({
      ...result,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /squads/workflow] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 },
    );
  }
}

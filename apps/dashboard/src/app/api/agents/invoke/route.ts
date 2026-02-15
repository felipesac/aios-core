/**
 * POST /api/agents/invoke — Invoke Agent
 *
 * Invokes any registered agent (core or squad) through the unified
 * AgentInvoker interface. Squad agents are automatically routed
 * to SquadExecutor for child process execution.
 */

import { NextResponse } from 'next/server';
import { getAgentInvoker } from '@/lib/orchestration-bridge';
import {
  validateRequired,
  validateAgentName,
  validateTaskPath,
  validateParameters,
  collectErrors,
} from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long-running tasks

interface InvokeAgentRequest {
  agentName: string;
  taskPath: string;
  inputs?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    let body: InvokeAgentRequest;
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
      validateRequired(body.agentName, 'agentName'),
      validateAgentName(body.agentName),
      validateRequired(body.taskPath, 'taskPath'),
      validateTaskPath(body.taskPath),
      validateParameters(body.inputs, 'inputs'),
    );

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 },
      );
    }

    const invoker = await getAgentInvoker();

    // Verify agent is registered
    if (!invoker.isAgentSupported(body.agentName)) {
      return NextResponse.json(
        { error: `Agent "${body.agentName}" is not registered` },
        { status: 404 },
      );
    }

    const result = await invoker.invokeAgent(
      body.agentName,
      body.taskPath,
      body.inputs || {},
    );

    const statusCode = result.success ? 200 : 422;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error('[API /agents/invoke] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Agent invocation failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      },
      { status: 500 },
    );
  }
}

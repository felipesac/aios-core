/**
 * FinHealth Squad - Main Entry Point
 * Healthcare Financial AI Module
 */

// Database
export * from './database/supabase-client';

// Runtime
export * from './runtime/agent-runtime';

// Agents
export * from './agents/billing-agent';

// Parsers
export * from './parsers/tiss-xml-parser';
export * from './parsers/payment-xml-parser';

// Validators
export * from './validators/tiss-validator';

// Pipeline
export { PipelineExecutor } from './pipeline/pipeline-executor';
export type {
  WorkflowDefinition,
  WorkflowStep,
  StepResult,
  PipelineResult,
  PipelineContext,
  PipelineMetadata,
} from './pipeline/types';

// Re-export types
export type {
  Patient,
  HealthInsurer,
  MedicalAccount,
  Procedure,
  Glosa,
  Payment,
} from './database/supabase-client';

export type {
  AgentDefinition,
  AgentCommand,
  TaskInput,
  TaskResult,
  RuntimeConfig,
} from './runtime/agent-runtime';

/**
 * Template Manager
 * FinHealth Squad — Template Rendering Orchestrator
 *
 * Factory/orchestrator that dispatches rendering to the appropriate renderer.
 * Provides a unified API for all template rendering operations.
 */

import type {
  TemplateType,
  OutputFormat,
  RenderResult,
  AppealRenderInput,
  ReportRenderInput,
  TemplateManagerDeps,
} from './types';
import {
  renderAppeal,
  createDefaultDateProvider,
  createDefaultIdGenerator,
} from './appeal-renderer';
import { renderReport } from './report-renderer';

// ============================================================================
// Template Manager
// ============================================================================

export class TemplateManager {
  private deps: TemplateManagerDeps;

  constructor(deps?: Partial<TemplateManagerDeps>) {
    this.deps = {
      dateProvider: deps?.dateProvider || createDefaultDateProvider(),
      idGenerator: deps?.idGenerator || createDefaultIdGenerator(),
    };
  }

  renderAppeal(input: AppealRenderInput, format: OutputFormat = 'markdown'): RenderResult {
    return renderAppeal(input, format, {
      dateProvider: this.deps.dateProvider,
      idGenerator: this.deps.idGenerator,
    });
  }

  renderReport(input: ReportRenderInput, format: OutputFormat = 'markdown'): RenderResult {
    return renderReport(input, format, {
      dateProvider: this.deps.dateProvider,
      idGenerator: this.deps.idGenerator,
    });
  }

  render(
    type: TemplateType,
    input: AppealRenderInput | ReportRenderInput,
    format: OutputFormat = 'markdown',
  ): RenderResult {
    switch (type) {
      case 'appeal':
        return this.renderAppeal(input as AppealRenderInput, format);
      case 'report':
        return this.renderReport(input as ReportRenderInput, format);
      default:
        throw new Error(`Unknown template type: ${type}`);
    }
  }

  getSupportedFormats(): OutputFormat[] {
    return ['markdown', 'json', 'plaintext'];
  }

  getSupportedTypes(): TemplateType[] {
    return ['appeal', 'report'];
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createTemplateManager(deps?: Partial<TemplateManagerDeps>): TemplateManager {
  return new TemplateManager(deps);
}

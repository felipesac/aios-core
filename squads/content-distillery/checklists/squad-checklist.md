# Content Distillery Squad Checklist

Validation checklist for the complete squad. All blocking items must pass.

---

## Structure

- [ ] Pack directory exists at `squads/content-distillery/`
- [ ] All subdirectories present: agents/, tasks/, workflows/, templates/, checklists/, data/, docs/
- [ ] config.yaml exists and is valid YAML
- [ ] config.yaml has all required fields (pack, agents, workflows, tasks, quality_gates)
- [ ] README.md exists and is complete

## Agents (9 total)

### Orchestrator
- [ ] `distillery-chief.md` exists
- [ ] Has routing logic for all tiers
- [ ] Has pipeline management for all 3 workflows
- [ ] Has quality gate enforcement
- [ ] Has all commands documented (*help, *distill, *extract, *derive, *route, *status, *agents)
- [ ] 300+ lines

### Tier 0 (Diagnostic)
- [ ] `tacit-extractor.md` exists (Cedric Chin)
- [ ] Has voice DNA section
- [ ] Has RPD extraction methodology documented
- [ ] Has 3 Kinds of Tacit Knowledge classification
- [ ] 300+ lines

- [ ] `model-identifier.md` exists (Shane Parrish)
- [ ] Has voice DNA section
- [ ] Has mental model library (20+ models)
- [ ] Has heuristic extraction process
- [ ] 300+ lines

### Tier 1 (Masters)
- [ ] `knowledge-architect.md` exists (Tiago Forte)
- [ ] Has Progressive Summarization (5 layers documented)
- [ ] Has PARA method documented
- [ ] Has C.O.D.E. framework
- [ ] 300+ lines

- [ ] `content-atomizer.md` exists (Gary Vaynerchuk)
- [ ] Has Reverse Pyramid Model documented
- [ ] Has platform-specific formatting
- [ ] Has 64-pieces methodology
- [ ] 300+ lines

### Tier 2 (Systematizers)
- [ ] `idea-multiplier.md` exists (Cole & Bush)
- [ ] Has 4A Framework with examples
- [ ] Has Endless Idea Generator
- [ ] 300+ lines

- [ ] `ecosystem-designer.md` exists (Dan Koe)
- [ ] Has Content Map documented
- [ ] Has 2-Hour Content Ecosystem
- [ ] 300+ lines

- [ ] `production-ops.md` exists (Justin Welsh)
- [ ] Has Content OS documented
- [ ] Has 730-Day Library system
- [ ] 300+ lines

### Tier 3 (Specialist)
- [ ] `youtube-strategist.md` exists (Paddy Galloway)
- [ ] Has CCN Rule documented
- [ ] Has Clickbait Theory
- [ ] Has Format-First Thinking
- [ ] 300+ lines

## Workflows (3 total)

- [ ] `full-distillery-pipeline.md` exists
- [ ] Has 6 phases with checkpoints
- [ ] Has quality gates (QG-001 through QG-005)
- [ ] Has error handling
- [ ] 500+ lines

- [ ] `framework-extraction.md` exists
- [ ] Has 3 phases
- [ ] Has comparison mode
- [ ] 500+ lines

- [ ] `content-derivation.md` exists
- [ ] Has 3 phases
- [ ] Has batch mode
- [ ] 500+ lines

## Tasks (12 total)

- [ ] All 12 tasks exist in tasks/ directory
- [ ] All follow Task Anatomy (8 fields: id, purpose, executor, inputs, preconditions, steps, outputs, validation)
- [ ] Complex tasks are 300+ lines
- [ ] Each task has executor assigned
- [ ] Each task has error handling

### Task List
- [ ] `ingest-youtube.md`
- [ ] `extract-tacit-knowledge.md`
- [ ] `identify-frameworks.md`
- [ ] `progressive-summarize.md`
- [ ] `build-knowledge-base.md`
- [ ] `multiply-ideas.md`
- [ ] `atomize-content.md`
- [ ] `design-ecosystem.md`
- [ ] `produce-batch.md`
- [ ] `optimize-youtube.md`
- [ ] `distill-single-live.md`
- [ ] `cross-reference-frameworks.md`

## Templates

- [ ] `framework-template.md` exists
- [ ] `distillation-report.md` exists
- [ ] `content-piece-template.md` exists

## Checklists

- [ ] `distillation-quality.md` exists (QG-001 through QG-005)
- [ ] `squad-checklist.md` exists (this file)

## Documentation

- [ ] README.md has: overview, installation, quick start, agents list, workflows list, tasks list, usage examples
- [ ] Knowledge base file exists in data/

## Quality Score

| Dimension | Score (1-10) | Weight | Weighted |
|-----------|-------------|--------|----------|
| Accuracy (real minds, real frameworks) | __ | 0.20 | __ |
| Coherence (components work together) | __ | 0.20 | __ |
| Strategic Alignment (serves purpose) | __ | 0.15 | __ |
| Operational Excellence (usable) | __ | 0.20 | __ |
| Innovation Capacity (can grow) | __ | 0.10 | __ |
| Risk Management (guardrails) | __ | 0.15 | __ |
| **TOTAL** | | | **/10** |

**Minimum passing score: 7.0/10**
**Veto if any dimension below 5.0:** Accuracy, Coherence, Operational Excellence

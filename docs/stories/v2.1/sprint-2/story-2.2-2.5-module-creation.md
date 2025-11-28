# STORIES 2.2-2.5: Module Creation (4 Modules)

**Épico:** [EPIC-S2](../../../epics/epic-s2-modular-architecture.md) | **Sprint:** 2 | **Created:** 2025-01-19
**Updated:** 2025-11-28 (Refined to align with ADR-002)
**Status:** 📋 Ready for Development

**Reference:** [ADR-002 Migration Map](../../architecture/decisions/ADR-002-migration-map.md)

---

## 📊 Overview

Estas 4 stories implementam a criação física dos 4 modules definidos no ADR-002, migrando arquivos da estrutura flat para estrutura modular.

**Pre-Requisite:** ✅ [Story 2.1 - Module Structure Design](./story-2.1-module-structure-design.md) (Done)

---

## STORY 2.2: Core Module Creation

**ID:** 2.2 | **Points:** 5 | **Priority:** 🔴 Critical | **Status:** 📋 Draft

### User Story
**Como** arquiteto, **Quero** criar module `core/`, **Para** centralizar framework essentials

### Scope (per ADR-002)
```
.aios-core/core/
├── config/                     # Configuration system
│   ├── config-loader.js        # from scripts/
│   └── config-cache.js         # from scripts/
├── data/                       # Knowledge base and patterns
│   ├── aios-kb.md              # from data/
│   ├── workflow-patterns.yaml  # from data/
│   └── agent-config-requirements.yaml
├── docs/                       # Core documentation
│   ├── component-creation-guide.md
│   ├── session-update-pattern.md
│   ├── SHARD-TRANSLATION-GUIDE.md
│   ├── template-syntax.md
│   └── troubleshooting-guide.md
├── elicitation/                # Interactive prompting engine
│   ├── elicitation-engine.js   # from scripts/
│   ├── session-manager.js      # from scripts/elicitation-session-manager.js
│   ├── agent-elicitation.js    # from elicitation/
│   ├── task-elicitation.js     # from elicitation/
│   └── workflow-elicitation.js # from elicitation/
├── session/                    # Runtime state management
│   ├── context-loader.js       # from scripts/session-context-loader.js
│   └── context-detector.js     # from scripts/
├── utils/                      # Core utilities
│   ├── output-formatter.js     # from scripts/
│   └── yaml-validator.js       # from scripts/
├── index.js                    # Core exports (from root)
├── index.esm.js                # ESM entry (from root)
└── index.d.ts                  # TypeScript defs (from root)
```

### Acceptance Criteria
- [ ] Directory structure created matching ADR-002
- [ ] 22 files migrated to correct locations
- [ ] All imports updated (relative paths)
- [ ] `require('./.aios-core/core')` works
- [ ] No circular dependencies introduced
- [ ] Smoke tests pass (CORE-01 to CORE-07)

### Tasks
- [ ] 2.2.1: Create directory structure (1h)
- [ ] 2.2.2: Migrate config/ files (2h)
- [ ] 2.2.3: Migrate data/ files (1h)
- [ ] 2.2.4: Migrate docs/ files (1h)
- [ ] 2.2.5: Migrate elicitation/ files (2h)
- [ ] 2.2.6: Migrate session/ files (1h)
- [ ] 2.2.7: Migrate utils/ files (1h)
- [ ] 2.2.8: Create index.js exports (1h)
- [ ] 2.2.9: Update all imports referencing moved files (2h)
- [ ] 2.2.10: Run validation scripts (1h)
- [ ] 2.2.11: Run regression tests CORE-01 to CORE-07 (1h)

**Total:** 14h

### Dependency Violations to Fix (from ADR-002)
- `elicitation-engine.js` → `security-checker.js` (core → infrastructure)
  - **Solution:** Make security check optional or create minimal core validator

---

## STORY 2.3: Development Module Creation

**ID:** 2.3 | **Points:** 8 | **Priority:** 🔴 Critical | **Status:** 📋 Draft

### User Story
**Como** developer, **Quero** module `development/`, **Para** acessar agents, tasks, workflows

### Scope (per ADR-002)
```
.aios-core/development/
├── agents/                     # 16 agent definitions
│   ├── dev.md
│   ├── qa.md
│   ├── architect.md
│   ├── pm.md
│   ├── po.md
│   ├── sm.md
│   ├── analyst.md
│   ├── ux-expert.md
│   ├── devops.md
│   ├── aios-master.md
│   ├── aios-developer.md
│   ├── aios-installer.md
│   └── ... (16 total)
├── agent-teams/                # 5 team configurations (keep name per Aria)
│   └── ... (5 configs)
├── tasks/                      # 120+ task definitions
│   └── ... (all from tasks/)
├── workflows/                  # 7 workflow definitions
│   └── ... (all from workflows/)
└── scripts/                    # 24 agent-related scripts
    ├── agent-assignment-resolver.js
    ├── agent-config-loader.js
    ├── agent-exit-hooks.js
    ├── generate-greeting.js
    ├── greeting-builder.js
    ├── greeting-preference-manager.js
    ├── story-manager.js
    ├── story-update-hook.js
    ├── story-index-generator.js
    ├── backlog-manager.js
    ├── decision-recorder.js
    ├── workflow-navigator.js
    └── ... (24 total)
```

### Acceptance Criteria
- [ ] Directory structure created matching ADR-002
- [ ] 248+ files migrated to correct locations
- [ ] All imports updated (relative paths)
- [ ] Agent activation works (`@dev`, `@qa`, etc.)
- [ ] Task execution works
- [ ] Workflow navigation works
- [ ] Smoke tests pass (DEV-01 to DEV-09)

### Tasks
- [ ] 2.3.1: Create directory structure (1h)
- [ ] 2.3.2: Migrate agents/ (16 files) (2h)
- [ ] 2.3.3: Migrate agent-teams/ (5 files) (1h)
- [ ] 2.3.4: Migrate tasks/ (120+ files) (3h)
- [ ] 2.3.5: Migrate workflows/ (7 files) (1h)
- [ ] 2.3.6: Migrate scripts/ (24 files) (3h)
- [ ] 2.3.7: Update all imports referencing moved files (3h)
- [ ] 2.3.8: Test agent activation for all 16 agents (2h)
- [ ] 2.3.9: Run validation scripts (1h)
- [ ] 2.3.10: Run regression tests DEV-01 to DEV-09 (2h)

**Total:** 19h

### Dependency Violations to Fix (from ADR-002)
- `agent-config-loader.js` → `performance-tracker.js` (dev → infra)
  - **Solution:** Make performance tracking optional/injectable
- `greeting-builder.js` → `git-config-detector.js`, `project-status-loader.js` (dev → infra)
  - **Solution:** Inject as optional dependencies

---

## STORY 2.4: Product Module Creation

**ID:** 2.4 | **Points:** 3 | **Priority:** 🟠 High | **Status:** 📋 Draft

### User Story
**Como** PM/PO, **Quero** module `product/`, **Para** acessar templates e checklists

### Scope (per ADR-002)
```
.aios-core/product/
├── templates/                  # 52+ document templates
│   ├── story-tmpl.yaml
│   ├── prd-tmpl.yaml
│   ├── adr-tmpl.md
│   ├── epic-tmpl.md
│   ├── ide-rules/              # 9 IDE-specific rule files
│   └── ... (52+ total)
├── checklists/                 # 6 validation checklists
│   ├── story-dod-checklist.md
│   ├── po-master-checklist.md
│   ├── pre-push-checklist.md
│   ├── release-checklist.md
│   ├── change-checklist.md
│   └── qa-checklist.md
└── data/                       # PM-specific data files
    ├── brainstorming-techniques.md
    ├── elicitation-methods.md
    ├── mode-selection-best-practices.md
    ├── test-levels-framework.md
    ├── test-priorities-matrix.md
    └── technical-preferences.md
```

### Acceptance Criteria
- [ ] Directory structure created matching ADR-002
- [ ] 67+ files migrated to correct locations
- [ ] Templates load correctly
- [ ] Checklists parse correctly
- [ ] No runtime dependencies on other modules
- [ ] Smoke tests pass (PROD-01 to PROD-05)

### Tasks
- [ ] 2.4.1: Create directory structure (1h)
- [ ] 2.4.2: Migrate templates/ (52+ files including ide-rules/) (2h)
- [ ] 2.4.3: Migrate checklists/ (6 files) (1h)
- [ ] 2.4.4: Migrate data/ PM files (6 files) (1h)
- [ ] 2.4.5: Update any references to template paths (1h)
- [ ] 2.4.6: Run validation scripts (1h)
- [ ] 2.4.7: Run regression tests PROD-01 to PROD-05 (1h)

**Total:** 8h

### Notes
- Product module should have NO runtime dependencies on other modules
- Templates are loaded as static files, not executed

---

## STORY 2.5: Infrastructure Module Creation

**ID:** 2.5 | **Points:** 5 | **Priority:** 🟠 High | **Status:** 📋 Draft

### User Story
**Como** developer, **Quero** module `infrastructure/`, **Para** acessar tools, integrations, scripts

### Scope (per ADR-002)
```
.aios-core/infrastructure/
├── tools/                      # 12 tool configurations
│   └── ... (all from tools/)
├── scripts/                    # 45+ system scripts
│   ├── pm-adapter.js
│   ├── pm-adapter-factory.js
│   ├── git-wrapper.js
│   ├── git-config-detector.js
│   ├── branch-manager.js
│   ├── security-checker.js
│   ├── template-engine.js
│   ├── component-generator.js
│   ├── dependency-analyzer.js
│   ├── performance-tracker.js
│   ├── test-generator.js
│   └── ... (45+ total)
├── tests/                      # Test utilities
│   └── regression-suite-v2.md
└── integrations/               # External integrations
    └── pm-adapters/            # 5 PM adapter files
        ├── clickup-adapter.js
        ├── github-adapter.js
        ├── jira-adapter.js
        ├── local-adapter.js
        └── index.js
```

### Acceptance Criteria
- [ ] Directory structure created matching ADR-002
- [ ] 65+ files migrated to correct locations
- [ ] All imports updated (relative paths)
- [ ] Git operations work
- [ ] PM adapters work
- [ ] Tool resolver works
- [ ] Smoke tests pass (INFRA-01 to INFRA-07)

### Tasks
- [ ] 2.5.1: Create directory structure (1h)
- [ ] 2.5.2: Migrate tools/ (12 files) (1h)
- [ ] 2.5.3: Migrate scripts/ (45+ files) (4h)
- [ ] 2.5.4: Migrate tests/ (1h)
- [ ] 2.5.5: Migrate integrations/pm-adapters/ (5 files) (1h)
- [ ] 2.5.6: Update all imports referencing moved files (3h)
- [ ] 2.5.7: Test PM adapter factory (1h)
- [ ] 2.5.8: Run validation scripts (1h)
- [ ] 2.5.9: Run regression tests INFRA-01 to INFRA-07 (1h)

**Total:** 14h

---

## 🔗 Dependencies

```
Story 2.1 (Done) ──► Stories 2.2, 2.3, 2.4, 2.5 (can run in parallel)
                              │
                              ▼
                    Story 2.6 (Service Registry)
                    Story 2.14 (Migration Script)
```

**Execution Order Recommendation:**
1. **Story 2.2 (Core)** - Must be first (other modules depend on core)
2. **Story 2.4 (Product)** - Can run parallel, no dependencies
3. **Story 2.3 (Development)** - After core (depends on core/)
4. **Story 2.5 (Infrastructure)** - After core (depends on core/)

---

## ✅ Shared Acceptance Criteria

- [ ] Zero breaking changes (backward compatibility)
- [ ] All imports updated to new paths
- [ ] Tests passing 100% (24 regression tests)
- [ ] Smoke tests passing (all modules)
- [ ] Documentation updated (module READMEs)
- [ ] Validation scripts pass
- [ ] No circular dependencies

---

## 📋 Rollback Plan

Per [ADR-002-regression-tests.md](../../architecture/decisions/ADR-002-regression-tests.md):

| Condition | Action |
|-----------|--------|
| Any P0 test fails | Immediate rollback |
| >20% P1 tests fail | Rollback and investigate |
| Agent activation broken | Immediate rollback |
| Story management broken | Immediate rollback |

**Rollback Command:**
```bash
git revert --no-commit HEAD~N  # N = number of commits to revert
```

---

## 📊 Estimation Summary

| Story | Points | Hours | Priority |
|-------|--------|-------|----------|
| 2.2 Core | 5 | 14h | 🔴 Critical |
| 2.3 Development | 8 | 19h | 🔴 Critical |
| 2.4 Product | 3 | 8h | 🟠 High |
| 2.5 Infrastructure | 5 | 14h | 🟠 High |
| **Total** | **21** | **55h** | |

---

## 📝 PO Validation Notes (2025-11-28)

- ✅ Stories refined to align with ADR-002 approved structure
- ✅ Scope matches migration map exactly
- ✅ Dependency violations from ADR-002 included in relevant stories
- ✅ Architect recommendations incorporated (keep agent-teams/ name)
- ✅ Regression test references included
- ✅ Rollback plan included
- ✅ Stories ready for development

---

**Criado por:** River 🌊
**Refinado por:** Pax 🎯 (PO) - 2025-11-28

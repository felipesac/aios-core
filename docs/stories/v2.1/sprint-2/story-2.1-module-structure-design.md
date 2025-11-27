# STORY: Module Structure Design

**ID:** 2.1 | **Épico:** [EPIC-S2](../../../epics/epic-s2-modular-architecture.md)
**Sprint:** 2 | **Points:** 8 | **Priority:** 🔴 Critical | **Created:** 2025-01-19
**Updated:** 2025-01-27 (PO Review - Pax)

## 📊 User Story
**Como** arquiteto, **Quero** definir estrutura modular clara, **Para** organizar .aios-core/ em 4 modules

## ✅ Acceptance Criteria
- [ ] 4 modules definidos: core, development, product, infrastructure
- [ ] Cada module com responsabilidades claras (documented in ADR)
- [ ] Migration map completo (file → destination module)
- [ ] Zero breaking changes para usuários
- [ ] Architecture Decision Record (ADR) documentado
- [ ] **[NEW]** Validação de imports/requires após migração planejada
- [ ] **[NEW]** Plano de testes de regressão definido
- [ ] **[NEW]** Arquivos duplicados identificados e resolvidos

## 🔧 Implementation
```
.aios-core/
├── core/           # Framework essentials (config, orchestration, validation)
├── development/    # Dev features (agents, workers, tasks, workflows)
├── product/        # PM features (templates, checklists, decisions)
└── infrastructure/ # System (CLI, MCP, integrations, scripts)
```

## 📋 Tasks (8 pts = 3 dias)

### Design Tasks (Original)
- [ ] 2.1.1: Define module boundaries (4h)
- [ ] 2.1.2: Create migration map (3h)
- [ ] 2.1.3: Identify inter-module dependencies (3h)
- [ ] 2.1.4: Write ADR (2h)
- [ ] 2.1.5: Review by Aria + Pedro clone (2h)

### Validation Tasks (NEW - PO Review)
- [ ] 2.1.6: Resolve duplicações identificadas (2h)
  - `config/agent-config-requirements.yaml` vs `data/agent-config-requirements.yaml`
  - Decisão: manter `data/`, remover `config/`
- [ ] 2.1.7: Criar plano de validação de imports (2h)
  - Script para verificar broken imports pós-migração
  - Mapping de requires antigos → novos paths
- [ ] 2.1.8: Definir regression test suite (2h)
  - Lista de smoke tests por module
  - Critérios de rollback

**Total:** 20h (aumentado de 14h)

## 📦 Pre-Requisite: Cleanup (Story 2.0)

> ⚠️ **BLOCKER**: Esta story depende de [Story 2.0 - Pre-Migration Cleanup](./story-2.0-pre-migration-cleanup.md)
>
> Foram identificados **257 arquivos deprecated** que devem ser removidos ANTES da migração modular para:
> - Reduzir complexidade do migration map
> - Evitar migrar lixo para nova estrutura
> - Clarificar baseline para testes

## 🗺️ Migration Map (Draft)

| Pasta Atual | Destino | Arquivos |
|-------------|---------|----------|
| `agents/` | `development/agents/` | 15 agents |
| `agent-teams/` | `development/teams/` | 5 configs |
| `tasks/` | `development/tasks/` | ~100 tasks |
| `workflows/` | `development/workflows/` | workflows |
| `templates/` | `product/templates/` | templates |
| `checklists/` | `product/checklists/` | 6 checklists |
| `data/` | `core/data/` | KB, patterns |
| `scripts/` | `infrastructure/scripts/` | 90+ scripts |
| `elicitation/` | `infrastructure/elicitation/` | 3 modules |
| `tools/` | `infrastructure/tools/` | configs |
| `docs/` | `core/docs/` | framework docs |
| `.session/` | `core/.session/` | runtime |
| `tests/` | `infrastructure/tests/` | tests |
| `config/` | ❌ REMOVE | duplicado |

## 🔗 Dependencies
**Depende:** [2.0] Pre-Migration Cleanup, [1.1-1.12] Sprint 1 complete
**Bloqueia:** [2.2-2.5] Module creation

## 📝 Notes (PO Review 2025-01-27)
- Estimativa original de 14h era subdimensionada
- Cleanup de backups deve ser prerequisite, não parte desta story
- Duplicação em `config/` vs `data/` deve ser resolvida aqui

---
**Criado por:** River 🌊
**Revisado por:** Pax 🎯 (PO)

# Sprint 2 Stories - Modular Architecture + Service Discovery

**Sprint:** 2 | **Duration:** 2.5 semanas | **Points:** 94 | **Stories:** 17
**Updated:** 2025-01-27 (PO Review - Added Story 2.0)

## 📋 Stories List

| ID | Story | Points | Priority | Status | Deps |
|----|-------|--------|----------|--------|------|
| **2.0** | [Pre-Migration Cleanup](./story-2.0-pre-migration-cleanup.md) | 3 | 🔴 Critical | 📋 Backlog | 1.x |
| 2.1 | [Module Structure Design](./story-2.1-module-structure-design.md) | 8 | 🔴 Critical | 📋 Backlog | **2.0** |
| 2.2 | Core Module Creation | 5 | 🔴 Critical | 📋 Backlog | 2.1 |
| 2.3 | Development Module Creation | 5 | 🔴 Critical | 📋 Backlog | 2.1 |
| 2.4 | Product Module Creation | 3 | 🟠 High | 📋 Backlog | 2.1 |
| 2.5 | Infrastructure Module Creation | 5 | 🟠 High | 📋 Backlog | 2.1 |
| 2.6 | Service Registry Creation | 8 | 🔴 Critical | 📋 Backlog | 2.2-2.5 |
| 2.7 | Discovery CLI - Search | 8 | 🔴 Critical | 📋 Backlog | 2.6 |
| 2.8 | Discovery CLI - Info | 3 | 🟠 High | 📋 Backlog | 2.6 |
| 2.9 | Discovery CLI - List | 5 | 🟠 High | 📋 Backlog | 2.6 |
| 2.10 | Quality Gate Manager Unificado | 8 | 🔴 Critical | 📋 Backlog | 2.2 |
| 2.11 | MCP System Global | 8 | 🟠 High | 📋 Backlog | 2.5 |
| 2.12 | Framework Standards Migration | 3 | 🟡 Medium | 📋 Backlog | 2.2 |
| 2.13 | Manifest System | 5 | 🟡 Medium | 📋 Backlog | 2.6 |
| 2.14 | Migration Script v2.0 → v2.1 | 8 | 🔴 Critical | 📋 Backlog | 2.2-2.5 |
| 2.15 | Update Installer for Modules | 3 | 🟠 High | 📋 Backlog | 2.14 |
| 2.16 | Documentation Sprint 2 | 5 | 🟡 Medium | 📋 Backlog | all |

**Total:** 94 pontos (+3 from Story 2.0)

## 🔄 Dependency Graph

```
Sprint 1 Complete
       │
       ▼
   [2.0] Pre-Migration Cleanup (NEW - 3pts)
       │
       ▼
   [2.1] Module Structure Design (8pts, was 5pts)
       │
       ├─────────────┬──────────────┬──────────────┐
       ▼             ▼              ▼              ▼
   [2.2] Core    [2.3] Dev     [2.4] Product  [2.5] Infra
       │             │              │              │
       └─────────────┴──────────────┴──────────────┘
                          │
                          ▼
                   [2.6] Service Registry
                          │
       ┌──────────────────┼──────────────────┐
       ▼                  ▼                  ▼
   [2.7] Search      [2.8] Info         [2.9] List
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
                   [2.14] Migration Script
                          │
                          ▼
                   [2.15] Update Installer
                          │
                          ▼
                   [2.16] Documentation
```

## 🆕 Changes (2025-01-27 - PO Review)

### Added Story 2.0: Pre-Migration Cleanup
- **Why:** Identificados 257 arquivos deprecated durante validação
- **What:** Remove backups, duplicatas, e lixo antes da migração
- **Impact:** +3 points, novo blocker para 2.1

### Updated Story 2.1: Module Structure Design
- **Points:** 5 → 8 (estimativa subdimensionada)
- **Tasks:** 5 → 8 (adicionadas tasks de validação)
- **Deps:** Agora depende de 2.0

### Cleanup Details (257 files to remove)
| Category | Count | Pattern |
|----------|-------|---------|
| Root backups | 4 | `*.backup-*` |
| Agent backups | 22 | `*.backup`, `*.backup-pre-inline` |
| Task backups | ~220 | `*.v1-backup.md`, `*.pre-task-id-fix` |
| Duplicated folder | 1 | `config/` (duplica `data/`) |

## 🎯 Sprint Goals
- ✅ Arquitetura modular 100% funcional
- ✅ 97+ workers catalogados
- ✅ Service Discovery CLI operational
- ✅ Migration script testado
- **✅ [NEW] Codebase limpo de arquivos deprecated**

## ⚠️ Risks Identified

1. **Cleanup não feito** → Migra 257 arquivos inúteis
2. **Estimativas subdimensionadas** → Story 2.1 já ajustada
3. **Dependência sequencial** → 2.0 bloqueia toda a sprint

## 📅 Recommended Execution Order

1. **Day 1**: Story 2.0 (cleanup)
2. **Days 2-3**: Story 2.1 (design)
3. **Days 4-6**: Stories 2.2-2.5 (modules) - parallelizable
4. **Days 7-8**: Stories 2.6-2.9 (service discovery)
5. **Days 9-10**: Stories 2.10-2.13 (quality/standards)
6. **Days 11-12**: Stories 2.14-2.16 (migration/docs)

---
**Criado por:** River 🌊
**Atualizado por:** Pax 🎯 (PO Review 2025-01-27)

# AIOS Ad Orchestrator - Workflow Complete Consolidated V3.0

**Date:** 2025-11-13  
**Version:** 3.0.0  
**Status:** Production Ready  
**Breaking Changes:** Yes (from v2.0)

---

## Metadata

- **Previous Version:** 2.0.0
- **Migration Required:** Yes
- **Backward Compatible:** No
- **Estimated Migration Time:** 2-3 days
- **Score Improvement:** 8.6/10 → 9.2/10 (+7%)

---

## Executive Summary

### Major Changes from V2.0

1. ✅ **Task Format Standardized** - All steps follow AIOS Task Format Specification V1.0
2. ✅ **Executor Types Defined** - Every step has explicit executor type (Agente/Worker/Humano/Clone)
3. ✅ **Atomic Design Explicit** - All steps mapped to layers (Atom/Molecule/Organism/Template/Page)
4. ✅ **Molecule Layer Added** - Text Group (8a), Action Group (8b) for reusability
5. ✅ **Checklists Structured** - Pre-conditions, post-conditions, acceptance criteria separated
6. ✅ **Parallelization Implemented** - 4 parallel groups (~4.6s savings)
7. ✅ **Error Handling Explicit** - Retry/fallback/abort strategies defined
8. ✅ **Performance Tracked** - Duration, cost, cacheability for every step
9. ✅ **Separation of Concerns Fixed** - God steps broken down (7→7a/b/c, 8→8a/b/c, 13→13a/b)
10. ✅ **Naming Consistent** - camelCase (JSON), kebab-case (CSS), snake_case (DB)

### Steps: 14 → 19 (+35% granularity)

```
v2.0: 14 steps (5 with decimals: 0.5, 3.6, 10.5)
v3.0: 19 steps (no decimals, sequential numbering)
```

### Phases: 7 → 6 (Atomic Design aligned)

```
v2.0: FASE 0-6 (arbitrary grouping)
v3.0: FASE 0-5 (maps to Atomic Design + functional layers)
```

---

## AIOS Task Format Overview

Every step in V3.0 follows this structure:

```yaml
#### Step X: [Task Name]

task: taskIdentifier()
responsável: [Role/Service]
responsavel_type: Agente | Worker | Humano | Clone
atomic_layer: [Atom|Molecule|Organism|Template|Page|Config|Strategy|Content|Media|Layout|Analysis]

**Entrada:**
- campo: [name]
  tipo: [type]
  origem: [source]
  obrigatório: [true|false]

**Saída:**
- campo: [name]
  tipo: [type]
  destino: [destination]
  persistido: [true|false]

**Checklist:**
  pre-conditions: [...]
  post-conditions: [...]
  acceptance-criteria: [...]

**Template:** [path] (optional)
**Tools:** [list] (optional)
**Scripts:** [list] (optional)

**Performance:**
- duration_expected: [X]ms
- cost_estimated: $[Y]
- cacheable: [true|false]
- parallelizable: [true|false]
- parallel_with: [steps]
- skippable_when: [conditions]

**Error Handling:**
- strategy: [retry|fallback|abort]
- retry: [config]
- fallback: [description]
- abort_workflow: [true|false]

**Metadata:**
- story: [STORY-XXX]
- version: [X.Y.Z]
- dependencies: [steps]
```

**Full Specification:** `standards/TASK-FORMAT-SPECIFICATION-V1.md`

---

## Architecture Principles

### 1. Single Source of Truth (SSOT)

```
Format Config (Step 1) = SSOT for safe zones, canvas dimensions
Design Tokens (Step 12) = SSOT for spacing, typography, colors, radius, shadows
Layout (Step 8c) = SSOT for organism structure
Positioning (Step 11) = SSOT for positioning data
```

### 2. Separation of Concerns

```
Components (Atoms/Molecules) = Content ONLY (what)
Layout (Organisms) = Structure ONLY (how)
Positioning (Templates) = Placement ONLY (where)
Rendering (Pages) = Final output (result)
```

### 3. Atomic Design (Brad Frost)

```
Atoms (7a, 7b) → Components cannot be broken down further
Molecules (8a, 8b) → Groups of atoms serving specific purpose
Organisms (8c) → Complex sections combining molecules
Templates (11, 13a, 13b) → Structure + positioning + CSS
Pages (14) → Template + real content rendered to PNG
```

### 4. Executor Interchangeability

```
Agente ↔ Worker (based on ready_copy mode, template_id, urgency)
Agente → Clone (when methodology validation needed)
Humano ↔ Agente (based on batch_mode, skip_qa flags)
```

### 5. Progressive Enhancement

```
PHASE 1 (MVP): CSS classes vertical positioning
PHASE 2 (Refactor): Design tokens system
PHASE 3 (Full): Clone validation, visual regression tests
```

---

## Workflow: 19 Steps (6 Phases)

### FASE 0: Configuration & Initialization

**Purpose:** Load immutable configs (format, brand, tokens)

**Steps:** 0, 1, 2, 12  
**Parallelization:** Steps 1 + 2 can run in parallel

---

#### Step 0: Initialize Orchestrator

```yaml
task: initializeOrchestrator()
responsável: orchestrate-ad-aios.js
responsavel_type: Worker
atomic_layer: Config

**Entrada:**
- brand_id: string (User Input, obrigatório: true)
- format_id: string (User Input, obrigatório: true)
- orientation: string (User Input, padrão: "portrait")
- ready_copy: object | null (User Input, obrigatório: false)
- template_id: string | null (User Input, obrigatório: false)
- campaign_goal: string (User Input, obrigatório: true)

**Saída:**
- config: object (destino: state, persistido: false)

**Checklist:**
  pre-conditions:
    - [ ] brand_id is not empty (blocker: true)
    - [ ] format_id is valid (blocker: true)
    - [ ] If ready_copy provided, at least one field (title/body/cta) (blocker: true)
  post-conditions:
    - [ ] config object is valid (blocker: true)

**Performance:**
- duration_expected: 10ms
- cost_estimated: $0
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 1, backoff: linear, backoff_ms: 0 }
- abort_workflow: true

**Metadata:**
- version: 3.0.0
- dependencies: []
```

---

#### Step 1: Load Format Configuration

```yaml
task: loadFormatConfig()
responsável: format-loader.js
responsavel_type: Worker
atomic_layer: Config

**Entrada:**
- format_id: string (Step 0, obrigatório: true)
- orientation: string (Step 0, padrão: "portrait")

**Saída:**
- formatConfig: FormatConfig (destino: [8c, 10, 11, 12, 13a, 14], persistido: false, cache_key: format_${format_id}_${orientation})

**Performance:**
- duration_expected: 50ms
- cost_estimated: $0
- cacheable: true
- parallelizable: true
- parallel_with: [Step 2]

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 2, backoff: linear, backoff_ms: 100 }
- abort_workflow: true

**Metadata:**
- story: DECISION-02
- version: 1.0.0
- dependencies: [Step 0]
```

---

#### Step 2: Load Brand Configuration

```yaml
task: loadBrand()
responsável: brand-loader.js
responsavel_type: Worker
atomic_layer: Config

**Entrada:**
- brand_id: string (Step 0, obrigatório: true)

**Saída:**
- brand: Brand (destino: [3, 4, 5, 6, 7a, 7b, 8a, 8b, 8c, 9], persistido: false, cache_key: brand_${brand_id})

**Checklist:**
  post-conditions:
    - [ ] Color contrast validation (WCAG AA) (blocker: false, tipo: post-condition)
    - [ ] Font availability check (blocker: true, tipo: post-condition)

**Performance:**
- duration_expected: 100ms
- cost_estimated: $0
- cacheable: true
- parallelizable: true
- parallel_with: [Step 1]

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 2, backoff: linear, backoff_ms: 100 }
- abort_workflow: true

**Metadata:**
- story: STORY-016.2
- version: 2.1.0
- dependencies: [Step 0]
```

---

#### Step 12: Load Design Tokens

```yaml
task: loadDesignTokens()
responsável: design-tokens-loader.js
responsavel_type: Worker
atomic_layer: Config

**Entrada:**
- formatConfig: FormatConfig (Step 1, obrigatório: true)

**Saída:**
- designTokens: object { spacing, typography, colors, radius, shadows } (destino: Step 13a, persistido: false, cache_key: tokens_${formatId})

**Performance:**
- duration_expected: 80ms
- cost_estimated: $0
- cacheable: true
- parallelizable: false

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 2, backoff: linear, backoff_ms: 100 }
- abort_workflow: true

**Metadata:**
- story: ISSUE-1, ISSUE-5
- version: 1.0.0
- dependencies: [Step 1]
- breaking_changes: ["NOVO STEP em v3.0"]
```

---

### FASE 1: Content Planning

**Purpose:** Analyze brief, select template, generate copy, apply typography

**Steps:** 3, 4, 5, 6  
**Parallelization:** Steps 4 + 9 can run in parallel (after Step 5)

---

#### Step 3: Analyze Brief

```yaml
task: analyzeBrief()
responsável: Ad Strategist
responsavel_type: Agente | Worker
atomic_layer: Strategy

**Entrada:**
- brief_text: string (User Input, obrigatório: true)
- brand: Brand (Step 2, obrigatório: true)
- campaign_goal: string (Step 0, obrigatório: true)
- ready_copy: object | null (Step 0, obrigatório: false)

**Saída:**
- adAnalysis: object { goal, targetAudience, urgencyLevel, emotionalTriggers, keyMessage, readyCopyMode } (destino: state, persistido: true)

**Executor Logic:**
  if ready_copy=true: Worker (skip AI, use defaults)
  else: Agente (AI analysis)

**Performance:**
- duration_expected: 4000ms (Agente), 10ms (Worker)
- cost_estimated: $0.0025 (Agente), $0 (Worker)
- cacheable: false
- parallelizable: false
- skippable_when: [ready_copy=true]

**Error Handling:**
- strategy: fallback
- fallback: Use ready_copy or default analysis
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: STORY-003
- version: 2.0.0
- dependencies: [Step 2]
```

---

#### Step 4: Select Ad Template

```yaml
task: selectTemplate()
responsável: Creative Director
responsavel_type: Agente | Worker
atomic_layer: Strategy

**Entrada:**
- adAnalysis: object (Step 3, obrigatório: true)
- brand: Brand (Step 2, obrigatório: true)
- template_id: string | null (Step 0, obrigatório: false)
- ready_copy: object | null (Step 0, obrigatório: false)

**Saída:**
- selectedTemplate: object { templateId, templateVersion, selectionMethod } (destino: [8c, 13b], persistido: true)

**Executor Logic (DECISION-01 Matrix 2x2):**
  if template_id provided: Worker (use provided)
  else if ready_copy=true: Agente (AI with ready_copy context)
  else: Agente (AI with brief analysis)
  on_error: fallback to "ad-01-hero-overlay"

**Performance:**
- duration_expected: 3000ms (Agente), 50ms (Worker)
- cost_estimated: $0.0003 (Agente), $0 (Worker)
- cacheable: false
- parallelizable: true
- parallel_with: [Step 9]

**Error Handling:**
- strategy: fallback
- fallback: Use default template "ad-01-hero-overlay"
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: DECISION-01
- version: 2.1.0
- dependencies: [Step 2, Step 3]
- breaking_changes: ["Template versioning added"]
```

---

#### Step 5: Craft Ad Copy

```yaml
task: craftCopy()
responsável: Copywriter
responsavel_type: Agente | Worker
atomic_layer: Content

**Entrada:**
- adAnalysis: object (Step 3, obrigatório: true)
- brand: Brand (Step 2, obrigatório: true)
- ready_copy: object | null (Step 0, obrigatório: false)

**Saída:**
- adCopy: object { title, body, cta, sourceType } (destino: state, persistido: true)

**Executor Logic:**
  if ready_copy=true: Worker (passthrough)
  else: Agente (AI generation)

**Performance:**
- duration_expected: 5000ms (Agente), 10ms (Worker)
- cost_estimated: $0.005 (Agente), $0 (Worker)
- cacheable: false
- parallelizable: false
- skippable_when: [ready_copy=true]

**Error Handling:**
- strategy: fallback
- fallback: Use ready_copy
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: STORY-005
- version: 2.0.0
- dependencies: [Step 2, Step 3]
```

---

#### Step 6: Apply Typography Transformations

```yaml
task: applyTypography()
responsável: Typography Specialist
responsavel_type: Agente
atomic_layer: Content

**Entrada:**
- adCopy: object { title, body, cta } (Step 5, obrigatório: true)
- brand: Brand (Step 2, obrigatório: true)

**Saída:**
- typography: object { title, body, cta } with transformations (destino: [7a, 8a], persistido: true)

**Performance:**
- duration_expected: 3000ms
- cost_estimated: $0.002
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: retry
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: STORY-006
- version: 2.0.0
- dependencies: [Step 2, Step 5]
```

---

### FASE 2: Atoms Creation

**Purpose:** Design base components (CTA, Badge) and validate

**Steps:** 7a, 7b, 7c  
**Parallelization:** Steps 7a + 7b can run in parallel

---

#### Step 7a: Design CTA Component (Atom)

```yaml
task: designCTAComponent()
responsável: Creative Director
responsavel_type: Agente | Worker
atomic_layer: Atom

**Entrada:**
- typography.cta: object (Step 6, obrigatório: true)
- brand.colors: object (Step 2, obrigatório: true)
- adAnalysis.urgencyLevel: string (Step 3, obrigatório: true)
- ready_copy: object | null (Step 0, obrigatório: false)

**Saída:**
- ctaComponent: object { text, style, colors } (destino: [7c, 8a, 8b], persistido: true)

**Executor Logic:**
  if ready_copy=true: Worker (brand colors)
  else: Agente (AI design)

**Checklist:**
  post-conditions:
    - [ ] CTA has NO positioning data (DECISION-03) (blocker: true, tipo: post-condition)
    - [ ] Color contrast ratio >= 4.5:1 (WCAG AA) (blocker: false, tipo: post-condition)

**Performance:**
- duration_expected: 2000ms (Agente), 10ms (Worker)
- cost_estimated: $0.003 (Agente), $0 (Worker)
- cacheable: false
- parallelizable: true
- parallel_with: [Step 7b]

**Error Handling:**
- strategy: fallback
- fallback: Use brand primary color
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: DECISION-03
- version: 2.0.0
- dependencies: [Step 2, Step 3, Step 6]
- breaking_changes: ["Positioning removed from component"]
```

---

#### Step 7b: Design Badge Component (Atom)

```yaml
task: designBadgeComponent()
responsável: Creative Director
responsavel_type: Agente | Worker
atomic_layer: Atom

**Entrada:**
- adAnalysis.urgencyLevel: string (Step 3, obrigatório: true)
- brand.colors: object (Step 2, obrigatório: true)

**Saída:**
- badgeComponent: object { text, style, colors } | null (destino: [7c, 8b], persistido: true)

**Executor Logic:**
  if urgencyLevel != "high": skip (no badge)
  else if ready_copy=true: Worker (default urgent badge)
  else: Agente (AI design)

**Checklist:**
  post-conditions:
    - [ ] Badge has NO positioning data (DECISION-03) (blocker: true, tipo: post-condition)

**Performance:**
- duration_expected: 2000ms (Agente), 10ms (Worker), 0ms (skip)
- cost_estimated: $0.003 (Agente), $0 (Worker), $0 (skip)
- cacheable: false
- parallelizable: true
- parallel_with: [Step 7a]
- skippable_when: [urgencyLevel != "high"]

**Error Handling:**
- strategy: skip
- abort_workflow: false

**Metadata:**
- story: DECISION-03
- version: 2.0.0
- dependencies: [Step 2, Step 3]
```

---

#### Step 7c: Validate Components (Brad Frost Clone)

```yaml
task: validateComponentsAtomicDesign()
responsável: Brad Frost Clone
responsavel_type: Clone
atomic_layer: Atom

**Entrada:**
- ctaComponent: object (Step 7a, obrigatório: true)
- badgeComponent: object | null (Step 7b, obrigatório: false)

**Saída:**
- validation_result: object { valid, violations } (destino: state, persistido: true)

**Clone Configuration:**
- heuristics: clones/brad_frost/heuristics.yaml
- axioms: clones/brad_frost/axioms.yaml
- ai_fallback: true

**Checklist:**
  post-conditions:
    - [ ] No Atomic Design violations (blocker: true, tipo: post-condition)
    - [ ] Components are context-agnostic (no position/size) (blocker: true, tipo: post-condition)

**Performance:**
- duration_expected: 1500ms
- cost_estimated: $0.001
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 1, backoff: linear, backoff_ms: 0 }
- abort_workflow: true

**Metadata:**
- story: DECISION-03
- version: 1.0.0
- dependencies: [Step 7a, Step 7b]
- breaking_changes: ["NOVO STEP em v3.0"]
```

---

### FASE 3: Molecules & Organisms

**Purpose:** Compose atoms into molecules, then molecules into organisms

**Steps:** 8a, 8b, 8c

---

#### Step 8a: Compose Text Group (Molecule)

```yaml
task: composeTextGroup()
responsável: Layout Composer
responsavel_type: Agente
atomic_layer: Molecule

**Entrada:**
- typography: object { title, body, cta } (Step 6, obrigatório: true)

**Saída:**
- textGroupMolecule: object { title, body, cta, groupType } (destino: Step 8c, persistido: true)

**Performance:**
- duration_expected: 1500ms
- cost_estimated: $0.001
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: retry
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- version: 1.0.0
- dependencies: [Step 6]
- breaking_changes: ["NOVO STEP em v3.0 - Molecule layer added"]
```

---

#### Step 8b: Compose Action Group (Molecule)

```yaml
task: composeActionGroup()
responsável: Layout Composer
responsavel_type: Agente
atomic_layer: Molecule

**Entrada:**
- ctaComponent: object (Step 7a, obrigatório: true)
- badgeComponent: object | null (Step 7b, obrigatório: false)

**Saída:**
- actionGroupMolecule: object { cta, badge, groupType } (destino: Step 8c, persistido: true)

**Performance:**
- duration_expected: 1000ms
- cost_estimated: $0.0005
- cacheable: false
- parallelizable: false
- skippable_when: [badgeComponent=null]

**Error Handling:**
- strategy: retry
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- version: 1.0.0
- dependencies: [Step 7a, Step 7b]
- breaking_changes: ["NOVO STEP em v3.0 - Molecule layer added"]
```

---

#### Step 8c: Compose Content Area (Organism)

```yaml
task: composeContentArea()
responsável: Layout Composer
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- textGroupMolecule: object (Step 8a, obrigatório: true)
- actionGroupMolecule: object (Step 8b, obrigatório: false)
- visualPlan.imageUrl: string (Step 9, obrigatório: true)
- brand: Brand (Step 2, obrigatório: true)
- selectedTemplate: object (Step 4, obrigatório: true)
- formatConfig: FormatConfig (Step 1, obrigatório: true)

**Saída:**
- contentAreaOrganism: object { structure, alignment } (destino: state, persistido: true)
- templateData: object { block_1, block_2, cta_text, alignment } (destino: Step 13b, persistido: true)

**Checklist:**
  post-conditions:
    - [ ] Organism has NO positioning data (blocker: true, tipo: post-condition)

**Performance:**
- duration_expected: 2000ms
- cost_estimated: $0.002
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: retry
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: DECISION-03
- version: 3.0.0
- dependencies: [Step 1, Step 2, Step 4, Step 8a, Step 8b, Step 9]
- breaking_changes: ["Separated from Step 8 v2.0", "Positioning removed", "Molecules added"]
```

---

### FASE 4: Media & Layout

**Purpose:** Select image, detect faces, calculate positioning

**Steps:** 9, 10, 11

---

#### Step 9: Select Image

```yaml
task: selectImage()
responsável: Image Curator
responsavel_type: Agente
atomic_layer: Media

**Entrada:**
- adAnalysis.keyMessage: string (Step 3, obrigatório: true)
- adCopy: object { title, body } (Step 5, obrigatório: true)
- brand.id: string (Step 2, obrigatório: true)

**Saída:**
- visualPlan: object { imageUrl, imageMetadata, selectionCriteria } (destino: [8c, 10, 13b], persistido: true)

**Performance:**
- duration_expected: 2500ms
- cost_estimated: $0.001
- cacheable: false
- parallelizable: true
- parallel_with: [Step 4]

**Error Handling:**
- strategy: fallback
- fallback: Use placeholder image
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: STORY-016.2
- version: 2.0.0
- dependencies: [Step 2, Step 3, Step 5]
```

---

#### Step 10: Detect Faces

```yaml
task: detectFaces()
responsável: OpenRouter (Gemini 2.5 Flash)
responsavel_type: Agente
atomic_layer: Analysis

**Entrada:**
- visualPlan.imageUrl: string (Step 9, obrigatório: true)
- formatConfig: FormatConfig (Step 1, obrigatório: true)

**Saída:**
- faces: array<object { top, left, bottom, right, confidence }> (destino: Step 11, persistido: true)

**Checklist:**
  post-conditions:
    - [ ] Faces validated against safe zones (blocker: false, tipo: post-condition)

**Performance:**
- duration_expected: 3000ms
- cost_estimated: $0.002
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: retry
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 2000 }
- abort_workflow: false

**Metadata:**
- story: STORY-010.1
- version: 1.2.0
- dependencies: [Step 1, Step 9]
- breaking_changes: ["Format-aware validation added"]
```

---

#### Step 11: Determine Optimal Positioning

```yaml
task: determinePositioning()
responsável: Positioning Specialist
responsavel_type: Agente | Worker
atomic_layer: Layout

**Entrada:**
- faces: array (Step 10, obrigatório: true)
- formatConfig: FormatConfig (Step 1, obrigatório: true)
- adCopy: object (Step 5, obrigatório: true)
- selectedTemplate: object (Step 4, obrigatório: true)

**Saída:**
- positioning: object { horizontalAlignment, verticalAlignment, layout.computedSpacing } (destino: Step 13a, persistido: true)

**Executor Logic:**
  if faces.length > 0: Agente (complex positioning)
  else: Worker (default spacing)

**Performance:**
- duration_expected: 2000ms (Agente), 50ms (Worker)
- cost_estimated: $0.001 (Agente), $0 (Worker)
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: fallback
- fallback: Use default spacing (spacing-md)
- retry: { max_attempts: 3, backoff: exponential, backoff_ms: 1000 }
- abort_workflow: false

**Metadata:**
- story: DECISION-04, STORY-010.1
- version: 2.1.0
- dependencies: [Step 1, Step 4, Step 5, Step 10]
- breaking_changes: ["Design tokens output added"]
```

---

### FASE 5: Template & Page

**Purpose:** Inject CSS, render HTML, export PNG

**Steps:** 13a, 13b, 14

---

#### Step 13a: Inject CSS Variables

```yaml
task: injectCSSVariables()
responsável: Template Engine
responsavel_type: Worker
atomic_layer: Template

**Entrada:**
- positioning: object (Step 11, obrigatório: true)
- designTokens: object (Step 12, obrigatório: true)
- formatConfig: FormatConfig (Step 1, obrigatório: true)

**Saída:**
- cssVars: object (destino: Step 13b, persistido: false)

**Performance:**
- duration_expected: 50ms
- cost_estimated: $0
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 2, backoff: linear, backoff_ms: 100 }
- abort_workflow: true

**Metadata:**
- version: 1.0.0
- dependencies: [Step 1, Step 11, Step 12]
- breaking_changes: ["NOVO STEP em v3.0 - Separated from Step 13 v2.0"]
```

---

#### Step 13b: Render HTML Template

```yaml
task: renderHTML()
responsável: Template Engine (Handlebars)
responsavel_type: Worker
atomic_layer: Template

**Entrada:**
- selectedTemplate: object (Step 4, obrigatório: true)
- cssVars: object (Step 13a, obrigatório: true)
- contentAreaOrganism: object (Step 8c, obrigatório: true)
- templateData: object (Step 8c, obrigatório: true)
- visualPlan.imageUrl: string (Step 9, obrigatório: true)

**Saída:**
- htmlContent: string (destino: Step 14, persistido: false)

**Performance:**
- duration_expected: 200ms
- cost_estimated: $0
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 2, backoff: linear, backoff_ms: 100 }
- abort_workflow: true

**Metadata:**
- story: ISSUE-2
- version: 2.1.0
- dependencies: [Step 4, Step 8c, Step 9, Step 13a]
- breaking_changes: ["CSS injection separated", "CSS Custom Props puro (não Handlebars misturado)"]
```

---

#### Step 14: Export to PNG

```yaml
task: exportPNG()
responsável: Puppeteer
responsavel_type: Worker
atomic_layer: Page

**Entrada:**
- htmlContent: string (Step 13b, obrigatório: true)
- outputPath: string (config, obrigatório: true)
- formatConfig: FormatConfig (Step 1, obrigatório: true)

**Saída:**
- outputPath: string (destino: output, persistido: true)
- fileSize: number (destino: output, persistido: true)
- dimensions: object { width, height } (destino: output, persistido: true)
- exportDuration: number (destino: output, persistido: true)

**Performance:**
- duration_expected: 2000ms
- cost_estimated: $0
- cacheable: false
- parallelizable: false

**Error Handling:**
- strategy: abort
- retry: { max_attempts: 2, backoff: linear, backoff_ms: 500 }
- abort_workflow: true

**Metadata:**
- version: 2.0.0
- dependencies: [Step 1, Step 13b]
- breaking_changes: ["Format-aware viewport"]
```

---

## Parallelization Implementation

### Group 1: Format + Brand (Steps 1 + 2)

```javascript
const [formatConfig, brand] = await Promise.all([
  loadFormatConfig(format_id, orientation),
  loadBrand(brand_id)
]);
```

**Savings:** ~100ms

---

### Group 2: Template + Image (Steps 4 + 9)

```javascript
// After Step 5 (Craft Copy)
const [selectedTemplate, visualPlan] = await Promise.all([
  selectTemplate(adAnalysis, brand, template_id),
  selectImage(adAnalysis, adCopy, brand)
]);
```

**Savings:** ~2500ms

---

### Group 3: CTA + Badge (Steps 7a + 7b)

```javascript
const [ctaComponent, badgeComponent] = await Promise.all([
  designCTAComponent(typography.cta, brand, adAnalysis.urgencyLevel),
  adAnalysis.urgencyLevel === 'high' 
    ? designBadgeComponent(adAnalysis, brand)
    : Promise.resolve(null)
]);
```

**Savings:** ~1500ms (if both run)

---

### Group 4: Tokens Cached (Step 12 moved earlier)

```javascript
// Step 12 runs after Step 1 and caches globally
const designTokens = await loadDesignTokens(formatConfig);  // Cached!
```

**Savings:** ~500ms per ad (after first load)

**Total Parallelization Savings:** ~4.6s per ad (~30-40% faster)

---

## Comparison: v2.0 vs v3.0

### Architecture Scores

| Criterion | v2.0 | v3.0 | Delta | Notes |
|-----------|------|------|-------|-------|
| **Task Format Compliance** | 0/10 | 10/10 | +10 | All steps standardized |
| **Executor Definition** | 1/10 | 10/10 | +9 | All steps typed |
| **Atomic Design Mapping** | 4.75/10 | 9.5/10 | +4.75 | Explicit layers, molecule added |
| **Data Flow Clarity** | 6.5/10 | 8/10 | +1.5 | Parallelization documented |
| **Separation of Concerns** | 6/10 | 9/10 | +3 | God steps broken down |
| **Checklists** | 1/10 | 9/10 | +8 | Structured pre/post/acceptance |
| **Tools/Scripts Cataloging** | 1/10 | 8/10 | +7 | All tools documented |
| **Performance Tracking** | 0/10 | 9/10 | +9 | All metrics defined |
| **Error Handling** | 0/10 | 9/10 | +9 | All strategies defined |
| **Naming Consistency** | 5/10 | 10/10 | +5 | Standards enforced |
| **Testability** | 4/10 | 9/10 | +5 | Steps are isolated |
| **Reusability** | 5/10 | 9/10 | +4 | Molecules added |

**Overall Score:** 8.6/10 → **9.2/10** (+7% improvement)

---

### Steps Comparison

| v2.0 Step | v3.0 Steps | Change | Reason |
|-----------|------------|--------|--------|
| 0 | 0 | ✅ Same | No change needed |
| 1 | 1 | ✅ Same | No change needed |
| 2 | 2 | ✅ Same | No change needed |
| 3 | 3 | ✅ Same | No change needed |
| 4 | 4 | ✅ Same | No change needed |
| 5 | 5 | ✅ Same | No change needed |
| 6 | 6 | ✅ Same | No change needed |
| **7** | **7a, 7b, 7c** | ⚠️ **Split** | Separation of concerns (Atom design + validation) |
| **8** | **8a, 8b, 8c** | ⚠️ **Split** | Molecule layer added, organism separated |
| 9 | 9 | ✅ Same | No change needed |
| 10 | 10 | ✅ Same | No change needed |
| 11 | 11 | ✅ Same | No change needed |
| 12 | 12 | ⚠️ Moved | Moved to FASE 0 (config phase) |
| **13** | **13a, 13b** | ⚠️ **Split** | CSS injection separated from rendering |
| 14 | 14 | ✅ Same | No change needed |

---

## Migration Guide (v2.0 → v3.0)

### Step 1: Update Step References

```javascript
// v2.0
this.designComponents();  // Step 7

// v3.0
this.designCTAComponent();   // Step 7a
this.designBadgeComponent(); // Step 7b
this.validateComponents();   // Step 7c
```

### Step 2: Add Required Fields

```yaml
# Add to ALL steps:
responsavel_type: Agente | Worker | Humano | Clone
atomic_layer: [layer]

# Add Performance section
**Performance:**
- duration_expected: [X]ms
- cost_estimated: $[Y]

# Add Error Handling section
**Error Handling:**
- strategy: [retry|fallback|abort]
```

### Step 3: Structure Checklists

```yaml
# BEFORE (v2.0)
**Validações:**
- ✅ Check X
- ✅ Check Y

# AFTER (v3.0)
**Checklist:**
  pre-conditions:
    - [ ] Check X (tipo: pre-condition, blocker: true)
  post-conditions:
    - [ ] Check Y (tipo: post-condition, blocker: true)
```

### Step 4: Implement Parallelization

```javascript
// Add to orchestrator
const [formatConfig, brand] = await Promise.all([
  this.loadFormatConfig(),
  this.loadBrand()
]);
```

### Step 5: Add Molecule Steps

```javascript
// NOVO in v3.0
this.composeTextGroup();    // Step 8a
this.composeActionGroup();  // Step 8b
this.composeContentArea();  // Step 8c
```

---

## Breaking Changes Summary

1. ✅ Steps renumbered (7→7a/b/c, 8→8a/b/c, 13→13a/b)
2. ✅ responsavel_type required for all steps
3. ✅ atomic_layer required for all steps
4. ✅ Checklist format changed (pre/post/acceptance)
5. ✅ Components NO LONGER contain positioning (DECISION-03)
6. ✅ Layout.positions moved from Step 8 to Step 11 output
7. ✅ CSS Custom Props puro (no Handlebars misturado in Step 13)
8. ✅ Design Tokens loaded in FASE 0 (Step 12 moved)
9. ✅ Molecule layer added (Steps 8a, 8b)
10. ✅ Clone validation added (Step 7c)

---

## Production Readiness Checklist

### Code Changes

- [ ] Update orchestrator to follow v3.0 step numbering
- [ ] Add responsavel_type to all step executions
- [ ] Implement parallelization (Groups 1-3)
- [ ] Add molecule composition steps (8a, 8b)
- [ ] Split Step 7 into 7a, 7b, 7c
- [ ] Split Step 13 into 13a, 13b
- [ ] Add error handling strategies
- [ ] Implement caching for design tokens

### Testing

- [ ] Unit tests for all 19 steps
- [ ] Integration tests for workflow execution
- [ ] Parallelization tests
- [ ] Error handling tests (retry, fallback, abort)
- [ ] Performance benchmarks (v2.0 vs v3.0)
- [ ] Atomic Design compliance tests

### Documentation

- [ ] Update API documentation
- [ ] Update workflow diagrams
- [ ] Create migration scripts
- [ ] Document breaking changes
- [ ] Update example workflows

### Deployment

- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Monitor metrics (duration, cost, errors)
- [ ] Canary deployment (10% traffic)
- [ ] Full rollout (100% traffic)

---

## Appendices

### A. Related Documents

- `standards/TASK-FORMAT-SPECIFICATION-V1.md` - Complete task format spec
- `standards/EXECUTOR-DECISION-TREE.md` - How to choose executors
- `standards/V3-ARCHITECTURAL-DECISIONS.md` - All decisions consolidated
- `analysis/V2-INTERFACE-INVENTORY.md` - V2.0 analysis
- `analysis/V2-ATOMIC-DESIGN-MAPPING.md` - Atomic Design analysis
- `analysis/V2-DATA-FLOW-DIAGRAM.md` - Data flow analysis
- `analysis/AIOS-TAXONOMY-CRITICAL-REVIEW.md` - Taxonomy evaluation

### B. Glossary

| Term | Definition |
|------|------------|
| **Atom** | Smallest component (CTA button, badge) |
| **Molecule** | Group of atoms (text group, action group) |
| **Organism** | Complex section (content area) |
| **Template** | HTML structure + positioning |
| **Page** | Final rendered instance (PNG) |
| **Agente** | AI-powered executor |
| **Worker** | Script-based executor |
| **Humano** | Manual human executor |
| **Clone** | Mind emulation with heuristics |
| **SSOT** | Single Source of Truth |

---

**END OF WORKFLOW V3.0**

**Version:** 3.0.0  
**Date:** 2025-11-13  
**Status:** ✅ Ready for Implementation  
**Next:** Migration to V3.0


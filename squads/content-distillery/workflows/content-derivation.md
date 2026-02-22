---
id: WF-CD-003
name: Content Derivation Pipeline
version: 2.0.0
description: Derive platform-specific content from already-distilled knowledge (frameworks, heuristics, executive summaries)
trigger: manual | api | post-extraction
phases:
  - SEED
  - MULTIPLY
  - PRODUCE
agents_involved:
  - idea-multiplier
  - content-atomizer
  - ecosystem-designer
  - production-ops
quality_gates:
  - QG-DV-001: Content Seeds Valid
  - QG-DV-002: Multiplication Complete
  - QG-DV-003: Production Ready
modes:
  - single: Derive content from one distillation run
  - batch: Derive content from multiple distillation runs simultaneously
  - incremental: Add new derivations to existing content calendar
estimated_duration: 30-60 minutes (single) | 60-120 minutes (batch)
input: Distilled knowledge package (frameworks, heuristics, executive summary)
output: Publish-ready content pieces + distribution calendar + production report
---

# Content Derivation Pipeline

## Overview

The Content Derivation Pipeline is the third and final workflow of the Content Distillery squad. It operates downstream of both the Full Distillery Pipeline (WF-CD-001) and the Framework Extraction Pipeline (WF-CD-002), consuming their structured knowledge outputs and transforming them into platform-specific, publish-ready content pieces.

Where the extraction workflows answer "What does this expert know?", the derivation pipeline answers "What content can we create from what this expert knows?" It takes the intellectual assets -- frameworks, heuristics, mental models, progressive summaries -- and systematically multiplies them into dozens of content atoms optimized for different platforms, audiences, and formats.

This workflow is the revenue-generating stage. The extraction workflows build the knowledge base; this workflow monetizes it.

### Core Design Principles

1. **One Framework, Many Angles**: Every framework produces content across all 4A categories and multiple formats
2. **Platform-Native**: Content is born for its platform, not adapted after the fact
3. **Quality Over Quantity**: Scoring and prioritization ensure only high-potential ideas enter production
4. **Ecosystem Thinking**: Content pieces link to each other across platforms, creating a reinforcing distribution network
5. **Batch Efficiency**: Processing multiple frameworks simultaneously reduces context-switching overhead

### When to Use This Workflow

| Scenario | Use This? | Notes |
|----------|-----------|-------|
| After Full Distillery Pipeline | YES | Natural continuation from Phase 5-6 |
| After Framework Extraction | YES | Converts KB entries into content |
| Standalone with existing frameworks | YES | Load any structured framework file |
| Raw transcript without extraction | NO | Run WF-CD-001 or WF-CD-002 first |
| Quick social media post | NO | Overkill; write directly |

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONTENT DERIVATION PIPELINE                            │
│                                                                             │
│  INPUT: Distilled Knowledge Package                                         │
│    │    (frameworks.yaml + heuristics.yaml + executive-summary.md)          │
│    │                                                                        │
│    ▼                                                                        │
│  ┌────────────────────┐  QG-DV-001  ┌────────────────────┐                 │
│  │    PHASE 1: SEED   │────────────▶│  PHASE 2: MULTIPLY │                 │
│  │  (idea-multiplier) │             │(idea-multiplier +   │                 │
│  │                    │             │ content-atomizer)    │                 │
│  └────────────────────┘             └─────────┬──────────┘                 │
│                                               │ QG-DV-002                   │
│                                               ▼                             │
│                                     ┌────────────────────┐                 │
│                                     │ PHASE 3: PRODUCE   │                 │
│                                     │(content-atomizer +  │                │
│                                     │ ecosystem-designer + │                │
│                                     │ production-ops)      │                │
│                                     └─────────┬──────────┘                 │
│                                               │ QG-DV-003                   │
│                                               ▼                             │
│  OUTPUT: Publish-Ready Content + Distribution Calendar + Report             │
└─────────────────────────────────────────────────────────────────────────────┘

BATCH MODE (multiple sources):

  Source A ──▶ SEED A ──┐
  Source B ──▶ SEED B ──┼──▶ MERGED MULTIPLY ──▶ UNIFIED PRODUCE
  Source C ──▶ SEED C ──┘
```

### Agent Activation Sequence

```
Phase 1 (SEED):     idea-multiplier ──────────────────────▶ Content Seeds
Phase 2 (MULTIPLY): idea-multiplier + content-atomizer ───▶ Scored Content Atoms
Phase 3 (PRODUCE):  content-atomizer + ecosystem-designer ▶ Distribution Calendar
                    + production-ops ──────────────────────▶ Publish-Ready Content
```

---

## Prerequisites

### Required Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `frameworks` | YAML file | YES | Identified frameworks from extraction pipeline |
| `heuristics` | YAML file | YES | Extracted heuristics from extraction pipeline |
| `executive_summary` | Markdown file | YES | Executive summary from progressive summarization |
| `metadata` | YAML file | NO | Source video metadata (expert name, domain, date) |
| `target_platforms` | list | NO | Platforms to target (default: all) |
| `target_audience` | string | NO | Primary audience descriptor |
| `content_goals` | list | NO | Specific content objectives for this derivation |
| `existing_calendar` | YAML file | NO | Existing content calendar for incremental mode |
| `brand_voice` | YAML file | NO | Brand voice guide for tone consistency |
| `language` | string | NO | Content language (default: pt-BR) |

### Input Validation Rules

```yaml
validation:
  frameworks:
    - file_exists: true
    - format: valid YAML
    - min_frameworks: 1
    - required_fields_per_framework:
      - name
      - components
      - application (or application_conditions)
    - action_if_invalid: ABORT with error DV-INPUT-001

  heuristics:
    - file_exists: true
    - format: valid YAML
    - min_heuristics: 1
    - required_fields_per_heuristic:
      - rule (If/Then format)
      - domain
    - action_if_invalid: ABORT with error DV-INPUT-002

  executive_summary:
    - file_exists: true
    - format: valid Markdown
    - min_word_count: 50
    - action_if_invalid: WARN and proceed (seeds will be less contextualized)
```

### Required Data

| Data | Location | Purpose |
|------|----------|---------|
| Platform Specs | `data/platform-specs.yaml` | Content formatting rules per platform |
| Content Templates | `templates/content/` | Platform-specific content templates |
| 4A Framework Reference | `data/four-a-framework.yaml` | 4A category definitions and examples |
| Scoring Rubric | `data/content-scoring-rubric.yaml` | Idea quality scoring criteria |
| Brand Voice Guide | `data/brand-voice.yaml` | Tone, style, vocabulary preferences |

### Required Tools

| Tool | Purpose | Phase |
|------|---------|-------|
| jq | YAML/JSON processing | ALL |
| markdown-lint | Content quality checking | PRODUCE |

---

## Pipeline Context Object

The pipeline maintains a shared context object that flows between phases and accumulates state. Every agent reads from and writes to this object.

```yaml
pipeline_context:
  # Immutable (set at start)
  run_id: "DV-{timestamp}"
  mode: "single | batch | incremental"
  language: "pt-BR"
  started_at: "2026-02-12T14:00:00Z"

  # Source tracking
  sources:
    - source_id: "SRC-001"
      slug: "alex_hormozi_100m_leads_ep47"
      expert: "Alex Hormozi"
      domain: "business growth"
      frameworks_count: 5
      heuristics_count: 12
      frameworks_path: "outputs/distillery/{slug}/frameworks.yaml"
      heuristics_path: "outputs/distillery/{slug}/heuristics.yaml"
      executive_summary_path: "outputs/distillery/{slug}/distilled/executive-summary.md"

  # Phase 1 output
  seeds:
    total: 0
    by_source: {}
    by_framework: {}
    by_4a_category: {}
    seed_objects: []

  # Phase 2 output
  atoms:
    total: 0
    by_platform: {}
    by_format: {}
    by_score_tier: {}
    atom_objects: []
    rejected_count: 0
    rejection_reasons: {}

  # Phase 3 output
  production:
    total_produced: 0
    total_scheduled: 0
    calendar_span: {start: null, end: null}
    quality_scores: {}
    ecosystem_links: []

  # Quality tracking
  quality_gates:
    QG-DV-001: {status: null, timestamp: null, details: {}}
    QG-DV-002: {status: null, timestamp: null, details: {}}
    QG-DV-003: {status: null, timestamp: null, details: {}}

  # Error tracking
  errors: []
  warnings: []
  retries: []
```

### Checkpoint System

The pipeline saves state after each phase, enabling recovery from failures without re-processing completed phases.

```yaml
checkpoints:
  - id: CP-DV-001
    name: "Seeds Generated"
    after_phase: 1
    save_path: "outputs/distillery/{slug}/derivation/{run_id}/checkpoint_seeds.yaml"
    contains: [pipeline_context.seeds, pipeline_context.quality_gates.QG-DV-001]
    restore_action: "Skip Phase 1, load seeds, proceed to Phase 2"

  - id: CP-DV-002
    name: "Atoms Scored"
    after_phase: 2
    save_path: "outputs/distillery/{slug}/derivation/{run_id}/checkpoint_atoms.yaml"
    contains: [pipeline_context.atoms, pipeline_context.quality_gates.QG-DV-002]
    restore_action: "Skip Phase 1-2, load atoms, proceed to Phase 3"

  - id: CP-DV-003
    name: "Production Complete"
    after_phase: 3
    save_path: "outputs/distillery/{slug}/derivation/{run_id}/checkpoint_production.yaml"
    contains: [full pipeline_context]
    restore_action: "Pipeline complete, regenerate report only"
```

---

## Phase 1: SEED (Content Seeds)

### Purpose

Load all distilled knowledge artifacts, parse and understand the frameworks and heuristics, and generate raw content seeds. A content seed is a pairing of (knowledge element) x (angle) that represents a viable content idea before format or platform assignment. This phase is about divergent thinking: maximize the number of viable seeds.

### Agent: idea-multiplier (Nicolas Cole & Dickie Bush persona)

The idea-multiplier agent approaches each framework with the mindset of a prolific digital writer who has published 1,000+ pieces of online content. It systematically applies the 4A Framework to find every possible angle, then enriches each angle with specific hooks and value propositions.

### Step-by-Step Process

#### Step 1.1: Knowledge Package Loading

```
INPUT:  Framework files + Heuristic files + Executive summary
ACTION: Parse, validate, and build internal knowledge graph
OUTPUT: Structured knowledge graph with relationships
```

**Loading Process:**

1. Parse `frameworks.yaml` and extract each framework:
   - Name, components, application conditions, limitations
   - Confidence level and evidence strength
   - Source expert and domain

2. Parse `heuristics.yaml` and extract each heuristic:
   - If/Then rule statement
   - Domain and boundary conditions
   - Reliability rating

3. Parse `executive-summary.md` and extract:
   - Top 3 insights (for headline generation)
   - Expert's unique perspective (for differentiation angles)
   - Counter-intuitive findings (for curiosity hooks)
   - Bottom line statement (for CTA generation)

4. Build relationships:
   - Which heuristics implement which frameworks
   - Which frameworks support or contradict each other
   - Which elements are most novel vs most practical

**Knowledge Graph Schema:**

```yaml
knowledge_graph:
  nodes:
    - id: "FW-001"
      type: framework
      name: "Value Equation"
      novelty_score: 0.7
      practicality_score: 0.9
      emotional_resonance: 0.6
      controversy_potential: 0.3

    - id: "HE-001"
      type: heuristic
      rule: "If LTV > 3x CAC, then scale aggressively"
      novelty_score: 0.5
      practicality_score: 0.95
      emotional_resonance: 0.4
      controversy_potential: 0.2

  edges:
    - from: "HE-001"
      to: "FW-001"
      relationship: "implements"
      strength: 0.85
```

#### Step 1.2: 4A Angle Generation

```
INPUT:  Knowledge graph
ACTION: Apply 4A Framework to each knowledge node
OUTPUT: Raw angle catalog (knowledge x 4A = angles)
```

**4A Framework Application:**

For EACH framework and EACH significant heuristic, generate angles in all 4 categories:

**Category A: Actionable**
- How-to: "How to apply [framework] in [specific context]"
- Step-by-step: "[N] steps to implement [framework]"
- Template: "The [framework] template for [domain]"
- Checklist: "[Framework] checklist for [role/situation]"
- Tool: "Use [framework] to solve [specific problem]"

**Category B: Analytical**
- Breakdown: "Why [framework] works (the science behind it)"
- Comparison: "[Framework A] vs [Framework B]: when to use which"
- Case study: "How [expert] uses [framework] (real example)"
- Data: "The numbers behind [framework]"
- Mistake analysis: "Common mistakes when applying [framework]"

**Category C: Aspirational**
- Transformation: "How [framework] changed [expert's] results"
- Vision: "What happens when you master [framework]"
- Contrarian: "Everyone does X. [Expert] does Y instead."
- Identity: "The type of person who uses [framework]"
- Future: "Where [framework] is heading in [year]"

**Category D: Anthropological**
- Observation: "I noticed something about people who [framework-related behavior]"
- Trend: "[Industry] is shifting from [old] to [framework]"
- Cultural: "Why [culture/generation] gravitates toward [framework]"
- Pattern: "The hidden pattern in how top performers use [framework]"
- History: "How [framework] evolved from [origin] to [current form]"

**Angle Template:**

```yaml
angle_id: "ANG-{sequence}"
source_element: "FW-001 | HE-003"
source_name: "Value Equation"
four_a_category: "actionable | analytical | aspirational | anthropological"
four_a_subtype: "how_to | breakdown | transformation | observation"
angle_title: "The Value Equation Checklist for SaaS Founders"
hook_concept: "Most founders optimize price. Top founders optimize value."
value_proposition: "Reader gets a reusable checklist to evaluate their offer"
target_who: "SaaS founders $1M-$10M ARR"
novelty_score: 0.7
resonance_score: 0.8
practicality_score: 0.9
controversy_score: 0.3
composite_score: 0.0     # Calculated in Phase 2
```

#### Step 1.3: Heuristic-Specific Seed Generation

```
INPUT:  Heuristics from knowledge graph
ACTION: Generate seeds specifically optimized for heuristic-based content
OUTPUT: Heuristic seeds (supplement angle catalog)
```

**Heuristic Seed Types:**

Heuristics have unique content potential because they are inherently actionable. For each heuristic with reliability >= medium:

1. **Decision Flowchart Seed**: "When [condition] -> Do [action]" visual content
2. **Story Seed**: "The time [condition] was true and [action] saved the day"
3. **Anti-Pattern Seed**: "What happens when you ignore: If [condition] then [action]"
4. **Nuance Seed**: "The boundary conditions of [heuristic] that nobody discusses"
5. **Stack Seed**: "[Heuristic A] + [Heuristic B] = [Compound effect]"

```yaml
heuristic_seed:
  seed_id: "HSEED-{sequence}"
  source_heuristic: "HE-001"
  seed_type: "decision_flowchart | story | anti_pattern | nuance | stack"
  title: "The LTV/CAC Decision Tree for Growth Stage"
  description: "Visual flowchart showing when to scale vs when to optimize"
  content_sketch: |
    Start: What is your LTV:CAC ratio?
    > 3:1 -> Scale aggressively (increase spend)
    2:1 - 3:1 -> Optimize first, then scale
    < 2:1 -> Fix unit economics before any spend
  potential_formats: ["carousel", "infographic", "thread"]
```

#### Step 1.4: Cross-Element Seed Generation

```
INPUT:  Knowledge graph with relationships
ACTION: Generate seeds from framework combinations and tensions
OUTPUT: Cross-element seeds
```

**Cross-Element Seed Types:**

1. **Synergy Seeds**: "How [Framework A] + [Framework B] create a compound effect"
2. **Tension Seeds**: "The tension between [Framework A] and [Framework B] (and how to resolve it)"
3. **Hierarchy Seeds**: "The order in which to apply [Framework A], then [Framework B], then [Framework C]"
4. **Evolution Seeds**: "From [basic heuristic] to [advanced framework]: the expertise progression"
5. **Debate Seeds**: "[Framework A] says X. [Framework B] says Y. Who is right?"

```yaml
cross_element_seed:
  seed_id: "XSEED-{sequence}"
  source_elements: ["FW-001", "FW-003"]
  relationship: "synergy | tension | hierarchy | evolution | debate"
  title: "Value Equation + CLOSER Framework: The Complete Sales Stack"
  description: "How these two frameworks work together as a system"
  unique_insight: "Most people use these independently; combining them creates..."
  content_potential: high
```

#### Step 1.5: Seed Catalog Assembly

```
INPUT:  All seeds (angle-based + heuristic-specific + cross-element)
ACTION: Deduplicate, validate, and organize into seed catalog
OUTPUT: Complete seed catalog with metadata
```

**Deduplication Rules:**
- Seeds with > 0.85 semantic similarity are merged (keep the one with higher novelty)
- Seeds that cover identical framework-angle combinations are merged
- Seeds from the same source but different heuristic types are kept (they serve different formats)

**Seed Catalog Format:**

```yaml
seed_catalog:
  run_id: "DV-{timestamp}"
  generation_date: "2026-02-12"
  source_count: 1
  total_seeds: 87
  by_type:
    angle_seeds: 60
    heuristic_seeds: 15
    cross_element_seeds: 12
  by_4a_category:
    actionable: 25
    analytical: 22
    aspirational: 20
    anthropological: 20
  by_source_element:
    FW-001: 18
    FW-002: 15
  seeds: [...]
```

### Quality Gate QG-DV-001: Content Seeds Valid

| Criterion | Threshold | Measurement | Action if Failed |
|-----------|-----------|-------------|------------------|
| Total seeds generated | >= 20 per source | Count seeds / sources | Generate more angles (relax novelty filter) |
| 4A category coverage | All 4 categories represented | Distinct categories | Generate missing categories specifically |
| Framework coverage | >= 80% frameworks have seeds | Covered / total frameworks | Generate seeds for uncovered frameworks |
| Heuristic coverage | >= 50% heuristics have seeds | Covered / total heuristics | Focus on high-reliability heuristics |
| Deduplication rate | < 30% duplicates found | Duplicates / initial count | Review generation diversity |
| Seed quality minimum | >= 80% seeds have all required fields | Complete / total | Fix incomplete seeds |

**QG-DV-001 Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All criteria PASS | Proceed to Phase 2 |
| < 20 seeds but > 10 | Proceed with WARNING |
| < 10 seeds total | HALT - insufficient knowledge input |
| Missing 4A category | Generate targeted seeds for missing category |
| Low framework coverage | Generate seeds for uncovered frameworks |
| High duplication | Review knowledge graph for structural issues |

### Checkpoint CP-DV-001: Seeds Generated

```yaml
checkpoint:
  id: CP-DV-001
  save_path: "outputs/distillery/{slug}/derivation/{run_id}/checkpoint_seeds.yaml"
  contents:
    - seed_catalog (complete)
    - knowledge_graph
    - QG-DV-001 result
    - pipeline_context (partial)
  restore_instructions: |
    1. Load checkpoint file
    2. Verify seed catalog integrity (count matches metadata)
    3. Skip Phase 1 entirely
    4. Set pipeline_context.seeds from checkpoint
    5. Proceed to Phase 2 Step 2.1
```

### Handoff to Phase 2

**Handoff Contract:**
```yaml
from: idea-multiplier
to: idea-multiplier + content-atomizer
artifact: pipeline_context.seeds
required_data:
  - seed_catalog with >= 20 seeds
  - knowledge_graph with relationships
  - QG-DV-001 status: PASS or PASS_WITH_WARNINGS
validation:
  - All seeds have required fields
  - All 4A categories represented
  - Source element references are valid
signals:
  high_novelty_seeds: [count of seeds with novelty > 0.8]
  high_controversy_seeds: [count of seeds with controversy > 0.6]
  batch_mode: [boolean]
  source_count: [N]
```

---

## Phase 2: MULTIPLY (Content Multiplication)

### Purpose

Take the raw content seeds from Phase 1 and multiply each into format-specific, platform-specific content atoms. Apply the 4A framework scoring and prioritization to determine which atoms are worth producing. Reject low-potential atoms early to focus production resources on high-impact content. This phase transitions from divergent thinking (many ideas) to convergent thinking (best ideas).

### Agents: idea-multiplier (Cole & Bush) + content-atomizer (Gary Vee)

The idea-multiplier scores and prioritizes seeds while the content-atomizer transforms top seeds into platform-native content atoms with complete structural outlines.

### Step-by-Step Process

#### Step 2.1: Format Variation Matrix

```
INPUT:  Seed catalog
ACTION: Cross each seed with viable format options
OUTPUT: Seed-format matrix (expanded catalog)
```

**Format Catalog:**

| Format ID | Format Name | Platform | Length | Production Effort | Best For |
|-----------|-------------|----------|--------|-------------------|----------|
| FMT-01 | Twitter/X Thread | Twitter/X | 5-15 tweets | Low | Actionable, Analytical |
| FMT-02 | LinkedIn Post | LinkedIn | 200-300 words | Low | All 4A categories |
| FMT-03 | LinkedIn Carousel | LinkedIn | 8-12 slides | Medium | Actionable, Analytical |
| FMT-04 | Instagram Carousel | Instagram | 8-10 slides | Medium | Actionable, Aspirational |
| FMT-05 | Instagram Reel Script | Instagram | 30-60 seconds | Medium | Aspirational, Anthropological |
| FMT-06 | YouTube Short Script | YouTube | 30-60 seconds | Medium | All 4A categories |
| FMT-07 | YouTube Long-form Outline | YouTube | 8-15 minutes | High | Analytical, Actionable |
| FMT-08 | Newsletter Section | Email | 500-800 words | Medium | Analytical, Actionable |
| FMT-09 | Blog Post Outline | Website | 1500-2500 words | High | All 4A categories |
| FMT-10 | Story/Status | IG/LinkedIn | 1-3 slides | Very Low | Aspirational, Anthropological |

**Format-Seed Compatibility Rules:**

```yaml
compatibility_rules:
  actionable:
    best_formats: [FMT-01, FMT-02, FMT-03, FMT-04, FMT-08, FMT-09]
    viable_formats: [FMT-06, FMT-07]
    poor_formats: [FMT-05, FMT-10]

  analytical:
    best_formats: [FMT-01, FMT-02, FMT-03, FMT-07, FMT-08, FMT-09]
    viable_formats: [FMT-04, FMT-06]
    poor_formats: [FMT-05, FMT-10]

  aspirational:
    best_formats: [FMT-02, FMT-04, FMT-05, FMT-06, FMT-10]
    viable_formats: [FMT-01, FMT-08]
    poor_formats: [FMT-03, FMT-07, FMT-09]

  anthropological:
    best_formats: [FMT-01, FMT-02, FMT-05, FMT-06, FMT-08]
    viable_formats: [FMT-09, FMT-10]
    poor_formats: [FMT-03, FMT-04, FMT-07]
```

**Expansion Process:**
1. For each seed, identify compatible formats (best + viable)
2. Create a seed-format pair for each compatible combination
3. Inherit seed scores but adjust for format fit
4. Result: Each seed generates 4-8 seed-format pairs

#### Step 2.2: Composite Scoring

```
INPUT:  Expanded seed-format matrix
ACTION: Score each seed-format pair using weighted rubric
OUTPUT: Scored and ranked content atoms
```

**Scoring Rubric:**

```yaml
scoring_rubric:
  dimensions:
    novelty:
      weight: 0.20
      description: "How new or surprising is this angle for the target audience"
      scale:
        0.9-1.0: "Never seen before - paradigm shifting"
        0.7-0.8: "Uncommon perspective - most haven't considered this"
        0.5-0.6: "Somewhat novel - adds nuance to known ideas"
        0.3-0.4: "Familiar territory with minor twist"
        0.0-0.2: "Common knowledge repackaged"

    resonance:
      weight: 0.25
      description: "How emotionally engaging and shareable"
      scale:
        0.9-1.0: "Would stop scrolling AND share immediately"
        0.7-0.8: "Would stop scrolling, might share"
        0.5-0.6: "Interesting enough to read fully"
        0.3-0.4: "Skimmable, low emotional trigger"
        0.0-0.2: "Scroll past without reading"

    practicality:
      weight: 0.25
      description: "How directly and immediately applicable"
      scale:
        0.9-1.0: "Can apply within 1 hour of reading"
        0.7-0.8: "Can apply within 1 day"
        0.5-0.6: "Requires some adaptation to apply"
        0.3-0.4: "Theoretical, needs significant adaptation"
        0.0-0.2: "Pure theory, no clear application path"

    format_fit:
      weight: 0.15
      description: "How well this content maps to the chosen format"
      scale:
        0.9-1.0: "Born for this format - perfect natural fit"
        0.7-0.8: "Strong fit with minor adjustments"
        0.5-0.6: "Adequate fit, works but not optimal"
        0.3-0.4: "Forced fit - content fights the format"
        0.0-0.2: "Wrong format entirely"

    production_efficiency:
      weight: 0.15
      description: "Effort required relative to expected impact"
      scale:
        0.9-1.0: "Very low effort, high impact (quick win)"
        0.7-0.8: "Moderate effort, high impact"
        0.5-0.6: "Proportional effort to impact"
        0.3-0.4: "High effort, moderate impact"
        0.0-0.2: "Very high effort, uncertain impact"

  composite_formula: |
    composite = (novelty * 0.20) + (resonance * 0.25) + (practicality * 0.25)
              + (format_fit * 0.15) + (production_efficiency * 0.15)

  tier_thresholds:
    tier_1_priority: ">= 0.75 (produce immediately)"
    tier_2_calendar: ">= 0.55 (schedule for production)"
    tier_3_backlog: ">= 0.40 (save for later)"
    rejected: "< 0.40 (discard)"
```

#### Step 2.3: Prioritization and Tier Assignment

```
INPUT:  Scored content atoms
ACTION: Sort by composite score, assign tiers, check diversity
OUTPUT: Tiered and prioritized atom catalog
```

**Prioritization Rules:**

1. Sort all atoms by composite_score descending
2. Assign tiers based on thresholds
3. Apply diversity constraints:
   - No more than 3 atoms from the same framework in Tier 1
   - All 4A categories must be represented in Tier 1+2 combined
   - At least 3 platforms represented in Tier 1+2 combined
   - At least 2 "quick wins" (low effort, FMT-01 or FMT-02) in Tier 1
4. If diversity constraints are violated, promote next-best atom from underrepresented category

**Tier Assignments:**

```yaml
tier_assignment:
  tier_1_priority:
    max_count: 15
    production_deadline: "immediate"
    quality_standard: "premium"
    review_required: true

  tier_2_calendar:
    max_count: 30
    production_deadline: "within 7 days"
    quality_standard: "standard"
    review_required: true

  tier_3_backlog:
    max_count: unlimited
    production_deadline: "when capacity allows"
    quality_standard: "standard"
    review_required: false

  rejected:
    action: "log reason, do not produce"
    retention: "keep for 90 days then purge"
```

#### Step 2.4: Content Atom Structuring

```
INPUT:  Tier 1 and Tier 2 atoms
ACTION: Expand each atom into a structured content outline
AGENT:  content-atomizer (Gary Vee persona)
OUTPUT: Structured content atoms ready for production
```

**Content Atom Schema:**

```yaml
atom:
  atom_id: "CA-DV-{sequence}"
  source_seed: "ANG-003"
  source_framework: "Value Equation"
  source_expert: "Alex Hormozi"
  tier: 1
  composite_score: 0.82

  platform: "twitter"
  format: "thread"
  four_a_category: "actionable"
  title: "The Value Equation Checklist (steal this)"

  hook: |
    Most founders set prices by looking at competitors.
    Top founders set prices by engineering value.
    Here's the exact checklist Alex Hormozi uses:
  body_structure:
    - section: "What is the Value Equation"
      key_point: "Value = (Dream Outcome x Perceived Likelihood) / (Time x Effort)"
      supporting_detail: "Each variable is a lever you can pull"
    - section: "The 4-Step Audit"
      key_point: "Score each variable 1-10 for your current offer"
      supporting_detail: "Most offers score < 5 on Dream Outcome"
    - section: "Quick Fix: Increase Perceived Likelihood"
      key_point: "Add guarantees, case studies, social proof"
      supporting_detail: "This is the cheapest variable to improve"
    - section: "The Mistake 90% Make"
      key_point: "They optimize price instead of the equation"
      supporting_detail: "Price is the OUTPUT, not the INPUT"
  cta: "Save this thread. Next time you think about changing your price, run the equation first."
  hashtags: ["pricing", "saas", "hormozi"]

  estimated_word_count: 800
  estimated_production_time: "20 minutes"
  dependencies: []
  series_potential: true
  series_name: "Value Engineering Series"
  series_position: 1

  predicted_engagement:
    impressions: "medium-high"
    saves: "high"
    shares: "medium"
    comments: "medium"
    reasoning: "Actionable checklist content consistently performs well for saves"
```

#### Step 2.5: Series and Ecosystem Detection

```
INPUT:  All structured atoms
ACTION: Identify natural series, sequences, and ecosystem links
OUTPUT: Atom relationship map
```

**Detection Rules:**

1. **Series Detection**: Atoms from the same framework across different 4A categories form a natural series
2. **Sequence Detection**: Atoms that logically build on each other
3. **Cross-Platform Links**: Same insight adapted for different platforms
4. **Pillar-Derivative Mapping**: Long-form pieces that shorter content promotes

**Ecosystem Map Format:**

```yaml
ecosystem_map:
  series:
    - series_id: "SER-001"
      name: "Value Engineering Series"
      atoms: ["CA-DV-001", "CA-DV-005", "CA-DV-012"]
      recommended_order: ["CA-DV-001", "CA-DV-005", "CA-DV-012"]
      cadence: "1 per week"

  sequences:
    - sequence_id: "SEQ-001"
      name: "Framework Introduction Sequence"
      atoms: ["CA-DV-001", "CA-DV-003", "CA-DV-007", "CA-DV-015"]
      logic: "beginner -> intermediate -> advanced -> mastery"

  cross_platform_links:
    - link_id: "XPL-001"
      from_atom: "CA-DV-001"
      to_atom: "CA-DV-020"
      link_type: "teaser_to_pillar"
      cta_text: "Full breakdown in the video"

  pillar_derivatives:
    - pillar: "CA-DV-020"
      derivatives: ["CA-DV-001", "CA-DV-005", "CA-DV-008"]
      distribution_strategy: "derivatives publish 2-3 days before pillar"
```

### Quality Gate QG-DV-002: Multiplication Complete

| Criterion | Threshold | Measurement | Action if Failed |
|-----------|-----------|-------------|------------------|
| Tier 1 atoms | >= 5 | Count Tier 1 | Lower threshold or improve seed quality |
| Tier 1 + Tier 2 atoms | >= 15 | Count Tier 1+2 | Generate more format variations |
| Platform diversity (T1+T2) | >= 3 platforms | Distinct platforms | Generate for missing platforms |
| 4A diversity (T1+T2) | All 4 categories | Distinct categories | Generate missing categories |
| Quick wins (T1) | >= 2 low-effort atoms | Count low-effort T1 | Promote best quick wins |
| Atom completeness | 100% T1 atoms have full structure | Schema validation | Complete missing fields |
| Rejection rate | < 60% of total scored | Rejected / total | Review scoring calibration |
| Series identified | >= 1 series | Series count | OK if absent (single framework) |
| Ecosystem links | >= 2 cross-platform links | Link count | Generate platform variants |

**QG-DV-002 Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All criteria PASS | Proceed to Phase 3 |
| < 5 Tier 1 but > 3 | Proceed with WARNING |
| < 3 Tier 1 | HALT - review seed quality or scoring |
| Low platform diversity | Generate targeted atoms for missing platforms |
| High rejection rate | Recalibrate scoring or improve seed quality |
| No series or ecosystem | Proceed (acceptable for single-framework runs) |

### Checkpoint CP-DV-002: Atoms Scored

```yaml
checkpoint:
  id: CP-DV-002
  save_path: "outputs/distillery/{slug}/derivation/{run_id}/checkpoint_atoms.yaml"
  contents:
    - scored atom catalog (all tiers)
    - ecosystem map
    - QG-DV-002 result
    - pipeline_context (updated through Phase 2)
  restore_instructions: |
    1. Load checkpoint file
    2. Verify atom catalog integrity
    3. Skip Phase 1-2 entirely
    4. Set pipeline_context.atoms from checkpoint
    5. Proceed to Phase 3 Step 3.1
```

### Handoff to Phase 3

**Handoff Contract:**
```yaml
from: idea-multiplier + content-atomizer
to: content-atomizer + ecosystem-designer + production-ops
artifact: pipeline_context.atoms + ecosystem_map
required_data:
  - Tier 1 atoms: fully structured with outlines
  - Tier 2 atoms: fully structured with outlines
  - Ecosystem map: series + sequences + cross-platform links
  - QG-DV-002 status: PASS or PASS_WITH_WARNINGS
validation:
  - All Tier 1 atoms have complete atom schema
  - All Tier 2 atoms have complete atom schema
  - Ecosystem map references valid atom IDs
signals:
  pillar_content_present: [boolean]
  series_count: [N]
  quick_win_count: [N]
  highest_score: [score of top atom]
  batch_source_count: [N sources in batch mode]
```

---

## Phase 3: PRODUCE (Production & Distribution)

### Purpose

Transform structured content atoms into publish-ready final copy, organize them into a distribution calendar with an ecosystem strategy, and perform quality review. This is the production line: raw materials (atoms) go in, finished goods (publishable content) come out.

### Agents: content-atomizer (Gary Vee) + ecosystem-designer (Dan Koe) + production-ops (Justin Welsh)

Three agents collaborate in sequence:
1. **content-atomizer** performs final atomization and platform formatting
2. **ecosystem-designer** designs the distribution calendar and cross-platform strategy
3. **production-ops** handles batch production, quality review, and final polish

### Step-by-Step Process

#### Step 3.1: Platform-Specific Atomization

```
INPUT:  Structured content atoms (Tier 1 + Tier 2)
ACTION: Expand each atom into platform-native final draft
AGENT:  content-atomizer (Gary Vee persona)
OUTPUT: Platform-formatted draft content
```

**Platform Production Rules:**

**Twitter/X Threads (FMT-01):**
- Tweet 1: Hook (max 280 chars, no links, open loop or bold claim)
- Tweets 2-N: One idea per tweet, semi-standalone, line breaks for readability
- Last tweet: Clear CTA (follow, save, reply), self-reply with link if promoting pillar content
- Total tweets: 5-15 optimal
- Thread connector: natural transitions

**LinkedIn Posts (FMT-02):**
- Line 1: Hook (max 150 chars visible without "see more")
- Body: Short paragraphs (1-2 sentences), liberal line breaks, 200-300 words total
- CTA: End with question or "repost if you agree"
- Hashtags: 3-5 at end

**Carousels (FMT-03, FMT-04):**
- Slide 1: Bold hook statement (max 10 words)
- Body slides: One point per slide (max 30 words per slide), consistent design
- Final slide: CTA (save, share, follow)
- Total slides: 8-12 optimal
- Caption: Summarize + hashtags (20-30 for Instagram, 5-10 for LinkedIn)

**Short-Form Scripts (FMT-05, FMT-06):**
- Hook: 0-3 seconds (pattern interrupt, must prevent swipe within 2 seconds)
- Body: 3-45 seconds (one insight only, show don't tell, text overlays)
- CTA: 45-60 seconds (follow for more, save this)
- Total duration: 30-60 seconds
- Include b-roll notes and text overlay script

**Newsletter Sections (FMT-08):**
- Headline: Benefit-driven (max 60 chars)
- Body: 500-800 words, personal anecdote/hook -> Framework -> Application -> CTA
- Subheadings every 150-200 words
- Bold key phrases, 1-2 pull quotes

#### Step 3.2: Distribution Calendar Design

```
INPUT:  All draft content + Ecosystem map
ACTION: Design multi-platform distribution calendar
AGENT:  ecosystem-designer (Dan Koe persona)
OUTPUT: Distribution calendar with publishing schedule
```

**Calendar Design Principles:**

1. **Pillar First**: Schedule long-form pillar content first, then derivatives around it
2. **Wave Strategy**: Pre-launch teasers -> Launch day -> Post-launch derivatives
3. **Platform Cadence**: Respect optimal posting frequency per platform
4. **Audience Journey**: Content should guide audience from one platform to another
5. **No Cannibalizing**: Same insight on different platforms spaced >= 48 hours apart

**Optimal Posting Cadence:**

| Platform | Frequency | Best Times (pt-BR) | Notes |
|----------|-----------|---------------------|-------|
| Twitter/X | 1-2/day | 8-9h, 12-13h, 18-19h | Threads perform best 8-9h |
| LinkedIn | 1/day | 7-8h, 12h, 17-18h | Carousels best early morning |
| Instagram | 1/day | 11-12h, 18-19h, 21h | Reels best 18-19h |
| YouTube Shorts | 3-5/week | 14-16h | Consistent timing matters most |
| YouTube Long | 1-2/week | 14-16h Sat/Sun | Weekends for long content |
| Newsletter | 1-2/week | 7-8h Tue/Thu | Tuesday and Thursday morning |

**Distribution Calendar Format:**

```yaml
distribution_calendar:
  span:
    start: "2026-02-13"
    end: "2026-03-12"
    total_days: 28

  waves:
    - wave_id: "WAVE-001"
      pillar: "CA-DV-020"
      pillar_date: "2026-02-20"
      pre_launch:
        - {atom_id: "CA-DV-001", date: "2026-02-17", platform: "twitter"}
        - {atom_id: "CA-DV-005", date: "2026-02-18", platform: "linkedin"}
      launch_day:
        - {atom_id: "CA-DV-020", date: "2026-02-20", platform: "youtube"}
        - {atom_id: "CA-DV-003", date: "2026-02-20", platform: "twitter"}
      post_launch:
        - {atom_id: "CA-DV-012", date: "2026-02-22", platform: "instagram"}
        - {atom_id: "CA-DV-015", date: "2026-02-24", platform: "newsletter"}

  statistics:
    total_pieces: 45
    by_platform: {twitter: 12, linkedin: 10, instagram: 8, youtube: 5, newsletter: 6, blog: 4}
    by_week: {week_1: 12, week_2: 12, week_3: 11, week_4: 10}
```

#### Step 3.3: Batch Production

```
INPUT:  Tier 1 and Tier 2 atoms with platform formatting rules
ACTION: Produce final copy for all scheduled atoms
AGENT:  production-ops (Justin Welsh persona)
OUTPUT: Publish-ready content files organized by platform
```

**Production Process per Atom:**

1. Load atom structure and platform template
2. Expand outline into full draft copy
3. Write hook -- must pass "scroll stop" test
4. Write body sections following outline structure
5. Write CTA matching platform best practices
6. Apply brand voice consistency check
7. Add hashtags and tags per platform rules
8. Format for platform requirements (character limits, slide counts)
9. Run spell check and grammar review
10. Score quality (see quality review below)

**Production Batch Ordering:**
1. Tier 1 atoms first (highest priority)
2. Within Tier 1: Quick wins first (FMT-01, FMT-02), then medium effort, then high effort
3. Tier 2 atoms second, same ordering
4. If batch mode: Interleave sources to maintain variety

#### Step 3.4: Quality Review

```
INPUT:  All produced content
ACTION: Review each piece against quality checklist
AGENT:  production-ops (Justin Welsh persona)
OUTPUT: Quality scores + revision notes + approved pieces
```

**Quality Review Checklist (per piece):**

```yaml
quality_checklist:
  content_quality:  # 50% weight
    - {id: CQ-01, check: "Hook creates curiosity or stops the scroll", weight: 0.15}
    - {id: CQ-02, check: "Core insight is clear and specific", weight: 0.15}
    - {id: CQ-03, check: "Claims are supported with evidence or logic", weight: 0.10}
    - {id: CQ-04, check: "CTA is clear and appropriate", weight: 0.10}

  format_compliance:  # 25% weight
    - {id: FC-01, check: "Character/word limits met", weight: 0.10}
    - {id: FC-02, check: "Platform formatting correct", weight: 0.08}
    - {id: FC-03, check: "Standalone comprehension", weight: 0.07}

  integrity:  # 25% weight
    - {id: IA-01, check: "Expert attributed correctly", weight: 0.10}
    - {id: IA-02, check: "No factual errors or misrepresentations", weight: 0.10}
    - {id: IA-03, check: "Original angle (not copy-paste from source)", weight: 0.05}

  scoring:
    formula: "Sum of (pass/fail * weight) across all checks"
    pass_threshold: 0.75
    excellence_threshold: 0.90
    fail_action: "Return to production for revision"
    max_revision_cycles: 2
```

**Quality Score Tiers:**

| Score | Status | Action |
|-------|--------|--------|
| >= 0.90 | EXCELLENT | Publish immediately |
| 0.75 - 0.89 | GOOD | Approve for publishing |
| 0.60 - 0.74 | NEEDS REVISION | Return for 1 revision cycle |
| < 0.60 | REJECT | Return to atom structuring phase |

#### Step 3.5: Final Output Assembly

```
INPUT:  All quality-approved content + calendar + ecosystem links
ACTION: Assemble complete production package
OUTPUT: Organized output directory ready for publishing
```

**Output Directory Structure:**

```
outputs/distillery/{slug}/derivation/{run_id}/
├── calendar.yaml
├── ecosystem_map.yaml
├── production_report.md
├── quality_report.md
├── content/
│   ├── twitter/
│   ├── linkedin/
│   ├── instagram/
│   ├── youtube/
│   └── newsletter/
├── metadata/
│   ├── atom_catalog.yaml
│   ├── seed_catalog.yaml
│   └── scoring_details.yaml
└── checkpoints/
    ├── checkpoint_seeds.yaml
    ├── checkpoint_atoms.yaml
    └── checkpoint_production.yaml
```

### Quality Gate QG-DV-003: Production Ready

| Criterion | Threshold | Measurement | Action if Failed |
|-----------|-----------|-------------|------------------|
| Tier 1 produced | 100% of Tier 1 atoms produced | Produced / Tier 1 total | Complete remaining productions |
| Tier 2 produced | >= 80% of Tier 2 atoms produced | Produced / Tier 2 total | OK if capacity limited |
| Quality pass rate | >= 90% of produced pieces pass QA | Passed / total produced | Revise failing pieces |
| Calendar complete | All produced pieces scheduled | Scheduled / produced | Schedule remaining pieces |
| Ecosystem links | All cross-platform links have CTAs | Linked / total links | Add missing CTAs |
| Platform compliance | 100% pieces meet format rules | Compliant / total | Fix formatting issues |
| Attribution | 100% pieces have source attribution | Attributed / total | Add missing attributions |
| No orphans | All pieces appear in calendar | Calendar entries / pieces | Schedule orphan pieces |

**QG-DV-003 Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All criteria PASS | Pipeline COMPLETE |
| Quality pass rate < 90% but > 75% | COMPLETE with WARNING |
| Quality pass rate < 75% | HALT - major quality issue |
| Calendar incomplete | Complete calendar before finishing |
| Missing attributions | HALT - add attributions (non-negotiable) |
| Tier 2 < 80% produced | COMPLETE with NOTE (capacity issue) |

---

## Batch Mode

### Overview

Batch mode processes multiple distillation sources simultaneously, producing a unified content calendar that draws from all sources.

### Batch Mode Differences

| Phase | Single Mode | Batch Mode |
|-------|------------|------------|
| Phase 1: SEED | One source -> seeds | N sources -> seeds (parallelized) |
| Phase 2: MULTIPLY | Score within source | Score across sources + generate cross-source atoms |
| Phase 3: PRODUCE | Single calendar | Unified calendar with source diversity |

### Cross-Source Seed Generation

After Step 1.5 of each source, batch mode adds cross-source seeds:
- **Comparison**: "[Expert A]'s approach vs [Expert B]'s approach to [topic]"
- **Synthesis**: "Combining [Expert A]'s [framework] with [Expert B]'s [framework]"
- **Debate**: "[Expert A] says X. [Expert B] says Y. Who's right?"
- **Evolution**: "From [Expert A]'s basic version to [Expert B]'s advanced version"
- **Meta-Pattern**: "3 experts agree on this one thing about [topic]"

### Batch Mode Configuration

```yaml
batch_config:
  max_sources: 10
  parallel_seeding: true
  cross_source_generation: true
  unified_calendar: true
  source_diversity_in_calendar:
    min_sources_per_week: 2
    max_same_source_consecutive: 3
  cross_source_seeds:
    min_per_source_pair: 2
    max_per_source_pair: 5
```

---

## Incremental Mode

### Overview

Incremental mode adds new derivations to an existing content calendar without disrupting already-scheduled content.

### Incremental Mode Rules

```yaml
incremental_rules:
  preserve_existing: true
  slot_finding: "earliest_available"
  duplicate_check: true
  similarity_threshold: 0.8
  backfill_gaps: true
```

---

## Error Handling

### Error Codes

| Code | Phase | Error | Recovery |
|------|-------|-------|----------|
| `DV-INPUT-001` | PRE | Invalid frameworks file | Request valid file, ABORT |
| `DV-INPUT-002` | PRE | Invalid heuristics file | Request valid file, ABORT |
| `DV-INPUT-003` | PRE | Missing executive summary | WARN, proceed with reduced context |
| `DV-SEED-001` | SEED | < 10 seeds generated | Relax novelty filter, re-generate |
| `DV-SEED-002` | SEED | Missing 4A category | Generate targeted seeds |
| `DV-SEED-003` | SEED | Knowledge graph build failure | Fallback to flat processing |
| `DV-MULTIPLY-001` | MULTIPLY | < 5 Tier 1 atoms | Lower tier threshold by 0.05 |
| `DV-MULTIPLY-002` | MULTIPLY | High rejection rate (> 60%) | Recalibrate scoring rubric |
| `DV-MULTIPLY-003` | MULTIPLY | No format diversity | Force at least 1 atom per format |
| `DV-PRODUCE-001` | PRODUCE | Quality pass rate < 75% | Flag for manual review |
| `DV-PRODUCE-002` | PRODUCE | Calendar conflict | Resolve conflicts, re-schedule |
| `DV-PRODUCE-003` | PRODUCE | Missing attribution | Add attribution, re-review |
| `DV-PRODUCE-004` | PRODUCE | Platform format violation | Reformat per platform specs |
| `DV-BATCH-001` | BATCH | Source merge conflict | Process sources sequentially |
| `DV-BATCH-002` | BATCH | Cross-source generation failure | Skip cross-source, proceed |
| `DV-INCR-001` | INCR | Calendar conflict with existing | Find next available slot |
| `DV-INCR-002` | INCR | Duplicate content detected | Replace with different angle |

### Recovery Procedures

```yaml
retry_policy:
  max_retries_per_phase: 3
  backoff: exponential
  base_delay: 15s
  max_delay: 120s
  on_max_retries: HALT_AND_SAVE_CHECKPOINT

degraded_mode:
  enabled: true
  conditions:
    - "Phase retried 3 times without full pass"
    - "User explicitly requests continuation"
  effects:
    - "Quality gate passes with DEGRADED status"
    - "Downstream phases receive degraded flag"
    - "Final output marked as NEEDS_REVIEW"
```

---

## Completion Report Template

```markdown
# Content Derivation - Completion Report

## Run Summary
- **Run ID**: [auto-generated]
- **Mode**: [single | batch | incremental]
- **Source(s)**: [list of sources]
- **Started**: [timestamp]
- **Completed**: [timestamp]
- **Status**: [COMPLETED | COMPLETED_WITH_WARNINGS | FAILED]

## Phase Results

| Phase | Status | Duration | Key Metric | Warnings |
|-------|--------|----------|------------|----------|
| SEED | [status] | [time] | [N] seeds generated | [N] |
| MULTIPLY | [status] | [time] | [N] atoms scored, [N] Tier 1 | [N] |
| PRODUCE | [status] | [time] | [N] pieces produced | [N] |

## Quality Gate Results

| Gate | Status | Score | Notes |
|------|--------|-------|-------|
| QG-DV-001 | [status] | [seeds count] | [notes] |
| QG-DV-002 | [status] | [T1/T2 count] | [notes] |
| QG-DV-003 | [status] | [pass rate]% | [notes] |

## Output Summary

| Platform | Pieces | Quality Avg |
|----------|--------|-------------|
| Twitter/X | [N] | [score] |
| LinkedIn | [N] | [score] |
| Instagram | [N] | [score] |
| YouTube | [N] | [score] |
| Newsletter | [N] | [score] |
| **Total** | **[N]** | **[avg]** |

## Calendar Overview
- **Span**: [start] to [end]
- **Pillar content**: [N] pieces
- **Series**: [N] identified
```

---

## Appendix: Configuration

### Default Configuration

```yaml
content_derivation:
  version: 2.0.0

  seed:
    min_seeds_per_source: 20
    four_a_required: true
    heuristic_seeds: true
    cross_element_seeds: true
    deduplication_threshold: 0.85

  multiply:
    tier_1_threshold: 0.75
    tier_2_threshold: 0.55
    tier_3_threshold: 0.40
    max_tier_1: 15
    max_tier_2: 30
    scoring_weights:
      novelty: 0.20
      resonance: 0.25
      practicality: 0.25
      format_fit: 0.15
      production_efficiency: 0.15
    diversity_constraints:
      max_same_framework_tier_1: 3
      require_all_4a_in_tier_1_2: true
      min_platforms_tier_1_2: 3
      min_quick_wins_tier_1: 2

  produce:
    quality_pass_threshold: 0.75
    quality_excellence_threshold: 0.90
    max_revision_cycles: 2
    batch_ordering: "tier_then_effort"
    calendar_design: true
    ecosystem_links: true

  batch:
    max_sources: 10
    parallel_seeding: true
    cross_source_generation: true

  incremental:
    preserve_existing: true
    duplicate_threshold: 0.80
    backfill_gaps: true
```

---

## Estimated Effort Table

| Phase | Single Mode | Batch Mode (3 sources) | Incremental |
|-------|------------|------------------------|-------------|
| Phase 1: SEED | 10-15 min | 25-35 min | 10-15 min |
| Phase 2: MULTIPLY | 10-20 min | 20-35 min | 10-20 min |
| Phase 3: PRODUCE | 15-30 min | 30-50 min | 10-20 min |
| **Total** | **35-65 min** | **75-120 min** | **30-55 min** |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-12 | Content Distillery Squad | Initial version with MULTIPLY/PRODUCE/OPTIMIZE phases |
| 2.0.0 | 2026-02-12 | Content Distillery Squad | Restructured to SEED/MULTIPLY/PRODUCE phases; added pipeline context object, checkpoint system, batch mode, incremental mode |

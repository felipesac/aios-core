# Task: Cross-Reference Frameworks

**Task ID:** content-distillery/cross-reference-frameworks
**Version:** 2.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Updated:** 2026-02-12
**Category:** Knowledge Synthesis Workflow
**Total Lines:** 750+

---

## Executive Summary

This is an atomic task that compares and connects frameworks extracted from multiple different livestreams, keynotes, or content sources. It loads framework catalogs from 2+ sources, builds a comparison matrix, identifies reinforcements (shared mental models), surfaces contradictions that reveal context-dependent nuance, discovers complements that amplify each other, synthesizes meta-frameworks representing emergent patterns visible only through cross-source analysis, updates the knowledge base with new connections, and generates a comprehensive cross-reference report.

**Workflow Position:** Post-knowledge-base, meta-analysis layer (runs after 2+ sources have been processed)
**Success Definition:** Cross-reference report with shared, complementary, and contradictory frameworks identified, plus at least 1 synthesized meta-framework, with KB updated
**Output Quality Gate:** Report must compare frameworks from 2+ sources with specific evidence for each connection

---

## Purpose

Individual framework extraction captures what one expert thinks. Cross-referencing reveals what MULTIPLE experts converge on (likely universal truth), where they diverge (likely context-dependent), and what emergent patterns appear that no single expert articulated. This is the task that turns a collection of expert knowledge into a proprietary knowledge advantage.

This task produces insights that exist nowhere else -- they emerge only from systematically comparing multiple expert perspectives. A single distillation gives you one expert's view. Cross-referencing gives you the field's landscape.

The 8-step process ensures systematic, exhaustive comparison:
1. **Load** - Gather all framework files into a normalized format
2. **Compare** - Build a source x framework comparison matrix
3. **Reinforcements** - Find where experts agree (convergence = likely truth)
4. **Contradictions** - Find where experts disagree (divergence = context matters)
5. **Complements** - Find where experts complete each other (synergy = combined power)
6. **Meta-Frameworks** - Synthesize emergent patterns (novelty = proprietary insight)
7. **KB Update** - Integrate findings into the knowledge base
8. **Report** - Generate comprehensive cross-reference report

---

## Executor Type

**Hybrid (60% model-identifier, 40% knowledge-architect)**

- **model-identifier Role:** Pattern matching across sources, detecting shared and contradictory models, identifying structural similarities between differently-named concepts
- **knowledge-architect Role:** Organizing connections into KB structure, synthesizing meta-frameworks, updating graph relationships
- **Human Role:** Validate synthesized meta-frameworks, resolve subjective contradictions, approve final report
- **Autonomy Level:** 70% Agent / 30% Human (meta-frameworks require human judgment to validate)

---

## Inputs

### Required Inputs

```yaml
framework_catalogs:
  field: "Framework catalogs from 2+ different sources"
  format: "YAML files from identify-frameworks task, each tagged with source"
  required: true
  minimum: 2
  example: |
    # Source A: Alex Hormozi (Content Leverage Live)
    source_a:
      speaker: "Alex Hormozi"
      event: "Content Leverage Live"
      date: "2026-02-01"
      frameworks:
        - id: fw_a_001
          name: "Barbell Content Strategy"
          type: "strategic"
          insight: "Only ultra-short or ultra-long content works. The middle is dead."
          evidence: "His channel grew 3x after dropping 10-min videos"
        - id: fw_a_002
          name: "Document Don't Create"
          type: "mindset"
          insight: "Record what you do, don't manufacture content from scratch"
          evidence: "80% of his content is clips from daily work"

    # Source B: Dan Koe (One Person Business Keynote)
    source_b:
      speaker: "Dan Koe"
      event: "One Person Business Keynote"
      date: "2026-01-15"
      frameworks:
        - id: fw_b_001
          name: "Content Map"
          type: "strategic"
          insight: "5 content types: roads, obstacles, attractions, legends, landscapes"
          evidence: "Framework from his book 'The Art of Focus'"
        - id: fw_b_002
          name: "Build in Public"
          type: "mindset"
          insight: "Share your process as content; learning is the product"
          evidence: "His entire brand was built sharing his journey"
  validation: "At least 2 sources with 3+ frameworks each"

heuristic_catalogs:
  field: "Heuristics from the same sources (for deeper comparison)"
  format: "YAML"
  required: false
  example: |
    heuristics:
      source_a:
        - id: h_a_001
          rule: "If engagement drops 20% at minute 3, your hook failed"
          context: "YouTube analytics"
        - id: h_a_002
          rule: "Never edit below 80% of original length in first pass"
          context: "Content editing"
      source_b:
        - id: h_b_001
          rule: "First 5 seconds determine 80% of video performance"
          context: "YouTube retention"
  default: null
  notes: "Including heuristics enables deeper comparison at the tactical level"
```

### Optional Inputs

```yaml
knowledge_base:
  field: "Existing KB with indexed entries (if available)"
  format: "data/knowledge-base/ directory"
  required: false
  example: "data/knowledge-base/index.yaml"
  validation: "If provided, must be valid YAML with entries"
  notes: "If provided, Step 7 updates existing KB. If not, creates standalone outputs."

specific_focus:
  field: "Specific topic or question to focus cross-reference on"
  format: "text"
  required: false
  example: "How do experts differ on content frequency and volume?"
  default: "General cross-reference across all frameworks"
  notes: "Narrows analysis to a specific question - still scans broadly but emphasizes focused findings"

previous_cross_reference:
  field: "Previous cross-reference report to build on"
  format: "Markdown"
  required: false
  example: "cross-reference-report-2026-02-10.md"
  default: null
  notes: "If provided, new findings are compared against previous to show evolution"

comparison_depth:
  field: "How deep to compare"
  format: "enum"
  required: false
  default: "standard"
  options:
    - "quick" # Surface-level: shared themes only (15 min)
    - "standard" # Full: shared, complementary, contradictory, meta (60 min)
    - "deep" # Exhaustive: includes heuristic comparison, multi-layer synthesis (90 min)
  notes: "Quick mode skips Steps 5-6. Standard is default. Deep adds heuristic cross-ref."
```

---

## Preconditions

Before starting this task:

- [ ] At least 2 different sources have been fully processed (extract + identify)
- [ ] Framework catalogs exist for each source (with source attribution)
- [ ] Frameworks have names, types, and descriptions (not just raw quotes)
- [ ] Each framework has evidence or example (not purely theoretical)
- [ ] Knowledge base exists or will be created as output of this task

---

## Steps

### Step 1: Load Multiple Framework Files and Normalize (5 min)

**Agent Activity:**
- Load framework catalogs from all sources
- Load heuristic catalogs (if available and comparison_depth is "deep")
- Normalize format across sources to ensure consistent fields:
  ```yaml
  normalized_schema:
    id: "unique identifier (source_prefix + number)"
    name: "Framework name"
    source_speaker: "Who taught this"
    source_event: "Where it was taught"
    source_date: "When"
    type: "strategic | tactical | mindset | diagnostic | tool"
    insight: "Core insight in 1-2 sentences"
    evidence: "Supporting evidence or example"
    related_heuristics: ["list of heuristic IDs from same source"]
  ```
- Build source inventory:
  ```yaml
  source_inventory:
    total_sources: 3
    sources:
      - name: "Alex Hormozi"
        event: "Content Leverage Live"
        frameworks: 12
        heuristics: 8
        types: {strategic: 5, tactical: 4, mindset: 3}
        date: "2026-02-01"

      - name: "Dan Koe"
        event: "One Person Business Keynote"
        frameworks: 9
        heuristics: 6
        types: {strategic: 4, tactical: 2, mindset: 3}
        date: "2026-01-15"

      - name: "Gary Vaynerchuk"
        event: "Content Masterclass"
        frameworks: 15
        heuristics: 12
        types: {strategic: 6, tactical: 7, mindset: 2}
        date: "2026-01-20"

    totals:
      frameworks: 36
      heuristics: 26
      overlap_potential: "high (all content strategy focused)"
  ```
- If specific_focus provided, tag each framework with relevance to focus question

**Error Handling:**
- If source has < 3 frameworks: include but flag as "thin source, limited comparison value"
- If framework format inconsistent: normalize to common schema, log transformations
- If duplicate source detected: merge catalogs, deduplicate by framework name + type
- If only 1 source: HALT - "need 2+ sources for cross-reference"

**Checkpoint:** All catalogs loaded, normalized to common schema; source inventory generated

---

### Step 2: Build Comparison Matrix (8 min)

**Agent Activity:**
- Create a systematic comparison matrix that maps every framework against every source:

  **Comparison Matrix Structure:**
  ```yaml
  comparison_matrix:
    dimensions:
      rows: "All unique framework concepts (deduplicated by semantic similarity)"
      columns: "All sources"
      cells: "present | absent | partial | related"

    matrix:
      "Content as documentation":
        hormozi: {present: true, name: "Document Don't Create", strength: "strong"}
        koe: {present: true, name: "Build in Public", strength: "strong"}
        vee: {present: true, name: "Content is Exhaust", strength: "strong"}
        convergence: 3/3

      "Format polarization":
        hormozi: {present: true, name: "Barbell Strategy", strength: "strong"}
        koe: {present: false, name: null, strength: null}
        vee: {present: false, name: null, strength: null}
        convergence: 1/3

      "Content categorization":
        hormozi: {present: false, name: null, strength: null}
        koe: {present: true, name: "Content Map", strength: "strong"}
        vee: {present: true, name: "Content Recycling Matrix", strength: "moderate"}
        convergence: 2/3

      # ... one row per unique concept
  ```

- Calculate convergence scores:
  ```yaml
  convergence_summary:
    high_convergence: # 3/3 or 100% of sources
      count: 4
      concepts: ["documentation mindset", "one-to-many principle", "consistency", "audience-first"]

    moderate_convergence: # 2/3 or 50-99%
      count: 7
      concepts: ["format strategy", "content recycling", "SEO importance", ...]

    unique_to_one_source: # 1/N
      count: 12
      concepts: ["Barbell Strategy", "Content Map", ...]

    total_unique_concepts: 23
  ```

- Identify initial clusters (groups of related frameworks):
  ```yaml
  clusters:
    creation_philosophy: ["Document Don't Create", "Build in Public", "Content is Exhaust"]
    distribution_strategy: ["Content Recycling Matrix", "Content Operating System"]
    content_selection: ["Barbell Strategy", "Content Map"]
    audience_targeting: ["CCN Rule", "Audience Stacking"]
  ```

**Error Handling:**
- If semantic similarity is ambiguous (e.g., "Document Don't Create" vs "Build in Public"): classify as "related" not "same", flag for Step 3 analysis
- If matrix is too sparse (< 3 convergence points): sources may be too different, note limitation
- If too many unique concepts (> 20): group by type before deeper analysis

**Checkpoint:** Full comparison matrix generated; convergence scores calculated; initial clusters identified

---

### Step 3: Identify Reinforcements (Shared Mental Models) (12 min)

**Agent Activity:**
- Starting from high-convergence concepts in the matrix, do deep analysis:
- For each concept where 2+ sources converge, validate the match:

  **Detection Criteria for "Reinforcement":**
  1. Same core principle expressed in different words
  2. Same structural pattern (e.g., both use spectrum, both use 2x2 matrix)
  3. Same actionable implication (leads to same behavior change)
  4. Overlapping examples or analogies
  5. Both provide evidence supporting the same conclusion

  **Reinforcement Analysis Template:**
  ```yaml
  reinforcements:
    - id: reinf_001
      concept: "Document over Create"
      convergence_strength: "strong"
      confidence: 0.95
      sources:
        - expert: "Alex Hormozi"
          framework: "Document Don't Create"
          quote: "Stop creating content. Start documenting what you already do."
          evidence: "80% of his content is captured from existing activities"
        - expert: "Dan Koe"
          framework: "Build in Public"
          quote: "Your learning process IS the content. Share the journey."
          evidence: "His brand was built entirely from sharing his process"
        - expert: "Gary Vee"
          framework: "Content is Exhaust"
          quote: "Content is the exhaust of doing your actual work."
          evidence: "His 30+ daily pieces come from documenting meetings"
      implication: |
        All 3 experts agree: content should emerge from work, not be manufactured
        separately. This is a universal principle, not a strategy preference.
      universal_principle: true
      actionable_takeaway: "Set up capture systems for existing activities instead of scheduling 'content creation time'"

    - id: reinf_002
      concept: "One Pillar, Many Derivatives"
      convergence_strength: "strong"
      confidence: 0.92
      sources:
        - expert: "Alex Hormozi"
          framework: "Content Leverage"
          quote: "One livestream should generate 60+ content pieces"
        - expert: "Gary Vee"
          framework: "Content Recycling Matrix"
          quote: "One pillar piece becomes 16 platform-specific pieces"
      implication: "Both agree on the multiplication principle, differing only on exact ratios"
      universal_principle: true
      actionable_takeaway: "Always start with one long-form piece and derive shorter content from it"
  ```

- Score convergence strength:
  - **Strong:** 3+ experts express the same principle with evidence
  - **Moderate:** 2 experts align clearly, or 3 align partially
  - **Weak:** Similar themes but different conclusions or insufficient evidence
  - **Apparent only:** Surface-level similarity that breaks down on deeper analysis

- Generate universal principles from strong reinforcements:
  ```yaml
  universal_principles:
    high_confidence: # 3+ sources, strong evidence
      - principle: "Document over create"
        sources: 3
        confidence: 0.95
      - principle: "One piece should generate many derivatives"
        sources: 3
        confidence: 0.92

    moderate_confidence: # 2 sources or partial alignment
      - principle: "Consistency beats perfection"
        sources: 2
        confidence: 0.75

    emerging: # Interesting but insufficient evidence
      - principle: "AI will change production but not strategy"
        sources: 2
        confidence: 0.60
  ```

**Error Handling:**
- If semantic similarity is ambiguous: flag as "possible reinforcement" with confidence < 0.7
- If frameworks share structure but not conclusion: classify as "structural similarity" not "reinforcement"
- If only 2 sources: lower threshold for "strong" (2/2 = strong for 2-source comparison)
- If apparent reinforcement breaks on evidence: reclassify to "weak" or remove

**Checkpoint:** All reinforcements identified with evidence, confidence scores, and universal principles extracted

---

### Step 4: Identify Contradictions (12 min)

**Agent Activity:**
- Find frameworks that DISAGREE with each other on the same topic:

  **Detection Criteria for "Contradiction":**
  1. Same topic, opposing advice
  2. Mutually exclusive strategies
  3. Different assumptions about audience, market, or platform
  4. One expert explicitly counters another's approach
  5. Same metric, different targets (e.g., "post daily" vs "post weekly")

  **Contradiction Analysis Template:**
  ```yaml
  contradictions:
    - id: contra_001
      topic: "Content Frequency"
      severity: "high"  # high/medium/low impact on strategy
      framework_a:
        expert: "Gary Vaynerchuk"
        position: "Post as much as possible. Volume wins. 10+ pieces/day."
        reasoning: "More at-bats = more chances to go viral. Platform algorithms reward frequency."
        evidence: "His company produces 100+ pieces/day across 12 platforms"
      framework_b:
        expert: "Justin Welsh"
        position: "Post 3-5 times per week maximum. Quality wins."
        reasoning: "Burnout from daily posting is real. One great post outperforms 10 mediocre ones."
        evidence: "Grew to 500K+ followers posting 5x/week on LinkedIn"
      root_cause_analysis: |
        **Why they disagree:** Different business models and team sizes.
        - Vee runs a media company with a content team of 20+
        - Welsh is a solopreneur who does everything himself
        **Underlying assumption difference:**
        - Vee assumes team-based production capacity
        - Welsh assumes solo creator constraints
      resolution_type: "context-dependent"
      resolution_factor: "team size and production capacity"
      decision_framework: |
        IF team_size > 3 AND dedicated_content_role EXISTS:
          → Follow Vee's volume approach
        ELIF solo_creator OR team_size <= 3:
          → Follow Welsh's quality-first approach
        NOTE: Both agree quality matters; they disagree on minimum viable quality

    - id: contra_002
      topic: "Content Originality"
      severity: "medium"
      framework_a:
        expert: "Nicolas Cole"
        position: "Write about what's proven. Follow templates and frameworks."
        reasoning: "Proven formats reduce risk and increase predictability."
        evidence: "Ship 30 for 30 challenge uses template-based writing"
      framework_b:
        expert: "Dan Koe"
        position: "Be original. Write from your unique experience."
        reasoning: "Differentiation comes from unique perspective, not template compliance."
        evidence: "His growth came from his unique philosophical + practical blend"
      root_cause_analysis: |
        **Why they disagree:** Different stages of creator journey.
        - Cole targets beginners who need structure to start
        - Koe targets established creators who need differentiation
      resolution_type: "sequential"
      resolution_factor: "creator maturity stage"
      decision_framework: |
        IF beginner_creator (< 6 months, < 1000 followers):
          → Follow Cole's template approach (learn structure)
        ELIF intermediate_creator (6-18 months):
          → Blend: use templates but inject personal stories
        ELIF advanced_creator (18+ months, strong voice):
          → Follow Koe's originality approach (differentiate)
  ```

- Classify each contradiction:
  ```yaml
  resolution_types:
    context_dependent: "Both right, but for different contexts"
    sequential: "Both right, but for different stages"
    false_contradiction: "Appears contradictory but actually compatible"
    irreconcilable: "Genuinely opposing views; must choose one"
    scale_dependent: "True at different scales of operation"
  ```

- For each contradiction, provide:
  1. Both positions clearly stated with evidence
  2. Root cause analysis (WHY they disagree)
  3. Resolution type classification
  4. Decision framework for the user to choose

**Error Handling:**
- If contradiction is surface-level only: reclassify as "false contradiction" with explanation
- If contradiction is truly irreconcilable: document both sides, provide decision criteria, let human choose
- If root cause unclear: flag for human analysis with both positions presented
- If same expert contradicts themselves: note as "internal contradiction" and check context

**Checkpoint:** All contradictions identified with root cause analysis, resolution type, and decision framework

---

### Step 5: Identify Complements (Frameworks That Amplify Each Other) (10 min)

**Agent Activity:**
- Find frameworks from different experts that WORK TOGETHER but cover different aspects:

  **Detection Criteria for "Complement":**
  1. Cover different parts of the same process (sequential)
  2. Address different dimensions of the same problem (multi-axis)
  3. One provides strategy, another provides tactics for same goal
  4. One answers "what" and another answers "how"
  5. Combined, they create something more powerful than either alone

  **Complement Analysis Template:**
  ```yaml
  complements:
    - id: comp_001
      relationship: "strategy + taxonomy"
      synergy_strength: "very high"
      framework_a:
        expert: "Alex Hormozi"
        name: "Barbell Content Strategy"
        covers: "WHAT length/format of content to create (short or long, never middle)"
        dimension: "format selection"
      framework_b:
        expert: "Dan Koe"
        name: "Content Map"
        covers: "WHAT type of content to create (roads, obstacles, attractions, legends, landscapes)"
        dimension: "content categorization"
      synergy_description: |
        Hormozi tells you the FORMAT (only short or long).
        Koe tells you the TYPE (road, obstacle, attraction, etc.).
        Combined: create short 'obstacles' content and long 'attractions' content.
        Neither framework alone answers both questions.
      combined_framework: |
        Content Selection Matrix:
        - Short-form: obstacles, legends (quick emotional hits)
        - Long-form: roads, landscapes, attractions (need depth)
      combined_power: "very high"
      actionable_result: "Use this matrix to decide both format AND type for every content piece"

    - id: comp_002
      relationship: "capture + distribute"
      synergy_strength: "high"
      framework_a:
        expert: "Gary Vaynerchuk"
        name: "Content Recycling Matrix"
        covers: "HOW to multiply one piece into many platform-specific derivatives"
        dimension: "multiplication method"
      framework_b:
        expert: "Justin Welsh"
        name: "Content Operating System"
        covers: "WHEN and WHERE to publish across platforms with scheduling"
        dimension: "distribution system"
      synergy_description: |
        Vee's matrix generates the pieces (multiplication).
        Welsh's system schedules and publishes them (distribution).
        Combined: full pipeline from one pillar to multi-platform presence.
      combined_framework: |
        Production Pipeline:
        Step 1: Create pillar content (Vee's starting point)
        Step 2: Apply Recycling Matrix to generate derivatives (Vee)
        Step 3: Slot derivatives into Operating System schedule (Welsh)
        Step 4: Publish and track performance (Welsh)
      combined_power: "high"
      actionable_result: "Plug Vee's multiplication output directly into Welsh's scheduling system"
  ```

- For each complement pair, identify:
  1. What each framework covers (its dimension)
  2. What the GAP is between them
  3. How they connect (the synergy)
  4. What the combined framework looks like
  5. Whether a third framework is needed to complete the picture

- Note missing pieces:
  ```yaml
  missing_complements:
    - gap: "Quality control between multiplication and distribution"
      between: ["Content Recycling Matrix", "Content Operating System"]
      needed: "A quality scoring framework to filter derivatives before scheduling"
      potential_source: "Not yet identified - opportunity for novel framework"
  ```

**Error Handling:**
- If complement relationship is weak: note but don't elevate to main findings
- If complement pair requires a third framework: note the gap explicitly
- If overlap is too high: may be "reinforcement" not "complement" - reclassify

**Checkpoint:** All complement pairs identified with synergy descriptions and combined frameworks; gaps noted

---

### Step 6: Synthesize Meta-Frameworks (15 min)

**Agent Activity:**
- From patterns found in Steps 3-5, synthesize meta-frameworks that no single source articulated:

  **Meta-Framework Synthesis Process:**
  1. **Universal Patterns:** What do ALL experts agree on? (from reinforcements)
  2. **Complementary Patterns:** What frameworks combine into something greater? (from complements)
  3. **Resolution Patterns:** What resolves the contradictions? (from contradiction analysis)
  4. **Gap Patterns:** What is missing that would complete the picture? (from complement gaps)

  **Meta-Framework Template:**
  ```yaml
  meta_frameworks:
    - id: meta_001
      name: "The Content Leverage Stack"
      novelty: "high - no single source describes this complete stack"
      confidence: 0.85
      synthesized_from:
        - "Barbell Strategy (Hormozi) - format selection"
        - "Content Map (Koe) - type selection"
        - "Recycling Matrix (Vee) - multiplication method"
        - "Content Operating System (Welsh) - distribution system"
      description: |
        No single expert described the complete content leverage system.
        But combining their frameworks reveals a 4-layer stack:

        Layer 1 (FORMAT): Choose barbell - only short or long (Hormozi)
        Layer 2 (TYPE): Categorize by content map - roads, obstacles, etc. (Koe)
        Layer 3 (MULTIPLY): Apply recycling matrix - 16 derivatives per piece (Vee)
        Layer 4 (DISTRIBUTE): Execute operating system - schedule, publish, track (Welsh)

        Each layer answers a different question:
        L1: How long? -> L2: What kind? -> L3: How many? -> L4: When and where?

      universal_principles_embedded:
        - "Content should emerge from work, not be manufactured"
        - "One pillar piece should generate many derivatives"
        - "Distribution matters as much as creation"

      contradictions_resolved:
        - "Volume vs Quality: addressed by Layer 3 (quality pillar, volume derivatives)"
        - "Templates vs Originality: addressed by Layer 1-2 (structure) + Layer 4 (voice)"

      gaps_identified:
        - "No quality control layer between L3 and L4"
        - "No feedback loop from L4 performance back to L1 selection"

      application_guide: |
        To use this stack for a single content session:
        1. Record a long-form piece (L1: long side of barbell)
        2. Tag segments by content type (L2: road, obstacle, etc.)
        3. Extract 16 derivatives using recycling matrix (L3)
        4. Schedule across platforms using operating system (L4)
        Expected output: 1 recording -> 16+ published pieces across 4+ platforms

      emergent_insight: |
        The meta-framework reveals that content strategy is a STACK,
        not a single framework. Every expert only teaches 1-2 layers.
        The full system requires combining all 4. This is why following
        only one expert feels incomplete.
  ```

- Generate divergence map (where experts genuinely disagree and resolution depends on context):
  ```yaml
  divergence_map:
    high_impact_divergences:
      - topic: "Content frequency"
        resolution: "team size determines which approach"
        user_must_decide: true
      - topic: "Platform priority"
        resolution: "business model determines priority"
        user_must_decide: true

    low_impact_divergences:
      - topic: "Optimal video length for Shorts"
        resolution: "test both 30s and 60s"
        user_must_decide: false  # just test
  ```

- Minimum requirement: at least 1 meta-framework synthesized
- For comparison_depth "deep": synthesize 2-3 meta-frameworks with heuristic-level connections

**Error Handling:**
- If meta-framework is too generic: add specific layers, examples, and application notes
- If synthesis stretches too far beyond evidence: note confidence level honestly (< 0.7)
- If only 2 sources: meta-frameworks will be thinner - note limitation explicitly
- If meta-framework just restates one source: reject and try different combination

**Checkpoint:** At least 1 meta-framework synthesized; universal principles documented; divergence map created

---

### Step 7: Update Knowledge Base (5 min)

**Agent Activity:**
- If KB exists (`data/knowledge-base/` directory), update with new connections:

  **KB Updates:**
  ```yaml
  kb_updates:
    new_entries:
      - type: "meta-framework"
        id: "meta_001"
        name: "The Content Leverage Stack"
        source: "cross-reference synthesis"
        date: "2026-02-12"
        related_to: ["fw_a_001", "fw_b_001", "fw_c_003", "fw_d_002"]

      - type: "universal-principle"
        id: "up_001"
        name: "Document Over Create"
        confidence: 0.95
        source_count: 3

    new_edges:
      - from: "fw_a_001"  # Barbell Strategy
        to: "fw_b_001"    # Content Map
        relationship: "complement"
        weight: 0.9

      - from: "fw_a_002"  # Document Don't Create
        to: "fw_b_002"    # Build in Public
        relationship: "reinforcement"
        weight: 0.95

      - from: "fw_c_001"  # Volume approach
        to: "fw_d_001"    # Quality approach
        relationship: "contradiction"
        resolution: "context-dependent (team size)"
        weight: 0.8

    updated_entries:
      - id: "fw_a_001"
        update: "Added cross-reference connections to fw_b_001 (complement) and meta_001 (part of)"
  ```

- Update graph.yaml with new edges:
  ```yaml
  graph_update:
    edges_added: 8
    entries_updated: 6
    entries_created: 3  # meta-frameworks + universal principles
    index_updated: true
  ```

- If KB does not exist:
  - Save all findings as standalone files
  - Create a `pending-kb-integration.yaml` file for future KB build
  - Note: "KB update pending - run build-knowledge-base task first"

- Save cross-reference artifacts:
  ```
  {output_path}/
  ├── cross-reference-report.md           # Main report (Step 8)
  ├── reinforcements.yaml                 # All shared mental models
  ├── contradictions.yaml                 # All contradictions with resolutions
  ├── complements.yaml                    # All complement pairs with synergies
  ├── meta-frameworks.yaml                # Synthesized meta-frameworks
  ├── universal-principles.yaml           # Extracted universal principles
  ├── comparison-matrix.yaml              # Full comparison matrix
  ├── divergence-map.yaml                 # Where experts disagree
  └── pending-kb-integration.yaml         # (only if KB doesn't exist)
  ```

**Error Handling:**
- If KB does not exist: save report standalone, note "KB update pending"
- If graph update creates inconsistency: validate graph integrity after update
- If meta-framework slug conflicts with existing entry: append source IDs to slug
- If KB is locked or read-only: save updates as separate file for manual merge

**Checkpoint:** KB updated with new entries and edges (or pending file created); all YAML artifacts saved

---

### Step 8: Generate Cross-Reference Report (8 min)

**Agent Activity:**
- Create comprehensive, standalone report:

  **Report Structure:**
  ```markdown
  # Cross-Reference Report: {Topic/Domain}

  **Date:** 2026-02-12
  **Sources Compared:** 3
  **Total Frameworks Analyzed:** 36
  **Comparison Depth:** standard
  **Focus:** {specific_focus or "General cross-reference"}

  ## Executive Summary

  This report compares frameworks from {N} experts across {N} sources in the
  domain of {domain}. Key findings:
  - **{N} reinforcements** found (experts agree on these principles)
  - **{N} contradictions** found (experts disagree, context determines which is right)
  - **{N} complements** found (frameworks that amplify each other when combined)
  - **{N} meta-frameworks** synthesized (emergent patterns no single expert described)
  - **{N} universal principles** extracted with high confidence

  ### Most Important Finding
  {1-paragraph description of the single most valuable insight}

  ## Source Overview

  | Source | Expert | Frameworks | Heuristics | Date |
  |--------|--------|------------|------------|------|
  | {event} | {name} | {N} | {N} | {date} |
  | {event} | {name} | {N} | {date} | {date} |
  | ... | ... | ... | ... | ... |

  ## 1. Reinforcements (Where Experts Agree)

  ### High Confidence Universal Principles

  | # | Principle | Sources | Confidence | Actionable Takeaway |
  |---|-----------|---------|------------|---------------------|
  | 1 | Document over Create | 3/3 | 0.95 | Set up capture systems for daily work |
  | 2 | One pillar, many derivatives | 3/3 | 0.92 | Start every content cycle with one long-form piece |
  | ... | ... | ... | ... | ... |

  ### Detailed Reinforcement Analysis
  {For each reinforcement: quotes from each source, evidence, implication}

  ## 2. Contradictions (Where Experts Disagree)

  ### Contradiction Map

  | # | Topic | Position A | Position B | Resolution Type | Key Factor |
  |---|-------|-----------|-----------|----------------|-----------|
  | 1 | Frequency | Volume wins (Vee) | Quality wins (Welsh) | Context-dependent | Team size |
  | 2 | Originality | Templates (Cole) | Be unique (Koe) | Sequential | Creator maturity |
  | ... | ... | ... | ... | ... | ... |

  ### Detailed Contradiction Analysis
  {For each contradiction: both positions, root cause, resolution, decision framework}

  ## 3. Complements (Frameworks That Amplify Each Other)

  ### Synergy Pairs

  | # | Framework A | Framework B | Synergy | Combined Power |
  |---|-----------|-----------|--------|---------------|
  | 1 | Barbell Strategy (Hormozi) | Content Map (Koe) | Format + Type selection | Very High |
  | 2 | Recycling Matrix (Vee) | Operating System (Welsh) | Multiply + Distribute | High |
  | ... | ... | ... | ... | ... |

  ### Detailed Complement Analysis
  {For each pair: what each covers, the gap between them, combined framework}

  ## 4. Meta-Frameworks (Emergent Patterns)

  ### {Meta-Framework Name}
  {Full description, layers, application guide, emergent insight}

  ## 5. Recommendations

  ### Adopt Immediately (Universal Principles)
  1. {principle + specific action}
  2. {principle + specific action}

  ### Combine These Frameworks
  1. {complement pair + how to combine}
  2. {complement pair + how to combine}

  ### Decide Based on Your Context
  1. {contradiction + decision factors}
  2. {contradiction + decision factors}

  ### Test This Meta-Framework
  1. {meta-framework + 30-day test plan}

  ## 6. Knowledge Base Updates

  - New entries added: {N}
  - New connections added: {N}
  - Entries updated: {N}
  - KB status: {updated / pending}

  ## Files Generated

  ```
  {output_path}/
  ├── cross-reference-report.md
  ├── reinforcements.yaml
  ├── contradictions.yaml
  ├── complements.yaml
  ├── meta-frameworks.yaml
  ├── universal-principles.yaml
  ├── comparison-matrix.yaml
  └── divergence-map.yaml
  ```
  ```

- Report quality requirements:
  - Every claim backed by specific quotes or examples from sources
  - No assertion without attribution
  - Contradictions include decision frameworks, not just descriptions
  - Meta-frameworks include application guides, not just descriptions
  - Recommendations are specific and actionable

**Error Handling:**
- If report exceeds 3000 words: create executive summary (500 words) + detailed appendix
- If findings are thin (< 3 total connections): note that sources may be too dissimilar
- If specific_focus was provided: answer the focus question first, then general findings
- If previous_cross_reference provided: include "Changes since last report" section

**Checkpoint:** Report generated with all 6 sections populated; all YAML artifacts finalized

---

## Outputs

### Primary Outputs

**1. Cross-Reference Report**

Format: Markdown
Location: `{output_path}/cross-reference-report.md`
Content: Complete analysis with reinforcements, contradictions, complements, meta-frameworks, and recommendations

**2. Updated Knowledge Base**

Format: YAML/Markdown updates
Location: `data/knowledge-base/` (entries, graph, index updates)
Content: New connections, meta-framework entries, universal principle entries

### Secondary Outputs

1. **Reinforcements Catalog** - YAML with all shared mental models and convergence scores
2. **Contradictions Guide** - YAML with all contradictions, root causes, and decision frameworks
3. **Complements Index** - YAML with all complement pairs and combined frameworks
4. **Meta-Frameworks Collection** - YAML with synthesized meta-frameworks and application guides
5. **Universal Principles List** - YAML with principles, confidence scores, and source counts
6. **Comparison Matrix** - YAML with full source x concept matrix
7. **Divergence Map** - YAML with all points of expert disagreement

---

## Validation

### Checklist

- [ ] At least 2 sources loaded and normalized to common schema
- [ ] Comparison matrix generated with convergence scores
- [ ] Reinforcements identified with specific evidence from each source
- [ ] Contradictions documented with root cause analysis and resolution type
- [ ] Complements identified with synergy descriptions and combined frameworks
- [ ] At least 1 meta-framework synthesized from cross-source patterns
- [ ] Universal principles listed with confidence scores (>= 0.7)
- [ ] Report includes all 6 sections (reinforcements, contradictions, complements, meta, recommendations, KB)
- [ ] Every connection backed by specific quotes or examples from source material
- [ ] Contradictions include decision frameworks (not just descriptions)
- [ ] KB updated with new connections (or pending file created)
- [ ] All YAML artifacts saved alongside report

### Success Criteria

**Threshold: 10/12 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Pattern detection** | Shared models found with strong evidence across 3+ sources | Shared models found across 2 sources | Few or no shared models detected |
| **Synergy identification** | Complement pairs create genuinely new combined value | Pairs identified but synergy description is vague | No complement pairs found |
| **Contradiction depth** | Root cause analysis with decision frameworks | Contradictions listed but shallow analysis | Contradictions ignored or surface-level |
| **Meta-framework quality** | Novel, actionable, well-sourced, with application guide | Meta-framework exists but is generic | No meta-framework or restates one source |
| **Evidence quality** | Every connection backed by specific quotes/examples | Most connections have evidence | Assertions without evidence |
| **Report utility** | Report enables immediate strategic decisions | Report is informative but passive | Report is a list without analysis |

---

## Estimated Effort

| Role | Effort | Notes |
|------|--------|-------|
| **Agent (model-identifier)** | 35-50 min | Steps 1-5: loading, matrix, reinforcements, contradictions, complements |
| **Agent (knowledge-architect)** | 15-25 min | Steps 6-8: meta-frameworks, KB update, report generation |
| **Human** | 15-20 min | Meta-framework validation, contradiction resolution, report approval |
| **Total Duration** | 60-95 min | Scales with source count (add ~10 min per additional source) |

---

## Integration

### Feeds To

**Downstream Tasks:**
- `build-knowledge-base` - New connections and meta-frameworks enrich KB
- `atomize-content` - Meta-frameworks become new content source material
- `design-ecosystem` - Cross-reference insights inform content themes
- `multiply-ideas` - Universal principles and meta-frameworks generate new content seeds

### Depends On

- `identify-frameworks` - Provides framework catalogs for 2+ sources
- `extract-tacit-knowledge` - Provides heuristics for deeper comparison (optional)
- `build-knowledge-base` - Provides existing KB for context (optional)

### Agent Routing

**Primary Agents:** model-identifier (Shane Parrish methodology) + knowledge-architect (Tiago Forte methodology)
**Coordination:** model-identifier detects patterns (Steps 1-5), knowledge-architect structures and stores them (Steps 6-8)

**Handoff:** Cross-reference report is standalone; KB updates integrate automatically

---

## Quality Threshold

**Pass/Fail Gate:** At least 1 reinforcement + 1 complement + 1 contradiction identified + 1 meta-framework synthesized

If failing:
1. If zero reinforcements: sources may be too different; try narrower topic focus
2. If zero complements: frameworks may be too similar; look for process gaps between them
3. If zero contradictions: either sources agree on everything (rare) or analysis is surface-level (re-examine)
4. If zero meta-frameworks: try combining the strongest complement pair into a novel stack
5. Re-run Steps 3-6 with more granular comparison

**Common Failure Reasons:**
- Sources are from the same expert or school of thought (no real diversity)
- Comparison is too high-level (comparing domains instead of specific frameworks)
- Contradictions dismissed instead of analyzed
- Meta-framework is just renaming one source's framework
- No specific evidence provided (assertions without quotes)
- Complement pairs described but not combined into actionable combined frameworks

---

## Error Handling

### Input Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| Only 1 source | Source count < 2 | HALT, report "need 2+ sources for cross-reference" |
| Source too thin | < 3 frameworks | Include with warning, reduce comparison depth |
| Missing source attribution | No speaker/event info | Flag as "unknown source," reduce confidence on all connections |
| Duplicate sources | Same speaker appears twice | Merge catalogs, treat as single source, warn |
| Inconsistent format | Missing required fields | Normalize to common schema, log transformations |

### Processing Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| No reinforcements found | Zero matches in Step 3 | Try broader criteria, or acknowledge genuine divergence |
| False positive match | Confidence < 0.5 | Flag as "possible," exclude from main findings |
| Meta-framework too generic | Reads like a textbook | Add specific layers, examples, and application steps |
| Graph update conflict | Existing edges contradict new | Log conflict, keep both, flag for human resolution |
| Report too long | > 3000 words | Split into executive summary + detailed appendix |

---

## Notes for Executor

### If Comparing 2 Sources (Minimum)

- Lower threshold for "strong reinforcement" (2/2 = strong)
- Complements are more likely than reinforcements (different experts = different angles)
- Contradictions are high-value (2 experts disagree = interesting content)
- Meta-framework may be thinner - expected and acceptable

### If Comparing 5+ Sources

- Group sources by school of thought before comparing
- Look for "minority reports" (1 expert disagrees with 4 - why?)
- Universal principles have much higher confidence at 5+ sources
- Meta-frameworks should be genuinely novel at this scale
- Consider running comparison_depth "deep" for maximum value

### If Sources Are from Same Niche

- Expect high overlap (many reinforcements)
- Contradictions are the most valuable findings
- Look for subtle nuances, not just agreement/disagreement
- Meta-frameworks should synthesize the "best of all" approach

### If Sources Are from Different Niches

- Expect fewer reinforcements but higher novelty
- Complements are the most valuable findings
- Cross-niche connections are inherently interesting content
- Meta-frameworks may reveal unexpected universal patterns

### If Specific Focus Question Provided

- Narrow all analysis to that question
- Still scan broadly but emphasize focused findings
- Report should answer the specific question FIRST, then general findings
- Contradictions on the specific topic are highest priority

---

## Example: Mini Cross-Reference (2 Sources)

**Source A:** Alex Hormozi - Content Leverage
**Source B:** Dan Koe - One Person Business

| Type | Finding | Value |
|------|---------|-------|
| Reinforcement | Both agree: "Document > Create" (Hormozi) and "Build in Public" (Koe) | Universal principle |
| Complement | Barbell Strategy (format) + Content Map (type) = complete content selection | Combined framework |
| Contradiction | Hormozi: "Volume always wins" vs Koe: "One great piece > 10 mediocre" | Context-dependent |
| Meta-Framework | "The Content Selection Matrix" - cross Barbell (x-axis: length) with Content Map (y-axis: type) for 10-cell decision framework | Novel synthesis |

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial release with 7 steps |
| 2.0.0 | 2026-02-12 | Expanded to 8 steps: separated comparison matrix into own step, added KB update as dedicated step, enhanced meta-framework synthesis |

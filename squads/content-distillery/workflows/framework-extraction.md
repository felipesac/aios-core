---
id: WF-CD-002
name: Framework Extraction Pipeline
version: 1.0.0
description: Extract frameworks, mental models, and heuristics from transcripts without content derivation
trigger: manual | api
phases:
  - ANALYZE
  - IDENTIFY
  - ORGANIZE
agents_involved:
  - tacit-extractor
  - model-identifier
  - knowledge-architect
quality_gates:
  - QG-FE-001: Extraction Depth Valid
  - QG-FE-002: Framework Mapping Complete
  - QG-FE-003: Knowledge Base Entry Valid
modes:
  - single: Process one transcript
  - comparison: Process multiple transcripts and cross-reference
estimated_duration: 20-40 minutes
input: Transcript (JSON) or Ingest package
output: Structured knowledge base entry with frameworks and heuristics
---

# Framework Extraction Pipeline

## Overview

The Framework Extraction Pipeline is a focused workflow that extracts only the intellectual infrastructure from a transcript: mental models, decision frameworks, heuristics, and tacit knowledge patterns. Unlike the Full Distillery Pipeline, this workflow stops at the knowledge organization stage and does not derive content. It is designed for building and enriching the knowledge base without the overhead of content production.

This workflow is ideal for:
- Building a personal knowledge base from expert interviews
- Extracting decision-making patterns from domain experts
- Creating a heuristics library for a specific domain
- Comparing frameworks across multiple experts on the same topic
- Academic or research-oriented knowledge extraction

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   FRAMEWORK EXTRACTION PIPELINE                         │
│                                                                         │
│  INPUT: Transcript (JSON) or Ingest Package                             │
│    │                                                                    │
│    ▼                                                                    │
│  ┌──────────────┐  QG-FE-001  ┌──────────────┐  QG-FE-002             │
│  │   ANALYZE    │────────────▶│   IDENTIFY   │────────────┐            │
│  │   (Cedric)   │             │   (Shane)    │            │            │
│  └──────────────┘             └──────────────┘            ▼            │
│                                                    ┌──────────────┐    │
│                                                    │   ORGANIZE   │    │
│                                                    │   (Tiago)    │    │
│                                                    └──────┬───────┘    │
│                                                           │ QG-FE-003  │
│                                                           ▼            │
│                                                    OUTPUT: KB Entry    │
│                                                    + Framework Catalog │
│                                                    + Heuristics List   │
└─────────────────────────────────────────────────────────────────────────┘

COMPARISON MODE (multiple transcripts):

  Transcript A ──▶ ANALYZE ──▶ IDENTIFY ──┐
  Transcript B ──▶ ANALYZE ──▶ IDENTIFY ──┼──▶ CROSS-REFERENCE ──▶ ORGANIZE
  Transcript C ──▶ ANALYZE ──▶ IDENTIFY ──┘
```

### Agent Activation Sequence

```
Phase 1 (ANALYZE):    tacit-extractor ──────────────────▶ Raw Knowledge Fragments
Phase 2 (IDENTIFY):   model-identifier ─────────────────▶ Framework Catalog + Heuristics
Phase 3 (ORGANIZE):   knowledge-architect ──────────────▶ Structured KB Entry
```

---

## Prerequisites

### Required Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `transcript` | JSON or path | YES | Timestamped transcript from INGEST phase or external source |
| `metadata` | JSON | YES | Source metadata (title, speaker, date, context) |
| `extraction_focus` | list | NO | Specific domains or topics to prioritize |
| `comparison_mode` | boolean | NO | Enable multi-transcript comparison (default: false) |
| `comparison_transcripts` | list | NO | Additional transcripts for comparison mode |
| `existing_kb_path` | path | NO | Path to existing KB for cross-referencing |
| `language` | string | NO | Content language (default: pt-BR) |

### Required Data

| Data | Location | Purpose |
|------|----------|---------|
| Mental Models DB | `data/mental-models-db.yaml` | Framework cross-reference |
| Heuristics Catalog | `data/heuristics-catalog.yaml` | Pattern matching |
| Knowledge Base | `data/knowledge-base/` | Cross-referencing (if exists) |
| RPD Pattern Templates | `data/rpd-patterns.yaml` | Tacit knowledge detection |

### Input Validation

Before starting the pipeline, validate the input transcript:

```yaml
validation_rules:
  transcript:
    - format: JSON with segments array
    - min_segments: 10
    - min_duration: 60 seconds
    - has_timestamps: true
    - has_text: true
    - encoding: UTF-8
  metadata:
    - has_title: true
    - has_speaker: true (at least "Unknown")
    - has_date: true
    - has_source: true
```

**Validation Failure Actions:**
- Missing timestamps: Convert to estimated timestamps based on word count
- Missing speaker info: Default to single speaker mode
- Short transcript (<60s): WARN and proceed (may yield fewer fragments)
- Invalid JSON: ABORT with error code `FE-INPUT-001`

---

## Phase 1: ANALYZE

### Purpose

Perform deep analysis of the transcript to extract raw tacit knowledge fragments. This phase applies the Recognition-Primed Decision (RPD) model and additional knowledge extraction techniques to surface the expert's implicit decision-making patterns, rules of thumb, and experiential knowledge.

### Agent: tacit-extractor (Cedric Chin persona)

The tacit-extractor operates with deep expertise in recognizing and articulating tacit knowledge. Drawing from Cedric Chin's research on expertise and naturalistic decision making, this agent looks beyond what the expert says to find what the expert knows but doesn't explicitly state.

### Step-by-Step Process

#### Step 1.1: Transcript Preprocessing

```
INPUT:  Raw transcript (JSON)
ACTION: Clean, segment, and prepare transcript for analysis
OUTPUT: Preprocessed transcript with analysis markers
```

**Preprocessing Steps:**
1. Remove filler words and verbal tics (um, uh, like, you know)
2. Correct obvious transcription errors (if detectable)
3. Segment into thematic blocks based on topic coherence
4. Label each segment with preliminary topic tags
5. Identify segment types: narrative, explanation, example, opinion, instruction
6. Mark rhetorical structures: analogies, contrasts, lists, conditionals

**Segment Type Classification:**

| Type | Indicators | Tacit Knowledge Potential |
|------|-----------|--------------------------|
| Narrative | "When I...", "There was a time..." | HIGH - contains experiential knowledge |
| Explanation | "The reason is...", "This works because..." | MEDIUM - may contain mental models |
| Example | "For instance...", "Take the case of..." | HIGH - demonstrates applied knowledge |
| Opinion | "I believe...", "In my view..." | MEDIUM - reveals value frameworks |
| Instruction | "You should...", "The way to..." | HIGH - contains compressed expertise |
| Analogy | "It's like...", "Think of it as..." | VERY HIGH - reveals deep structure understanding |
| Conditional | "If you..., then...", "When X happens..." | VERY HIGH - reveals decision heuristics |

#### Step 1.2: RPD Model Application

```
INPUT:  Preprocessed transcript
ACTION: Apply Recognition-Primed Decision model systematically
OUTPUT: RPD-annotated transcript
```

**RPD Analysis Framework:**

The RPD model describes how experts make rapid decisions by recognizing situations and mentally simulating outcomes. Apply each of the following detection layers:

**Layer 1: Situation Recognition Patterns**

Scan for moments where the expert demonstrates automatic pattern recognition:
- "I immediately saw that..."
- "This is a classic case of..."
- "The pattern here was..."
- "I recognized this as..."
- "This is exactly like when..."

For each detection:
```yaml
pattern_type: situation_recognition
timestamp: [start, end]
raw_text: "Exact quote"
interpretation: "What the expert is recognizing"
implicit_knowledge: "What must be true for this recognition to work"
expertise_marker: "What this reveals about the expert's mental library"
```

**Layer 2: Mental Simulation Patterns**

Scan for moments where the expert describes running scenarios:
- "I thought about what would happen if..."
- "Playing it forward..."
- "If we did X, then Y would..."
- "I ran through the scenarios..."
- "The worst case would be..."

For each detection:
```yaml
pattern_type: mental_simulation
timestamp: [start, end]
raw_text: "Exact quote"
scenario_described: "What scenario was simulated"
variables_considered: ["var1", "var2"]
outcome_predicted: "What the expert expected"
implicit_model: "The mental model driving the simulation"
```

**Layer 3: Anomaly Detection Patterns**

Scan for moments where the expert notices something unexpected:
- "What surprised me was..."
- "The unusual thing here..."
- "Most people would expect X, but..."
- "Counter-intuitively..."
- "The thing nobody talks about..."

For each detection:
```yaml
pattern_type: anomaly_detection
timestamp: [start, end]
raw_text: "Exact quote"
expectation: "What was expected"
reality: "What actually happened"
insight: "What the anomaly reveals"
expertise_cue: "Why only an expert would notice this"
```

**Layer 4: Leverage Point Identification**

Scan for moments where the expert identifies high-impact intervention points:
- "The one thing that made the difference..."
- "The bottleneck was always..."
- "If you only do one thing..."
- "The highest leverage action..."
- "Everything changed when..."

For each detection:
```yaml
pattern_type: leverage_point
timestamp: [start, end]
raw_text: "Exact quote"
leverage_point: "What the high-impact action is"
context: "When and where this applies"
magnitude: "How much impact was claimed"
mechanism: "Why this has outsized impact"
```

**Layer 5: Compressed Decision Patterns**

Scan for moments where the expert makes fast judgments without deliberation:
- "I just knew..."
- "It was obvious..."
- "Without even thinking..."
- "My gut told me..."
- "The answer was clear..."

For each detection:
```yaml
pattern_type: compressed_decision
timestamp: [start, end]
raw_text: "Exact quote"
decision_made: "What was decided"
speed_indicator: "How fast the decision was made"
decompressed_logic: "The hidden reasoning chain behind the 'gut feeling'"
expertise_level: "What level of expertise this implies"
```

**Layer 6: Cue-Based Reasoning**

Scan for moments where the expert reads environmental signals:
- "I noticed that..."
- "The sign was..."
- "What told me was..."
- "The red flag was..."
- "Looking at [specific detail]..."

For each detection:
```yaml
pattern_type: cue_reading
timestamp: [start, end]
raw_text: "Exact quote"
cue_detected: "What signal was read"
interpretation: "What the cue means"
action_triggered: "What action followed"
novice_would_miss: "Why a non-expert would miss this cue"
```

#### Step 1.3: Deep Knowledge Fragment Extraction

```
INPUT:  RPD-annotated transcript
ACTION: Extract and structure knowledge fragments
OUTPUT: Knowledge fragments collection
```

**Fragment Extraction Rules:**

1. Each RPD detection generates at least one knowledge fragment
2. Adjacent or related detections may be merged into a single richer fragment
3. Each fragment must pass the "So What?" test (what can someone DO with this?)
4. Each fragment must have at least one supporting quote
5. Fragments should be atomic (one insight per fragment)

**Knowledge Fragment Schema:**
```json
{
  "fragment_id": "KF-FE-001",
  "rpd_pattern": "situation_recognition | mental_simulation | anomaly_detection | leverage_point | compressed_decision | cue_reading",
  "category": "strategic | tactical | operational | philosophical | relational",
  "domain": "Primary domain of application",
  "title": "Brief descriptive title (max 10 words)",
  "raw_quote": "Exact quote from transcript with timestamp",
  "timestamp": {"start": 123.4, "end": 145.6},
  "speaker": "SPEAKER_ID",
  "explicit_knowledge": "What the expert explicitly stated",
  "implicit_knowledge": "What the expert implied but did not state",
  "tacit_knowledge": "What the expert knows but cannot easily articulate",
  "interpretation": "Analysis of what this fragment reveals",
  "actionable_insight": "What someone can DO with this knowledge",
  "implicit_rule": "If X, then Y format where possible",
  "confidence": 0.85,
  "evidence_strength": "strong | moderate | weak",
  "expertise_level_required": "novice | intermediate | advanced | expert",
  "related_fragments": [],
  "context": "What was being discussed",
  "extraction_notes": "Any notes about the extraction process"
}
```

#### Step 1.4: Fragment Validation and Enrichment

```
INPUT:  Raw knowledge fragments
ACTION: Validate, deduplicate, and enrich fragments
OUTPUT: Validated and enriched fragments
```

**Validation Steps:**
1. Remove duplicate or near-duplicate fragments (semantic similarity > 0.9)
2. Verify each fragment has supporting quote
3. Check "So What?" test: Can someone act on this?
4. Verify category and domain assignments
5. Score confidence based on evidence quality

**Enrichment Steps:**
1. Add related fragments links (semantic similarity 0.6-0.9)
2. Identify fragment clusters (groups of 3+ related fragments)
3. Calculate coverage map (which transcript segments have fragments)
4. Identify gaps (significant segments without fragments)
5. Generate gap-filling suggestions for potential re-analysis

**Fragment Clustering:**
```yaml
cluster_id: CL-FE-001
theme: "Descriptive theme name"
fragments: [KF-FE-001, KF-FE-003, KF-FE-007]
synthesized_insight: "One-paragraph synthesis of what these fragments collectively reveal"
pattern_type_distribution:
  situation_recognition: 1
  leverage_point: 2
domain: "Primary domain"
coherence_score: 0.88
```

#### Step 1.5: Extraction Report Generation

```
INPUT:  All extraction artifacts
ACTION: Generate comprehensive analysis report
OUTPUT: Extraction report (markdown)
```

**Report Template:**
```markdown
# Framework Extraction - Analysis Report

## Source Information
- **Title**: [title]
- **Speaker(s)**: [speakers]
- **Duration**: [duration]
- **Date Analyzed**: [date]
- **Language**: [language]

## Extraction Summary

### Statistics
| Metric | Value |
|--------|-------|
| Total fragments extracted | [N] |
| By RPD pattern | [breakdown] |
| By category | [breakdown] |
| By domain | [breakdown] |
| Average confidence | [score] |
| Strong evidence fragments | [N] |
| Fragment clusters | [N] |
| Transcript coverage | [%] |

### RPD Pattern Distribution
| Pattern | Count | % |
|---------|-------|---|
| Situation Recognition | [n] | [%] |
| Mental Simulation | [n] | [%] |
| Anomaly Detection | [n] | [%] |
| Leverage Point | [n] | [%] |
| Compressed Decision | [n] | [%] |
| Cue-Based Reasoning | [n] | [%] |

### Top 5 Insights
1. [Most significant fragment with interpretation]
2. [Second most significant]
3. [Third]
4. [Fourth]
5. [Fifth]

### Fragment Clusters
[Summary of each cluster with synthesized insight]

### Coverage Gaps
[Segments of transcript without fragments and why]

### Quality Assessment
- Overall extraction quality: [HIGH | MEDIUM | LOW]
- Confidence distribution: [chart description]
- Recommended follow-up: [any re-analysis suggestions]

### Handoff Notes for Phase 2
[Specific guidance for the model-identifier agent]
```

### Quality Gate QG-FE-001: Extraction Depth Valid

| Criterion | Threshold | Measurement | Action if Failed |
|-----------|-----------|-------------|------------------|
| Fragment count | >= 5 per 30 min of content | Count / duration | Relax thresholds, re-scan |
| RPD pattern diversity | >= 3 pattern types | Distinct types | Check for detection bias |
| Average confidence | >= 0.70 | Mean confidence score | Review low-confidence fragments |
| Transcript coverage | >= 50% of segments | Covered / total segments | Analyze uncovered segments |
| Cluster count | >= 1 cluster | Cluster count | May proceed (single topic) |
| "So What?" pass rate | >= 80% of fragments | Actionable / total | Remove non-actionable fragments |
| Evidence strength | >= 50% strong or moderate | Strong+moderate / total | Flag weak fragments |

**QG-FE-001 Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All criteria PASS | Proceed to Phase 2 |
| Fragment count low but others pass | Proceed with WARNING |
| Coverage < 30% | HALT - Major transcript segments unexplored |
| Confidence < 0.5 average | HALT - Extraction unreliable |
| No clusters formed | Proceed (may indicate diverse single topic) |
| < 3 RPD patterns | Proceed with NOTE for Phase 2 |

### Handoff to Phase 2

**Handoff Artifact:** `data/framework-extraction/{run_id}/phase1/`

```
data/framework-extraction/{run_id}/phase1/
├── knowledge_fragments.json       # All validated fragments
├── fragment_clusters.yaml         # Themed clusters
├── rpd_annotations.json           # Full RPD-annotated transcript
├── preprocessed_transcript.json   # Cleaned and segmented transcript
├── coverage_map.json              # Which segments have fragments
├── extraction_report.md           # Comprehensive report
└── phase1_metadata.json           # Processing stats and metadata
```

**Handoff Contract:**
```yaml
from: tacit-extractor
to: model-identifier
artifact: data/framework-extraction/{run_id}/phase1/
required_files:
  - knowledge_fragments.json
  - fragment_clusters.yaml
  - extraction_report.md
  - phase1_metadata.json
validation:
  - QG-FE-001 status: PASS or PASS_WITH_WARNINGS
  - knowledge_fragments.json has >= 5 valid fragments
  - All fragments have required schema fields
  - extraction_report.md contains handoff notes
signals:
  warnings: [list any QG warnings for Phase 2 to consider]
  focus_areas: [suggested focus areas based on extraction results]
  comparison_ready: [boolean - are artifacts ready for comparison mode]
```

---

## Phase 2: IDENTIFY

### Purpose

Map extracted knowledge fragments to known mental models and frameworks. Discover novel frameworks unique to the expert. Build a comprehensive heuristics catalog with actionable "If X, then Y" decision rules. This phase transforms raw tacit knowledge into structured intellectual tools.

### Agent: model-identifier (Shane Parrish persona)

The model-identifier operates with the multidisciplinary rigor of Shane Parrish's Farnam Street methodology. It draws from a vast mental model library spanning physics, biology, economics, psychology, mathematics, and philosophy to identify the deep structures underlying expert thinking.

### Step-by-Step Process

#### Step 2.1: Reference Database Loading

```
INPUT:  Mental Models DB + Heuristics Catalog
ACTION: Load, index, and prepare reference databases
OUTPUT: Indexed reference library ready for matching
```

**Mental Models Database Structure:**
```yaml
model_id: MM-001
name: "First Principles Thinking"
aliases: ["reasoning from first principles", "fundamental analysis"]
category: "General Thinking"
subcategory: "Reasoning"
description: "Breaking down complex problems into fundamental truths and building up from there"
signature_patterns:
  - "break it down to the basics"
  - "start from scratch"
  - "what do we know for certain"
  - "remove all assumptions"
related_models: [MM-003, MM-015, MM-042]
disciplines: ["physics", "philosophy", "engineering"]
key_practitioners: ["Elon Musk", "Richard Feynman"]
```

**Database Categories (minimum):**
- General Thinking Concepts (30+ models)
- Physics and Engineering (20+ models)
- Biology and Evolution (15+ models)
- Economics and Business (25+ models)
- Psychology and Behavior (25+ models)
- Mathematics and Statistics (15+ models)
- Systems and Complexity (20+ models)
- Military and Strategy (10+ models)
- Philosophy and Ethics (10+ models)

#### Step 2.2: Systematic Fragment-to-Model Matching

```
INPUT:  Knowledge fragments + Reference databases
ACTION: Match each fragment against known mental models
OUTPUT: Fragment-model mappings with confidence and evidence
```

**Matching Algorithm:**

For each knowledge fragment:

1. **Keyword Matching** (Fast Pass)
   - Compare fragment text against model signature patterns
   - Score: keyword overlap percentage
   - Threshold: >= 0.3 to proceed to semantic matching

2. **Semantic Matching** (Deep Pass)
   - Compare fragment interpretation against model descriptions
   - Score: semantic similarity (0.0 - 1.0)
   - Threshold: >= 0.6 to be considered a candidate

3. **Structural Matching** (Validation Pass)
   - Compare fragment's implicit_rule structure against model's mechanism
   - Verify the fragment's logic follows the model's pattern
   - Score: structural alignment (0.0 - 1.0)
   - Threshold: >= 0.5 for confirmation

4. **Final Score Calculation**
   ```
   final_score = (keyword * 0.2) + (semantic * 0.5) + (structural * 0.3)
   ```
   - Accept match if final_score >= 0.7
   - Flag as "possible match" if 0.5 <= final_score < 0.7
   - Reject if final_score < 0.5

**Match Output Format:**
```json
{
  "fragment_id": "KF-FE-001",
  "matches": [
    {
      "model_id": "MM-001",
      "model_name": "First Principles Thinking",
      "model_category": "General Thinking",
      "keyword_score": 0.45,
      "semantic_score": 0.88,
      "structural_score": 0.76,
      "final_score": 0.78,
      "status": "accepted",
      "evidence": "Fragment shows expert decomposing pricing strategy to fundamental value drivers",
      "expert_variation": "Expert applies first principles specifically to customer psychology, not just cost structure",
      "mapping_quality": "strong"
    }
  ],
  "best_match": "MM-001",
  "novel_candidate": false,
  "novel_score": 0.0,
  "unmatched_aspects": []
}
```

#### Step 2.3: Novel Framework Detection

```
INPUT:  Unmatched or poorly matched fragments + fragment clusters
ACTION: Analyze for novel frameworks not in reference database
OUTPUT: Novel framework candidates with full descriptions
```

**Novel Framework Detection Process:**

1. **Collect Unmatched Material**
   - Fragments with no match above 0.7
   - Fragments where match only covers part of the insight
   - Fragment clusters where the cluster theme doesn't match any single model

2. **Pattern Analysis**
   - Look for recurring decision rules across unmatched fragments
   - Identify unique combinations of known models (hybrid frameworks)
   - Detect domain-specific applications of general principles
   - Find contradictions with established models (potential paradigm shifts)

3. **Framework Synthesis**
   For each candidate novel framework:

   a. Identify the core mechanism (what makes this framework work)
   b. Define the components (what elements make up this framework)
   c. Specify the conditions (when does this framework apply)
   d. Articulate the prediction (what does this framework predict)
   e. Test against evidence (do other fragments support it)

**Novel Framework Template:**
```yaml
framework_id: NF-FE-001
name: "[Expert]'s [Domain] [Mechanism]"
alternate_names: []
source_expert: "[Name]"
source_fragments: [KF-FE-004, KF-FE-009, KF-FE-012]
evidence_count: 3
discovery_method: "unmatched_cluster | hybrid_detection | contradiction_analysis"

description: |
  One-paragraph description of the framework explaining
  what it is, how it works, and why it matters.

core_mechanism: "The fundamental principle driving this framework"

components:
  - name: "Component 1"
    description: "What this component is"
    role: "What role it plays in the framework"
  - name: "Component 2"
    description: "What this component is"
    role: "What role it plays in the framework"

application_conditions:
  works_when:
    - "Condition 1"
    - "Condition 2"
  fails_when:
    - "Condition 1"
    - "Condition 2"

predictions:
  - "If applied correctly, X should happen"
  - "Failure to apply leads to Y"

closest_known_models:
  - model: "MM-001"
    similarity: 0.4
    key_difference: "How the novel framework differs"

evidence_assessment:
  strength: "strong | moderate | weak"
  fragment_support: 3
  counter_evidence: 0
  expert_certainty: "high | medium | low"

limitations:
  - "Known limitation 1"
  - "Known limitation 2"

potential_applications:
  - domain: "Domain 1"
    application: "How to apply"
  - domain: "Domain 2"
    application: "How to apply"
```

#### Step 2.4: Heuristics Extraction and Formalization

```
INPUT:  All fragments (matched and unmatched) + frameworks (known and novel)
ACTION: Extract and formalize actionable heuristics
OUTPUT: Comprehensive heuristics catalog
```

**Heuristic Extraction Process:**

1. **Direct Heuristics** - Explicitly stated by expert
   - "If you see X, do Y"
   - "Never do X when Y"
   - "Always check X before Y"

2. **Derived Heuristics** - Inferred from expert behavior
   - Expert consistently does X in situation Y (pattern across fragments)
   - Expert's implicit_rules when formalized become heuristics

3. **Framework-Based Heuristics** - Derived from applying identified frameworks
   - "When [framework condition], apply [framework action]"

**Heuristic Schema:**
```yaml
heuristic_id: H-FE-001
type: direct | derived | framework_based
source: "KF-FE-003 | NF-FE-001"

rule: "If [specific condition], then [specific action]"
rule_negative: "If NOT [condition], then [alternative action]"

domain: "Primary domain"
subdomain: "Specific subdomain"

reliability:
  rating: high | medium | low
  basis: "How reliability was assessed"
  sample_size: "How many instances support this"

boundary_conditions:
  applies_when:
    - "Specific condition 1"
    - "Specific condition 2"
  does_not_apply_when:
    - "Exception 1"
    - "Exception 2"

expert_confidence:
  level: high | medium | low
  indicators: "How the expert expressed confidence"

examples:
  positive:
    - "Example where the heuristic worked"
  negative:
    - "Example where it didn't apply (if mentioned)"

related_heuristics: [H-FE-003]
related_frameworks: [MM-001, NF-FE-001]

actionability_score: 0.9  # How directly someone can apply this (0.0-1.0)
specificity_score: 0.8    # How specific vs generic this is (0.0-1.0)
```

#### Step 2.5: Cross-Reference Matrix

```
INPUT:  All frameworks + heuristics + fragments
ACTION: Build relationship matrix between all identified elements
OUTPUT: Cross-reference matrix with relationship types
```

**Relationship Types:**
- `supports`: Framework A provides evidence for Framework B
- `extends`: Framework A adds nuance to Framework B
- `contradicts`: Framework A conflicts with Framework B
- `applies_via`: Heuristic H implements Framework F in practice
- `derives_from`: Heuristic H is derived from Framework F
- `complements`: Elements work together synergistically

**Cross-Reference Matrix Format:**
```json
{
  "relationships": [
    {
      "from": "MM-001",
      "to": "NF-FE-001",
      "type": "extends",
      "description": "Novel framework extends first principles by adding domain-specific heuristics",
      "confidence": 0.85
    },
    {
      "from": "H-FE-001",
      "to": "MM-001",
      "type": "applies_via",
      "description": "Heuristic is a practical application of first principles in sales context",
      "confidence": 0.90
    }
  ],
  "clusters": [
    {
      "cluster_id": "RC-001",
      "theme": "Decision speed optimization",
      "elements": ["MM-015", "NF-FE-001", "H-FE-003", "H-FE-007"],
      "insight": "Expert has developed a system for making faster decisions in domain X"
    }
  ]
}
```

#### Step 2.6: Identification Report

```
INPUT:  All identification artifacts
ACTION: Generate comprehensive identification report
OUTPUT: Identification report (markdown)
```

**Report Template:**
```markdown
# Framework Extraction - Identification Report

## Source
- Title: [title]
- Speaker: [speaker]
- Analysis Run: [run_id]
- Date: [date]

## Summary

### Known Frameworks Identified: [N]

| # | Framework | Category | Confidence | Evidence | Expert Variation |
|---|-----------|----------|------------|----------|-----------------|
| 1 | [Name] | [Cat] | [Score] | [Fragments] | [How expert uses it differently] |

### Novel Frameworks Discovered: [N]

| # | Framework | Domain | Evidence Strength | Components |
|---|-----------|--------|-------------------|------------|
| 1 | [Name] | [Domain] | [Strength] | [Count] |

### Heuristics Extracted: [N]

| # | Rule | Domain | Reliability | Actionability |
|---|------|--------|-------------|---------------|
| 1 | If X, then Y | [Domain] | [Rating] | [Score] |

### Cross-Reference Highlights
[Most interesting relationships discovered]

### Novel Insights
[Insights that don't map to any known framework]

## Detailed Analysis
[Deep dive into each framework and heuristic]

## Quality Assessment
- Match quality average: [score]
- Novel framework quality: [assessment]
- Heuristic actionability average: [score]
- Cross-reference density: [relationships per element]

## Handoff Notes for Phase 3
[Specific guidance for organizing the knowledge]
```

### Quality Gate QG-FE-002: Framework Mapping Complete

| Criterion | Threshold | Measurement | Action if Failed |
|-----------|-----------|-------------|------------------|
| Known frameworks matched | >= 3 | Count high-confidence matches | Broaden matching, check DB coverage |
| Heuristics extracted | >= 5 | Count valid heuristics | Return to extraction for more fragments |
| Actionability score avg | >= 0.7 | Mean actionability score | Revise heuristics for specificity |
| Cross-references | >= 1 per framework | Relationship count | Analyze for missing connections |
| Novel framework quality | If any, >= 2 supporting fragments | Fragment support count | Downgrade to "hypothesis" status |
| Evidence coverage | >= 80% fragments mapped | Mapped / total fragments | Investigate unmapped fragments |

**QG-FE-002 Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All criteria PASS | Proceed to Phase 3 |
| < 3 known frameworks but >= 1 | Proceed with NOTE (niche domain) |
| 0 frameworks identified | HALT - Review extraction quality |
| < 5 heuristics | Proceed if frameworks are strong |
| Low actionability | Return for refinement cycle |
| Poor cross-referencing | Proceed with WARNING |

### Comparison Mode: Cross-Transcript Analysis

When `comparison_mode: true`, additional steps run after Step 2.6:

#### Step 2.7 (Comparison): Cross-Transcript Framework Alignment

```
INPUT:  Identification outputs from all transcripts
ACTION: Compare and align frameworks across transcripts
OUTPUT: Cross-transcript comparison report
```

**Comparison Analysis:**
1. Identify shared frameworks across experts
2. Identify unique frameworks per expert
3. Compare heuristics for the same domain across experts
4. Find contradictions between experts
5. Synthesize a unified framework where experts agree
6. Document disagreements with evidence from both sides

**Comparison Output Format:**
```markdown
# Cross-Transcript Comparison: [Topic]

## Experts Compared
| Expert | Source | Duration | Frameworks | Heuristics |
|--------|--------|----------|------------|------------|
| [Name] | [Title] | [Duration] | [N] | [N] |

## Shared Frameworks
| Framework | Expert A Confidence | Expert B Confidence | Agreement Level |
|-----------|--------------------|--------------------|-----------------|
| [Name] | [Score] | [Score] | High/Medium/Low |

## Expert-Unique Frameworks
### Expert A Only
[List frameworks unique to Expert A]

### Expert B Only
[List frameworks unique to Expert B]

## Contradictions
| Topic | Expert A Says | Expert B Says | Resolution |
|-------|--------------|--------------|------------|
| [Topic] | [View] | [View] | [Analysis] |

## Synthesized Frameworks
[New frameworks that emerge from combining expert perspectives]

## Heuristic Comparison Matrix
[Compare heuristics for the same decisions across experts]
```

### Handoff to Phase 3

**Handoff Artifact:** `data/framework-extraction/{run_id}/phase2/`

```
data/framework-extraction/{run_id}/phase2/
├── framework_catalog.md             # Complete catalog document
├── model_matches.json               # All fragment-model mappings
├── novel_frameworks.yaml            # Novel framework candidates
├── heuristics_catalog.yaml          # All heuristics
├── cross_references.json            # Relationship matrix
├── identification_report.md         # Comprehensive report
├── phase2_metadata.json             # Processing stats
└── comparison/ (if comparison mode)
    ├── cross_transcript_report.md   # Comparison analysis
    ├── shared_frameworks.yaml       # Common frameworks
    ├── contradictions.yaml          # Expert disagreements
    └── synthesized_frameworks.yaml  # New combined frameworks
```

**Handoff Contract:**
```yaml
from: model-identifier
to: knowledge-architect
artifact: data/framework-extraction/{run_id}/phase2/
required_files:
  - framework_catalog.md
  - model_matches.json
  - heuristics_catalog.yaml
  - cross_references.json
  - identification_report.md
validation:
  - QG-FE-002 status: PASS or PASS_WITH_WARNINGS
  - framework_catalog.md is complete
  - heuristics_catalog.yaml has >= 5 entries
  - identification_report.md contains handoff notes
signals:
  comparison_mode: [boolean]
  novel_frameworks_found: [count]
  high_confidence_matches: [count]
  contradictions_found: [count]
```

---

## Phase 3: ORGANIZE

### Purpose

Structure the identified frameworks and heuristics into a reusable knowledge base entry using Progressive Summarization and the PARA framework. This phase makes the extracted knowledge maximally discoverable, citable, and actionable for future use, whether for content creation, decision-making, or teaching.

### Agent: knowledge-architect (Tiago Forte persona)

The knowledge-architect applies the Building a Second Brain methodology to transform raw intellectual materials into a organized, layered knowledge structure that serves multiple future use cases.

### Step-by-Step Process

#### Step 3.1: PARA Classification

```
INPUT:  Framework catalog + Heuristics catalog + Cross-references
ACTION: Classify each element using the PARA framework
OUTPUT: PARA-classified knowledge elements
```

**Classification Process:**

For each framework and heuristic, determine:

1. **Is this relevant to an active PROJECT?**
   - Currently creating content about this topic? -> Projects
   - Building a product that uses this? -> Projects
   - Teaching a course on this? -> Projects

2. **Is this relevant to an ongoing AREA of responsibility?**
   - Professional skill that needs continuous improvement? -> Areas
   - Domain expertise you maintain? -> Areas
   - Recurring decision type? -> Areas

3. **Is this a general RESOURCE for future reference?**
   - Interesting but no immediate application? -> Resources
   - Might be useful for a future project? -> Resources
   - Good reference material? -> Resources

4. **Is this ARCHIVAL (context-only)?**
   - Historical example only? -> Archives
   - Outdated but interesting? -> Archives
   - One-time relevance? -> Archives

**PARA Assignment Format:**
```yaml
element_id: "MM-001 | NF-FE-001 | H-FE-001"
element_type: "framework | novel_framework | heuristic"
para_primary: "projects | areas | resources | archives"
para_secondary: "optional second classification"
project_name: "if projects, which project"
area_name: "if areas, which area"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]
discoverability_keywords: ["keyword1", "keyword2"]
future_use_cases:
  - "Potential use case 1"
  - "Potential use case 2"
```

#### Step 3.2: Progressive Summarization (5 Layers)

```
INPUT:  All classified knowledge elements
ACTION: Apply 5-layer progressive summarization
OUTPUT: Complete progressive summary stack
```

**Layer 1: Complete Notes**

Full detailed documentation of each framework and heuristic:
- Complete framework descriptions with all components
- Full heuristic rules with all boundary conditions
- All supporting quotes with timestamps
- Expert context and credibility assessment
- Cross-references to related elements
- Examples and counter-examples
- Limitations and edge cases
- Application guidelines

**Layer 1 Quality Criteria:**
- Nothing omitted from Phase 2 outputs
- Organized by element type (frameworks, then heuristics)
- Each element has consistent formatting
- Source citations for every claim
- Word count: No limit (completeness > brevity)

**Layer 2: Bold Passages (Key Material)**

Select and highlight the most important passages from Layer 1:
- Core mechanism of each framework (the "engine")
- Primary condition and action of each heuristic
- Most compelling supporting evidence
- Key boundary conditions (the "gotchas")
- Counter-intuitive findings
- Quantified claims or specific thresholds

**Layer 2 Selection Criteria:**
- Would someone miss critical understanding without this passage?
- Is this passage non-obvious (couldn't be guessed)?
- Does this passage change behavior when understood?
- Target: approximately 30-40% of Layer 1 content

**Layer 3: Highlighted Passages (Essential Material)**

From the bold passages, highlight the absolutely essential ones:
- The single most important sentence of each framework
- The "If X, then Y" of each heuristic (nothing else)
- The most surprising finding overall
- The highest-impact actionable insight
- The key differentiator from common knowledge

**Layer 3 Selection Criteria:**
- If someone read ONLY this, would they get the core value?
- Is this the minimum viable understanding?
- Target: approximately 10-15% of Layer 1 content

**Layer 4: Executive Summary**

A standalone summary synthesizing all Layer 3 highlights:

```markdown
## Executive Summary (max 250 words)

[Expert Name] demonstrates [N] key frameworks in their approach to [domain]:

1. **[Framework 1]**: [One-sentence essence]. Applied when [condition].
2. **[Framework 2]**: [One-sentence essence]. Critical for [use case].
3. **[Framework 3]**: [One-sentence essence]. Counter-intuitive because [reason].

The most actionable heuristic is: "[If X, then Y]" which applies to [domain].

The novel insight is [description], which differs from conventional wisdom because [reason].

**Bottom line**: [One sentence capturing the single most important takeaway].
```

**Layer 4 Requirements:**
- Maximum 250 words
- Standalone (readable without any other layer)
- Mentions all major frameworks by name
- Highlights the single most actionable heuristic
- Includes the "Bottom line" statement
- Written for a smart generalist (no jargon without explanation)

**Layer 5: Remix (Integration with Existing Knowledge)**

Connect new knowledge to existing KB entries:

```markdown
## Remix: Integration Map

### Reinforces
[New findings that strengthen existing KB entries]
- [New element] reinforces [existing entry] because [connection]

### Extends
[New findings that add nuance to existing knowledge]
- [New element] extends [existing entry] by adding [new dimension]

### Challenges
[New findings that contradict or question existing knowledge]
- [New element] challenges [existing entry] regarding [specific point]

### New Connections
[Novel connections between previously unrelated KB entries]
- [Existing entry A] + [New element] suggests [new connection to existing entry B]

### Gaps Identified
[Areas where the KB now has known gaps]
- [Gap description] - suggested source to fill: [suggestion]
```

#### Step 3.3: Knowledge Base Entry Assembly

```
INPUT:  All progressive summary layers + PARA classification
ACTION: Assemble final knowledge base entry
OUTPUT: Complete KB entry file
```

**KB Entry Structure:**
```markdown
# KB: [Expert Name] - [Topic/Title]

> **Bottom Line**: [One sentence from Layer 4]

## Quick Reference
- **Source**: [URL or reference]
- **Expert**: [Name and credentials]
- **Domain**: [Primary domain]
- **Date Extracted**: [Date]
- **Frameworks**: [Count known] known + [Count novel] novel
- **Heuristics**: [Count]
- **PARA**: [Primary classification]
- **Tags**: [tag list]

---

## Layer 5: Remix (Start Here If You Have Context)
[Integration with existing KB]

## Layer 4: Executive Summary (Start Here If New)
[Standalone summary]

## Layer 3: Key Highlights
[Essential highlighted material]

## Layer 2: Important Details
[Key bold passages with context]

## Layer 1: Complete Reference
[Full detailed notes]

---

## Appendices

### A: Framework Details
[Complete framework descriptions]

### B: Heuristics Catalog
[Complete heuristics with all fields]

### C: Cross-Reference Matrix
[Relationship map]

### D: Source Quotes
[All supporting quotes with timestamps]

### E: Processing Metadata
[Run information, quality gate results, agent notes]
```

#### Step 3.4: Index and Cross-Link

```
INPUT:  Complete KB entry
ACTION: Update KB index and create cross-links
OUTPUT: Updated KB index + cross-linked entries
```

**Indexing Process:**
1. Add entry to master KB index (`data/knowledge-base/index.yaml`)
2. Update tag index with new tags
3. Update domain index with new domain entries
4. Create backlinks in related KB entries (if they exist)
5. Update framework catalog master list
6. Update heuristics master catalog

**Index Entry Format:**
```yaml
entry_id: "KB-FE-{run_id}"
title: "[Expert] - [Topic]"
date_created: "2026-02-12"
source_type: "youtube | podcast | article | interview"
source_url: "[URL]"
expert: "[Name]"
domain: "[Domain]"
para: "[Classification]"
frameworks_known: [list]
frameworks_novel: [list]
heuristics_count: N
tags: [list]
related_entries: [list]
file_path: "data/knowledge-base/entries/KB-FE-{run_id}.md"
quality_score: 0.88
```

#### Step 3.5: Organization Report

```
INPUT:  All organization artifacts
ACTION: Generate final organization report
OUTPUT: Organization and pipeline completion report
```

**Report Template:**
```markdown
# Framework Extraction - Organization Report

## Pipeline Summary
- **Run ID**: [run_id]
- **Source**: [title] by [expert]
- **Pipeline Duration**: [total time]
- **Status**: [COMPLETED | COMPLETED_WITH_WARNINGS]

## Knowledge Organized

### Frameworks
| Type | Count | Avg Confidence |
|------|-------|----------------|
| Known | [N] | [Score] |
| Novel | [N] | [Score] |
| Total | [N] | [Score] |

### Heuristics
| Domain | Count | Avg Actionability |
|--------|-------|-------------------|
| [Domain] | [N] | [Score] |
| Total | [N] | [Score] |

### Progressive Summarization
| Layer | Word Count | Compression |
|-------|------------|-------------|
| L1: Complete | [N] | 100% |
| L2: Bold | [N] | [%] |
| L3: Highlights | [N] | [%] |
| L4: Summary | [N] | [%] |
| L5: Remix | [N] | N/A |

### PARA Distribution
| Category | Count |
|----------|-------|
| Projects | [N] |
| Areas | [N] |
| Resources | [N] |
| Archives | [N] |

## Quality Gate Results

| Gate | Status | Details |
|------|--------|---------|
| QG-FE-001 | [PASS] | [Details] |
| QG-FE-002 | [PASS] | [Details] |
| QG-FE-003 | [PASS] | [Details] |

## KB Integration
- New entry: [file path]
- Cross-links created: [N]
- Tags added: [list]
- Index updated: YES/NO

## Artifacts Location
[Complete list of output files with paths]

## Recommendations
[Suggested next steps based on findings]
```

### Quality Gate QG-FE-003: Knowledge Base Entry Valid

| Criterion | Threshold | Measurement | Action if Failed |
|-----------|-----------|-------------|------------------|
| All 5 PS layers present | 5/5 complete | File check | Complete missing layer |
| Layer compression ratio | Each <= 50% of previous | Word count ratio | Revise verbose layer |
| PARA classification | 100% elements classified | Classified / total | Assign missing classifications |
| Tags per entry | >= 5 tags | Tag count | Add more tags |
| Cross-references | >= 1 link to existing KB | Link count | Create at minimum 1 |
| Executive summary | <= 250 words | Word count | Trim to limit |
| Bottom line present | 1 sentence | Existence check | Write bottom line |
| KB index updated | Entry in index | Index check | Update index |
| Actionability preserved | Heuristics maintain If/Then | Format check | Reformat heuristics |

**QG-FE-003 Decision Matrix:**

| Scenario | Decision |
|----------|----------|
| All criteria PASS | Pipeline COMPLETE |
| Missing PS layers | HALT - Complete layers |
| Compression violation | Revise and re-check |
| No cross-references and no existing KB | PASS (first entry) |
| Index not updated | Update before completion |

---

## Error Handling

### Error Codes

| Code | Phase | Error | Recovery |
|------|-------|-------|----------|
| `FE-INPUT-001` | PRE | Invalid transcript JSON | Request valid transcript |
| `FE-INPUT-002` | PRE | Transcript too short | WARN and proceed |
| `FE-INPUT-003` | PRE | Missing metadata | Use defaults, WARN |
| `FE-ANALYZE-001` | ANALYZE | < 5 fragments extracted | Relax RPD thresholds |
| `FE-ANALYZE-002` | ANALYZE | Low coverage (< 30%) | Re-analyze missed segments |
| `FE-ANALYZE-003` | ANALYZE | Low confidence average | Flag for manual review |
| `FE-IDENTIFY-001` | IDENTIFY | < 3 frameworks matched | Broaden matching criteria |
| `FE-IDENTIFY-002` | IDENTIFY | No heuristics found | Derive from frameworks |
| `FE-IDENTIFY-003` | IDENTIFY | DB loading failure | Use backup DB, WARN |
| `FE-ORGANIZE-001` | ORGANIZE | PS layer incomplete | Complete before proceeding |
| `FE-ORGANIZE-002` | ORGANIZE | KB index conflict | Resolve conflict, update |
| `FE-ORGANIZE-003` | ORGANIZE | Cross-link target missing | Create orphan entry, WARN |

### Recovery Procedures

**Phase Retry Policy:**
```yaml
retry_policy:
  max_retries_per_phase: 3
  backoff: linear
  base_delay: 10s
  on_max_retries: HALT_AND_REPORT
```

**Degraded Mode:**
If a phase cannot meet full quality thresholds after retries, it may proceed in degraded mode:
```yaml
degraded_mode:
  enabled: true
  conditions:
    - "Phase retried 3 times without full pass"
    - "User explicitly requests continuation"
  effects:
    - "Quality gate passes with DEGRADED status"
    - "All downstream phases receive degraded flag"
    - "Final output marked as NEEDS_REVIEW"
  reporting:
    - "Degraded phases listed in completion report"
    - "Specific deficiencies documented"
```

---

## Output Templates

### Framework Template (for KB)

```markdown
### [Framework Name]

**Category**: [Known/Novel] | **Domain**: [Domain] | **Confidence**: [Score]

**Description**: [One paragraph]

**Core Mechanism**: [One sentence explaining why/how it works]

**Components**:
1. [Component 1]: [Description]
2. [Component 2]: [Description]

**Application**:
- When to use: [Conditions]
- When NOT to use: [Conditions]

**Expert's Variation**: [How this expert applies it differently]

**Evidence**: [Source quote with timestamp]

**Related**: [Links to related frameworks/heuristics]
```

### Heuristic Template (for KB)

```markdown
### H-[ID]: [Short Name]

> **Rule**: If [condition], then [action]

**Domain**: [Domain] | **Reliability**: [Rating] | **Actionability**: [Score]

**Boundary Conditions**:
- Applies when: [List]
- Does NOT apply when: [List]

**Source**: [Quote] @ [Timestamp]

**Example**: [Positive example]

**Related**: [Framework it derives from]
```

---

## Appendix: Configuration

### Default Configuration

```yaml
framework_extraction:
  version: 1.0.0

  analyze:
    rpd_patterns: all
    min_fragments: 5
    confidence_threshold: 0.70
    coverage_threshold: 0.50
    clustering_similarity: 0.60

  identify:
    min_frameworks: 3
    min_heuristics: 5
    match_threshold: 0.70
    novel_detection: true
    novel_min_support: 2
    actionability_threshold: 0.70

  organize:
    summarization_layers: 5
    max_executive_words: 250
    para_required: true
    min_tags: 5
    index_update: true
    cross_link: true

  comparison:
    enabled: false
    min_transcripts: 2
    max_transcripts: 10
    cross_reference_depth: full
```

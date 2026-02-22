# Task: Build Knowledge Base

**Task ID:** content-distillery/build-knowledge-base
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Knowledge Management Workflow
**Total Lines:** 420+

---

## Executive Summary

This is an atomic task that organizes all extracted frameworks, heuristics, mental models, and distilled content into a searchable, structured knowledge base using the PARA methodology. It creates a living reference system that grows with every processed live, enabling rapid retrieval and cross-pollination of ideas across sources.

**Workflow Position:** Post-extraction phase, after frameworks and heuristics are identified
**Success Definition:** Fully indexed, cross-referenced knowledge base with PARA classification and knowledge graph
**Output Quality Gate:** Every entry must have 3+ tags, PARA classification, and at least 1 cross-reference

---

## Purpose

Transform the raw output of framework extraction and progressive summarization into a durable, navigable knowledge system. Without this task, extracted frameworks become write-once-read-never artifacts buried in files. A well-structured KB enables: rapid lookup during content creation, pattern detection across sources, and compound knowledge growth over time.

This task prevents the "extraction graveyard" problem where brilliant frameworks are extracted but never reused because nobody can find them.

---

## Executor Type

**Agent (90% Agent, 10% Human)**

- **Agent Role (knowledge-architect):** Classifies entries, generates indices, builds cross-references, creates knowledge graph, detects duplicates
- **Human Role:** Validates PARA classification for ambiguous entries, approves final taxonomy, resolves duplicate conflicts

---

## Inputs

### Required Inputs

```yaml
extracted_frameworks:
  field: "Frameworks extracted from source content"
  format: "markdown files or YAML"
  required: true
  example: |
    - framework: "Content Recycling Matrix"
      source: "Gary Vee Keynote 2024"
      type: "strategic"
      description: "4x4 matrix mapping content format (video, text, audio, image) against platform (LinkedIn, X, IG, YT)"
      key_insight: "Every piece of content has 16 derivative forms"
  validation: "Must include framework name, source, type, and at least 1 key insight"

extracted_heuristics:
  field: "Practical heuristics and rules of thumb"
  format: "markdown files or YAML"
  required: true
  example: |
    - heuristic: "The 80/20 of YouTube Titles"
      source: "Paddy Galloway Masterclass"
      rule: "Spend 80% of title effort on first 5 words"
      context: "YouTube truncates titles on mobile after ~50 chars"
  validation: "Must include heuristic name, source, rule statement, and usage context"

distilled_content:
  field: "Progressive summarization layers 4-5 output"
  format: "markdown"
  required: true
  example: |
    ## Layer 5 Remix: Content Leverage
    The single most important insight from 3 hours of Vaynerchuk:
    Document > Create. Recording what you already do produces 10x more
    content than sitting down to "create content."
  validation: "Must be Layer 4 or Layer 5 output from progressive summarization"

existing_kb:
  field: "Current knowledge base (if any)"
  format: "directory path or YAML index"
  required: false
  example: "data/knowledge-base/index.yaml"
  validation: "Must be valid YAML if provided"
```

### Optional Inputs

```yaml
taxonomy_override:
  field: "Custom taxonomy for classification"
  format: "YAML"
  example: |
    categories:
      - content-strategy
      - audience-growth
      - monetization
      - production-workflow

priority_tags:
  field: "Tags to prioritize in classification"
  format: "list"
  example: ["youtube", "newsletter", "framework", "mental-model"]

source_metadata:
  field: "Additional metadata about content sources"
  format: "YAML"
  example: |
    source_name: "Gary Vaynerchuk"
    source_type: "keynote"
    date: "2024-11-15"
    duration_minutes: 180
```

---

## Preconditions

Before starting this task:

- [ ] At least one set of extracted frameworks exists (from extract-tacit-knowledge or identify-frameworks tasks)
- [ ] Progressive summarization has been completed (layers 4-5 available)
- [ ] Source metadata is available (who said it, when, where)
- [ ] Write access to `data/knowledge-base/` directory

---

## Steps

### Step 1: Load and Inventory All Extracted Content (5 min)

**Agent Activity:**
- Scan all input directories for extracted frameworks, heuristics, and distilled content
- Create a master inventory list:
  - Total frameworks found
  - Total heuristics found
  - Total distilled insights found
  - Sources represented
  - Date range of sources
- Flag any inputs that are malformed or missing required fields

**Error Handling:**
- If input files are missing required fields, log the deficiency and proceed with available data
- If no inputs are found, HALT and report to human with specific file paths checked

**Checkpoint:** Inventory complete with total counts and any flagged issues

---

### Step 2: Classify Each Item Using PARA Methodology (15 min)

**Agent Activity:**
- For each extracted item, apply PARA classification:

  **Projects (Active Use)**
  - Definition: Frameworks actively being used in current content campaigns
  - Signal: Referenced in upcoming content calendar, part of active workflow
  - Example: "Content Recycling Matrix" → PROJECT if currently planning multi-platform campaign
  - Action: Tag with `para: project`, link to active campaign/initiative

  **Areas (Ongoing Domains)**
  - Definition: Domains of expertise being continuously tracked and developed
  - Signal: Recurring topic across multiple sources, evergreen relevance
  - Example: "YouTube Algorithm Principles" → AREA if continuously studying YouTube growth
  - Action: Tag with `para: area`, link to domain taxonomy

  **Resources (Future Reference)**
  - Definition: Frameworks valuable for future use but not currently active
  - Signal: High quality but no immediate application, "save for later"
  - Example: "Podcast Launch Framework" → RESOURCE if not currently launching podcast
  - Action: Tag with `para: resource`, add retrieval tags for future discovery

  **Archives (Completed/Outdated)**
  - Definition: Frameworks that are outdated, superseded, or from completed projects
  - Signal: Platform-specific advice from 2+ years ago, superseded by newer model
  - Example: "Instagram Reels Algorithm 2022" → ARCHIVE if outdated
  - Action: Tag with `para: archive`, note why archived

- For ambiguous items, flag for human review with reasoning:
  ```
  AMBIGUOUS: "Hook Writing Formula"
  Could be: PROJECT (if actively writing hooks) or RESOURCE (if saved for later)
  Agent recommendation: PROJECT (referenced in 3 recent content plans)
  Human decision needed: Y/N
  ```

**Checkpoint:** Every item has PARA classification. Ambiguous items flagged for human review.

---

### Step 3: Create Multi-Dimensional Index (10 min)

**Agent Activity:**
- Build index across 4 dimensions:

  **Index 1: By Topic/Domain**
  ```yaml
  topics:
    content-strategy:
      - content-recycling-matrix
      - document-vs-create
      - pillar-content-model
    youtube-growth:
      - ccn-rule
      - clickbait-theory
      - thumbnail-psychology
    audience-building:
      - 1000-true-fans
      - community-flywheel
  ```

  **Index 2: By Author/Source**
  ```yaml
  sources:
    gary_vaynerchuk:
      frameworks: [content-recycling-matrix, document-vs-create]
      heuristics: [jab-jab-right-hook]
      total_items: 12
    paddy_galloway:
      frameworks: [ccn-rule, clickbait-theory]
      heuristics: [80-20-title-rule]
      total_items: 8
  ```

  **Index 3: By Framework Type**
  ```yaml
  types:
    strategic: [content-recycling-matrix, pillar-content-model]
    tactical: [80-20-title-rule, hook-writing-formula]
    mental_model: [document-vs-create, 1000-true-fans]
    heuristic: [jab-jab-right-hook, 3-second-hook-test]
  ```

  **Index 4: By Date Added**
  ```yaml
  timeline:
    2026-02-12:
      added: [content-recycling-matrix, ccn-rule, ...]
      sources_processed: [gary-vee-keynote-2024, paddy-masterclass]
    2026-02-10:
      added: [pillar-content-model, ...]
      sources_processed: [justin-welsh-workshop]
  ```

**Checkpoint:** All 4 indices generated and internally consistent (same total count)

---

### Step 4: Cross-Reference with Existing KB (8 min)

**Agent Activity:**
- If existing KB provided, perform deduplication scan:
  1. **Exact Duplicates:** Same framework name + same source → SKIP (already in KB)
  2. **Near Duplicates:** Same concept, different name → FLAG for merge decision
     - Example: "Content Repurposing Matrix" vs "Content Recycling Matrix" → likely same
  3. **Complementary Entries:** Same topic, different angle → LINK together
     - Example: Gary Vee's "Document > Create" + Justin Welsh's "Content Flywheel" → related
  4. **Contradictory Entries:** Same topic, opposing views → FLAG with both perspectives
     - Example: "Post daily for growth" vs "Post 3x/week for quality" → contradiction

- Generate deduplication report:
  ```yaml
  dedup_report:
    exact_duplicates: 3
    near_duplicates: 5  # need human review
    new_entries: 24
    complementary_links: 8
    contradictions: 2
  ```

**Error Handling:**
- If existing KB is corrupted or unreadable, log error and treat as fresh KB (no dedup)
- If near-duplicate confidence is below 70%, add both entries and flag for human review

**Checkpoint:** Dedup report generated. Near-duplicates and contradictions flagged for review.

---

### Step 5: Generate Knowledge Graph (12 min)

**Agent Activity:**
- Build relationship graph between all KB entries:
  1. **"Extends" Relationships:** Framework A builds on Framework B
     - Example: "Content Pyramid" extends "Pillar Content Model"
  2. **"Contradicts" Relationships:** Framework A disagrees with Framework B
     - Example: "Daily posting" contradicts "3x/week quality approach"
  3. **"Complements" Relationships:** Framework A + B work together
     - Example: "Hook Writing" complements "YouTube Title Optimization"
  4. **"Supersedes" Relationships:** Framework A replaces outdated Framework B
     - Example: "2024 Algorithm Update" supersedes "2022 Algorithm Heuristics"
  5. **"Same Source" Relationships:** Multiple frameworks from one expert
     - Example: All Gary Vee frameworks linked to his source cluster

- Calculate connection density per entry:
  ```yaml
  connection_density:
    high_connectivity: # 5+ connections
      - content-recycling-matrix (8 connections)
      - pillar-content-model (6 connections)
    low_connectivity: # 0-1 connections
      - obscure-heuristic-47 (0 connections)  # may need review
  ```

- Identify hub nodes (most connected frameworks) and orphan nodes (isolated entries)

**Checkpoint:** Knowledge graph YAML complete with all relationship types mapped

---

### Step 6: Create Searchable Tags and Categories (8 min)

**Agent Activity:**
- Generate tag taxonomy:
  - **Domain Tags:** content-strategy, youtube, newsletter, social-media, audience, monetization
  - **Format Tags:** framework, heuristic, mental-model, checklist, template, formula
  - **Application Tags:** writing, video, audio, design, distribution, analytics
  - **Difficulty Tags:** beginner, intermediate, advanced, expert
  - **Urgency Tags:** evergreen, trending, time-sensitive, seasonal

- Apply 3-7 tags per entry (minimum 3 enforced):
  ```yaml
  entry: content-recycling-matrix
  tags:
    domain: [content-strategy, social-media]
    format: [framework]
    application: [distribution, writing]
    difficulty: [intermediate]
    urgency: [evergreen]
  ```

- Validate tag coverage:
  - Every entry has at least 1 domain tag
  - Every entry has exactly 1 format tag
  - No orphan tags (tags used by only 1 entry get flagged)

**Checkpoint:** All entries tagged. Tag coverage report generated.

---

### Step 7: Save to Structured Format (5 min)

**Agent Activity:**
- Write master index file: `data/knowledge-base/index.yaml`
  ```yaml
  knowledge_base:
    version: "1.0.0"
    last_updated: "2026-02-12T14:30:00Z"
    total_entries: 47
    para_distribution:
      projects: 8
      areas: 15
      resources: 20
      archives: 4
    sources_count: 6
    relationship_count: 32
  ```

- Write individual entry files to `data/knowledge-base/entries/{slug}.md`:
  ```markdown
  # Content Recycling Matrix

  **ID:** content-recycling-matrix
  **Source:** Gary Vaynerchuk, Keynote 2024
  **Type:** Strategic Framework
  **PARA:** Project
  **Tags:** content-strategy, social-media, distribution, intermediate, evergreen

  ## Description
  4x4 matrix mapping content format against platform...

  ## Key Insight
  Every piece of content has 16 derivative forms...

  ## Connections
  - Extends: pillar-content-model
  - Complements: hook-writing-formula, content-atomization
  - Same Source: document-vs-create, jab-jab-right-hook

  ## Usage Notes
  Apply when planning multi-platform distribution from a single pillar piece...
  ```

- Write knowledge graph file: `data/knowledge-base/graph.yaml`
  ```yaml
  graph:
    nodes: 47
    edges: 32
    relationships:
      extends: 8
      complements: 14
      contradicts: 3
      supersedes: 2
      same_source: 5
    hub_nodes:
      - content-recycling-matrix (8 edges)
      - pillar-content-model (6 edges)
    orphan_nodes:
      - obscure-heuristic-47
  ```

- Generate build report with statistics and quality metrics

**Error Handling:**
- If write fails due to permissions, report exact path and permission error
- If directory does not exist, create it with `mkdir -p`
- If file already exists, create backup before overwriting

**Checkpoint:** All files written. Build report confirms file counts match index totals.

---

## Outputs

### Primary Outputs

**1. Knowledge Base Index**

Format: YAML
Location: `data/knowledge-base/index.yaml`

```yaml
knowledge_base:
  version: "1.0.0"
  last_updated: "2026-02-12T14:30:00Z"
  total_entries: 47
  para_distribution:
    projects: 8
    areas: 15
    resources: 20
    archives: 4
  indices:
    by_topic: 12   # topic categories
    by_source: 6   # unique sources
    by_type: 4     # framework types
    by_date: 3     # date buckets
  tags:
    total_unique: 28
    avg_per_entry: 4.2
  relationships:
    total: 32
    extends: 8
    complements: 14
    contradicts: 3
    supersedes: 2
    same_source: 5
```

**2. Individual Entry Files**

Format: Markdown
Location: `data/knowledge-base/entries/{slug}.md`
Count: 1 file per KB entry (matches total_entries in index)

**3. Knowledge Graph**

Format: YAML
Location: `data/knowledge-base/graph.yaml`
Content: All nodes, edges, relationship types, hub/orphan analysis

### Secondary Outputs

1. **Deduplication Report**
   - Format: YAML
   - Content: Exact dupes found, near-dupes flagged, contradictions identified
   - Use: Human review of merge/conflict decisions

2. **Tag Coverage Report**
   - Format: Markdown
   - Content: Tag distribution, orphan tags, under-tagged entries
   - Use: Taxonomy refinement over time

3. **Build Statistics**
   - Format: YAML
   - Content: Processing time, entries processed, error count
   - Use: Performance tracking and debugging

---

## Validation

### Checklist

- [ ] Every extracted framework has a corresponding KB entry file
- [ ] Every entry has a PARA classification (no unclassified items)
- [ ] Every entry has 3-7 tags (minimum 3 enforced)
- [ ] Every entry has at least 1 cross-reference (no orphans, or orphans explicitly flagged)
- [ ] Index totals match actual file count in entries/ directory
- [ ] Knowledge graph node count matches index total_entries
- [ ] All 4 index dimensions generated (topic, source, type, date)
- [ ] Deduplication scan completed (even if no existing KB)
- [ ] No duplicate slugs in entries/ directory
- [ ] All entry files follow the standard template format

### Success Criteria

**Threshold: 9/10 on quality rubric**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **PARA accuracy** | Every classification is justified with clear reasoning | Most classifications correct, 1-2 ambiguous unresolved | Multiple items clearly misclassified |
| **Index completeness** | All 4 indices present, internally consistent, zero orphans | 3/4 indices present, minor inconsistencies | Missing indices or significant count mismatches |
| **Cross-reference quality** | Rich graph with extends/complements/contradicts relationships | Basic connections present but shallow | Few or no cross-references |
| **Tag taxonomy** | Tags are specific, non-overlapping, consistently applied | Tags present but some overlap or inconsistency | Generic or missing tags |
| **Dedup thoroughness** | Near-dupes detected with confidence scores, contradictions flagged | Exact dupes caught but near-dupes missed | No dedup performed |
| **Searchability** | Any framework retrievable in < 2 lookups via any index | Most items findable but some require browsing | KB requires manual scanning to find items |

---

## Estimated Effort

| Role | Effort | Notes |
|------|--------|-------|
| **Agent (knowledge-architect)** | 45-60 min | Classification, indexing, graph generation |
| **Human** | 10-15 min | Review ambiguous PARA, approve taxonomy, resolve dupes |
| **Total Duration** | 55-75 min | Sequential (agent prepares, human reviews) |

---

## Integration

### Feeds To

**Tasks:**
- `atomize-content` — Uses KB entries as source material for content pieces
- `cross-reference-frameworks` — Uses KB + graph for multi-source comparison
- `design-ecosystem` — Uses KB taxonomy for content categorization

### Depends On

- `extract-tacit-knowledge` — Provides extracted frameworks
- `identify-frameworks` — Provides identified mental models
- `progressive-summarize` — Provides Layer 4-5 distilled content

### Agent Routing

**Primary Agent:** knowledge-architect (Tiago Forte methodology)
**Secondary Agents:** model-identifier (validates framework classification)

**Handoff:** Output is self-contained. Downstream tasks read from `data/knowledge-base/` directory.

---

## Quality Threshold

**Pass/Fail Gate:** KB must score >= 9/10 on checklist above

If < 9/10:
1. Identify which criteria failed
2. Re-run classification for misclassified items
3. Add missing cross-references
4. Re-validate index consistency
5. Re-run validation

**Common Failure Reasons:**
- PARA classification done generically (everything marked "Resource")
- Tags too broad ("content" instead of "content-strategy")
- No cross-references generated (isolated entries)
- Index counts don't match actual files
- Dedup skipped on existing KB

---

## Error Handling

### Input Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| No frameworks found | Empty input directory | HALT, report missing input paths |
| Malformed YAML | Parse error on load | Skip malformed entry, log error, continue |
| Missing required fields | Validation check | Add entry with `incomplete: true` flag |
| Existing KB corrupted | Parse error on load | Treat as fresh KB, warn human |

### Processing Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| Duplicate slugs | Slug collision during write | Append `-2`, `-3` suffix |
| Graph cycle detected | Circular "extends" relationships | Break cycle at weakest link, flag for review |
| Tag explosion | Entry has > 10 tags | Trim to 7 most relevant, flag for review |
| Write permission error | OS error on file write | Report path, suggest `chmod` fix |

---

## Notes for Executor

### When Processing First-Ever KB (No Existing Data)

- Skip Step 4 (cross-reference with existing) entirely
- Focus on creating a solid taxonomy that will scale
- Default PARA classification to "Resource" when unsure (human will refine)

### When Processing Large Batches (50+ Frameworks)

- Process in chunks of 20 to maintain classification quality
- Validate each chunk before proceeding to next
- Track classification fatigue (quality tends to drop after 30+ items)

### When Conflicting Frameworks Are Found

- NEVER delete or suppress contradictory frameworks
- Document both perspectives with source attribution
- Flag contradiction for human to decide resolution strategy
- Mark both entries with `has_contradiction: true`

### KB Maintenance Over Time

- Re-run PARA classification quarterly (Projects may become Archives)
- Tag taxonomy should be reviewed when it exceeds 50 unique tags
- Knowledge graph should be regenerated after every 10+ new entries

---

## Example Input/Output

### Example Input

```yaml
# From extract-tacit-knowledge output
frameworks:
  - name: "Content Recycling Matrix"
    source: "Gary Vaynerchuk Keynote 2024"
    type: "strategic"
    insight: "Every content piece has 16 derivative forms"

  - name: "CCN Rule"
    source: "Paddy Galloway YouTube Masterclass"
    type: "tactical"
    insight: "Every video must serve Core, Casual, and New viewers"

heuristics:
  - name: "The 3-Second Hook Test"
    source: "Nicolas Cole Writing Workshop"
    rule: "If the first sentence doesn't create curiosity in 3 seconds, rewrite it"
```

### Example Output (Entry File)

```markdown
# Content Recycling Matrix

**ID:** content-recycling-matrix
**Source:** Gary Vaynerchuk, Keynote 2024
**Type:** Strategic Framework
**PARA:** Project
**Tags:** content-strategy, social-media, distribution, multi-platform, evergreen
**Added:** 2026-02-12

## Description
4x4 matrix mapping content format (video, text, audio, image) against platform
(LinkedIn, X, Instagram, YouTube). Produces 16 derivative content pieces from
every single pillar content piece.

## Key Insight
Every piece of content has 16 derivative forms. The bottleneck is never ideas—
it's the system to transform one format into another efficiently.

## Connections
- Complements: atomize-content-task, content-pyramid, pillar-content-model
- Same Source: document-vs-create, jab-jab-right-hook, day-trading-attention

## Application
Use during the atomize-content task to systematically generate platform-specific
pieces from each pillar. Start with the original format and fill in remaining
15 cells of the matrix.
```

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

# Task: Distill Single Live (Full Pipeline Orchestrator)

**Task ID:** content-distillery/distill-single-live
**Version:** 2.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Updated:** 2026-02-12
**Category:** Content Distillery Pipeline
**Total Lines:** 900+

---

## Executive Summary

This is the "easy button" for the Content Distillery. The user provides a single YouTube URL and receives a complete distillation: transcript, tacit knowledge, frameworks, progressive summarization, content ideas, atomized content pieces, ecosystem map, batch-produced drafts, and YouTube-optimized packages. This task orchestrates all 9 upstream tasks in sequence, handles errors between stages, preserves pipeline context across handoffs, and produces a consolidated final report.

**Workflow Position:** Master orchestrator - calls all 9 tasks in sequence
**Success Definition:** Complete distillation from URL to production-ready, platform-optimized content in a single command
**Output Quality Gate:** All 9 upstream tasks pass their individual quality gates; consolidated report generated; pipeline context preserved

---

## Purpose

Running 9 tasks manually requires understanding the full pipeline, managing file paths between stages, checking quality gates between steps, making proceed/retry decisions, and tracking which agent handles which step. This task eliminates all that overhead. The user provides a URL, optionally provides context (expert name, target audience, focus areas), and gets back everything: transcript, tacit knowledge, frameworks, progressive summarization, content ideas, atomized content pieces, ecosystem map, batch-produced drafts, and YouTube-optimized packages - all in one command.

This task also handles the critical decision points between stages: What happens if the transcript quality is marginal? Should we proceed with extraction anyway? What if no novel frameworks are found? Should we still multiply ideas? What if atomization produces fewer pieces than expected? The orchestrator makes these decisions automatically based on configurable thresholds, only escalating to the human when something truly unexpected happens.

The 9-step pipeline covers the complete content lifecycle:
1. **Ingest** - Get the raw material (transcript)
2. **Extract** - Find the hidden knowledge (tacit knowledge)
3. **Identify** - Name the patterns (frameworks, heuristics)
4. **Summarize** - Compress progressively (5-layer distillation)
5. **Multiply** - Generate content ideas (seeds, angles, headlines)
6. **Atomize** - Break into platform-specific pieces (content atoms)
7. **Ecosystem** - Design cross-platform strategy (ecosystem map)
8. **Produce** - Write production-ready drafts (batch production)
9. **YouTube-Optimize** - Package for YouTube specifically (titles, thumbnails, tags)

---

## Executor Type

**Hybrid (distillery-chief orchestrates, individual agents execute)**

- **Orchestrator:** distillery-chief (manages pipeline flow, handles errors, makes proceed/retry decisions, preserves pipeline context)
- **Step 1 Executor:** Automated worker (ingest-youtube)
- **Step 2 Executor:** tacit-extractor agent (extract-tacit-knowledge)
- **Step 3 Executor:** model-identifier agent (identify-frameworks)
- **Step 4 Executor:** knowledge-architect agent (progressive-summarize)
- **Step 5 Executor:** idea-multiplier agent (multiply-ideas)
- **Step 6 Executor:** content-atomizer agent (atomize-content)
- **Step 7 Executor:** ecosystem-designer agent (design-ecosystem)
- **Step 8 Executor:** production-ops agent (produce-batch)
- **Step 9 Executor:** youtube-strategist agent (optimize-youtube)
- **Human Role:** Provides URL and optional context at start; reviews consolidated report at end

---

## Inputs

### Required Inputs

```yaml
youtube_url:
  field: "YouTube video or livestream URL"
  format: "string (URL)"
  required: true
  example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  validation: "Valid YouTube URL (video, livestream, or shorts)"
  notes: "The only required input - everything else has sensible defaults"
```

### Optional Inputs

```yaml
output_slug:
  field: "Custom slug for output directory"
  format: "string (snake_case)"
  required: false
  default: "auto-generated from video title"
  example: "hormozi_100m_leads_ep47"
  validation: "Must match ^[a-z0-9]+(_[a-z0-9]+)*$ (snake_case)"
  notes: "If not provided, auto-generated from channel + title"

expert_name:
  field: "Name of the primary speaker/expert"
  format: "string"
  required: false
  example: "Alex Hormozi"
  notes: "Improves tacit knowledge extraction and framework attribution"

expert_domain:
  field: "Expert's primary domain"
  format: "string"
  required: false
  example: "business growth, offers, acquisition"
  notes: "Focuses extraction on relevant mental models"

target_audience:
  field: "Who will consume the distilled content"
  format: "text"
  required: false
  example: "B2B SaaS founders at $1M-$10M ARR"
  notes: "Sharpens the content multiplication FOR WHO filter"

extraction_focus:
  field: "Specific topics to focus extraction on"
  format: "list of strings"
  required: false
  example: ["pricing", "retention", "team building"]
  notes: "Narrows extraction to specific topics if video covers many"

language:
  field: "Primary language of the video"
  format: "string (ISO 639-1)"
  default: "pt"
  notes: "Affects transcription model and cleaning rules"

target_platforms:
  field: "Platforms for content multiplication and atomization"
  format: "list of strings"
  default: ["twitter", "linkedin", "newsletter", "youtube_shorts", "youtube_long"]
  notes: "Restricts content ideas and atoms to specified platforms"

channel_context:
  field: "YouTube channel information for optimization context"
  format: "YAML"
  required: false
  example: |
    channel:
      name: "Creator Academy"
      subscribers: 15000
      niche: "content creation / entrepreneurship"
      avg_views: 2500
      top_performing_topics: ["content strategy", "YouTube growth"]
  notes: "Used by youtube-strategist in Step 9 for CCN analysis"

skip_steps:
  field: "Tasks to skip (for partial re-runs)"
  format: "list of strings"
  required: false
  default: []
  example: ["ingest-youtube", "extract-tacit-knowledge"]
  notes: "Use when re-running pipeline after fixing one task"

quality_threshold:
  field: "Minimum quality score to auto-proceed"
  format: "float"
  default: 7.0
  notes: "Tasks scoring below this threshold trigger human review"

production_style:
  field: "Style guide for batch production"
  format: "string"
  required: false
  example: "conversational, data-backed, short paragraphs"
  notes: "Passed to production-ops agent in Step 8"
```

---

## Preconditions

Before starting this task:

- [ ] YouTube URL is accessible (not private/deleted)
- [ ] Output base directory `outputs/distillery/` exists or can be created
- [ ] All required tools are available (yt-dlp, whisper, ffmpeg)
- [ ] No existing distillation for this exact URL+slug combination (or re-run explicitly requested)
- [ ] Sufficient disk space (~500MB for a 2-hour livestream with audio)
- [ ] All 9 agent definitions loaded and available

---

## Pipeline Context Object

The pipeline context object is the shared state that flows across all 9 steps. Each step reads from it and writes to it, ensuring continuity.

```yaml
pipeline_context:
  # Set at initialization
  slug: "{slug}"
  url: "{youtube_url}"
  language: "{language}"
  quality_threshold: 7.0
  skip_steps: []
  started_at: "2026-02-12T10:00:00Z"
  mode: "full_pipeline"

  # Populated by Step 1 (Ingest)
  transcript_path: null
  metadata_path: null
  transcript_quality: null
  video_duration_minutes: null

  # Populated by Step 2 (Extract)
  tacit_knowledge_path: null
  fragment_count: 0
  heuristic_count: 0

  # Populated by Step 3 (Identify)
  frameworks_path: null
  heuristics_path: null
  known_models_count: 0
  novel_frameworks_count: 0

  # Populated by Step 4 (Summarize)
  layers_path: null
  layers_complete: 0
  intermediate_packets_count: 0
  executive_summary_path: null

  # Populated by Step 5 (Multiply)
  content_ideas_path: null
  total_ideas: 0
  calendared_ideas: 0

  # Populated by Step 6 (Atomize)
  atoms_path: null
  total_atoms: 0
  atoms_by_platform: {}
  tier_1_atoms: 0

  # Populated by Step 7 (Ecosystem)
  ecosystem_map_path: null
  publishing_calendar_path: null
  cross_platform_links: 0

  # Populated by Step 8 (Produce)
  drafts_path: null
  total_drafts: 0
  drafts_by_platform: {}
  production_quality_avg: 0

  # Populated by Step 9 (YouTube Optimize)
  youtube_optimized_path: null
  youtube_pieces_optimized: 0
  avg_ccn_score: 0
  title_variants_generated: 0

  # Pipeline tracking
  current_step: 0
  steps_completed: []
  steps_skipped: []
  steps_failed: []
  warnings: []
  total_duration_minutes: 0
```

---

## Steps

### Step 1: Initialize Pipeline (1 min)

**Orchestrator Activity:**
- Validate YouTube URL format
- Generate output slug if not provided:
  - Extract video title and channel from YouTube
  - Create slug: `{channel_slug}_{title_slug}_{date}`
  - Example: `alex_hormozi_retention_secrets_20260212`
- Create output directory structure:
  ```
  outputs/distillery/{slug}/
  ├── distilled/
  ├── ideas/
  ├── atoms/
  ├── ecosystem/
  ├── drafts/
  └── youtube/
  ```
- Initialize pipeline context object with all inputs
- Save pipeline context to `{slug}/pipeline-context.yaml`
- Log pipeline initialization

**Error Handling:**
- Invalid URL: ABORT immediately with clear error
- Duplicate slug: append timestamp suffix and warn
- Missing tools: list what is missing and suggest installation
- Directory creation fails: check permissions, suggest alternative path

**Checkpoint:** Pipeline initialized, directory structure created, context saved

---

### Step 2: Execute Task 1 - Ingest YouTube (3-35 min)

**Orchestrator Activity:**
- Skip if "ingest-youtube" in `skip_steps`
- Delegate to `ingest-youtube` task with configured inputs:
  ```yaml
  ingest_inputs:
    youtube_url: "{pipeline_context.url}"
    output_slug: "{pipeline_context.slug}"
    language: "{pipeline_context.language}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    transcript_path: "{slug}/transcript.md"
    metadata_path: "{slug}/metadata.yaml"
    transcript_quality: "{quality-report.yaml composite_score}"
    video_duration_minutes: "{metadata.duration}"
  ```
- Check quality gate:

```yaml
quality_gate_1:
  task: "ingest-youtube"
  check: "quality-report.yaml composite_score"
  threshold: "{quality_threshold}"

  on_pass:
    action: "proceed_to_step_3"
    log: "Transcript ingested successfully (score: {score}/10)"

  on_warn:  # score 5-6.9
    action: "proceed_with_warning"
    log: "WARNING: Transcript quality marginal ({score}/10). Extraction may be affected."
    add_to_warnings: true
    human_notification: false  # proceed automatically

  on_fail:  # score < 5
    action: "retry_once_with_whisper"
    log: "FAIL: Transcript quality too low ({score}/10). Retrying with Whisper..."

  on_retry_fail:
    action: "abort_or_escalate"
    log: "ABORT: Transcript quality insufficient after retry. Human review required."
    human_notification: true
```

**Checkpoint:** Transcript available at `{slug}/transcript.md` with quality >= threshold

---

### Step 3: Execute Task 2 - Extract Tacit Knowledge (15-45 min)

**Orchestrator Activity:**
- Skip if "extract-tacit-knowledge" in `skip_steps`
- Delegate to `extract-tacit-knowledge` task with:
  ```yaml
  extract_inputs:
    transcript: "{pipeline_context.transcript_path}"
    metadata: "{pipeline_context.metadata_path}"
    expert_name: "{expert_name or null}"
    expert_domain: "{expert_domain or null}"
    extraction_focus: "{extraction_focus or null}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    tacit_knowledge_path: "{slug}/tacit-knowledge.yaml"
    fragment_count: "{extracted_fragments_count}"
    heuristic_count: "{extracted_heuristics_count}"
  ```
- Check quality gate:

```yaml
quality_gate_2:
  task: "extract-tacit-knowledge"
  check: "fragment_count and heuristic_count"
  minimum_fragments: 5
  minimum_heuristics: 1

  on_pass:
    action: "proceed_to_step_4"
    log: "Extracted {n} fragments and {m} heuristics"

  on_low_density:  # fewer fragments than expected
    action: "proceed_with_note"
    log: "NOTE: Low extraction density ({n} fragments). Content may be more theoretical than experiential."
    adjustment: "Lower novelty expectations for Step 4"
    add_to_warnings: true
    human_notification: false

  on_fail:  # < 5 fragments
    action: "proceed_with_warning"
    log: "WARNING: Very few tacit knowledge fragments ({n}). Content may not be experience-rich."
    add_to_warnings: true
    human_notification: false  # still proceed, downstream tasks handle gracefully
```

**Checkpoint:** tacit-knowledge.yaml available with fragments and heuristics

---

### Step 4: Execute Task 3 - Identify Frameworks (20-40 min)

**Orchestrator Activity:**
- Skip if "identify-frameworks" in `skip_steps`
- Delegate to `identify-frameworks` task with:
  ```yaml
  identify_inputs:
    tacit_knowledge: "{pipeline_context.tacit_knowledge_path}"
    transcript: "{pipeline_context.transcript_path}"
    metadata: "{pipeline_context.metadata_path}"
    domain_context: "{expert_domain or null}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    frameworks_path: "{slug}/frameworks.yaml"
    heuristics_path: "{slug}/heuristics.yaml"
    known_models_count: "{known_models_matched}"
    novel_frameworks_count: "{novel_frameworks_identified}"
  ```
- Check quality gate:

```yaml
quality_gate_3:
  task: "identify-frameworks"
  check: "framework_count (known + novel)"
  minimum_total: 3

  on_pass:
    action: "proceed_to_step_5"
    log: "Identified {n} known models and {m} novel frameworks"

  on_low_count:  # 1-2 frameworks
    action: "proceed_with_note"
    log: "NOTE: Few frameworks identified ({n} total). Content multiplication will be narrower."
    add_to_warnings: true
    human_notification: false

  on_fail:  # 0 frameworks
    action: "proceed_with_heuristics_only"
    log: "WARNING: No frameworks identified. Multiplication will use heuristics only."
    add_to_warnings: true
    human_notification: false  # heuristics alone can still generate content
```

**Checkpoint:** frameworks.yaml and heuristics.yaml available

---

### Step 5: Execute Task 4 - Progressive Summarize (20-40 min)

**Orchestrator Activity:**
- Skip if "progressive-summarize" in `skip_steps`
- Delegate to `progressive-summarize` task with:
  ```yaml
  summarize_inputs:
    transcript: "{pipeline_context.transcript_path}"
    metadata: "{pipeline_context.metadata_path}"
    tacit_knowledge: "{pipeline_context.tacit_knowledge_path}"
    frameworks: "{pipeline_context.frameworks_path}"
    heuristics: "{pipeline_context.heuristics_path}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    layers_path: "{slug}/distilled/"
    layers_complete: 5
    intermediate_packets_count: "{packets_generated}"
    executive_summary_path: "{slug}/distilled/executive-summary.md"
  ```
- Check quality gate:

```yaml
quality_gate_4:
  task: "progressive-summarize"
  check: "all 5 layers exist, compression ratios valid"

  on_pass:
    action: "proceed_to_step_6"
    log: "Progressive summarization complete. 5 layers + {n} intermediate packets."

  on_ratio_off:
    action: "proceed_with_note"
    log: "NOTE: Compression ratios slightly off target. Acceptable for downstream tasks."
    add_to_warnings: true
    human_notification: false

  on_fail:  # missing layers
    action: "retry_missing_layers"
    log: "FAIL: Layers missing. Retrying summarization..."
```

**Checkpoint:** 5 layers available at `{slug}/distilled/`

---

### Step 6: Execute Task 5 - Multiply Ideas (15-30 min)

**Orchestrator Activity:**
- Skip if "multiply-ideas" in `skip_steps`
- Delegate to `multiply-ideas` task with:
  ```yaml
  multiply_inputs:
    frameworks: "{pipeline_context.frameworks_path}"
    heuristics: "{pipeline_context.heuristics_path}"
    executive_summary: "{pipeline_context.executive_summary_path}"
    intermediate_packets: "{slug}/distilled/intermediate-packets.yaml"
    target_audience: "{target_audience or null}"
    target_platforms: "{target_platforms}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    content_ideas_path: "{slug}/ideas/content-ideas.yaml"
    total_ideas: "{ideas_generated}"
    calendared_ideas: "{ideas_calendared}"
  ```
- Check quality gate:

```yaml
quality_gate_5:
  task: "multiply-ideas"
  check: "content_ideas count and calendar completeness"
  minimum_ideas: 15

  on_pass:
    action: "proceed_to_step_7"
    log: "Generated {n} content ideas and {w} weeks of calendar"

  on_low_count:  # 10-14 ideas
    action: "proceed_with_note"
    log: "NOTE: Fewer ideas than expected ({n}). Atomization may produce fewer pieces."
    add_to_warnings: true
    human_notification: false

  on_fail:  # < 10 ideas
    action: "proceed_anyway"
    log: "WARNING: Low idea count ({n}). Calendar may be sparse."
    add_to_warnings: true
```

**Checkpoint:** Content ideas and calendar available at `{slug}/ideas/`

---

### Step 7: Execute Task 6 - Atomize Content (15-25 min)

**Orchestrator Activity:**
- Skip if "atomize-content" in `skip_steps`
- Delegate to `atomize-content` task with:
  ```yaml
  atomize_inputs:
    content_ideas: "{pipeline_context.content_ideas_path}"
    frameworks: "{pipeline_context.frameworks_path}"
    heuristics: "{pipeline_context.heuristics_path}"
    executive_summary: "{pipeline_context.executive_summary_path}"
    intermediate_packets: "{slug}/distilled/intermediate-packets.yaml"
    target_platforms: "{target_platforms}"
    target_audience: "{target_audience or null}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    atoms_path: "{slug}/atoms/"
    total_atoms: "{atoms_created}"
    atoms_by_platform:
      twitter: "{twitter_atoms}"
      linkedin: "{linkedin_atoms}"
      newsletter: "{newsletter_atoms}"
      youtube_shorts: "{yt_shorts_atoms}"
      youtube_long: "{yt_long_atoms}"
    tier_1_atoms: "{tier_1_count}"
  ```
- Check quality gate:

```yaml
quality_gate_6:
  task: "atomize-content"
  check: "total atoms and platform coverage"
  minimum_atoms: 10
  minimum_platforms: 3

  on_pass:
    action: "proceed_to_step_8"
    log: "Atomized into {n} content pieces across {p} platforms. {t1} are Tier 1."

  on_low_count:
    action: "proceed_with_note"
    log: "NOTE: Fewer atoms than expected ({n}). Ecosystem may have gaps."
    add_to_warnings: true
    human_notification: false

  on_fail:  # < 10 atoms or < 3 platforms
    action: "proceed_with_warning"
    log: "WARNING: Insufficient atomization ({n} atoms, {p} platforms). Review idea quality."
    add_to_warnings: true
```

**Checkpoint:** Atomized content pieces at `{slug}/atoms/` with platform tags

---

### Step 8: Execute Task 7 - Design Ecosystem (10-20 min)

**Orchestrator Activity:**
- Skip if "design-ecosystem" in `skip_steps`
- Delegate to `design-ecosystem` task with:
  ```yaml
  ecosystem_inputs:
    atoms: "{pipeline_context.atoms_path}"
    content_ideas: "{pipeline_context.content_ideas_path}"
    frameworks: "{pipeline_context.frameworks_path}"
    target_platforms: "{target_platforms}"
    target_audience: "{target_audience or null}"
    atoms_by_platform: "{pipeline_context.atoms_by_platform}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    ecosystem_map_path: "{slug}/ecosystem/ecosystem-map.yaml"
    publishing_calendar_path: "{slug}/ecosystem/publishing-calendar.yaml"
    cross_platform_links: "{links_created}"
  ```
- Check quality gate:

```yaml
quality_gate_7:
  task: "design-ecosystem"
  check: "ecosystem map completeness and cross-links"
  minimum_links: 5

  on_pass:
    action: "proceed_to_step_9"
    log: "Ecosystem designed with {n} cross-platform links and {w}-week calendar"

  on_low_links:
    action: "proceed_with_note"
    log: "NOTE: Few cross-platform links ({n}). Content may feel siloed."
    add_to_warnings: true
    human_notification: false

  on_fail:
    action: "proceed_anyway"
    log: "WARNING: Ecosystem map thin. Calendar may lack cohesion."
    add_to_warnings: true
```

**Checkpoint:** Ecosystem map and publishing calendar at `{slug}/ecosystem/`

---

### Step 9: Execute Task 8 - Produce Batch (20-40 min)

**Orchestrator Activity:**
- Skip if "produce-batch" in `skip_steps`
- Delegate to `produce-batch` task with:
  ```yaml
  produce_inputs:
    atoms: "{pipeline_context.atoms_path}"
    ecosystem_map: "{pipeline_context.ecosystem_map_path}"
    publishing_calendar: "{pipeline_context.publishing_calendar_path}"
    frameworks: "{pipeline_context.frameworks_path}"
    production_style: "{production_style or 'conversational, data-backed'}"
    target_platforms: "{target_platforms}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    drafts_path: "{slug}/drafts/"
    total_drafts: "{drafts_produced}"
    drafts_by_platform:
      twitter: "{twitter_drafts}"
      linkedin: "{linkedin_drafts}"
      newsletter: "{newsletter_drafts}"
      youtube_shorts: "{yt_shorts_scripts}"
      youtube_long: "{yt_long_scripts}"
    production_quality_avg: "{avg_quality_score}"
  ```
- Check quality gate:

```yaml
quality_gate_8:
  task: "produce-batch"
  check: "drafts produced and quality average"
  minimum_drafts: 8
  minimum_quality: 7.0

  on_pass:
    action: "proceed_to_step_10"
    log: "Produced {n} drafts across {p} platforms. Average quality: {q}/10"

  on_low_quality:
    action: "proceed_with_note"
    log: "NOTE: Production quality below target ({q}/10). YouTube optimization will use best drafts."
    add_to_warnings: true
    human_notification: false

  on_fail:
    action: "proceed_with_available"
    log: "WARNING: Only {n} drafts produced (target: 8+). Proceeding with available."
    add_to_warnings: true
```

**Checkpoint:** Production-ready drafts at `{slug}/drafts/`

---

### Step 10: Execute Task 9 - Optimize YouTube (40-55 min)

**Orchestrator Activity:**
- Skip if "optimize-youtube" in `skip_steps`
- Filter YouTube-tagged pieces from drafts and atoms
- If no YouTube pieces exist, skip this step automatically
- Delegate to `optimize-youtube` task with:
  ```yaml
  youtube_inputs:
    youtube_content_pieces: "{filtered YouTube drafts from slug/drafts/}"
    source_metadata:
      speaker: "{expert_name}"
      topic: "{expert_domain}"
      date: "{today}"
      niche: "{derived from domain}"
    channel_context: "{channel_context or defaults}"
  ```
- Monitor execution progress
- On completion, update pipeline context:
  ```yaml
  context_update:
    youtube_optimized_path: "{slug}/youtube/optimized/"
    youtube_pieces_optimized: "{pieces_optimized}"
    avg_ccn_score: "{avg_ccn}"
    title_variants_generated: "{titles_generated}"
  ```
- Check quality gate:

```yaml
quality_gate_9:
  task: "optimize-youtube"
  check: "CCN scores and title variants"
  minimum_ccn: 3.0
  titles_per_piece: 5

  on_pass:
    action: "proceed_to_report"
    log: "YouTube optimized: {n} pieces, avg CCN {ccn}/5, {t} title variants"

  on_low_ccn:
    action: "proceed_with_note"
    log: "NOTE: Some CCN scores below 3. Flagged pieces need script adjustment."
    add_to_warnings: true
    human_notification: false

  on_fail:
    action: "proceed_anyway"
    log: "WARNING: YouTube optimization incomplete. Manual review recommended."
    add_to_warnings: true
```

**Checkpoint:** YouTube-optimized packages at `{slug}/youtube/optimized/`

---

### Step 11: Generate Consolidated Report (3-5 min)

**Orchestrator Activity:**
- Read all outputs from Steps 1-9 via pipeline context
- Generate a single consolidated report that summarizes the entire distillation

**Consolidated Report Structure:**

```markdown
---
title: "Content Distillery Report"
source: "{video title}"
expert: "{expert name}"
url: "{youtube_url}"
distilled_at: "2026-02-12T11:30:00Z"
pipeline_duration: "{total minutes}"
pipeline_version: "2.0.0"
tasks_executed: 9
---

# Content Distillery Report: {Video Title}

## Source
- **Video:** [{title}]({url})
- **Expert:** {expert_name}
- **Channel:** {channel_name}
- **Duration:** {duration}
- **Published:** {publish_date}

## Pipeline Summary

| # | Task | Agent | Status | Duration | Key Metric |
|---|------|-------|--------|----------|------------|
| 1 | Ingest YouTube | worker | PASS | 4 min | Quality: 8.2/10 |
| 2 | Extract Tacit Knowledge | tacit-extractor | PASS | 25 min | 22 fragments, 7 heuristics |
| 3 | Identify Frameworks | model-identifier | PASS | 18 min | 3 known, 2 novel frameworks |
| 4 | Progressive Summarize | knowledge-architect | PASS | 22 min | 5 layers, 12 packets |
| 5 | Multiply Ideas | idea-multiplier | PASS | 15 min | 85 ideas, 24 calendared |
| 6 | Atomize Content | content-atomizer | PASS | 12 min | 64 atoms, 5 platforms |
| 7 | Design Ecosystem | ecosystem-designer | PASS | 10 min | 28 cross-links |
| 8 | Produce Batch | production-ops | PASS | 30 min | 48 drafts, avg 8.1/10 |
| 9 | Optimize YouTube | youtube-strategist | PASS | 45 min | 8 pieces, CCN 4.3/5 |
| **Total** | | | **PASS** | **181 min** | |

## Top 3 Frameworks

### 1. {Framework Name}
{2-3 sentence description + key quote}

### 2. {Framework Name}
{2-3 sentence description + key quote}

### 3. {Framework Name}
{2-3 sentence description + key quote}

## Top 5 Heuristics

1. **When** {trigger} **then** {action}
2. **When** {trigger} **then** {action}
3. **When** {trigger} **then** {action}
4. **When** {trigger} **then** {action}
5. **When** {trigger} **then** {action}

## Executive Summary (Layer 4)

{Include complete Layer 4 executive summary}

## Content Production Summary

| Platform | Atoms | Drafts | Ready |
|----------|-------|--------|-------|
| Twitter/X | {n} | {n} | {n} |
| LinkedIn | {n} | {n} | {n} |
| Newsletter | {n} | {n} | {n} |
| YouTube Shorts | {n} | {n} | {n} |
| YouTube Long | {n} | {n} | {n} |
| **Total** | {N} | {N} | {N} |

## YouTube Optimization Highlights

| Piece | Best Title | CCN Score | Recommended Publish |
|-------|-----------|-----------|-------------------|
| {piece_1} | {title} | {ccn}/5 | {date} |
| {piece_2} | {title} | {ccn}/5 | {date} |
| ... | ... | ... | ... |

## Content Calendar Preview (Week 1)

| Day | Platform | Headline | Score |
|-----|----------|----------|-------|
| Mon | Twitter | {headline} | 8.7 |
| Mon | LinkedIn | {headline} | 8.5 |
| Tue | Twitter | {headline} | 8.3 |
| Tue | YouTube Shorts | {headline} | 8.1 |
| Wed | Newsletter | {headline} | 8.0 |
| ... | ... | ... | ... |

## Ecosystem Map Summary

- Cross-platform content links: {n}
- Primary narrative thread: {description}
- Platform roles: Twitter (discovery), LinkedIn (authority), Newsletter (depth), YouTube (engagement)

## Files Generated

```
outputs/distillery/{slug}/
├── transcript.md               # Full transcript
├── metadata.yaml               # Video metadata
├── quality-report.yaml         # Transcript quality
├── tacit-knowledge.yaml        # Extracted tacit knowledge
├── expert-segments.yaml        # Expert segment map
├── extraction-report.md        # Extraction narrative
├── frameworks.yaml             # Novel frameworks
├── heuristics.yaml             # Decision heuristics
├── models-matched.yaml         # Known model matches
├── framework-summary.md        # Framework narrative
├── framework-connections.yaml  # Connection map
├── distilled/
│   ├── layer-1.md              # Original transcript
│   ├── layer-2.md              # Bold passages (25%)
│   ├── layer-3.md              # Highlighted passages (12%)
│   ├── layer-4.md              # Executive summary (780 words)
│   ├── layer-5.md              # Remix (320 words)
│   ├── executive-summary.md    # Standalone summary
│   ├── intermediate-packets.yaml
│   ├── para-classification.yaml
│   └── distillation-stats.yaml
├── ideas/
│   ├── content-ideas.yaml      # All ideas scored
│   ├── calendar.yaml           # Publishing calendar
│   ├── multiplication-stats.yaml
│   └── seed-map.yaml
├── atoms/
│   ├── twitter/                # Twitter-specific atoms
│   ├── linkedin/               # LinkedIn-specific atoms
│   ├── newsletter/             # Newsletter-specific atoms
│   ├── youtube-shorts/         # YouTube Shorts atoms
│   ├── youtube-long/           # YouTube long-form atoms
│   ├── atoms-index.yaml        # Master atom index
│   └── atomization-report.yaml
├── ecosystem/
│   ├── ecosystem-map.yaml      # Cross-platform links
│   ├── publishing-calendar.yaml
│   └── narrative-threads.yaml
├── drafts/
│   ├── twitter/                # Production-ready Twitter drafts
│   ├── linkedin/               # Production-ready LinkedIn drafts
│   ├── newsletter/             # Production-ready newsletter drafts
│   ├── youtube-shorts/         # YouTube Shorts scripts
│   ├── youtube-long/           # YouTube long-form scripts
│   └── production-report.yaml
├── youtube/
│   └── optimized/
│       ├── {piece-id}/
│       │   ├── script-optimized.md
│       │   ├── titles.yaml
│       │   ├── thumbnail-brief.yaml
│       │   ├── description-tags.yaml
│       │   ├── structure.yaml
│       │   └── ccn-scorecard.yaml
│       └── optimization-report.yaml
├── distillation-report.md      # THIS consolidated report
├── pipeline-context.yaml       # Pipeline state
└── pipeline-log.yaml           # Full execution log
```

## Warnings & Notes

{Any warnings from quality gates throughout the pipeline}

## Next Steps

1. Review content calendar and approve priorities
2. Select final YouTube titles and approve thumbnail briefs
3. Begin publishing Week 1 content (est. {X} hours setup)
4. Schedule next distillation for related content
5. After 2+ distillations: run cross-reference-frameworks for meta-insights
```

**Checkpoint:** Consolidated report saved at `{slug}/distillation-report.md`

---

### Step 12: Pipeline Completion Summary (30 sec)

**Orchestrator Activity:**
- Save final pipeline context
- Save pipeline execution log
- Print completion summary to console:

```
============================================
CONTENT DISTILLERY - PIPELINE COMPLETE
============================================
Source:      {title}
Expert:      {expert_name}
Duration:    {pipeline_duration}
Status:      {ALL TASKS PASSED / X WARNINGS}

Key Results:
- Frameworks:     {n} ({m} novel)
- Heuristics:     {n}
- Content Ideas:  {n} ({m} calendared)
- Content Atoms:  {n} across {p} platforms
- Drafts Ready:   {n}
- YouTube Pieces: {n} (avg CCN {ccn}/5)
- Weeks of Content: {w}

Report: outputs/distillery/{slug}/distillation-report.md
============================================
```

**Checkpoint:** Human notified of completion

---

## Outputs

### Primary Output

**Consolidated Distillation Report**
- Format: Markdown
- Location: `outputs/distillery/{slug}/distillation-report.md`
- Contains: Complete summary of all 9 pipeline outputs with key findings, top frameworks, heuristics, content production stats, YouTube optimization highlights, calendar preview, and file index

### Secondary Outputs

**Pipeline Execution Log**
- Format: YAML
- Location: `outputs/distillery/{slug}/pipeline-log.yaml`

```yaml
pipeline_log:
  slug: "{slug}"
  url: "{youtube_url}"
  started_at: "2026-02-12T10:00:00Z"
  completed_at: "2026-02-12T13:01:00Z"
  total_duration_minutes: 181
  status: "complete"

  tasks:
    - task: "ingest-youtube"
      agent: "worker"
      status: "pass"
      started: "10:00:00"
      completed: "10:04:00"
      duration_minutes: 4
      quality_score: 8.2
      notes: "Used YouTube manual captions"

    - task: "extract-tacit-knowledge"
      agent: "tacit-extractor"
      status: "pass"
      started: "10:04:00"
      completed: "10:29:00"
      duration_minutes: 25
      fragments: 22
      heuristics: 7
      notes: ""

    - task: "identify-frameworks"
      agent: "model-identifier"
      status: "pass"
      started: "10:29:00"
      completed: "10:47:00"
      duration_minutes: 18
      known_models: 3
      novel_frameworks: 2
      notes: ""

    - task: "progressive-summarize"
      agent: "knowledge-architect"
      status: "pass"
      started: "10:47:00"
      completed: "11:09:00"
      duration_minutes: 22
      layers_complete: 5
      packets: 12
      notes: ""

    - task: "multiply-ideas"
      agent: "idea-multiplier"
      status: "pass"
      started: "11:09:00"
      completed: "11:24:00"
      duration_minutes: 15
      total_ideas: 85
      calendared: 24
      notes: ""

    - task: "atomize-content"
      agent: "content-atomizer"
      status: "pass"
      started: "11:24:00"
      completed: "11:36:00"
      duration_minutes: 12
      total_atoms: 64
      platforms: 5
      notes: ""

    - task: "design-ecosystem"
      agent: "ecosystem-designer"
      status: "pass"
      started: "11:36:00"
      completed: "11:46:00"
      duration_minutes: 10
      cross_links: 28
      notes: ""

    - task: "produce-batch"
      agent: "production-ops"
      status: "pass"
      started: "11:46:00"
      completed: "12:16:00"
      duration_minutes: 30
      total_drafts: 48
      avg_quality: 8.1
      notes: ""

    - task: "optimize-youtube"
      agent: "youtube-strategist"
      status: "pass"
      started: "12:16:00"
      completed: "13:01:00"
      duration_minutes: 45
      pieces_optimized: 8
      avg_ccn: 4.3
      title_variants: 40
      notes: ""

  quality_gates:
    all_passed: true
    warnings: []
    escalations: []

  errors: []
  retries: 0
```

**Pipeline Context (Final State)**
- Format: YAML
- Location: `outputs/distillery/{slug}/pipeline-context.yaml`
- Contains: Complete pipeline state with all paths and metrics from all 9 steps

### All Upstream Task Outputs

This task produces no unique data files - it orchestrates all 9 tasks and each task produces its own outputs. The full output tree is documented in the consolidated report (Step 11).

---

## Validation

### Checklist

- [ ] YouTube URL validated and accessible
- [ ] Output slug generated or provided (snake_case)
- [ ] Pipeline context initialized and saved
- [ ] Step 1 (ingest-youtube) completed with quality >= threshold
- [ ] Step 2 (extract-tacit-knowledge) completed with >= 5 fragments
- [ ] Step 3 (identify-frameworks) completed with >= 1 framework or heuristic
- [ ] Step 4 (progressive-summarize) completed with all 5 layers
- [ ] Step 5 (multiply-ideas) completed with >= 15 content ideas
- [ ] Step 6 (atomize-content) completed with >= 10 atoms across >= 3 platforms
- [ ] Step 7 (design-ecosystem) completed with ecosystem map and calendar
- [ ] Step 8 (produce-batch) completed with >= 8 production-ready drafts
- [ ] Step 9 (optimize-youtube) completed with CCN >= 3.0 for all YouTube pieces
- [ ] All quality gates evaluated and logged
- [ ] Pipeline context updated after each step
- [ ] Consolidated report generated with all sections
- [ ] Pipeline log saved with timing and status for all 9 tasks
- [ ] Completion summary printed to console

### Success Criteria

**Threshold: 14/17 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Pipeline completion** | All 9 tasks complete, all gates pass | 7-8 tasks complete, minor warnings | < 7 tasks complete, manual intervention needed |
| **Total duration** | < 180 min for 1-hour video | 180-240 min | > 240 min |
| **Report quality** | Consolidated report is standalone-readable | Report needs some additional context | Report is incomplete or confusing |
| **Error handling** | All errors caught, appropriate retries/escalations | Most errors handled, one uncaught | Pipeline crashed without recovery |
| **Output completeness** | All files in expected locations, valid formats | Minor files missing, core outputs present | Missing critical outputs |
| **Context preservation** | Pipeline context accurate after every step | Minor context gaps, report compensates | Context lost between steps |
| **Production readiness** | Drafts are publish-ready, YouTube fully optimized | Drafts need light editing, YouTube mostly done | Drafts are rough, YouTube incomplete |

---

## Estimated Effort

| Component | Agent | Effort | Notes |
|-----------|-------|--------|-------|
| **Pipeline Init** | distillery-chief | 1 min | URL validation, slug generation |
| **Step 1: Ingest** | worker | 3-35 min | Depends on caption availability |
| **Step 2: Extract** | tacit-extractor | 15-45 min | Depends on transcript length |
| **Step 3: Identify** | model-identifier | 20-40 min | Depends on knowledge density |
| **Step 4: Summarize** | knowledge-architect | 20-40 min | Depends on content density |
| **Step 5: Multiply** | idea-multiplier | 15-30 min | Relatively fixed |
| **Step 6: Atomize** | content-atomizer | 10-25 min | Depends on idea count |
| **Step 7: Ecosystem** | ecosystem-designer | 10-20 min | Depends on platform count |
| **Step 8: Produce** | production-ops | 20-40 min | Depends on draft count |
| **Step 9: YouTube** | youtube-strategist | 40-55 min | Depends on YouTube piece count |
| **Report Generation** | distillery-chief | 3-5 min | Compilation |
| **Total (1-hour, captions)** | all | 155-245 min | Most common scenario |
| **Total (2-hour, Whisper)** | all | 195-335 min | Worst case scenario |

---

## Integration

### Feeds To

- Content production workflow (downstream of pipeline)
- Knowledge base (intermediate packets feed into long-term KB)
- Cross-video analysis (when multiple videos from same expert are distilled)
- Direct publishing (drafts are production-ready)

### Depends On

- All 9 upstream tasks: ingest-youtube, extract-tacit-knowledge, identify-frameworks, progressive-summarize, multiply-ideas, atomize-content, design-ecosystem, produce-batch, optimize-youtube
- Required tools: yt-dlp, whisper, ffmpeg

### Agent Routing

**Orchestrator:** distillery-chief (manages entire 9-step pipeline)
**Task Agents:** tacit-extractor, model-identifier, knowledge-architect, idea-multiplier, content-atomizer, ecosystem-designer, production-ops, youtube-strategist
**Escalation:** Human (only when quality gate fails after retry)

---

## Quality Threshold

**Pass/Fail Gate:** Checklist score >= 14/17

If < 14/17:
1. Identify which tasks failed
2. Check if failure is recoverable (retry with different parameters)
3. If recoverable: retry failed task, then re-run downstream tasks
4. If not recoverable: escalate to human with diagnostic information
5. Use `skip_steps` for partial re-runs (skip tasks that already passed)

**Common Failure Reasons:**
- Video is private or geo-blocked (cannot ingest)
- Video is pure entertainment with no expert knowledge (low extraction density)
- Audio quality too poor for transcription (technical failure)
- Content is in a language not well-supported by Whisper
- Pipeline interrupted mid-execution (use skip_steps to resume)
- Too few ideas to sustain atomization and production (thin source material)

---

## Related Tasks

- **Task 1:** ingest-youtube (called in Step 2)
- **Task 2:** extract-tacit-knowledge (called in Step 3)
- **Task 3:** identify-frameworks (called in Step 4)
- **Task 4:** progressive-summarize (called in Step 5)
- **Task 5:** multiply-ideas (called in Step 6)
- **Task 6:** atomize-content (called in Step 7)
- **Task 7:** design-ecosystem (called in Step 8)
- **Task 8:** produce-batch (called in Step 9)
- **Task 9:** optimize-youtube (called in Step 10)
- **Post-pipeline:** cross-reference-frameworks (run after 2+ distillations)

---

## Notes for Executor

### Quick Start Example

```
Input:
  youtube_url: "https://www.youtube.com/watch?v=abc123"
  expert_name: "Alex Hormozi"
  target_audience: "B2B SaaS founders, $1M-$10M ARR"
  language: "en"
  target_platforms: ["twitter", "linkedin", "newsletter", "youtube_shorts"]

Output:
  outputs/distillery/alex_hormozi_abc123_20260212/
  └── (all 9-task pipeline outputs + consolidated report)
```

### Partial Re-Run After Failure

If Task 6 (atomize) fails but Tasks 1-5 passed:
```yaml
skip_steps: ["ingest-youtube", "extract-tacit-knowledge", "identify-frameworks", "progressive-summarize", "multiply-ideas"]
```
This re-runs only Tasks 6-9, using existing outputs from Tasks 1-5.

### Resuming After Interruption

The pipeline context object (`pipeline-context.yaml`) records every completed step. On resume:
1. Load existing pipeline context
2. Set `skip_steps` to all completed steps
3. Re-run - pipeline picks up from where it stopped

### Batch Mode (Multiple Videos)

To distill multiple videos from the same expert:
1. Run this task for each video individually
2. After all distillations complete, run `cross-reference-frameworks` task
3. Cross-reference identifies recurring frameworks across videos
4. Consolidated expert profile emerges from multiple distillations

### When to Use This vs Individual Tasks

| Scenario | Use This Task | Use Individual Tasks |
|----------|---------------|---------------------|
| First-time distillation | Yes | No |
| Re-running with different focus | Yes (with skip_steps) | No |
| Only need transcript | No | ingest-youtube only |
| Only need content ideas | No | multiply-ideas (if frameworks exist) |
| Debugging a specific step | No | Run that task individually |
| Custom pipeline order | No | Run tasks manually |
| Only need YouTube optimization | No | optimize-youtube only |
| Only need ecosystem map | No | design-ecosystem only |

---

## Error Recovery Matrix

| Failed Step | Recovery Strategy | Skip Steps |
|-------------|-------------------|------------|
| Ingest | Retry with Whisper; if fail, provide manual transcript | [] |
| Extract | Lower fragment threshold; proceed with fewer | ["ingest-youtube"] |
| Identify | Proceed with heuristics only | ["ingest-youtube", "extract-tacit-knowledge"] |
| Summarize | Retry missing layers; use extract output as fallback | Steps 1-3 |
| Multiply | Lower idea threshold; use frameworks directly | Steps 1-4 |
| Atomize | Use ideas directly as atoms; skip platform-specific formatting | Steps 1-5 |
| Ecosystem | Generate simple calendar without cross-links | Steps 1-6 |
| Produce | Use atoms as rough drafts; flag for human editing | Steps 1-7 |
| YouTube | Skip YouTube optimization; optimize manually later | Steps 1-8 |

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial release with 5-task pipeline |
| 2.0.0 | 2026-02-12 | Expanded to 9-task pipeline (added atomize, ecosystem, produce, youtube-optimize) |

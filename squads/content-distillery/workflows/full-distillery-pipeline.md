---
id: WF-CD-001
name: Full Distillery Pipeline
version: 1.0.0
description: Complete pipeline from YouTube URL to distributed multi-platform content
trigger: manual | api
phases:
  - INGEST
  - EXTRACT
  - IDENTIFY
  - DISTILL
  - MULTIPLY
  - DISTRIBUTE
agents_involved:
  - worker
  - tacit-extractor
  - model-identifier
  - knowledge-architect
  - idea-multiplier
  - content-atomizer
  - ecosystem-designer
  - production-ops
  - youtube-strategist
quality_gates:
  - QG-001: Transcription Valid
  - QG-002: Frameworks Identified
  - QG-003: Progressive Summarization Complete
  - QG-004: Content Reviewed
  - QG-005: YouTube Ready
estimated_duration: 45-90 minutes
input: YouTube URL or list of URLs
output: Published content + production report
---

# Full Distillery Pipeline

## Overview

The Full Distillery Pipeline is the flagship workflow of the Content Distillery squad. It takes a single YouTube URL as input and produces a complete set of multi-platform content pieces derived from the tacit knowledge, mental models, and frameworks embedded in the source video. The pipeline orchestrates nine specialized agents across six sequential phases, with five quality gates ensuring output integrity at every critical juncture.

### Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FULL DISTILLERY PIPELINE                            │
│                                                                         │
│  INPUT: YouTube URL                                                     │
│    │                                                                    │
│    ▼                                                                    │
│  ┌──────────┐   QG-001   ┌──────────┐           ┌──────────────┐       │
│  │  INGEST  │───────────▶│ EXTRACT  │──────────▶│   IDENTIFY   │       │
│  │ (Worker) │            │ (Cedric) │           │   (Shane)    │       │
│  └──────────┘            └──────────┘           └──────┬───────┘       │
│                                                        │ QG-002        │
│                                                        ▼               │
│  ┌──────────────┐        ┌──────────┐           ┌──────────────┐       │
│  │  DISTRIBUTE  │◀───────│ MULTIPLY │◀──────────│   DISTILL    │       │
│  │(Dan/Justin/  │ QG-004 │(Cole/Gary│  QG-003   │   (Tiago)    │       │
│  │   Paddy)     │ QG-005 │   Vee)   │           └──────────────┘       │
│  └──────┬───────┘        └──────────┘                                   │
│         │                                                               │
│         ▼                                                               │
│  OUTPUT: Published Content + Production Report                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Agent Activation Sequence

```
Phase 1 (INGEST):     worker ──────────────────────────────────▶ Transcript
Phase 2 (EXTRACT):    tacit-extractor ─────────────────────────▶ Knowledge Fragments
Phase 3 (IDENTIFY):   model-identifier ────────────────────────▶ Frameworks Catalog
Phase 4 (DISTILL):    knowledge-architect ─────────────────────▶ KB Entry
Phase 5 (MULTIPLY):   idea-multiplier + content-atomizer ──────▶ Content Pieces
Phase 6 (DISTRIBUTE): ecosystem-designer + production-ops ─────▶ Published Content
                       + youtube-strategist
```

---

## Prerequisites

### Required Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `youtube_url` | string | YES | Valid YouTube video URL |
| `target_audience` | string | NO | Primary audience descriptor (default: inferred) |
| `content_goals` | list | NO | Specific content objectives |
| `platform_targets` | list | NO | Target platforms (default: all) |
| `language` | string | NO | Content language (default: pt-BR) |
| `priority` | enum | NO | low / medium / high (default: medium) |

### Required Tools

| Tool | Purpose | Phase |
|------|---------|-------|
| yt-dlp | YouTube download and audio extraction | INGEST |
| whisper / deepgram | Audio transcription | INGEST |
| ffprobe | Media metadata extraction | INGEST |
| jq | JSON processing | ALL |

### Required Data

| Data | Location | Purpose |
|------|----------|---------|
| Mental Models DB | `data/mental-models-db.yaml` | Framework cross-reference |
| Heuristics Catalog | `data/heuristics-catalog.yaml` | Heuristic pattern matching |
| Platform Specs | `data/platform-specs.yaml` | Content formatting rules |
| Content Templates | `templates/` | Output formatting |

---

## Phase 1: INGEST

### Purpose

Download the YouTube video, extract audio, generate a high-quality timestamped transcript, and collect all available metadata. This phase is fully automated and handled by the Worker agent.

### Agent: Worker (Automated)

The Worker agent executes the ingestion pipeline without human intervention. It handles download, extraction, transcription, and metadata collection as a single atomic operation.

### Step-by-Step Process

#### Step 1.1: URL Validation and Metadata Fetch

```
INPUT:  YouTube URL (string)
ACTION: Validate URL format, check video availability, fetch metadata
OUTPUT: Video metadata object
```

**Validation Rules:**
- URL must match pattern: `https://(www\.)?youtube\.com/watch\?v=` or `https://youtu\.be/`
- Video must be publicly accessible or accessible with provided credentials
- Video duration must be between 1 minute and 4 hours
- Video must not be a live stream currently in progress

**Metadata to Extract:**
- Video title
- Channel name and ID
- Upload date
- Duration (seconds)
- View count
- Like count
- Description text
- Tags / categories
- Thumbnail URLs
- Language (auto-detected)
- Captions availability (manual vs auto-generated)

**Error Handling:**
- URL invalid: ABORT with error code `INGEST-001` (Invalid URL format)
- Video unavailable: ABORT with error code `INGEST-002` (Video not accessible)
- Duration out of range: WARN and request confirmation to proceed
- Rate limited: RETRY with exponential backoff (max 3 attempts)

#### Step 1.2: Audio Extraction

```
INPUT:  Validated YouTube URL + metadata
ACTION: Download best available audio stream
OUTPUT: Audio file (WAV/MP3) + audio metadata
```

**Process:**
1. Use yt-dlp to download best audio stream
2. Extract audio to WAV format (16kHz mono for transcription)
3. Keep original quality copy for reference
4. Generate audio fingerprint for deduplication
5. Calculate audio duration and verify against metadata

**Audio Quality Requirements:**
- Sample rate: minimum 16kHz
- Channels: mono (for transcription) + original (for reference)
- Format: WAV (transcription) + original format (archive)
- File size limit: 500MB per audio file

**Error Handling:**
- Download failure: RETRY 3 times with 30-second intervals
- Audio extraction failure: Try alternative format (mp3, m4a, opus)
- Corrupted audio: ABORT with error code `INGEST-003`
- File too large: Segment into 30-minute chunks

#### Step 1.3: Transcription

```
INPUT:  Audio file (WAV)
ACTION: Generate timestamped transcript with speaker diarization
OUTPUT: Timestamped transcript (JSON + TXT)
```

**Transcription Pipeline:**
1. Run primary transcription engine (Whisper large-v3 or Deepgram Nova-2)
2. Apply speaker diarization (identify distinct speakers)
3. Generate word-level timestamps
4. Apply punctuation and formatting corrections
5. If available, compare with YouTube auto-captions for validation
6. Calculate confidence scores per segment

**Transcript Format (JSON):**
```json
{
  "metadata": {
    "video_id": "abc123",
    "title": "Video Title",
    "channel": "Channel Name",
    "duration_seconds": 1234,
    "language": "pt-BR",
    "transcription_engine": "whisper-large-v3",
    "transcription_date": "2026-02-12T00:00:00Z",
    "overall_confidence": 0.94
  },
  "segments": [
    {
      "id": 1,
      "start": 0.0,
      "end": 4.5,
      "speaker": "SPEAKER_01",
      "text": "Segment text here",
      "confidence": 0.96,
      "words": [
        {"word": "Segment", "start": 0.0, "end": 0.5, "confidence": 0.98},
        {"word": "text", "start": 0.5, "end": 0.8, "confidence": 0.95}
      ]
    }
  ],
  "speakers": {
    "SPEAKER_01": {"label": "Host", "segments_count": 45},
    "SPEAKER_02": {"label": "Guest", "segments_count": 38}
  }
}
```

**Quality Thresholds:**
- Overall confidence: minimum 90%
- Per-segment confidence: flag segments below 80%
- Speaker diarization: minimum 2 speakers detected if interview format
- Timestamp accuracy: within 0.5 seconds of actual speech

**Error Handling:**
- Transcription quality below 90%: Flag for manual review, continue pipeline
- Transcription engine failure: Fallback to secondary engine
- Language mismatch: Re-run with correct language parameter
- No speech detected: ABORT with error code `INGEST-004`

#### Step 1.4: Output Assembly

```
INPUT:  Metadata + Audio + Transcript
ACTION: Assemble complete ingest package
OUTPUT: Ingest package (directory structure)
```

**Output Directory Structure:**
```
data/ingested/{video_id}/
├── metadata.json          # Complete video metadata
├── transcript.json        # Timestamped transcript (JSON)
├── transcript.txt         # Plain text transcript
├── transcript_segments.md # Markdown with timestamps
├── audio/
│   ├── original.{ext}    # Original quality audio
│   └── transcription.wav  # Transcription-optimized audio
├── thumbnails/
│   └── default.jpg        # Video thumbnail
└── ingest_report.json     # Processing report with timings
```

### Quality Gate QG-001: Transcription Valid

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Overall confidence score | >= 90% | Transcription engine score |
| Low-confidence segments | <= 10% of total | Count segments < 80% |
| Duration match | Within 5% of video duration | Compare transcript vs metadata |
| Speaker detection | >= 1 speaker identified | Diarization output |
| Character count | >= 100 characters per minute | Total chars / duration |
| Language match | Matches expected language | Language detection check |

**QG-001 Decision Matrix:**

| Result | Action |
|--------|--------|
| ALL PASS | Proceed to Phase 2 |
| Confidence < 90% but > 80% | Proceed with WARNING flag |
| Confidence < 80% | HALT - Request manual review |
| Duration mismatch > 10% | HALT - Re-run transcription |
| No speakers detected | Proceed with WARNING (monologue assumed) |

### Handoff to Phase 2

**Handoff Artifact:** `data/ingested/{video_id}/`

**Handoff Contract:**
```yaml
from: worker
to: tacit-extractor
artifact: data/ingested/{video_id}/
required_files:
  - metadata.json
  - transcript.json
  - transcript_segments.md
  - ingest_report.json
validation:
  - QG-001 status: PASS or PASS_WITH_WARNINGS
  - All required files exist and are non-empty
  - transcript.json is valid JSON
  - metadata.json contains all required fields
```

---

## Phase 2: EXTRACT

### Purpose

Extract tacit knowledge from the transcript using the Recognition-Primed Decision (RPD) model. Identify expert decision patterns, implicit rules, domain heuristics, and experiential knowledge that is not explicitly stated but embedded in the expert's narrative.

### Agent: tacit-extractor (Cedric Chin persona)

The tacit-extractor agent operates with the analytical rigor of Cedric Chin's approach to tacit knowledge extraction. It reads between the lines of expert discourse to surface the decision-making patterns and mental shortcuts that experts use but rarely articulate.

### Step-by-Step Process

#### Step 2.1: Transcript Segmentation

```
INPUT:  Timestamped transcript (JSON)
ACTION: Segment transcript into thematic blocks
OUTPUT: Segmented transcript with topic labels
```

**Segmentation Criteria:**
- Topic shifts (detected via semantic analysis)
- Speaker changes in interview format
- Temporal markers ("then", "after that", "the next step")
- Rhetorical markers ("the key thing is", "what most people miss")
- Minimum segment: 30 seconds / Maximum segment: 5 minutes

**Process:**
1. Read full transcript to understand overall structure
2. Identify major topic shifts using semantic clustering
3. Label each segment with a preliminary topic descriptor
4. Mark segments that contain potential tacit knowledge indicators
5. Generate segment map with timestamps and labels

#### Step 2.2: Tacit Knowledge Scanning

```
INPUT:  Segmented transcript
ACTION: Apply RPD model to identify tacit knowledge markers
OUTPUT: Annotated transcript with tacit knowledge flags
```

**RPD Model Application:**
The Recognition-Primed Decision model identifies how experts make decisions under pressure. Apply the following detection patterns:

**Pattern 1: Situation Recognition**
- Expert describes recognizing a situation type
- Indicators: "I immediately knew...", "This looked like a case of...", "The pattern was..."
- Classification: `RECOGNITION`

**Pattern 2: Mental Simulation**
- Expert describes running scenarios mentally before acting
- Indicators: "I thought about what would happen if...", "I played it out in my head..."
- Classification: `SIMULATION`

**Pattern 3: Expectancy Violations**
- Expert describes noticing something unexpected
- Indicators: "What surprised me was...", "I didn't expect...", "The unusual thing..."
- Classification: `ANOMALY_DETECTION`

**Pattern 4: Leveraged Actions**
- Expert describes finding high-leverage intervention points
- Indicators: "The one thing that made the difference...", "The trick is..."
- Classification: `LEVERAGE_POINT`

**Pattern 5: Decision Compression**
- Expert describes making fast decisions without deliberation
- Indicators: "I just knew...", "It was obvious to me...", "Without thinking..."
- Classification: `COMPRESSED_DECISION`

**Pattern 6: Cue-Based Reasoning**
- Expert describes reading environmental cues
- Indicators: "I noticed that...", "The sign was...", "What told me was..."
- Classification: `CUE_READING`

#### Step 2.3: Knowledge Fragment Extraction

```
INPUT:  Annotated transcript
ACTION: Extract structured knowledge fragments
OUTPUT: Knowledge fragments collection (JSON)
```

**For each identified tacit knowledge marker, extract:**

```json
{
  "fragment_id": "KF-001",
  "type": "RECOGNITION | SIMULATION | ANOMALY_DETECTION | LEVERAGE_POINT | COMPRESSED_DECISION | CUE_READING",
  "category": "strategic | tactical | operational | philosophical",
  "title": "Brief descriptive title",
  "raw_quote": "Exact quote from transcript",
  "timestamp": {"start": 123.4, "end": 145.6},
  "speaker": "SPEAKER_01",
  "interpretation": "What this fragment reveals about expert thinking",
  "implicit_rule": "The unstated rule or heuristic embedded in this fragment",
  "domain": "Marketing | Sales | Product | Leadership | etc.",
  "confidence": 0.85,
  "evidence_strength": "strong | moderate | weak",
  "related_fragments": ["KF-003", "KF-007"],
  "context": "What was being discussed when this emerged"
}
```

**Extraction Guidelines:**
- Minimum 5 fragments per 30 minutes of content
- Each fragment must have supporting quote (raw_quote)
- Interpretation must go beyond paraphrase (extract what is NOT said)
- Implicit rules must be actionable ("If X, then Y" format preferred)
- Confidence score reflects certainty of interpretation
- Evidence strength reflects how explicit the knowledge was

#### Step 2.4: Cross-Reference and Clustering

```
INPUT:  Knowledge fragments collection
ACTION: Cluster related fragments and identify themes
OUTPUT: Themed knowledge clusters
```

**Process:**
1. Group fragments by domain and category
2. Identify fragments that reinforce the same implicit rule
3. Detect contradictions or tensions between fragments
4. Map fragment relationships (supports, contradicts, extends)
5. Generate cluster summaries

**Cluster Format:**
```yaml
cluster_id: CL-001
theme: "Expert pattern recognition in [domain]"
fragments: [KF-001, KF-003, KF-007]
synthesized_insight: "The expert consistently..."
strength: strong
contradiction_with: null
extends_cluster: null
```

#### Step 2.5: Extraction Report

```
INPUT:  All extraction artifacts
ACTION: Generate comprehensive extraction report
OUTPUT: Extraction report (markdown)
```

**Report Template:**
```markdown
# Tacit Knowledge Extraction Report

## Source
- Video: [title]
- Channel: [channel]
- Duration: [duration]
- Date Processed: [date]

## Summary Statistics
- Total fragments extracted: [N]
- By type: Recognition [n], Simulation [n], ...
- By category: Strategic [n], Tactical [n], ...
- Average confidence: [score]
- Strong evidence fragments: [n]

## Top Insights
1. [Most significant finding]
2. [Second most significant]
3. [Third most significant]

## Knowledge Clusters
[Cluster summaries]

## Low-Confidence Fragments (for review)
[List fragments with confidence < 0.7]

## Handoff Notes
[Notes for the next phase agent]
```

### Checkpoint: Minimum 5 Knowledge Fragments

| Criterion | Threshold | Action if Failed |
|-----------|-----------|------------------|
| Fragment count | >= 5 | Re-scan with relaxed thresholds |
| Average confidence | >= 0.7 | Flag low-quality fragments |
| Fragment diversity | >= 2 types | Check for extraction bias |
| Evidence coverage | >= 60% of transcript | Check for missed segments |

### Handoff to Phase 3

**Handoff Artifact:** `data/extracted/{video_id}/`

```
data/extracted/{video_id}/
├── knowledge_fragments.json    # All extracted fragments
├── knowledge_clusters.yaml     # Themed clusters
├── annotated_transcript.json   # Transcript with tacit knowledge flags
├── extraction_report.md        # Comprehensive report
└── extraction_metadata.json    # Processing metadata and stats
```

**Handoff Contract:**
```yaml
from: tacit-extractor
to: model-identifier
artifact: data/extracted/{video_id}/
required_files:
  - knowledge_fragments.json (min 5 fragments)
  - knowledge_clusters.yaml
  - extraction_report.md
validation:
  - Checkpoint PASS (>= 5 fragments)
  - All fragments have required fields
  - At least 2 fragment types represented
```

---

## Phase 3: IDENTIFY

### Purpose

Cross-reference extracted knowledge fragments against known mental models and frameworks. Identify both recognized patterns and novel frameworks unique to the expert. Build a heuristics catalog of actionable decision rules.

### Agent: model-identifier (Shane Parrish persona)

The model-identifier agent applies Shane Parrish's Farnam Street approach to mental model identification. It systematically maps extracted knowledge to the multidisciplinary lattice of mental models while being alert to novel frameworks that don't fit existing categories.

### Step-by-Step Process

#### Step 3.1: Load Reference Database

```
INPUT:  Mental Models DB + Heuristics Catalog
ACTION: Load and index reference databases for matching
OUTPUT: Indexed reference data in memory
```

**Mental Models Database Categories:**
- General Thinking (First Principles, Second-Order Thinking, Inversion)
- Business Strategy (Moats, Network Effects, Economies of Scale)
- Psychology (Cognitive Biases, Incentive Structures, Social Proof)
- Systems Thinking (Feedback Loops, Emergence, Bottlenecks)
- Decision Making (Bayesian Thinking, Opportunity Cost, Margin of Safety)
- Learning (Deliberate Practice, Spacing Effect, Transfer)

#### Step 3.2: Fragment-to-Model Matching

```
INPUT:  Knowledge fragments + Reference databases
ACTION: Match each fragment against known models
OUTPUT: Fragment-model mapping with confidence scores
```

**Matching Process:**
1. For each knowledge fragment:
   a. Extract key concepts and relationships
   b. Compare against mental model signatures
   c. Score match confidence (0.0 - 1.0)
   d. Accept matches with confidence >= 0.7
   e. Flag fragments with no strong matches as "potentially novel"

**Match Output Format:**
```json
{
  "fragment_id": "KF-001",
  "matches": [
    {
      "model_name": "First Principles Thinking",
      "model_category": "General Thinking",
      "confidence": 0.92,
      "evidence": "Fragment describes breaking down complex problem to fundamentals",
      "mapping_notes": "Expert applies this to pricing strategy specifically"
    }
  ],
  "novel_candidate": false,
  "novel_score": 0.0
}
```

#### Step 3.3: Novel Framework Detection

```
INPUT:  Fragments with no strong model matches + low-confidence matches
ACTION: Analyze unmatched fragments for novel patterns
OUTPUT: Novel framework candidates
```

**Detection Criteria:**
- Fragment has no match above 0.7 confidence
- Fragment contains a repeatable decision rule
- Fragment appears in multiple contexts within the transcript
- Fragment contradicts or extends a known model in a specific way

**Novel Framework Template:**
```yaml
framework_id: NF-001
name: "[Expert's Name]'s [Domain] [Pattern]"
source_fragments: [KF-004, KF-009, KF-012]
description: "One-paragraph description of the framework"
application: "When and how to apply this framework"
components:
  - component_1: "Description"
  - component_2: "Description"
evidence_strength: strong | moderate | weak
differentiation: "How this differs from [closest known model]"
limitations: "Known limitations or boundary conditions"
```

#### Step 3.4: Heuristics Extraction

```
INPUT:  All fragments (matched and novel)
ACTION: Extract actionable heuristics in "If X, then Y" format
OUTPUT: Heuristics catalog
```

**Heuristic Format:**
```yaml
heuristic_id: H-001
rule: "If [condition], then [action]"
source_fragment: KF-003
domain: "Marketing"
reliability: high | medium | low
boundary_conditions:
  - "Only applies when [condition]"
  - "Does not work in [context]"
expert_confidence: "How confident the expert appeared"
counter_examples: "Any mentioned exceptions"
```

**Heuristic Quality Criteria:**
- Must be actionable (someone could apply it)
- Must have boundary conditions specified
- Must cite source fragment
- Must specify domain of application
- Prefer specific over generic

#### Step 3.5: Framework Catalog Assembly

```
INPUT:  All identification outputs
ACTION: Assemble comprehensive framework catalog
OUTPUT: Structured catalog document
```

**Catalog Structure:**
```markdown
# Framework Catalog: [Video Title]

## Known Frameworks Identified
| # | Framework | Category | Confidence | Fragments |
|---|-----------|----------|------------|-----------|
| 1 | First Principles | General | 0.92 | KF-001 |

## Novel Frameworks Discovered
| # | Framework | Domain | Evidence | Fragments |
|---|-----------|--------|----------|-----------|
| 1 | Expert's Pattern | Marketing | Strong | KF-004,009 |

## Heuristics Catalog
| # | Rule | Domain | Reliability |
|---|------|--------|-------------|
| 1 | If X, then Y | Sales | High |

## Cross-References
[How frameworks relate to each other]

## Quality Assessment
[Overall quality of identification process]
```

### Quality Gate QG-002: Frameworks Identified

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Known frameworks identified | >= 3 | Count of high-confidence matches |
| Heuristics extracted | >= 5 | Count of valid heuristics |
| Evidence quality | All frameworks have source citations | Manual check |
| Novel framework quality | If any, have >= 2 supporting fragments | Fragment count |
| Cross-reference completeness | >= 1 cross-reference per framework | Relationship map |

**QG-002 Decision Matrix:**

| Result | Action |
|--------|--------|
| ALL PASS | Proceed to Phase 4 |
| < 3 frameworks but >= 1 | Proceed with WARNING |
| 0 frameworks | HALT - Re-analyze with broader matching |
| No heuristics | HALT - Return to extraction phase |

### Handoff to Phase 4

**Handoff Artifact:** `data/identified/{video_id}/`

```
data/identified/{video_id}/
├── framework_catalog.md         # Complete catalog
├── model_matches.json           # Fragment-to-model mappings
├── novel_frameworks.yaml        # Novel framework candidates
├── heuristics_catalog.yaml      # All extracted heuristics
├── cross_references.json        # Framework relationships
└── identification_report.md     # Processing report
```

**Handoff Contract:**
```yaml
from: model-identifier
to: knowledge-architect
artifact: data/identified/{video_id}/
required_files:
  - framework_catalog.md
  - model_matches.json
  - heuristics_catalog.yaml
validation:
  - QG-002 status: PASS or PASS_WITH_WARNINGS
  - At least 3 frameworks in catalog
  - At least 5 heuristics in catalog
  - All cross-references valid
```

---

## Phase 4: DISTILL

### Purpose

Apply Tiago Forte's Progressive Summarization methodology to organize and distill the extracted knowledge into a structured knowledge base entry. The goal is to make the knowledge maximally discoverable and reusable across future content creation.

### Agent: knowledge-architect (Tiago Forte persona)

The knowledge-architect agent applies the Building a Second Brain methodology to organize knowledge using the PARA framework and progressive summarization layers.

### Step-by-Step Process

#### Step 4.1: PARA Classification

```
INPUT:  Framework catalog + Heuristics catalog + Knowledge fragments
ACTION: Classify all knowledge items using PARA framework
OUTPUT: PARA-classified knowledge items
```

**PARA Categories:**
- **Projects**: Knowledge relevant to active content projects
- **Areas**: Knowledge relevant to ongoing responsibility areas
- **Resources**: Knowledge for future reference and inspiration
- **Archives**: Historical or context-only knowledge

**Classification Process:**
1. Review each framework and heuristic
2. Assign primary PARA category based on current relevance
3. Assign secondary category for cross-filing
4. Tag with topic keywords for discoverability
5. Link to existing KB entries if applicable

#### Step 4.2: Progressive Summarization - Layer 1 (Full Notes)

```
INPUT:  PARA-classified knowledge
ACTION: Create complete notes for each knowledge item
OUTPUT: Layer 1 notes (full detail)
```

**Layer 1 Content:**
- Complete framework description with all context
- Full heuristic rules with boundary conditions and examples
- Source quotes with timestamps
- Expert context and credibility markers
- Relationship to other frameworks and heuristics

#### Step 4.3: Progressive Summarization - Layer 2 (Bold Passages)

```
INPUT:  Layer 1 notes
ACTION: Highlight the most important passages
OUTPUT: Layer 2 notes (key passages highlighted)
```

**Selection Criteria for Bold:**
- Core insight that couldn't be inferred
- Actionable advice with specific conditions
- Counter-intuitive findings
- Quantified claims or specific thresholds
- Novel terminology or framework names

#### Step 4.4: Progressive Summarization - Layer 3 (Highlighted Passages)

```
INPUT:  Layer 2 notes
ACTION: Highlight the most essential bold passages
OUTPUT: Layer 3 notes (essential insights highlighted)
```

**Selection Criteria for Highlight:**
- The absolute core of each framework (1-2 sentences)
- The most actionable heuristic per domain
- The most surprising or counter-intuitive finding
- The key differentiator from common knowledge

#### Step 4.5: Progressive Summarization - Layer 4 (Executive Summary)

```
INPUT:  Layer 3 notes
ACTION: Write executive summary from highlighted passages
OUTPUT: Layer 4 executive summary (1-2 paragraphs)
```

**Executive Summary Requirements:**
- Maximum 200 words
- Must capture the single most important insight
- Must mention the 2-3 key frameworks discovered
- Must indicate practical applicability
- Must be standalone (readable without context)

#### Step 4.6: Progressive Summarization - Layer 5 (Remix)

```
INPUT:  All layers
ACTION: Create remixed output combining insights with existing KB
OUTPUT: Layer 5 remixed knowledge entry
```

**Remix Process:**
1. Compare new frameworks with existing KB entries
2. Identify synergies and contradictions
3. Create cross-references to existing knowledge
4. Generate "insight combinations" (new + existing)
5. Write integrated knowledge entry

#### Step 4.7: Knowledge Base Entry Assembly

```
INPUT:  All 5 layers + PARA classification
ACTION: Assemble final KB entry
OUTPUT: Complete knowledge base entry
```

**KB Entry Format:**
```markdown
# KB Entry: [Video Title] - [Expert Name]

## Layer 5: Remix (Read this first)
[Integrated insight combining new and existing knowledge]

## Layer 4: Executive Summary
[200-word summary]

## Layer 3: Key Highlights
[Highlighted essential insights]

## Layer 2: Important Passages
[Bold key passages with context]

## Layer 1: Complete Notes
[Full detailed notes]

## Metadata
- Source: [YouTube URL]
- Expert: [Name]
- Date Processed: [Date]
- PARA: [Category]
- Tags: [tag1, tag2, tag3]
- Related KB Entries: [links]
- Frameworks: [list]
- Heuristics: [count]
```

### Quality Gate QG-003: Progressive Summarization Complete

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| All 5 layers present | 5/5 layers complete | File check |
| Layer compression ratio | Each layer <= 50% of previous | Word count comparison |
| PARA classification | 100% items classified | Count check |
| Cross-references | >= 1 link to existing KB | Reference count |
| Executive summary | <= 200 words | Word count |
| Tags assigned | >= 3 tags per entry | Tag count |

**QG-003 Decision Matrix:**

| Result | Action |
|--------|--------|
| ALL PASS | Proceed to Phase 5 |
| Missing layers | HALT - Complete missing layers |
| Compression ratio violated | Revise layer (too verbose) |
| No cross-references | Proceed with WARNING |

### Handoff to Phase 5

**Handoff Artifact:** `data/distilled/{video_id}/`

```
data/distilled/{video_id}/
├── kb_entry.md                  # Complete knowledge base entry
├── progressive_summary/
│   ├── layer1_full_notes.md
│   ├── layer2_bold.md
│   ├── layer3_highlights.md
│   ├── layer4_executive.md
│   └── layer5_remix.md
├── para_classification.yaml     # PARA assignments
├── cross_references.json        # Links to existing KB
└── distillation_report.md       # Processing report
```

**Handoff Contract:**
```yaml
from: knowledge-architect
to: idea-multiplier + content-atomizer
artifact: data/distilled/{video_id}/
required_files:
  - kb_entry.md
  - progressive_summary/ (all 5 layers)
  - para_classification.yaml
validation:
  - QG-003 status: PASS
  - All 5 progressive summarization layers complete
  - KB entry follows standard template
```

---

## Phase 5: MULTIPLY

### Purpose

Generate a diverse catalog of content ideas from the distilled knowledge using Nicolas Cole's 4A Framework and Gary Vaynerchuk's content atomization strategy. Transform each framework and heuristic into multiple content pieces optimized for different platforms and formats.

### Agents: idea-multiplier (Cole & Bush) + content-atomizer (Gary Vee)

The idea-multiplier generates ideas using the 4A Framework while the content-atomizer breaks each idea into platform-specific atomic content pieces.

### Step-by-Step Process

#### Step 5.1: 4A Framework Application

```
INPUT:  KB entry + Framework catalog + Heuristics catalog
ACTION: Apply 4A Framework to each framework/heuristic
OUTPUT: Content ideas categorized by 4A type
```

**4A Framework Categories:**
- **Actionable**: Step-by-step how-to content
- **Analytical**: Data-driven analysis and comparisons
- **Aspirational**: Motivational and vision-setting content
- **Anthropological**: Cultural observation and trend analysis

**Process per Framework:**
1. Generate at least 2 ideas per 4A category
2. For each idea, specify:
   - Title / hook
   - 4A category
   - Target format (thread, carousel, video, article, etc.)
   - Target platform (Twitter/X, LinkedIn, YouTube, Instagram, Newsletter)
   - Estimated production effort (low/medium/high)
   - Key insight to communicate
   - Call to action

#### Step 5.2: Format Catalog Expansion

```
INPUT:  4A-categorized ideas
ACTION: Expand each idea into multiple format variants
OUTPUT: Expanded format catalog
```

**Format Templates:**
| Format | Platform | Length | Production |
|--------|----------|--------|------------|
| Twitter/X Thread | Twitter/X | 5-15 tweets | Low |
| LinkedIn Post | LinkedIn | 200-300 words | Low |
| LinkedIn Carousel | LinkedIn | 8-12 slides | Medium |
| Instagram Carousel | Instagram | 8-10 slides | Medium |
| Instagram Reel Script | Instagram | 30-60 seconds | Medium |
| YouTube Short Script | YouTube | 30-60 seconds | Medium |
| YouTube Long-form Script | YouTube | 8-15 minutes | High |
| Newsletter Section | Email | 500-800 words | Medium |
| Blog Post | Website | 1500-2500 words | High |
| Podcast Talking Points | Podcast | 10-20 minutes | Medium |

#### Step 5.3: Content Atomization

```
INPUT:  Expanded format catalog
ACTION: Atomize each piece into platform-native atoms
OUTPUT: Atomized content pieces
```

**Atomization Rules:**
1. One insight per atom (never combine multiple frameworks)
2. Each atom is self-contained (understandable without context)
3. Each atom has a clear hook (first sentence grabs attention)
4. Each atom has a clear CTA (what should the reader do next)
5. Each atom is formatted for its target platform

**Content Atom Format:**
```yaml
atom_id: CA-001
source_idea: IDEA-003
source_framework: "First Principles Thinking"
platform: twitter
format: thread
title: "Hook title here"
hook: "First tweet / opening line"
body_outline:
  - point_1: "Key insight"
  - point_2: "Supporting evidence"
  - point_3: "Practical application"
cta: "Call to action"
estimated_engagement: medium
production_status: draft
dependencies: []
```

#### Step 5.4: Content Pieces Catalog Assembly

```
INPUT:  All atomized content pieces
ACTION: Assemble catalog with metadata and relationships
OUTPUT: Complete content pieces catalog
```

**Catalog Organization:**
- Group by platform
- Sort by estimated engagement potential
- Flag content that builds on each other (series potential)
- Identify "pillar" content vs "derivative" content
- Map content ecosystem (how pieces link together)

### Checkpoint: Minimum 15 Content Pieces

| Criterion | Threshold | Action if Failed |
|-----------|-----------|------------------|
| Total content pieces | >= 15 | Generate more variants |
| Platform diversity | >= 3 platforms represented | Expand to missing platforms |
| 4A diversity | All 4 categories represented | Fill gaps |
| Pillar content | >= 2 long-form pieces | Create from strongest frameworks |
| Quick wins | >= 5 low-effort pieces | Identify easier atoms |

### Handoff to Phase 6

**Handoff Artifact:** `data/multiplied/{video_id}/`

```
data/multiplied/{video_id}/
├── content_catalog.yaml          # Complete content catalog
├── ideas/
│   ├── actionable_ideas.yaml
│   ├── analytical_ideas.yaml
│   ├── aspirational_ideas.yaml
│   └── anthropological_ideas.yaml
├── atoms/
│   ├── twitter/
│   ├── linkedin/
│   ├── instagram/
│   ├── youtube/
│   └── newsletter/
├── ecosystem_map.json            # How pieces relate
└── multiplication_report.md      # Processing report
```

**Handoff Contract:**
```yaml
from: idea-multiplier + content-atomizer
to: ecosystem-designer + production-ops + youtube-strategist
artifact: data/multiplied/{video_id}/
required_files:
  - content_catalog.yaml (min 15 pieces)
  - atoms/ (organized by platform)
  - ecosystem_map.json
validation:
  - Checkpoint PASS (>= 15 pieces)
  - All atoms have required fields
  - At least 3 platforms represented
```

---

## Phase 6: DISTRIBUTE

### Purpose

Design the content distribution ecosystem, produce batch-ready content with platform-specific optimizations, and prepare YouTube-specific assets. This is the final phase that transforms content atoms into publish-ready artifacts.

### Agents: ecosystem-designer (Dan Koe) + production-ops (Justin Welsh) + youtube-strategist (Paddy Galloway)

Three agents collaborate: the ecosystem-designer plans the distribution strategy, production-ops handles batch production and quality control, and the youtube-strategist optimizes YouTube-specific content.

### Step-by-Step Process

#### Step 6.1: Distribution Ecosystem Design

```
INPUT:  Content catalog + Ecosystem map
ACTION: Design multi-platform distribution strategy
AGENT:  ecosystem-designer (Dan Koe)
OUTPUT: Distribution plan
```

**Ecosystem Design Process:**
1. Identify the "pillar" content piece (usually long-form YouTube or blog)
2. Map derivative content flow from pillar to platforms
3. Design cross-platform linking strategy
4. Set publishing cadence (daily/weekly/monthly per platform)
5. Plan audience journey across platforms

**Distribution Plan Format:**
```yaml
pillar_content:
  format: youtube_long_form
  atom_id: CA-015
  publish_date: "[scheduled]"

distribution_waves:
  wave_1_pre_launch:
    timing: "3 days before pillar"
    pieces: [CA-001, CA-005, CA-009]
    purpose: "Build anticipation"

  wave_2_launch_day:
    timing: "Same day as pillar"
    pieces: [CA-015, CA-003, CA-007]
    purpose: "Maximum impact"

  wave_3_post_launch:
    timing: "3-7 days after pillar"
    pieces: [CA-011, CA-013, CA-017]
    purpose: "Extended reach and recycling"

cross_platform_links:
  - from: CA-001 (twitter thread)
    to: CA-015 (youtube video)
    cta: "Full breakdown in the video"
```

#### Step 6.2: Batch Production

```
INPUT:  Distribution plan + Content atoms
ACTION: Produce final content for each atom
AGENT:  production-ops (Justin Welsh)
OUTPUT: Production-ready content files
```

**Production Process per Atom:**
1. Expand atom outline to full draft
2. Apply platform-specific formatting rules
3. Add hooks, transitions, and CTAs
4. Ensure brand voice consistency
5. Apply copy editing standards
6. Format for platform requirements

**Platform-Specific Production Rules:**

**Twitter/X Threads:**
- First tweet: Hook (max 280 chars, no links)
- Body tweets: One idea per tweet
- Last tweet: CTA + self-reply with link
- Hashtags: 0-2 per thread (in last tweet only)
- Thread length: 5-15 tweets optimal

**LinkedIn Posts:**
- First line: Hook (creates curiosity)
- Body: Short paragraphs (1-2 sentences each)
- Formatting: Use line breaks liberally
- Length: 200-300 words optimal
- CTA: Question to drive comments
- Hashtags: 3-5 relevant tags

**Instagram Carousels:**
- Slide 1: Bold hook statement
- Slides 2-9: One point per slide
- Final slide: CTA (save, share, follow)
- Design: Clean, readable, branded
- Caption: Summarize + hashtags (20-30)

**YouTube Scripts:**
- Hook: First 30 seconds (pattern interrupt)
- Structure: Problem > Framework > Steps > CTA
- Retention: Re-hook every 2-3 minutes
- Chapters: Clear section markers
- End screen: 20-second CTA zone

#### Step 6.3: YouTube Optimization

```
INPUT:  YouTube content atoms + Video metadata
ACTION: Optimize all YouTube-specific elements
AGENT:  youtube-strategist (Paddy Galloway)
OUTPUT: YouTube-optimized content package
```

**YouTube Optimization Checklist:**

**Title Optimization:**
- Length: 50-70 characters
- Format: [Number] + [Power Word] + [Specific Benefit]
- A/B variants: Generate 3 title options
- Keyword integration: Primary keyword in first 5 words

**Thumbnail Concept:**
- High contrast (readable at mobile size)
- Face + emotion (if applicable)
- Max 3 words of text
- Complementary to title (not repetitive)
- Generate 3 concept descriptions for designer

**Description Optimization:**
- First 150 chars: Hook + primary keyword
- Timestamps/chapters
- Links to mentioned resources
- Social media links
- Related video links
- Hashtags (3-5)

**Tags:**
- Primary keyword variations (5-10)
- Related topic tags (5-10)
- Channel-specific tags (3-5)
- Competitor video tags (research-based)

**Chapters/Timestamps:**
- Minimum 5 chapters
- Descriptive titles (not just "Part 1")
- First chapter at 0:00
- Aligned with content structure

**Cards and End Screens:**
- 2-3 cards linked to related content
- End screen: Subscribe + best related video
- Card timing: At natural transition points

#### Step 6.4: Quality Review

```
INPUT:  All production-ready content
ACTION: Final quality review across all pieces
OUTPUT: Quality-approved content + revision notes
```

**Quality Checklist per Piece:**
- [ ] Factual accuracy (claims match source)
- [ ] Brand voice consistency
- [ ] Platform formatting correct
- [ ] No grammatical or spelling errors
- [ ] CTA present and clear
- [ ] Links valid (if applicable)
- [ ] Hashtags relevant (if applicable)
- [ ] Length within platform guidelines
- [ ] Hook compelling (would you stop scrolling?)
- [ ] Insight clear (what does the reader learn?)

### Quality Gate QG-004: Content Reviewed

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| All pieces reviewed | 100% pass quality checklist | Checklist completion |
| Factual accuracy | 100% claims verified | Source check |
| Platform compliance | 100% meet formatting rules | Format validation |
| Voice consistency | Consistent across all pieces | Style review |
| CTA presence | 100% have clear CTAs | CTA check |

### Quality Gate QG-005: YouTube Ready

| Criterion | Threshold | Measurement |
|-----------|-----------|-------------|
| Title optimized | 3 variants generated | Variant count |
| Thumbnail concepts | 3 concepts described | Concept count |
| Description complete | All sections filled | Section check |
| Tags added | >= 15 tags | Tag count |
| Chapters defined | >= 5 chapters | Chapter count |
| Script complete | Full script with timestamps | Script review |

**QG-004 + QG-005 Decision Matrix:**

| Result | Action |
|--------|--------|
| BOTH PASS | Proceed to completion |
| QG-004 FAIL | Return to production for revisions |
| QG-005 FAIL | Return to YouTube optimization |
| BOTH FAIL | Major revision cycle required |

### Final Output Assembly

```
data/distributed/{video_id}/
├── distribution_plan.yaml        # Complete distribution strategy
├── production/
│   ├── twitter/
│   │   └── [thread files]
│   ├── linkedin/
│   │   └── [post files]
│   ├── instagram/
│   │   └── [carousel files]
│   ├── youtube/
│   │   ├── script.md
│   │   ├── title_variants.yaml
│   │   ├── thumbnail_concepts.md
│   │   ├── description.md
│   │   ├── tags.yaml
│   │   └── chapters.yaml
│   └── newsletter/
│       └── [section files]
├── quality_reports/
│   ├── qg004_content_review.md
│   └── qg005_youtube_review.md
└── production_report.md          # Complete production report
```

---

## Error Handling

### Global Error Codes

| Code | Phase | Error | Recovery |
|------|-------|-------|----------|
| `INGEST-001` | INGEST | Invalid URL | Prompt for correct URL |
| `INGEST-002` | INGEST | Video unavailable | Check URL, try alternative |
| `INGEST-003` | INGEST | Corrupted audio | Re-download, try alt format |
| `INGEST-004` | INGEST | No speech detected | Check video has audio content |
| `EXTRACT-001` | EXTRACT | < 5 fragments | Relax thresholds, re-scan |
| `EXTRACT-002` | EXTRACT | Transcript too short | Check INGEST output |
| `IDENTIFY-001` | IDENTIFY | < 3 frameworks | Broaden matching criteria |
| `IDENTIFY-002` | IDENTIFY | No heuristics | Return to EXTRACT phase |
| `DISTILL-001` | DISTILL | Layer incomplete | Complete missing layer |
| `DISTILL-002` | DISTILL | Compression violation | Revise verbose layer |
| `MULTIPLY-001` | MULTIPLY | < 15 pieces | Generate more variants |
| `MULTIPLY-002` | MULTIPLY | Low platform diversity | Expand platform targets |
| `DISTRIBUTE-001` | DISTRIBUTE | Quality check fail | Return to production |
| `DISTRIBUTE-002` | DISTRIBUTE | YouTube checks fail | Return to optimization |

### Recovery Procedures

**Phase Retry:**
Any phase can be retried up to 3 times. On the third failure, the pipeline halts and requires manual intervention.

```yaml
retry_policy:
  max_retries: 3
  backoff: exponential
  base_delay: 30s
  max_delay: 300s
  on_max_retries: HALT_AND_NOTIFY
```

**Phase Rollback:**
If a phase fails and cannot be retried, the pipeline can roll back to the previous phase's output and attempt an alternative processing path.

```yaml
rollback_policy:
  preserve_artifacts: true
  rollback_to: previous_phase_output
  alternative_path: relaxed_thresholds
  notify_on_rollback: true
```

**Manual Intervention:**
When the pipeline halts, it generates a detailed intervention report at:
`data/pipeline_runs/{run_id}/intervention_required.md`

---

## Completion Report Template

```markdown
# Pipeline Completion Report

## Run Summary
- **Run ID**: [auto-generated]
- **Source**: [YouTube URL]
- **Video Title**: [title]
- **Started**: [timestamp]
- **Completed**: [timestamp]
- **Total Duration**: [duration]
- **Status**: COMPLETED | COMPLETED_WITH_WARNINGS | FAILED

## Phase Results

| Phase | Status | Duration | Artifacts | Warnings |
|-------|--------|----------|-----------|----------|
| INGEST | PASS | 5m | 6 files | 0 |
| EXTRACT | PASS | 12m | 5 files | 1 |
| IDENTIFY | PASS | 8m | 6 files | 0 |
| DISTILL | PASS | 10m | 8 files | 0 |
| MULTIPLY | PASS | 15m | 22 files | 2 |
| DISTRIBUTE | PASS | 20m | 30 files | 0 |

## Quality Gate Results

| Gate | Status | Score | Notes |
|------|--------|-------|-------|
| QG-001 | PASS | 94% | Transcription confidence high |
| QG-002 | PASS | 5 frameworks | 1 novel framework discovered |
| QG-003 | PASS | 5/5 layers | All compression ratios valid |
| QG-004 | PASS | 100% | All content reviewed |
| QG-005 | PASS | 100% | YouTube package complete |

## Output Summary
- Knowledge fragments extracted: [N]
- Frameworks identified: [N] known + [N] novel
- Heuristics cataloged: [N]
- Content pieces produced: [N]
- Platforms covered: [list]
- YouTube-ready: YES/NO

## Warnings and Notes
[Any warnings or notes from the pipeline run]

## Next Steps
[Recommended follow-up actions]
```

---

## Appendix: Pipeline Configuration

### Default Configuration

```yaml
pipeline:
  name: full-distillery-pipeline
  version: 1.0.0

  ingest:
    transcription_engine: whisper-large-v3
    fallback_engine: deepgram-nova-2
    min_confidence: 0.90
    max_video_duration: 14400  # 4 hours in seconds
    audio_format: wav
    audio_sample_rate: 16000

  extract:
    min_fragments: 5
    rpd_patterns: all
    confidence_threshold: 0.7

  identify:
    min_frameworks: 3
    min_heuristics: 5
    match_confidence_threshold: 0.7
    novel_detection: true

  distill:
    summarization_layers: 5
    max_executive_summary_words: 200
    para_classification: required

  multiply:
    min_content_pieces: 15
    min_platforms: 3
    four_a_categories: all
    atomization: true

  distribute:
    youtube_optimization: true
    title_variants: 3
    thumbnail_concepts: 3
    min_tags: 15
    min_chapters: 5
    batch_production: true
    quality_review: required
```

### Environment Variables

```bash
DISTILLERY_TRANSCRIPTION_ENGINE=whisper-large-v3
DISTILLERY_LANGUAGE=pt-BR
DISTILLERY_OUTPUT_DIR=data/
DISTILLERY_LOG_LEVEL=INFO
DISTILLERY_MAX_RETRIES=3
DISTILLERY_QUALITY_STRICT=true
```

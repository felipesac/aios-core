# Task: Extract Tacit Knowledge from Transcript

**Task ID:** content-distillery/extract-tacit-knowledge
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Distillery Pipeline
**Total Lines:** 480

---

## Executive Summary

This task applies Cedric Chin's tacit knowledge extraction methodology to identify implicit, experience-based knowledge embedded in a transcript. Most valuable content from expert creators lives not in their explicit statements but in the decision patterns, recognition cues, and heuristics they deploy unconsciously. This task surfaces that hidden knowledge and structures it for downstream framework identification and content multiplication.

**Workflow Position:** Task 2 in Content Distillery pipeline (depends on ingest-youtube)
**Success Definition:** 15+ high-confidence tacit knowledge fragments extracted per hour of transcript
**Output Quality Gate:** Each fragment must include evidence, RPD classification, and confidence score >= 0.6

---

## Purpose

Experts communicate 90% of their valuable knowledge implicitly. When Alex Hormozi says "I always look at LTV before I look at CAC," the explicit statement is the ratio preference. The tacit knowledge is: what cues tell him to look at LTV, what patterns he recognizes that make this important, what expectations he forms from that data, and what actions follow. This task extracts the 90% that listeners miss.

Without this task, the Content Distillery produces shallow summaries instead of deep, actionable intelligence. The difference between a mediocre content repurposer and a brilliant one is the ability to surface what the expert did NOT say explicitly.

This task uses Gary Klein's Recognition-Primed Decision (RPD) model as the primary extraction framework, supplemented by Cedric Chin's operationalization for tacit knowledge in business contexts.

---

## Executor Type

**Agent (100% tacit-extractor agent)**

- **Agent Role:** Deep reading, pattern recognition, RPD analysis, knowledge classification
- **Human Role:** None during extraction (human validates in separate QA step)
- **Estimated Runtime:** 15-45 minutes per hour of transcript

---

## Inputs

### Required Inputs

```yaml
transcript:
  field: "Cleaned transcript from ingest-youtube task"
  format: "Markdown file"
  required: true
  location: "outputs/distillery/{slug}/transcript.md"
  validation: "Must have quality score >= 7/10 from ingestion task"
  notes: "Full transcript with timestamps and speaker attribution"

metadata:
  field: "Video metadata from ingest-youtube task"
  format: "YAML file"
  required: true
  location: "outputs/distillery/{slug}/metadata.yaml"
  validation: "Must include title, channel, duration, and description"
  notes: "Used for contextualizing expert identity and domain"
```

### Optional Inputs

```yaml
expert_profile:
  field: "Known information about the speaker/expert"
  format: "YAML or text"
  required: false
  example: |
    name: "Alex Hormozi"
    domain: "business growth, offers, sales"
    known_frameworks: ["Value Equation", "Grand Slam Offer", "CLOSER framework"]
    experience_years: 15
    known_biases: ["survivorship bias", "recency bias toward digital"]
  notes: "Improves extraction accuracy by providing context"

extraction_focus:
  field: "Specific domains to focus extraction on"
  format: "list of strings"
  required: false
  example: ["pricing strategy", "customer acquisition", "team building"]
  notes: "Narrows extraction to specific topics if transcript covers many"

prior_extractions:
  field: "Previous tacit knowledge extractions from same expert"
  format: "YAML file(s)"
  required: false
  notes: "Prevents duplicate extraction and enables cross-referencing"

minimum_confidence:
  field: "Minimum confidence score to include in output"
  format: "float (0.0-1.0)"
  default: 0.5
  notes: "Lower threshold includes more speculative extractions"
```

---

## Preconditions

Before starting this task:

- [ ] Transcript exists at `outputs/distillery/{slug}/transcript.md`
- [ ] Transcript quality score >= 7/10 (from quality-report.yaml)
- [ ] Metadata exists at `outputs/distillery/{slug}/metadata.yaml`
- [ ] No previous tacit-knowledge.yaml exists for this slug (or re-extraction explicitly requested)
- [ ] Agent has access to RPD model reference documentation
- [ ] Agent has access to tacit knowledge type taxonomy

---

## Steps

### Step 1: Load and Contextualize Transcript (2 min)

**Agent Activity:**
- Read complete transcript (NEVER partial reads)
- Read metadata to understand:
  - Who is the expert? (channel name, known domain)
  - What is the context? (video title, description, tags)
  - How long is the content? (duration affects extraction density)
  - Is this a monologue, interview, or panel? (affects attribution)
- If `expert_profile` provided: load known frameworks and biases
- If `prior_extractions` provided: load to avoid duplicates

**Context Building:**
```yaml
extraction_context:
  expert_name: "{from metadata or expert_profile}"
  expert_domain: "{inferred from channel + title + description}"
  content_type: "{monologue | interview | panel | tutorial}"
  expected_fragments: "{duration_minutes * 0.25 = estimated fragments}"
  focus_areas: "{from extraction_focus or 'all'}"
```

**Checkpoint:** Context document built, extraction parameters set

---

### Step 2: First Pass - Identify Expert Segments (5-10 min)

**Agent Activity:**
- Scan entire transcript to identify "expert segments" - passages where the speaker shares experience-based knowledge rather than general information
- Mark segments using these indicators:

**Expert Segment Indicators (HIGH signal):**
- Personal anecdotes: "When I was...", "I remember...", "We tried..."
- Decision narratives: "I decided to...", "The reason I chose..."
- Pattern recognition: "I always look for...", "The thing I notice..."
- Contrast with conventional wisdom: "Most people think X, but actually..."
- Conditional heuristics: "If you see X, then...", "When X happens, I..."
- Failure stories: "The mistake I made was...", "What I learned from..."
- Quantified experience: "After doing this 100 times...", "In 80% of cases..."

**Expert Segment Indicators (MEDIUM signal):**
- Emotional emphasis: Strong tone shifts, repetition for emphasis
- Detailed specifics: Exact numbers, specific examples, named entities
- Teaching moments: "Here's what most people miss...", "The key insight is..."
- Meta-cognition: "The way I think about this is...", "My mental model for..."

**Non-Expert Segments (SKIP):**
- General introductions and greetings
- Sponsor reads and promotions
- Obvious filler and transitions
- Widely known facts stated without novel framing

**Output Format:**
```yaml
expert_segments:
  - id: "ES-001"
    timestamp: "[00:05:30]"
    text: "Full segment text here..."
    signal_strength: "high"
    indicators: ["personal anecdote", "conditional heuristic"]
    topic: "pricing strategy"
```

**Checkpoint:** All expert segments identified and tagged (expect 10-40 per hour of content)

---

### Step 3: Deep Extraction - Apply RPD Model to Each Segment (15-25 min)

**Agent Activity:**
- For EACH expert segment, apply Gary Klein's Recognition-Primed Decision model:

**RPD Analysis Template:**

```yaml
rpd_analysis:
  segment_id: "ES-001"

  # 1. CUES: What did the expert notice?
  cues_noticed:
    description: "What environmental signals triggered the expert's attention?"
    extracted: |
      What specific data points, patterns, or signals did the expert
      describe noticing? These are the inputs to their decision process.
    evidence: "Direct quote from transcript"
    confidence: 0.8

  # 2. PATTERNS: What did they recognize?
  patterns_recognized:
    description: "What familiar pattern did these cues match in the expert's experience?"
    extracted: |
      What prior experience or mental model did the expert connect
      these cues to? What category did they place the situation in?
    evidence: "Direct quote from transcript"
    confidence: 0.7

  # 3. EXPECTATIONS: What did they expect to happen?
  expectations_formed:
    description: "Based on the pattern, what outcome did the expert anticipate?"
    extracted: |
      What prediction did the expert form? What did they expect
      would happen if they acted (or didn't act)?
    evidence: "Direct quote or strong inference from transcript"
    confidence: 0.7

  # 4. ACTIONS: What did they do?
  actions_taken:
    description: "What specific action did the expert take based on their recognition?"
    extracted: |
      What was the decision or behavior that resulted from the
      recognition process? This is the output of tacit knowledge.
    evidence: "Direct quote from transcript"
    confidence: 0.9
```

**For Each Segment:**
1. Read the segment 3 times (literal reading, contextual reading, inference reading)
2. Extract each RPD component with evidence
3. Rate confidence for each component (0.0-1.0)
4. Note if any RPD component is missing (common for cues and expectations)
5. Identify the tacit knowledge "nugget" - the decision rule that was NOT stated explicitly

**Quality Check Per Extraction:**
- Must have at least 2 of 4 RPD components with confidence >= 0.6
- Must have direct transcript evidence (not pure inference)
- Must represent knowledge that is NOT obvious to a non-expert

**Checkpoint:** RPD analysis complete for all expert segments

---

### Step 4: Classify Knowledge Type (5 min)

**Agent Activity:**
- Classify each extracted fragment into Cedric Chin's tacit knowledge taxonomy:

**Knowledge Types:**

```yaml
knowledge_types:
  relational:
    definition: "Knowledge about how things relate to each other"
    examples:
      - "LTV/CAC ratio indicates business health"
      - "Team morale correlates with shipping velocity"
    subtypes:
      - causal: "X causes Y"
      - correlational: "X tends to appear with Y"
      - conditional: "X leads to Y only when Z is true"

  somatic:
    definition: "Embodied knowledge, 'gut feel', physical intuition"
    examples:
      - "I can feel when a sales call is going sideways"
      - "Something felt off about that hire"
    subtypes:
      - pattern_feel: "Recognition without conscious reasoning"
      - timing_sense: "Knowing when to act/wait"
      - quality_intuition: "Sensing quality without measuring"

  collective:
    definition: "Knowledge embedded in group/team dynamics"
    examples:
      - "High-performing teams have this energy you can feel"
      - "The best founding teams always argue about X"
    subtypes:
      - cultural: "How groups behave and why"
      - procedural: "How teams coordinate effectively"
      - institutional: "What the organization 'knows'"

  perceptual:
    definition: "Ability to notice things others miss"
    examples:
      - "I look at the second derivative, not the first"
      - "Most people focus on revenue; I focus on retention curve shape"
    subtypes:
      - attention: "What to focus on"
      - distinction: "How to tell similar things apart"
      - priority: "What matters most in a given context"

  procedural:
    definition: "Know-how, skill-based knowledge"
    examples:
      - "When negotiating, I always X before Y"
      - "My process for evaluating a business is..."
    subtypes:
      - sequential: "Steps in a specific order"
      - adaptive: "Adjusting process based on context"
      - diagnostic: "How to identify what's wrong"
```

**For Each Fragment:**
- Assign primary type and subtype
- Assign secondary type if applicable (many fragments span categories)
- Note classification confidence

**Checkpoint:** All fragments classified with type, subtype, and confidence

---

### Step 5: Extract Decision Heuristics (5-8 min)

**Agent Activity:**
- Transform RPD extractions into actionable decision heuristics
- Format: "When I see X, I do Y, because Z"

**Heuristic Template:**

```yaml
heuristic:
  id: "DH-001"
  source_segment: "ES-001"

  # The trigger condition
  when: |
    When I see [specific observable cue or pattern]...
  when_specificity: "high"  # high: specific metric, medium: observable pattern, low: vague feeling

  # The action
  then: |
    I do [specific action or decision]...
  then_specificity: "high"

  # The rationale (often the tacit part)
  because: |
    Because [reason based on experience/pattern recognition]...
  because_explicit: false  # Was this stated or inferred?

  # Context and limitations
  context:
    domain: "pricing strategy"
    applies_when: "B2B SaaS with recurring revenue"
    fails_when: "Marketplace businesses with variable LTV"
    expert_confidence: "high"  # How confident was the expert when sharing?

  # Evidence
  evidence:
    direct_quote: "Exact quote from transcript"
    timestamp: "[00:15:30]"
    supporting_quotes: []

  # Quality
  confidence: 0.8
  novelty: "medium"  # high: never heard before, medium: unique framing, low: commonly known
  actionability: "high"  # high: can apply tomorrow, medium: needs adaptation, low: theoretical
```

**Extraction Rules:**
- Each heuristic must have all three parts (when/then/because)
- If "because" is not stated, infer from context and mark `because_explicit: false`
- If "when" condition is vague, note specificity level
- Aim for 3-8 heuristics per hour of content (quality over quantity)

**Checkpoint:** Decision heuristics extracted and formatted

---

### Step 6: Rate Confidence and Flag Uncertain Extractions (3 min)

**Agent Activity:**
- Review all extractions holistically
- Assign final confidence scores:

```yaml
confidence_levels:
  high (0.8-1.0):
    criteria: "Expert stated directly, multiple supporting quotes, unambiguous"
    action: "Include in output, mark as high confidence"

  medium (0.6-0.79):
    criteria: "Strong inference with some evidence, partially stated"
    action: "Include in output, mark for human validation"

  low (0.4-0.59):
    criteria: "Reasonable inference but limited evidence"
    action: "Include if above minimum_confidence, flag as speculative"

  very_low (0.0-0.39):
    criteria: "Pure speculation or extremely vague"
    action: "Exclude from output, log in extraction notes"
```

- Filter out extractions below `minimum_confidence` threshold
- Flag extractions where confidence dropped during review
- Note any contradictions between fragments

**Cross-Validation:**
- Do extracted heuristics contradict each other? (flag for review)
- Are there fragments that support/reinforce each other? (note connections)
- Do any fragments contradict known frameworks from `expert_profile`? (flag)

**Checkpoint:** All confidence scores finalized, low-quality extractions filtered

---

### Step 7: Generate Structured Output (3 min)

**Agent Activity:**
- Compile all extractions into the final structured output format
- Generate summary statistics
- Create extraction report

**Output Assembly:**
1. Compile `tacit-knowledge.yaml` with all fragments
2. Generate summary statistics (counts by type, confidence distribution)
3. Create extraction narrative (markdown summary of key findings)
4. Cross-reference with prior extractions if available

**Checkpoint:** All output files written and validated

---

## Outputs

### Primary Output

**Tacit Knowledge Document**

Format: YAML
Location: `outputs/distillery/{slug}/tacit-knowledge.yaml`

```yaml
tacit_knowledge:
  metadata:
    source_slug: "{slug}"
    source_title: "{video title}"
    expert_name: "{expert name}"
    expert_domain: "{domain}"
    extraction_date: "2026-02-12T10:30:00Z"
    transcript_duration_minutes: 90
    total_expert_segments: 28
    total_fragments_extracted: 22
    total_heuristics: 7
    confidence_distribution:
      high: 8
      medium: 10
      low: 4
    knowledge_type_distribution:
      relational: 9
      perceptual: 6
      procedural: 4
      somatic: 2
      collective: 1

  fragments:
    - id: "TK-001"
      segment_id: "ES-003"
      timestamp: "[00:12:45]"
      knowledge_type: "relational"
      knowledge_subtype: "conditional"
      confidence: 0.85

      rpd:
        cues: "Seeing a business with high revenue but declining retention curve"
        patterns: "Recognizes 'leaky bucket' pattern from 100+ businesses evaluated"
        expectations: "Business will plateau within 6-12 months without fixing retention"
        actions: "Immediately shifts focus from acquisition to retention before any growth investment"

      heuristic:
        when: "When a business has growing revenue but month-over-month retention is declining"
        then: "Stop all acquisition spending and fix retention first"
        because: "Revenue growth masks the underlying problem; by the time revenue flattens, you've wasted 6 months of acquisition budget on customers who leave"
        because_explicit: true

      evidence:
        primary_quote: "I've seen this exact pattern in maybe 80 of the businesses I've worked with. Revenue's going up, everyone's celebrating, but the retention curve is slowly going down..."
        supporting_quotes:
          - "The first thing I do when I look at a business now is ignore the revenue number entirely and look at the retention curve."
        timestamp: "[00:12:45] - [00:14:20]"

      quality:
        novelty: "medium"
        actionability: "high"
        evidence_strength: "strong"
        domain_specificity: "B2B/service businesses"

    # ... additional fragments ...

  heuristics_summary:
    - id: "DH-001"
      short: "Retention before acquisition"
      when: "Revenue up + retention down"
      then: "Freeze acquisition, fix retention"
      confidence: 0.85
      domain: "business growth"

    # ... additional heuristics ...
```

### Secondary Outputs

**1. Extraction Report**
- Format: Markdown
- Location: `outputs/distillery/{slug}/extraction-report.md`
- Content: Narrative summary of key tacit knowledge found, notable patterns, surprising insights, and extraction limitations

**2. Expert Segments Map**
- Format: YAML
- Location: `outputs/distillery/{slug}/expert-segments.yaml`
- Content: All identified expert segments with timestamps and classifications (useful for creating highlight reels)

**3. Extraction Log**
- Format: YAML
- Location: `outputs/distillery/{slug}/extraction-log.yaml`
- Content: Step-by-step log of extraction process, decisions made, fragments rejected and why

---

## Validation

### Checklist

- [ ] Complete transcript read (no partial reads)
- [ ] Expert segments identified with signal strength ratings
- [ ] RPD model applied to each expert segment (4 components per segment)
- [ ] Each fragment has direct transcript evidence (not pure inference)
- [ ] Knowledge type classified for all fragments (primary + secondary)
- [ ] Decision heuristics extracted in "when/then/because" format
- [ ] Confidence scores assigned to all extractions (0.0-1.0)
- [ ] Low-confidence extractions filtered or flagged appropriately
- [ ] No contradictions between extracted heuristics (or contradictions flagged)
- [ ] At least 10 fragments per hour of transcript (quality minimum)
- [ ] At least 3 heuristics per hour of transcript (quality minimum)
- [ ] Output YAML is valid and parseable
- [ ] Extraction report includes limitations and caveats

### Success Criteria

**Threshold: 10/13 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Fragment density** | 15+ fragments/hour with 70%+ high/medium confidence | 10-14 fragments/hour | < 10 fragments/hour |
| **RPD completeness** | All 4 RPD components for 80%+ of fragments | 3+ components for 70%+ | Missing 2+ components frequently |
| **Evidence quality** | Every fragment has direct quote evidence | 80% have direct quotes | < 70% have direct evidence |
| **Heuristic actionability** | 80%+ heuristics are immediately actionable | 60%+ actionable | < 50% actionable |
| **Knowledge depth** | Surfaces knowledge listeners would miss | Mix of obvious and deep | Mostly states what's obvious from transcript |
| **Classification accuracy** | Knowledge types match content intuitively | Minor misclassifications | Frequent wrong classifications |

---

## Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| **Context Loading** | 2 min | Read transcript + metadata |
| **Segment Identification** | 5-10 min | First pass, marking segments |
| **RPD Analysis** | 15-25 min | Deepest work, per-segment analysis |
| **Classification** | 5 min | Type taxonomy application |
| **Heuristic Extraction** | 5-8 min | Transform RPD to heuristics |
| **Confidence Rating** | 3 min | Final review and scoring |
| **Output Generation** | 3 min | YAML compilation |
| **Total (1-hour transcript)** | 35-55 min | Scales roughly linearly with duration |
| **Total (2-hour livestream)** | 60-90 min | Longer content has more expert segments |

---

## Integration

### Feeds To

**Workflow:** Content Distillery Pipeline (content-distillery/full-distillery-pipeline)

**Next Tasks in Sequence:**
- **Task 3:** identify-frameworks - Uses: tacit-knowledge.yaml (fragments, heuristics)
- **Task 4:** progressive-summarize - Uses: tacit-knowledge.yaml (for Layer 3 highlighting)
- **Task 5:** multiply-ideas - Uses: tacit-knowledge.yaml (heuristics become content angles)

### Depends On

- **Task 1:** ingest-youtube - Provides: transcript.md, metadata.yaml

### Agent Routing

**Primary Agent:** tacit-extractor (Cedric Chin methodology specialist)
**Quality Review:** distillery-chief (validates extraction quality)

---

## Quality Threshold

**Pass/Fail Gate:** Checklist score >= 10/13

If < 10/13:
1. Identify which criteria failed
2. If fragment density low: re-read transcript with lower signal threshold
3. If RPD incomplete: focus on missing components, accept partial extractions
4. If evidence weak: go back to transcript for supporting quotes
5. If heuristics not actionable: refine "when/then/because" specificity
6. Re-validate

**Common Failure Reasons:**
- Transcript is mostly theoretical (expert lecturing, not sharing experience)
- Video is a product review/tutorial (low tacit knowledge density)
- Poor transcript quality causing misinterpretation of expert statements
- Expert uses very implicit communication (requires deep domain knowledge to decode)
- Extraction too conservative (raising minimum confidence filters useful knowledge)

---

## Related Tasks

- **Task 1:** ingest-youtube (provides raw material)
- **Task 3:** identify-frameworks (builds on this extraction)
- **Task 4:** progressive-summarize (uses extraction for highlighting)
- **Task 5:** multiply-ideas (transforms heuristics into content)
- **Task 6:** distill-single-live (orchestrates this as step 2)

---

## Notes for Executor

### When the Expert is Telling Stories

Stories are the RICHEST source of tacit knowledge. When the expert tells a story:
1. The RPD model maps directly to story structure:
   - Cues = what they noticed in the situation
   - Patterns = what prior experience they connected it to
   - Expectations = what they predicted would happen
   - Actions = what they actually did
2. Pay special attention to "and that's when I realized..." moments
3. The lesson AFTER the story is often the explicit version; the story itself contains the tacit version

### When the Expert Contradicts Themselves

Do NOT discard contradictions. They often represent:
- Context-dependent knowledge ("In B2B I do X, but in B2C I do Y")
- Evolved understanding ("I used to think X, now I know Y")
- Nuance that resists simple rules ("Usually X, but sometimes Y")
Flag contradictions and extract BOTH sides with their contexts.

### When the Expert Uses Analogies

Analogies are compressed tacit knowledge. "Building a business is like building a house - you need the foundation first" contains:
- Sequential dependency knowledge (foundation before walls)
- Risk assessment (skipping steps leads to collapse)
- Invisible structure matters more than visible decoration
Extract the knowledge BEHIND the analogy, not just the analogy itself.

### When Multiple Experts Are Present

- Attribute knowledge to specific speakers
- Pay attention to agreements (reinforces confidence)
- Pay attention to disagreements (reveals context-dependency)
- Interviewer questions often reveal what's surprising (high novelty signal)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

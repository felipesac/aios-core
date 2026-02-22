# Task: Progressive Summarization (5 Layers)

**Task ID:** content-distillery/progressive-summarize
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Distillery Pipeline
**Total Lines:** 480

---

## Executive Summary

This task applies Tiago Forte's Progressive Summarization methodology to distill a full transcript into 5 increasingly compressed layers of insight. Each layer reduces volume while increasing density, culminating in a remix that combines the expert's knowledge with existing mental models. The process also produces an executive summary and intermediate packets (reusable knowledge atoms) organized via the PARA method for maximum future retrieval and remix potential.

**Workflow Position:** Task 4 in Content Distillery pipeline (depends on ingest-youtube; enhanced by extract-tacit-knowledge and identify-frameworks)
**Success Definition:** 5 complete layers with correct compression ratios, plus actionable intermediate packets
**Output Quality Gate:** Each layer must be strictly smaller than the previous; Layer 5 must demonstrate synthesis, not just compression

---

## Purpose

A 2-hour livestream transcript is ~20,000 words. Nobody will read 20,000 words. But the 200 words that capture the 3 most counterintuitive insights - those change how people think. Progressive Summarization is the systematic process of finding those 200 words without losing the context that makes them meaningful.

This task also solves the "retrieval problem": knowledge captured but never reused. By creating intermediate packets - self-contained, context-rich knowledge atoms - each insight becomes findable, remixable, and applicable to future projects. A single insight from today's distillation might power a newsletter next month, a course next quarter, and a book chapter next year.

Without this task, the Content Distillery produces analysis (frameworks, heuristics) but not artifacts people actually consume.

---

## Executor Type

**Agent (100% knowledge-architect agent)**

- **Agent Role:** Multi-layer compression, PARA organization, intermediate packet creation, executive summary synthesis
- **Human Role:** None during summarization (human reviews final output)
- **Estimated Runtime:** 20-40 minutes per hour of source transcript

---

## Inputs

### Required Inputs

```yaml
transcript:
  field: "Cleaned transcript from ingest-youtube task"
  format: "Markdown file"
  required: true
  location: "outputs/distillery/{slug}/transcript.md"
  validation: "Must have quality score >= 7/10"
  notes: "This IS Layer 1 - the raw material"

metadata:
  field: "Video metadata"
  format: "YAML file"
  required: true
  location: "outputs/distillery/{slug}/metadata.yaml"
  notes: "Title, channel, duration for context"
```

### Optional (But Strongly Recommended) Inputs

```yaml
tacit_knowledge:
  field: "Tacit knowledge extractions"
  format: "YAML file"
  required: false
  location: "outputs/distillery/{slug}/tacit-knowledge.yaml"
  notes: "Dramatically improves Layer 2 and 3 selection quality"

frameworks:
  field: "Identified frameworks and models"
  format: "YAML file"
  required: false
  location: "outputs/distillery/{slug}/frameworks.yaml"
  notes: "Ensures frameworks are highlighted in Layer 2 and 3"

heuristics:
  field: "Extracted decision heuristics"
  format: "YAML file"
  required: false
  location: "outputs/distillery/{slug}/heuristics.yaml"
  notes: "Ensures heuristics are included in executive summary"

existing_knowledge_base:
  field: "User's existing knowledge base for remix connections"
  format: "Directory path or YAML index"
  required: false
  notes: "Enables richer Layer 5 remix by connecting to prior knowledge"
```

---

## Preconditions

Before starting this task:

- [ ] Transcript exists at `outputs/distillery/{slug}/transcript.md`
- [ ] Transcript quality score >= 7/10
- [ ] Metadata exists at `outputs/distillery/{slug}/metadata.yaml`
- [ ] Output directory `outputs/distillery/{slug}/distilled/` can be created
- [ ] (Recommended) tacit-knowledge.yaml exists from Task 2
- [ ] (Recommended) frameworks.yaml exists from Task 3

---

## Steps

### Step 1: Prepare Layer 1 - Original Notes (2 min)

**Agent Activity:**
- Read complete transcript (Layer 1 IS the transcript)
- Calculate baseline statistics:
  - Total word count
  - Total paragraphs
  - Estimated reading time
  - Topic sections identified
- Copy transcript to `layer-1.md` with added metadata header:

```markdown
---
layer: 1
source: "{slug}"
title: "{title}"
total_words: {count}
reading_time: "{X} minutes"
compression_ratio: "1.0 (original)"
---

# Layer 1: Original Transcript

{complete transcript content}
```

**Layer 1 Purpose:** Preserve the complete original for reference. All subsequent layers reference back to Layer 1 timestamps.

**Checkpoint:** Layer 1 saved with word count baseline established

---

### Step 2: Create Layer 2 - Bold Passages (8-12 min)

**Agent Activity:**
- Read through entire transcript and mark the most important passages
- Target: **20-30% of original content** (bold the best 20-30%)
- Selection criteria (in priority order):

**BOLD IT if it contains:**
1. **Unique insights** - Ideas you haven't heard anywhere else (highest priority)
2. **Specific frameworks** - Named models, structured approaches, step-by-step processes
3. **Surprising data** - Counter-intuitive statistics, unexpected results, contrarian claims
4. **Actionable advice** - Specific things the listener could do tomorrow
5. **Expert heuristics** - "When I see X, I do Y" decision rules
6. **Vivid stories** - Anecdotes that illustrate principles memorably
7. **Key definitions** - New terminology or redefinitions of common terms

**DO NOT BOLD:**
- Generic introductions and pleasantries
- Filler words, repetitions, tangents that don't add value
- Information that is commonly known in the expert's domain
- Sponsor reads, self-promotion, calls to action
- Setup/context that leads to insight (bold the insight, not the setup)

**Cross-Reference Enhancement:**
- If `tacit_knowledge` input available: ensure ALL high-confidence fragments are bolded
- If `frameworks` input available: ensure ALL framework evidence passages are bolded
- This prevents the summarization from missing knowledge the extraction tasks identified

**Format:**
```markdown
---
layer: 2
source: "{slug}"
bolded_word_count: {count}
original_word_count: {count}
compression_ratio: "{X}% of original"
---

# Layer 2: Bold Passages

## [00:00:00] Introduction
Regular text that provides context but isn't critical...

**This is a bolded passage because it contains a unique insight that
changes how you think about the topic. The expert says something
specific and actionable here.**

More regular context text...

**Another bolded passage with a specific framework: "Step 1: do X.
Step 2: do Y. Step 3: measure Z. The key is the order matters."**
```

**Quality Check:**
- Compression ratio should be 20-30% (if < 15%: too aggressive, missing content; if > 35%: not selective enough)
- Every bolded passage should pass the "would I highlight this in a book?" test
- No bolded passage should be purely transitional or contextual

**Checkpoint:** Layer 2 complete with 20-30% compression ratio, all key insights bolded

---

### Step 3: Create Layer 3 - Highlighted Passages (8-12 min)

**Agent Activity:**
- Read Layer 2 (only the bolded passages)
- From the bolded passages, select the BEST of the BEST
- Target: **10-15% of original content** (about 40-60% of what was bolded)
- Selection criteria (stricter than Layer 2):

**HIGHLIGHT IT if it is:**
1. **Novel ideas** - Something that genuinely changes your thinking (not just interesting)
2. **Counterintuitive insights** - Goes against conventional wisdom with evidence
3. **Highest-impact frameworks** - The 1-3 frameworks that matter most from this content
4. **Decision-changing heuristics** - Rules that would change how you make decisions
5. **Quotable statements** - Phrases so good you want to save them verbatim

**DO NOT HIGHLIGHT (even if bolded):**
- Supporting evidence for already-highlighted insight (keep the insight, drop the evidence)
- Good advice that is domain-specific and narrow
- Interesting but not transformative insights
- Anecdotes (unless the anecdote IS the insight)

**Format:**
```markdown
---
layer: 3
source: "{slug}"
highlighted_word_count: {count}
original_word_count: {count}
compression_ratio: "{X}% of original"
---

# Layer 3: Highlighted Passages

## Key Insight 1: {descriptive title}
[{timestamp}]

==The most critical passage, highlighted because it represents the
single most valuable insight from this section. This is the kind of
thing you'd screenshot and save.==

**Supporting bold context that gives the highlight meaning but isn't
the core insight itself.**

## Key Insight 2: {descriptive title}
[{timestamp}]

==Another highlighted passage representing a framework or heuristic
that is genuinely novel and actionable.==
```

**Quality Check:**
- Compression ratio should be 10-15% of original
- Each highlighted passage should be genuinely surprising or transformative
- Someone reading ONLY the highlights should get the 3-5 most important ideas
- No redundancy between highlighted passages

**Checkpoint:** Layer 3 complete with 10-15% compression, no redundancy

---

### Step 4: Create Layer 4 - Executive Summary (5-8 min)

**Agent Activity:**
- Synthesize all highlighted passages into a structured executive summary
- Target: **500-1000 words** (regardless of original transcript length)
- Structure:

```markdown
---
layer: 4
source: "{slug}"
word_count: {count}
original_word_count: {count}
compression_ratio: "{X}% of original"
---

# Layer 4: Executive Summary

## Source
**{title}** by {expert_name} | {duration} | {publish_date}

## TL;DR (1-2 sentences)
The single most important takeaway from this content.

## Key Themes (3-5 bullet points)
- **Theme 1:** One sentence explaining the theme
- **Theme 2:** One sentence explaining the theme
- **Theme 3:** One sentence explaining the theme

## Core Frameworks (2-4 frameworks)

### {Framework Name 1}
- **What:** Brief description of the framework
- **Why it matters:** Why this changes your thinking
- **How to apply:** 2-3 actionable steps
- **Evidence:** Key supporting quote from expert

### {Framework Name 2}
...

## Critical Heuristics (3-5 decision rules)
1. **When** {trigger condition} **then** {action} **because** {reason}
2. ...

## Actionable Takeaways (3-5 items)
- [ ] Specific action 1 (can be done this week)
- [ ] Specific action 2
- [ ] Specific action 3

## Surprising Insights
- {Insight 1}: Why it's surprising and what it means
- {Insight 2}: Why it's surprising and what it means

## Connections to Other Knowledge
- This relates to {known framework} because...
- This contradicts {common belief} because...
```

**Quality Check:**
- 500-1000 words, no more (discipline!)
- TL;DR must be genuinely useful (not vague "expert shares insights")
- Frameworks must include HOW TO APPLY (not just what they are)
- Actionable takeaways must be specific enough to execute
- Someone who reads ONLY this should understand the value of the full content

**Checkpoint:** Executive summary complete, 500-1000 words, all sections filled

---

### Step 5: Create Layer 5 - Remix (5-8 min)

**Agent Activity:**
- This is the creative synthesis layer: rewrite the core insights in YOUR OWN WORDS
- Target: **200-400 words**
- This is NOT a shorter summary. It is a REMIX: combining the expert's knowledge with:
  - Your existing mental models
  - Connections to other experts/content
  - Personal interpretation and application
  - Original metaphors or framings

**Remix Guidelines:**
1. Start with the 1-2 most powerful insights from Layer 4
2. Reframe them through a different lens (analogy, domain transfer, inversion)
3. Connect them to knowledge from other sources
4. Add your own interpretation or extension
5. End with an original thought that the expert didn't say but their logic implies

**Format:**
```markdown
---
layer: 5
source: "{slug}"
word_count: {count}
type: "remix"
---

# Layer 5: Remix

{200-400 words of original synthesis}

---
**Original insight from:** {expert_name} in "{title}"
**Remixed on:** {date}
**Key connection:** This connects to {other framework/expert} because...
```

**Quality Check:**
- 200-400 words (discipline!)
- Must contain at least 1 original thought not in the transcript
- Must make at least 1 connection to external knowledge
- Must be written in a different voice than the expert (not paraphrasing)
- Should be interesting enough to publish as a standalone piece

**Checkpoint:** Layer 5 complete, demonstrates genuine synthesis

---

### Step 6: Organize via PARA Method (3 min)

**Agent Activity:**
- Classify all extracted knowledge atoms into PARA categories:

```yaml
para_classification:
  projects:
    description: "Active projects this knowledge applies to"
    items:
      - project: "Content calendar for Q1 2026"
        relevant_insights: ["Framework X", "Heuristic Y"]
        application: "Use Framework X for next week's newsletter"

  areas:
    description: "Ongoing areas of responsibility"
    items:
      - area: "Business Strategy"
        relevant_frameworks: ["NF-001", "MM-003"]
      - area: "Content Creation"
        relevant_heuristics: ["HC-001", "HC-005"]

  resources:
    description: "Reference material for future use"
    items:
      - topic: "Retention strategies"
        frameworks: ["NF-001"]
        source: "{slug}"

  archive:
    description: "Interesting but not currently actionable"
    items:
      - item: "Expert's specific tool stack"
        reason: "Domain-specific, not applicable to our context"
```

**Note:** PARA classification is based on the USER's context (inferred from squad configuration and existing knowledge base). If user context is unclear, classify into Resources by default.

**Checkpoint:** PARA classification complete

---

### Step 7: Generate Intermediate Packets (5-8 min)

**Agent Activity:**
- Create self-contained, reusable knowledge atoms from the distillation
- Each intermediate packet is a complete unit that can be used independently

**Intermediate Packet Template:**

```yaml
intermediate_packets:
  - id: "IP-001"
    title: "The Retention-First Growth Framework"
    type: "framework"  # framework | heuristic | insight | story | data_point | quote
    source:
      slug: "{slug}"
      expert: "{expert_name}"
      timestamp: "[00:23:15]"

    content:
      summary: "One sentence describing this packet"
      full: |
        2-5 paragraph explanation of the knowledge atom.
        Includes context, the insight, why it matters,
        and how to apply it. Self-contained - someone
        reading only this packet should understand it.
      key_quote: "Expert's exact words that capture this"

    metadata:
      para_category: "resources"
      topic_tags: ["retention", "growth", "metrics"]
      domain: "business strategy"
      actionability: "high"
      novelty: "medium"

    remix_potential:
      newsletter: "Yes - standalone topic"
      twitter_thread: "Yes - 5-7 tweet breakdown"
      linkedin_post: "Yes - contrarian take on growth"
      course_module: "Yes - with examples and exercises"
      book_chapter: "Possible - needs more evidence"

    connections:
      related_packets: ["IP-003", "IP-007"]
      related_frameworks: ["NF-001"]
      related_experts: ["Brian Balfour", "Andrew Chen"]
```

**Packet Creation Rules:**
- Each packet must be self-contained (readable without other context)
- Each packet must include source attribution
- Each packet must have remix potential assessment
- Aim for 5-15 packets per hour of source content
- Quality > quantity: every packet should be worth saving

**Checkpoint:** All intermediate packets created and tagged

---

### Step 8: Save All Outputs (2 min)

**Agent Activity:**
- Save all 5 layers and supporting documents
- Verify compression ratios are correct
- Generate distillation summary

**Directory Structure:**
```
outputs/distillery/{slug}/distilled/
├── layer-1.md          # Original transcript (reference copy)
├── layer-2.md          # Bold passages (20-30%)
├── layer-3.md          # Highlighted passages (10-15%)
├── layer-4.md          # Executive summary (500-1000 words)
├── layer-5.md          # Remix (200-400 words)
├── executive-summary.md # Standalone version of Layer 4
├── intermediate-packets.yaml
├── para-classification.yaml
└── distillation-stats.yaml
```

**Checkpoint:** All files written and verified

---

## Outputs

### Primary Outputs

**1-5. Layer Documents**
- Format: Markdown with YAML frontmatter
- Location: `outputs/distillery/{slug}/distilled/layer-{1-5}.md`
- Contains: Progressively compressed versions of the transcript

**6. Executive Summary (Standalone)**
- Format: Markdown
- Location: `outputs/distillery/{slug}/distilled/executive-summary.md`
- Contains: Same as Layer 4 but formatted for standalone distribution

**7. Intermediate Packets**
- Format: YAML
- Location: `outputs/distillery/{slug}/distilled/intermediate-packets.yaml`
- Contains: Self-contained knowledge atoms ready for remix

### Secondary Outputs

**8. PARA Classification**
- Format: YAML
- Location: `outputs/distillery/{slug}/distilled/para-classification.yaml`

**9. Distillation Statistics**
- Format: YAML
- Location: `outputs/distillery/{slug}/distilled/distillation-stats.yaml`

```yaml
distillation_stats:
  source:
    slug: "{slug}"
    title: "{title}"
    duration_minutes: 90

  compression:
    layer_1_words: 18500
    layer_2_words: 4625  # 25% of original
    layer_3_words: 2035  # 11% of original
    layer_4_words: 780   # 4.2% of original
    layer_5_words: 320   # 1.7% of original
    total_compression: "57.8x"

  content_atoms:
    intermediate_packets: 12
    frameworks_referenced: 5
    heuristics_referenced: 7
    actionable_takeaways: 4

  quality:
    layer_2_ratio: "25%"  # target: 20-30%
    layer_3_ratio: "11%"  # target: 10-15%
    layer_4_in_range: true  # 500-1000 words
    layer_5_in_range: true  # 200-400 words
    all_ratios_valid: true
```

---

## Validation

### Checklist

- [ ] Layer 1 saved as complete transcript reference copy
- [ ] Layer 2 compression ratio is 20-30% of Layer 1 word count
- [ ] Layer 2 includes all high-confidence tacit knowledge fragments (if available)
- [ ] Layer 2 includes all framework evidence passages (if available)
- [ ] Layer 3 compression ratio is 10-15% of Layer 1 word count
- [ ] Layer 3 contains only genuinely novel or transformative insights
- [ ] Layer 4 is 500-1000 words with all required sections
- [ ] Layer 4 TL;DR is genuinely useful (not generic)
- [ ] Layer 4 actionable takeaways are specific enough to execute this week
- [ ] Layer 5 is 200-400 words demonstrating genuine synthesis (not just compression)
- [ ] Layer 5 contains at least 1 original thought and 1 external connection
- [ ] Each layer is strictly smaller than the previous layer
- [ ] Intermediate packets are self-contained and tagged
- [ ] PARA classification completed
- [ ] Distillation statistics calculated and all ratios valid

### Success Criteria

**Threshold: 12/15 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Compression discipline** | All layers within target ratios | 1 layer slightly off target | Multiple layers off target |
| **Selection quality** | Bold/highlight choices feel exactly right | Mostly right, minor misses | Important content missed or noise included |
| **Executive summary** | Could send to a CEO and they'd understand the value | Useful but needs some context | Vague or missing key insights |
| **Layer 5 synthesis** | Genuinely adds new thinking beyond the transcript | Some synthesis, mostly restatement | Just a shorter version of Layer 4 |
| **Intermediate packets** | Each is a standalone, remixable knowledge atom | Most are useful, some lack context | Fragments that can't stand alone |
| **PARA utility** | Clear how to use each piece in current projects | Categories make sense but links are vague | PARA feels like busywork, not actionable |

---

## Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| **Layer 1 Prep** | 2 min | Copy + statistics |
| **Layer 2 Bold** | 8-12 min | Careful reading + selection |
| **Layer 3 Highlight** | 8-12 min | Selection from selection |
| **Layer 4 Summary** | 5-8 min | Structured synthesis |
| **Layer 5 Remix** | 5-8 min | Creative synthesis |
| **PARA Classification** | 3 min | Categorization |
| **Intermediate Packets** | 5-8 min | Atom creation |
| **Output + Stats** | 2 min | File writing + verification |
| **Total (1-hour transcript)** | 35-55 min | Scales with content density |

---

## Integration

### Feeds To

**Workflow:** Content Distillery Pipeline (content-distillery/full-distillery-pipeline)

**Next Task in Sequence:**
- **Task 5:** multiply-ideas - Uses: executive-summary.md, intermediate-packets.yaml, frameworks (from Task 3)

### Depends On

- **Task 1:** ingest-youtube - Provides: transcript.md, metadata.yaml (REQUIRED)
- **Task 2:** extract-tacit-knowledge - Provides: tacit-knowledge.yaml (RECOMMENDED)
- **Task 3:** identify-frameworks - Provides: frameworks.yaml, heuristics.yaml (RECOMMENDED)

### Agent Routing

**Primary Agent:** knowledge-architect (Tiago Forte methodology specialist)
**Quality Review:** distillery-chief (validates compression ratios and synthesis quality)

---

## Quality Threshold

**Pass/Fail Gate:** Checklist score >= 12/15

If < 12/15:
1. If compression ratios off: recalculate and adjust selection
2. If Layer 5 is just compression: rewrite with external connections
3. If packets not self-contained: add context to each packet
4. If PARA not useful: re-classify with user context
5. Re-validate

**Common Failure Reasons:**
- Layer 2 too aggressive (< 15%) - missing important content
- Layer 2 too generous (> 35%) - not being selective enough
- Layer 4 is generic ("expert shares great insights") instead of specific
- Layer 5 is just a shorter Layer 4 (no synthesis or remix)
- Intermediate packets are fragments, not self-contained atoms
- PARA classification done mechanically without considering user context

---

## Related Tasks

- **Task 1:** ingest-youtube (provides raw material)
- **Task 2:** extract-tacit-knowledge (enriches Layer 2/3 selection)
- **Task 3:** identify-frameworks (enriches Layer 2/3/4 content)
- **Task 5:** multiply-ideas (consumes executive summary and packets)
- **Task 6:** distill-single-live (orchestrates this as step 4)

---

## Notes for Executor

### The Layer 5 Remix is NOT Optional

Layer 5 is the hardest layer and the most tempting to skip. It requires genuine synthesis:
- Combining the expert's ideas with other knowledge
- Finding connections the expert didn't make
- Extending the logic to new domains
- Creating original metaphors or framings

If you find yourself just compressing Layer 4, STOP. Ask: "What would I tell a friend about this that the expert DIDN'T say?"

### Intermediate Packets are the Real Product

Layers 1-5 are the process. Intermediate packets are the product. A great distillation produces 10-15 packets that are each worth a newsletter, a social post, or a course module. If your packets feel like "notes from a talk," they're not self-contained enough. Each packet should be publishable on its own.

### When Source Content is Very Long (3+ hours)

- Layer 1 stays complete (it's the reference)
- Layer 2 may need to be more aggressive (15-20% instead of 20-30%)
- Layer 4 stays at 500-1000 words (the discipline increases with length)
- Layer 5 stays at 200-400 words
- Increase intermediate packet count proportionally (15-25 packets)

### When Source Content Overlaps with Previous Distillations

- Cross-reference with prior distillation intermediate packets
- Do NOT duplicate packets that already exist
- Instead, create "connection packets" that link new insights to existing ones
- Update PARA classification to reflect the growing knowledge base

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

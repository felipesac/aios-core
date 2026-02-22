# Task: Produce Batch

**Task ID:** content-distillery/produce-batch
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Production Workflow
**Total Lines:** 400+

---

## Executive Summary

This is an atomic task that executes batch production of all content pieces from the distribution plan, transforming draft pieces into publish-ready final copy. Each piece gets platform-specific template application, final copywriting pass, hooks, CTAs, hashtags, and format compliance checking — then passes through a quality review checklist before being marked "ready to publish."

**Workflow Position:** Post-ecosystem-design, final pre-publish step (the production line)
**Success Definition:** 100% of scheduled pieces are publish-ready with quality scores >= 4/6
**Output Quality Gate:** Every piece must pass the 6-point Production QA checklist

---

## Purpose

Bridge the gap between "content piece exists" and "content piece is publishable." Draft content from atomization is 70-80% ready; this task handles the final 20-30% that determines whether a piece performs or falls flat. This includes writing hooks that stop the scroll, CTAs that drive action, hashtags that improve discoverability, and formatting that matches each platform's expectations exactly.

This task converts content inventory into revenue-generating assets by making every piece publish-ready.

---

## Executor Type

**Agent (production-ops)**

- **Agent Role:** Template application, final copywriting, formatting, QA scoring, report generation
- **Human Role:** Spot-check voice/tone accuracy on 10-20% of pieces; approve any controversial content
- **Autonomy Level:** 90% Agent / 10% Human (human does quality spot-checks)

---

## Inputs

### Required Inputs

```yaml
distribution_plan:
  field: "Distribution plan from design-ecosystem task"
  format: "YAML file with calendar and piece scheduling"
  required: true
  example: |
    distribution_plan:
      calendar_span:
        start: "2026-02-13"
        end: "2026-03-12"
      total_pieces: 76
  validation: "Must include calendar with piece IDs and platform assignments"

content_pieces:
  field: "All atomized content pieces"
  format: "Directory with platform-organized draft pieces"
  required: true
  example: |
    {slug}/content-pieces/
    ├── linkedin/piece-001-*.md
    ├── twitter-x/piece-001-*.md
    ├── instagram/piece-001-*.md
    ├── youtube-shorts/piece-001-*.md
    └── newsletter/piece-001-*.md
  validation: "All pieces referenced in distribution plan must exist as files"

content_calendar:
  field: "Day-by-day publishing calendar"
  format: "YAML from design-ecosystem"
  required: true
  example: |
    calendar:
      - date: "2026-02-13"
        posts:
          - platform: linkedin
            piece_id: "piece_li_001"
            time: "08:00"
  validation: "Calendar entries must reference existing piece IDs"
```

### Optional Inputs

```yaml
brand_voice_guide:
  field: "Detailed voice and tone guidelines"
  format: "Markdown or YAML"
  example: |
    voice:
      personality: "Confident expert who's also your friend"
      sentence_length: "Mix short punchy + medium explanatory"
      forbidden_words: ["hustle", "grind", "guru", "passive income"]
      signature_phrases: ["Here's the thing:", "The data is clear:"]
      emoji_policy: "LinkedIn: minimal; Instagram: moderate; Twitter: none"
  default: "Match source speaker's natural communication style"

platform_templates:
  field: "Pre-built templates for each platform format"
  format: "Markdown template files"
  example: "templates/linkedin-opinion-post.md"
  default: "Use built-in templates from Step 2"

hashtag_research:
  field: "Pre-researched hashtag sets by topic"
  format: "YAML"
  example: |
    hashtags:
      content_strategy:
        high_volume: ["#ContentMarketing", "#ContentStrategy"]
        niche: ["#CreatorEconomy", "#ContentLeverage"]
        branded: ["#BarbellStrategy"]
  default: "Agent generates based on piece content and industry standards"

previous_performance:
  field: "Analytics from previously published content"
  format: "YAML"
  example: |
    top_hooks:
      - text: "Stop making 10-minute videos."
        impressions: 12000
      - text: "Nobody tells you this about content:"
        impressions: 8000
  default: null
```

---

## Preconditions

Before starting this task:

- [ ] Ecosystem design complete (distribution plan and calendar exist)
- [ ] All content pieces exist as draft files
- [ ] Platform posting constraints defined
- [ ] Brand voice guidelines available (or default to source speaker style)
- [ ] No critical calendar conflicts remaining

---

## Steps

### Step 1: Load Production Queue (5 min)

**Agent Activity:**
- Load distribution plan and content calendar
- Load all draft content pieces
- Create production queue ordered by calendar date (earliest first):
  ```yaml
  production_queue:
    - piece_id: "piece_li_001"
      platform: "linkedin"
      format: "long-form post"
      publish_date: "2026-02-13"
      publish_time: "08:00"
      priority: "high"
      status: "draft"
    - piece_id: "piece_tw_thread_001"
      platform: "twitter_x"
      format: "thread"
      publish_date: "2026-02-13"
      publish_time: "09:00"
      priority: "high"
      status: "draft"
  ```
- Calculate batch size and estimated production time
- Identify "priority batch" (first 7 days of calendar = must-produce-first)

**Error Handling:**
- If piece referenced in calendar doesn't exist: flag as "missing," skip, log error
- If calendar has duplicate piece IDs: flag, deduplicate, continue
- If queue is empty: ABORT, report "no production needed"

**Checkpoint:** Production queue created; priority batch identified; missing pieces logged

---

### Step 2: Apply Platform Templates (15 min)

**Agent Activity:**
- For EACH piece in production queue, apply the appropriate platform template:

  **LinkedIn Template:**
  ```
  {HOOK — First line, pattern interrupt or bold claim}

  {BODY — 3-5 short paragraphs, storytelling or framework}

  {INSIGHT — The key takeaway, clearly stated}

  {CTA — Question, invitation to comment, or "Follow for more"}

  {HASHTAGS — 3-5 relevant hashtags}

  ---
  Source: {speaker attribution}
  ```

  **Twitter/X Thread Template:**
  ```
  Tweet 1 (Hook): {Bold claim or curiosity gap}

  Tweet 2: {Context or story opening}

  Tweet 3-6: {Core insights, 1 per tweet}

  Tweet 7: {Summary or contrarian twist}

  Tweet 8 (CTA): {Follow, RT, or reply prompt}
  ```

  **Instagram Carousel Template:**
  ```
  Slide 1: {HOOK — Bold text, question, or provocative statement}
  Slide 2: {CONTEXT — "Here's what I mean..."}
  Slide 3-8: {CONTENT — 1 point per slide, < 30 words each}
  Slide 9: {SUMMARY — Key takeaway}
  Slide 10: {CTA — "Save this | Share with a friend | Follow @handle"}

  Caption: {400-800 word storytelling caption with line breaks}
  Hashtags: {20-30 relevant hashtags in first comment}
  ```

  **YouTube Shorts Script Template:**
  ```
  [0-3s HOOK]: "{Pattern interrupt or bold opening}"
  [3-30s CONTENT]: "{Core explanation, conversational, one idea}"
  [30-45s EXAMPLE]: "{Concrete example or proof}"
  [45-60s PAYOFF]: "{Takeaway + subscribe CTA}"

  Title: {< 60 chars, keyword-rich}
  Description: {100-200 chars with keywords}
  Tags: {10-15 relevant tags}
  ```

  **Newsletter Snippet Template:**
  ```
  Subject Line: {Curiosity gap, benefit, or question}
  Preview Text: {First 90 chars that appear in inbox}

  {OPENING — Personal or story-based hook}
  {INSIGHT — Core framework or lesson}
  {APPLICATION — How to apply this}
  {CTA — Reply, click link, or forward to friend}
  ```

- Ensure all template fields are fully populated (no placeholders remaining)

**Error Handling:**
- If piece doesn't fit template cleanly: adapt template to content, not reverse
- If piece is too long for platform: trim from bottom up (weakest points first)
- If piece is too short: add context sentence or expand example

**Checkpoint:** All pieces have templates applied; no empty placeholders

---

### Step 3: Write Final Copy (20 min)

**Agent Activity:**
- For EACH templated piece, execute final copywriting pass:

  **Hook Writing (determines 80% of performance):**
  - Generate 3 hook variations per piece:
    1. Curiosity gap: "Most creators make this mistake with 10-min videos..."
    2. Bold claim: "10-minute videos are dead. Here's what works instead."
    3. Personal story: "I spent 6 months making 10-minute videos. Views: 47."
  - Select strongest hook based on:
    - Scroll-stop power (would YOU stop scrolling?)
    - Platform fit (LinkedIn = professional, Twitter = punchy, Instagram = visual)
    - Alignment with content (hook promises what content delivers)

  **CTA Writing (matched to content map category):**
  - Roads (how-to): "Try this today and tell me what happens"
  - Obstacles (warnings): "What's the biggest mistake YOU'VE made?"
  - Attractions (teachings): "Save this for when you need it"
  - Legends (skills): "Which of these skills are you working on?"
  - Landscapes (mindset): "Agree or disagree? Drop your take below"

  **Hashtag Selection:**
  - LinkedIn: 3-5 hashtags (mix of broad + niche)
  - Twitter/X: 1-2 hashtags maximum (or none)
  - Instagram: 20-30 hashtags (mix volume levels)
  - YouTube: 10-15 tags (keyword-rich)
  - Always include: topic tag, format tag, branded tag (if exists)

  **Format Compliance:**
  - Character limits respected
  - Line breaks match platform norms
  - Emoji usage matches brand voice guide
  - Attribution present where appropriate

**Error Handling:**
- If all 3 hooks feel weak: try 2 more variations; if still weak, flag for human review
- If CTA feels forced: simplify to "What do you think?" (universal fallback)
- If hashtag research unavailable: use industry standard hashtags for topic

**Checkpoint:** All pieces have final copy with hooks, CTAs, hashtags, proper formatting

---

### Step 4: Quality Review Checklist (10 min)

**Agent Activity:**
- Run EVERY piece through Production QA Checklist:

  | # | Check | Pass Criteria |
  |---|-------|---------------|
  | 1 | **Standalone Value** | Makes complete sense without any other context |
  | 2 | **Source Attribution** | Original speaker/source credited where appropriate |
  | 3 | **CTA Present** | Clear next action for reader/viewer |
  | 4 | **Format Compliance** | Meets platform character limits and formatting rules |
  | 5 | **Hook Quality** | Opening line would stop scrolling (intentional, not accidental) |
  | 6 | **Brand Voice** | Tone matches guidelines or source speaker's natural voice |

  **Scoring:**
  - 6/6: "Ready to publish" — move to ready/ folder
  - 5/6: "Minor revision" — fix specific issue, re-check
  - 4/6: "Needs rewrite" — return to Step 3 for that piece
  - < 4/6: "Discard or restructure" — piece may not be salvageable

- Track quality distribution across all pieces
- Flag patterns (e.g., "Instagram pieces consistently fail hook quality")

**Error Handling:**
- If > 20% of pieces fail QA: review template application, may be systemic issue
- If specific platform consistently fails: adjust platform template and re-run
- If brand voice failures: re-read voice guide, adjust tone globally

**Checkpoint:** All pieces scored; passing pieces moved to ready/; failing pieces logged

---

### Step 5: Organize in Publish-Ready Structure (5 min)

**Agent Activity:**
- Create production output directory:
  ```
  {slug}/production/
  ├── ready/
  │   ├── 2026-02-13/
  │   │   ├── linkedin-08h00-piece-li-001.md
  │   │   ├── twitter-09h00-piece-tw-thread-001.md
  │   │   └── newsletter-07h00-piece-nl-001.md
  │   ├── 2026-02-14/
  │   │   ├── linkedin-08h00-piece-li-002.md
  │   │   └── instagram-11h00-piece-ig-001.md
  │   └── ...
  ├── needs-revision/
  │   └── piece-ig-003-hook-weak.md
  ├── discarded/
  │   └── piece-tw-012-not-standalone.md
  └── report.yaml
  ```

- File naming convention: `{platform}-{time}-{piece-id}.md`
- Each file includes metadata header:
  ```yaml
  ---
  piece_id: "piece_li_001"
  platform: "linkedin"
  publish_date: "2026-02-13"
  publish_time: "08:00"
  format: "long-form post"
  content_map: "road"
  qa_score: 6
  status: "ready"
  source: "Alex Hormozi - Content Leverage Live"
  ---
  ```

**Error Handling:**
- If directory creation fails: use flat structure with platform prefix
- If date folder has 0 ready pieces: flag day as "gap in calendar"

**Checkpoint:** All files organized; every ready file has metadata header

---

### Step 6: Generate Production Report (5 min)

**Agent Activity:**
- Generate comprehensive production report:
  ```yaml
  production_report:
    timestamp: "2026-02-12T16:00:00Z"
    source: "Alex Hormozi - Content Leverage Live"

    summary:
      total_in_queue: 76
      pieces_produced: 72
      pieces_ready: 64
      pieces_needs_revision: 6
      pieces_discarded: 2
      pieces_missing: 4
      production_rate: "94.7%"
      quality_rate: "88.9%"

    quality_distribution:
      score_6_of_6: 48
      score_5_of_6: 16
      score_4_of_6: 6
      score_below_4: 2

    by_platform:
      linkedin:
        total: 22
        ready: 20
        avg_qa_score: 5.6
        common_issues: ["hook variety could improve"]
      twitter_x:
        total: 28
        ready: 26
        avg_qa_score: 5.8
        common_issues: []
      instagram:
        total: 18
        ready: 14
        avg_qa_score: 5.2
        common_issues: ["carousel text too long on 3 slides"]
      youtube_shorts:
        total: 5
        ready: 5
        avg_qa_score: 5.4
        common_issues: ["hook could be punchier"]
      newsletter:
        total: 4
        ready: 4
        avg_qa_score: 5.9
        common_issues: []

    calendar_coverage:
      days_with_content: 26
      days_with_gaps: 2
      gap_dates: ["2026-02-28", "2026-03-05"]

    revision_queue:
      - piece_id: "piece_ig_003"
        issue: "Hook doesn't stop scroll"
        suggested_fix: "Replace with contrarian opening"
      - piece_id: "piece_li_015"
        issue: "CTA feels generic"
        suggested_fix: "Add specific question related to content"
  ```

**Error Handling:**
- If report generation fails: save raw piece statuses as fallback
- If metrics don't add up: recount from file system, correct report

**Checkpoint:** Report generated; all metrics validated; revision queue documented

---

## Outputs

### Primary Outputs

**1. Publish-Ready Content Files**

Format: Markdown with YAML frontmatter
Location: `{slug}/production/ready/{date}/`
Content: Fully formatted, QA-passed content pieces organized by publish date

**2. Production Report**

Format: YAML
Location: `{slug}/production/report.yaml`
Content: Complete production metrics, quality scores, revision queue

### Secondary Outputs

1. **Revision Queue**
   - Format: Embedded in report.yaml
   - Content: Pieces needing human attention with specific issues and suggested fixes

2. **Discarded Pieces Log**
   - Format: Files in `{slug}/production/discarded/`
   - Content: Pieces that failed QA with reasons

3. **Calendar Gap Report**
   - Format: Embedded in report.yaml
   - Content: Dates with no ready content (needs attention)

---

## Validation

### Checklist

- [ ] All calendar-scheduled pieces have been processed (none skipped without reason)
- [ ] Every ready piece passes 6-point QA checklist (score >= 4/6)
- [ ] Every ready piece has YAML frontmatter with metadata
- [ ] Files organized by publish date in ready/ directory
- [ ] Production report generated with accurate metrics
- [ ] Revision queue includes specific issues and suggested fixes for each flagged piece
- [ ] Calendar gap report identifies any unserved dates
- [ ] No placeholder text remaining in any ready piece
- [ ] All pieces respect platform character limits
- [ ] Source attribution present on every piece
- [ ] Production rate >= 85% (ready pieces / total in queue)

### Success Criteria

**Threshold: 9/11 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Production rate** | 95%+ pieces ready | 85-94% pieces ready | < 85% ready |
| **Quality consistency** | 90%+ score 5-6/6 | 80-89% score 5-6/6 | < 80% score 5-6/6 |
| **Hook variety** | 3+ unique hook styles across batch | 2 hook styles | All hooks same pattern |
| **CTA diversity** | CTAs match content map categories | CTAs vary but not systematically | Same CTA everywhere |
| **Format compliance** | Every piece pixel-perfect for platform | Minor issues on < 10% | Widespread problems |
| **Report accuracy** | All metrics verifiable from file system | Minor discrepancies | Report doesn't match files |

---

## Estimated Effort

| Role | Effort | Notes |
|------|--------|-------|
| **Agent (production-ops)** | 50-70 min | Template application, copywriting, QA, reporting |
| **Human** | 10-15 min | Spot-check 10-20% of pieces, approve controversial content |
| **Total Duration** | 60-85 min | Scales linearly with piece count (~1 min/piece) |

---

## Integration

### Feeds To

**Downstream:**
- Publishing tools (Buffer, Hootsuite, etc.) — ready files as direct input
- `optimize-youtube` — YouTube-ready pieces may undergo additional optimization
- Analytics tracking — report provides baseline for performance measurement

### Depends On

- `design-ecosystem` — Provides distribution plan and calendar
- `atomize-content` — Provides draft content pieces
- Brand voice guidelines (optional)

### Agent Routing

**Primary Agent:** production-ops (Justin Welsh methodology)
**Supporting Agents:** content-atomizer (handles re-atomization if needed during production)

**Handoff:** Ready files are immediately publishable; revision queue returns to human or agent

---

## Quality Threshold

**Pass/Fail Gate:** Production rate >= 85% AND quality rate >= 80%

If failing:
1. If production rate < 85%: identify blocked pieces, resolve issues
2. If quality rate < 80%: review QA failures for patterns, adjust templates
3. Re-run Steps 3-4 for failing pieces only
4. If systemic failure: revisit atomization quality

**Common Failure Reasons:**
- Draft pieces were too rough (atomization didn't get them to 70%)
- Platform templates don't match current best practices
- Brand voice guide is contradictory or unclear
- Too many pieces scheduled (rushing degrades quality)
- Hooks all follow same pattern (fatigue)

---

## Error Handling

### Input Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| Missing distribution plan | File not found | HALT, report "design-ecosystem task not completed" |
| Missing content pieces | Files not found for piece IDs | Skip missing, log in report, continue with available |
| Empty calendar | No entries | HALT, report "no production needed" |
| Stale calendar | Dates in the past | Skip past dates, start from today |

### Processing Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| Template mismatch | Piece format vs template conflict | Use closest template, flag for review |
| Character limit exceeded | Post-template validation | Trim weakest content, re-validate |
| Hook generation failure | All hooks score < 2 | Flag for human to write hook |
| Batch timeout | Processing exceeds 2 hours | Save progress, resume from last checkpoint |

---

## Notes for Executor

### If Batch Is Large (70+ pieces)

- Process in priority order (first 7 days of calendar first)
- Use batch QA (group similar format pieces together)
- Flag systemic issues early (don't wait until piece 70 to notice pattern)
- Consider splitting into 2 production sessions

### If Brand Voice Guide Is Missing

- Default to source speaker's natural communication style
- Match formality to platform (LinkedIn = professional, Twitter = casual)
- When in doubt, be direct and clear over clever and witty
- Flag all pieces as "voice unverified" in report

### If High-Controversy Content Detected

- Isolate controversial pieces for human review
- Include "alternative version" (softened take) alongside original
- Mark in metadata: `controversy_level: high`
- Never auto-publish controversy-flagged pieces

### If Calendar Gaps Persist After Production

- Create "evergreen engagement" fillers (polls, questions, throwbacks)
- Repurpose highest-QA-scoring pieces with new hooks
- Schedule "audience question" posts (zero production cost)
- Mark gap-filler pieces as `type: filler` in metadata

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

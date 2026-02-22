# Task: Design Ecosystem

**Task ID:** content-distillery/design-ecosystem
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Distribution Workflow
**Total Lines:** 420+

---

## Executive Summary

This is an atomic task that designs the complete content distribution ecosystem for all derived content pieces. It maps every piece to Dan Koe's Content Map categories, sequences distribution across platforms over 2-4 weeks, and creates a publishing calendar that maximizes reach, engagement, and audience journey progression from a single source live or pillar content.

**Workflow Position:** Post-atomization, pre-production (the strategic bridge between content creation and publishing)
**Success Definition:** Complete 2-4 week content calendar with daily publishing schedule across all platforms
**Output Quality Gate:** Calendar must cover 14+ days, use 3+ platforms, and schedule 80%+ of atomized pieces

---

## Purpose

Atomized content without a distribution strategy is inventory without a store. This task transforms a collection of content pieces into a sequenced, strategic publishing plan that considers platform algorithms, audience behavior, content themes, and cross-platform synergies. It ensures every piece is published at the right time, on the right platform, in the right sequence to maximize compounding reach.

This task turns content chaos into content orchestration, increasing total reach 3-5x compared to ad-hoc publishing.

---

## Executor Type

**Agent (ecosystem-designer)**

- **Agent Role:** Content mapping, sequence design, calendar generation, cross-platform planning
- **Human Role:** Approve calendar timing, validate theme sequencing, override platform priorities
- **Autonomy Level:** 80% Agent / 20% Human (human approves calendar, agent designs structure)

---

## Inputs

### Required Inputs

```yaml
content_pieces:
  field: "All atomized content pieces from atomize-content task"
  format: "Directory with platform-organized pieces + manifest.yaml"
  required: true
  example: |
    {slug}/content-pieces/
    ├── linkedin/
    ├── twitter-x/
    ├── instagram/
    ├── youtube-shorts/
    ├── newsletter/
    └── manifest.yaml
  validation: "manifest.yaml must exist with total piece count >= 30"

atomization_manifest:
  field: "Manifest from atomization task"
  format: "YAML with piece inventory and metadata"
  required: true
  example: |
    atomization:
      total_pieces: 64
      pieces_by_platform:
        linkedin: 17
        twitter_x: 24
  validation: "Must include piece count per platform and per pyramid level"

source_metadata:
  field: "Original source information"
  format: "YAML"
  required: true
  example: |
    source:
      title: "Alex Hormozi on Content Leverage"
      speaker: "Alex Hormozi"
      date: "2024-03-15"
      core_theme: "Content leverage and distribution"
  validation: "Must include core theme for content map categorization"

platform_strategy:
  field: "Platform-specific posting rules and priorities"
  format: "YAML"
  required: true
  example: |
    platforms:
      linkedin:
        max_posts_per_day: 1
        best_times: ["08:00", "12:00", "17:30"]
        priority: high
      twitter_x:
        max_posts_per_day: 3
        best_times: ["09:00", "13:00", "18:00"]
        priority: high
      instagram:
        max_posts_per_day: 2
        best_times: ["11:00", "19:00"]
        priority: medium
      youtube_shorts:
        max_posts_per_day: 1
        best_times: ["14:00"]
        priority: medium
      newsletter:
        frequency: "weekly"
        send_day: "tuesday"
        send_time: "07:00"
        priority: high
  validation: "At least 2 platforms with posting rules defined"
```

### Optional Inputs

```yaml
existing_calendar:
  field: "Pre-existing content calendar with committed slots"
  format: "YAML"
  example: |
    committed_posts:
      - date: "2026-02-14"
        platform: "linkedin"
        topic: "Valentine's Day special"
  default: null

audience_analytics:
  field: "Platform analytics showing engagement patterns"
  format: "YAML"
  example: |
    analytics:
      linkedin:
        best_performing_format: "storytelling"
        avg_engagement_rate: 0.045
        peak_days: ["tuesday", "wednesday", "thursday"]
  default: "Use industry averages"

content_pillars:
  field: "Pre-defined content pillar categories for brand consistency"
  format: "YAML list"
  example: |
    pillars:
      - "content-strategy"
      - "audience-building"
      - "monetization"
      - "creator-mindset"
  default: "Derive from source content themes"
```

---

## Preconditions

Before starting this task:

- [ ] Content atomization complete (atomize-content task output exists)
- [ ] Manifest YAML exists with at least 30 content pieces
- [ ] Platform strategy defined (posting rules for each platform)
- [ ] Source metadata available with core theme
- [ ] Calendar conflicts identified (or confirmed no conflicts)

---

## Steps

### Step 1: Load and Inventory All Content Pieces (5 min)

**Agent Activity:**
- Load manifest.yaml and all content piece files
- Create enriched inventory with:
  - Estimated engagement potential (high/medium/low) per piece
  - Theme classification per piece
  - Dependencies between pieces (threads, series, callbacks)
- Identify "hero pieces" (top 5-10 highest-potential pieces)
- Identify "filler pieces" (lower effort, steady engagement)

**Error Handling:**
- If manifest missing: reconstruct from directory scan, log warning
- If piece files missing from manifest: update manifest, continue
- If platform directory empty: exclude platform from calendar

**Checkpoint:** Enriched inventory complete; hero and filler pieces identified

---

### Step 2: Categorize Using Dan Koe's Content Map (10 min)

**Agent Activity:**
- Classify EVERY content piece into one of 5 categories:

  **Roads (How-to Advice) — "Do this, then this"**
  - Step-by-step instructions, tutorials, processes
  - Tactical content that solves specific problems
  - Example: "How to implement the Barbell Content Strategy in 3 steps"
  - Best platforms: LinkedIn, YouTube, Newsletter

  **Obstacles (Traps to Avoid) — "Don't make this mistake"**
  - Warnings, common pitfalls, myth-busting
  - Content that prevents pain through awareness
  - Example: "The #1 reason your 10-minute videos get zero views"
  - Best platforms: Twitter/X, Instagram, YouTube Shorts

  **Attractions (Fundamental Teachings) — "Here's the truth"**
  - Core principles, mental models, paradigm shifts
  - Deep educational content that changes how people think
  - Example: "Why the Barbell Strategy works (the math behind it)"
  - Best platforms: Newsletter, LinkedIn, Long-form

  **Legends (Skills to Learn) — "Master this"**
  - Skill-building content, practice frameworks, expertise paths
  - Content that positions the creator as a teacher
  - Example: "The 3 skills every content creator needs to 10x output"
  - Best platforms: LinkedIn, YouTube, Instagram carousels

  **Landscapes (Mindset Content) — "Think about it this way"**
  - Perspective shifts, philosophical takes, identity content
  - Content that changes who the reader IS, not just what they DO
  - Example: "You're not a creator. You're a media company of one."
  - Best platforms: Twitter/X, Instagram, LinkedIn

- Generate content map distribution:
  ```yaml
  content_map:
    roads: 12
    obstacles: 10
    attractions: 15
    legends: 8
    landscapes: 19
    total: 64
  ```

- Flag imbalances: if any category < 10% of total, suggest creating more pieces in that category

**Error Handling:**
- If piece doesn't fit any category: classify as "attractions" (safe default)
- If one category dominates (> 40%): re-examine if some could be reclassified
- If content map is heavily skewed: flag as "unbalanced content diet" in report

**Checkpoint:** Every piece categorized; content map distribution calculated; imbalances flagged

---

### Step 3: Design Distribution Sequence (15 min)

**Agent Activity:**
- Apply the Content Cascade pattern (pillar then derivatives over time):

  **Day 0 — Pillar Launch:**
  - Newsletter: Full pillar article (subscribers get exclusive first access)
  - LinkedIn: Long-form post (executive summary angle)
  - Twitter/X: Announcement thread (5-8 tweets)

  **Day 1 — High-Impact Derivatives:**
  - LinkedIn: Storytelling post (personal angle on key framework)
  - Twitter/X: Standalone insights (3 tweets throughout day)
  - Instagram: First carousel (most visual framework)

  **Day 2 — Visual + Short-Form:**
  - Instagram: Second carousel + story sequence
  - YouTube Short: First short (strongest hook)
  - Twitter/X: Quote tweet + contrarian take

  **Day 3 — Engagement Layer:**
  - LinkedIn: Question/poll post (audience engagement)
  - Twitter/X: Thread expanding most-engaged Day 1 tweet
  - Instagram: Quote graphic + engagement story

  **Days 4-6 — Recycled Variations:**
  - Remix best-performing pieces with different angles
  - Respond to engagement with follow-up content
  - Cross-reference earlier pieces

  **Days 7-13 — Long Tail:**
  - 1-2 pieces per day across platforms
  - Focus on less-covered frameworks
  - "Deep dive" series on individual topics

  **Days 14-28 — Evergreen Recycle:**
  - Re-share top performers with fresh context
  - Combine insights for "roundup" posts
  - Bridge to next pillar content

- Sequence rules:
  1. Never publish same framework on same platform within 48 hours
  2. Alternate content map categories daily (no 3 "roads" in a row)
  3. Start each platform day with highest-engagement piece
  4. Newsletter always goes first (subscriber exclusivity)
  5. Hero pieces spaced evenly across calendar (no front-loading)

**Error Handling:**
- If calendar has blackout dates: skip those dates, redistribute pieces
- If existing calendar has committed slots: work around them
- If pieces run out before 14 days: recycle top performers or extend creation

**Checkpoint:** Full distribution sequence designed for 14-28 days

---

### Step 4: Build Content Calendar (10 min)

**Agent Activity:**
- Convert distribution sequence into daily calendar entries:
  ```yaml
  calendar:
    - date: "2026-02-13"
      day_of_week: "thursday"
      theme: "Content Leverage Launch"
      posts:
        - platform: newsletter
          time: "07:00"
          piece_id: "piece_pillar_001"
          format: "full article"
          content_map: "attraction"
          status: "scheduled"
        - platform: linkedin
          time: "08:00"
          piece_id: "piece_li_001"
          format: "long-form post"
          content_map: "road"
          status: "scheduled"
        - platform: twitter_x
          time: "09:00"
          piece_id: "piece_tw_thread_001"
          format: "thread"
          content_map: "attraction"
          status: "scheduled"
  ```

- Calculate calendar metrics:
  ```yaml
  calendar_metrics:
    total_days: 28
    total_posts: 87
    posts_per_day_avg: 3.1
    platform_coverage:
      linkedin: "22 posts (79% of available)"
      twitter_x: "28 posts (100%)"
      instagram: "18 posts (90%)"
      youtube_shorts: "5 posts (100%)"
      newsletter: "4 posts (100%)"
    content_map_balance:
      roads: "18%"
      obstacles: "16%"
      attractions: "24%"
      legends: "12%"
      landscapes: "30%"
    hero_piece_spacing: "every 3-4 days"
  ```

**Error Handling:**
- If calendar exceeds max posts/day for any platform: move overflow to next available slot
- If platform coverage < 70%: warn "under-utilizing {platform}"
- If content map category absent for 3+ consecutive days: rebalance schedule

**Checkpoint:** Complete calendar generated with daily entries and metrics

---

### Step 5: Identify Repurposing Opportunities (8 min)

**Agent Activity:**
- Scan calendar for additional repurposing:

  **Cross-Platform Repurposing:**
  - High-performing LinkedIn post as Twitter thread (different framing)
  - Instagram carousel as LinkedIn document post
  - YouTube Short as Instagram Reel (same video, different description)
  - Twitter thread expanded into newsletter section

  **Temporal Repurposing:**
  - Week 1 hero piece as Week 3 "throwback" with new angle
  - Evergreen frameworks on monthly recycle rotation
  - Seasonal angles for calendar awareness posts

  **Format Repurposing:**
  - Text post as audio snippet (podcast teaser)
  - Carousel as infographic (single-image summary)
  - Thread as blog post (expanded, SEO-optimized)

- Add repurposed pieces to calendar as "bonus" entries
- Track repurposing chains (which pieces derive from which)

**Error Handling:**
- If repurposing creates too many posts/day: mark as "optional overflow"
- If repurposed piece too similar to original: increase angle differentiation or skip

**Checkpoint:** Repurposing opportunities mapped; bonus entries added to calendar

---

### Step 6: Generate Final Outputs (5 min)

**Agent Activity:**
- Save all output files:
  ```
  {slug}/
  ├── distribution-plan.yaml
  ├── content-calendar.yaml
  ├── content-map.yaml
  └── repurposing-chains.yaml
  ```

- Generate executive summary (embedded in distribution plan):
  ```markdown
  ## Distribution Plan Summary

  **Source:** Alex Hormozi - Content Leverage Live (2h15m)
  **Calendar Span:** Feb 13 - Mar 12 (28 days)
  **Total Pieces:** 64 original + 12 repurposed = 76
  **Platforms:** LinkedIn (22), Twitter (28), Instagram (18), YouTube (5), Newsletter (4)
  **Estimated Reach:** 15,000-45,000 impressions (based on platform averages)
  **Content Days per Hour of Source:** 12.4 days / hour of live
  ```

- Validate all output files are valid YAML

**Error Handling:**
- If YAML validation fails: fix formatting issues, retry
- If calendar has gaps (days with 0 posts): fill with evergreen or repurposed pieces

**Checkpoint:** All files saved; executive summary generated; YAML validated

---

## Outputs

### Primary Outputs

**1. Distribution Plan**

Format: YAML
Location: `{slug}/distribution-plan.yaml`

```yaml
distribution_plan:
  version: "1.0.0"
  source: "Alex Hormozi - Content Leverage Live"
  strategy: "Content Cascade + Dan Koe Content Map"
  calendar_span:
    start: "2026-02-13"
    end: "2026-03-12"
    total_days: 28
  total_pieces: 76
  content_map_distribution:
    roads: 14
    obstacles: 12
    attractions: 18
    legends: 10
    landscapes: 22
  sequence_rules:
    - "Newsletter first (subscriber exclusivity)"
    - "No same framework on same platform within 48h"
    - "Alternate content map categories daily"
    - "Hero pieces every 3-4 days"
```

**2. Content Calendar**

Format: YAML
Location: `{slug}/content-calendar.yaml`
Content: Day-by-day entries with platform, time, piece ID, format, content map category

### Secondary Outputs

1. **Content Map Classification**
   - Format: YAML
   - Location: `{slug}/content-map.yaml`
   - Content: Every piece categorized into roads/obstacles/attractions/legends/landscapes

2. **Repurposing Chains**
   - Format: YAML
   - Location: `{slug}/repurposing-chains.yaml`
   - Content: Derivation tracking, cross-platform mapping

3. **Executive Summary**
   - Format: Markdown (embedded in distribution-plan.yaml)
   - Content: Key metrics, estimated reach, content days per source hour

---

## Validation

### Checklist

- [ ] Calendar covers minimum 14 days (ideally 28)
- [ ] At least 3 platforms included with regular posting
- [ ] 80%+ of atomized pieces used in calendar
- [ ] Dan Koe Content Map categories all represented (no category at 0%)
- [ ] No platform exceeds its max_posts_per_day constraint
- [ ] Newsletter always published before derivative platform posts
- [ ] Hero pieces spaced evenly (not clustered in first 3 days)
- [ ] Content map categories rotate (no 3+ same category consecutive on same platform)
- [ ] All YAML outputs are valid and parseable
- [ ] Repurposing opportunities identified (at least 5)
- [ ] Calendar respects blackout dates and existing commitments

### Success Criteria

**Threshold: 9/11 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Calendar coverage** | 28+ days, all platforms daily | 14-27 days, most platforms daily | < 14 days or sporadic posting |
| **Piece utilization** | 90%+ pieces scheduled | 80-89% pieces scheduled | < 80% pieces scheduled |
| **Content map balance** | No category < 10% or > 35% | One category slightly out of range | Multiple categories missing or dominant |
| **Sequence intelligence** | Clear theme progression, hero spacing, category rotation | Generally sequenced but some clustering | Random piece order, no strategy |
| **Cross-platform synergy** | Pieces reference each other across platforms | Some cross-referencing | Platforms treated as independent silos |
| **Repurposing depth** | 10+ repurposing chains identified | 5-9 chains identified | < 5 or no repurposing planned |

---

## Estimated Effort

| Role | Effort | Notes |
|------|--------|-------|
| **Agent (ecosystem-designer)** | 40-55 min | Categorization, sequencing, calendar generation |
| **Human** | 10-15 min | Calendar approval, timing adjustments, priority overrides |
| **Total Duration** | 50-70 min | Agent designs, human validates and adjusts |

---

## Integration

### Feeds To

**Downstream Tasks:**
- `produce-batch` — Uses calendar to prioritize which pieces to finalize first
- `optimize-youtube` — Uses YouTube-scheduled pieces for optimization

### Depends On

- `atomize-content` — Provides all content pieces and manifest
- Source metadata: Core theme for content map categorization
- Platform strategy: Posting rules and constraints

### Agent Routing

**Primary Agent:** ecosystem-designer (Dan Koe methodology)
**Supporting Agents:** content-atomizer (provides manifest), production-ops (receives calendar)

**Handoff:** Calendar ready for production-ops to begin batch finalization

---

## Quality Threshold

**Pass/Fail Gate:** Calendar covers >= 14 days AND piece utilization >= 80%

If failing:
1. If calendar < 14 days: need more content pieces or reduce posting frequency
2. If utilization < 80%: review unscheduled pieces, find slots or create repurpose entries
3. Re-run Steps 3-4 with adjusted parameters

**Common Failure Reasons:**
- Too many pieces for available calendar slots (need longer timeframe)
- Platform constraints too restrictive (allow more posts/day)
- Content map imbalance (one type dominates, forcing category gaps)
- Blackout dates consuming too many slots

---

## Error Handling

### Input Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| No manifest found | Missing file | Reconstruct from directory, warn human |
| Manifest total < 30 | Count check | Proceed with fewer pieces, warn "thin calendar" |
| No platform strategy | Missing input | Use industry defaults, flag for human review |
| Empty platform directory | No files in dir | Exclude platform, adjust calendar |

### Processing Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| Calendar overflow | > max_posts_per_day | Move to next available slot |
| Content map skew | One category > 40% | Re-classify borderline pieces |
| Calendar gap | Day with 0 posts | Fill with evergreen or repurposed piece |
| Repurposing collision | Same content same day | Spread to different days |

---

## Notes for Executor

### If Calendar Span Is Short (< 14 days)

- Increase posting frequency slightly on high-priority platforms
- Use more repurposed variations to extend coverage
- Consider adding a platform to create more slots

### If Source Has Strong Narrative Arc

- Design calendar to follow the narrative (not random distribution)
- Day 1: Set up the problem
- Day 2-5: Explore frameworks
- Day 6-10: Deep dives
- Day 11-14: Synthesis and action steps
- This creates a "content series" effect that builds audience anticipation

### If Multiple Sources Are Being Distributed Simultaneously

- Interleave sources (don't do 5 days of Source A then 5 days of Source B)
- Use content map categories to create thematic coherence across sources
- Mark each piece with source ID for tracking

### If Audience Analytics Are Available

- Prioritize formats that historically perform best
- Schedule hero pieces on highest-engagement days
- Avoid posting on historically low-engagement days
- Adjust posting times to match audience activity patterns

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

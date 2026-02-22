# Task: Optimize YouTube

**Task ID:** content-distillery/optimize-youtube
**Version:** 2.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Updated:** 2026-02-12
**Category:** Platform Optimization Workflow
**Total Lines:** 800+

---

## Executive Summary

This is an atomic task that optimizes all derived content pieces tagged for YouTube (Shorts, long-form, clips) for maximum algorithm performance and audience engagement. It applies Paddy Galloway's CCN Rule (Core/Casual/New viewers), Clickbait Theory for ethical title optimization, Format-First Thinking for content structure, thumbnail design briefs, description/tag optimization, video structure planning, and publish timing strategy.

**Workflow Position:** Post-production, platform-specific optimization layer (Step 9 in distill-single-live pipeline)
**Success Definition:** Every YouTube piece has optimized title (5 variants with CTR scoring), thumbnail brief, structured script, metadata, and publish timing
**Output Quality Gate:** Each piece must satisfy all 3 CCN viewer types, have CTR-scored title variants, and follow Format-First structure

---

## Purpose

YouTube's algorithm rewards specific packaging patterns: titles that create curiosity gaps, thumbnails that generate clicks, descriptions that boost SEO, and video structures that maximize watch time. Generic content uploaded without YouTube-specific optimization loses 60-80% of its potential reach.

This task applies Paddy Galloway's research-backed strategies across 10 systematic steps to ensure every YouTube piece is packaged for maximum algorithmic and human engagement. It covers the complete optimization surface: from the CCN Rule (ensuring every viewer type is served) to Clickbait Theory (ethical curiosity engineering) to Format-First Thinking (choosing format before writing content).

This task is the difference between 500 views and 50,000 views on the same content.

---

## Executor Type

**Agent (youtube-strategist)**

- **Agent Role:** CCN analysis, title generation and CTR scoring, thumbnail briefs, description optimization, tag strategy, video structure planning, publish timing, clickbait theory application, format-first analysis
- **Human Role:** Final title selection, thumbnail approval, brand alignment check
- **Autonomy Level:** 75% Agent / 25% Human (YouTube is high-stakes; human picks final title and thumbnail)

---

## Inputs

### Required Inputs

```yaml
youtube_content_pieces:
  field: "Content pieces tagged for YouTube from atomization/production"
  format: "Markdown scripts with metadata"
  required: true
  example: |
    ---
    piece_id: "piece_yt_001"
    platform: "youtube_shorts"
    format: "short-form script"
    source: "Alex Hormozi - Content Leverage Live"
    framework: "Barbell Content Strategy"
    ---
    [HOOK - 3s] "Stop making 10-minute videos. Seriously."
    [CONTENT - 25s] "There's something called the Barbell Strategy..."
    [PAYOFF - 5s] "Pick a side. Your audience will thank you."
  validation: "Must include script with timing markers and source framework"

source_metadata:
  field: "Original source information"
  format: "YAML"
  required: true
  example: |
    source:
      speaker: "Alex Hormozi"
      topic: "Content Strategy"
      date: "2026-02-12"
      niche: "business/entrepreneurship"
  validation: "Must include speaker, topic, and niche for keyword targeting"

channel_context:
  field: "YouTube channel information for optimization context"
  format: "YAML"
  required: true
  example: |
    channel:
      name: "Creator Academy"
      subscribers: 15000
      niche: "content creation / entrepreneurship"
      avg_views: 2500
      top_performing_topics: ["content strategy", "YouTube growth", "monetization"]
      audience_age: "25-40"
      audience_location: "Brazil, USA"
  validation: "Must include niche, subscriber count, and top topics"
```

### Optional Inputs

```yaml
competitor_analysis:
  field: "Top-performing videos in niche for benchmarking"
  format: "YAML"
  example: |
    competitors:
      - title: "How I Grew to 1M Subs in 12 Months"
        views: 2500000
        channel: "Ali Abdaal"
        thumbnail_elements: ["face close-up", "bold text", "before/after"]
      - title: "The Content Strategy Nobody Talks About"
        views: 890000
        channel: "Dan Koe"
        thumbnail_elements: ["minimal", "one object", "high contrast"]
  default: null

previous_video_analytics:
  field: "Performance data from channel's previous uploads"
  format: "YAML"
  example: |
    analytics:
      avg_ctr: 0.048
      avg_retention_at_30s: 0.72
      best_title_patterns:
        - "How I..."
        - "The [Number] [Thing]..."
        - "Stop doing [Thing]"
      worst_title_patterns:
        - "My thoughts on..."
        - "[Topic] Explained"
  default: "Use niche averages"

keyword_research:
  field: "Pre-researched keywords for SEO"
  format: "YAML"
  example: |
    keywords:
      primary: "content strategy"
      secondary: ["content creation", "YouTube strategy", "content repurposing"]
      long_tail: ["how to repurpose content", "barbell content strategy"]
  default: "Agent generates based on topic and niche"

frameworks_catalog:
  field: "Frameworks extracted from the source for deeper optimization"
  format: "YAML"
  required: false
  example: "frameworks.yaml from identify-frameworks task"
  notes: "Enables framework-based title angles and content hooks"
```

---

## Preconditions

Before starting this task:

- [ ] YouTube-tagged content pieces exist (from atomize-content or produce-batch)
- [ ] Channel context available (subscriber count, niche, top topics)
- [ ] Source metadata available (speaker, topic)
- [ ] At least 1 YouTube piece to optimize (Shorts or long-form)

---

## Steps

### Step 1: Load Content, Frameworks, and Channel Context (5 min)

**Agent Activity:**
- Load all content pieces tagged for YouTube (Shorts and long-form)
- Load source frameworks catalog (if available) for framework-based optimization
- Load channel context and any competitor/analytics data
- Categorize pieces by format:
  ```yaml
  youtube_queue:
    shorts:
      - piece_yt_001: "Barbell Strategy Explained"
      - piece_yt_002: "Document Don't Create"
      - piece_yt_003: "The 3-Second Hook Test"
    long_form:
      - piece_yt_long_001: "Complete Content Leverage Framework"
    clips:
      - piece_yt_clip_001: "Best Moment - The Volume Myth"
    total: 5
  ```
- Load frameworks for framework-based title angles:
  ```yaml
  available_frameworks:
    - name: "Barbell Content Strategy"
      hook_potential: "high"
      title_angles: ["contrarian", "framework reveal"]
    - name: "Document Don't Create"
      hook_potential: "very high"
      title_angles: ["bold claim", "mindset shift"]
  ```
- Rank pieces by potential based on:
  1. Framework strength (novel > known)
  2. Topic relevance to channel niche
  3. Hook quality in source script
  4. Audience alignment score

**Error Handling:**
- If no YouTube pieces found: HALT, report "no YouTube content to optimize"
- If channel context missing: use niche defaults, flag for human to provide
- If previous analytics unavailable: use industry benchmarks
- If frameworks unavailable: proceed without framework-based angles

**Checkpoint:** YouTube queue created; channel context loaded; frameworks loaded; potential ranked

---

### Step 2: Apply CCN Rule to Each Piece (10 min)

**Agent Activity:**
- For EACH YouTube piece, evaluate against the CCN Rule (Core/Casual/New):

  **Core Viewers (Superfans who watch everything)**
  - Question: "Does this satisfy someone who has watched every video on this channel?"
  - What they need: Depth, nuance, advanced insight, continuity with previous content
  - Test: Would a subscriber feel this adds value beyond what they already know?
  - Scoring: 1-5 (1=boring repeat, 5=fresh angle on familiar topic)

  **Casual Viewers (Follow the channel but do not watch everything)**
  - Question: "Is this accessible to someone who watches 1 in 5 videos?"
  - What they need: Clear context, no assumed knowledge from other videos, compelling hook
  - Test: Can they understand and enjoy this without watching prerequisite content?
  - Scoring: 1-5 (1=requires prior context, 5=fully standalone)

  **New Viewers (Zero familiarity with channel)**
  - Question: "Can someone who has never seen this channel enjoy this?"
  - What they need: No inside references, universal appeal, immediate hook
  - Test: If this appeared in their YouTube recommended, would they click AND stay?
  - Scoring: 1-5 (1=insider-only, 5=universally compelling)

  **CCN Score Card:**
  ```yaml
  ccn_evaluation:
    piece_id: "piece_yt_001"
    core_score: 4
    core_notes: "Fresh angle on content strategy they already know about"
    casual_score: 5
    casual_notes: "Fully standalone, clear concept, no prerequisites"
    new_score: 4
    new_notes: "Universal topic, strong hook, slight niche terminology"
    composite_score: 4.3
    weakest_dimension: "new"
    recommendation: "Optimize title and hook for New viewers (weakest score)"
    improvement_actions:
      - "Replace 'Barbell Strategy' label with universally understood language in hook"
      - "Add 1-sentence context at start for zero-familiarity viewers"
  ```

- If any CCN dimension scores < 3: generate specific script edits to improve
- Priority optimization: always optimize for the WEAKEST dimension first

**Error Handling:**
- If Core score < 3: add depth element, advanced insight, or callback to previous content
- If Casual score < 3: add context sentence, remove assumed knowledge
- If New score < 3: simplify language, strengthen hook, remove jargon, universalize example

**Checkpoint:** Every piece has CCN score card; pieces scoring < 3 on any dimension flagged with specific improvement actions

---

### Step 3: Generate 5+ Title Options with CTR Scoring (15 min)

**Agent Activity:**
- For EACH piece, generate at least 5 title variations using different psychological triggers:

  **5 Title Variation Types:**

  1. **Curiosity Gap:** Promises a revelation
     - Pattern: "The [Thing] Nobody Tells You About [Topic]"
     - Example: "The Content Strategy Nobody Tells You About"
     - CTR driver: Information gap that demands closure

  2. **Bold Claim:** Makes a strong, debatable statement
     - Pattern: "[Thing] Is [Surprising Adjective]. Here's Why."
     - Example: "10-Minute Videos Are Dead. Here's What Works."
     - CTR driver: Provocation triggers "prove it" click

  3. **Number List:** Promises specific, scannable value
     - Pattern: "[Number] [Things] That [Result]"
     - Example: "3 Content Rules That Changed My Entire Strategy"
     - CTR driver: Specificity signals density of value

  4. **How-To:** Promises practical instruction
     - Pattern: "How to [Achieve Result] in [Timeframe]"
     - Example: "How to Get 64 Content Pieces From 1 Livestream"
     - CTR driver: Promise of transformation

  5. **Personal Story:** Promises narrative and relatability
     - Pattern: "I [Did Thing] for [Duration]. Here's What Happened."
     - Example: "I Stopped Making 10-Minute Videos. Views Tripled."
     - CTR driver: Narrative + specific result

- Score each title on 5 CTR dimensions:
  ```yaml
  title_scoring:
    title: "10-Minute Videos Are Dead. Here's What Works."
    scores:
      curiosity_gap: 4        # Does it create "I need to know" feeling?
      clarity: 5               # Is it immediately clear what the video is about?
      keyword_presence: 4      # Does it contain searchable terms?
      emotional_trigger: 4     # Does it provoke an emotion (curiosity, fear, desire)?
      specificity: 3           # Does it include specific numbers, names, or outcomes?
    ctr_estimate: "high"       # Based on pattern performance data
    character_count: 48        # Under 60 recommended for standard, 40 for Shorts
    composite_score: 4.0
    rank: 2
  ```

- Calculate composite CTR score:
  - `composite = (curiosity_gap * 0.30) + (clarity * 0.20) + (keyword_presence * 0.15) + (emotional_trigger * 0.20) + (specificity * 0.15)`

- Rank all titles and recommend top 2 for human selection
- For YouTube Shorts: also optimize for vertical scroll (< 40 chars preferred)
- Generate 1-2 additional titles using framework-specific angles (if frameworks available):
  ```yaml
  framework_titles:
    - title: "The Barbell Strategy: Why Middle-Length Videos Are Killing Your Channel"
      framework: "Barbell Content Strategy"
      angle: "framework_reveal"
      composite_score: 4.4
  ```

**Error Handling:**
- If all titles score < 3 composite: generate 5 more using different angles
- If title exceeds 60 chars: shorten without losing curiosity gap
- If keyword missing: add keyword naturally, never force-fit
- If all titles feel similar: force diversity by requiring 5 different patterns

**Checkpoint:** 5+ title variants per piece, each scored on 5 dimensions, ranked; top 2 recommended; framework titles added if available

---

### Step 4: Create Thumbnail Design Briefs (10 min)

**Agent Activity:**
- For EACH piece, create a thumbnail design brief:

  **Thumbnail Brief Structure:**
  ```yaml
  thumbnail:
    piece_id: "piece_yt_001"

    key_visual_element:
      description: "Split screen: left side shows stack of medium-length videos (red X), right shows 1 short clip + 1 long livestream (green check)"
      emotion: "surprise/revelation"

    text_overlay:
      text: "STOP"
      max_words: 1
      font_style: "bold, sans-serif, white with black outline"
      placement: "center-left, large"

    face_expression:
      needed: true
      expression: "surprised/shocked"
      placement: "right third"
      notes: "Looking at the 'wrong' content stack with shock"

    color_scheme:
      primary: "red (danger/stop)"
      secondary: "white text"
      background: "dark/muted"
      contrast: "high"

    style_reference:
      similar_to: "MrBeast style - bold, clean, high contrast"
      avoid: "Cluttered, multiple text blocks, small details"

    dimensions:
      shorts: "1080x1920"
      standard: "1280x720"

    mobile_test:
      readable_at_small_size: true
      text_visible_without_zoom: true
      main_element_identifiable: true
  ```

- Apply 5 thumbnail best practices:
  1. Maximum 4 words of text (fewer is better)
  2. Face close-up if available (increases CTR 15-25%)
  3. High contrast colors (readable at thumbnail size)
  4. One clear visual story (what is the video about in 1 image?)
  5. Consistent with channel branding (if established)

- Generate 2 thumbnail concepts per piece (A/B test potential):
  - Concept A: Face + text overlay (higher CTR for known channels)
  - Concept B: Object/metaphor + minimal text (higher CTR for discovery)

**Error Handling:**
- If no face available: use bold text + object-based thumbnail
- If topic is abstract: use metaphorical visual (barbell for Barbell Strategy)
- If brand guidelines conflict with CTR optimization: note both options

**Checkpoint:** Every piece has 2 thumbnail brief concepts; all briefs follow 5 best practices; mobile readability verified

---

### Step 5: Optimize Description for SEO and Engagement (8 min)

**Agent Activity:**
- For EACH piece, generate optimized description following this template:

  ```
  Line 1: Hook (repeat title promise with slightly different words)
  Line 2: Empty line
  Line 3-5: Brief content summary (what viewer will learn, 3 bullet points)
  Line 6: Empty line
  Line 7: Timestamps/chapters (if long-form)
  Line 8: Empty line
  Line 9-10: Call to action (subscribe, comment prompt, related video)
  Line 11: Empty line
  Line 12-14: Related links, social handles, resources mentioned
  Line 15: Empty line
  Line 16-20: Keyword-rich paragraph (SEO, invisible to casual readers)
  ```

- First 2 lines are critical (shown in search results before "show more"):
  ```yaml
  description_first_lines:
    line_1: "Think 10-minute videos are the sweet spot? Here's why that's the worst strategy for growth."
    line_2: ""
    line_3: "In this video, you'll learn:"
    visibility: "These lines appear in search results. Frontload keywords and hooks."
  ```

- Keyword placement priorities:
  1. Title (most weight)
  2. First 2 lines of description
  3. Tags
  4. Spoken in first 30 seconds of video (auto-captions pick this up)

- Include relevant hashtags (3 max):
  ```yaml
  hashtags:
    - "#contentstrategy"
    - "#youtubestrategy"
    - "#contentcreation"
  ```

**Error Handling:**
- If keyword research unavailable: derive keywords from title + niche + topic
- If description exceeds 5000 chars: trim SEO paragraph
- If no timestamps available: note "timestamps to be added after editing"

**Checkpoint:** Every piece has optimized description with keyword-rich first 2 lines

---

### Step 6: Generate 10-15 Optimized Tags (5 min)

**Agent Activity:**
- For EACH piece, generate tag list in 5 categories:

  ```yaml
  tags:
    exact_match:
      - "content strategy"
      - "barbell content strategy"
      count: 2-3
      purpose: "Direct keyword matches for search ranking"

    broad_match:
      - "content creation"
      - "YouTube strategy"
      - "social media strategy"
      count: 3-4
      purpose: "Broader topic discovery"

    long_tail:
      - "how to repurpose content"
      - "content from livestreams"
      - "one piece of content multiple platforms"
      count: 3-4
      purpose: "Low-competition search terms"

    competitor:
      - "ali abdaal"
      - "dan koe"
      - "creator economy"
      count: 2-3
      purpose: "Appear in related/suggested for competitor audiences"

    niche:
      - "content leverage"
      - "content multiplication"
      count: 1-2
      purpose: "Niche-specific terms"

    total: 12
    validation: "10-15 tags, no single-word tags, no overly broad tags"
  ```

- Tag ordering matters: most important tags first
- Avoid tag traps:
  - No single-word tags (too broad, useless)
  - No tags with < 100 monthly searches (waste)
  - No misleading tags (hurts trust score)

**Error Handling:**
- If keyword data unavailable: derive from title, topic, niche, competitor channels
- If tag count < 10: add broader niche tags and trending related terms
- If tag count > 15: remove lowest-impact broad match tags

**Checkpoint:** Every piece has 10-15 tags organized by category; no spam tags

---

### Step 7: Define Video Structure - Hook, Content, CTA (10 min)

**Agent Activity:**
- For EACH piece, define optimal video structure with the Hook -> Content -> CTA pattern:

  **YouTube Shorts Structure (30-60s):**
  ```yaml
  structure:
    hook:
      timing: "0-3 seconds"
      type: "pattern interrupt"
      script: "Stop making 10-minute videos."
      techniques:
        - "Open with a bold statement"
        - "Use 'you' language immediately"
        - "Create cognitive dissonance"
      retention_goal: "85%+ still watching at 3s"

    content:
      timing: "3-45 seconds"
      structure: "single concept, clear explanation, 1 example"
      pacing: "1 new idea every 8-10 seconds"
      retention_goal: "70%+ still watching at 30s"

    cta:
      timing: "45-60 seconds"
      type: "payoff + follow"
      script: "The Barbell Strategy. Try it for 30 days. Follow for more frameworks."
      retention_goal: "60%+ complete video"

    loop_potential:
      has_loop: true
      loop_element: "End connects back to opening statement"
      notes: "Loops increase rewatch rate, boosting algorithm signals"
  ```

  **Long-Form Structure (10-60min):**
  ```yaml
  structure:
    cold_open:
      timing: "0-30 seconds"
      purpose: "Preview the best moment or most surprising insight"
      script: "[clip of key moment] 'What if everything you knew about content length was wrong?'"
      retention_goal: "90%+ still watching at 30s"

    intro:
      timing: "30s-2min"
      purpose: "Context, why this matters, what viewer will learn"
      includes: ["credibility statement", "promise of value", "roadmap"]

    chapters:
      - title: "The Problem"
        timing: "2-8min"
        purpose: "Establish pain point the viewer identifies with"
        retention_technique: "storytelling + data"
      - title: "The Framework"
        timing: "8-20min"
        purpose: "Teach the core concept with examples"
        retention_technique: "visual aids + analogies"
      - title: "Application"
        timing: "20-30min"
        purpose: "Show how to apply it step by step"
        retention_technique: "screen share + walkthrough"

    cta:
      timing: "last 60 seconds"
      primary: "Subscribe for more frameworks like this"
      secondary: "Comment your biggest takeaway"
      tertiary: "Watch this related video [end screen]"
  ```

- Generate 3 hook variations per piece:
  ```yaml
  hook_variants:
    - type: "curiosity"
      script: "There's a content strategy that only 2% of creators use. After today, you'll be one of them."
      estimated_retention_3s: "88%"
    - type: "bold_claim"
      script: "10-minute videos are killing your channel. Here's proof."
      estimated_retention_3s: "91%"
    - type: "personal"
      script: "I used to post 3 videos a week. Then I discovered the Barbell Strategy."
      estimated_retention_3s: "85%"
  ```

- Ensure hook matches title promise (consistency = trust):
  ```yaml
  hook_title_alignment:
    title: "10-Minute Videos Are Dead. Here's What Works."
    best_hook: "bold_claim"
    alignment_score: 0.95
    notes: "Both make the same bold claim. Viewer expectations met."
  ```

**Error Handling:**
- If video length undefined: default to Shorts (60s) for atomized content
- If hook and title misalign: rewrite hook to match title promise
- If cold open has no compelling moment: use the strongest framework reveal

**Checkpoint:** Every piece has full Hook -> Content -> CTA structure; 3 hook variants scored; hook-title alignment verified

---

### Step 8: Determine Optimal Publish Timing (5 min)

**Agent Activity:**
- Analyze channel and niche data to recommend optimal publish window:

  **Data Sources (in priority order):**
  1. Channel's own analytics (if `previous_video_analytics` provided)
  2. Niche benchmarks (from competitor_analysis)
  3. General YouTube best practices

  **Publish Timing Analysis:**
  ```yaml
  publish_timing:
    piece_id: "piece_yt_001"

    recommended:
      day: "tuesday"
      time: "14:00 UTC"
      confidence: "high"
      reasoning: "Channel analytics show peak engagement Tue-Thu 13-16 UTC"

    alternative:
      day: "thursday"
      time: "10:00 UTC"
      confidence: "medium"
      reasoning: "Secondary peak for business/creator niche"

    avoid:
      days: ["saturday", "sunday"]
      reason: "Business niche audience is less active on weekends"

    shorts_timing:
      frequency: "daily or every other day"
      best_time: "12:00 UTC"
      reasoning: "Shorts have shorter discovery window; consistency matters more than timing"

    seasonal_note: null
    # Example: "Avoid posting Dec 24-Jan 2 (low engagement in business niche)"
  ```

- For multiple pieces, sequence publication for maximum impact:
  ```yaml
  publish_sequence:
    - piece_yt_001: "Tuesday 14:00 UTC"     # Strongest piece first
    - piece_yt_002: "Wednesday 14:00 UTC"   # Second piece next day
    - piece_yt_003: "Friday 10:00 UTC"      # Third piece before weekend
    - piece_yt_long_001: "Next Tuesday 14:00 UTC"  # Long-form gets its own week
    rationale: "Space pieces 1-2 days apart. Long-form on best day. Shorts can overlap."
  ```

**Error Handling:**
- If no analytics available: use niche defaults (business = weekday afternoons UTC)
- If channel is new: recommend testing 3 different days over 3 weeks
- If timezone unknown: ask or default to UTC

**Checkpoint:** Every piece has recommended publish day/time; multi-piece sequence defined

---

### Step 9: Apply Clickbait Theory (Ethical Engagement Engineering) (8 min)

**Agent Activity:**
- Review ALL titles, thumbnails, and hooks through the Clickbait Theory lens:

  **Clickbait Theory Principles:**
  ```yaml
  clickbait_theory:
    definition: "Create maximum curiosity while maintaining 100% honesty"

    golden_rule: "The title must promise something the video actually delivers"

    spectrum:
      too_boring: "Content Strategy Tips"          # No one clicks
      ethical_clickbait: "The Content Strategy Nobody Tells You About"  # Clicks AND delivers
      deceptive_clickbait: "This Strategy Makes $1M/Month"  # Clicks but disappoints

    3_principles:
      1_curiosity_gap:
        description: "Create a gap between what the viewer knows and what they want to know"
        technique: "Promise a revelation, insight, or counterintuitive truth"
        test: "Does the title make you think 'I need to know this'?"
        example_good: "Why I Stopped Posting Daily (And My Views Tripled)"
        example_bad: "My Thoughts on Posting Frequency"

      2_specificity:
        description: "Specific claims are more credible and clickable than vague ones"
        technique: "Use numbers, names, timeframes, and measurable outcomes"
        test: "Could someone fact-check this title?"
        example_good: "3 Rules That Took Me From 100 to 10,000 Subscribers"
        example_bad: "Some Tips That Helped Me Grow"

      3_emotional_trigger:
        description: "Trigger curiosity, fear of missing out, or desire"
        technique: "Use words that evoke emotion without manipulation"
        test: "Does this title create an emotional response?"
        example_good: "I Wasted 2 Years Making This Content Mistake"
        example_bad: "Common Content Mistakes"
  ```

- For each piece, evaluate against Clickbait Theory:
  ```yaml
  clickbait_evaluation:
    piece_id: "piece_yt_001"
    selected_title: "10-Minute Videos Are Dead. Here's What Works."

    curiosity_gap_score: 4
    curiosity_gap_note: "Strong gap - viewer wants to know what works instead"

    specificity_score: 3
    specificity_note: "Could be more specific - add a number or timeframe"
    specificity_improvement: "10-Minute Videos Are Dead. I Tested 3 Alternatives."

    emotional_trigger_score: 4
    emotional_trigger_note: "'Dead' triggers fear; 'What Works' triggers desire"

    honesty_check: true
    honesty_note: "Video genuinely argues against medium-length content. Title is honest."

    deception_risk: "none"
    deception_note: "Title accurately represents content"

    overall_clickbait_score: 3.7
    recommendation: "Improve specificity. Current title is ethical and compelling."
  ```

- Flag any title that might feel deceptive:
  ```yaml
  deception_flags:
    - title: "This Strategy Makes $1M/Month"
      flag: "DECEPTIVE - content doesn't prove this claim"
      fix: "How This Strategy Helped Me 10x My Content Output"
  ```

**Error Handling:**
- If all titles are too boring (avg clickbait < 3): rewrite with stronger curiosity gaps
- If any title is potentially deceptive: flag and suggest honest alternative
- If titles sacrifice clarity for clickbait: prioritize clarity (confused viewers don't click)

**Checkpoint:** All titles evaluated against Clickbait Theory; deception flags resolved; specificity improvements suggested

---

### Step 10: Apply Format-First Thinking (7 min)

**Agent Activity:**
- Review each piece through the Format-First lens:

  **Format-First Thinking Principles:**
  ```yaml
  format_first:
    definition: "Choose the optimal content FORMAT before optimizing the content itself"

    core_insight: |
      Most creators write content first, then try to fit it into a format.
      Format-First reverses this: choose the format that best serves
      the content type, THEN write to fit that format perfectly.

    format_decision_matrix:
      if_concept_is_simple:
        format: "YouTube Shorts (30-60s)"
        reason: "Simple concepts lose impact when stretched"
        structure: "Hook (3s) -> Explain (25s) -> Payoff (5s)"

      if_concept_is_framework:
        format: "YouTube Long-Form (10-20min)"
        reason: "Frameworks need context, examples, and application"
        structure: "Cold Open -> Problem -> Framework -> Application -> CTA"

      if_concept_is_story:
        format: "YouTube Mid-Form (5-10min)"
        reason: "Stories need arc but not exhaustive detail"
        structure: "Hook -> Setup -> Conflict -> Resolution -> Lesson"

      if_concept_is_list:
        format: "YouTube Shorts OR Long-Form"
        reason: "3 items = Short. 7+ items = Long. 4-6 = either."
        structure: "Hook -> Item 1 -> Item 2 -> ... -> Summary"

      if_concept_is_reaction:
        format: "YouTube Shorts (15-45s)"
        reason: "Reactions are emotional, not intellectual"
        structure: "Show stimulus -> React -> Quick insight"
  ```

- For each piece, validate format choice:
  ```yaml
  format_validation:
    piece_id: "piece_yt_001"
    current_format: "youtube_shorts"
    concept_type: "simple concept (Barbell Strategy intro)"
    format_first_recommendation: "youtube_shorts"
    format_match: true
    notes: "Correct format. Simple concept works perfectly in 60s."

  format_validation:
    piece_id: "piece_yt_long_001"
    current_format: "youtube_long"
    concept_type: "framework (Complete Content Leverage)"
    format_first_recommendation: "youtube_long"
    format_match: true
    notes: "Correct format. Framework needs 15-20min for full explanation."
  ```

- If format mismatch detected:
  ```yaml
  format_mismatch:
    piece_id: "piece_yt_004"
    current_format: "youtube_shorts"
    concept_type: "framework (3-layer content strategy)"
    format_first_recommendation: "youtube_long"
    mismatch: true
    action: "REFORMAT - This framework cannot be meaningfully explained in 60s"
    alternative: "Create a Short that TEASES the framework, linking to long-form"
    teaser_script: |
      [HOOK] "There are 3 layers to content strategy. Most creators only know 1."
      [CONTENT] "Layer 1 is creation. Layer 2 is distribution. Layer 3... watch the full video."
      [CTA] "Link in description. Trust me, Layer 3 changes everything."
  ```

- Generate format optimization notes for each piece:
  ```yaml
  format_optimization:
    piece_id: "piece_yt_001"
    format: "youtube_shorts"
    optimizations:
      - "Ensure single concept only - no tangents"
      - "Hook must work without sound (add text overlay)"
      - "Loop ending back to hook for rewatch boost"
      - "Vertical framing optimized for mobile"
    format_specific_tags:
      - "#shorts"
      - "#contentcreator"
  ```

**Error Handling:**
- If format mismatch found: suggest reformat with specific guidance
- If piece is borderline (could be either): recommend testing both formats
- If long-form piece is under 8 minutes: suggest adding examples or cutting to Short

**Checkpoint:** All pieces validated for format-content alignment; mismatches flagged with reformatting guidance; format-specific optimizations added

---

### Step 11: Save Optimization Outputs (5 min)

**Agent Activity:**
- Create output directory:
  ```
  {slug}/youtube/optimized/
  ├── piece-yt-001/
  │   ├── script-optimized.md
  │   ├── titles.yaml           # 5+ variants, CTR scored and ranked
  │   ├── thumbnail-brief.yaml  # 2 concepts (A/B test ready)
  │   ├── description.md        # Keyword-optimized description
  │   ├── tags.yaml             # 10-15 categorized tags
  │   ├── structure.yaml        # Hook -> Content -> CTA with 3 hook variants
  │   ├── ccn-scorecard.yaml    # Core/Casual/New evaluation
  │   ├── clickbait-eval.yaml   # Clickbait Theory evaluation
  │   └── format-check.yaml     # Format-First validation
  ├── piece-yt-002/
  │   └── ...
  ├── publish-sequence.yaml     # Ordered publish schedule
  └── optimization-report.yaml  # Aggregate metrics
  ```

- Generate comprehensive optimization report:
  ```yaml
  youtube_optimization:
    total_pieces: 5
    shorts: 3
    long_form: 1
    clips: 1
    avg_ccn_score: 4.1
    avg_clickbait_score: 3.8
    title_variants_generated: 25
    thumbnail_briefs: 10  # 2 per piece
    format_mismatches: 0
    estimated_ctr_improvement: "15-25% over unoptimized"
    recommended_publish_order:
      1: "piece_yt_001 (highest CCN + strongest title)"
      2: "piece_yt_003 (best hook + trending topic)"
      3: "piece_yt_002 (solid all-around)"
      4: "piece_yt_clip_001 (clip from long-form for promotion)"
      5: "piece_yt_long_001 (long-form gets its own publish slot)"

    quality_summary:
      all_ccn_above_3: true
      all_titles_scored: true
      all_thumbnails_briefed: true
      all_descriptions_optimized: true
      all_tags_complete: true
      all_structures_defined: true
      all_hooks_aligned: true
      all_formats_validated: true
      all_clickbait_checked: true
      publish_sequence_defined: true
  ```

**Error Handling:**
- If file write fails: retry, save to alternate location
- If report metrics inconsistent: recount from individual files

**Checkpoint:** All files saved; optimization report generated; quality summary complete

---

## Outputs

### Primary Outputs

**1. Optimized YouTube Content**

Format: Organized directory per piece
Location: `{slug}/youtube/optimized/{piece-id}/`
Content: Optimized script, title variants, thumbnail briefs, description, tags, structure, CCN scorecard, clickbait evaluation, format validation

**2. Optimization Report**

Format: YAML
Location: `{slug}/youtube/optimized/optimization-report.yaml`
Content: Aggregate scores, recommended publish order, CTR estimates, quality summary

**3. Publish Sequence**

Format: YAML
Location: `{slug}/youtube/optimized/publish-sequence.yaml`
Content: Ordered publish schedule with timing and rationale

### Secondary Outputs

1. **Title Variant Library** - YAML per piece, 5+ scored title variants with top 2 recommended
2. **Thumbnail Brief Collection** - YAML per piece, 2 concepts (A/B test ready)
3. **CCN Score Cards** - YAML per piece, Core/Casual/New evaluation with improvement actions
4. **Clickbait Evaluations** - YAML per piece, ethical engagement scoring
5. **Format Validations** - YAML per piece, Format-First alignment check

---

## Validation

### Checklist

- [ ] Every YouTube piece has CCN evaluation (all 3 dimensions scored)
- [ ] Every piece has 5+ title variants scored on 5 CTR dimensions
- [ ] Every piece has 2 thumbnail brief concepts following 5 best practices
- [ ] Every piece has optimized description with keyword-rich first 2 lines
- [ ] Every piece has 10-15 tags in 5 categories (exact, broad, long-tail, competitor, niche)
- [ ] Every piece has Hook -> Content -> CTA structure with 3 hook variants
- [ ] Every piece has recommended publish day/time with rationale
- [ ] Every piece evaluated against Clickbait Theory (3 principles scored)
- [ ] Every piece validated through Format-First Thinking (format-content alignment)
- [ ] No CCN dimension scores < 3 without flagged improvement actions
- [ ] All titles under 60 characters (40 for Shorts)
- [ ] No deceptive titles (honesty check passed)
- [ ] Publish sequence defined for multi-piece sets
- [ ] Optimization report generated with quality summary

### Success Criteria

**Threshold: 12/14 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **CCN coverage** | All 3 dimensions >= 4 for every piece | All dimensions >= 3 | Any dimension < 3 unresolved |
| **Title quality** | 5+ diverse variants, all CTR-scored, clear winner | 3-4 variants, scoring present | < 3 variants or no scoring |
| **Thumbnail brief** | 2 concepts per piece, specific, follows all 5 practices | 1 concept, mostly specific | Vague or missing key elements |
| **SEO completeness** | Description + 15 tags + keyword in hook | Description + 10 tags | Missing description or < 10 tags |
| **Structure clarity** | Exact timestamps, 3 hook variants, retention goals | General structure defined | No structure or vague timing |
| **Publish strategy** | Data-backed timing with sequence for multi-piece | Reasonable timing suggestion | No timing recommendation |
| **Clickbait ethics** | All titles pass honesty check, specificity >= 3 | Most titles pass, minor issues | Deceptive titles or no evaluation |
| **Format alignment** | All pieces validated, no mismatches | Minor mismatches noted | Format mismatches unresolved |

---

## Estimated Effort

| Role | Effort | Notes |
|------|--------|-------|
| **Agent (youtube-strategist)** | 50-65 min | All 10 optimization steps |
| **Human** | 15-20 min | Title selection, thumbnail approval, brand check |
| **Total Duration** | 65-85 min | Agent prepares all options, human makes final selections |

---

## Integration

### Feeds To

**Downstream:**
- Video production (filming/editing uses optimized scripts and structure)
- Thumbnail design (designer uses thumbnail briefs)
- Publishing tools (YouTube Studio upload with pre-optimized metadata)
- Content calendar (publish sequence feeds into overall schedule)

### Depends On

- `atomize-content` - Provides YouTube-tagged content pieces
- `produce-batch` - Provides production-ready scripts (optional, can work with drafts)
- `identify-frameworks` - Provides framework catalog for framework-based title angles
- Channel context and analytics data

### Agent Routing

**Primary Agent:** youtube-strategist (Paddy Galloway methodology)
**Supporting Agents:** content-atomizer (provides source scripts), ecosystem-designer (provides publish calendar)

**Handoff:** Optimized pieces ready for filming/upload with all metadata prepared

---

## Quality Threshold

**Pass/Fail Gate:** All CCN dimensions >= 3 AND 5+ title variants per piece AND no deceptive titles

If failing:
1. If CCN < 3 on any dimension: edit script to address weakest viewer type
2. If < 5 title variants: try additional pattern types (question, comparison, etc.)
3. If deceptive title flagged: rewrite to be honest while maintaining curiosity
4. Re-score after edits

**Common Failure Reasons:**
- Content too niche for New viewers (jargon-heavy)
- Titles lack curiosity gap (descriptive instead of compelling)
- Thumbnail briefs too vague (designer cannot execute)
- Missing keyword research leads to poor SEO
- Format mismatch (trying to explain a framework in 30 seconds)
- Title promises more than video delivers (deception risk)

---

## Error Handling

### Input Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| No YouTube pieces | Empty queue | HALT, report "no YouTube content found" |
| Missing channel context | No channel data | Use niche defaults, warn "optimization less accurate" |
| No competitor data | Missing optional input | Skip benchmarking, rely on best practices |
| Script missing timestamps | No timing markers | Add default timing based on content length |
| No frameworks available | Missing optional input | Skip framework-based title angles |

### Processing Errors

| Error | Detection | Recovery |
|-------|-----------|----------|
| All titles generic | Scoring < 3 average | Try 5 more using different patterns |
| CCN consistently low | Composite < 3 | Content may need rewrite, flag for review |
| Keyword stuffing | > 3 keywords in title | Simplify, prioritize readability |
| Thumbnail too complex | > 4 words or > 3 elements | Simplify to 1 focal point + 1-2 words |
| Format mismatch | Concept doesn't fit format | Suggest reformat or create teaser + link |
| Deceptive title | Honesty check fails | Rewrite with honest alternative |

---

## Notes for Executor

### If Channel Is Small (< 10K subscribers)

- Prioritize New viewer optimization (growth mode)
- Use proven title patterns from larger channels in niche
- Thumbnail should be high-contrast and bold (needs to stand out in feed)
- Focus on search-discoverable keywords (SEO > virality)
- Format-First: lean toward Shorts for faster growth

### If Channel Is Established (50K+ subscribers)

- Balance Core and New viewers (retention + growth)
- Can take more creative risks with titles (audience trust exists)
- Thumbnail can be more subtle (brand recognition helps)
- Focus on topic freshness for Core viewers
- Format-First: mix Shorts and long-form strategically

### If Content Is Evergreen

- Prioritize SEO-optimized titles (search traffic over trending)
- Use "How to" and "What is" patterns
- Description should be keyword-rich for long-term discoverability
- Tags should target long-tail searches
- Clickbait Theory: lean on specificity over urgency

### If Content Is Time-Sensitive

- Prioritize curiosity and urgency in titles
- Use trending keywords and current events
- Publish ASAP (time-sensitive content decays fast)
- Add "2026" or current year to title for freshness signal
- Clickbait Theory: lean on emotional trigger over specificity

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial release with 7 steps |
| 2.0.0 | 2026-02-12 | Expanded to 10 steps: added CTR scoring, Clickbait Theory, Format-First Thinking, publish timing |

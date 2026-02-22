# Task: Multiply Ideas Using 4A Framework

**Task ID:** content-distillery/multiply-ideas
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Distillery Pipeline
**Total Lines:** 380

---

## Executive Summary

This task takes extracted frameworks and heuristics and systematically multiplies each into 20+ content ideas using the 4A Framework (Actionable, Analytical, Aspirational, Anthropological) combined with format variations and audience targeting. It transforms intellectual property into a prioritized content calendar with platform-specific angles, engagement predictions, and a clear publishing sequence. One framework in, 20+ content pieces out.

**Workflow Position:** Task 5 in Content Distillery pipeline (depends on identify-frameworks; enhanced by progressive-summarize)
**Success Definition:** 20+ unique content ideas per framework, scored and prioritized into a publishable calendar
**Output Quality Gate:** Each idea must pass the "would I click this?" test and have clear platform/audience fit

---

## Purpose

A single framework can fuel a month of content if you know how to multiply it. Nicolas Cole and Dickie Bush's 4A Framework provides 4 proven angles for any topic. Combined with 7 format variations, that's 28 permutations per framework. With 5 frameworks from a single livestream, that's 140 potential content pieces.

The problem is not volume - it is quality filtering and prioritization. This task generates the permutations AND scores them, producing a calendar of the highest-potential content ideas ranked by novelty, engagement potential, and platform fit. It converts the Content Distillery's analytical output into a concrete publishing plan.

---

## Executor Type

**Agent (100% idea-multiplier agent)**

- **Agent Role:** 4A Framework application, format variation, scoring, calendar generation
- **Human Role:** None during multiplication (human approves calendar priorities)
- **Estimated Runtime:** 15-30 minutes per batch of frameworks

---

## Inputs

### Required Inputs

```yaml
frameworks:
  field: "Identified frameworks from identify-frameworks task"
  format: "YAML file"
  required: true
  location: "outputs/distillery/{slug}/frameworks.yaml"
  validation: "Must contain at least 1 framework with components and application rules"
  notes: "Primary input - each framework becomes a multiplication seed"

heuristics:
  field: "Extracted heuristics from identify-frameworks task"
  format: "YAML file"
  required: true
  location: "outputs/distillery/{slug}/heuristics.yaml"
  validation: "Must contain at least 1 heuristic with when/then/because"
  notes: "Secondary seeds - each heuristic becomes a content angle"
```

### Optional (But Recommended) Inputs

```yaml
executive_summary:
  field: "Executive summary from progressive-summarize task"
  format: "Markdown file"
  required: false
  location: "outputs/distillery/{slug}/distilled/executive-summary.md"
  notes: "Provides compressed context for idea generation"

intermediate_packets:
  field: "Intermediate packets from progressive-summarize task"
  format: "YAML file"
  required: false
  location: "outputs/distillery/{slug}/distilled/intermediate-packets.yaml"
  notes: "Each packet can be a standalone content seed"

metadata:
  field: "Video metadata for expert attribution"
  format: "YAML file"
  required: false
  location: "outputs/distillery/{slug}/metadata.yaml"
  notes: "Expert name and domain for audience targeting"

target_platforms:
  field: "Platforms to generate ideas for"
  format: "list of strings"
  required: false
  default: ["twitter", "linkedin", "newsletter", "youtube_short", "instagram"]
  notes: "Restricts idea generation to specified platforms"

target_audience:
  field: "Primary audience description"
  format: "text"
  required: false
  example: "Founders and operators of B2B SaaS companies, $1M-$10M ARR"
  notes: "Sharpens the FOR WHO / SO THAT filter"
```

---

## Preconditions

Before starting this task:

- [ ] Frameworks file exists at `outputs/distillery/{slug}/frameworks.yaml`
- [ ] Heuristics file exists at `outputs/distillery/{slug}/heuristics.yaml`
- [ ] At least 1 framework with defined components
- [ ] At least 1 heuristic with when/then/because structure
- [ ] (Recommended) Executive summary available from Task 4
- [ ] (Recommended) Target audience defined

---

## Steps

### Step 1: Load Frameworks and Build Multiplication Seeds (3 min)

**Agent Activity:**
- Read all frameworks (novel + matched known models)
- Read all heuristics
- Read executive summary and intermediate packets if available
- Build multiplication seed list:

```yaml
multiplication_seeds:
  - id: "SEED-001"
    type: "framework"
    name: "The Retention-First Growth Model"
    core_idea: "Fix retention before investing in acquisition"
    source_framework_id: "NF-001"
    components: ["Retention Baseline", "Acquisition Gate", "Growth Multiplier"]
    key_quote: "Fix the bucket before you pour more water in."
    expert: "Alex Hormozi"
    domain: "business growth"
    novelty: "high"

  - id: "SEED-002"
    type: "heuristic"
    name: "The Retention Check"
    core_idea: "When retention declining, freeze acquisition"
    source_heuristic_id: "HC-001"
    trigger: "Revenue up + retention down"
    action: "Freeze acquisition, fix retention"
    expert: "Alex Hormozi"
    domain: "business growth"
    novelty: "medium"

  # ... additional seeds from frameworks, heuristics, and packets
```

- Prioritize seeds by novelty and content multiplication potential
- Identify the top 5 seeds for full multiplication (others get abbreviated treatment)

**Checkpoint:** Seed list built and prioritized

---

### Step 2: Apply 4A Framework to Each Seed (8-12 min)

**Agent Activity:**
- For EACH top seed, generate 4 angles:

**4A Framework:**

```yaml
four_a_angles:
  seed_id: "SEED-001"
  seed_name: "The Retention-First Growth Model"

  actionable:
    angle: "Here's how to apply the Retention-First Growth Model"
    hook: "Stop spending on growth until you do this ONE thing"
    promise: "Reader gets a specific process to follow"
    content_core: |
      Step-by-step implementation:
      1. How to measure your retention baseline
      2. The exact threshold that signals "fix before grow"
      3. The 3 most common retention killers and how to fix each
      4. When it's safe to resume acquisition spending
    example_headline: "The 4-Step Retention Audit I Run Before Any Growth Investment"

  analytical:
    angle: "Here's a breakdown of why retention beats acquisition"
    hook: "I analyzed 100 businesses. The #1 predictor of failure? Not what you think."
    promise: "Reader understands the WHY behind the framework"
    content_core: |
      Deep analysis:
      1. The math of retention vs acquisition (LTV impact)
      2. Why growing a leaky bucket accelerates failure
      3. The second-order effects that take 6 months to appear
      4. Case study breakdown of Company A (grew first) vs Company B (retained first)
    example_headline: "The Hidden Math That Explains Why 80% of Funded Startups Fail"

  aspirational:
    angle: "What becomes possible when you master retention first"
    hook: "Imagine never worrying about your churn rate again"
    promise: "Reader sees the vision of what this framework enables"
    content_core: |
      Vision and possibility:
      1. What a business looks like with 95% retention
      2. How compounding retention creates 10x growth
      3. The freedom that comes from not needing constant new customers
      4. Real example of business that transformed after retention-first
    example_headline: "The Company That Stopped Marketing For 6 Months and 3x'd Revenue"

  anthropological:
    angle: "Here's why most founders focus on acquisition instead of retention"
    hook: "There's a psychological reason you're ignoring your churn rate"
    promise: "Reader understands the human behavior behind the problem"
    content_core: |
      Behavioral insight:
      1. Why new customers feel better than keeping existing ones (novelty bias)
      2. The vanity metric trap (revenue UP feels good even if retention DOWN)
      3. Why investors reward acquisition metrics over retention
      4. The cultural pressure to "grow or die" and why it's backward
    example_headline: "The Psychological Trap That Makes Founders Ignore Their Best Customers"
```

**Quality Check Per Angle:**
- Hook must be specific (not "here's something interesting")
- Content core must have 3-5 concrete points
- Example headline must be something you'd actually click on
- Each angle must feel distinct (not 4 versions of the same idea)

**Checkpoint:** 4A angles generated for all top seeds

---

### Step 3: Apply Format Variations to Each Angle (5-8 min)

**Agent Activity:**
- For each 4A angle, generate ideas across 7 format variations:

**Format Variations:**

```yaml
format_variations:
  how_to_guide:
    description: "Step-by-step guide or tutorial"
    platforms: ["newsletter", "linkedin", "blog"]
    example: "How to Run a Retention Audit in 30 Minutes"
    length: "800-1500 words"

  listicle:
    description: "Numbered list of items"
    platforms: ["twitter", "linkedin", "instagram"]
    example: "7 Signs Your Business Has a Retention Problem (Not a Growth Problem)"
    length: "300-800 words"

  story:
    description: "Narrative with lesson"
    platforms: ["twitter_thread", "linkedin", "newsletter"]
    example: "I watched a $5M company die in 18 months. Here's the one metric they ignored."
    length: "500-1200 words"

  contrarian_take:
    description: "Challenge conventional wisdom"
    platforms: ["twitter", "linkedin"]
    example: "Unpopular opinion: Your marketing budget should be $0 until retention is fixed."
    length: "200-600 words"

  observation:
    description: "Pattern or trend noticed"
    platforms: ["twitter", "linkedin"]
    example: "I've noticed the best businesses I know spend more on customer success than on ads."
    length: "100-400 words"

  prediction:
    description: "Future-looking statement with reasoning"
    platforms: ["twitter", "linkedin", "newsletter"]
    example: "In 5 years, the businesses that win won't be the best at acquiring customers. They'll be the best at keeping them."
    length: "200-600 words"

  lesson_learned:
    description: "Personal or observed lesson"
    platforms: ["twitter", "linkedin", "newsletter"]
    example: "The most expensive lesson I learned in business: Revenue growth can hide a dying company."
    length: "300-800 words"
```

**Multiplication Math:**
- 5 seeds x 4 angles x 7 formats = 140 permutations
- NOT all permutations are worth creating
- Agent evaluates each and keeps only viable combinations
- Target: 20-30 viable ideas per seed, 80-150 total

**Checkpoint:** Format variations applied, viable combinations identified

---

### Step 4: Apply FOR WHO / SO THAT Filter (3-5 min)

**Agent Activity:**
- For each viable content idea, define:

```yaml
audience_filter:
  idea_id: "CI-001"
  for_who: "B2B SaaS founders at $1M-$5M ARR who are spending heavily on ads but seeing flat growth"
  so_that: "They realize retention is the bottleneck and redirect budget to customer success"
  awareness_level: "problem_aware"  # unaware | problem_aware | solution_aware | product_aware
  emotional_trigger: "fear_of_waste"  # fear | aspiration | curiosity | frustration | validation
```

**Awareness Level Mapping:**
- **Unaware:** Use anthropological angle (why this problem exists)
- **Problem aware:** Use analytical angle (breakdown of the problem)
- **Solution aware:** Use actionable angle (how to implement)
- **Product aware:** Use aspirational angle (results and transformation)

**Filter Rules:**
- Remove ideas where FOR WHO is too vague ("entrepreneurs")
- Remove ideas where SO THAT is not a clear outcome
- Remove ideas where emotional trigger doesn't match awareness level
- Flag ideas where audience is very narrow (< 1000 people)

**Checkpoint:** All ideas have clear audience targeting

---

### Step 5: Score and Prioritize Ideas (5 min)

**Agent Activity:**
- Score each content idea on 5 dimensions (1-10):

```yaml
scoring_dimensions:
  novelty:
    weight: 0.25
    question: "How fresh is this angle? Has the audience seen this before?"
    scoring:
      10: "Completely new perspective no one is talking about"
      7: "New framing of a known concept"
      4: "Common topic with slight twist"
      1: "Everyone has said this already"

  engagement_potential:
    weight: 0.25
    question: "Would someone stop scrolling for this?"
    scoring:
      10: "Controversial + specific + emotionally triggering"
      7: "Specific and interesting, clear value"
      4: "Decent but not scroll-stopping"
      1: "Generic, would blend into feed"

  actionability:
    weight: 0.20
    question: "Can the reader DO something after consuming this?"
    scoring:
      10: "Clear 3-step action plan included"
      7: "General direction with some specifics"
      4: "Interesting but no clear next step"
      1: "Purely observational, no action"

  platform_fit:
    weight: 0.15
    question: "Is this format right for the target platform?"
    scoring:
      10: "Perfect format for platform (thread for Twitter, long-form for newsletter)"
      7: "Good fit with minor adaptation needed"
      4: "Workable but not optimal format"
      1: "Wrong format for platform"

  production_effort:
    weight: 0.15
    question: "How much effort to produce this?"
    scoring:
      10: "Can write in 15 minutes with material we have"
      7: "30-60 minutes, needs some additional research"
      4: "2-4 hours, needs significant original work"
      1: "Full day+ of production, complex media needed"
```

- Calculate composite score for each idea
- Rank all ideas by composite score (descending)
- Identify top 20 ideas for the content calendar

**Checkpoint:** All ideas scored and ranked

---

### Step 6: Generate Content Calendar (3-5 min)

**Agent Activity:**
- Organize top 20-30 ideas into a weekly content calendar
- Apply distribution rules:

```yaml
calendar_rules:
  frequency:
    twitter: "3-5 per week"
    linkedin: "2-3 per week"
    newsletter: "1 per week"
    youtube_short: "1-2 per week"
    instagram: "2-3 per week"

  sequencing:
    rule_1: "Start with highest-novelty ideas (front-load engagement)"
    rule_2: "Alternate between 4A angles (don't do 3 actionable in a row)"
    rule_3: "Lead with contrarian/anthropological on Monday (attention-grabbing)"
    rule_4: "Place how-to guides mid-week (value-driven)"
    rule_5: "End week with aspirational/story (emotional close)"

  cross_posting:
    rule: "Same idea can appear on 2 platforms with format adaptation"
    example: "Twitter thread (300 words) -> LinkedIn long post (600 words)"
```

**Calendar Format:**

```yaml
content_calendar:
  source_slug: "{slug}"
  generated_date: "2026-02-12"
  total_ideas: 85
  top_ideas_calendared: 24
  weeks_of_content: 4

  week_1:
    monday:
      - platform: "twitter"
        idea: "CI-007"
        headline: "Unpopular opinion: Your marketing budget should be $0 until retention is fixed."
        angle: "contrarian_take"
        four_a: "anthropological"
        score: 8.7
        estimated_production: "15 min"

      - platform: "linkedin"
        idea: "CI-003"
        headline: "I analyzed 100 businesses. The #1 predictor of failure? Not what you think."
        angle: "story"
        four_a: "analytical"
        score: 8.5
        estimated_production: "30 min"

    tuesday:
      - platform: "twitter"
        idea: "CI-012"
        headline: "7 Signs Your Business Has a Retention Problem (Not a Growth Problem)"
        angle: "listicle"
        four_a: "actionable"
        score: 8.3
        estimated_production: "20 min"

    # ... rest of week
```

**Checkpoint:** Calendar generated with 3-4 weeks of content

---

### Step 7: Save All Outputs (2 min)

**Agent Activity:**
- Save content ideas catalog
- Save prioritized calendar
- Generate multiplication statistics

**Checkpoint:** All output files written and verified

---

## Outputs

### Primary Outputs

**1. Content Ideas Catalog**
- Format: YAML
- Location: `outputs/distillery/{slug}/ideas/content-ideas.yaml`
- Contains: All generated ideas with 4A angle, format, audience, score

**2. Content Calendar**
- Format: YAML
- Location: `outputs/distillery/{slug}/ideas/calendar.yaml`
- Contains: Prioritized, sequenced publishing schedule

### Secondary Outputs

**3. Multiplication Statistics**
- Format: YAML
- Location: `outputs/distillery/{slug}/ideas/multiplication-stats.yaml`

```yaml
multiplication_stats:
  source_slug: "{slug}"
  seeds_processed: 8
  total_permutations: 224
  viable_ideas: 85
  top_calendared: 24
  weeks_of_content: 4
  by_platform:
    twitter: 32
    linkedin: 24
    newsletter: 12
    youtube_short: 8
    instagram: 9
  by_four_a:
    actionable: 22
    analytical: 21
    aspirational: 20
    anthropological: 22
  average_score: 6.8
  top_score: 9.2
  estimated_total_production_hours: 18
```

**4. Seed-to-Idea Map**
- Format: YAML
- Location: `outputs/distillery/{slug}/ideas/seed-map.yaml`
- Contains: Traceability from original framework/heuristic to each content idea

---

## Validation

### Checklist

- [ ] All frameworks processed as multiplication seeds
- [ ] All heuristics processed as multiplication seeds
- [ ] 4A angles generated for top 5+ seeds
- [ ] Each angle has specific hook, content core, and example headline
- [ ] Format variations applied (7 formats per angle where viable)
- [ ] FOR WHO / SO THAT defined for all viable ideas
- [ ] Awareness level mapped for each idea
- [ ] All ideas scored on 5 dimensions (novelty, engagement, actionability, platform fit, effort)
- [ ] Top 20-30 ideas selected for calendar
- [ ] Calendar follows sequencing rules (angle variety, platform frequency)
- [ ] At least 20 unique ideas per top framework
- [ ] No two calendar entries have the same headline
- [ ] Each idea is traceable back to source framework/heuristic

### Success Criteria

**Threshold: 10/13 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Idea volume** | 20+ unique ideas per framework | 10-19 ideas per framework | < 10 per framework |
| **Angle diversity** | All 4A angles feel genuinely distinct | 3 of 4 angles distinct | Angles overlap significantly |
| **Hook quality** | Would stop scrolling on 80%+ of hooks | 60% scroll-stopping | Generic hooks |
| **Calendar utility** | 4+ weeks of content, ready to produce | 2-3 weeks, needs refinement | < 2 weeks, many gaps |
| **Scoring accuracy** | Top-ranked ideas are genuinely the best | Mostly right, a few misranks | Rankings don't match intuition |

---

## Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| **Seed Loading** | 3 min | Read frameworks + heuristics |
| **4A Application** | 8-12 min | 4 angles per seed |
| **Format Variations** | 5-8 min | 7 formats per viable angle |
| **Audience Filter** | 3-5 min | FOR WHO / SO THAT |
| **Scoring** | 5 min | 5 dimensions per idea |
| **Calendar** | 3-5 min | Sequencing and distribution |
| **Output** | 2 min | File writing |
| **Total** | 30-45 min | Regardless of transcript length |

---

## Integration

### Feeds To

**Workflow:** Content Distillery Pipeline (content-distillery/full-distillery-pipeline)

**Downstream (outside pipeline):**
- Content production workflow (atomize-content, produce-batch)
- YouTube optimization task (optimize-youtube)
- Ecosystem design task (design-ecosystem)

### Depends On

- **Task 3:** identify-frameworks - Provides: frameworks.yaml, heuristics.yaml (REQUIRED)
- **Task 4:** progressive-summarize - Provides: executive-summary.md, intermediate-packets.yaml (RECOMMENDED)

### Agent Routing

**Primary Agent:** idea-multiplier (Nicolas Cole & Dickie Bush methodology specialist)
**Supporting Agent:** content-atomizer (Gary Vaynerchuk - validates platform fit)
**Quality Review:** distillery-chief (validates calendar quality)

---

## Quality Threshold

**Pass/Fail Gate:** Checklist score >= 10/13

If < 10/13:
1. If idea volume low: relax viability filter, include more format variations
2. If angles not distinct: rewrite with sharper differentiation
3. If hooks generic: add specificity (numbers, names, contrarian position)
4. If calendar has gaps: add more seeds from intermediate packets
5. Re-validate

**Common Failure Reasons:**
- Frameworks too abstract to multiply (need more concrete components)
- All ideas sound the same (4A angles not differentiated enough)
- Hooks are generic ("Here's what I learned" instead of specific)
- Calendar front-loads all best ideas in week 1 (bad distribution)
- Audience targeting too broad ("entrepreneurs" instead of specific segment)

---

## Related Tasks

- **Task 3:** identify-frameworks (provides primary input)
- **Task 4:** progressive-summarize (provides enrichment)
- **Task 6:** distill-single-live (orchestrates this as step 5)
- atomize-content (downstream - takes calendar items and produces drafts)
- produce-batch (downstream - batch produces final content)

---

## Notes for Executor

### The Hook Is Everything

A brilliant idea with a weak hook will never be seen. Spend extra time on hooks:
- Include a number ("7 signs", "the #1 mistake", "100 businesses analyzed")
- Include specificity ("B2B SaaS", not "business")
- Include emotional trigger ("the hidden math", "the trap", "what no one tells you")
- Test: "Would I stop scrolling for this?" If no, rewrite.

### Contrarian Takes Are the Highest Performers

Anthropological + contrarian_take = highest engagement potential. But must be:
- Actually contrarian (not just "success takes hard work")
- Backed by evidence (not clickbait)
- Specific to audience (not generic hot take)

### When Framework is Too Niche

If a framework has very narrow applicability:
- Focus on analytical and anthropological angles (explain WHY it's interesting)
- Use "what [niche] founders know that you don't" framing
- The lesson is often transferable even if the domain is specific

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

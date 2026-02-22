# Task: Identify Mental Models, Frameworks, and Heuristics

**Task ID:** content-distillery/identify-frameworks
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Distillery Pipeline
**Total Lines:** 500

---

## Executive Summary

This task takes extracted tacit knowledge fragments and maps them to known mental models, identifies novel frameworks unique to the expert, and codifies practical heuristics into reusable decision rules. It transforms raw knowledge extractions into a structured catalog of thinking tools that can be taught, applied, and multiplied into content. This is where the Content Distillery produces its most valuable output: named, structured, applicable frameworks.

**Workflow Position:** Task 3 in Content Distillery pipeline (depends on extract-tacit-knowledge)
**Success Definition:** 5+ frameworks identified per hour of source content, with at least 1 novel framework
**Output Quality Gate:** Each framework must have name, components, application rules, and transcript evidence

---

## Purpose

Raw tacit knowledge fragments are powerful but unstructured. A list of 20 decision heuristics is useful but not teachable, not memorable, and not shareable. Frameworks transform scattered knowledge into coherent thinking tools. Shane Parrish's Farnam Street empire was built on exactly this: taking expert tacit knowledge and mapping it to named, structured mental models that anyone can learn and apply.

This task bridges the gap between "expert said interesting things" and "here are named frameworks you can teach, apply, and build content around." Each framework becomes a content engine: one framework can generate 20+ content pieces through the multiply-ideas task downstream.

---

## Executor Type

**Agent (100% model-identifier agent)**

- **Agent Role:** Pattern matching against mental model library, novel framework synthesis, heuristic codification
- **Human Role:** None during identification (human validates in separate QA step)
- **Estimated Runtime:** 20-40 minutes per hour of source transcript

---

## Inputs

### Required Inputs

```yaml
tacit_knowledge:
  field: "Tacit knowledge extractions from previous task"
  format: "YAML file"
  required: true
  location: "outputs/distillery/{slug}/tacit-knowledge.yaml"
  validation: "Must contain at least 10 fragments with confidence >= 0.6"
  notes: "Primary input - fragments, RPD analyses, and heuristics"

transcript:
  field: "Original transcript for evidence cross-referencing"
  format: "Markdown file"
  required: true
  location: "outputs/distillery/{slug}/transcript.md"
  notes: "Used to find additional evidence for framework validation"

metadata:
  field: "Video metadata for domain context"
  format: "YAML file"
  required: true
  location: "outputs/distillery/{slug}/metadata.yaml"
  notes: "Expert name and domain affect framework identification"
```

### Optional Inputs

```yaml
mental_model_library:
  field: "Reference library of known mental models"
  format: "YAML file"
  required: false
  location: "squads/content-distillery/data/mental-models-library.yaml"
  notes: "Contains 100+ named models. If not available, agent uses internal knowledge"
  default_behavior: "Agent uses built-in knowledge of common mental models"

expert_profile:
  field: "Known information about the speaker/expert"
  format: "YAML or text"
  required: false
  notes: "Known frameworks from this expert help validate identifications"

prior_frameworks:
  field: "Previously identified frameworks from same expert (other videos)"
  format: "YAML file(s)"
  required: false
  notes: "Enables cross-video framework evolution tracking"

domain_context:
  field: "Specific industry/domain context"
  format: "text"
  required: false
  example: "B2B SaaS, Series A to B growth stage"
  notes: "Narrows framework search to domain-relevant models"
```

---

## Preconditions

Before starting this task:

- [ ] Tacit knowledge file exists at `outputs/distillery/{slug}/tacit-knowledge.yaml`
- [ ] At least 10 fragments with confidence >= 0.6
- [ ] Transcript exists at `outputs/distillery/{slug}/transcript.md`
- [ ] Metadata exists at `outputs/distillery/{slug}/metadata.yaml`
- [ ] Agent has access to mental model reference library (built-in or external)

---

## Steps

### Step 1: Load Inputs and Build Framework Search Context (3 min)

**Agent Activity:**
- Read complete tacit-knowledge.yaml (all fragments and heuristics)
- Read metadata for expert identity and domain
- Load mental model library if available
- Build search context:

```yaml
search_context:
  expert: "{name}"
  domain: "{domain}"
  fragment_count: 22
  heuristic_count: 7
  knowledge_types_present:
    relational: 9
    perceptual: 6
    procedural: 4
    somatic: 2
    collective: 1
  focus_areas: ["pricing", "retention", "team building"]
```

- Organize fragments by topic clusters (group related fragments)
- Identify the 3-5 dominant themes in the extracted knowledge

**Checkpoint:** Inputs loaded, topic clusters identified, search context ready

---

### Step 2: Match Against Known Mental Model Library (10-15 min)

**Agent Activity:**
- For each topic cluster, search the mental model library for matches
- Apply matching at three levels:

**Level 1: Direct Match (expert names the model)**
- Expert explicitly says "This is like the Pareto Principle" or "I use first principles thinking"
- Confidence: Very High (0.95)
- Action: Document the match with expert's specific application

**Level 2: Pattern Match (expert applies the model without naming it)**
- Expert describes a process that maps to a known model
- Example: Expert describes "looking at the second-order effects" = Second-Order Thinking
- Confidence: High (0.80)
- Action: Document the match, note it was implicit

**Level 3: Structural Match (fragments collectively suggest a model)**
- Multiple fragments, when viewed together, suggest a known framework
- Example: 3 fragments about "start with why, then what, then how" = Golden Circle (Sinek)
- Confidence: Medium (0.65)
- Action: Document tentative match, flag for validation

**Known Mental Model Categories to Search:**

```yaml
model_categories:
  decision_making:
    - First Principles Thinking
    - Inversion
    - Second-Order Thinking
    - Opportunity Cost
    - Reversible vs Irreversible Decisions
    - Regret Minimization Framework
    - OODA Loop
    - Cynefin Framework

  systems_thinking:
    - Feedback Loops (positive/negative)
    - Bottleneck Theory (Theory of Constraints)
    - Leverage Points
    - Emergence
    - Network Effects
    - Flywheel Effect

  strategy:
    - Blue Ocean Strategy
    - Jobs to Be Done
    - Porter's Five Forces
    - Competitive Moat
    - Asymmetric Risk/Reward
    - Barbell Strategy

  psychology:
    - Loss Aversion
    - Anchoring
    - Social Proof
    - Commitment/Consistency
    - Dunning-Kruger Effect
    - Survivorship Bias

  business:
    - Value Equation (Price = Dream Outcome x Perceived Likelihood / Time x Effort)
    - LTV/CAC Ratio
    - Product-Market Fit
    - The Innovator's Dilemma
    - Crossing the Chasm
    - 80/20 (Pareto in business)

  learning:
    - Deliberate Practice
    - Spacing Effect
    - Interleaving
    - Zone of Proximal Development
    - Bloom's Taxonomy
    - Feynman Technique

  communication:
    - Pyramid Principle (Minto)
    - AIDA (Attention, Interest, Desire, Action)
    - Story Arc (Hero's Journey)
    - Rule of Three
    - Contrast Principle
```

**For Each Match Found:**

```yaml
model_match:
  id: "MM-001"
  model_name: "Second-Order Thinking"
  model_category: "decision_making"
  match_level: "pattern"  # direct | pattern | structural
  confidence: 0.82

  expert_application:
    description: |
      Expert applies second-order thinking specifically to pricing decisions:
      "If I lower the price, more people buy (first order), but the customer
      quality drops and support costs rise (second order), which actually
      makes the business worse."
    novel_twist: |
      Expert adds a TIME dimension: "The second-order effects don't show up
      for 3-6 months, which is why most people miss them."
    domain_specific: true
    domain: "pricing strategy"

  evidence:
    fragment_ids: ["TK-003", "TK-007", "TK-015"]
    primary_quote: "Everyone focuses on what happens next. I focus on what happens after what happens next."
    supporting_quotes:
      - "The second-order effects of lowering price don't show up for 6 months..."
    timestamps: ["[00:15:30]", "[00:42:10]", "[01:03:45]"]

  teaching_potential:
    can_be_taught: true
    requires_experience: "medium"
    example_richness: "high"
```

**Checkpoint:** All matches documented with evidence and confidence scores

---

### Step 3: Identify NOVEL Frameworks (10-15 min)

**Agent Activity:**
- Review fragments and heuristics that did NOT match any known model
- Look for PATTERNS among unmatched fragments:
  - Do 3+ fragments describe parts of a single unknown framework?
  - Do multiple heuristics share a common structure or principle?
  - Is the expert using a unique lens that doesn't exist in the library?

**Novel Framework Identification Process:**

1. **Cluster unmatched fragments** by topic or principle
2. **Look for structure:**
   - Does the cluster have components? (parts that work together)
   - Does the cluster have a process? (steps in order)
   - Does the cluster have a principle? (underlying rule)
3. **Name the framework:**
   - Use the expert's own language if they named it
   - If unnamed, create a descriptive name (2-4 words)
   - Format: "[Concept] [Type]" (e.g., "Retention-First Growth Model")
4. **Define components:**
   - What are the parts/elements?
   - How do they relate to each other?
   - What is the core principle?
5. **Document application rules:**
   - When to use this framework
   - How to apply it step by step
   - What it predicts or produces
6. **Provide transcript evidence:**
   - Direct quotes supporting each component
   - Timestamps for verification

**Novel Framework Template:**

```yaml
novel_framework:
  id: "NF-001"
  name: "The Retention-First Growth Model"
  coined_by: "{expert name}"
  source_slug: "{slug}"

  core_principle: |
    Growth should never outpace retention. Before investing in customer
    acquisition, ensure the retention curve has stabilized. Growing a
    leaky bucket wastes acquisition budget on customers who will leave.

  components:
    - name: "Retention Baseline"
      description: "Measure and stabilize monthly retention before any growth investment"
      evidence: "TK-001, TK-005"

    - name: "Acquisition Gate"
      description: "Only unlock acquisition spending when retention >= 80% at month 3"
      evidence: "TK-008"

    - name: "Growth Multiplier"
      description: "Each 1% improvement in retention has 5x the impact of 1% improvement in acquisition"
      evidence: "TK-012, TK-015"

  application_rules:
    when_to_use: "Any recurring revenue business evaluating growth strategy"
    step_by_step:
      - "Measure current month-1, month-3, month-6 retention"
      - "If any metric is declining: STOP acquisition, fix retention"
      - "Identify top 3 churn reasons via customer interviews"
      - "Fix top churn reason, re-measure retention"
      - "Only resume acquisition when retention stabilizes"
    what_it_predicts: "Businesses that fix retention first grow 3-5x faster in 12 months"

  evidence:
    fragment_ids: ["TK-001", "TK-005", "TK-008", "TK-012", "TK-015"]
    key_quotes:
      - quote: "I've never seen a business succeed long-term that grew faster than it could retain."
        timestamp: "[00:23:15]"
      - quote: "Fix the bucket before you pour more water in."
        timestamp: "[00:45:30]"

  quality:
    novelty: "high"
    evidence_strength: "strong"
    actionability: "high"
    teaching_potential: "high"
    content_multiplication_potential: "very_high"

  related_known_models:
    - "Leaky Bucket Metaphor"
    - "Theory of Constraints (retention is the bottleneck)"
    - "Compounding (retention compounds, acquisition doesn't)"
```

**Minimum Requirements for Novel Framework:**
- At least 3 supporting fragments
- Clear core principle (not just a collection of tips)
- At least 2 defined components
- Application rules that someone could follow
- Direct transcript evidence

**Checkpoint:** All novel frameworks documented with components, rules, and evidence

---

### Step 4: Codify Practical Heuristics (5-8 min)

**Agent Activity:**
- Take all decision heuristics from tacit-knowledge.yaml
- Refine and standardize into production-quality heuristic cards
- Group heuristics by framework (attach to known/novel frameworks where possible)
- Identify standalone heuristics (valuable rules that don't fit a framework)

**Heuristic Card Template:**

```yaml
heuristic_card:
  id: "HC-001"
  name: "The Retention Check"
  category: "business_growth"
  parent_framework: "NF-001"  # or "MM-003" for known model, or null for standalone

  rule:
    trigger: "When evaluating whether to increase marketing spend"
    condition: "AND month-over-month retention is below 80% at month 3"
    action: "Freeze acquisition budget and redirect to retention improvement"
    expected_outcome: "Retention stabilizes within 2-3 months, then growth becomes efficient"

  specificity:
    trigger_clarity: "high"  # Can someone recognize the trigger?
    action_clarity: "high"    # Can someone execute the action?
    outcome_clarity: "medium"  # Is the outcome measurable?

  context:
    applies_to: "Recurring revenue businesses (SaaS, subscription, membership)"
    fails_when: "Marketplace businesses where retention dynamics differ"
    prerequisites: "Must have retention data available"
    expert_endorsement: "high"  # How confidently did the expert state this?

  evidence:
    quote: "Before you spend another dollar on ads, show me your retention curve."
    timestamp: "[00:28:40]"

  content_potential:
    tweetable: "Stop spending on growth until your retention curve is flat."
    thread_hook: "I reviewed 100+ businesses last year. The #1 mistake? Growing before retaining."
    post_angle: "Why your marketing budget is actually a retention budget"
```

**Heuristic Quality Gates:**
- Must have clear trigger (someone can recognize when to apply it)
- Must have specific action (someone can do it, not just "think about it")
- Must have evidence from transcript
- Must specify context/limitations (when it does NOT apply)

**Checkpoint:** All heuristics refined into production-quality cards

---

### Step 5: Cross-Reference and Connect (5 min)

**Agent Activity:**
- Build a connection map between all identified frameworks, models, and heuristics
- Identify:
  1. **Reinforcing connections:** Framework A supports Framework B
  2. **Contradictions:** Heuristic X seems to conflict with Model Y (resolve with context)
  3. **Hierarchies:** Some frameworks are sub-frameworks of larger models
  4. **Gaps:** Areas where the expert has heuristics but no framework (opportunity for novel framework)

**Connection Map:**

```yaml
connections:
  reinforcing:
    - from: "NF-001 (Retention-First Growth)"
      to: "MM-003 (Second-Order Thinking)"
      relationship: "Retention-First IS an application of Second-Order Thinking to growth"

  hierarchies:
    - parent: "NF-001 (Retention-First Growth)"
      children:
        - "HC-001 (The Retention Check)"
        - "HC-004 (The Churn Audit)"
        - "HC-007 (The Growth Gate)"

  contradictions: []  # or list with resolution context

  gaps:
    - area: "Team building"
      heuristics_without_framework: ["HC-009", "HC-012"]
      opportunity: "Potential novel framework about team scaling"
```

**Checkpoint:** Connection map complete, no unresolved contradictions

---

### Step 6: Rate Framework Quality and Prioritize (3 min)

**Agent Activity:**
- Score each framework/model/heuristic on composite quality:

```yaml
quality_scoring:
  dimensions:
    novelty:
      weight: 0.25
      scale: "1-10 (1=commonly known, 10=never articulated before)"

    evidence_strength:
      weight: 0.25
      scale: "1-10 (1=pure inference, 10=expert stated directly with examples)"

    actionability:
      weight: 0.25
      scale: "1-10 (1=theoretical, 10=apply today with clear steps)"

    content_multiplication_potential:
      weight: 0.25
      scale: "1-10 (1=single use, 10=generates 30+ content pieces)"
```

- Rank all outputs by composite score
- Flag top 3 frameworks as "priority for content multiplication"
- Flag any frameworks with score < 5 as "low confidence, needs validation"

**Checkpoint:** All items scored and prioritized

---

### Step 7: Generate Framework Catalog (3 min)

**Agent Activity:**
- Compile all outputs into three structured files
- Generate executive summary of findings
- Create visual framework map (text-based)

**Checkpoint:** All output files written and validated

---

## Outputs

### Primary Outputs

**1. Framework Catalog**
- Format: YAML
- Location: `outputs/distillery/{slug}/frameworks.yaml`
- Content: All novel frameworks with components, rules, evidence, and quality scores

**2. Heuristic Catalog**
- Format: YAML
- Location: `outputs/distillery/{slug}/heuristics.yaml`
- Content: All refined heuristic cards with trigger/condition/action/outcome

**3. Known Models Matched**
- Format: YAML
- Location: `outputs/distillery/{slug}/models-matched.yaml`
- Content: All known mental model matches with expert's specific application and evidence

### Secondary Outputs

**4. Framework Summary**
- Format: Markdown
- Location: `outputs/distillery/{slug}/framework-summary.md`
- Content: Human-readable narrative of all frameworks found, their connections, and top recommendations

**5. Connection Map**
- Format: YAML
- Location: `outputs/distillery/{slug}/framework-connections.yaml`
- Content: Relationships between frameworks, hierarchies, reinforcements, and gaps

---

## Validation

### Checklist

- [ ] All tacit knowledge fragments reviewed (none skipped)
- [ ] Known mental model matching attempted across all categories
- [ ] Each model match has evidence from transcript (not assumed)
- [ ] Novel framework identification attempted on unmatched fragments
- [ ] Each novel framework has >= 3 supporting fragments
- [ ] Each novel framework has defined components and application rules
- [ ] All heuristics refined into card format (trigger/condition/action/outcome)
- [ ] Heuristics attached to parent frameworks where applicable
- [ ] Cross-reference connections mapped (reinforcing, hierarchies, contradictions)
- [ ] Quality scores assigned to all items
- [ ] Top 3 priority frameworks identified for content multiplication
- [ ] At least 5 total frameworks (known + novel) per hour of source content
- [ ] At least 1 novel framework identified (or documented why none found)
- [ ] All output files valid YAML and complete

### Success Criteria

**Threshold: 11/14 on checklist above**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Framework density** | 8+ frameworks per hour of content | 5-7 frameworks/hour | < 5 frameworks/hour |
| **Novel frameworks** | 2+ novel frameworks with strong evidence | 1 novel framework | 0 novel frameworks |
| **Model match accuracy** | Matches intuitively correct, expert would agree | Mostly correct, 1-2 stretches | Forced matches, weak connections |
| **Heuristic quality** | Clear trigger/action, someone could apply immediately | Mostly clear, some vague | Vague, not actionable |
| **Evidence strength** | Every framework backed by 3+ direct quotes | Most have 2+ quotes | Frameworks based on inference only |
| **Connection depth** | Rich connection map showing how frameworks relate | Basic connections noted | No connections mapped |

---

## Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| **Input Loading + Context** | 3 min | Read tacit knowledge + metadata |
| **Known Model Matching** | 10-15 min | Search across 100+ model library |
| **Novel Framework ID** | 10-15 min | Deepest creative work |
| **Heuristic Codification** | 5-8 min | Standardize to card format |
| **Cross-Reference** | 5 min | Build connection map |
| **Quality Scoring** | 3 min | Score and prioritize |
| **Output Generation** | 3 min | Write all files |
| **Total (1-hour transcript)** | 35-50 min | Depends on knowledge density |

---

## Integration

### Feeds To

**Workflow:** Content Distillery Pipeline (content-distillery/full-distillery-pipeline)

**Next Tasks in Sequence:**
- **Task 4:** progressive-summarize - Uses: frameworks.yaml (for Layer 3 highlighting)
- **Task 5:** multiply-ideas - Uses: frameworks.yaml, heuristics.yaml (primary input for content generation)

### Depends On

- **Task 2:** extract-tacit-knowledge - Provides: tacit-knowledge.yaml

### Agent Routing

**Primary Agent:** model-identifier (Shane Parrish methodology specialist)
**Supporting Agent:** tacit-extractor (for clarifying ambiguous fragments)
**Quality Review:** distillery-chief (validates framework quality)

---

## Quality Threshold

**Pass/Fail Gate:** Checklist score >= 11/14

If < 11/14:
1. If framework density low: lower matching threshold, look for micro-frameworks
2. If novel frameworks missing: review unmatched fragments more creatively
3. If evidence weak: return to transcript for additional supporting quotes
4. If heuristics vague: add specific examples and context constraints
5. Re-validate

**Common Failure Reasons:**
- Source content is mostly motivational (feelings, not frameworks)
- Expert knowledge is too domain-specific to map to general models
- Tacit knowledge extraction was too shallow (insufficient fragments)
- Over-matching: forcing fragments into models that don't fit
- Under-matching: missing models because of narrow library search

---

## Related Tasks

- **Task 1:** ingest-youtube (provides raw transcript)
- **Task 2:** extract-tacit-knowledge (provides fragments and heuristics for this task)
- **Task 4:** progressive-summarize (uses frameworks for highlighting)
- **Task 5:** multiply-ideas (primary consumer of this task's output)
- **Task 6:** distill-single-live (orchestrates this as step 3)

---

## Notes for Executor

### Avoiding Over-Matching

The most common error is FORCING fragments into known models. Signs of over-matching:
- The match requires ignoring part of what the expert said
- The model name fits but the expert's application diverges significantly
- You need to stretch the definition of the model to make it fit

When in doubt: classify as a novel framework rather than a forced match. A new framework named after the expert's own language is more valuable than a tenuous connection to a famous model.

### When the Expert Has Named Their Own Framework

If the expert uses a specific name for their approach (e.g., Hormozi's "Value Equation"), ALWAYS use their name. Do not rename it to a known model even if it overlaps. Document both the expert's name and the known model it resembles.

### When No Novel Frameworks Are Found

This is acceptable IF:
- The content was mostly application of known models (expert is a teacher, not an innovator)
- The content was interview format (less framework density than monologue)
- Document WHY no novel frameworks were found in the framework summary

### Domain-Specific Models

Some models only exist within specific domains. When the expert's domain is specialized:
- Search domain-specific model libraries (e.g., SaaS metrics, growth hacking, etc.)
- A "novel" framework might actually be well-known in the expert's niche
- Note domain specificity in the framework catalog

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

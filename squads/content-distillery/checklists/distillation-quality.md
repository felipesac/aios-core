# Distillation Quality Checklist

Use this checklist to validate each distillation output before marking as complete.

---

## QG-001: Transcription Valid

- [ ] Transcript file exists and is non-empty
- [ ] Quality score >= 90%
- [ ] Timestamps are preserved and accurate
- [ ] Speaker identification attempted (if multi-speaker)
- [ ] Metadata file exists (title, duration, channel, URL, date)
- [ ] No truncation (full duration covered)
- [ ] Language detected correctly
- [ ] Encoding is UTF-8

**Blocking:** YES - Cannot proceed without valid transcription.

---

## QG-002: Extraction Complete

- [ ] Minimum 5 knowledge fragments extracted
- [ ] Each fragment has evidence (direct quote + timestamp)
- [ ] Knowledge type classified (relational, somatic, collective)
- [ ] Confidence score assigned to each fragment (1-10)
- [ ] No fragment is a trivial observation (must be expert-level insight)
- [ ] Minimum 3 frameworks identified
- [ ] Each framework has:
  - [ ] Name
  - [ ] Components listed
  - [ ] Application rules defined
  - [ ] Evidence from transcript
- [ ] Heuristics extracted (if present) follow "if X then Y" format
- [ ] Cross-reference against known models attempted

**Blocking:** YES - Cannot distill without sufficient extracted material.

---

## QG-003: Distillation Validated

- [ ] All 5 progressive summarization layers complete
- [ ] Layer 2 is ~20-30% of Layer 1 length
- [ ] Layer 3 is ~10-15% of Layer 1 length
- [ ] Layer 4 (executive summary) is 500-1000 words
- [ ] Layer 5 (remix) is 200-400 words in original voice
- [ ] Layer 4 contains: themes, frameworks, heuristics, takeaways
- [ ] Layer 5 adds original perspective (not just rephrasing)
- [ ] PARA classification applied to all items
- [ ] Intermediate packets identified and tagged
- [ ] Knowledge base entry created/updated

**Blocking:** YES - Cannot derive content from incomplete distillation.

---

## QG-004: Content Reviewed

- [ ] Minimum 15 content pieces generated
- [ ] Each piece passes standalone value test
- [ ] 4A framework applied (all 4 angles present for top frameworks)
- [ ] Platform-specific formatting applied
- [ ] Hooks present on all pieces
- [ ] CTAs present on all pieces
- [ ] No factual errors or misquotes
- [ ] Source attribution included
- [ ] Tone appropriate for target platform
- [ ] No duplicate content across pieces

**Blocking:** YES - Cannot publish unreviewed content.

---

## QG-005: YouTube Ready

- [ ] CCN Rule satisfied:
  - [ ] Core viewers: Provides depth
  - [ ] Casual viewers: Accessible
  - [ ] New viewers: Understandable without context
- [ ] Title options (5+) with CTR scoring
- [ ] Thumbnail brief with:
  - [ ] Key visual element defined
  - [ ] Text overlay (max 4 words)
  - [ ] Emotion/expression specified
  - [ ] Color contrast noted
- [ ] Description optimized (keywords, links, timestamps)
- [ ] Tags defined (10-15)
- [ ] Video structure defined (hook → content → CTA)
- [ ] Optimal publish time recommended

**Blocking:** NO (advisory) - Content can be published without YouTube optimization.

---

## Overall Distillation Score

| Dimension | Score (1-10) | Weight | Weighted |
|-----------|-------------|--------|----------|
| Transcript Quality | __ | 0.15 | __ |
| Extraction Depth | __ | 0.25 | __ |
| Framework Novelty | __ | 0.20 | __ |
| Distillation Clarity | __ | 0.15 | __ |
| Content Actionability | __ | 0.15 | __ |
| Platform Readiness | __ | 0.10 | __ |
| **TOTAL** | | | **/10** |

**Minimum passing score: 7.0/10**

---

## Sign-off

| Role | Status | Date |
|------|--------|------|
| tacit-extractor | {pass/fail} | {date} |
| model-identifier | {pass/fail} | {date} |
| knowledge-architect | {pass/fail} | {date} |
| content-atomizer | {pass/fail} | {date} |
| distillery-chief | {pass/fail} | {date} |

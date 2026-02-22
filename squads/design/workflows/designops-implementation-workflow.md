# designops-implementation-workflow

> Complete workflow for implementing DesignOps in an organization, from initial assessment through full operational maturity.

## Overview

This workflow guides the end-to-end implementation of DesignOps using Dave Malouf's frameworks. It progresses through five phases: Assessment, Roadmap, Tooling & Process, Metrics, and Continuous Improvement.

## Workflow Metadata

```yaml
name: DesignOps Implementation
version: 1.0
agent: dave-malouf
duration: 6-18 months (depending on starting point and scope)
phases: 5
dependencies:
  tasks:
    - designops-maturity-assessment.md
    - design-team-scaling.md
    - design-tooling-audit.md
    - design-process-optimization.md
    - designops-metrics-setup.md
  checklists:
    - designops-maturity-checklist.md
    - design-team-health-checklist.md
```

## Prerequisites

- Executive sponsorship or leadership support
- Time and resources allocated
- Willingness to change
- Access to design team and stakeholders

## Malouf Principles Guiding This Workflow

1. **"Operations enable creativity"** - Every implementation should reduce friction
2. **"You can't skip maturity levels"** - Progress incrementally
3. **"Measure before optimizing"** - Baseline everything
4. **"Three Lenses"** - Address Work, Grow, Thrive holistically
5. **"Governance over tools"** - Process clarity before tool selection

---

## PHASE 1: ASSESSMENT

> Duration: 2-4 weeks
> Objective: Understand current state and define success

### Phase 1.1: Discovery

**Activities:**
```yaml
step: 1.1.1
name: "Stakeholder Mapping"
actions:
  - Identify key stakeholders (design leadership, designers, partners)
  - Map decision-makers and influencers
  - Understand organizational dynamics
  - Schedule discovery sessions
output: "Stakeholder map with roles and relationships"
```

```yaml
step: 1.1.2
name: "Data Gathering"
actions:
  - Collect existing documentation (processes, org charts, tools)
  - Gather quantitative data (headcount, tool costs, project metrics)
  - Review previous surveys or feedback
  - Document current state artifacts
output: "Data inventory and initial findings"
```

### Phase 1.2: Maturity Assessment

**Activities:**
```yaml
step: 1.2.1
name: "Three Lenses Assessment"
task: "designops-maturity-assessment.md"
actions:
  - Conduct designer interviews (3-5 at different levels)
  - Interview design leadership
  - Interview cross-functional partners
  - Use designops-maturity-checklist.md
output: "Maturity scores for each lens"
```

```yaml
step: 1.2.2
name: "Gap Analysis"
actions:
  - Compare current state to target state
  - Identify highest-impact gaps
  - Prioritize using impact/effort matrix
  - Validate with stakeholders
output: "Prioritized gap list"
```

### Phase 1.3: Goal Setting

**Activities:**
```yaml
step: 1.3.1
name: "Define Success"
actions:
  - Set target maturity level (realistic, incremental)
  - Define 12-month goals
  - Align on success metrics
  - Get leadership sign-off
questions:
  - "What does success look like in 12 months?"
  - "What maturity level is realistic?"
  - "How will we measure progress?"
output: "Documented goals and success criteria"
```

### Phase 1 Deliverables

| Deliverable | Format | Owner |
|-------------|--------|-------|
| Stakeholder Map | Diagram | DesignOps Lead |
| Maturity Assessment Report | Document | DesignOps Lead |
| Gap Analysis | Prioritized list | DesignOps Lead |
| Goals and Success Criteria | Document | Design Leadership |

### Phase 1 Exit Criteria

- [ ] Maturity level quantified for all three lenses
- [ ] Top 5-10 gaps prioritized
- [ ] 12-month goals defined and approved
- [ ] Stakeholder alignment achieved

---

## PHASE 2: ROADMAP

> Duration: 2-3 weeks
> Objective: Create actionable implementation plan

### Phase 2.1: Roadmap Development

**Activities:**
```yaml
step: 2.1.1
name: "Sequence Initiatives"
actions:
  - Group gaps into workstreams
  - Identify dependencies
  - Sequence based on priorities and dependencies
  - Assign rough timelines
template: |
  WORKSTREAM SEQUENCING

  Workstream 1: [Name]
  - Gap A (Q1)
  - Gap B (Q2) - depends on Gap A

  Workstream 2: [Name]
  - Gap C (Q1) - parallel to Gap A
  - Gap D (Q3)
```

```yaml
step: 2.1.2
name: "Resource Planning"
actions:
  - Identify required resources (people, budget, tools)
  - Map current availability
  - Identify gaps in resources
  - Plan resource acquisition
output: "Resource plan"
```

```yaml
step: 2.1.3
name: "Build Quarterly Plan"
template: |
  Q1: FOUNDATION
  Theme: [Quick wins + foundation building]
  Initiatives:
    - [ ] [Initiative 1] - Owner: [X]
    - [ ] [Initiative 2] - Owner: [X]
  Success Metrics:
    - [Metric]: [Target]

  Q2: BUILD
  Theme: [Core capability building]
  Initiatives:
    - [ ] [Initiative 1] - Owner: [X]
    - [ ] [Initiative 2] - Owner: [X]
  Success Metrics:
    - [Metric]: [Target]

  Q3: SCALE
  Theme: [Expanding adoption]
  Initiatives:
    - [ ] [Initiative 1] - Owner: [X]
    - [ ] [Initiative 2] - Owner: [X]
  Success Metrics:
    - [Metric]: [Target]

  Q4: OPTIMIZE
  Theme: [Measurement and optimization]
  Initiatives:
    - [ ] [Initiative 1] - Owner: [X]
    - [ ] [Initiative 2] - Owner: [X]
  Success Metrics:
    - [Metric]: [Target]
```

### Phase 2.2: Communication Plan

**Activities:**
```yaml
step: 2.2.1
name: "Stakeholder Communication"
actions:
  - Create executive summary for leadership
  - Develop team communication
  - Plan regular updates cadence
  - Identify change champions
output: "Communication plan and materials"
```

### Phase 2 Deliverables

| Deliverable | Format | Owner |
|-------------|--------|-------|
| 12-Month Roadmap | Document/Diagram | DesignOps Lead |
| Quarterly Plans | Detailed plans | DesignOps Lead |
| Resource Plan | Spreadsheet | DesignOps Lead |
| Communication Plan | Document | DesignOps Lead |

### Phase 2 Exit Criteria

- [ ] Roadmap approved by leadership
- [ ] Resources committed or plan to acquire
- [ ] Communication plan ready
- [ ] Team aware and aligned

---

## PHASE 3: TOOLING & PROCESS

> Duration: 3-6 months (ongoing)
> Objective: Build operational foundation

### Phase 3.1: Governance First

**Activities:**
```yaml
step: 3.1.1
name: "Establish Governance"
principle: "Governance over tools - process clarity matters more than tool selection"
actions:
  - Define decision rights (who decides what)
  - Establish standards ownership
  - Create escalation paths
  - Document governance framework
output: "Governance framework document"
```

```yaml
step: 3.1.2
name: "Define Core Processes"
task: "design-process-optimization.md"
priority_order:
  1: "Design workflow (brief to handoff)"
  2: "Design review process"
  3: "Handoff process"
  4: "Design system contribution"
output: "Documented processes with owners"
```

### Phase 3.2: Tool Optimization

**Activities:**
```yaml
step: 3.2.1
name: "Tool Audit"
task: "design-tooling-audit.md"
actions:
  - Inventory current tools
  - Assess usage and satisfaction
  - Identify gaps and overlaps
  - Make keep/change/add decisions
output: "Tool strategy document"
```

```yaml
step: 3.2.2
name: "Tool Implementation"
actions:
  - Implement tool changes (sequenced)
  - Develop usage guidelines
  - Create training materials
  - Roll out with support
output: "Standardized tool stack"
```

### Phase 3.3: How We Grow Infrastructure

**Activities:**
```yaml
step: 3.3.1
name: "Hiring Infrastructure"
actions:
  - Standardize interview process
  - Create portfolio review rubric
  - Document hiring workflow
  - Train interviewers
output: "Hiring playbook"
```

```yaml
step: 3.3.2
name: "Onboarding Program"
actions:
  - Design 90-day program
  - Create onboarding materials
  - Establish buddy/mentor system
  - Build tool training curriculum
output: "Onboarding program"
```

```yaml
step: 3.3.3
name: "Career Framework"
actions:
  - Define or refine career ladder
  - Create skills matrix
  - Document promotion criteria
  - Train managers on career conversations
output: "Career framework"
```

### Phase 3.4: How We Thrive Infrastructure

**Activities:**
```yaml
step: 3.4.1
name: "Community Program"
actions:
  - Establish design guild/community
  - Schedule regular critiques
  - Plan show and tell cadence
  - Create knowledge sharing channels
output: "Community program"
```

```yaml
step: 3.4.2
name: "Recognition Program"
actions:
  - Define recognition mechanisms
  - Create celebration rituals
  - Document and communicate
output: "Recognition program"
```

### Phase 3 Deliverables

| Deliverable | Format | Owner |
|-------------|--------|-------|
| Governance Framework | Document | DesignOps Lead |
| Process Documentation | Wiki/Docs | DesignOps Lead |
| Tool Strategy | Document | DesignOps Lead |
| Hiring Playbook | Document | DesignOps Lead |
| Onboarding Program | Program materials | DesignOps Lead |
| Career Framework | Document | Design Leadership |
| Community Program | Program plan | DesignOps Lead |

### Phase 3 Exit Criteria

- [ ] Core processes documented and adopted
- [ ] Tool stack standardized (>80% adoption)
- [ ] Hiring process standardized
- [ ] Onboarding program live
- [ ] Career framework published
- [ ] Community rituals established

---

## PHASE 4: METRICS & MEASUREMENT

> Duration: 2-4 weeks setup, then ongoing
> Objective: Establish measurement system

### Phase 4.1: Metrics Setup

**Activities:**
```yaml
step: 4.1.1
name: "Define Metrics Stack"
task: "designops-metrics-setup.md"
actions:
  - Select output metrics (3-5)
  - Select outcome metrics (3-5)
  - Select impact metrics (2-3)
  - Define targets for each
output: "Metrics catalog with targets"
```

```yaml
step: 4.1.2
name: "Build Data Collection"
actions:
  - Identify data sources
  - Set up automated collection where possible
  - Create manual collection processes
  - Establish baseline measurements
output: "Data collection system"
```

```yaml
step: 4.1.3
name: "Create Reporting"
actions:
  - Design dashboard template
  - Create reporting cadence
  - Assign reporting owners
  - Establish review rituals
output: "Reporting system"
```

### Phase 4.2: Baseline and Targets

**Activities:**
```yaml
step: 4.2.1
name: "Measure Baseline"
actions:
  - Collect baseline data for all metrics
  - Document starting point
  - Identify data quality issues
  - Create tracking system
output: "Baseline measurements"
```

```yaml
step: 4.2.2
name: "Set Improvement Targets"
actions:
  - Set realistic targets based on baseline
  - Align targets with roadmap
  - Get leadership sign-off
  - Communicate targets to team
output: "Target documentation"
```

### Phase 4 Deliverables

| Deliverable | Format | Owner |
|-------------|--------|-------|
| Metrics Catalog | Document | DesignOps Lead |
| Data Collection Plan | Document | DesignOps Lead |
| Dashboard | Tool/Spreadsheet | DesignOps Lead |
| Baseline Report | Document | DesignOps Lead |
| Targets | Document | Design Leadership |

### Phase 4 Exit Criteria

- [ ] Metrics defined and documented
- [ ] Data collection established
- [ ] Baseline measurements complete
- [ ] Targets set and communicated
- [ ] Reporting cadence operational

---

## PHASE 5: CONTINUOUS IMPROVEMENT

> Duration: Ongoing
> Objective: Sustain and improve DesignOps

### Phase 5.1: Operating Rhythm

**Activities:**
```yaml
step: 5.1.1
name: "Establish Operating Rhythm"
cadences:
  weekly:
    - DesignOps team sync
    - Output metrics review
  monthly:
    - Design leadership review
    - Team health check (checklist)
    - Process improvement cycle
  quarterly:
    - Maturity re-assessment
    - Roadmap review and adjustment
    - Stakeholder business review
    - Strategic planning
```

```yaml
step: 5.1.2
name: "Feedback Loops"
actions:
  - Establish designer feedback channel
  - Create process improvement request system
  - Schedule regular retrospectives
  - Monitor health indicators
```

### Phase 5.2: Maturity Progression

**Activities:**
```yaml
step: 5.2.1
name: "Quarterly Maturity Review"
checklist: "designops-maturity-checklist.md"
actions:
  - Re-assess maturity scores
  - Compare to baseline and targets
  - Identify new gaps
  - Adjust roadmap as needed
```

```yaml
step: 5.2.2
name: "Annual Planning"
actions:
  - Review year's progress
  - Celebrate achievements
  - Set next year's maturity target
  - Plan major initiatives
```

### Phase 5 Operating Model

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGNOPS OPERATING MODEL                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Weekly         Monthly          Quarterly       Annual     │
│  ─────────     ──────────       ───────────    ─────────   │
│                                                             │
│  Team sync  →  Leadership   →   Maturity    →  Strategic   │
│  Metrics       review           assessment     planning     │
│  review        Health check     Roadmap                     │
│                Improvements     review                      │
│                                 Business                    │
│                                 review                      │
│                                                             │
│  ↑                                                     ↓    │
│  └─────────────── Continuous Feedback Loop ─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5 Success Criteria

- [ ] Operating rhythm established and followed
- [ ] Metrics reviewed and acted upon regularly
- [ ] Maturity improving quarter over quarter
- [ ] Team satisfaction high
- [ ] Stakeholder satisfaction high
- [ ] DesignOps seen as valuable

---

## WORKFLOW TIMELINE SUMMARY

```
Month  1   2   3   4   5   6   7   8   9   10  11  12
       │   │   │   │   │   │   │   │   │   │   │   │
Phase 1 ████
        Assessment

Phase 2     ███
            Roadmap

Phase 3         ████████████████████████
                Tooling & Process (ongoing)

Phase 4                     ████
                            Metrics Setup

Phase 5                         ████████████████████ → ongoing
                                Continuous Improvement
```

## RISK MITIGATION

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Leadership support wanes | Medium | High | Regular value communication |
| Resources pulled | Medium | High | Quick wins early, visible impact |
| Team resistance | Medium | Medium | Involvement, communication, pilots |
| Scope creep | High | Medium | Clear priorities, governance |
| Measuring wrong things | Medium | Medium | Regular metric review |

## SUCCESS FACTORS

1. **Executive sponsorship** - Visible support from top
2. **Quick wins early** - Build momentum
3. **Involvement** - Co-create with designers
4. **Communication** - Constant, clear updates
5. **Measurement** - Show progress with data
6. **Patience** - Maturity takes time

---

## HANDOFF TO ONGOING OPERATIONS

After initial implementation (12-18 months), DesignOps transitions to:

### Steady State Operations
- Operating rhythm established
- Metrics reviewed regularly
- Continuous improvement cycles
- Annual maturity assessments
- Strategic planning cycle

### Ongoing Focus Areas
1. Maintaining and improving maturity
2. Supporting scaling/growth
3. Innovation in operations
4. Industry engagement
5. Continuous optimization

---

> "Operations enable creativity - we remove friction so designers can focus on design." - Dave Malouf

This workflow is a guide, not a prescription. Adapt timelines and activities to your context. The goal is sustainable DesignOps that serves designers and the organization.

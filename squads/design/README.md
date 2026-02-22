# 🎨 Design Squad - Elite Minds for Visual Design

**Version:** 3.0.0
**Command:** `/Design`
**Type:** Specialist Squad
**Independence:** ✅ 100% Self-Contained

---

## Overview

The Design Squad is a **complete team of 9 expert agents** covering all aspects of visual design:

- **Brand Strategy** - Building differentiated, memorable brands
- **DesignOps** - Scaling design organizations efficiently
- **Design Business** - Pricing, proposals, and client management
- **Logo Design** - Creating timeless, simple logos
- **Thumbnails/YouTube** - Optimizing for clicks and CTR
- **Photography** - Professional lighting and composition
- **Photo Editing** - Color grading and visual storytelling
- **Design Systems** - Atomic design and component architecture

---

## Tier System

### 🎯 Orchestrator

| Agent | Command | Specialty |
|-------|---------|-----------|
| **Design Chief** | `@design-chief` | Routes requests to the right specialist |

### Tier 0 - Foundation (Entry Points)

| Agent | Command | Specialty |
|-------|---------|-----------|
| **Marty Neumeier** | `@marty-neumeier` | Brand Strategy, Differentiation, Zag |
| **Dave Malouf** | `@dave-malouf` | DesignOps, Team Scaling, Maturity |

### Tier 1 - Masters (Execution)

| Agent | Command | Specialty |
|-------|---------|-----------|
| **Chris Do** | `@chris-do` | Value-Based Pricing, Proposals |
| **Paddy Galloway** | `@paddy-galloway` | YouTube Thumbnails, CTR Optimization |
| **Joe McNally** | `@joe-mcnally` | Photography Lighting, Flash |

### Tier 2 - Specialists (Deep Expertise)

| Agent | Command | Specialty |
|-------|---------|-----------|
| **Brad Frost** | `@brad-frost` | Design Systems, Atomic Design |
| **Aaron Draplin** | `@aaron-draplin` | Logo Design, Simplification |
| **Peter McKinnon** | `@peter-mckinnon` | Photo Editing, Color Grading |

---

## Quick Start

```bash
# Activate Design Squad (routes to Design Chief)
/Design

# Or activate a specific agent directly
/Design:agents:chris-do      # Value-based pricing
/Design:agents:marty-neumeier # Brand strategy
/Design:agents:brad-frost     # Design systems
```

---

## Routing Guide

Tell Design Chief what you need:

| Request Type | Routed To |
|--------------|-----------|
| "Preciso criar uma marca" | @marty-neumeier |
| "Quero escalar meu time de design" | @dave-malouf |
| "Como precificar meu projeto?" | @chris-do |
| "Preciso de um logo" | @aaron-draplin |
| "Melhorar thumbnails do YouTube" | @paddy-galloway |
| "Setup de iluminação para foto" | @joe-mcnally |
| "Editar/color grade minhas fotos" | @peter-mckinnon |
| "Criar design system" | @brad-frost |

---

## Agent Details

### 🎯 Design Chief (Orchestrator)

**Commands:**
- `*route {description}` - Route to the right specialist
- `*workflow {type}` - Start multi-agent workflow
- `*agents` - List all available agents
- `*status` - Current project status

---

### 📊 Marty Neumeier - Brand Strategy

**Frameworks:** 5 Disciplines, Zag (17 steps), Brand Gap, Brand Flip

**Commands:**
- `*brand-audit` - Evaluate brand strength
- `*zag` - Find radical differentiation
- `*positioning` - Define unique positioning
- `*brand-gap` - Identify strategy-creativity gaps
- `*brand-flip` - Transform to customer-centric

---

### ⚙️ Dave Malouf - DesignOps

**Frameworks:** Three Lenses, Maturity Model, Metrics Stack, Team Topology

**Commands:**
- `*ops-audit` - Assess DesignOps maturity
- `*maturity-assessment` - Measure current vs target level
- `*metrics-stack` - Define output/outcome/impact metrics
- `*scale-design` - Create scaling plan
- `*team-topology` - Evaluate ideal structure

---

### 💰 Chris Do - Design Business

**Frameworks:** Value-Based Pricing, IDEA Method, Diagnosis Approach

**Commands:**
- `*price-project` - Price based on value delivered
- `*diagnose` - Discovery session with client
- `*proposal` - Generate structured proposal
- `*scope-defense` - Handle scope creep
- `*objection-handle` - Handle price objections

---

### 🔥 Aaron Draplin - Logo Design

**Frameworks:** The Draplin Way, Thick Lines, Badge Methodology

**Commands:**
- `*logo-brief` - Collect complete brief
- `*sketch-concepts` - Generate 10-20 quick concepts
- `*simplify` - Apply reduction process
- `*badge-it` - Transform to emblem style
- `*presentation` - Structure client presentation

---

### 📊 Paddy Galloway - Thumbnails/YouTube

**Frameworks:** Glance Test, Psychology-over-Design, ABC Testing

**Commands:**
- `*thumb-audit` - Audit existing thumbnails
- `*concept-batch` - Generate 10-20 concepts
- `*glance-test` - Validate 0.5s impact
- `*ab-strategy` - Create A/B test plan
- `*emotion-map` - Map emotional triggers

---

### 📸 Joe McNally - Photography Lighting

**Frameworks:** Big Three (Direction, Quality, Color), Layered Lighting, One Light

**Commands:**
- `*light-plan` - Plan lighting setup
- `*one-light` - Minimalist single light setup
- `*layer-build` - Build lighting in layers
- `*diagnose-light` - Analyze lighting problems
- `*diagram` - Generate lighting diagram

---

### ☕ Peter McKinnon - Photo Editing

**Frameworks:** Vintage 35mm Workflow, Color Grading, Batch Editing

**Commands:**
- `*edit-style` - Define editing style for mood
- `*vintage-35mm` - Apply complete vintage workflow
- `*batch-preset` - Create reusable preset
- `*color-grade` - Professional color grading
- `*before-after` - Document transformation

---

### 🎨 Brad Frost - Design Systems

**Frameworks:** Atomic Design, Token-based Styling, WCAG Compliance

**Commands:**
- `*audit {path}` - Scan codebase for patterns
- `*consolidate` - Reduce via clustering
- `*tokenize` - Extract design tokens
- `*build {component}` - Generate component
- `*a11y-audit` - Accessibility audit

---

## Workflows

### Brand Development
```
@marty-neumeier (Strategy)
  → @aaron-draplin (Logo)
  → @marty-neumeier (Validation)
```

### YouTube Channel Optimization
```
@paddy-galloway (Thumbnail Strategy)
  → @peter-mckinnon (Photo Editing)
  → @paddy-galloway (Glance Test Validation)
```

### Product Photography
```
@joe-mcnally (Lighting Setup)
  → @peter-mckinnon (Post-Processing)
```

### Design Team Scaling
```
@dave-malouf (DesignOps Assessment)
  → @brad-frost (Design System Implementation)
```

### Project Pricing
```
@chris-do (Value-Based Pricing)
  → [Any specialist for execution]
```

---

## Project Structure

```
squads/design/
├── agents/
│   ├── design-chief.md      # Orchestrator (983 lines)
│   ├── brad-frost.md        # Design Systems (832 lines)
│   ├── marty-neumeier.md    # Brand Strategy (1,542 lines)
│   ├── dave-malouf.md       # DesignOps (2,270 lines)
│   ├── chris-do.md          # Design Business (1,866 lines)
│   ├── aaron-draplin.md     # Logo Design (1,721 lines)
│   ├── paddy-galloway.md    # Thumbnails (1,966 lines)
│   ├── joe-mcnally.md       # Photography (1,634 lines)
│   └── peter-mckinnon.md    # Photo Editing (1,903 lines)
├── tasks/                    # 45+ design tasks
├── templates/                # 10 templates
├── checklists/               # 11 quality checklists
├── data/                     # 9 knowledge base files
├── workflows/                # 3 workflow orchestrations
├── config.yaml
└── README.md
```

---

## Why 100% Independent?

This squad has **zero external dependencies** because:

1. **Filesystem-only operations** - reads codebases, writes components
2. **In-memory algorithms** - pattern clustering, token extraction
3. **No database needed** - state stored in `.state.yaml`
4. **No cloud services** - everything runs locally
5. **Framework-agnostic** - works with any design project

**Share freely** with your team, students, or clients.

---

## Elite Minds Validation

All agents were validated with mind-research-loop:

| Mind | Area | Score | Tier |
|------|------|-------|------|
| Marty Neumeier | Brand Strategy | 15/15 | 0 |
| Dave Malouf | DesignOps | 14/15 | 0 |
| Chris Do | Design Business | 14/15 | 1 |
| Aaron Draplin | Logo Design | 13/15 | 2 |
| Paddy Galloway | Thumbnails | 13/15 | 1 |
| Joe McNally | Photography | 14/15 | 1 |
| Peter McKinnon | Photo Editing | 12/15 | 2 |

---

**Maintained By:** AIOS Team
**Last Updated:** 2026-02-02
**Total Agent Lines:** 14,717+ (including brad-frost.md)
**Independence:** ✅ 100% Self-Contained

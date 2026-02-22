# logo-quality-checklist

> **Logo Quality Validation Checklist** - Ensure logo meets all technical and aesthetic criteria
> Based on Aaron Draplin's validation methodology

## Checklist Definition

```yaml
checklist:
  name: logo-quality-checklist
  agent: aaron-draplin
  category: logo-design
  usage: "Run before finalizing any logo design"

  purpose: |
    Validate that a logo meets all quality criteria before delivery.
    Combines Draplin's core tests (Coin Test, B&W Test, etc.) with
    technical production requirements.

  when_to_use:
    - Before presenting concepts to client
    - Before finalizing approved direction
    - Before creating lockup system
    - Before final delivery
```

---

## Section 1: The Draplin Tests

> "If it doesn't work at the size of a coin, it doesn't work."

### 1.1 Coin Test (Scalability)

```markdown
## COIN TEST - Minimum Size Legibility

Display logo at 16x16 pixels (favicon size):

- [ ] Overall shape is recognizable
- [ ] Main elements are distinguishable
- [ ] Nothing becomes a blob or disappears
- [ ] Would work as a favicon

Display logo at 32x32 pixels:
- [ ] More detail visible
- [ ] All key elements clear
- [ ] Proportions maintained

Display logo at 64x64 pixels:
- [ ] Full clarity achieved
- [ ] All details visible
- [ ] Ready for social avatars

**TEST RESULT:** [ ] PASS  [ ] FAIL

If FAIL: Simplify further until it passes.
```

### 1.2 Black & White Test (Color Independence)

```markdown
## BLACK & WHITE TEST - Form Over Color

Convert logo to 100% black:

- [ ] All elements remain visible
- [ ] Hierarchy is maintained
- [ ] No confusion from missing color
- [ ] Logo still "reads" correctly
- [ ] No elements dependent on color differentiation

Test on white background:
- [ ] Clear and legible

Test on black background (reverse to white):
- [ ] Clear and legible
- [ ] No optical issues when reversed

**TEST RESULT:** [ ] PASS  [ ] FAIL

If FAIL: Logo relies too heavily on color. Rework form.
```

### 1.3 Squint Test (Silhouette Clarity)

```markdown
## SQUINT TEST - Silhouette Recognition

View logo from arm's length while squinting:

- [ ] Overall shape is clear
- [ ] Doesn't become an undefined blob
- [ ] Distinctive silhouette is evident
- [ ] Could recognize brand from silhouette alone
- [ ] Main shape is memorable

**TEST RESULT:** [ ] PASS  [ ] FAIL

If FAIL: Shape needs more definition or simplification.
```

### 1.4 Memory Test (Memorability)

```markdown
## MEMORY TEST - 3-Second Recall

Show logo to someone unfamiliar for 3 seconds, then hide:

Ask them to describe what they saw:
- [ ] They can describe the main shape
- [ ] They remember the primary element
- [ ] They don't confuse it with another logo
- [ ] Key feature is mentioned

Ask them to draw a rough sketch:
- [ ] Basic shape is accurate
- [ ] Key element is present
- [ ] Essential form captured

**TEST RESULT:** [ ] PASS  [ ] FAIL

If FAIL: Logo is not memorable enough. Strengthen distinctive element.
```

### 1.5 Embroidery Test (Reproducibility)

```markdown
## EMBROIDERY TEST - Production Viability

Could this logo be stitched on a hat or polo?

Line quality:
- [ ] No lines thinner than embroidery thread (~0.5mm)
- [ ] Consistent stroke weights
- [ ] No hairlines

Detail level:
- [ ] No tiny details that would clog
- [ ] No intricate internal patterns
- [ ] Simplified enough for thread

Color count:
- [ ] Maximum 6 thread colors (ideally 3-4)
- [ ] Clear color separation
- [ ] No gradients

Construction:
- [ ] Clear satin stitch areas
- [ ] Definable fill areas
- [ ] Logical stitch direction

**TEST RESULT:** [ ] PASS  [ ] FAIL

If FAIL: Simplify for production or create separate embroidery version.
```

### 1.6 10-Second Sketch Test (Simplicity)

```markdown
## 10-SECOND SKETCH TEST - Simplicity Check

Can you sketch the logo from memory in under 10 seconds?

- [ ] Basic shape drawable quickly
- [ ] No complex details to remember
- [ ] Essential form is simple
- [ ] Anyone could roughly reproduce it

Time yourself:
- Under 10 seconds: Excellent simplicity
- 10-20 seconds: Acceptable
- Over 20 seconds: Too complex

**TEST RESULT:** [ ] PASS  [ ] FAIL

If FAIL: "If you can't draw it in 10 seconds, it's too complicated."
```

---

## Section 2: Technical Quality

> "Vector is life."

### 2.1 Vector Construction

```markdown
## VECTOR QUALITY CHECK

Path Quality:
- [ ] No unnecessary anchor points
- [ ] Smooth curves (no jagged beziers)
- [ ] Clean corners (no overshoots)
- [ ] No overlapping paths (properly merged)
- [ ] No open paths (all closed)
- [ ] No stray points

Geometric Precision:
- [ ] Circles are perfect circles
- [ ] Squares are perfect squares
- [ ] Consistent angles throughout
- [ ] Aligned to grid where appropriate

Organization:
- [ ] Layers named logically
- [ ] Groups organized
- [ ] No hidden elements
- [ ] Artboard sized correctly
```

### 2.2 Typography Quality

```markdown
## TYPOGRAPHY CHECK

If logo includes text:

Letterform Quality:
- [ ] Text converted to outlines (for final files)
- [ ] Original text preserved separately
- [ ] Kerning optically adjusted
- [ ] Letter spacing consistent (visual, not mechanical)
- [ ] No auto-kerning artifacts

Typeface Selection:
- [ ] Font weight appropriate (bold preferred)
- [ ] Font style matches brand
- [ ] Custom modifications documented
- [ ] Legal/licensing verified

Legibility:
- [ ] Readable at minimum size
- [ ] Clear letterforms
- [ ] No confusion between letters (I/l/1, O/0, etc.)
```

### 2.3 Thick Lines Philosophy

```markdown
## THICK LINES CHECK

Stroke Weights:
- [ ] No strokes thinner than 0.5pt at business card size
- [ ] Stroke weight consistent throughout
- [ ] Recommended ratio: 5-10% of logo height
- [ ] Optical adjustments made (curves slightly thicker)

Fill Quality:
- [ ] Solid fills, no outlines depending on thin strokes
- [ ] Fills work at all sizes
- [ ] No detail lost when scaling down

Bold Presence:
- [ ] Logo has visual weight
- [ ] Confident, not timid
- [ ] Commands attention

"Thick lines, baby!"
```

---

## Section 3: Production Readiness

> "If it can't embroider, it can't work everywhere."

### 3.1 Print Production

```markdown
## PRINT READINESS

CMYK Version:
- [ ] Colors converted accurately
- [ ] No RGB-only colors
- [ ] Rich black defined correctly (if used)
- [ ] Overprint settings correct

Spot Color Version:
- [ ] Pantone colors specified
- [ ] Conversion notes documented
- [ ] Build formulas noted

Print Testing:
- [ ] Tested at actual print size
- [ ] No elements too thin for print
- [ ] Registration-friendly (if multi-color)
- [ ] Bleeds defined if needed
```

### 3.2 Digital Production

```markdown
## DIGITAL READINESS

RGB Version:
- [ ] Colors optimized for screen
- [ ] HEX values documented
- [ ] sRGB color profile

Web Formats:
- [ ] SVG optimized (clean code)
- [ ] PNG transparent versions
- [ ] Multiple resolution versions
- [ ] Favicon package (ICO, multiple sizes)

Responsive Considerations:
- [ ] Works on retina/high DPI screens
- [ ] Scales cleanly in browser
- [ ] No anti-aliasing issues
```

### 3.3 Special Applications

```markdown
## SPECIAL APPLICATION READINESS

Embroidery:
- [ ] Simplified version if needed
- [ ] Maximum 6 colors
- [ ] Minimum detail size: 0.05"
- [ ] Clear stitch areas defined

Screen Printing:
- [ ] Separations possible
- [ ] Color count appropriate for budget
- [ ] Halftone-free version available

Engraving/Etching:
- [ ] One-color version works
- [ ] Line weights appropriate
- [ ] Detail survives process

Signage:
- [ ] Scalable to large sizes
- [ ] Works at distance
- [ ] Fabrication-friendly
```

---

## Section 4: Design Quality

> "Every element has to earn its place."

### 4.1 Simplicity

```markdown
## SIMPLICITY CHECK

Element Audit:
- [ ] Every element is essential
- [ ] Nothing can be removed without breaking it
- [ ] No decorative additions
- [ ] No effects (shadows, gradients, glows)

Complexity Score:
Count total elements:
- 1-3 elements: Excellent
- 4-6 elements: Good
- 7-10 elements: Review needed
- 10+ elements: Likely too complex

"Simplify until it hurts."
```

### 4.2 Balance & Proportion

```markdown
## BALANCE CHECK

Visual Weight:
- [ ] Optically centered (not just mathematically)
- [ ] Weight distributed appropriately
- [ ] No element overwhelms others
- [ ] Eye moves naturally

Proportions:
- [ ] Aspect ratio appropriate for use
- [ ] Internal proportions harmonious
- [ ] Negative space intentional
- [ ] White space sufficient
```

### 4.3 Distinctiveness

```markdown
## DISTINCTIVENESS CHECK

Competitive Differentiation:
- [ ] Doesn't resemble competitor logos
- [ ] Unique in its category
- [ ] Not generic/template-looking
- [ ] Ownable by the brand

Memorability:
- [ ] Has a distinctive feature
- [ ] Creates mental hook
- [ ] Stands out in lineup
- [ ] Recognizable at glance
```

### 4.4 Timelessness

```markdown
## TIMELESSNESS CHECK

Trend Avoidance:
- [ ] No current design trends that will date it
- [ ] No trendy color combinations
- [ ] No trendy typeface choices
- [ ] No trendy effects or styles

Longevity Indicators:
- [ ] Classic construction
- [ ] Simple forms that endure
- [ ] Not dependent on current technology
- [ ] Could work in any era

"Will this logo work in 50 years?"
```

---

## Section 5: Brand Alignment

### 5.1 Brief Compliance

```markdown
## BRIEF ALIGNMENT CHECK

Essential Requirements:
- [ ] Captures the essence word
- [ ] Reflects brand personality
- [ ] Appropriate for target audience
- [ ] Works for all specified applications

Constraints Met:
- [ ] Required colors used (if any)
- [ ] Required elements included (if any)
- [ ] Forbidden elements avoided (if any)
- [ ] Industry-appropriate
```

### 5.2 Strategic Fit

```markdown
## STRATEGIC FIT CHECK

Communication:
- [ ] Conveys intended message
- [ ] Evokes desired emotion
- [ ] Positions brand correctly
- [ ] Supports brand story

Scalability:
- [ ] Can grow with the brand
- [ ] Doesn't limit future expansion
- [ ] Works across brand extensions
- [ ] Flexible for future needs
```

---

## Final Sign-Off

### Pre-Delivery Checklist

```markdown
## FINAL SIGN-OFF

### Draplin Tests (all must pass)
- [ ] Coin Test - PASS
- [ ] B&W Test - PASS
- [ ] Squint Test - PASS
- [ ] Memory Test - PASS
- [ ] Embroidery Test - PASS
- [ ] 10-Second Sketch Test - PASS

### Technical Quality
- [ ] Vector construction clean
- [ ] Typography quality verified
- [ ] Thick lines philosophy applied

### Production Ready
- [ ] Print production ready
- [ ] Digital production ready
- [ ] Special applications considered

### Design Quality
- [ ] Simplicity achieved
- [ ] Balance verified
- [ ] Distinctiveness confirmed
- [ ] Timelessness checked

### Brand Alignment
- [ ] Brief requirements met
- [ ] Strategic fit confirmed

---

## THE DRAPLIN FINAL TEST

Before delivery, ask yourself:

"Is this logo BOLD enough?"
[ ] YES  [ ] If no, BOLD IT UP!

"Would I wear this on a t-shirt with pride?"
[ ] YES  [ ] If no, keep working

"Will this work in 50 years?"
[ ] YES  [ ] If no, remove the trendy parts

If YES to all three: SHIP IT!

---

Approved by: _________________
Date: _________________
Version: _________________
```

---

## Failure Resolution Guide

### If Tests Fail

```markdown
## RESOLUTION GUIDE

### Coin Test Failure
Action: Simplify further
- Remove smallest details
- Increase stroke weights
- Test icon-only version

### B&W Test Failure
Action: Strengthen form
- Add contrast
- Don't rely on color for hierarchy
- Rework overlapping elements

### Squint Test Failure
Action: Define silhouette
- Strengthen outer shape
- Increase contrast
- Simplify internal elements

### Memory Test Failure
Action: Create hook
- Add distinctive element
- Strengthen main feature
- Reduce competing elements

### Embroidery Test Failure
Action: Create production version
- Increase minimum details
- Reduce color count
- Simplify for thread

### Sketch Test Failure
Action: Radical simplification
- "Every element must earn its place"
- Remove, don't add
- Find the essential form
```

---

*Checklist Version: 1.0*
*Created: 2026-02-02*
*Agent: aaron-draplin*
*Philosophy: The delete key is your best friend.*

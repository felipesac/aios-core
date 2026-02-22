# Thumbnail Technical Requirements Checklist

**Purpose:** Validate thumbnail meets all technical specifications for YouTube
**Agent:** Paddy Galloway (YouTube Thumbnail Strategist)
**Standard:** YouTube technical requirements + mobile-first optimization

---

## FILE SPECIFICATIONS

### Dimensions

- [ ] Aspect ratio is 16:9 exactly
- [ ] Resolution is 1280x720 pixels (minimum)
- [ ] Recommended: 1920x1080 pixels (full HD)
- [ ] Maximum: 2560x1440 pixels

**Actual dimensions:** ___ x ___ pixels

### File Format

- [ ] Format is JPG, PNG, or GIF (static)
- [ ] PNG recommended for text-heavy thumbnails (sharper)
- [ ] JPG recommended for photo-heavy thumbnails (smaller)

**Format used:** _______________

### File Size

- [ ] File size is under 2MB (YouTube limit)
- [ ] Optimized for fast loading
- [ ] Compression does not affect quality visibly

**File size:** ___ KB/MB

---

## DISPLAY SIZE OPTIMIZATION

> "If you have to squint to read it, it's too small for mobile."

### Mobile View (Primary)

- [ ] Tested at 160x90 pixels (smallest display)
- [ ] All key elements visible at mobile size
- [ ] Text readable without zooming
- [ ] Face expressions recognizable
- [ ] Curiosity element clear

### Tablet View

- [ ] Tested at 320x180 pixels
- [ ] All elements scale appropriately

### Desktop View

- [ ] Tested at 480x270 pixels (suggested videos)
- [ ] Tested at 1280x720 pixels (full view)

### TV View

- [ ] Tested at larger scales (living room distance)
- [ ] No pixelation or artifacts visible

---

## TEXT LEGIBILITY

### Font Size

- [ ] Text height is 15-25% of thumbnail height
- [ ] Minimum text height: 108px (at 720p) / 162px (at 1080p)
- [ ] Text is NOT too small for mobile
- [ ] Text is NOT too large (overwhelming)

**Text size:** ___% of thumbnail height

### Font Choice

- [ ] Font is bold/heavy weight
- [ ] Font is sans-serif (no thin serifs)
- [ ] Font is not decorative/script
- [ ] Font is web-safe or standard

**Recommended fonts:**
- Impact
- Bebas Neue
- Anton
- Montserrat Bold
- Oswald Bold

**Font used:** _______________

### Text Contrast

- [ ] Text has stroke/outline for contrast
- [ ] OR text has drop shadow
- [ ] OR text is on solid color background
- [ ] Text is readable on ANY background area

**Contrast method:** _______________

### Text Position

- [ ] Text does NOT overlap important visual elements
- [ ] Text is in clear area of thumbnail
- [ ] Text position is consistent if series
- [ ] Safe zone: Not too close to edges (watch app cropping)

**Edge margins:** Minimum 5% from any edge

---

## COLOR SPECIFICATIONS

### Color Mode

- [ ] Color mode is RGB (not CMYK)
- [ ] Color profile is sRGB
- [ ] Colors display correctly on web

### Contrast Ratio

- [ ] Text contrast ratio is 4.5:1 minimum (WCAG AA)
- [ ] Key elements have clear visual separation
- [ ] No muddy or unclear color transitions

**Contrast checker tools:**
- WebAIM Contrast Checker
- Coolors Contrast Checker

### Dark Mode / Light Mode

- [ ] Tested against YouTube dark mode background (#0F0F0F)
- [ ] Tested against YouTube light mode background (#FFFFFF)
- [ ] Thumbnail stands out in BOTH modes

### Color Blindness

- [ ] Thumbnail works for deuteranopia (red-green)
- [ ] Not relying solely on red/green distinction
- [ ] Contrast carries message even in grayscale

---

## IMAGE QUALITY

### Resolution

- [ ] Source images are high resolution
- [ ] No visible pixelation
- [ ] No compression artifacts (JPEG blocking)
- [ ] No upscaling from low-res sources

### Focus/Sharpness

- [ ] Main subject is in focus
- [ ] No motion blur (unless intentional)
- [ ] Sharpening applied appropriately

### Lighting

- [ ] Subject is well-lit
- [ ] No harsh shadows obscuring details
- [ ] Face is clearly visible (if present)
- [ ] Consistent lighting across composited elements

### Compositing (if applicable)

- [ ] Edges are clean (no halos)
- [ ] Lighting direction matches between elements
- [ ] Scale is realistic between elements
- [ ] Shadows/reflections added if needed

---

## FACE REQUIREMENTS (If Face Present)

### Face Size

- [ ] Face occupies 30-50% of frame
- [ ] Face is NOT too small (loses expression)
- [ ] Face is NOT too large (no context)

**Face size:** ___% of frame

### Face Position

- [ ] Face follows rule of thirds
- [ ] Face is NOT dead center (unless intentional)
- [ ] Space for text/elements if needed

### Face Cropping

- [ ] Head is NOT cut off at top (unless stylistic choice)
- [ ] Forehead visible (at least partially)
- [ ] Chin visible
- [ ] Some neck/shoulders for context

### Expression Visibility

- [ ] Expression is clear at mobile size
- [ ] Eyes are visible and expressive
- [ ] Mouth expression is readable
- [ ] Eyebrows contribute to expression

---

## YOUTUBE-SPECIFIC REQUIREMENTS

### Safe Zones

- [ ] No critical elements in bottom-right corner (timestamp overlay)
- [ ] No critical elements in extreme corners (app cropping varies)
- [ ] Text not too close to edges (minimum 5% margin)

### Timestamp Overlay Area

YouTube places video duration in bottom-right corner:
- [ ] No essential text/elements in bottom-right ~15% width x 10% height
- [ ] OR text/element is expendable if partially covered

### Click Area

- [ ] Entire thumbnail is clickable (no "dead zones" of low interest)
- [ ] Visual flow guides eye across thumbnail
- [ ] No confusing elements that distract from click intent

---

## SERIES CONSISTENCY (If Applicable)

### Template Adherence

- [ ] Follows channel thumbnail template
- [ ] Consistent color palette
- [ ] Consistent font/typography
- [ ] Consistent layout structure
- [ ] Consistent signature element (if any)

### Differentiation

- [ ] This thumbnail is distinguishable from other channel videos
- [ ] Viewer can tell this is a NEW/DIFFERENT video
- [ ] Series identifier present (if part of series)

---

## EXPORT SETTINGS

### Recommended PNG Settings

```
Format: PNG-24
Resolution: 1920x1080 or 1280x720
Color: RGB, 8-bit
Interlaced: No (smaller file)
```

### Recommended JPG Settings

```
Format: JPEG
Quality: 80-90%
Resolution: 1920x1080 or 1280x720
Color: RGB
Progressive: Yes (faster preview load)
```

### Pre-Upload Checks

- [ ] File is named descriptively (video-title-thumbnail-v1.png)
- [ ] File is backed up before upload
- [ ] Multiple variants saved with version numbers

---

## UPLOAD VERIFICATION

### After Upload:

- [ ] Thumbnail displays correctly in YouTube Studio
- [ ] Thumbnail displays correctly on channel page
- [ ] Thumbnail displays correctly in search results
- [ ] Thumbnail displays correctly in suggested videos
- [ ] Thumbnail displays correctly on mobile app

### Cross-Device Check:

- [ ] Desktop browser
- [ ] Mobile browser
- [ ] YouTube mobile app (iOS)
- [ ] YouTube mobile app (Android)
- [ ] TV app (if accessible)

---

## QUALITY GATE

| Requirement | Pass? |
|-------------|-------|
| File Specifications | [ ] |
| Display Size Optimization | [ ] |
| Text Legibility | [ ] |
| Color Specifications | [ ] |
| Image Quality | [ ] |
| Face Requirements | [ ] |
| YouTube-Specific | [ ] |
| Series Consistency | [ ] |
| Export Settings | [ ] |

**Overall:** [ ] PASS - Ready to upload | [ ] FAIL - Technical issues

**Reviewer:** ________ **Date:** ________

---

## QUICK REFERENCE SPECS

```
DIMENSIONS:     1280x720 minimum (1920x1080 recommended)
ASPECT RATIO:   16:9 exactly
FILE SIZE:      Under 2MB
FORMATS:        JPG, PNG, GIF
COLOR MODE:     RGB, sRGB profile
TEXT SIZE:      15-25% of thumbnail height
FACE SIZE:      30-50% of frame
SAFE MARGINS:   5% from edges minimum
TIMESTAMP ZONE: Avoid bottom-right corner
```

---

## PADDY'S TECHNICAL REMINDER

> "If it doesn't work at 160x90 pixels, it doesn't work."

> "Test in both dark mode and light mode. Your viewer might be using either."

The best creative concept fails if technical execution is poor. Nail the specs, then let the psychology do its work.

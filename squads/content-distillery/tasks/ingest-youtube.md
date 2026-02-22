# Task: Ingest YouTube Video/Livestream

**Task ID:** content-distillery/ingest-youtube
**Version:** 1.0.0
**Status:** Production Ready
**Created:** 2026-02-12
**Category:** Content Distillery Pipeline
**Total Lines:** 340

---

## Executive Summary

This is an automated ingestion task that takes a YouTube URL and produces a high-quality, timestamped transcript with full metadata. It is the entry point of the Content Distillery pipeline. Every downstream task (extraction, summarization, multiplication) depends on transcript quality, so this task prioritizes accuracy over speed and includes multiple fallback strategies for transcript acquisition.

**Workflow Position:** Entry point to Content Distillery pipeline (Task 1 of 6)
**Success Definition:** Clean, timestamped transcript with 95%+ accuracy and complete metadata
**Output Quality Gate:** Transcript must pass quality score threshold (>= 7/10) before proceeding

---

## Purpose

Convert any YouTube video or livestream into a structured, machine-readable transcript that preserves temporal context and speaker attribution. Poor transcription quality cascades into every downstream task: tacit knowledge extraction misses nuance, framework identification fails on garbled text, and content multiplication produces low-quality derivatives. Investing heavily in transcript quality here prevents 20+ hours of downstream rework.

This task also prevents duplicate ingestion by checking existing transcripts before downloading, saving compute and API costs.

---

## Executor Type

**Worker (100% Automated)**

- **Automated Pipeline:** URL validation, metadata extraction, transcript acquisition, cleaning, scoring
- **Human Intervention:** Only if quality score < 7/10 (rare, ~5% of cases)
- **Estimated Runtime:** 3-15 minutes depending on video length and transcript source

---

## Inputs

### Required Inputs

```yaml
youtube_url:
  field: "YouTube video or livestream URL"
  format: "string (URL)"
  required: true
  example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  validation: |
    Must match one of:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/live/VIDEO_ID
    - https://www.youtube.com/playlist?list=PLAYLIST_ID (batch mode)
  notes: "Supports individual videos, livestreams, and playlists"

output_slug:
  field: "Slug for output directory"
  format: "string (snake_case)"
  required: true
  example: "alex_hormozi_100m_leads_ep47"
  validation: "Must match ^[a-z0-9]+(_[a-z0-9]+)*$ (snake_case)"
  notes: "Used as directory name under outputs/distillery/"
```

### Optional Inputs

```yaml
language:
  field: "Primary language of the video"
  format: "string (ISO 639-1)"
  default: "pt"
  example: "en"
  notes: "Affects Whisper model selection and transcript cleaning"

speaker_names:
  field: "Known speaker names for attribution"
  format: "list of strings"
  default: []
  example: ["Alex Hormozi", "Leila Hormozi"]
  notes: "Improves speaker diarization accuracy"

force_whisper:
  field: "Force Whisper transcription even if captions exist"
  format: "boolean"
  default: false
  notes: "Use when YouTube auto-captions are known to be low quality"

max_duration_minutes:
  field: "Maximum video duration to accept"
  format: "integer"
  default: 480
  notes: "Rejects videos longer than this (default 8 hours)"

timestamp_interval:
  field: "Desired timestamp granularity"
  format: "string"
  default: "sentence"
  example: "30s"
  notes: "Options: sentence (per sentence), 30s, 1m, 5m, paragraph"
```

---

## Preconditions

Before starting this task:

- [ ] YouTube URL is accessible (not private, not deleted, not geo-blocked)
- [ ] Output directory `outputs/distillery/` exists or can be created
- [ ] No existing transcript for this slug (check `outputs/distillery/{slug}/transcript.md`)
- [ ] Required tools available: `yt-dlp` or YouTube Transcript API, `whisper` (if audio fallback needed), `ffmpeg` (for audio extraction)
- [ ] Sufficient disk space for audio download (~100MB per hour of video)
- [ ] API quotas not exhausted (YouTube Data API, Whisper API)

---

## Steps

### Step 1: Validate YouTube URL and Check Duplicates (1 min)

**Activity:**
- Parse the YouTube URL to extract video ID
- Validate URL format matches supported patterns
- Check if `outputs/distillery/{slug}/` already exists
  - If exists AND `transcript.md` present: SKIP with message "Transcript already exists"
  - If exists BUT no transcript: continue (previous attempt may have failed)
  - If not exists: create directory structure

**Error Handling:**
- Invalid URL format: ABORT with clear error message and URL format examples
- Private/deleted video: ABORT with "Video unavailable" and suggest checking URL
- Duplicate found: Return existing transcript path, do not re-process

**Checkpoint:** Valid video ID extracted, no duplicate exists, output directory ready

---

### Step 2: Extract Video Metadata (1 min)

**Activity:**
- Use YouTube Data API or `yt-dlp --dump-json` to extract:
  - `title`: Video title
  - `channel_name`: Channel/creator name
  - `channel_id`: Channel ID for cross-referencing
  - `publish_date`: Original publication date (ISO 8601)
  - `duration_seconds`: Total video length
  - `duration_formatted`: Human-readable duration (HH:MM:SS)
  - `description`: Full video description
  - `tags`: Video tags (useful for topic identification)
  - `view_count`: View count at time of ingestion
  - `like_count`: Like count if available
  - `language`: Detected language
  - `has_captions`: Whether manual or auto captions exist
  - `caption_languages`: List of available caption languages
  - `thumbnail_url`: Highest quality thumbnail URL
  - `is_livestream`: Whether this was a livestream
  - `livestream_date`: If livestream, the actual stream date

**Duration Validation:**
- If `duration_seconds` > `max_duration_minutes * 60`: ABORT with warning
- If `duration_seconds` < 60: WARN "Very short video, limited extraction value"
- If `is_livestream` and `duration_seconds` > 14400 (4h): WARN "Long livestream, processing may take extended time"

**Error Handling:**
- Metadata extraction fails: Retry once, then ABORT with raw error
- Missing fields: Fill with "unknown" and add warning to quality report

**Checkpoint:** Complete metadata YAML saved to `{slug}/metadata.yaml`

---

### Step 3: Acquire Transcript - Primary Strategy (2-5 min)

**Activity:**
- **Strategy A: YouTube Transcript API (preferred)**
  1. Check for manual captions in target language
  2. If manual captions exist: download and use (highest quality)
  3. If no manual captions: check for auto-generated captions
  4. If auto-captions exist in target language: download with quality warning
  5. If auto-captions in other language: download + note translation may be needed

- **Evaluation of Caption Quality:**
  - Manual captions: quality_source = "manual", expected_accuracy = 98%
  - Auto-captions (same language): quality_source = "auto_same_lang", expected_accuracy = 85%
  - Auto-captions (translated): quality_source = "auto_translated", expected_accuracy = 70%

- **If captions acquired:** Jump to Step 5 (cleaning)
- **If NO captions available OR `force_whisper` is true:** Proceed to Step 4

**Error Handling:**
- API rate limit: Wait 60s, retry once, then proceed to Step 4
- Captions disabled by uploader: Proceed to Step 4
- Network error: Retry 3 times with exponential backoff

**Checkpoint:** Raw caption text acquired OR decision to use Whisper fallback

---

### Step 4: Acquire Transcript - Whisper Fallback (5-30 min)

**Activity:**
- **Only executed if Step 3 did not produce captions**
1. Download audio track using `yt-dlp`:
   ```bash
   yt-dlp -x --audio-format mp3 --audio-quality 0 -o "{slug}/audio.mp3" "{url}"
   ```
2. If audio file > 25MB, split into chunks:
   ```bash
   ffmpeg -i audio.mp3 -f segment -segment_time 600 -c copy chunk_%03d.mp3
   ```
3. Transcribe with Whisper:
   - Model selection based on language:
     - Portuguese: `whisper-large-v3` (best for PT)
     - English: `whisper-large-v3` or `whisper-medium.en`
     - Other: `whisper-large-v3` (multilingual)
   - Parameters:
     - `--task transcribe`
     - `--language {language}`
     - `--word_timestamps True`
     - `--condition_on_previous_text True`
4. If chunked: merge transcriptions preserving timestamps
5. Set quality_source = "whisper", expected_accuracy = 92%

**Error Handling:**
- Download fails: Try alternative format (`-f bestaudio`)
- Whisper OOM: Reduce to `whisper-medium`, then `whisper-small`
- Chunk merge misalignment: Add 0.5s overlap between chunks
- Audio corrupted: ABORT with "Audio extraction failed"

**Resource Management:**
- Delete audio files after transcription to save disk space
- Keep only the final merged transcript

**Checkpoint:** Raw Whisper transcript acquired with word-level timestamps

---

### Step 5: Clean and Format Transcript (2-3 min)

**Activity:**
1. **Text Normalization:**
   - Fix common OCR/ASR errors (e.g., "gonna" -> keep as-is for authenticity)
   - Remove filler sounds: [um], [uh], [ah] (but preserve intentional pauses as "...")
   - Fix broken sentences from caption line breaks
   - Normalize Unicode characters (curly quotes -> straight quotes)
   - Remove duplicate consecutive lines (common in auto-captions)

2. **Timestamp Formatting:**
   - Convert raw timestamps to `[HH:MM:SS]` format
   - Apply timestamp granularity per `timestamp_interval` setting
   - Ensure timestamps are monotonically increasing

3. **Speaker Attribution (Best Effort):**
   - If `speaker_names` provided: attempt basic diarization
   - Use vocal pattern changes and context clues
   - Format as `**Speaker Name:** text` or `**Speaker 1:** text`
   - If single speaker: omit speaker labels

4. **Paragraph Segmentation:**
   - Group related sentences into paragraphs (3-8 sentences)
   - Break on topic changes, long pauses, or speaker changes
   - Add blank line between paragraphs

5. **Markdown Formatting:**
   - Add YAML frontmatter with metadata reference
   - Add table of contents if video > 30 minutes
   - Add section headers at natural topic boundaries (every 10-15 min)
   - Preserve any screen-shared text or URLs mentioned verbally

**Error Handling:**
- Encoding errors: Force UTF-8 with fallback to latin-1
- Empty transcript: ABORT with "Transcription produced no text"
- Transcript too short (< 100 words for > 5 min video): WARN quality issue

**Checkpoint:** Clean, formatted transcript ready for quality scoring

---

### Step 6: Generate Transcript Quality Score (1 min)

**Activity:**
- Score the transcript on 10-point scale across 5 dimensions:

```yaml
quality_dimensions:
  completeness:
    score: 0-10
    criteria: "Does transcript cover full video duration? No major gaps?"
    measurement: "transcript_duration / video_duration >= 0.95"

  accuracy:
    score: 0-10
    criteria: "Are words correctly transcribed? Technical terms preserved?"
    measurement: "Based on source quality + spot-check of 3 random segments"

  readability:
    score: 0-10
    criteria: "Is the text well-formatted, properly paragraphed, coherent?"
    measurement: "Flesch reading ease + paragraph structure assessment"

  timestamp_quality:
    score: 0-10
    criteria: "Are timestamps accurate and consistently formatted?"
    measurement: "Spot-check 5 timestamps against video"

  speaker_attribution:
    score: 0-10
    criteria: "Are speakers correctly identified and consistently labeled?"
    measurement: "If multi-speaker: attribution accuracy. If single: auto 10"
```

- Calculate composite score: weighted average
  - completeness: 30%
  - accuracy: 30%
  - readability: 20%
  - timestamp_quality: 10%
  - speaker_attribution: 10%

**Quality Gate:**
- Score >= 7/10: PASS, proceed to downstream tasks
- Score 5-6/10: WARN, proceed but flag for human review
- Score < 5/10: FAIL, recommend re-transcription with different strategy

**Checkpoint:** Quality report generated with pass/warn/fail status

---

### Step 7: Save Outputs to Standardized Format (1 min)

**Activity:**
1. Save transcript as Markdown:
   ```
   outputs/distillery/{slug}/transcript.md
   ```
   Format:
   ```markdown
   ---
   source_url: "{youtube_url}"
   title: "{title}"
   channel: "{channel_name}"
   duration: "{duration_formatted}"
   language: "{language}"
   transcript_source: "{quality_source}"
   quality_score: {composite_score}
   ingested_at: "{ISO 8601 timestamp}"
   ---

   # {title}

   **Channel:** {channel_name}
   **Duration:** {duration_formatted}
   **Published:** {publish_date}

   ---

   ## Table of Contents
   ...

   ## [00:00:00] Introduction
   ...
   ```

2. Save metadata as YAML:
   ```
   outputs/distillery/{slug}/metadata.yaml
   ```

3. Save quality report as YAML:
   ```
   outputs/distillery/{slug}/quality-report.yaml
   ```

4. Create processing log:
   ```
   outputs/distillery/{slug}/ingestion-log.yaml
   ```
   Includes: timestamps for each step, strategy used, errors encountered, retries

**Error Handling:**
- Write failure: Retry once, then ABORT with filesystem error
- Ensure all files are UTF-8 encoded

**Checkpoint:** All output files written and verified

---

### Step 8: Report Ingestion Summary (30 sec)

**Activity:**
- Print summary to console:
  ```
  === INGESTION COMPLETE ===
  Video:    {title}
  Channel:  {channel_name}
  Duration: {duration_formatted}
  Source:   {quality_source}
  Quality:  {composite_score}/10 ({pass/warn/fail})
  Output:   outputs/distillery/{slug}/
  Files:    transcript.md, metadata.yaml, quality-report.yaml
  ========================
  ```

- If quality < 7: Print specific recommendations for improvement
- If playlist mode: Report progress (X of Y videos processed)

**Checkpoint:** Human-readable summary displayed

---

## Outputs

### Primary Outputs

**1. Transcript Document**
- Format: Markdown with YAML frontmatter
- Location: `outputs/distillery/{slug}/transcript.md`
- Size: ~1000 words per 10 min of video
- Contains: Timestamped, speaker-attributed, paragraphed transcript

**2. Video Metadata**
- Format: YAML
- Location: `outputs/distillery/{slug}/metadata.yaml`
- Contains: Complete video metadata (title, channel, duration, description, tags, etc.)

```yaml
video:
  id: "VIDEO_ID"
  url: "https://www.youtube.com/watch?v=VIDEO_ID"
  title: "How I Built a $100M Company in 3 Years"
  channel:
    name: "Alex Hormozi"
    id: "UCo_..."
  duration:
    seconds: 5420
    formatted: "01:30:20"
  published: "2024-03-15T14:00:00Z"
  language: "en"
  is_livestream: false
  description: |
    Full video description here...
  tags:
    - "business"
    - "entrepreneurship"
    - "growth"
  stats:
    views: 1250000
    likes: 45000
  captions:
    has_manual: false
    has_auto: true
    languages: ["en"]
  thumbnail: "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
  ingested_at: "2026-02-12T10:30:00Z"
```

**3. Quality Report**
- Format: YAML
- Location: `outputs/distillery/{slug}/quality-report.yaml`

```yaml
quality:
  composite_score: 8.2
  status: "pass"  # pass | warn | fail
  source: "youtube_manual_captions"
  dimensions:
    completeness: 9
    accuracy: 8
    readability: 8
    timestamp_quality: 8
    speaker_attribution: 7
  recommendations: []
  processing:
    strategy_used: "youtube_captions_api"
    fallback_used: false
    total_time_seconds: 45
    errors_encountered: 0
    retries: 0
```

### Secondary Outputs

**4. Ingestion Log**
- Format: YAML
- Location: `outputs/distillery/{slug}/ingestion-log.yaml`
- Contains: Step-by-step processing log with timestamps and decisions made

---

## Validation

### Checklist

- [ ] YouTube URL validated and video accessible
- [ ] No duplicate transcript exists for this slug
- [ ] Metadata extracted with all required fields (title, channel, duration, language)
- [ ] Transcript acquired via best available strategy (manual captions > auto > Whisper)
- [ ] Transcript cleaned: no duplicate lines, proper paragraphing, consistent timestamps
- [ ] Timestamps are in `[HH:MM:SS]` format and monotonically increasing
- [ ] Speaker attribution attempted if multi-speaker video
- [ ] Quality score calculated across all 5 dimensions
- [ ] Quality score >= 7/10 (or flagged for review if lower)
- [ ] All 3 output files saved: transcript.md, metadata.yaml, quality-report.yaml
- [ ] Output directory follows snake_case slug convention
- [ ] Temporary files (audio, chunks) cleaned up

### Success Criteria

**Threshold: Quality Score >= 7/10**

| Criteria | Excellent (3) | Acceptable (2) | Poor (1) |
|----------|--------------|----------------|---------|
| **Completeness** | Full video transcribed, no gaps > 10s | Minor gaps (< 2% of duration) | Missing segments > 5% of duration |
| **Accuracy** | Technical terms correct, proper nouns right | 1-3 minor errors per 1000 words | Frequent misrecognitions, garbled text |
| **Readability** | Natural paragraphs, clear sections, easy to scan | Reasonable structure with minor issues | Wall of text, no structure |
| **Timestamps** | Every paragraph timestamped, accurate to 5s | Most paragraphs timestamped, accurate to 30s | Timestamps missing or inaccurate |
| **Speed** | < 5 min for 1-hour video (captions) | < 15 min for 1-hour video | > 30 min for 1-hour video |

---

## Estimated Effort

| Component | Effort | Notes |
|-----------|--------|-------|
| **URL Validation + Dedup** | 30 sec | Instant, API call |
| **Metadata Extraction** | 30 sec | Single API call |
| **Caption Download** | 1-2 min | If captions available |
| **Whisper Transcription** | 5-30 min | Only if no captions (depends on duration) |
| **Cleaning + Formatting** | 1-2 min | Text processing |
| **Quality Scoring** | 30 sec | Automated evaluation |
| **Total (with captions)** | 3-5 min | Most common path (~80% of videos) |
| **Total (with Whisper)** | 8-35 min | Fallback path (~20% of videos) |

---

## Integration

### Feeds To

**Workflow:** Content Distillery Pipeline (content-distillery/full-distillery-pipeline)

**Next Tasks in Sequence:**
- **Task 2:** extract-tacit-knowledge - Uses: transcript.md
- **Task 3:** identify-frameworks - Uses: transcript.md
- **Task 4:** progressive-summarize - Uses: transcript.md, metadata.yaml

### Depends On

- None (this is the pipeline entry point)

### Agent Routing

**Primary Executor:** Automated worker (no agent required)
**Escalation:** distillery-chief (only if quality < 5/10 and manual intervention needed)

---

## Quality Threshold

**Pass/Fail Gate:** Quality score >= 7/10

If < 7/10:
1. Check quality dimensions to identify weakest area
2. If accuracy < 6: retry with Whisper (even if captions were used)
3. If completeness < 6: check for video access issues, retry download
4. If readability < 6: re-run cleaning step with stricter rules
5. If still < 7/10 after retry: flag for human review, proceed with warning

**Common Failure Reasons:**
- Auto-captions in language different from spoken language
- Livestream with poor audio quality (background noise, multiple speakers talking over each other)
- Technical content with domain-specific jargon not in Whisper vocabulary
- Video with significant music/sound effects drowning out speech

---

## Related Tasks

- **Task 2:** extract-tacit-knowledge (consumes transcript.md)
- **Task 3:** identify-frameworks (consumes transcript.md)
- **Task 4:** progressive-summarize (consumes transcript.md, metadata.yaml)
- **Task 6:** distill-single-live (orchestrates this task as step 1)

---

## Notes for Executor

### Playlist/Batch Mode

If the input URL is a playlist:
1. Extract all video URLs from the playlist
2. Process each video sequentially (to avoid API rate limits)
3. Use playlist title + index for slug: `{playlist_slug}_01`, `{playlist_slug}_02`
4. Generate batch summary after all videos processed
5. Flag any failed videos for retry

### Long Livestreams (> 2 hours)

- Use chunked Whisper processing (10-minute segments)
- Add extra overlap between chunks (1 minute) to prevent sentence breaks
- Consider running speaker diarization as separate post-process
- Warn that processing time may exceed 30 minutes

### Portuguese Content Specifics

- Whisper `large-v3` handles PT-BR well but struggles with:
  - Regional accents (nordestino, gaúcho)
  - Code-switching (PT/EN mix common in tech content)
  - Proper nouns and brand names
- Post-process: run PT-specific spell checker on technical terms
- If creator is known: build custom vocabulary list for the channel

### Cost Considerations

- YouTube Transcript API: Free (no cost)
- Whisper API (OpenAI): ~$0.006/minute of audio
- Whisper local: Free but requires GPU (or slow on CPU)
- Storage: ~1MB per hour of transcript text

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-02-12 | Initial production release |

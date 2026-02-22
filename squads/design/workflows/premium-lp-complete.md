# Workflow: Premium LP Complete

## Metadata

```yaml
workflow_id: premium-lp-complete
version: "2.0.0"
type: cross-squad
squads_involved:
  - copywriter-os (copy generation)
  - design (visual rendering + deploy + notification)
estimated_time: "25-50 min"
mode: "incremental | yolo"
phases: 7
checkpoints: 5
input_modes: [audio, text, prefilled]
input_schema: "squads/design/templates/automation-input-schema.yaml"
```

## Purpose

Workflow end-to-end para criar uma Landing Page Premium completa — do audio/texto
ate o deploy publico com notificacao WhatsApp. Orquestra o CopywriterOS (copy) e o
Design Squad (visual + deploy + notify) em sequencia com quality gates entre fases.

---

## Overview

```
INPUT: audio | text | prefilled payload
  |
  v
PHASE 0: AUDIO TRANSCRIPTION (conditional)
  → FFmpeg convert → Whisper API → LLM extraction
  → Output: structured fields + needs_elicitation list
  → SKIP if input_mode != 'audio'
  |
  v
PHASE 1: ELICITATION (CopywriterOS)
  → Perguntas estruturadas (7 steps)
  → Pre-filled from Phase 0 extraction (if audio)
  → SKIP if input_mode == 'prefilled'
  |
  v
[CHECKPOINT 1: Content Complete]
  |
  v
PHASE 2: COPY GENERATION (CopywriterOS)
  → Refinar copy com Ogilvy style
  → Formatar payload YAML
  → Validar contra content-schema
  |
  v
[CHECKPOINT 2: Payload Validated]
  |
  v
PHASE 3: VISUAL RENDERING (Design Squad)
  → Resolver tokens (global + template overrides)
  → Renderizar HTML (template + content + tokens)
  → Processar tier conditionals
  |
  v
[CHECKPOINT 3: HTML Generated]
  |
  v
PHASE 4: DELIVERY (local)
  → Salvar HTML em outputs/
  → Preview no browser (opcional)
  → Report final
  |
  v
PHASE 5: DEPLOY VERCEL
  → vercel.json + vercel --prod
  → Health check (curl → 200)
  → Save deploy-info.yaml
  |
  v
[CHECKPOINT 4: Deploy Live]
  |
  v
PHASE 6: NOTIFY WHATSAPP
  → Screenshot via Playwright (opcional)
  → UazAPI: send image + text with URL
  → Log notification status
  |
  v
[CHECKPOINT 5: Notification Sent]
  |
  v
OUTPUT: Premium LP live at https://premium-lp-{slug}.vercel.app
```

---

## Phase 0: Audio Transcription (Conditional)

```yaml
phase: 0
name: "Audio Transcription & Field Extraction"
executor: "@premium-design"
task: "squads/design/tasks/transcribe-lp-brief.md"
condition: "input_mode == 'audio'"
mode: autonomous

steps:
  0.1_validate_audio:
    action: "Check file exists, format, duration < 15min"
    tool: "ffprobe"

  0.2_convert_audio:
    action: "FFmpeg → MP3 mono 16kHz 64k"
    tool: "ffmpeg"

  0.3_transcribe:
    action: "Whisper API (whisper-1, language auto/pt)"
    tool: "OpenAI API"
    output: "Raw transcript text"

  0.4_extract_fields:
    action: "LLM extracts structured fields from transcript"
    schema: "squads/design/templates/lp-brief-extraction-schema.yaml"
    output: "extracted_fields + confidence + needs_elicitation"

  0.5_save_extraction:
    action: "Save to outputs/premium-design/.pending/{slug}-extraction.yaml"

skip_when:
  - "input_mode == 'text' (go to Phase 1 with text extraction)"
  - "input_mode == 'prefilled' (go to Phase 2 directly)"

feeds_into: "Phase 1 — pre-fills answered fields, elicits only missing ones"
```

---

## Phase 1: Elicitation

```yaml
phase: 1
name: "Content Elicitation"
executor: "@copy-chief"
task: "squads/copywriter-os/tasks/create-premium-lp-copy.md"
task_phases: [1]  # Only Phase 1 of the task
mode: interactive  # Always interactive (elicitation requires user)

steps:
  1.1_identity:
    questions: [full_name, labels, hero_description, brand_initials]
    required: true

  1.2_proof:
    questions: [proof_metrics]
    required: true

  1.3_expertise:
    questions: [expertise_cards]
    required: true

  1.4_philosophy:
    questions: [quote_text, quote_role]
    required: true

  1.5_stack:
    questions: [stack_items]
    required: true

  1.6_cta:
    questions: [cta_heading, cta_description, scheduling_url, cta_label, social_links]
    required: true

  1.7_visual:
    questions: [template_choice, tier_choice, photo_url, photo_treatment]
    required: true

checkpoint_1:
  name: "Content Complete"
  blocking: true
  criteria:
    - all_required_questions_answered: true
    - hero_name_provided: true
    - at_least_2_proof_items: true
    - at_least_2_expertise_cards: true
    - quote_provided: true
    - at_least_2_stack_items: true
    - cta_heading_provided: true
  on_fail: "Return to unanswered questions"
```

---

## Phase 2: Copy Generation

```yaml
phase: 2
name: "Copy Generation & Schema Formatting"
executor: "@copy-chief → @david-ogilvy"
task: "squads/copywriter-os/tasks/create-premium-lp-copy.md"
task_phases: [2, 3]  # Phases 2+3 of the task
mode: autonomous  # No user input needed

steps:
  2.1_refine_hero:
    agent: "@david-ogilvy"
    action: "Refinar hero description com tom premium"
    output: "hero.description (refined)"

  2.2_refine_proof:
    agent: "@david-ogilvy"
    action: "Ordenar e polir metricas"
    output: "proof.items[] (refined)"

  2.3_refine_expertise:
    agent: "@david-ogilvy + @gary-bencivenga"
    action: "Transformar descriptions em micro-bullets"
    output: "expertise.cards[] (refined)"

  2.4_refine_quote:
    agent: "@david-ogilvy"
    action: "Polir quote mantendo autenticidade"
    output: "quote.text (refined)"

  2.5_refine_stack:
    agent: "@david-ogilvy"
    action: "Ordenar por relevancia"
    output: "stack.items[] (refined)"

  2.6_generate_nav_cta:
    agent: "auto"
    action: "Gerar nav links e CTA a partir das secoes"
    output: "nav{}, cta{}, footer{}"

  2.7_assemble_payload:
    agent: "auto"
    action: "Montar payload YAML completo"
    output: "content-payload.yaml"
    validation: "Contra premium-lp-content-schema.yaml"

checkpoint_2:
  name: "Payload Validated"
  blocking: true
  criteria:
    - payload_assembled: true
    - schema_validation_pass: true
    - all_required_fields_present: true
    - all_constraints_met: true
    - no_placeholder_values: true
  on_fail: "Fix validation errors, re-validate"

  # In incremental mode: Show payload to user for approval
  # In yolo mode: Auto-approve if validation passes
  incremental_action: |
    Apresentar payload completo ao usuario.
    Perguntar: "Payload de conteudo pronto. Aprovar ou ajustar?"
```

---

## Phase 3: Visual Rendering

```yaml
phase: 3
name: "Visual Rendering"
executor: "@premium-design"
command: "*generate"
mode: autonomous

steps:
  3.1_resolve_tokens:
    action: "Load premium-lp-tokens.yaml"
    process: |
      1. Load global tokens
      2. Apply template_overrides[{config.template}]
      3. Merge: global + overrides = resolved tokens
    output: "Resolved token set"

  3.2_render_html:
    action: "Process premium-lp-template.html"
    process: |
      1. Replace {{tokens.*}} with resolved token values
      2. Replace {{content.*}} with payload values
      3. Process {{#tier.*}} conditional blocks
      4. Process {{#items}} loop blocks
      5. Remove unused conditional blocks
    output: "Raw HTML"

  3.3_validate_output:
    action: "Validate rendered HTML"
    checks:
      - no_remaining_placeholders: "grep '{{' output.html"
      - correct_tier_blocks: "Only selected tier's JS present"
      - valid_html: "No unclosed tags"
      - all_content_present: "Each section has content"
    output: "Validated HTML"

  3.4_write_output:
    action: "Save to outputs/"
    path: "outputs/premium-design/{config.template}/index.html"
    also_copy: "photo.url → same directory"

checkpoint_3:
  name: "HTML Generated"
  blocking: true
  criteria:
    - html_file_exists: true
    - no_placeholders_remaining: true
    - file_size_reasonable: ">10KB"
    - all_sections_rendered: true
  on_fail: "Debug rendering, fix template issues"
```

---

## Phase 4: Delivery

```yaml
phase: 4
name: "Delivery & Preview"
executor: "auto"
mode: "interactive (incremental) | autonomous (yolo)"

steps:
  4.1_save_artifacts:
    action: "Salvar todos os artefatos"
    outputs:
      - "outputs/premium-design/{template}/index.html"
      - "outputs/premium-design/{template}/content-payload.yaml"
    log: "docs/logs/YYYY-MM-DD_premium-lp-{client_slug}.md"

  4.2_preview:
    action: "Oferecer preview no browser"
    tool: "playwright (optional)"
    command: |
      # Se playwright disponivel:
      mcp__playwright__browser_navigate → file:///path/to/index.html
      mcp__playwright__browser_take_screenshot

  4.3_report:
    action: "Apresentar resumo final"
    template: |
      ## Premium LP Complete (Local)

      **Cliente:** {client_name}
      **Template:** {config.template}
      **Tier:** {config.tier}

      **Artefatos:**
      - HTML: `outputs/premium-design/{template}/index.html`
      - Payload: `outputs/premium-design/{template}/content-payload.yaml`

      **Secoes renderizadas:**
      - [x] Nav ({nav.links.length} links)
      - [x] Hero ({hero.name}, {hero.labels.length} labels)
      - [x] Photo ({photo.treatment} treatment)
      - [x] Proof ({proof.items.length} metricas)
      - [x] Expertise ({expertise.cards.length} cards)
      - [x] Quote
      - [x] Stack ({stack.items.length} items)
      - [x] CTA
      - [x] Footer ({footer.links.length} links)

      **Proximo passo:** Deploy Vercel (Phase 5)
```

---

## Phase 5: Deploy Vercel

```yaml
phase: 5
name: "Deploy to Vercel"
executor: "@premium-design"
task: "squads/design/tasks/deploy-vercel-lp.md"
mode: autonomous

steps:
  5.1_prepare_vercel_config:
    action: "Create vercel.json in output dir"
    details: "buildCommand empty, static site, security headers"

  5.2_deploy:
    action: "vercel --prod --yes --name premium-lp-{client_slug}"
    output: "Production URL"

  5.3_health_check:
    action: "curl → HTTP 200"
    retry: "1 retry after 10s if initial check fails"

  5.4_save_deploy_info:
    action: "Write deploy-info.yaml with URL, timestamp, metadata"

checkpoint_4:
  name: "Deploy Live"
  blocking: true
  criteria:
    - deploy_info_exists: true
    - url_returns_200: true
    - vercel_project_created: true
  on_fail: "Check Vercel CLI auth, retry deploy"
```

---

## Phase 6: Notify WhatsApp

```yaml
phase: 6
name: "WhatsApp Notification"
executor: "@premium-design"
task: "squads/design/tasks/notify-whatsapp-lp.md"
condition: "requester.notify == true"
mode: autonomous

steps:
  6.1_load_credentials:
    action: "Load UAZAPI_BASE_URL + UAZAPI_TOKEN from env"
    source: "whatsapp-daily-digest/.env or environment"

  6.2_screenshot:
    action: "Take LP screenshot via Playwright"
    tool: "playwright"
    optional: true
    output: "{output_dir}/lp-screenshot.jpg"

  6.3_send_image:
    action: "UazAPI POST /send/media with screenshot + caption"
    condition: "screenshot available"

  6.4_send_text:
    action: "UazAPI POST /send/text with URL and LP details"

  6.5_log_notification:
    action: "Append notification status to deploy-info.yaml"

checkpoint_5:
  name: "Notification Sent"
  blocking: false  # Non-blocking — LP is already live
  criteria:
    - notification_attempted: true
    - deployed_url_in_message: true
  on_fail: "Log URL for manual sharing, warn user"
```

---

## Mode Comparison

| Aspect | Incremental | YOLO |
|--------|-------------|------|
| Phase 0 (Audio) | Show transcript | Auto-extract |
| Phase 1 (Elicitation) | Interactive | Interactive (always) |
| Phase 2 (Copy Gen) | Review payload | Auto-approve |
| Phase 3 (Rendering) | Show HTML path | Auto-render |
| Phase 4 (Delivery) | Preview + confirm | Auto-save |
| Phase 5 (Deploy) | Confirm before deploy | Auto-deploy |
| Phase 6 (Notify) | Confirm recipient | Auto-notify |
| Checkpoints | Human review | Auto-pass if criteria met |
| Duration | 35-50 min | 25-35 min |

---

## Quick Start

### For Human (via CLI)

```
# Option A: Full pipeline (elicit → copy → render → deploy → notify)
@premium-design
*full-pipeline

# Option B: Full pipeline from audio brief
@premium-design
*full-pipeline --audio /path/to/voice-note.ogg

# Option C: Copy first, then render + deploy
@copy-chief
*premium-lp
# [elicitation happens, payload generated]
@premium-design
*generate --payload outputs/premium-design/{template}/content-payload.yaml
*deploy
*notify 5511999887766

# Option D: Direct with known data
@premium-design
*generate --elicit
# [calls create-premium-lp-copy internally]
```

### For Automation (WhatsApp bot, etc.)

```yaml
# Pre-filled payload from external source
# See: squads/design/templates/automation-input-schema.yaml
automation_input:
  input_mode: "prefilled"
  payload:
    client_name: "Maria Silva"
    client_expertise: "Consultoria de RH"
    labels: ["HR Consultant", "People Strategist"]
    # ... all fields pre-filled
    template: "obsidian_gold"
    tier: "enhanced"
  requester:
    name: "Jose Carlos"
    number: "5511999887766"
    notify: true

# Skip Phase 0+1 → Phase 2 (copy refinement) → Phase 3-6 (render → deploy → notify)
```

### Audio Input (WhatsApp voice note)

```yaml
automation_input:
  input_mode: "audio"
  audio_path: "/tmp/whatsapp-voice-12345.ogg"
  language_hint: "pt"
  requester:
    name: "Jose Carlos"
    number: "5511999887766"
    notify: true
  template: "nocturne_cian"
  tier: "enhanced"

# Phase 0 (transcribe) → Phase 1 (elicit missing) → Phase 2-6
```

---

## Error Recovery

```yaml
recovery:
  phase_1_incomplete:
    action: "Save partial answers, resume later"
    state: "outputs/premium-design/.pending/{client_slug}.yaml"

  phase_2_validation_fail:
    action: "Auto-fix constraints, log changes"
    retry: true
    max_retries: 2

  phase_3_render_fail:
    action: "Check template file, validate tokens"
    fallback: "Render with default tokens"

  phase_4_save_fail:
    action: "Try alternative path, warn user"
```

---

## Dependencies

```yaml
files:
  # CopywriterOS
  - squads/copywriter-os/tasks/create-premium-lp-copy.md
  - squads/copywriter-os/agents/david-ogilvy.md
  - squads/copywriter-os/agents/gary-bencivenga.md

  # Design Squad - Core
  - squads/design/agents/premium-design.md
  - squads/design/templates/premium-lp-content-schema.yaml
  - squads/design/templates/premium-lp-tokens.yaml
  - squads/design/templates/premium-lp-template.html

  # Design Squad - Extended Pipeline
  - squads/design/tasks/transcribe-lp-brief.md
  - squads/design/tasks/deploy-vercel-lp.md
  - squads/design/tasks/notify-whatsapp-lp.md
  - squads/design/templates/automation-input-schema.yaml
  - squads/design/templates/lp-brief-extraction-schema.yaml

agents:
  - copy-chief (orchestrator, CopywriterOS)
  - david-ogilvy (copy generation)
  - gary-bencivenga (bullets, optional)
  - premium-design (visual rendering + deploy + notify)
  - design-chief (routing, optional)
```

---

*Workflow Version: 2.0.0*
*Created: 2026-02-15*
*Type: Cross-Squad (CopywriterOS + Design)*
*Extended: Audio input, Vercel deploy, WhatsApp notification*

# Story 6.1.2.5: Contextual Agent Load System

**Story ID:** STORY-6.1.2.5
**Epic:** Epic-6.1 - Agent Identity System
**Wave:** Wave 1 (Foundation)
**Template:** story-tmpl.yaml v2.0
**Status:** 📋 Ready to Start
**Priority:** 🟡 Medium (UX Enhancement)
**Owner:** Dev (Dex)
**Created:** 2025-01-15
**Duration:** 4 days
**Investment:** $400

---

## 📖 Story

**As a** AIOS framework user,
**I want** agents to show contextual greetings with intelligent next-step suggestions based on my session type, git configuration, and workflow state,
**so that** I see relevant information and pre-populated commands that guide me through workflows without cognitive overload.

---

## 📋 Objective

Implement intelligent agent greeting system that adapts based on:
1. **Git Configuration Status** (configured vs unconfigured project)
2. **Session Context** (new window vs existing context vs recurring workflow)
3. **Command Visibility** (full vs quick vs key commands based on context)
4. **Workflow Navigation** (next-step suggestions with pre-populated commands based on workflow state)

---

## 🎯 Scope

### In Scope
- ✅ Context detection (hybrid: conversation history + file-based)
- ✅ Workflow detection (hardcoded patterns in YAML)
- ✅ Workflow navigation (next-step suggestions with pre-populated commands)
- ✅ Workflow state tracking (agent exit hooks save context)
- ✅ Git config detection (cached with 5min TTL)
- ✅ Command categorization (metadata in agent files)
- ✅ Greeting builder with 3 session types
- ✅ Git warning at END of greeting (when not configured)
- ✅ Performance optimization (150ms hard limit)
- ✅ Backwards compatibility (graceful fallback)

### Out of Scope
- ❌ Dynamic pattern learning (future: Story 6.1.2.6)
- ❌ Usage-based command selection (over-engineering)
- ❌ Agent collaboration hints (future: Story 6.1.2.7)
- ❌ Memory layer integration (future: when Story 4.5 ready)

---

## 🤖 CodeRabbit Integration

### Story Type Analysis
- **Primary Type:** Architecture (Layer 1 - Agent Greeting System)
- **Secondary Type(s):** UX Enhancement, Performance Optimization, Workflow Intelligence
- **Complexity:** Medium-High (4 new components + config changes + 11 agent updates + workflow patterns)

### Specialized Agent Assignment

**Primary Agents:**
- **@dev (Dex):** Implement context detection, git config caching, greeting builder
- **@architect (Aria):** Validate architecture compliance with approved design

**Supporting Agents:**
- **@qa (Quinn):** Test context detection accuracy, performance benchmarks
- **@po (Pax):** Validate command categorization choices with user testing

### Quality Gate Tasks

- [ ] **Pre-Commit (@dev):** Run before marking story complete
  - All 4 detection systems working (context, workflow, workflow navigation, git config)
  - Workflow navigation suggestions accurate (validated → develop, reviewed → fix)
  - Performance tests passing (P50 <100ms, P95 <130ms, P99 <150ms)
  - Command visibility metadata added to all 11 agents
  - Agent exit hooks save workflow context correctly
  - Fallback strategy tested (graceful degradation)
  - Unit test coverage ≥80%

- [ ] **Pre-Handoff (@architect):** Run before Story 6.1.4 integration
  - Architecture matches approved design document
  - Config schema compatible with Story 6.1.4 agentIdentity section
  - No breaking changes to existing agent activation
  - Performance budget met (150ms hard limit)

### CodeRabbit Focus Areas

**Primary Focus:**
- **Performance:** Greeting generation must meet 150ms hard limit (P99)
- **Backwards Compatibility:** Old agents without metadata must still work
- **Graceful Degradation:** Failures at any layer must not break agent activation
- **Cache Invalidation:** Git config cache must invalidate when @devops configures project

**Secondary Focus:**
- **Config Schema Validation:** agentIdentity.greeting structure matches approved design
- **Command Categorization:** Metadata in agent files is consistent and valid
- **Workflow Pattern Accuracy:** Hardcoded patterns match actual user workflows

---

## 📊 Tasks Breakdown

### Day 1: Core Detection Systems (8 hours)

**Task 1.1: Implement ContextDetector.js** (3 hours)
- Create `.aios-core/scripts/context-detector.js`
- Implement `detectSessionType(conversationHistory, sessionFile)` → new | existing | workflow
- Hybrid approach: Prefer conversation history, fallback to file
- File-based tracking: `.aios/session-state.json` (TTL: 1 hour)
- Conversation analysis: Extract last 10 commands, detect workflow patterns
- Unit tests: 15+ test cases (new session, existing, workflow detection)

**Task 1.2: Implement GitConfigDetector.js** (3 hours)
- Create `.aios-core/scripts/git-config-detector.js`
- Implement cached detection with 5-minute TTL
- Methods: `get()`, `detect()`, `invalidate()`
- Timeout protection: 1000ms for git commands
- Smart invalidation: Triggered by @devops, git init, git remote add
- Unit tests: 10+ test cases (cache hit/miss, timeout, invalidation)

**Task 1.3: Create Workflow Patterns** (2 hours)
- Create `.aios-core/data/workflow-patterns.yaml`
- Define 5-10 common workflows:
  - story_development: [validate-story-draft, develop, review-qa, pre-push]
  - epic_creation: [create-epic, create-story, validate-story-draft]
  - backlog_management: [backlog-review, backlog-prioritize, backlog-schedule]
  - architecture_review: [create-doc, review, shard-doc]
  - git_workflow: [commit, push, create-pr]
- Include agent_sequence and key_commands for each workflow
- Validation: Ensure patterns match actual user workflows

### Day 2: Greeting Builder & Integration (8 hours)

**Task 2.1: Implement GreetingBuilder.js** (4 hours)
- Create `.aios-core/scripts/greeting-builder.js`
- Methods:
  - `buildGreeting(agent, sessionType, gitConfig)` → string
  - `buildPresentation(agent)` → {{presentation}}
  - `buildRoleDescription(agent, sessionType)` → {{role}}
  - `buildProjectStatus(gitConfig)` → {{project_status}} (reuse project-status-loader.js)
  - `buildCurrentContext(sessionType)` → {{current_context}}
  - `buildCommands(agent, sessionType)` → {{commands}}
  - `buildGitWarning(gitConfig)` → {{git_warning}} (AT END)
- Timeout protection: 150ms hard limit with fallback
- Unit tests: 20+ test cases (all 3 session types, git configured/unconfigured)

**Task 2.2: Add Command Visibility Metadata to Agents** (3 hours)
- Update 11 agent files with command visibility metadata
- Schema:
  ```yaml
  commands:
    - name: help
      visibility: [full, quick, key]
      description: "Show available commands"
  ```
- Phase 1 agents (high-traffic): po, dev, qa (add full metadata)
- Phase 2 agents (remaining): pm, sm, architect, analyst, ux-design-expert, data-engineer, devops, aios-master (add basic metadata)
- Validate: All agents have at least 3 commands with visibility metadata

**Task 2.3: Update core-config.yaml Schema** (1 hour)
- Add `git` top-level section:
  ```yaml
  git:
    showConfigWarning: true
    cacheTimeSeconds: 300
  ```
- Add `agentIdentity.greeting` subsection:
  ```yaml
  agentIdentity:
    greeting:
      contextDetection: true
      sessionDetection: hybrid
      workflowDetection: hardcoded
      performance:
        gitCheckCache: true
        gitCheckTTL: 300
  ```
- Coordinate with Story 6.1.4 schema (ensure no conflicts)

### Day 3: Testing & Polish (8 hours)

**Task 3.1: Implement Session State Tracking** (2 hours)
- Create `.aios/session-state.json` file format:
  ```json
  {
    "sessionId": "uuid",
    "startTime": timestamp,
    "lastActivity": timestamp,
    "workflowActive": "story_development" | null,
    "lastCommands": ["validate-story-draft", "develop"],
    "agentSequence": ["po", "dev"]
  }
  ```
- Update on every agent activation
- Auto-expire after 1 hour of inactivity

**Task 3.2: Implement Fallback Strategy** (2 hours)
- Enhanced fallback with timeout protection:
  ```javascript
  async function buildGreeting(agent, context) {
    const fallbackGreeting = buildSimpleGreeting(agent);

    try {
      const greetingPromise = buildContextualGreeting(agent, context);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 150)
      );
      return await Promise.race([greetingPromise, timeoutPromise]);
    } catch (error) {
      console.warn('[Greeting] Fallback:', error.message);
      return fallbackGreeting;
    }
  }
  ```
- Safe wrappers for each subsystem (safeDetectSessionType, safeCheckGitConfig, safeFilterCommands)
- Conservative defaults on failure (assume 'new' session, show all commands)

**Task 3.3: Performance Testing** (2 hours)
- Measure baseline (current simple greeting): 80-130ms
- Measure contextual greeting:
  - First load (cache miss): <150ms (P99)
  - Subsequent loads (cache hit): <100ms (P50)
- Parallel operations test (context + git + commands)
- Timeout protection test (ensure 150ms hard limit works)
- Performance benchmarks documented

**Task 3.4: Integration Testing** (2 hours)
- Test all 11 agents with new greeting system
- Test 3 session types (new, existing, workflow)
- Test git configured vs unconfigured
- Test command visibility (full, quick, key)
- Test fallback strategy (simulate failures)
- Test backwards compatibility (old greeting format)
- Document test results

### Day 4: Workflow Navigation System (8 hours)

**Task 4.1: Implement WorkflowNavigator.js** (3 hours)
- Create `.aios-core/scripts/workflow-navigator.js`
- Methods:
  - `detectWorkflowState(commandHistory, context)` → { workflow, state, context }
  - `suggestNextCommands(workflowState)` → array of suggestions
  - `populateTemplate(template, context)` → pre-populated command
  - `formatSuggestions(suggestions)` → numbered list string
  - `extractContext(context)` → { story_path, branch, epic }
- Workflow state detection based on last command success
- Unit tests: 15+ test cases (state detection, suggestion generation, template population)

**Task 4.2: Enhance workflow-patterns.yaml with Transitions** (2 hours)
- Add `transitions` section to each workflow:
  - story_development: validated, in_development, qa_reviewed states
  - epic_creation: epic_created state
  - backlog_management: backlog_analyzed state
- Each transition defines:
  - `trigger`: "command completed successfully"
  - `greeting_message`: Context-specific message
  - `next_steps`: Array of suggested commands with args templates
- Validate: All transitions have 2-4 next-step suggestions
- Document common workflow patterns

**Task 4.3: Implement Agent Exit Hooks** (2 hours)
- Create agent exit hook system in agent activation logic
- On command success, save workflow context to session-state.json:
  - `workflowState`: Current state name
  - `context.story_path`: Path to story being worked on
  - `context.branch`: Current git branch
  - `lastCommand.status`: 'success' | 'failure'
- Hook integration points:
  - @po validate-story-draft → save story_path + set state to 'validated'
  - @dev develop → save story_path + set state to 'in_development'
  - @qa review-qa → set state to 'qa_reviewed'
- Unit tests: 10+ test cases (hook execution, context saving, state transitions)

**Task 4.4: Integrate with GreetingBuilder.js** (1 hour)
- Update `buildWorkflowGreeting()` to include workflow suggestions
- Call WorkflowNavigator to get next-step suggestions
- Format suggestions as numbered list with descriptions
- Add suggestions section between {{workflow_context}} and {{commands_key}}
- Fallback: If no suggestions available, show key commands as before
- Example output:
  ```
  Story validated! Next steps:

  1. *develop-yolo story-6.1.2.5.md - Autonomous mode
  2. *develop-interactive story-6.1.2.5.md - Interactive mode
  3. *develop-preflight story-6.1.2.5.md - Plan first
  ```

---

## ✅ Acceptance Criteria

### Must Have

#### AC1: Context Detection Works
- [ ] Hybrid detection prefers conversation history when available
- [ ] Falls back to file-based session tracking when history unavailable
- [ ] Correctly identifies 'new' session (conversation.length === 0)
- [ ] Correctly identifies 'existing' session (conversation.length > 0, no workflow)
- [ ] Correctly identifies 'workflow' session (matches hardcoded pattern)
- [ ] Session state file (`.aios/session-state.json`) created and updated

#### AC2: Workflow Detection Accurate
- [ ] 5+ common workflows defined in `workflow-patterns.yaml`
- [ ] Story development workflow detected (validate→develop→review)
- [ ] Epic creation workflow detected (create-epic→create-story)
- [ ] Backlog management workflow detected (backlog-review→prioritize)
- [ ] Workflow detection uses last 5 commands from history

#### AC3: Git Config Detection Fast
- [ ] First check completes in <50ms (git commands executed)
- [ ] Cached checks complete in <5ms (cache hit)
- [ ] Cache TTL is 5 minutes (configurable in core-config.yaml)
- [ ] Cache invalidates when @devops runs, git init, or git remote add
- [ ] Timeout protection (1000ms) prevents hanging
- [ ] Graceful fallback on git command failure (assume unconfigured)

#### AC4: Command Categorization Implemented
- [ ] All 11 agents have command visibility metadata
- [ ] Metadata schema: `visibility: [full, quick, key]`
- [ ] Full greeting shows 12 commands (new session)
- [ ] Quick greeting shows 6-8 commands (existing session)
- [ ] Key greeting shows 3-5 commands (workflow session)
- [ ] Agents without metadata show all commands (backwards compatible)

#### AC5: Greeting Builder Generates Correct Output
- [ ] New session greeting includes: presentation + role + full commands
- [ ] Existing session greeting includes: presentation + project status + current context + quick commands
- [ ] Workflow session greeting includes: presentation (minimal) + project status + workflow context + key commands
- [ ] Git warning appears at END of greeting (not replacing project status)
- [ ] Project status uses existing `project-status-loader.js` (reuse)
- [ ] Fallback to simple greeting on any error (backwards compatible)

#### AC6: Performance Budget Met
- [ ] P50 latency: <100ms (median greeting generation)
- [ ] P95 latency: <130ms (95th percentile)
- [ ] P99 latency: <150ms (hard limit via timeout)
- [ ] Parallel operations implemented (context + git + commands run concurrently)
- [ ] No performance regression for simple greeting fallback

#### AC7: Configuration System Works
- [ ] `git.showConfigWarning` setting in core-config.yaml
- [ ] `agentIdentity.greeting` subsection in core-config.yaml
- [ ] Settings read correctly on agent activation
- [ ] User can disable git warning via config
- [ ] User can disable contextual greeting via config (fallback to simple)

#### AC8: Backwards Compatibility Maintained
- [ ] Old agents without visibility metadata still work (show all commands)
- [ ] Contextual greeting failure falls back to simple greeting (Story 6.1.2 format)
- [ ] No breaking changes to agent activation flow
- [ ] Session state file is optional (graceful if missing)
- [ ] Git config detection is optional (graceful if git unavailable)

#### AC9: Workflow Navigation System Works
- [ ] WorkflowNavigator detects workflow state from command history
- [ ] Next-step suggestions shown for validated stories (develop-yolo, develop-interactive, develop-preflight)
- [ ] Next-step suggestions shown for QA reviewed stories (apply-qa-fixes, pre-push-gate)
- [ ] Commands pre-populated with context (story path, branch)
- [ ] Suggestions formatted as numbered list with descriptions
- [ ] Agent exit hooks save workflow context correctly
- [ ] Workflow state persists in session-state.json
- [ ] Fallback to key commands when no workflow detected
- [ ] Workflow suggestions appear in workflow greeting between context and commands
- [ ] Enhanced workflow-patterns.yaml includes transitions for all workflows

### Should Have

- [ ] Git warning message is helpful and actionable
- [ ] Workflow detection logs missed patterns for future improvement
- [ ] Performance telemetry tracks P50/P95/P99 latencies
- [ ] Session state file auto-cleans expired sessions (>1 hour old)

### Nice to Have

- [ ] Command visibility supports custom categories (not just full/quick/key)
- [ ] Workflow patterns can be overridden per-user
- [ ] Context detection learns from user behavior over time (future: Story 6.1.2.6)

---

## 🔗 Dependencies

### Prerequisites (Blocking)
- ✅ **Story 6.1.2:** Agent File Updates (agents have persona_profile)
- ✅ **Story 6.1.2.4:** Project Status Context (project-status-loader.js exists)
- 🔄 **Story 6.1.4:** Configuration System (agentIdentity section needed)

### Dependent Stories (This Blocks)
- None (enhancement, doesn't block critical path)

### Optional Integrations
- **Story 4.5:** Memory Layer Integration (for future workflow tracking)
- **Story 6.1.2.6:** Memory-based workflow detection (future)
- **Story 6.1.2.7:** Agent collaboration hints (future)

---

## 📁 Files Modified

### New Files Created
- `.aios-core/scripts/context-detector.js` (Context detection logic)
- `.aios-core/scripts/git-config-detector.js` (Git config caching)
- `.aios-core/scripts/greeting-builder.js` (Greeting assembly)
- `.aios-core/scripts/workflow-navigator.js` (Workflow navigation and next-step suggestions)
- `.aios-core/data/workflow-patterns.yaml` (Hardcoded workflow definitions with transitions)
- `.aios/session-state.json` (Session tracking - created at runtime)
- `tests/unit/context-detector.test.js` (Unit tests)
- `tests/unit/git-config-detector.test.js` (Unit tests)
- `tests/unit/greeting-builder.test.js` (Unit tests)
- `tests/unit/workflow-navigator.test.js` (Unit tests)
- `tests/integration/contextual-greeting.test.js` (Integration tests)
- `tests/integration/workflow-navigation.test.js` (Integration tests)

### Files Modified
- `.aios-core/core-config.yaml` (Add git + agentIdentity.greeting sections)
- `.aios-core/agents/po.md` (Add command visibility metadata)
- `.aios-core/agents/dev.md` (Add command visibility metadata)
- `.aios-core/agents/qa.md` (Add command visibility metadata)
- `.aios-core/agents/pm.md` (Add command visibility metadata)
- `.aios-core/agents/sm.md` (Add command visibility metadata)
- `.aios-core/agents/architect.md` (Add command visibility metadata)
- `.aios-core/agents/analyst.md` (Add command visibility metadata)
- `.aios-core/agents/ux-design-expert.md` (Add command visibility metadata)
- `.aios-core/agents/data-engineer.md` (Add command visibility metadata)
- `.aios-core/agents/devops.md` (Add command visibility metadata)
- `.aios-core/agents/aios-master.md` (Add command visibility metadata)

### Files Referenced
- `.aios-core/scripts/project-status-loader.js` (Reused for project status)

---

## 💰 Investment Breakdown

- Day 1 (Detection Systems): 8 hours @ $12.50/hr = $100
- Day 2 (Greeting Builder + Integration): 8 hours @ $12.50/hr = $100
- Day 3 (Testing + Polish): 8 hours @ $12.50/hr = $100
- Day 4 (Workflow Navigation System): 8 hours @ $12.50/hr = $100
- **Total:** 32 hours = $400

---

## 🎯 Success Metrics

- **Performance:** P99 latency <150ms (hard limit)
- **Adoption:** 80%+ users prefer contextual greeting over simple greeting
- **Opt-out Rate:** <5% users disable contextual greeting
- **Failure Rate:** <0.1% greeting generation failures (with fallback)
- **Test Coverage:** ≥80% for all new modules
- **User Satisfaction:** 4.5/5 stars in user testing (5-10 users)

---

## ⚠️ Risks & Mitigation

### Risk 1: Context detection inaccurate
- **Likelihood:** Medium
- **Impact:** Medium (wrong greeting shown)
- **Mitigation:** Start with conservative defaults (assume 'new'), gather user feedback, iterate

### Risk 2: Git detection adds latency
- **Likelihood:** Medium
- **Impact:** Low (cached after first check)
- **Mitigation:** 5-minute cache + timeout protection (1000ms) + parallel execution

### Risk 3: Workflow patterns too rigid
- **Likelihood:** Medium
- **Impact:** Low (workflow not detected, shows 'existing' greeting)
- **Mitigation:** Start with 5-10 common patterns, add more based on user feedback, log missed patterns

### Risk 4: Command categorization subjective
- **Likelihood:** Low
- **Impact:** Low (wrong commands shown)
- **Mitigation:** User testing with 5-10 users, gather feedback, adjust metadata

### Risk 5: Breaking existing agents
- **Likelihood:** Low
- **Impact:** High (agent activation fails)
- **Mitigation:** Comprehensive fallback strategy, backwards compatibility tests, graceful degradation

### Risk 6: Conflicts with Story 6.1.4
- **Likelihood:** Medium
- **Impact:** Medium (config schema incompatible)
- **Mitigation:** Coordinate with Story 6.1.4 implementation, ensure agentIdentity schema matches

---

## 📝 Dev Notes

### Architecture Reference
**Approved Design Document:** `docs/architecture/architectural-review-contextual-agent-load.md`

**Key Architectural Decisions:**
1. **Context Detection:** Hybrid approach (conversation history preferred, file-based fallback)
2. **Workflow Detection:** Hardcoded patterns in YAML (evolve to memory later)
3. **Workflow Navigation:** Next-step suggestions with pre-populated commands (WorkflowNavigator.js)
4. **Git Config:** Cached with 5-minute TTL, smart invalidation
5. **Command Categorization:** Metadata in agent files (single source of truth)
6. **Git Warning Placement:** At END of greeting (not replacing project status)
7. **Performance Budget:** 150ms hard limit, 100ms target
8. **Backwards Compatibility:** Graceful fallback at every layer
9. **Agent Exit Hooks:** Save workflow context on command success

### Greeting Structure

**New Session Greeting:**
```
{{presentation}}      - ⚖️ Pax (Balancer) ready. Let's prioritize together!
{{role}}              - As Product Owner, I help with...
{{project_status}}    - 📊 Project Status (if git configured)
{{commands_full}}     - Available Commands: 1-12
{{git_warning}}       - ⚠️ Warning (if git not configured) - AT END
```

**Existing Session Greeting:**
```
{{presentation}}      - ⚖️ Pax (Balancer) ready.
{{project_status}}    - 📊 Project Status
{{current_context}}   - 📌 Current Context (working on, last action)
{{commands_quick}}    - Quick Commands: 6-8
```

**Workflow Session Greeting:**
```
{{presentation}}        - ⚖️ Pax ready. (minimal)
{{project_status}}      - 📊 Project Status (condensed)
{{workflow_context}}    - 📌 Context: Story 6.1.6 validated
{{workflow_suggestions}} - Next steps: (NEW)
                          1. *develop-yolo story-6.1.6.md - Autonomous mode
                          2. *develop-interactive story-6.1.6.md - Interactive mode
                          3. *develop-preflight story-6.1.6.md - Plan first
{{commands_key}}        - Key Commands: 3-5 (fallback if no suggestions)
```

### Performance Optimization

**Parallelization:**
```javascript
async function buildContextualGreeting(agent, context) {
  // Run all 3 detections in parallel
  const [sessionType, gitConfig, commands] = await Promise.all([
    safeDetectSessionType(context),
    safeCheckGitConfig(),
    safeFilterCommands(agent, sessionType)
  ]);

  return assembleGreeting({ agent, sessionType, gitConfig, commands });
}
```

**Timeout Protection:**
```javascript
const greetingPromise = buildContextualGreeting(agent, context);
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 150)
);

return await Promise.race([greetingPromise, timeoutPromise]);
```

### Testing Standards

**Test Framework:** Jest (already in project dependencies)

**Test Commands:**
```bash
npm run test:unit -- tests/unit/context-detector.test.js
npm run test:unit -- tests/unit/git-config-detector.test.js
npm run test:unit -- tests/unit/greeting-builder.test.js
npm run test:integration -- tests/integration/contextual-greeting.test.js
```

**Coverage Target:** ≥80% for all new modules

**Test Data:**
- Mock conversation history (10+ messages)
- Mock session state files
- Mock git config responses
- Mock agent definitions with/without visibility metadata

### Error Handling Strategy

**Throw Errors:**
- Invalid configuration (schema validation errors)
- Required dependencies missing (project-status-loader.js not found)

**Return Defaults:**
- Context detection failure → return 'new'
- Git config detection failure → return { configured: false, type: null }
- Command filtering failure → return all commands (up to 12)

**Log Warnings:**
- Workflow pattern not matched (log pattern for future addition)
- Cache miss on git config (performance telemetry)
- Greeting generation >100ms (performance telemetry)

### Integration Points

**Existing Components:**
- `project-status-loader.js` - Reuse for {{project_status}} section
- `persona_profile` - Use for {{presentation}} section
- `core-config.yaml` - Read agentIdentity.greeting settings

**New Components:**
- `context-detector.js` - Session type detection
- `git-config-detector.js` - Git configuration caching
- `greeting-builder.js` - Assemble contextual greeting
- `workflow-navigator.js` - Workflow navigation and next-step suggestions
- `workflow-patterns.yaml` - Hardcoded workflow definitions with transitions

### Backwards Compatibility

**Graceful Degradation:**
```javascript
// If contextual greeting fails, use simple greeting (Story 6.1.2 format)
function buildSimpleGreeting(agent) {
  return `${agent.persona_profile.greeting_levels.named}\n\nType \`*help\` to see available commands.`;
}

// If agent has no visibility metadata, show all commands
function getVisibleCommands(agent, sessionType) {
  const commandsWithMetadata = agent.commands.filter(cmd =>
    cmd.visibility?.includes(sessionType)
  );

  if (commandsWithMetadata.length > 0) {
    return commandsWithMetadata; // Use metadata
  }

  return agent.commands.slice(0, 12); // Fallback: show all
}
```

---

## 📝 Testing

### Unit Tests

**context-detector.test.js (15+ tests):**
- Detect 'new' session (conversation.length === 0)
- Detect 'existing' session (conversation.length > 0, no workflow)
- Detect 'workflow' session (matches pattern)
- Hybrid detection prefers conversation over file
- Hybrid detection falls back to file when conversation empty
- Session state file parsing
- Session state TTL expiration (>1 hour)

**git-config-detector.test.js (10+ tests):**
- Cache hit returns cached data (<5ms)
- Cache miss executes git commands (<50ms)
- Cache expires after 5 minutes
- Invalidate() clears cache
- Timeout protection (1000ms)
- Graceful fallback on git command failure

**greeting-builder.test.js (20+ tests):**
- Build new session greeting
- Build existing session greeting
- Build workflow session greeting
- Git warning at END (not replacing project status)
- Project status shown when git configured
- Project status hidden when git not configured
- Commands filtered by visibility metadata
- Fallback to all commands when metadata missing
- Timeout protection (150ms)
- Parallel operations (context + git + commands)

**workflow-navigator.test.js (15+ tests):**
- Detect workflow state from command history
- Suggest next commands for 'validated' state
- Suggest next commands for 'qa_reviewed' state
- Populate command templates with context
- Extract context (story_path, branch, epic)
- Format suggestions as numbered list
- Match workflow triggers correctly
- Handle missing workflow patterns
- Handle missing context gracefully
- Fallback to empty suggestions if no state detected

### Integration Tests

**contextual-greeting.test.js (10+ tests):**
- Test all 11 agents with contextual greeting
- Test 3 session types (new, existing, workflow)
- Test git configured vs unconfigured
- Test command visibility (full, quick, key)
- Test fallback strategy (simulate failures)
- Test backwards compatibility (old greeting format)
- Performance benchmarks (P50, P95, P99)

**workflow-navigation.test.js (8+ tests):**
- Test workflow greeting with next-step suggestions
- Test @po validate-story-draft → @dev suggestions shown
- Test @qa review-qa → @dev apply-qa-fixes suggestion shown
- Test agent exit hooks save context correctly
- Test workflow state persists in session-state.json
- Test pre-populated commands include story path
- Test fallback to key commands when no workflow state
- Test workflow suggestions formatted correctly

### User Acceptance Testing

**Beta Users:** 5-10 users
**Test Scenarios:**
1. New user opens Claude Code (new session greeting)
2. User continues work in existing session (existing greeting)
3. User in story development workflow (workflow greeting)
4. User validates story with @po, sees develop suggestions
5. User completes QA review, sees fix/gate suggestions
6. Project without git configured (git warning at end)
7. User disables contextual greeting (falls back to simple)

**Success Criteria:** 4.5/5 stars average rating

---

## 🔄 Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-15 | 1.0 | Story created from architectural review | Pax (po) |
| 2025-01-15 | 1.0 | Architectural review completed and approved | Aria (architect) |
| 2025-01-15 | 1.0 | Post-review adjustment: Git warning placement moved to END | Pax (po) |
| 2025-01-15 | 1.1 | Added Workflow Navigation System (Day 4, +$100, WorkflowNavigator.js) | Aria (architect) |

---

## 🔗 Related Documents

- **Epic:** [Epic 6.1 - Agent Identity System](../../epics/epic-6.1-agent-identity-system.md)
- **Architecture Review:** [Contextual Agent Load System](../../architecture/architectural-review-contextual-agent-load.md)
- **Standard:** [Agent Personalization Standard V1.0](../../standards/AGENT-PERSONALIZATION-STANDARD-V1.md)
- **Dependency:** [Story 6.1.2 - Agent File Updates](story-6.1.2.md)
- **Dependency:** [Story 6.1.2.4 - Project Status Context](story-6.1.2.4-project-status-context.md)
- **Dependency:** [Story 6.1.4 - Configuration System](story-6.1.4.md)

---

**Last Updated:** 2025-01-15
**Previous Story:** [Story 6.1.2.4 - Project Status Context](story-6.1.2.4-project-status-context.md)
**Next Story:** TBD (implement after Story 6.1.4 completes)
**Architectural Review:** ✅ Approved by @architect (2025-01-15)

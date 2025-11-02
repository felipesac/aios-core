# Develop Story Task

## Purpose

Execute story development with selectable automation modes to accommodate different developer preferences, skill levels, and story complexity.

## Mode Selection

**Choose your development mode**:

1. **YOLO Mode** - Fast, autonomous (0-1 prompts)
   - Autonomous decision making with logging
   - Minimal user interaction
   - Best for: Experienced developers, simple stories, time-sensitive work

2. **Interactive Mode** - Balanced, educational (5-10 prompts) **[DEFAULT]**
   - Explicit decision checkpoints
   - Educational explanations
   - Best for: Learning, complex decisions, collaborative work

3. **Pre-Flight Planning** - Comprehensive upfront planning
   - Story analysis phase (identify all ambiguities)
   - Questionnaire before execution
   - Zero ambiguity execution
   - Best for: Ambiguous stories, critical work, team consensus needed

**Parameter**: `mode` (optional, default: `interactive`)

**Valid values**: `yolo`, `interactive`, `preflight`

**Usage**:
```
*develop {story-id}           # Uses interactive mode (default)
*develop {story-id} yolo      # Uses YOLO mode
*develop {story-id} preflight # Uses pre-flight planning mode
```

**Edge Case Handling**:
- Invalid mode → Default to interactive with warning
- User cancellation → Exit gracefully with message
- Missing story file → Clear error message, halt execution
- Backward compatibility → Stories without mode parameter use interactive

---

## Mode: YOLO (Autonomous)

### Workflow

1. **Story Analysis** (Autonomous)
   - Read story file completely
   - Identify all tasks and acceptance criteria
   - Analyze technical requirements
   - **Log decision**: Story complexity assessment

2. **Task Execution** (Autonomous loop)
   - Read next task
   - **Make autonomous decisions**:
     - Architecture choices (log decision + rationale)
     - Library selections (log decision + rationale)
     - Algorithm implementations (log decision + rationale)
   - Implement task and subtasks
   - Write tests
   - Execute validations
   - Mark task complete [x] only if ALL validations pass
   - Update File List

3. **Decision Logging**
   - All autonomous decisions logged to `.ai/decision-log-{story-id}.md`
   - Format:
     ```markdown
     ## Decision: {Decision Title}
     **Task**: {Task ID}
     **Choice**: {Selected Option}
     **Rationale**: {Why this choice}
     **Alternatives Considered**: {Other options}
     **Timestamp**: {ISO 8601}
     ```

4. **Completion**
   - All tasks complete
   - All tests pass
   - Execute story-dod-checklist
   - Set status: "Ready for Review"
   - **Summary**: Present decision log summary to user

**User Prompts**: 0-1 (only if blocking issue requires approval)

---

## Mode: Interactive (Balanced) **[DEFAULT]**

### Workflow

1. **Story Analysis** (With User)
   - Read story file completely
   - Present summary of tasks and AC
   - Confirm understanding with user

2. **Task Execution** (Interactive loop)
   - Read next task
   - **Decision Checkpoints** (Prompt user at):
     - Architecture decisions (e.g., "Use microservices or monolith?")
     - Library selections (e.g., "Use Axios or Fetch?")
     - Algorithm choices (e.g., "Use BFS or DFS for gr
## Configuration Dependencies

This task requires the following configuration keys from `core-config.yaml`:

- **`architectureShardedLocation`**: Location for sharded architecture documents (typically docs/architecture)
- **`qaLocation`**: QA output directory (typically docs/qa) - Required to write quality reports

**Loading Config:**
```javascript
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../.aios-core/core-config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const architectureShardedLocation = config.architectureShardedLocation || 'docs/architecture';
const qaLocation = config.qa?.qaLocation || 'docs/qa';
```

aph traversal?")
     - Testing approaches (e.g., "Unit tests or integration tests first?")

   - **Educational Explanations**:
     - Before each decision: Explain the options and trade-offs
     - After user choice: Explain why it's a good fit for this context
     - During implementation: Explain what you're doing and why

   - Implement task and subtasks
   - Write tests
   - Execute validations
   - Show results to user before marking [x]
   - Update File List

3. **Completion**
   - All tasks complete
   - All tests pass
   - Execute story-dod-checklist
   - Present completion summary to user
   - Set status: "Ready for Review"

**User Prompts**: 5-10 (balanced for control and speed)

---

## Mode: Pre-Flight Planning (Comprehensive)

### Workflow

1. **Story Analysis Phase**
   - Read story file completely
   - **Identify all ambiguities**:
     - Missing technical specifications
     - Unspecified library choices
     - Unclear acceptance criteria
     - Undefined edge case handling
     - Missing testing guidance

2. **Questionnaire Generation**
   - Generate comprehensive questions covering:
     - Architecture decisions
     - Library and framework choices
     - Algorithm and data structure selections
     - Testing strategy
     - Edge case handling
     - Performance requirements
     - Security considerations

   - Present all questions to user at once
   - Collect all responses in batch

3. **Execution Plan Creation**
   - Create detailed execution plan with all decisions documented
   - Present plan to user for approval
   - Wait for user confirmation before proceeding

4. **Zero-Ambiguity Execution**
   - Execute tasks with full context from questionnaire
   - No additional decision points (all decided in pre-flight)
   - Implement task and subtasks
   - Write tests
   - Execute validations
   - Mark task complete [x] only if ALL validations pass
   - Update File List

5. **Completion**
   - All tasks complete
   - All tests pass
   - Execute story-dod-checklist
   - Present execution summary vs. plan
   - Set status: "Ready for Review"

**User Prompts**: All upfront (questionnaire phase), then 0 during execution

---

## Common Workflow (All Modes)

### Order of Execution

1. Read (first or next) task
2. Implement task and its subtasks
3. Write tests
4. Execute validations
5. **Only if ALL pass**: Mark task checkbox [x]
6. Update story File List (ensure all created/modified/deleted files listed)
7. Repeat until all tasks complete

### Story File Updates (All Modes)

**CRITICAL**: ONLY update these sections:
- Tasks / Subtasks checkboxes
- Dev Agent Record section and all subsections
- Agent Model Used
- Debug Log References
- Completion Notes List
- File List
- Change Log (add entry on completion)
- Status (set to "Ready for Review" when complete)

**DO NOT modify**: Story, Acceptance Criteria, Dev Notes, Testing sections

### Blocking Conditions (All Modes)

**HALT and ask user if**:
- Unapproved dependencies needed
- Ambiguous requirements after checking story
- 3 failures attempting to implement or fix something
- Missing configuration
- Failing regression tests

### Ready for Review Criteria (All Modes)

- Code matches all requirements
- All validations pass
- Follows coding standards
- File List is complete and accurate

### Completion Checklist (All Modes)

1. All tasks and subtasks marked [x]
2. All have corresponding tests
3. All validations pass
4. Full regression test suite passes
5. File List is complete
6. Execute `.aios-core/checklists/story-dod-checklist.md`
7. Set story status: "Ready for Review"
8. HALT (do not proceed further)

---

## Mode Selection Implementation

### Validation

```javascript
function validateMode(mode) {
  const validModes = ['yolo', 'interactive', 'preflight'];

  if (!mode) {
    return 'interactive'; // Default
  }

  if (validModes.includes(mode.toLowerCase())) {
    return mode.toLowerCase();
  }

  console.warn(`Invalid mode '${mode}'. Defaulting to 'interactive'.`);
  console.warn(`Valid modes: ${validModes.join(', ')}`);
  return 'interactive';
}
```

### User Cancellation Handling

```javascript
function handleCancellation() {
  console.log('Development cancelled by user.');
  console.log('Story progress saved. You can resume with *develop {story-id}.');
  process.exit(0);
}
```

### Missing Story File Handling

```javascript
function validateStoryFile(storyId) {
  const storyPath = `docs/stories/${storyId}.yaml`;

  if (!fs.existsSync(storyPath)) {
    console.error(`Error: Story file not found at ${storyPath}`);
    console.error(`Please verify story ID and try again.`);
    process.exit(1);
  }

  return storyPath;
}
```

---

## Decision Log Format

**File**: `.ai/decision-log-{story-id}.md`

```markdown
# Development Decisions - Story {story-id}

**Mode**: {mode}
**Date**: {date}
**Developer**: {agent-name}

---

## Decision 1: {Title}

**Context**: {What problem are we solving}
**Options Considered**:
1. {Option A} - {Pros/Cons}
2. {Option B} - {Pros/Cons}
3. {Option C} - {Pros/Cons}

**Decision**: {Selected Option}
**Rationale**: {Why this choice}
**Impact**: {How this affects the implementation}
**Timestamp**: {ISO 8601}

---

## Decision 2: {Title}
...
```

---

## Examples

### Example 1: YOLO Mode

```bash
*develop 3.14 yolo
```

**Output**:
```
🚀 YOLO Mode - Autonomous Development
📋 Story 3.14: GitHub DevOps Agent
⚡ Executing autonomously with decision logging...

✅ Task 1 complete (Decision: Use Octokit library - rationale logged)
✅ Task 2 complete (Decision: REST API over GraphQL - rationale logged)
✅ Task 3 complete
✅ All tests pass

📝 Decision log: .ai/decision-log-3.14.md (3 decisions logged)
✅ Story ready for review
```

### Example 2: Interactive Mode (Default)

```bash
*develop 3.15
```

**Output**:
```
💬 Interactive Mode - Balanced Development
📋 Story 3.15: Expansion Pack Auto Configuration

📖 Task 1: Design configuration schema
❓ Decision Point - Schema Format
   Option 1: YAML (human-readable, widely used)
   Option 2: JSON (strict typing, better IDE support)
   Option 3: TOML (simple, clear)

   Your choice? [1/2/3]: _
```

### Example 3: Pre-Flight Planning

```bash
*develop 3.16 preflight
```

**Output**:
```
✈️ Pre-Flight Planning Mode
📋 Story 3.16: Data Architecture Capability

🔍 Analyzing story for ambiguities...
Found 5 technical decisions needed.

📝 Pre-Flight Questionnaire:
1. Database choice: PostgreSQL or MySQL?
2. ORM preference: Prisma, TypeORM, or raw SQL?
3. Migration strategy: Sequential or timestamp-based?
4. Backup approach: Daily snapshots or continuous?
5. Testing database: SQLite, Docker PostgreSQL, or mock?

[Please answer all questions before proceeding]
```

---

## Dependencies

- `.aios-core/checklists/story-dod-checklist.md` - Definition of Done checklist

## Tools

- git - Local operations (add, commit, status, diff, log)
- File system - Read/write story files
- Testing frameworks - Execute validation tests

## Notes

- **Backward Compatibility**: Existing commands like `*develop {story-id}` continue to work (use interactive mode)
- **Mode Aliases**: Can extend with `*develop-yolo`, `*develop-interactive`, `*develop-preflight` commands
- **Decision Logs**: Persisted in `.ai/decision-log-{story-id}.md` for future reference and review
- **Educational Value**: Interactive mode explanations help developers learn framework patterns
- **Scope Drift Prevention**: Pre-flight mode eliminates mid-development ambiguity

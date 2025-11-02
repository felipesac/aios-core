---
tools:
  - pm-tool  # Uses configured PM tool (ClickUp, GitHub, Jira, or local-only)
---

# pull-story

**Purpose:** Pull story updates from the configured PM tool to check for external changes.

**When to Use:**
- To check if story status changed in PM tool
- Before starting work on a story (ensure you have latest state)
- To detect if someone else updated the story in PM tool


## Configuration Dependencies

This task requires the following configuration keys from `core-config.yaml`:

- **`devStoryLocation`**: Location of story files (typically docs/stories)

**Loading Config:**
```javascript
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../.aios-core/core-config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const dev_story_location = config.devStoryLocation;
```

## Task Inputs

```yaml
required:
  - story_id: '{epic}.{story}' # e.g., "3.20"

optional:
  - auto_merge: false # If true, automatically apply updates to local file
```

## Prerequisites

- PM tool configured in `.aios-pm-config.yaml` (or will use local-only mode)

## Task Execution Steps

### Step 1: Get PM Adapter

```javascript
const { getPMAdapter, isPMToolConfigured } = require('../.aios-core/utils/pm-adapter-factory');

if (!isPMToolConfigured()) {
  console.log('ℹ️  Local-only mode: No PM tool configured');
  console.log('   Local story file is the source of truth');
  return;
}

const adapter = getPMAdapter();
console.log(`Pulling from ${adapter.getName()}...`);
```

### Step 2: Pull Updates

```javascript
const result = await adapter.pullStory(storyId);

if (result.success) {
  if (result.updates) {
    console.log(`📥 Updates found:`);
    console.log(JSON.stringify(result.updates, null, 2));
  } else {
    console.log(`✅ Story is up to date`);
  }
} else {
  console.error(`❌ Pull failed: ${result.error}`);
}
```

### Step 3: Display Updates (if any)

If updates found:

```markdown
📥 Updates available from {PM_TOOL}:

**Status:** {old_status} → {new_status}
**Updated:** {timestamp}

Review changes before merging to local file.
```

### Step 4: Optional Auto-Merge

If `auto_merge: true` and updates exist:

```javascript
// Update local story file with pulled changes
// CAUTION: Only merge non-conflicting fields (status, etc.)
// DO NOT overwrite local task progress or dev notes
```

## Error Handling

- **No PM tool configured**: Inform local-only mode (not an error)
- **Story not found in PM tool**: Display helpful message
- **Connection failed**: Show adapter-specific error

## Notes

- LocalAdapter always returns {success: true, updates: null}
- Current implementation is pull-only (unidirectional sync)
- Auto-merge should be used cautiously to avoid overwriting local changes
- Future enhancement: bidirectional sync with conflict resolution

## Limitations (v1.0)

- **Unidirectional**: Only pulls status changes, not full content
- **No conflict resolution**: Manual merge required if conflicts exist
- **Limited field mapping**: Only status synced in v1.0

## Integration with Story Manager

```javascript
const { pullStoryFromPM } = require('../.aios-core/utils/story-manager');

const updates = await pullStoryFromPM(storyId);
if (updates) {
  console.log('Updates available:', updates);
}
```

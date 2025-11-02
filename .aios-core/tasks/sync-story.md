---
tools:
  - pm-tool  # Uses configured PM tool (ClickUp, GitHub, Jira, or local-only)
---

# sync-story

**Purpose:** Synchronize a local story file to the configured PM tool. Works with ClickUp, GitHub Projects, Jira, or local-only mode.

**When to Use:**
- After making changes to story file that need to be synced to PM tool
- When you want to force-push current story state
- After manual edits that bypassed story-manager utilities
- To update PM tool with current story progress


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
  - story_path: 'path/to/story.yaml' # Full path to story YAML file

optional:
  - force: false # If true, sync even if no changes detected
```

## Prerequisites

- Story file must exist
- PM tool configured in `.aios-pm-config.yaml` (or will use local-only mode)

## Task Execution Steps

### Step 1: Load Story File

- Verify story file exists at provided path
- Read and parse YAML content
- Extract story ID, title, status

### Step 2: Get PM Adapter

```javascript
const { getPMAdapter } = require('../.aios-core/utils/pm-adapter-factory');

const adapter = getPMAdapter();
console.log(`Using ${adapter.getName()} adapter`);
```

### Step 3: Sync to PM Tool

```javascript
const result = await adapter.syncStory(storyPath);

if (result.success) {
  console.log(`✅ Story ${storyId} synced successfully`);
  if (result.url) {
    console.log(`   URL: ${result.url}`);
  }
} else {
  console.error(`❌ Sync failed: ${result.error}`);
}
```

### Step 4: Output Results

Display formatted summary:

```markdown
✅ Story {story_id} synchronized to {PM_TOOL}

**PM Tool:** {adapter_name}
**Status:** {story_status}
**URL:** {url} (if available)
**Timestamp:** {current_time}

{Changes synced details}
```

## Error Handling

- **Story file not found**: Display error with correct path
- **PM tool connection failed**: Show error message from adapter
- **Configuration missing**: Inform user to run `aios init`
- **Sync failed**: Display adapter-specific error message

## Notes

- LocalAdapter (no PM tool) always succeeds (validates YAML only)
- ClickUp adapter preserves backward compatibility with existing workflows
- GitHub adapter creates/updates GitHub issue
- Jira adapter creates/updates Jira issue
- All adapters return consistent {success, url?, error?} format

## Integration with Story Manager

This task can be called directly or via story-manager utilities:

```javascript
const { syncStoryToPM } = require('../.aios-core/utils/story-manager');

await syncStoryToPM(storyPath);
```

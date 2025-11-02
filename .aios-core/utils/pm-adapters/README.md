# PM Adapters - Project Management Tool Integration

This directory contains adapter implementations for various Project Management tools.

## Architecture

All adapters extend the `PMAdapter` base class defined in `../pm-adapter.js`.

The adapter pattern allows AIOS-FullStack to work with any PM tool (or none at all) without hard-coding dependencies.

## Available Adapters

### ClickUpAdapter (`clickup-adapter.js`)
- **Purpose**: Integrates with ClickUp for story management
- **Authentication**: API token via environment variable `CLICKUP_API_TOKEN`
- **Features**: Full sync, pull, create, update operations
- **Status**: Backward compatible with existing ClickUp users

### GitHubProjectsAdapter (`github-adapter.js`)
- **Purpose**: Integrates with GitHub Projects v2
- **Authentication**: Via GitHub CLI (`gh auth`)
- **Features**: Sync stories as GitHub issues in Projects
- **Status**: New in Story 3.20

### JiraAdapter (`jira-adapter.js`)
- **Purpose**: Basic Jira integration
- **Authentication**: API token via environment variable `JIRA_API_TOKEN`
- **Features**: Create issues, update status, basic field mapping
- **Status**: Basic support (v1.0)

### LocalAdapter (`local-adapter.js`)
- **Purpose**: Standalone mode - no external PM tool
- **Authentication**: None required
- **Features**: Local YAML file management only
- **Status**: Default fallback when no PM tool configured

## Adapter Contract

All adapters must implement these methods:

```javascript
async syncStory(storyPath)      // Sync local story to PM tool
async pullStory(storyId)        // Pull updates from PM tool
async createStory(storyData)    // Create new story in PM tool
async updateStatus(storyId, status)  // Update story status
async testConnection()          // Validate PM tool connection
```

## Configuration

PM tool selection happens during `aios init`. Configuration stored in `.aios-pm-config.yaml`:

```yaml
pm_tool:
  type: "clickup"  # or "github-projects", "jira", "local"
  config:
    # Tool-specific configuration
```

## Adding New Adapters

1. Create new file in this directory (e.g., `azure-devops-adapter.js`)
2. Extend `PMAdapter` class
3. Implement all 5 required methods
4. Add to `pm-adapter-factory.js` switch statement
5. Update `bin/aios-init.js` prompt choices
6. Write unit tests

## Usage Example

```javascript
const { getPMAdapter } = require('../pm-adapter-factory');

const adapter = getPMAdapter();  // Auto-selects based on config
const result = await adapter.syncStory('/path/to/story.yaml');

if (result.success) {
  console.log('Story synced:', result.url);
}
```

## See Also

- Story 3.20: PM Tool-Agnostic Integration
- Story 3.14: Repository-Agnostic Design (inspiration for this pattern)
- `../pm-adapter-factory.js`: Adapter selection logic

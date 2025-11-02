# github-pr-automation.md

**Task**: GitHub Pull Request Automation (Repository-Agnostic)

**Purpose**: Automate PR creation from story context using GitHub CLI, works with ANY repository.

**When to use**: After pushing feature branch, via `@github-devops *create-pr` command.

## Prerequisites
- GitHub CLI (`gh`) installed and authenticated
- Feature branch pushed to remote
- Repository context detected
- Story file (optional but recommended)

## Workflow Steps

### Step 1: Detect Repository Context

```javascript
const { detectRepositoryContext } = require('./../utils/repository-detector');

const context = detectRepositoryContext();
if (!context) {
  throw new Error('Unable to detect repository. Run "aios init" first.');
}
```

### Step 2: Get Current Branch

```bash
git branch --show-current
```

### Step 3: Extract Story Information (if available)

```javascript
function extractStoryInfo(storyPath) {
  if (!storyPath || !fs.existsSync(storyPath)) {
    return null;
  }

  const content = fs.readFileSync(storyPath, 'utf8');

  // Extract story ID from path or content
  const storyIdMatch = storyPath.match(/(\d+\.\d+)/);
  const storyId = storyIdMatch ? storyIdMatch[1] : null;

  // Extract title
  const titleMatch = content.match(/title:\s*["']?([^"'\n]+)["']?/);
  const title = titleMatch ? titleMatch[1] : null;

  // Extract acceptance criteria
  const acMatch = content.match(/acceptance_criteria:([\s\S]*?)(?=\n\w+:|$)/);

  return {
    id: storyId,
    title,
    hasAcceptanceCriteria: !!acMatch
  };
}
```

### Step 4: Generate PR Title

```javascript
function generatePRTitle(branchName, storyInfo) {
  if (storyInfo && storyInfo.id && storyInfo.title) {
    return `[Story ${storyInfo.id}] ${storyInfo.title}`;
  }

  // F
## Configuration Dependencies

This task requires the following configuration keys from `core-config.yaml`:

- **`qaLocation`**: QA output directory (typically docs/qa) - Required to write quality reports
- **`utils.registry`**: Utility registry location for framework utilities

**Loading Config:**
```javascript
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../.aios-core/core-config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const qaLocation = config.qa?.qaLocation || 'docs/qa';
const utils_registry = config.utils?.registry || config['utils.registry'] || '.aios-core/utils'; // utils.registry
```

allback: convert branch name to title
  return branchName
    .replace(/^feature\//, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
```

### Step 5: Generate PR Description

```javascript
function generatePRDescription(storyInfo, context) {
  let description = `## Summary\n\n`;

  if (storyInfo) {
    description += `This PR implements Story ${storyInfo.id}: ${storyInfo.title}\n\n`;
    description += `**Story File**: \`docs/stories/${storyInfo.id}-*.yaml\`\n\n`;
  } else {
    description += `Changes from branch: ${branchName}\n\n`;
  }

  description += `## Changes\n\n`;
  description += `- [List main changes here]\n\n`;

  description += `## Testing\n\n`;
  description += `- [ ] Unit tests passing\n`;
  description += `- [ ] Integration tests passing\n`;
  description += `- [ ] Manual testing completed\n\n`;

  description += `## Checklist\n\n`;
  description += `- [ ] Code follows project standards\n`;
  description += `- [ ] Tests added/updated\n`;
  description += `- [ ] Documentation updated\n`;
  description += `- [ ] Quality gates passed\n\n`;

  description += `---\n`;
  description += `**Repository**: ${context.repositoryUrl}\n`;
  description += `**Mode**: ${context.mode}\n`;
  description += `**Package**: ${context.packageName} v${context.packageVersion}\n`;

  return description;
}
```

### Step 6: Determine Base Branch

```javascript
function determineBaseBranch(projectRoot) {
  // Check default branch from git
  try {
    const defaultBranch = execSync('git symbolic-ref refs/remotes/origin/HEAD', {
      cwd: projectRoot
    }).toString().trim().replace('refs/remotes/origin/', '');

    return defaultBranch || 'main';
  } catch (error) {
    // Fallback to main
    return 'main';
  }
}
```

### Step 7: Create PR via GitHub CLI

```bash
gh pr create \
  --title "{title}" \
  --body "{description}" \
  --base {baseBranch} \
  --head {currentBranch}
```

### Step 8: Assign Reviewers (Optional)

```javascript
function assignReviewers(storyType, prNumber) {
  const reviewerMap = {
    'feature': ['@dev-team'],
    'bugfix': ['@qa-team'],
    'docs': ['@tech-writer'],
    'security': ['@security-team']
  };

  const reviewers = reviewerMap[storyType] || ['@dev-team'];

  execSync(`gh pr edit ${prNumber} --add-reviewer ${reviewers.join(',')}`, {
    cwd: projectRoot
  });
}
```

## Example Usage

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function createPullRequest(storyPath) {
  // Detect repository
  const { detectRepositoryContext } = require('./../utils/repository-detector');
  const context = detectRepositoryContext();

  console.log(`\n🔀 Creating Pull Request`);
  console.log(`Repository: ${context.repositoryUrl}\n`);

  // Get current branch
  const currentBranch = execSync('git branch --show-current', {
    cwd: context.projectRoot
  }).toString().trim();

  console.log(`Branch: ${currentBranch}`);

  // Extract story info
  const storyInfo = storyPath ? extractStoryInfo(storyPath) : null;

  // Generate PR title and description
  const title = generatePRTitle(currentBranch, storyInfo);
  const description = generatePRDescription(storyInfo, context);
  const baseBranch = determineBaseBranch(context.projectRoot);

  console.log(`Title: ${title}`);
  console.log(`Base: ${baseBranch}\n`);

  // Create PR
  const prUrl = execSync(
    `gh pr create --title "${title}" --body "${description}" --base ${baseBranch}`,
    { cwd: context.projectRoot }
  ).toString().trim();

  console.log(`\n✅ Pull Request created: ${prUrl}`);

  return { prUrl, title, baseBranch };
}

module.exports = { createPullRequest };
```

## Integration

Called by `@github-devops` via `*create-pr` command.

## Validation

- PR created in correct repository (detected URL)
- PR title includes story ID if available
- PR description includes repository context
- Base branch is correct (usually main/master)

## Notes

- Works with ANY repository
- Gracefully handles missing story file
- Uses GitHub CLI for reliability
- Repository context from detector

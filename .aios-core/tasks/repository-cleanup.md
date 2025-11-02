# repository-cleanup.md

**Task**: Repository Cleanup (Repository-Agnostic)

**Purpose**: Identify and remove stale branches and temporary files from ANY repository.

**When to use**: Periodic maintenance via `@github-devops *cleanup` command.

## Prerequisites
- Git repository
- GitHub CLI for remote branch operations
- Repository context detected

## Cleanup Operations

### 1. Identify Stale Branches

**Definition**: Merged branches older than 30 days

```javascript
const { execSync } = require('child_process');

function findStaleBranches(projectRoot) {
  // Get all merged branches
  const mergedBranches = execSync('git branch --merged', {
    cwd: projectRoot
  }).toString()
    .split('\n')
    .map(b => b.trim())
    .filter(b => b && b !== '* main' && b !== '* master' && b !== 'main' && b !== 'master');

  const staleBranches = [];
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  for (const branch of mergedBranches) {
    try {
      const lastCommitDate = execSync(`git log -1 --format=%ct ${branch}`, {
        cwd: projectRoot
      }).toString().trim();

      const commitTimestamp = parseInt(lastCommitDate) * 1000;

      if (commitTimestamp < thirtyDaysAgo) {
        staleBranches
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

.push({
          name: branch,
          lastCommit: new Date(commitTimestamp).toISOString(),
          daysOld: Math.floor((Date.now() - commitTimestamp) / (24 * 60 * 60 * 1000))
        });
      }
    } catch (error) {
      console.warn(`⚠️  Unable to check ${branch}:`, error.message);
    }
  }

  return staleBranches;
}
```

### 2. Identify Temporary Files

```javascript
const glob = require('glob');

function findTemporaryFiles(projectRoot) {
  const patterns = [
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/*.tmp',
    '**/*.log',
    '**/.eslintcache'
  ];

  const tempFiles = [];

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      cwd: projectRoot,
      ignore: ['node_modules/**', '.git/**']
    });

    tempFiles.push(...files);
  }

  return tempFiles;
}
```

### 3. Present Cleanup Suggestions

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧹 Repository Cleanup Suggestions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Repository: {repositoryUrl}

Stale Branches (merged, >30 days old):
  - feature/story-3.1-dashboard (45 days old)
  - bugfix/memory-leak (60 days old)
  - feature/old-feature (120 days old)

Total: 3 stale branches

Temporary Files:
  - .DS_Store (5 files)
  - .eslintcache
  - debug.log

Total: 7 temporary files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed with cleanup? (Y/n)
```

### 4. Execute Cleanup

```javascript
async function executeCleanup(staleBranches, tempFiles, projectRoot) {
  // Delete stale branches
  for (const branch of staleBranches) {
    try {
      execSync(`git branch -d ${branch.name}`, { cwd: projectRoot });
      console.log(`✓ Deleted local branch: ${branch.name}`);

      // Try to delete remote branch
      try {
        execSync(`git push origin --delete ${branch.name}`, { cwd: projectRoot });
        console.log(`✓ Deleted remote branch: ${branch.name}`);
      } catch (error) {
        console.warn(`⚠️  Unable to delete remote branch ${branch.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to delete ${branch.name}:`, error.message);
    }
  }

  // Delete temporary files
  for (const file of tempFiles) {
    try {
      fs.unlinkSync(path.join(projectRoot, file));
      console.log(`✓ Deleted: ${file}`);
    } catch (error) {
      console.warn(`⚠️  Unable to delete ${file}`);
    }
  }
}
```

## Safety Checks

- Never delete main/master branch
- Never delete current branch
- Never delete unmerged branches (without --force flag)
- Always require user confirmation

## Integration

Called by `@github-devops` via `*cleanup` command.

## Validation

- Correctly identifies merged branches
- Respects 30-day threshold
- Requires user approval
- Handles errors gracefully

## Notes

- Works with ANY repository
- Safe defaults (no force delete)
- Dry-run mode available

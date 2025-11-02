# pre-push-quality-gate.md

**Task**: Pre-Push Quality Gate Validation (Repository-Agnostic)

**Purpose**: Execute comprehensive quality checks before pushing code to remote repository, ensuring code quality, tests, and security standards are met.

**When to use**: Before pushing code to GitHub, always via `@github-devops *pre-push` command.

## Prerequisites
- Git repository with changes to push
- package.json with npm scripts (gracefully handles missing scripts)
- Repository context detected (run `aios init` if needed)

## Quality Gate Checks

### 1. Repository Context Detection

```javascript
const { detectRepositoryContext } = require('./../utils/repository-detector');

const context = detectRepositoryContext();
if (!context) {
  console.error('❌ Unable to detect repository context');
  console.error('Run "aios init" to configure installation mode');
  process.exit(1);
}

console.log(`\n🚀 Pre-Push Quality Gate`);
console.log(`Repository: ${context.repositoryUrl}`);
console.log(`Mode: ${context.mode}`);
console.log(`Package: ${context.packageName} v${context.packageVersion}\n`);
```

### 2. Check for Uncommitted Changes

```bash
git status --porcelain
```

If output is not empty, fail with message:
```
❌ Uncommitted changes detected!

Please commit or stash changes before pushing:
  git add .
  git commit -m "your message"
```

### 3. Check for Merge Conflicts

```bash
git diff --check
```

If conflicts detected, fail with message:
```
❌ Merge conflicts detected!

Resolve conflicts before pushing.
```

### 4. Run npm run lint (if script exists)

```javascript
function runNpmScript(scriptName, projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
    console.log(`⚠️  Script "${scriptName}" not found - skipping`);
    return { skipped: true };
  }

  try {
    execSync(`npm run ${scriptName}`, {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log(`✓ ${scriptName} PASSED`);
    return { passed: true };
  } catch (error) {
    console.error(`❌ ${scriptName} FAILED`);
    return { passed: false, error };
  }
}
```

### 5. Run npm test (if script exists)

Same logic as lint, but for `npm test`.

### 6. Run npm run typecheck (if script exists)

Same logic as lint, but for `npm run typecheck`.

### 7. Run npm run build (if script exists)

Same logic as lint, but for `npm run build`.

### 8. Run Security Scan (TR-3.14.11)

```javascript
const { execSync } = require('child_process');
const path = require('path');

function runSecurityScan(storyId, storyPath, projectRoot) {
  console.log('\n🔒 Running Security Scan (SAST)...\n');

  try {
    // Execute security-scan.md task
    const securityScanPath = path.join(__dirname, 'security-scan.md');

    // For now, run security checks directly
    const results = {
      audit: runNpmAudit(projectRoot),
      eslint: runESLintSecurity(projectRoot),
      secrets: runSecretDetection
## Configuration Dependencies

This task requires the following configuration keys from `core-config.yaml`:

- **`devStoryLocation`**: Location of story files (typically docs/stories)

- **`qaLocation`**: QA output directory (typically docs/qa) - Required to write quality reports and gate files
- **`utils.registry`**: Utility registry location for framework utilities

**Loading Config:**
```javascript
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../.aios-core/core-config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const dev_story_location = config.devStoryLocation;
const qaLocation = config.qaLocation || 'docs/qa'; // qaLocation
const utils_registry = config.utils?.registry || config['utils.registry'] || '.aios-core/utils'; // utils.registry
```

(projectRoot)
    };

    // Determine gate impact
    const gateImpact = determineSecurityGate(results);

    console.log(`\nSecurity Scan Complete: ${gateImpact}`);

    return { gateImpact, results };
  } catch (error) {
    console.error('❌ Security scan failed:', error.message);
    return { gateImpact: 'FAIL', error };
  }
}

function runNpmAudit(projectRoot) {
  try {
    const output = execSync('npm audit --audit-level=moderate --json', {
      cwd: projectRoot
    }).toString();

    const results = JSON.parse(output);
    const vulns = results.metadata?.vulnerabilities || {};

    return {
      critical: vulns.critical || 0,
      high: vulns.high || 0,
      moderate: vulns.moderate || 0,
      low: vulns.low || 0,
      gate: vulns.critical > 0 ? 'FAIL' : (vulns.high > 0 ? 'CONCERNS' : 'PASS')
    };
  } catch (error) {
    // npm audit exits with 1 if vulnerabilities found
    if (error.stdout) {
      const results = JSON.parse(error.stdout.toString());
      const vulns = results.metadata?.vulnerabilities || {};

      return {
        critical: vulns.critical || 0,
        high: vulns.high || 0,
        moderate: vulns.moderate || 0,
        low: vulns.low || 0,
        gate: vulns.critical > 0 ? 'FAIL' : (vulns.high > 0 ? 'CONCERNS' : 'PASS')
      };
    }

    console.warn('⚠️  npm audit failed - skipping dependency check');
    return { gate: 'PASS', skipped: true };
  }
}

function runESLintSecurity(projectRoot) {
  // Check if ESLint security config exists
  const eslintConfigPath = path.join(projectRoot, '.eslintrc.security.json');

  if (!fs.existsSync(eslintConfigPath)) {
    console.log('⚠️  .eslintrc.security.json not found - skipping ESLint security');
    return { gate: 'PASS', skipped: true };
  }

  try {
    execSync('npx eslint . --ext .js,.ts --config .eslintrc.security.json', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    return { gate: 'PASS', issues: 0 };
  } catch (error) {
    // ESLint exits with 1 if issues found
    const output = error.stdout?.toString() || '';
    const errorCount = (output.match(/error/g) || []).length;
    const warningCount = (output.match(/warning/g) || []).length;

    return {
      gate: errorCount > 0 ? 'FAIL' : (warningCount > 0 ? 'CONCERNS' : 'PASS'),
      errors: errorCount,
      warnings: warningCount
    };
  }
}

function runSecretDetection(projectRoot) {
  try {
    execSync('npx secretlint "**/*"', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    return { gate: 'PASS', secretsFound: 0 };
  } catch (error) {
    // secretlint exits with 1 if secrets found
    return { gate: 'FAIL', secretsFound: 1 };
  }
}

function determineSecurityGate(results) {
  // Secrets are auto-fail
  if (results.secrets.gate === 'FAIL') return 'FAIL';

  // Any FAIL → overall FAIL
  if (results.audit.gate === 'FAIL' || results.eslint.gate === 'FAIL') return 'FAIL';

  // Any CONCERNS → overall CONCERNS
  if (results.audit.gate === 'CONCERNS' || results.eslint.gate === 'CONCERNS') return 'CONCERNS';

  // All PASS → overall PASS
  return 'PASS';
}
```

### 9. Verify Story Status (Optional - if using story-driven workflow)

```javascript
function checkStoryStatus(storyPath) {
  if (!storyPath || !fs.existsSync(storyPath)) {
    console.log('⚠️  No story file specified - skipping story status check');
    return { skipped: true };
  }

  const storyContent = fs.readFileSync(storyPath, 'utf8');

  // Look for status: "Done" or status: "Ready for Review"
  const statusMatch = storyContent.match(/status:\s*["']?(Done|Ready for Review|InProgress)["']?/i);

  if (!statusMatch) {
    console.log('⚠️  Unable to determine story status - skipping');
    return { skipped: true };
  }

  const status = statusMatch[1];

  if (status === 'Done' || status === 'Ready for Review') {
    console.log(`✓ Story status: ${status}`);
    return { passed: true, status };
  } else {
    console.log(`⚠️  Story status: ${status} (expected Done or Ready for Review)`);
    return { passed: false, status };
  }
}
```

## Summary Report

After all checks complete, present summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Pre-Push Quality Gate Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Repository:  {repositoryUrl}
Package:     {packageName} v{version}
Mode:        {framework-development | project-development}

Quality Checks:
  ✓ No uncommitted changes
  ✓ No merge conflicts
  ✓ npm run lint         PASSED
  ✓ npm test             PASSED
  ✓ npm run typecheck    PASSED
  ✓ npm run build        PASSED
  ✓ Security scan        PASSED
  ⚠️ Story status         SKIPPED (no story file)

Security Scan Results:
  ✓ Dependencies: 0 critical, 0 high, 2 moderate, 5 low
  ✓ Code patterns: No security issues
  ✓ Secrets: No secrets detected

Overall Status: ✅ READY TO PUSH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed with push to remote? (Y/n)
```

### If FAIL status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Pre-Push Quality Gate FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quality Checks:
  ❌ npm test             FAILED
  ❌ Security scan        FAILED (CRITICAL vulnerabilities)

Security Issues:
  ❌ Dependencies: 2 CRITICAL, 5 HIGH vulnerabilities
  ❌ Secrets: 1 API key detected in config/db.js

Overall Status: ❌ BLOCKED - Cannot push to remote

Action Required:
  1. Fix failing tests
  2. Run: npm audit fix --force
  3. Remove secrets from codebase
  4. Re-run quality gate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### If CONCERNS status:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  Pre-Push Quality Gate: CONCERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quality Checks:
  ✓ All tests passed
  ⚠️ Security scan        CONCERNS (HIGH vulnerabilities)

Security Issues:
  ⚠️ Dependencies: 0 CRITICAL, 3 HIGH, 10 MODERATE vulnerabilities
  ⚠️ Code patterns: 2 medium-severity issues

Overall Status: ⚠️  CONCERNS - Review recommended

Recommendations:
  - Address HIGH vulnerabilities before production
  - Review medium-severity code patterns
  - Consider running: npm audit fix

Proceed with push anyway? (y/N)
```

## User Approval

```javascript
async function requestPushApproval(gateStatus) {
  if (gateStatus === 'FAIL') {
    console.log('\n❌ Quality gate FAILED. Cannot proceed with push.');
    process.exit(1);
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: gateStatus === 'PASS'
        ? 'Proceed with push to remote?'
        : 'Quality gate has CONCERNS. Proceed anyway?',
      default: gateStatus === 'PASS'
    }
  ]);

  return confirm;
}
```

## Integration with @github-devops Agent

Called via `@github-devops *pre-push` command.

## Exit Codes

- `0` - All checks passed, user approved
- `1` - Quality gate failed (blocking)
- `2` - User declined to push

## Notes

- Works with ANY repository (framework or project)
- Gracefully handles missing npm scripts
- Security scan is mandatory (TR-3.14.11)
- User always has final approval
- Detailed logging for troubleshooting

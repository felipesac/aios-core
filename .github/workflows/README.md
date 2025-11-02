# GitHub Actions Workflows

This directory contains automated workflows for the AIOS project.

---

## Quarterly Architecture Gap Audit

**File:** `quarterly-gap-audit.yml`  
**Story:** 3.25  
**Created:** 2025-10-28

### Purpose

Automatically audits architecture gaps on a quarterly basis and generates trend reports with 1MCP adoption metrics.

### Schedule

- **Automatic:** Runs quarterly on Jan 1, Apr 1, Jul 1, Oct 1 at midnight UTC
- **Manual:** Can be triggered via GitHub Actions UI

### What It Does

1. **Parses framework entities** (agents, tasks, templates, tools)
2. **Validates tool references** (Story 3.21)
3. **Synthesizes relationships** (Story 3.22)
4. **Detects gaps** in the architecture
5. **Generates trend report** with:
   - Gap count comparison vs previous quarter
   - Gap breakdown by category
   - Top 10 entities with most gaps
   - 1MCP adoption metrics
   - Token savings estimates
   - Story suggestions for remediation
6. **Creates GitHub issue** with the trend report
7. **Uploads artifacts** for historical tracking

### Manual Trigger

To manually run the audit:

1. Go to **Actions** tab in GitHub
2. Select **Quarterly Architecture Gap Audit**
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow** button

The workflow will execute all steps and create a new issue with the audit results.

### Artifacts

Each run creates artifacts:
- `gap-backlog.csv` - Current gap backlog
- `gap-trend.json` - Latest trend data
- `gap-trend.md` - Markdown report
- `gap-trend-history.json` - Historical trend data

Download from the workflow run page under **Artifacts** section.

### Generated Issue

The workflow automatically creates a GitHub issue with:
- Title: `Q{1-4} {YEAR} Architecture Gap Audit`
- Labels: `architecture`, `gap-remediation`, `quarterly-audit`
- Body: Complete trend report with metrics and recommendations

### 1MCP Metrics

If 1MCP is detected (~/.1mcp/config.json exists), the report includes:
- Tools via 1MCP vs direct count
- Adoption rate percentage
- Token savings estimate
- Migration status

### Maintenance

**Dependencies:**
- Node.js 18
- npm packages (installed via `npm ci`)
- Architecture mapping scripts in `outputs/architecture-map/schemas/`

**Configuration:**
- Edit assignees in workflow YAML if needed
- Adjust schedule by modifying cron expression
- Customize labels or issue template in workflow

**Troubleshooting:**
- Check workflow logs for errors
- Verify all parsing scripts exist
- Ensure gap-backlog.csv exists (run detect-gaps.js first)

---

## Other Workflows

### CI (ci.yml)
Continuous integration testing for pull requests.

### Cross-Platform Tests (cross-platform-tests.yml)
Tests the framework across different operating systems.

---

**Last Updated:** 2025-10-28 (Story 3.25)



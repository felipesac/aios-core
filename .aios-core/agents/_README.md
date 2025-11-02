# AIOS Agents Directory

This directory contains agent definition files that define the personas, capabilities, and tool dependencies for all AIOS agents.

## Quick Start

Each agent file (`.md`) defines:
- Agent persona and behavior
- Available commands
- Tool dependencies
- Task and template dependencies

## Tool Integration Standards

**IMPORTANT:** When declaring tool dependencies in agent files, follow the official standards:

📚 **[Agent-Tool Integration Standards Guide](../../../docs/architecture/agent-tool-integration-guide.md)**

### Quick Reference

Always use **full tool IDs** with proper prefixes:

```yaml
dependencies:
  tools:
    - mcp-supabase           # ✅ CORRECT
    - cli-github-cli         # ✅ CORRECT  
    - browser                # ✅ CORRECT (core tool)
    
    - supabase               # ❌ WRONG: ambiguous short name
    - github                 # ❌ WRONG: missing prefix
```

### Tool ID Prefixes

| Prefix | Type | Example |
|--------|------|---------|
| `mcp-*` | MCP Servers | `mcp-supabase` |
| `cli-*-cli` | CLI Wrappers | `cli-github-cli` |
| `local-*` | Local Binaries | `local-ffmpeg` |
| *(none)* | Core Tools | `browser`, `context7` |

### Before Committing

✅ **Validation Checklist:**
- [ ] All tools use full IDs (no short names)
- [ ] Each tool has inline comment
- [ ] Tools grouped by category (if >3 tools)
- [ ] Run validation: `node outputs/architecture-map/schemas/validate-tool-references.js`

## Available Agents

### Database Architecture
- **db-sage** - Database Architect & Operations Engineer
  - Comprehensive database design and Supabase configuration
  - Schema architecture, RLS policies, migrations
  - Query optimization and monitoring
  - 11 specialized database tasks included
  - 6 database templates for documentation

## Agent Files

All agent `.md` files in this directory are automatically parsed and validated by:
- `parse-markdown-agents.js` - Extracts agent metadata
- `validate-tool-references.js` - Validates tool references
- Pre-commit hook (Story 3.22) - Catches issues before commit

## Adding New Agents

1. Use agent elicitation workflow: `.aios-core/elicitation/agent-elicitation.js`
2. Follow integration standards (link above)
3. Validate before committing

## Questions?

See full documentation: [Agent-Tool Integration Standards Guide](../../../docs/architecture/agent-tool-integration-guide.md)

---

**Last Updated:** 2025-10-30
**Story:** 3.16 - db-sage Integration | 3.24 - Agent-Tool Integration Standards


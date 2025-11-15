# AIOS Guides

Complete documentation index for AIOS system guides.

---

## 🚀 1MCP Implementation (Production-Ready)

**Status:** ✅ Complete & Ready to Deploy
**Token Reduction:** 85% (280K → 40K)
**Setup Time:** 5 minutes

### Quick Start

**Want 85% token reduction in 5 minutes?**
→ Read: [`1mcp-quickstart.md`](./1mcp-quickstart.md)

### Complete Documentation

| Guide | Purpose | Time | Audience |
|-------|---------|------|----------|
| **[1MCP Implementation](./1mcp-implementation.md)** | Full comprehensive guide | 20 min | All users |
| **[Quick Start](./1mcp-quickstart.md)** | Fast 5-minute setup | 5 min | Developers |
| **[Troubleshooting](./1mcp-troubleshooting.md)** | Complete diagnostic reference | 15 min | Support teams |
| **[AIOS Integration](./1mcp-aios-integration.md)** | Agent workflows & presets | 15 min | AIOS developers |
| **[Implementation Summary](./1MCP-IMPLEMENTATION-SUMMARY.md)** | Executive overview | 5 min | Decision makers |

### Configuration Templates

- **[1MCP Config Template](../../aios-core/templates/1mcp-config.yaml)** - Production-ready YAML config

---

## 🧪 TOON Benchmark (Phase 2)

**Status:** Ready to Execute (Requires Validation)
**Location:** `benchmarks/toon-parsing/`
**Purpose:** Validate if TOON can reduce tokens further (40K → 12K)

**Next Step:** Run benchmark to decide if TOON should be implemented.

```bash
cd benchmarks/toon-parsing
npm run benchmark
```

**Decision Criteria:**
- ≥ 90% accuracy → Implement TOON (Phase 2)
- 80-90% accuracy → Caution (limited rollout)
- < 80% accuracy → Stick with 1MCP only

---

## 📚 Other Guides

(Space for future guides)

---

## Quick Navigation

### I want to...

**...reduce token usage by 85%**
→ [`1mcp-quickstart.md`](./1mcp-quickstart.md) (5 min)

**...understand how 1MCP works**
→ [`1mcp-implementation.md`](./1mcp-implementation.md) (20 min)

**...fix 1MCP issues**
→ [`1mcp-troubleshooting.md`](./1mcp-troubleshooting.md) (15 min)

**...integrate 1MCP with AIOS agents**
→ [`1mcp-aios-integration.md`](./1mcp-aios-integration.md) (15 min)

**...see executive summary**
→ [`1MCP-IMPLEMENTATION-SUMMARY.md`](./1MCP-IMPLEMENTATION-SUMMARY.md) (5 min)

**...validate TOON optimization**
→ `../../benchmarks/toon-parsing/README.md` (Phase 2)

---

## Documentation Stats

**Total Documentation:** ~2000 lines
**Guides Created:** 5 comprehensive documents
**Coverage:** Installation, Configuration, Integration, Troubleshooting, Summary
**Production Status:** ✅ Ready to deploy

---

## Support

- **GitHub Issues:** Tag `1mcp`, `documentation`, `guides`
- **Slack:** `#aios-support`
- **Experts:** @pedro, @mitchell, @andrej, @guillermo

---

**Last Updated:** 2025-01-14
**Version:** 1.0

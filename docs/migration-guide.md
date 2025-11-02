# Hybrid-Ops 2.0 Migration Guide

## Table of Contents

1. [Introduction](#1-introduction)
   - [1.1. What's New in Hybrid-Ops 2.0](#11-whats-new-in-hybrid-ops-20)
   - [1.2. Why Upgrade?](#12-why-upgrade)
   - [1.3. Who Should Upgrade?](#13-who-should-upgrade)
   - [1.4. Migration Timeline](#14-migration-timeline)
2. [What Changed](#2-what-changed)
   - [2.1. Backward Compatible Changes](#21-backward-compatible-changes-no-action-required)
   - [2.2. New Features (Opt-In)](#22-new-features-opt-in)
   - [2.3. Breaking Changes](#23-breaking-changes)
3. [Migration Steps](#3-migration-steps)
4. [Feature Comparison](#4-feature-comparison)
5. [Configuration Guide](#5-configuration-guide)
   - [5.1. Basic Configuration](#51-basic-configuration)
   - [5.2. Common Configuration Scenarios](#52-common-configuration-scenarios)
6. [Troubleshooting](#6-troubleshooting)
7. [FAQ](#7-faq)
8. [Next Steps](#8-next-steps)
9. [Support](#9-support)

---

## 1. Introduction

### 1.1. What's New in Hybrid-Ops 2.0

- **Executable cognitive architecture (PV Mode)** - Pedro Valério's decision-making patterns formalized into executable code
- **Formalized decision heuristics** - PV_BS_001 (Future Back-Casting), PV_PA_001 (Coherence Scan), PV_PM_001 (Automation Check)
- **Axioma validation** - META_AXIOMAS 4-level belief hierarchy ensures quality and alignment
- **Dual-mode operation** - PV Mode with full validation + Generic Mode fallback
- **Enhanced workflow with validation gates** - Quality checks before ClickUp task creation

### 1.2. Why Upgrade?

- **Consistent, transparent decision-making** - Deterministic heuristics replace variable LLM prompts
- **Quality validation before ClickUp creation** - Catch issues early with validation gates
- **Faster execution** - Compiled heuristics execute locally vs. LLM API calls
- **No API costs for decision logic** - Local execution means zero API costs for validation
- **Offline capability** - PV Mode works without internet connection

### 1.3. Who Should Upgrade?

- **Users wanting PV-aligned decision quality** - Get decisions aligned with Pedro's cognitive patterns
- **Teams requiring validation and quality gates** - Ensure quality before tasks hit ClickUp
- **Power users extending Hybrid-Ops** - Build custom workflows with cognitive utilities

### 1.4. Migration Timeline

- **Preparation**: 1 hour (read guide, review changes)
- **Installation**: 30 minutes (update code, configure)
- **Testing**: 2 hours (run sample workflow)
- **Full migration**: 1-2 days (migrate existing processes)

---

## 2. What Changed

### 2.1. Backward Compatible Changes (No Action Required)

- All existing agent commands work identically
- ClickUp integration unchanged
- 9-phase workflow structure preserved
- Existing process definitions compatible

### 2.2. New Features (Opt-In)

- **PV Mode**: Activate with mind artifacts available
- **Validation gates**: Enable strict validation mode
- **Configuration system**: Tune heuristic weights/thresholds
- **Standalone tools**: Use cognitive utilities independently

### 2.3. Breaking Changes

**NONE**: All changes are additive and backward compatible. Generic mode provides identical behavior to v1.x.

---

## 3. Migration Steps

### Step 1: Update Hybrid-Ops Code

```bash
cd .claude/commands/hybridOps/
git pull origin main
npm install
```

### Step 2: Verify Mind Artifacts Available

```bash
# Check if mind artifacts exist
ls outputs/minds/pedro_valerio/

# Expected: 49 files including META_AXIOMAS, heuristics, etc.
```

### Step 3: Choose Operational Mode

**Option A: PV Mode (Recommended)**
- Requires mind artifacts
- Full validation and quality gates
- PV-aligned decision-making

**Option B: Generic Mode (Fallback)**
- No mind artifacts required
- Identical to v1.x behavior
- No validation gates

**Option C: Hybrid (Manual)**
- Use PV Mode when available
- Automatic fallback to Generic if mind unavailable

### Step 4: Test with Sample Workflow

```bash
# Run smoke test
npm test

# Run sample workflow
node examples/sample-process-mapping.js
```

### Step 5: Configure (Optional)

```bash
# Copy default configuration
cp config/heuristics.default.yaml config/heuristics.yaml

# Edit weights/thresholds if needed
nano config/heuristics.yaml
```

### Step 6: Run Your First PV Workflow

- Start with small process (10-20 tasks)
- Enable PV Mode
- Observe validation gates in action
- Review validation feedback

---

## 4. Feature Comparison

| Feature | Conversational (v1.x) | PV Mode (v2.0) | Generic Mode (v2.0) |
|---------|----------------------|----------------|---------------------|
| **Decision Making** | LLM prompt-based | Compiled heuristics | LLM prompt-based |
| **Consistency** | Variable | Deterministic | Variable |
| **Transparency** | Implicit | Explicit scores | Implicit |
| **Validation** | None | Axioma + Heuristic | None |
| **Speed** | Slower (full context) | Faster (cached) | Slower (full context) |
| **API Costs** | Yes (LLM calls) | No (local execution) | Yes (LLM calls) |
| **Offline Mode** | No | Yes | No |
| **Quality Gates** | Manual | Automatic | Manual |
| **Veto Enforcement** | No | Yes (truthfulness, guardrails) | No |
| **Calibration** | Prompt engineering | Config tuning | Prompt engineering |

**When to Use Each Mode:**
- **PV Mode**: Production workflows requiring quality and consistency
- **Generic Mode**: Quick exploratory work or when mind unavailable
- **v1.x**: Legacy workflows not yet migrated

---

## 5. Configuration Guide

### 5.1. Basic Configuration

**Minimal Configuration (Use Defaults)**
```yaml
# config/heuristics.yaml
version: "1.0"
# Use all default weights/thresholds
```

**Custom Weights Example**
```yaml
heuristics:
  PV_BS_001:  # Future Back-Casting
    weights:
      end_state_vision: 0.95  # Increase vision weight
      current_market_signals: 0.05
```

### 5.2. Common Configuration Scenarios

**Scenario 1: Conservative (Strict Validation)**
```yaml
validation:
  strict_mode: true
  minimum_score: 8.0  # Require higher quality

heuristics:
  PV_PA_001:  # Coherence Scan
    thresholds:
      veto: 0.8  # Higher truthfulness requirement
      approve: 0.9
```

**Scenario 2: Aggressive (Automate More)**
```yaml
heuristics:
  PV_PM_001:  # Automation Check
    thresholds:
      tipping_point: 1  # Lower frequency threshold
      standardization: 0.5  # Accept more variability
```

**Scenario 3: Balanced (Default)**
```yaml
# Use default configuration
# No custom config file needed
```

---

## 6. Troubleshooting

### Issue 1: "Mind artifacts not found" error

**Symptoms**: System falls back to Generic mode, no PV validation

**Solution**:
```bash
# Verify mind artifacts exist
ls outputs/minds/pedro_valerio/

# If missing, ensure you have the complete repository
# Mind artifacts should be included in the main repository
git pull origin main
```

### Issue 2: Validation gate always fails

**Symptoms**: Process rejected even though it seems valid

**Diagnosis**:
```javascript
// Enable debug logging
export AIOS_DEBUG=true

// Re-run workflow to see detailed validation output
```

**Solution**:
- Review validation feedback (shows which criteria failed)
- Check if thresholds too strict (adjust config)
- Verify input data format matches expected schema

### Issue 3: Performance slower than expected

**Symptoms**: Validation overhead >100ms, slow workflows

**Diagnosis**:
```bash
# Run performance benchmark
npm run benchmark

# Check cache hit rate
grep "cache hit" .claude/commands/hybridOps/logs/*
```

**Solution**:
- Ensure caching enabled (check session-scoped instances)
- Verify mind loading happens once per session
- Profile bottlenecks (use performance profiler)

### Issue 4: Veto triggered unexpectedly

**Symptoms**: Executor rejected with "TRUTHFULNESS_BELOW_THRESHOLD"

**Diagnosis**:
- Check truthfulness score in feedback
- Review veto threshold in config (default: 0.7)

**Solution**:
- Increase executor truthfulness score (behavioral assessment)
- Adjust veto threshold if too strict (config: PV_PA_001.thresholds.veto)
- Request manual override with justification

### Issue 5: Config changes not reflected

**Symptoms**: Modified config but behavior unchanged

**Solution**:
```bash
# Restart session to reload config
# Or enable hot-reload (if supported)

# Verify config file location
echo $HEURISTICS_CONFIG_PATH

# Check for syntax errors in YAML
node -e "console.log(require('yaml').parse(require('fs').readFileSync('config/heuristics.yaml', 'utf-8')))"
```

---

## 7. FAQ

**Q1: Do I need to rewrite my existing workflows?**
A: No. All existing workflows continue working in Generic mode (identical to v1.x).

**Q2: Can I use both PV and Generic modes?**
A: Yes. Choose mode per workflow, or use automatic fallback (PV when available, Generic otherwise).

**Q3: How do I know which mode I'm in?**
A: Agent responses include mode indicator: 🧠 for PV Mode, 📋 for Generic Mode.

**Q4: What happens if mind artifacts become unavailable?**
A: System automatically falls back to Generic mode with clear logging. No workflow interruption.

**Q5: Can I customize heuristic weights for my use case?**
A: Yes. Edit `config/heuristics.yaml` to tune weights and thresholds.

**Q6: How do I disable validation gates?**
A: Set `validation.strict_mode: false` in config, or run in Generic mode.

**Q7: Is Pedro's mind required for Hybrid-Ops to work?**
A: No. PV Mode requires mind artifacts, but Generic mode works without them (same as v1.x).

**Q8: Can I extend this for other minds?**
A: Yes. The infrastructure is generic. Create mind artifacts following the same format.

**Q9: What's the performance impact of PV Mode?**
A: <100ms validation overhead per operation. First mind load: <500ms. Cached: <10ms.

**Q10: How do I report bugs or request features?**
A: Submit issues through GitHub or contact the development team with steps to reproduce.

---

## 8. Next Steps

### After Migration

1. Run 2-3 real workflows in PV Mode
2. Review validation feedback and adjust config if needed
3. Compare results to v1.x (quality, speed, consistency)
4. Share feedback with development team

### Advanced Usage

- Explore standalone tools (`tools/coherence-scanner.js`, etc.)
- Create custom workflows using cognitive utilities
- Contribute mind artifacts for other decision-makers

### Training Resources

- Story 1.12: PV Mind Architecture Training Materials
- Heuristic reference: `docs/pv-mind-architecture.md`
- Agent development guide: `docs/agent-development-guide.md`

---

## 9. Support

### Documentation

- Architecture: `docs/architecture/hybrid-ops-pv-mind-integration.md`
- PRD: `docs/prd/hybrid-ops-pv-mind-integration.md`
- Validation Report: `docs/validation/story-1.2-phase-1-validation-report.md`

### Help Resources

- GitHub Issues: Submit bug reports and feature requests
- Internal Documentation: `docs/` directory in repository
- Team Contact: Reach out to development team through standard channels

### Reporting Issues

Include:
1. Hybrid-Ops version (`git rev-parse HEAD`)
2. Mode (PV or Generic)
3. Configuration (if PV Mode)
4. Steps to reproduce
5. Expected vs actual behavior
6. Relevant logs

---

**Document Version**: 1.0
**Last Updated**: 2025-10-19
**Maintainer**: AIOS Development Team

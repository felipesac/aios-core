# Changelog

All notable changes to AIOS-FullStack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.6] - 2025-10-31

### Changed

#### 🎨 **Improved ASCII Banner - Clean and Elegant**
- **Fixed Banner Style** - Replaced heavy pixelated banner with clean Unicode box drawing characters
- **Better Readability** - Banner now uses elegant ╔═╗║╚╝█ characters for professional appearance
- **Inspired by Reference** - Based on modern terminal UI design patterns
- **Maintained Colors** - Kept cyan color scheme for branding consistency

**Visual Improvement**:
- ✅ Clean, readable ASCII art using Unicode box drawing characters
- ✅ Professional appearance matching modern CLI tools
- ✅ Proper spacing and alignment
- ✅ Lightweight and elegant design

## [1.1.5] - 2025-10-31

### Changed

#### 🎨 **Enhanced Visual Design Based on Original v4 Installer**
- **ASCII Art Banner** - Large 3D-style "AIOS-FULLSTACK" banner in cyan
- **Clear Instructions** - Helpful hints before each interactive step ("Press <space> to select, <enter> to proceed")
- **Multi-select Support** - IDEs and expansion packs can now have multiple selections with checkboxes
- **Color Hierarchy** - Improved visual structure:
  - Cyan for headers and branding
  - Magenta for subtitles
  - Yellow for version information
  - Green for success messages (✓)
  - Gray for hints and secondary information
  - White for main prompts

**Visual Features**:
- ✨ Large ASCII art banner (AIOS-FULLSTACK)
- 🎯 Subtitle: "Universal AI Agent Framework for Any Domain"
- 🏷️ Version display: "Installer v4.31.0"
- ☑️ Checkbox multi-select for IDEs (can select multiple: Claude Code, Windsurf, Cursor)
- ☑️ Checkbox multi-select for expansion packs
- 📋 Interactive instructions for keyboard shortcuts
- 🎨 Consistent color scheme throughout installation
- ═══ Decorative separators for visual organization

**User Experience Improvements**:
- Users can now select multiple IDEs at once (e.g., both Claude Code and Cursor)
- Clear keyboard instructions shown before each multi-select
- Better visual feedback with colors and symbols
- Installation summary at the end with all selections

**Technical**:
- Switched back to `inquirer` with `chalk` for maximum checkbox customization
- Replaced `p.select()` single-choice with `inquirer.prompt()` checkbox for multi-select
- Maintained all functionality from v1.1.4 while improving visuals

## [1.1.4] - 2025-10-31

### Changed

#### 🎨 **Modern Visual Interface with @clack/prompts**
- **Complete UX overhaul** using @clack/prompts (Vite/Next.js style)
- **Beautiful terminal interface** with colors, spinners, and progress indicators
- **Improved user experience** with hints and better visual hierarchy

**Visual Improvements**:
- ✨ Intro banner with colored background
- 🎯 Select prompts with hints for each option
- ⏳ Spinners with progress messages during operations
- 📝 Notes and summaries in formatted boxes
- 🎨 Color-coded output (cyan, green for success)
- ✓ Clear outro message on completion

**Before (inquirer - basic)**:
```
? Como você está usando o AIOS-FullStack?
  1. Desenvolvendo o próprio framework AIOS-FullStack
> 2. Usando AIOS-FullStack em um projeto
```

**After (@clack/prompts - modern)**:
```
┌  AIOS-FullStack Installation
│
◆  How are you using AIOS-FullStack?
│  ○ Using AIOS in a project (Framework files added to .gitignore)
│  ● Developing AIOS framework itself (Framework files are source code)
└
```

### Technical Details

- **Files Modified**: `bin/aios-init.js` (complete rewrite with @clack/prompts)
- **Dependencies**: Uses existing `@clack/prompts@^0.11.0` and `picocolors@^1.1.1`
- **Functionality**: Same features, better presentation

### Upgrade Instructions

```bash
npm install -g aios-fullstack@1.1.4
```

**No Breaking Changes**: Same functionality, just prettier interface!

---

## [1.1.3] - 2025-10-31

### Added

#### ✨ **Complete Installation Wizard**
The wizard now performs a **full installation**, not just configuration:

**Step 4: IDE Selection**
- Choose IDE: Claude Code, Windsurf, Cursor, or skip
- Automatically copies IDE-specific rules to correct location
  - Claude Code → `.claude/CLAUDE.md`
  - Windsurf → `.windsurf/rules.md`
  - Cursor → `.cursor/rules.md`

**Step 5: AIOS Core Installation**
- Copies entire `.aios-core/` directory to project
- Includes all 11 agents, 68 tasks, 23 templates, 7 workflows
- Installs complete framework structure

**Step 6: Expansion Packs Selection**
- Multi-select checkbox for expansion packs
- Shows all available packs from framework
- Only copies selected packs (saves disk space)

### Fixed

#### 🐛 **Wizard was incomplete in v1.1.2**
- **Issue**: v1.1.2 only created config files, didn't copy framework files
- **Impact**: Users got configs but no `.aios-core/`, no IDE setup, no expansion packs
- **Root Cause**: `aios-init.js` stopped after PM configuration
- **Fix**: Added Steps 4, 5, and 6 for complete installation

### User Experience

**Before (v1.1.2):**
```
✅ AIOS-FullStack initialization complete!
# But... no .aios-core/, no IDE rules, no expansion packs
```

**After (v1.1.3):**
```
💻 Step 4: IDE Configuration
📦 Step 5: Installing AIOS Core files...
  ✓ AIOS Core files installed
  ✓ claude rules installed: .claude/CLAUDE.md
🎁 Step 6: Expansion Packs (Optional)
  ✓ Installed expansion pack: hybrid-ops
✅ AIOS-FullStack initialization complete!
```

### Technical Details

- **Files Modified**: `bin/aios-init.js` (+101 lines)
- **Dependencies**: Uses existing `fs-extra` for file copying
- **Cross-Platform**: Handles paths with `path.join()` on Windows/Unix

### Upgrade Instructions

**From v1.1.2 to v1.1.3:**
```bash
npm install -g aios-fullstack@1.1.3
```

**No Breaking Changes**: If you ran v1.1.2 and got incomplete installation, just run `install` again with v1.1.3 to get full setup.

---

## [1.1.2] - 2025-10-31

### Fixed

#### 🐛 **Wizard now works in empty directories**
- **Issue**: Installation wizard required pre-existing git repository with remote origin and package.json
- **Impact**: Users couldn't run `npx aios-fullstack install` in new/empty directories
- **Root Cause**: `aios-init.js` called `detectRepositoryContext()` which failed without git remote
- **Fix**: Wizard now automatically creates prerequisites if missing

### Changed

#### ✨ **Improved Installation Wizard Flexibility**
- **Automatic Setup**: Wizard now handles missing prerequisites gracefully
  - Creates git repository if not exists (`git init`)
  - Creates package.json if not exists (with sensible defaults)
  - Continues with configuration even without remote origin

- **User Experience Improvements**:
  - Clear status messages during setup
  - No manual prerequisite steps required
  - Works in completely empty directories

### Behavior Changes

| Scenario | v1.1.1 Behavior | v1.1.2 Behavior |
|----------|----------------|----------------|
| Empty directory | ❌ Error: "No git repository detected" | ✅ Creates git repo + package.json, runs wizard |
| Git repo, no package.json | ❌ Error: "No package.json found" | ✅ Creates package.json, runs wizard |
| Git repo, no remote | ❌ Error: "No remote origin" | ✅ Uses local context, runs wizard |
| Complete setup | ✅ Runs wizard | ✅ Runs wizard |

### Upgrade Instructions

**From v1.1.1 to v1.1.2:**
```bash
npm install -g aios-fullstack@1.1.2
```

**No Breaking Changes**: Pure enhancement. All v1.1.1 functionality preserved.

---

## [1.1.1] - 2025-10-31

### Fixed

#### 🐛 **Critical: `install` command executed wrong script**
- **Issue**: `npx aios-fullstack install` executed global 1MCP setup script instead of project wizard
- **Impact**: Users got 1MCP infrastructure installation instead of project initialization
- **Root Cause**: `bin/aios.js` install command pointed to `scripts/install-aios.cmd` (global setup)
- **Fix**: install command now correctly executes `bin/aios-init.js` (project wizard)

### Changed

#### 🔄 **Command Behavior Corrections**
- **`aios-fullstack install`**: Now runs project initialization wizard (correct)
  - Asks for installation mode (framework-development vs project-development)
  - Configures git repository detection
  - Sets up PM tool integration (ClickUp, GitHub Projects, Jira, or local)
  - Creates `.aios-installation-config.yaml` and `.aios-pm-config.yaml`

### Added

#### ✨ **New Command: `setup-mcp`**
- **`aios-fullstack setup-mcp`**: Setup 1MCP infrastructure (advanced users)
  - Installs 1MCP globally via npm
  - Configures MCPs (context7, github, browser, exa)
  - Creates presets (aios-dev, aios-research, aios-pm, aios-full)
  - Sets up API keys template (~/.claude-env)
  - Configures Claude Code integration
  - Installs systemd/NSSM service for auto-start

### Command Reference

| Command | What It Does | When To Use |
|---------|-------------|-------------|
| `npx aios-fullstack install` | Project initialization wizard | Installing AIOS in a project |
| `npx aios-fullstack setup-mcp` | Global 1MCP infrastructure setup | First-time setup or advanced users |
| `npx aios-fullstack init <name>` | Create new project | Starting fresh project |

### Upgrade Instructions

**From v1.1.0 to v1.1.1:**
```bash
npm install -g aios-fullstack@1.1.1
```

**No Breaking Changes**: This is a pure bug fix. If you ran `install` in v1.1.0 and got 1MCP setup, that's fine. Just run `install` again in your project directory to get the project wizard.

---

## [1.1.0] - 2025-10-31

### ✨ Major Feature: Complete CLI Implementation

This release implements the **complete CLI experience** documented in README and Epic 2 stories. The installation wizard now runs immediately via `npx aios-fullstack install`, matching the original design intent.

### Added

#### 🚀 **Full-Featured Commander.js CLI** (`bin/aios.js`)
New professional CLI with comprehensive subcommands:

- **`aios-fullstack init [project-name]`** - Create new AIOS project with interactive wizard
  - Options: `--force`, `--skip-install`, `--template <name>`
  - Creates project directory and initializes AIOS configuration
  - Supports multiple templates (default, minimal, enterprise)

- **`aios-fullstack install`** - Full installation wizard with 1MCP integration
  - Options: `--force`, `--quiet`, `--dry-run`
  - Executes complete setup: 1MCP, API keys, MCPs, presets, systemd/NSSM service
  - Cross-platform: Automatically detects and runs Windows (.cmd) or Unix (.sh) installer
  - Integrates scripts/install-aios.cmd and scripts/install-aios.sh

- **`aios-fullstack info`** - Display system information
  - Shows version, platform, Node.js version, installation location
  - Lists installed components (agents, tasks, templates, workflows)

- **`aios-fullstack doctor`** - Run system diagnostics and health checks
  - Option: `--fix` (auto-fix detected issues)
  - Validates Node.js version (>=18.0.0 required)
  - Checks npm, git, GitHub CLI availability
  - Verifies AIOS core installation and dependencies
  - Provides actionable recommendations

- **`aios-fullstack update`** - Update to latest version
  - Auto-detects global vs local installation
  - Runs appropriate npm update command

- **`aios-fullstack uninstall`** - Remove AIOS-FullStack
  - Safe uninstallation with confirmation

#### 📦 **Dual Bin Entries**
- `aios-fullstack` - Full command name (recommended)
- `aios` - Short alias for convenience

Both commands point to the new CLI and support all subcommands.

### Changed

#### 🔄 **Installation Flow (Breaking Change for v1.0.x users)**
- **Before (v1.0.x)**: `npm install -g aios-fullstack` → manual `aios init`
- **After (v1.1.0)**: `npx aios-fullstack install` → automatic wizard execution

**Migration Path**:
```bash
# Old way (still works but not recommended)
npm install -g aios-fullstack@1.0.1
aios init

# New way (recommended - matches Epic 2 design)
npx aios-fullstack install
```

#### 📝 **bin/aios-init.js Role**
- No longer the main entry point
- Now called by `aios-fullstack init` command
- Remains the project initialization wizard (git repo, PM tool config)

### Technical Details

- **Files Added**:
  - `bin/aios.js` (+380 lines) - Main CLI with commander.js

- **Files Modified**:
  - `package.json` - Updated bin entries and version to 1.1.0

- **Dependencies**: Uses existing `commander@^14.0.1` (already in dependencies)

- **Cross-Platform Compatibility**:
  - Detects Windows vs Unix and executes appropriate install script
  - Handles `chmod +x` for Unix scripts automatically
  - Uses `cmd /c` for Windows batch files

- **Semantic Versioning**: MINOR version bump (1.0.1 → 1.1.0)
  - Reason: New features (CLI subcommands) added in backward-compatible manner
  - No breaking changes to existing APIs
  - Users can continue using `aios init` (now via `aios-fullstack init`)

### Features Matching Epic 2 Documentation

✅ **Story 2.3.1 Requirements**:
- Interactive installation wizard
- Cross-platform support (Windows, macOS, Linux)
- NPX-first workflow: `npx aios-fullstack install`
- Vite-style modern UX with @clack/prompts (via install scripts)

✅ **README Documentation Compliance**:
- All documented commands now functional
- Help system implemented (`--help` on any command)
- Dry-run support for testing
- System diagnostics with `doctor` command

### Upgrade Instructions

#### From v1.0.x to v1.1.0:

**Option 1: Clean Install (Recommended)**
```bash
# Uninstall old version
npm uninstall -g aios-fullstack

# Install with new wizard
npx aios-fullstack install
```

**Option 2: Update Existing Installation**
```bash
# Update package
npm install -g aios-fullstack@1.1.0

# Verify installation
aios-fullstack doctor

# Run full installation wizard if needed
aios-fullstack install
```

### User Impact

**What Users Get**:
- ✅ Installation wizard runs **immediately** after `npx aios-fullstack install`
- ✅ Complete 1MCP setup with all MCPs, presets, API keys
- ✅ Professional CLI experience matching modern tools (Vite, Next.js)
- ✅ System diagnostics and health checks
- ✅ Simplified onboarding workflow

**What Changed**:
- Command changed from `aios init` to `aios-fullstack init` (or `aios init`)
- New `install` command for full setup wizard
- More robust and feature-complete CLI

### Known Issues

- Auto-fix in `doctor --fix` not yet implemented (coming in v1.2.0)
- Template selection (`--template`) placeholder (default template always used)

---

## [1.0.1] - 2025-10-31

### Fixed
- **Installation Wizard** - Fixed critical module resolution bug in `bin/aios-init.js`
  - Issue: `Cannot find module '../.aios-core/utils/gitignore-manager'` when installed from NPM
  - Root Cause: Incorrect path resolution for AIOS Core modules in NPM package structure
  - Solution: Implemented smart path resolution that works in both development and NPM environments
  - Added inline `updateGitIgnore()` function (gitignore-manager was archived in Story 3.18)
  - Pattern based on RC.8 `resource-locator.js` - cross-platform compatible using `path.join()`

### Changed
- **Module Resolution**: Simplified module loading strategy in `bin/aios-init.js`
  - Path is always `../.aios-core/` relative to `bin/` directory
  - Works in development, NPM global install, and NPM local install
  - Improved error messages with diagnostic information

### Technical Details
- **Files Modified**: `bin/aios-init.js` (+65 lines)
- **Pattern**: Cross-platform path resolution using Node.js `path.join()` and `fs.existsSync()`
- **Verification**: Tested on Windows with clean NPM global installation
- **Compatibility**: No breaking changes - pure bug fix

**Upgrade Command**:
```bash
npm install -g aios-fullstack@1.0.1
```

---

## [1.0.0] - 2025-10-31

### 🎉 First Stable Production Release

This is the first official stable release of AIOS-FullStack, an AI-Orchestrated System for Full Stack Development.

### Added

#### Core Framework (.aios-core/)
- **11 AI Agents** - Specialized agents for development workflow
  - Master Orchestrator - Central coordination agent
  - Developer Agent - Story-driven development
  - QA Agent - Quality assurance and testing
  - Architect Agent - System architecture and design
  - Product Owner Agent - Backlog and story management
  - Project Manager Agent - Project coordination
  - Scrum Master Agent - Agile process facilitation
  - Business Analyst Agent - Requirements analysis
  - UX Expert Agent - User experience design
  - DB-Sage Agent - Database architecture and management
  - GitHub DevOps Agent - Repository and release management

- **56+ Task Workflows** - Executable task definitions
  - Story-driven development workflow
  - Quality gate validation
  - Version management and semantic versioning
  - Pre-push quality gates
  - Security scanning
  - Database management tasks (10 specialized tasks)
  - GitHub PR automation
  - Repository cleanup
  - And many more...

- **30+ Templates** - Document and code templates
  - Story templates (YAML)
  - Agent definition templates
  - PRD templates
  - Architecture documentation templates
  - CI/CD workflow templates (GitHub Actions)
  - IDE-specific rule templates (Claude, Cursor, Windsurf)

- **60+ Utilities** - Automation and helper scripts
  - Story lifecycle management
  - Tool discovery and resolution
  - Git operations wrapper
  - Template rendering engine
  - Interactive elicitation engine
  - Test generation
  - PM tool adapters (ClickUp, Jira, GitHub, Local)
  - And many more...

- **8 MCP Integrations** - Model Context Protocol servers
  - 21st-dev-magic - UI component generation
  - Browser - Browser automation
  - ClickUp - Project management integration
  - Context7 - Documentation search
  - Exa - Web research and semantic search
  - Google Workspace - Drive, Docs, Sheets, Calendar APIs
  - n8n - Workflow automation platform
  - Supabase - Backend-as-a-service integration

- **6 Workflow Orchestrations** - Multi-step workflows
  - Greenfield fullstack development
  - Greenfield service development
  - Greenfield UI development
  - Brownfield fullstack enhancement
  - Brownfield service enhancement
  - Brownfield UI enhancement

#### Expansion Packs
- **Hybrid-Ops Expansion Pack** - Pedro Valério Methodology Integration
  - 18 PV-specialized agents
  - 12 Hybrid-Ops tasks
  - Pedro Valério Mind extraction (15+ cognitive analysis artifacts)
  - 10 meeting transcripts for context
  - Complete E2E test suite with 57 test reports
  - PV-style templates and meta-templates
  - Validation checklists

#### Infrastructure & Tooling
- **Git Hooks** (.husky/)
  - Pre-commit architecture validation
  - Pre-push quality gates
  - Fast validation (<5s typical, <15s large commits)
  - Can be overridden with --no-verify for partial work

- **GitHub Actions** (.github/)
  - CI workflow (lint, test, build)
  - Cross-platform tests (Windows, macOS, Linux)
  - Quarterly architecture gap audit

- **Cross-Platform Scripts**
  - install-aios.sh (Unix/macOS)
  - install-aios.cmd (Windows)
  - 1MCP startup scripts (sh, ps1, cmd)
  - Branch protection setup

- **Package Configuration**
  - npm package configuration
  - TypeScript configuration
  - ESLint configuration with security rules
  - Jest test configuration
  - Prettier code formatting

#### Documentation
- README.md - Project overview and quick start
- LICENSE - MIT License
- CONTRIBUTING.md - Contribution guidelines
- PROJECT-SOURCE-TREE.md - Complete structure visualization
- V1.0.0-FINAL-STATUS.md - Release status report
- RC8-FINAL-REPORT.md - RC8 validation report

### Features

#### Agent-Based Development
- 11 specialized AI agents for different roles
- Agents activated with @agent-name syntax
- Agent commands use * prefix (*help, *task, *exit)
- Agents maintain context and expertise throughout interaction

#### Story-Driven Workflow
- All development starts with stories in docs/stories/
- Update progress by marking checkboxes: [ ] → [x]
- Track changes in File List section
- Follow acceptance criteria exactly

#### Hybrid-Ops Methodology
- Pedro Valério cognitive profile integration
- PV-specialized agents for human-AI collaboration
- Access to PV mind artifacts for context-aware decisions
- Validated with 57 E2E test reports

#### Cross-Platform CLI
- Interactive wizard for framework initialization
- Works on Windows, macOS, and Linux
- Node.js 18+ and npm 9+ required
- Supports multiple installation modes

#### MCP Integration
- 8 Model Context Protocol servers for extended capabilities
- Tool discovery and validation
- Dynamic tool resolution
- Integration with ClickUp, GitHub, Supabase, and more

#### Quality Automation
- Pre-commit hooks for architecture validation
- Pre-push quality gates (lint, test, typecheck, build)
- Security scanning
- Automated code quality checks

#### Brownfield Support
- Work with existing codebases
- Analyze and enhance legacy systems
- Migration path generation
- Risk assessment for modifications

#### PM Tool Agnostic
- ClickUp adapter
- Jira adapter
- GitHub Projects adapter
- Local YAML adapter
- Easy to add new adapters

### Technical Details

- **Total Files:** 401 committed files
- **Lines of Code:** ~179,000 lines
- **Package Size:** ~13MB (including hybrid-ops expansion)
- **Node Version:** >= 18.0.0
- **NPM Version:** >= 9.0.0

### Installation

```bash
npm install -g aios-fullstack
aios init
```

### Repository

- **GitHub:** https://github.com/Pedrovaleriolopez/aios-fullstack
- **NPM:** https://www.npmjs.com/package/aios-fullstack

### License

MIT License - See LICENSE file for details

### Contributors

- Pedro Valério Lopez (Hybrid-Ops Methodology)
- Claude Code (Framework Development)
- AllFluence Team

---

## [1.0.0-rc.11] - 2025-10-31

### Changed
- Updated aios-fullstack submodule to RC.11
- Critical documentation sync for agent resource discovery

### Fixed
- Git workflow implementation plan refinements
- Story tracking improvements

---

**Full Changelog:** https://github.com/Pedrovaleriolopez/aios-fullstack/commits/v1.0.0

---
name: extend
description: Generate new plugin components (agents, skills, hooks, commands, rules) following existing patterns with researched domain knowledge. Supports full ecosystem scaffolding or individual components.
argument-hint: [ecosystem-or-flags]
context: fork
allowed-tools: Read, Write, Edit, Bash, Bash(mcp-cli *), Grep, Glob, AskUserQuestion, WebSearch, WebFetch
---

# Plugin Extension Generator

Generate new plugin components that follow existing patterns, contain real domain knowledge from online research, and are properly cross-linked.

## Usage

```bash
/extend go                           # Full ecosystem: patterns skill + reviewer agent + build-resolver + hooks
/extend --agent go-reviewer          # Single agent
/extend --skill rust-patterns        # Single skill
/extend --hook swift-formatter       # Single hook
/extend --command go-review          # Single command
/extend --list                       # Show existing components at all levels
```

## When This Skill Applies

- Adding support for a new language/ecosystem (Go, Rust, Swift, C#, Ruby, etc.)
- Creating individual components (a new reviewer agent, a new patterns skill, etc.)
- Auditing existing components with `--list`
- Claude detects a new ecosystem in the project (e.g., user adds `go.mod`) and proactively suggests `/extend`

## Complete Workflow

**You MUST complete ALL 9 steps.**

Steps overview:
1. Parse Arguments
2. Discover Existing Components
3. Ask User (target level, scope, confirmation)
4. Read Authoritative Specs (PLUGIN_DEVELOPMENT docs)
5. Research Domain Knowledge
6. Find Template Components
7. Generate Components (dependency order)
8. Report Summary
9. Verify

---

### Step 1: Parse Arguments

Parse `$ARGUMENTS` to determine mode:

**Ecosystem mode** (no flags): generates a full set of components
```
/extend go        → ecosystem = "go", mode = "ecosystem"
/extend rust      → ecosystem = "rust", mode = "ecosystem"
```

**Single-component mode** (with flag):
```
/extend --agent go-reviewer      → component = "agent", name = "go-reviewer"
/extend --skill rust-patterns    → component = "skill", name = "rust-patterns"
/extend --hook swift-formatter   → component = "hook", name = "swift-formatter"
/extend --command go-review      → component = "command", name = "go-review"
/extend --rule go-style          → component = "rule", name = "go-style"
```

**List mode**:
```
/extend --list    → mode = "list", jump to Step 2 then report and stop
```

**If no arguments provided**: Ask user what ecosystem or component they want to generate.

---

### Step 2: Discover Existing Components

Scan three levels for existing components:

**User-level** (`~/.claude/`):
```bash
ls ~/.claude/agents/ ~/.claude/skills/ ~/.claude/commands/ ~/.claude/rules/ ~/.claude/ecosystems/ 2>/dev/null
```

**Project-level** (`./.claude/`):
```bash
ls ./.claude/agents/ ./.claude/skills/ ./.claude/commands/ ./.claude/rules/ ./.claude/ecosystems/ 2>/dev/null
```

**Plugin (installed)** — use `${CLAUDE_PLUGIN_ROOT}` to resolve the installed plugin cache path:
```bash
ls "${CLAUDE_PLUGIN_ROOT}/agents/" "${CLAUDE_PLUGIN_ROOT}/skills/" "${CLAUDE_PLUGIN_ROOT}/commands/" "${CLAUDE_PLUGIN_ROOT}/rules/" "${CLAUDE_PLUGIN_ROOT}/scripts/lib/ecosystems/" 2>/dev/null
```

Build an inventory table and check for name collisions with planned components.

**If `--list` mode**: Display the inventory grouped by level (User / Project / Plugin) and stop.

---

### Step 3: Ask User (AskUserQuestion)

**Question 1 — Target level**:
```
Question: "Where should new components be installed?"
Header: "Target"
Options:
  - "User (~/.claude/) (Recommended)" — Available in all projects
  - "Project (./.claude/)" — Scoped to this project only
```

Note: The plugin cache (`${CLAUDE_PLUGIN_ROOT}`) is read-only. To add components to the plugin itself, work in the plugin source repository.

**Question 2 — Scope** (ecosystem mode only):
```
Question: "Which components should be generated?"
Header: "Components"
MultiSelect: true
Options:
  - "Patterns skill" — Domain knowledge and best practices
  - "Reviewer agent" — Code review specialist
  - "Build resolver agent" — Build/lint/type error fixer
  - "Hooks" — Auto-formatter and security scanner
  - "Command" — Slash command for review
  - "Rule" — Coding style guidelines
  - "Ecosystem module" — Auto-discoverable setup/detection integration
```

**Question 3 — Confirm**:
Display planned components with their target paths and ask for confirmation:
```
Question: "Generate these components?"
Header: "Confirm"
Options:
  - "Yes, generate all" — Proceed with generation
  - "Let me adjust" — Go back to scope selection
```

---

### Step 4: Read Authoritative Specs (PLUGIN_DEVELOPMENT)

The PLUGIN_DEVELOPMENT docs ship with the plugin. Read these for current field specs, deprecations, and novelties:

```
${CLAUDE_PLUGIN_ROOT}/docs/PLUGIN_DEVELOPMENT/00-OVERVIEW.md          — plugin architecture, component types, variable substitution
${CLAUDE_PLUGIN_ROOT}/docs/PLUGIN_DEVELOPMENT/01-COMMANDS-SKILLS.md   — skill/command frontmatter fields
${CLAUDE_PLUGIN_ROOT}/docs/PLUGIN_DEVELOPMENT/02-AGENTS.md            — agent frontmatter fields
${CLAUDE_PLUGIN_ROOT}/docs/PLUGIN_DEVELOPMENT/03-HOOKS.md             — hook types, matchers, JSON structure
${CLAUDE_PLUGIN_ROOT}/docs/PLUGIN_DEVELOPMENT/05-BEST-PRACTICES.md    — model selection, performance guidelines
```

Read only the docs relevant to the components being generated. For example, if only generating a skill, read `01-COMMANDS-SKILLS.md` and `05-BEST-PRACTICES.md`.

---

### Step 5: Research Domain Knowledge

Use an MCP-first strategy with graceful fallback:

1. **context7** — Try `context7/resolve-library-id` + `context7/query-docs` for ecosystem documentation
2. **ddg-search** — Try `ddg-search/search` for tooling (formatters, linters, security scanners, build systems)
3. **WebSearch + WebFetch** — Fall back if MCPs are unavailable
4. **Built-in knowledge** — Last resort, use Claude's training data

**Research targets** (gather for the ecosystem):
- Formatter (e.g., gofmt, rustfmt, swift-format)
- Linter (e.g., golangci-lint, clippy, SwiftLint)
- Type checker (if applicable)
- Security scanner (e.g., gosec, cargo-audit)
- Build tool (e.g., go build, cargo, swift build)
- Test framework (e.g., go test, cargo test, XCTest)
- Package manager (e.g., go modules, cargo, SPM)
- Idiomatic patterns (naming, error handling, project structure)

---

### Step 6: Find Template Components

Read the most similar existing component from the installed plugin as a concrete template:

| Generating | Read as template |
|-----------|-----------------|
| `*-patterns` skill | `${CLAUDE_PLUGIN_ROOT}/skills/python-patterns/SKILL.md` |
| `*-reviewer` agent | `${CLAUDE_PLUGIN_ROOT}/agents/python-reviewer.md` |
| `*-build-resolver` agent | `${CLAUDE_PLUGIN_ROOT}/agents/python-build-resolver.md` |
| formatter hook | `${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json` PostToolUse entries + `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js` |
| review command | `${CLAUDE_PLUGIN_ROOT}/commands/code-review.md` |
| style rule | `${CLAUDE_PLUGIN_ROOT}/rules/coding-style.md` |

Read the template, understand its structure, then adapt it for the target ecosystem. Do NOT copy blindly — replace all language-specific content with researched domain knowledge from Step 5.

---

### Step 7: Generate Components (dependency order)

All paths use the **target prefix** from Step 3:
- User-level: `~/.claude/`
- Project-level: `./.claude/`

Create directories as needed (`mkdir -p` equivalent).

#### 7a. Patterns Skill (if included)

**Create**: `<target>/skills/<ecosystem>-patterns/SKILL.md`

**Frontmatter**:
```yaml
---
name: <ecosystem>-patterns
description: <Ecosystem> project structure, tooling, patterns, and best practices.
user-invocable: false
---
```

**Content sections** (filled with genuine researched knowledge from Step 5):
- Project structure conventions
- Package management commands
- Build and test commands
- Formatting and linting tool configuration
- Idiomatic patterns (error handling, naming, concurrency, etc.)
- Testing patterns and frameworks
- Common pitfalls and anti-patterns

#### 7b. Reviewer Agent (if included)

**Create**: `<target>/agents/<ecosystem>-reviewer.md`

**Frontmatter**:
```yaml
---
name: <ecosystem>-reviewer
description: <Ecosystem> code review specialist. Reviews for idiomatic patterns, security, performance, and best practices. Uses <formatter> and <linter>.
tools: Read, Grep, Glob, Bash
model: opus
skills: <ecosystem>-patterns, serena-code-navigation
---
```

**Content sections**:
- Role description
- Review checklist organized by severity (CRITICAL / HIGH / MEDIUM / LOW)
- Tool commands for automated checks (formatter, linter, security scanner)
- Output format (structured review report)
- When to use (proactive triggers)

#### 7c. Build Resolver Agent (if included)

**Create**: `<target>/agents/<ecosystem>-build-resolver.md`

**Frontmatter**:
```yaml
---
name: <ecosystem>-build-resolver
description: Fix <ecosystem> build, lint, and type errors with minimal diffs. Focuses on getting the build green quickly.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---
```

**Content sections**:
- Common build errors and their fixes
- Diagnostic commands (build, lint, type check)
- Fix strategies (dependency ordering)
- What NOT to do (no architectural changes, no refactoring)

#### 7d. Hooks (if included)

**Target**: `<target>/hooks/hooks.json` and `<target>/scripts/hooks/`

**Check existing hooks file**:
- If `<target>/hooks/hooks.json` exists, read it and append new entries
- If it doesn't exist, create it with the standard structure

**Formatter hook** (PostToolUse):
```json
{
  "type": "PostToolUse",
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [
    {
      "type": "command",
      "command": "node \"<target>/scripts/hooks/<ecosystem>-formatter.js\""
    }
  ],
  "description": "Auto-format <ecosystem> files after edit (<formatter-tool>)"
}
```

**Create formatter script** at `<target>/scripts/hooks/<ecosystem>-formatter.js`:
- The script should be **registry-aware**: import the ecosystem registry and call `getEcosystem('<ecosystem>').getFileFormatters()` at runtime to get formatter definitions
- Do NOT hardcode formatter tool names or arguments — the ecosystem module is the single source of truth
- Follow the `smart-formatter.js` pattern from `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js` for the hook protocol (readHookInput/writeHookOutput/safeExecSync)
- Iterate over `getFileFormatters()` entries matching the file extension, try each tool until one succeeds
- Handle errors gracefully (formatter not installed)
- Always output original stdin data

**Idempotency**: Before appending, check if a hook with the same matcher + description already exists.

#### 7e. Command (if included)

**Create**: `<target>/commands/<ecosystem>-review.md`

**Frontmatter**:
```yaml
---
description: Review <ecosystem> code for quality, security, and best practices
---
```

**Body**: Mention the reviewer agent by name for delegation:
```markdown
This command invokes the **<ecosystem>-reviewer** agent to perform a comprehensive review.
```

Include: when to use, what gets checked, output format.

#### 7f. Rule (if included)

**Create**: `<target>/rules/<ecosystem>-style.md`

**Content**:
- Naming conventions for the ecosystem
- Code organization standards
- Formatting tool configuration
- Import ordering conventions
- Error handling patterns
- What the auto-formatter enforces vs. what requires manual attention

#### 7g. Ecosystem Module (if included)

**Purpose**: Generate a self-describing ecosystem module so the new ecosystem is automatically discovered by the setup/detection infrastructure. No other file modifications needed.

**Create**: `<target>/ecosystems/<ecosystem>.cjs` (at the chosen target level)
- User-level: `~/.claude/ecosystems/<ecosystem>.cjs`
- Project-level: `./.claude/ecosystems/<ecosystem>.cjs`
- Plugin source repo: `scripts/lib/ecosystems/<ecosystem>.cjs`

**Import path** (varies by target level):
```javascript
// Plugin source repo (relative)
const { Ecosystem } = require('./types.cjs');

// User or project level (via CLAUDE_PLUGIN_ROOT)
const path = require('path');
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
const { Ecosystem } = require(path.join(pluginRoot, 'scripts/lib/ecosystems/types.cjs'));
```

**Required methods to implement** (all with real values from Step 5 research):
```javascript
class <Ecosystem>Ecosystem extends Ecosystem {
  constructor(config = {}) { super('<ecosystem>', config); }
  getConstantKey()          // e.g. 'GO'
  getDetectionPriority()    // Lower = checked first; use 15 for specific ecosystems
  getName()                 // Human-readable, e.g. 'Go'
  getIndicators()           // File names, e.g. ['go.mod', 'go.sum']
  getFileExtensions()       // e.g. ['.go']
  getTools()                // { runtime: [...], packageManagers: [...] }
  getVersionCommands()      // { tool: 'tool --version' }
  getInstallationHelp()     // { tool: { win32, darwin, linux } }
  getSetupToolCategories()  // { critical: [...], recommended: [...] }
  getDebugPatterns()        // [{ extensions, pattern, name, message }]
  getInstallCommand(config) // e.g. 'go mod download'
  getRunCommand(script, config)
  getBuildCommand(config)
  getTestCommand(config)
  getFormatCommand(config)
  getLintCommand(config)
}
module.exports = { <Ecosystem>Ecosystem };
```

**After generation**, verify the new ecosystem is discovered:
```bash
node -e "const {getRegistry} = require('./scripts/lib/ecosystems/index.cjs'); console.log(Object.keys(getRegistry()))"
```

---

### Step 8: Report Summary

Display all generated files with their absolute paths:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Plugin Extension Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ecosystem: <ecosystem>
Target: <user|project> (<path>)

Generated Components:
  [skill]     <path>/skills/<ecosystem>-patterns/SKILL.md
  [agent]     <path>/agents/<ecosystem>-reviewer.md
  [agent]     <path>/agents/<ecosystem>-build-resolver.md
  [hook]      <path>/hooks/hooks.json (appended)
  [script]    <path>/scripts/hooks/<ecosystem>-formatter.js
  [command]   <path>/commands/<ecosystem>-review.md
  [rule]      <path>/rules/<ecosystem>-style.md
  [ecosystem] <path>/ecosystems/<ecosystem>.cjs

Cross-Links:
  <ecosystem>-reviewer agent → uses <ecosystem>-patterns skill
  <ecosystem>-review command → delegates to <ecosystem>-reviewer agent
  formatter hook → runs <ecosystem>-formatter.js script

Next Steps:
  1. Review generated files and adjust content as needed
  2. Test: /<ecosystem>-review on a sample file
  3. Verify formatter hook triggers on file edit
```

---

### Step 9: Verify

Run verification checks:

1. **Tests** (if in plugin repo): `node tests/run-all.cjs`
2. **Agent skill references**: Grep agent `skills:` fields → verify referenced skill directories exist
3. **Command agent references**: Grep command bodies → verify named agents exist as files
4. **Hook script references**: Grep hook script paths → verify script files exist
5. **File existence**: Verify all generated files are readable
6. **Ecosystem registry** (if ecosystem module generated): Verify the new ecosystem appears in the registry:
   ```bash
   node -e "const {getRegistry,ECOSYSTEMS} = require('./scripts/lib/ecosystems/index.cjs'); console.log('Registry:', Object.keys(getRegistry())); console.log('Constants:', ECOSYSTEMS)"
   ```

Report results with pass/fail for each check.

---

## Cross-Linking Rules

Every generated component must follow these cross-linking rules:

| Link | Mechanism |
|------|----------|
| Agent → Skill | `skills:` field in agent frontmatter |
| Command → Agent | Agent name mentioned in command body text |
| Hook → Script | Script path in hook `command` field |
| Skill → nothing | Skills are leaf nodes (no outgoing references) |
| Rule → nothing | Rules are leaf nodes (no outgoing references) |

## Idempotency

This workflow is **safe to re-run**:
- Discovery (Step 2) catches existing components
- Step 3 warns before overwriting, offers skip/rename
- Hook additions check for duplicate matchers before appending
- Generated files can be regenerated without side effects

## Error Handling

- **MCP unavailable** → WebSearch → WebFetch → Claude knowledge (graceful degradation)
- **Test failures after generation** → report but don't delete generated files
- **Invalid target directory** → create it (mkdir -p equivalent)
- **Formatter tool not installed** → generate the hook script anyway with a "tool not found" warning in stderr
- **Name collision** → ask user: overwrite, rename, or skip

## Component Naming Convention

All generated components follow the plugin's naming convention:
- Lowercase with hyphens: `go-patterns`, `rust-reviewer`, `swift-build-resolver`
- Ecosystem prefix: `<ecosystem>-<component-type>`
- Files: `<ecosystem>-<type>.md` for agents/commands/rules
- Directories: `<ecosystem>-<type>/SKILL.md` for skills
- Scripts: `<ecosystem>-<purpose>.js` for hook scripts

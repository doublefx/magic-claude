# Component Templates

All paths use the **target prefix** from Step 3 (`~/.claude/` or `./.claude/`).

---

## 7a. Patterns Skill

**Create**: `<target>/skills/<ecosystem>-patterns/SKILL.md`

```yaml
---
name: <ecosystem>-patterns
description: <Ecosystem> project structure, tooling, and idiomatic patterns. Use when setting up a new <ecosystem> project, writing or reviewing <ecosystem> code, configuring the build/test toolchain, or asking about <ecosystem> best practices. Consult before starting any non-trivial <ecosystem> work.
user-invocable: false
---
```

**Structure** — progressive disclosure:
- `SKILL.md`: lean index under 300 lines — "When to Activate", one section per topic with 2-3 bullet points (no code blocks), pointer to `references/<section>.md`
- `references/` directory: one file per major topic with full code examples

**Reference files to create**:
- `project-structure.md` — Directory layout, file naming conventions
- `package-management.md` — Install, update, lock commands
- `build-and-test.md` — Build, test, coverage commands
- `tooling.md` — Formatter, linter, security scanner configuration
- `idiomatic-patterns.md` — Error handling, naming, concurrency, etc.
- `testing-patterns.md` — Test frameworks, mocking, assertion libraries
- `common-pitfalls.md` — Anti-patterns and gotchas

---

## 7b. Reviewer Agent

**Create**: `<target>/agents/<ecosystem>-reviewer.md`

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

---

## 7c. Build Resolver Agent

**Create**: `<target>/agents/<ecosystem>-build-resolver.md`

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

---

## 7d. Formatter Hook

**Target**: `<target>/hooks/hooks.json` (append or create) + `<target>/scripts/hooks/<ecosystem>-formatter.js`

```json
{
  "type": "PostToolUse",
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [{
    "type": "command",
    "command": "node \"<target>/scripts/hooks/<ecosystem>-formatter.js\""
  }],
  "description": "Auto-format <ecosystem> files after edit (<formatter-tool>)"
}
```

**Formatter script** (`<target>/scripts/hooks/<ecosystem>-formatter.js`):
- Registry-aware: import the ecosystem registry, call `getEcosystem('<ecosystem>').getFileFormatters()`
- Follow `smart-formatter.js` pattern from `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.js`
- Use `readHookInput`/`writeHookOutput`/`safeExecSync` from hook-utils
- Iterate over formatters matching file extension, try each until one succeeds
- Handle errors gracefully (formatter not installed)
- **Check for duplicate matchers** before appending to hooks.json

---

## 7e. Command

**Create**: `<target>/commands/<ecosystem>-review.md`

```yaml
---
description: Review <ecosystem> code for quality, security, and best practices
---
```

Body: `This command invokes the **<ecosystem>-reviewer** agent to perform a comprehensive review.`

Include: when to use, what gets checked, output format.

---

## 7f. Rule

**Create**: `<target>/rules/<ecosystem>-style.md`

Content:
- Naming conventions for the ecosystem
- Code organization standards
- Formatting tool configuration
- Import ordering conventions
- Error handling patterns
- What the auto-formatter enforces vs. what requires manual attention

---

## 7g. Ecosystem Module

**Create**: `<target>/ecosystems/<ecosystem>.cjs`

```javascript
const path = require('path');
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || '';
const { Ecosystem } = require(path.join(pluginRoot, 'scripts/lib/ecosystems/types.cjs'));

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
  getInstallCommand(config)
  getRunCommand(script, config)
  getBuildCommand(config)
  getTestCommand(config)
  getFormatCommand(config)
  getLintCommand(config)
}
module.exports = { <Ecosystem>Ecosystem };
```

**Verify discovery after generation**:
```bash
node -e "const {getRegistry} = require('./scripts/lib/ecosystems/index.cjs'); console.log(Object.keys(getRegistry()))"
```

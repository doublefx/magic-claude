---
name: extend
description: >
  Use this skill to expand the magic-claude plugin with new language, framework, or infrastructure support. Invoke when you want to: add a new ecosystem (Go, Rust, Swift, PHP, Ruby, Terraform, Kubernetes...), create individual components (reviewer agent, patterns skill, formatter hook, setup command, style rule, build fixer), or generate production-ready plugin infrastructure. Discovers existing components to prevent conflicts and creates cross-linked documentation, agents, hooks, and commands following established patterns. Do NOT copy blindly — replace all language-specific content with researched domain knowledge from Step 5.

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
description: <Ecosystem> project structure, tooling, and idiomatic patterns. Use when setting up a new <ecosystem> project, writing or reviewing <ecosystem> code, configuring the build/test toolchain, or asking about <ecosystem> best practices. Consult before starting any non-trivial <ecosystem> work.
user-invocable: false
---
```

**Structure** — follow the progressive disclosure pattern:
- `SKILL.md`: lean index under 300 lines — "When to Activate", one section per topic with 2-3 bullet points (no code blocks), pointer to `references/<section>.md`
- `references/` directory: one file per major topic with full code examples

**Reference files to create** (`references/<section>.md`):
- `project-structure.md` — Directory layout, file naming conventions
- `package-management.md` — Install, update, lock commands
- `build-and-test.md` — Build, test, coverage commands
- `tooling.md` — Formatter, linter, security scanner configuration
- `idiomatic-patterns.md` — Error handling, naming, concurrency, etc.
- `testing-patterns.md` — Test frameworks, mocking, assertion libraries
- `common-pitfalls.md` — Anti-patterns and gotchas

**Content sections in SKILL.md** (bullet points only, no code — code goes in references/):
- When to Activate
- Project Structure (→ references/project-structure.md)
- Package Management (→ references/package-management.md)
- Build & Test (→ references/build-and-test.md)
- Tooling (→ references/tooling.md)
- Idiomatic Patterns (→ references/idiomatic-patterns.md)
- Testing (→ references/testing-patterns.md)
- Common Pitfalls (→ references/common-pitfalls.md)
- Reference Files table

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

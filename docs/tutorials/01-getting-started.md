# Tutorial 1: Getting Started

**Duration**: 15 minutes
**Prerequisites**: Node.js 18+, Claude Code CLI installed
**Learning Goals**: Install plugin, understand basic concepts, run first commands

---

## Step 1: Installation (5 minutes)

### Option A: Plugin Marketplace (Recommended)

```bash
# 1. Add the marketplace
/plugin marketplace add doublefx/magic-claude

# 2. Install the plugin
/plugin install magic-claude@magic-claude

# 3. Install plugin rules (NOT auto-loaded from plugins)
/setup-rules --install

# 4. Verify installation
# You should see no errors in the output
```

> **Important:** Claude Code does not auto-load rules from plugins. After installing, run `/setup-rules --install` (or `/setup` which includes it) to copy rules to `~/.claude/rules/`.

### Option B: Manual Installation

```bash
# 1. Clone the repository
git clone https://github.com/doublefx/magic-claude.git
cd magic-claude

# 2. Copy components
cp plugin/agents/*.md ~/.claude/agents/
cp plugin/commands/*.md ~/.claude/commands/
cp -r plugin/skills/* ~/.claude/skills/
cp plugin/rules/*.md ~/.claude/rules/

# 3. Add hooks to settings.json
# Copy hooks from plugin/hooks/hooks.json to ~/.claude/settings.json
```

Or add the plugin directly to your `~/.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "magic-claude": {
      "source": {
        "source": "github",
        "repo": "doublefx/magic-claude"
      }
    }
  },
  "enabledPlugins": {
    "magic-claude@magic-claude": true
  }
}
```

---

## Step 2: Verify Installation (2 minutes)

Start a new Claude Code session:

```bash
# Start Claude Code in a project directory
cd /path/to/your/project
claude
```

**Expected Output**:
```
[SessionStart] Loading session context...
[SessionStart] Project types: nodejs  # (or python, maven, etc.)
[SessionStart] Session ready
```

**Verify Commands**:
```bash
# Try a command
/plan

# You should see the planner agent activate
```

---

## Step 3: Explore Available Agents (3 minutes)

### List All Agents

In Claude Code, ask:
```
"What agents are available?"
```

You should see all 30 agents:
- Planning: planner, discoverer, plan-critic, architect
- TDD: ts-tdd-guide, jvm-tdd-guide, python-tdd-guide
- Review: code-reviewer, java-reviewer, kotlin-reviewer, groovy-reviewer, python-reviewer
- Security: ts-security-reviewer, jvm-security-reviewer, python-security-reviewer
- Build resolvers: ts-build-resolver, jvm-build-resolver, python-build-resolver
- E2E: ts-e2e-runner, jvm-e2e-runner, python-e2e-runner
- Refactoring: ts-refactor-cleaner, jvm-refactor-cleaner, python-refactor-cleaner
- Build tools: maven-expert, gradle-expert
- CI/CD: ci-cd-architect
- Other: doc-updater, setup-agent, git-sync

### Try an Agent

```bash
# Plan a simple feature
/planner "Add a health check endpoint"

# Expected output: Task breakdown with priorities
```

---

## Step 4: Explore Available Skills (2 minutes)

Skills provide domain knowledge and workflow automation. Key skills include:

- **craft/** - Default quality pipeline for ALL code changes (LITE and FULL modes)
- **using-magic-claude/** - Meta-skill injected on every session (disposition, governance)
- **tdd-workflow/** - Multi-ecosystem TDD methodology
- **coding-standards/** - Multi-ecosystem coding standards
- **backend-patterns/** - Multi-ecosystem backend patterns
- **frontend-patterns/** - React, Next.js patterns
- **security-review/** - Multi-ecosystem security checklist
- **systematic-debugging/** - 4-phase root-cause investigation
- **continuous-learning/** - Auto-extract patterns from sessions
- And 20 more (29 total)

### Use a Skill

```bash
# Skills are invoked proactively by Claude when context suggests
# For example, craft activates automatically for code changes

# Or invoke explicitly
"Apply python-patterns skill to improve the user endpoint"
```

---

## Step 5: Test Auto-Formatting (3 minutes)

The plugin automatically formats files when you edit them.

### For Python Projects

```bash
# 1. Install Ruff (optional, but recommended)
pip install ruff

# 2. Edit a Python file
echo 'def foo( x,y ):
    return x+y' > test.py

# 3. Edit with Claude
# Ask: "Edit test.py to add a docstring"

# 4. Check the file - it should be auto-formatted:
cat test.py

# Expected:
# def foo(x, y):
#     """Add two numbers."""
#     return x + y
```

### For Node.js Projects

```bash
# 1. Install Prettier (if not already)
npm install -D prettier

# 2. Edit a TypeScript file
echo 'function foo(x,y){return x+y}' > test.ts

# 3. Edit with Claude
# The file will be auto-formatted

# 4. Check:
cat test.ts

# Expected:
# function foo(x, y) {
#   return x + y;
# }
```

---

## Understanding Key Concepts

### 1. Agents

Agents are specialized subagents for specific tasks:
- **Delegated execution**: Claude spawns an agent to handle a subtask
- **Focused expertise**: Agents focus on one domain (e.g., TDD, security, build fixes)
- **Full tool access**: Agents have access to all tools (no restrictions)

**Example**:
```
You: "Plan a new feature"
Claude: [Spawns planner agent]
Agent: [Creates task breakdown]
Claude: [Returns to main conversation with results]
```

### 2. Skills

Skills are knowledge bases that Claude can reference:
- **Workflow definitions**: TDD process, security checklist
- **Domain knowledge**: Python patterns, Kotlin idioms
- **Best practices**: API design, CI/CD patterns

### 3. Hooks

Hooks run automatically on tool events:
- **Auto-formatting**: Runs formatters when you edit files
- **Security scanning**: Runs Semgrep/SpotBugs on save
- **Build advice**: Suggests better Maven/Gradle commands

### 4. Commands

Commands are shortcuts to trigger agents or workflows:
- `/craft` - Quality pipeline (TDD, verify, review, simplify)
- `/plan` - Plan a feature
- `/tdd` - TDD workflow (craft LITE mode)
- `/code-review` - Review code (dispatches to language-specific reviewers)
- `/ci-cd` - Generate CI/CD pipeline
- `/status` - Show plugin installation status and inventory

### 5. Rules

Rules are always-follow guidelines:
- Security (no hardcoded secrets)
- Coding style (immutability, file limits)
- Testing (80%+ coverage)
- Git workflow (commit format)

---

## Common First-Time Issues

### Issue 1: Commands Not Found

**Problem**: `/code-review` command not recognized

**Solution**:
```bash
# Check if commands are installed
ls ~/.claude/commands/code-review.md

# If missing, reinstall
/plugin update magic-claude@magic-claude
```

### Issue 2: Hooks Not Running

**Problem**: No auto-formatting happening

**Solution**:
```bash
# 1. Check hooks.json configured
cat ~/.claude/settings.json | grep hooks

# 2. Verify hook scripts exist
ls plugin/scripts/hooks/smart-formatter.cjs

# 3. Install formatters
pip install ruff  # Python
npm install -D prettier  # Node.js
brew install google-java-format  # Java
```

### Issue 3: Project Type Not Detected

**Problem**: "[SessionStart] Project types: " (empty)

**Solution**:
```bash
# Check for manifest files
ls package.json    # Node.js
ls pyproject.toml  # Python
ls pom.xml         # Maven
ls build.gradle.kts  # Gradle

# If manifest exists but not detected, clear cache
rm .claude/magic-claude.project-type.json

# Restart session
```

---

## Next Steps

Now that you're set up:

1. **Choose Your Path**:
   - Python developer? → [02-python-development.md](02-python-development.md)
   - Java/Kotlin developer? → [03-java-development.md](03-java-development.md)
   - Need CI/CD? → [04-cicd-generation.md](04-cicd-generation.md)

2. **Read Documentation**:
   - [FEATURES.md](../FEATURES.md) - All features explained
   - [AGENT-CATALOG.md](../AGENT-CATALOG.md) - All agents and skills
   - [PERFORMANCE.md](../PERFORMANCE.md) - Performance tips

3. **Experiment**:
   - Try different agents
   - Generate a CI/CD pipeline
   - Review some code

---

## Quick Reference Card

```
# Quality Pipeline
/craft             - Full quality pipeline (TDD, verify, review, simplify)
/tdd               - TDD workflow (craft LITE mode)
/eval              - Eval-driven development with quality pipeline

# Core Commands
/plan              - Plan a feature
/code-review       - Review code quality (dispatches to language-specific reviewers)
/build-fix         - Fix build errors

# CI/CD
/ci-cd <platform> <language>  - Generate CI/CD pipeline

# Setup & Diagnostics
/setup             - Complete automated setup
/setup-pm          - Configure package manager
/status            - Show plugin installation status and inventory
```

---

**Congratulations!** You've completed the getting started tutorial.

Choose your next tutorial based on your development focus.

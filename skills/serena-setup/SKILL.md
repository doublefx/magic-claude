---
description: Use when setting up Serena MCP for a new project or reconfiguring an existing Serena installation.
context: fork
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, TaskCreate, TaskUpdate, TaskList
---

# Serena Integration Setup Workflow

This skill provides the complete workflow for Serena MCP integration. Invoke via `magic-claude:serena-setup` or when called from `magic-claude:setup`.

## When to Activate

- First time setting up Serena in a project
- After `magic-claude:setup` command (handles Serena portion)
- Re-configuring Serena integration

## Prerequisites

- Serena MCP plugin must be installed (`/plugin install serena`)
- Project should be a git repository (for git hooks)

## MCP Tools Available

You have access to Serena MCP tools directly:
- `mcp__plugin_serena_serena__activate_project` - Activate project
- `mcp__plugin_serena_serena__get_current_config` - Get Serena config

## Complete Workflow

**You MUST complete ALL 8 steps.**

Steps overview:
1. Welcome & Environment Check
2. Check Serena Installation
3. Auto-Detect Languages
4. Activate Project in Serena
5. **Configure Project Settings** - Update project.yml (languages, ignored_paths)
6. **Install Git Hooks** - Ask user, then install if yes
7. Verify Configuration
8. Return Setup Summary

---

### Step 1: Welcome & Environment Check

**Display**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Serena Integration Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Setting up Serena integration for this project.
```

### Step 2: Check Serena Installation

```
Check: SERENA_INSTALLED environment variable
Or call: mcp__plugin_serena_serena__get_current_config
```

**If not installed**:
```
Serena MCP plugin not found.

To install:
  /plugin install serena

After installing, run magic-claude:serena-setup again.
```

### Step 3: Auto-Detect Languages

**Scan project for**:
- `package.json` → javascript/typescript
- `tsconfig.json` → typescript
- `requirements.txt`, `pyproject.toml` → python
- `pom.xml`, `build.gradle` → java
- `Cargo.toml` → rust
- `go.mod` → go
- `*.kt`, `*.kts` → kotlin

**For monorepos with multiple languages**:
```
Detected languages: typescript, python, java

TIP: For polyglot projects, consider JetBrains plugin ($5/mo or $50/yr)
   - First-class multi-language support
   - External library indexing
   - No manual language server setup
```

### Step 4: Activate Project in Serena

```
Use Serena MCP: activate_project(project_name)
```

**Cache activation in CLAUDE_ENV_FILE**:
```bash
// Write to CLAUDE_ENV_FILE:
export SERENA_PROJECT_ACTIVATED="true"
export SERENA_PROJECT_PATH="${PROJECT_PATH}"
export SERENA_PROJECT_NAME="${PROJECT_NAME}"
```

### Step 5: Configure Project Settings

**Update `.serena/project.yml`** with detected settings:

```yaml
# Update languages based on Step 3 detection
languages:
  - typescript
  - python
  # Add all detected languages

# Update ignored_paths for the project
ignored_paths:
  - node_modules
  - dist
  - build
  - .git
  - __pycache__
  - .venv
  - target
  # Add project-specific paths as needed
```

**IMPORTANT**: Do NOT modify the `initial_prompt` field - that is Serena's system prompt and must never be touched.

### Step 6: Install Git Hooks

**YOU MUST ask the user** using AskUserQuestion tool:

```
Question: "Install Serena git hooks for sync reminders?"
Header: "Git Hooks"
Options:
  - "Yes (Recommended)" - Reminds to sync memories after pull/merge/rebase
  - "No" - Skip git hooks installation
```

**If user selects Yes**, add Serena hooks to `.git/hooks/`:

**IMPORTANT: Do NOT overwrite existing hooks. APPEND to them.**

For each hook type (`post-merge`, `post-rebase`, `post-checkout`, `post-rewrite`):

1. **Check if hook already exists**:
   ```bash
   if [ -f .git/hooks/post-merge ]; then
     # Hook exists - append our content
   else
     # Create new hook
   fi
   ```

2. **If hook exists**: Append git-sync reminder to the end
   ```bash
   # Append to existing hook (preserve original functionality)
   cat >> .git/hooks/post-merge << 'HOOK_EOF'

   # --- git-sync reminder (added by magic-claude) ---
   BEFORE=$(git rev-parse ORIG_HEAD 2>/dev/null)
   AFTER=$(git rev-parse HEAD 2>/dev/null)
   COUNT=$(git rev-list --count "${BEFORE}..${AFTER}" 2>/dev/null || echo "?")
   echo "[git-sync] Merged ${COUNT} commit(s). The git-sync agent will analyze impact."
   echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - post-merge before=${BEFORE} after=${AFTER} count=${COUNT}" >> .git/serena-sync-reminder.log
   # --- End git-sync section ---
   HOOK_EOF
   ```

3. **If hook doesn't exist**: Copy template from plugin
   ```bash
   cp "${CLAUDE_PLUGIN_ROOT}/templates/serena/git-hooks/post-merge" .git/hooks/post-merge
   chmod +x .git/hooks/post-merge
   ```

4. Repeat for all hook types: `post-rebase`, `post-checkout`, `post-rewrite`
   - Templates are in `${CLAUDE_PLUGIN_ROOT}/templates/serena/git-hooks/`

**Serena section marker** allows future updates/removal without affecting other hooks

### Step 7: Verify Configuration

**Run checks**:
- [ ] Project activated
- [ ] Languages configured in project.yml
- [ ] Git hooks installed (if requested)

### Step 8: Return Setup Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Serena Setup Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: ${PROJECT_NAME}
Languages: ${LANGUAGES} (configured in project.yml)
JetBrains: ${AVAILABLE/NOT_AVAILABLE}
Git Hooks: ${INSTALLED/SKIPPED}

Next Steps:
1. Check status anytime with magic-claude:serena-status
2. The magic-claude:git-sync agent runs automatically after git operations
```

## Idempotency

This setup is **safe to re-run**:
- Checks existing state before modifying
- Skips already-completed steps
- Updates project.yml languages/ignored_paths (additive, won't remove existing)

## Troubleshooting

**Serena not found**:
```
Run: /plugin install serena
```

**Activation fails**:
```
Check .serena/project.yml exists and is valid YAML
```

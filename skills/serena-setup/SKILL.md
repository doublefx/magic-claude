---
description: Complete Serena setup workflow for new projects. Checks installation, activates project, configures languages, installs git hooks, and verifies configuration.
context: fork
allowed-tools: Read, Write, Edit, Bash, Bash(mcp-cli *), Grep, Glob, AskUserQuestion, TaskCreate, TaskUpdate, TaskList
---

# Serena Integration Setup Workflow

This skill provides the complete workflow for Serena MCP integration. Invoke via `/serena-setup` or when called from `/setup`.

## When This Workflow Applies

- First time setting up Serena in a project
- After `/setup` command (handles Serena portion)
- Re-configuring Serena integration

## Prerequisites

- Serena MCP plugin must be installed (`/plugin install serena`)
- Project should be a git repository (for git hooks)

## MCP Tools Available

You have access to Serena MCP tools via `mcp-cli`:
- `plugin_serena_serena/activate_project` - Activate project
- `plugin_serena_serena/get_current_config` - Get Serena config

**Always check schema before calling:**
```bash
mcp-cli info plugin_serena_serena/<tool_name>
mcp-cli call plugin_serena_serena/<tool_name> '<json>'
```

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
Or use: mcp-cli info plugin_serena_serena/get_current_config
```

**If not installed**:
```
Serena MCP plugin not found.

To install:
  /plugin install serena

After installing, run /serena-setup again.
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

2. **If hook exists**: Append Serena reminder to the end
   ```bash
   # Append to existing hook (preserve original functionality)
   cat >> .git/hooks/post-merge << 'EOF'

   # --- Serena sync reminder (added by magic-claude) ---
   echo "[Serena] External changes detected. Run /git-sync to update memories."
   echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - post-merge" >> .git/serena-sync-reminder.log
   # --- End Serena section ---
   EOF
   ```

3. **If hook doesn't exist**: Create new hook with shebang
   ```bash
   cat > .git/hooks/post-merge << 'EOF'
   #!/bin/bash
   # Serena sync reminder (added by magic-claude)
   echo "[Serena] External changes detected. Run /git-sync to update memories."
   echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - post-merge" >> .git/serena-sync-reminder.log
   EOF
   chmod +x .git/hooks/post-merge
   ```

4. Repeat for all hook types: `post-rebase`, `post-checkout`, `post-rewrite`

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
1. Check status anytime with /serena-status
2. Sync after git operations: /git-sync
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

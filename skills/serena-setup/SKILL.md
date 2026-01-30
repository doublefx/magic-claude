---
description: Complete Serena setup workflow for new projects. Checks installation, activates project, runs onboarding, installs git hooks, and configures CLAUDE.md for memory-first workflow.
context: fork
allowed-tools: Read, Write, Edit, Bash, Bash(mcp-cli *), Grep, Glob, AskUserQuestion, TaskCreate, TaskUpdate, TaskList
---

# Serena Integration Setup Workflow

This skill provides the complete workflow for Serena MCP integration. Invoke via `/serena-setup` or when called from `/setup`.

## When This Workflow Applies

- First time setting up Serena in a project
- After `/setup` command (handles Serena portion)
- Re-configuring Serena integration
- Migrating existing CLAUDE.md to Serena memories

## Prerequisites

- Serena MCP plugin must be installed (`/plugin install serena`)
- Project should be a git repository (for git hooks)

## MCP Tools Available

You have access to Serena MCP tools via `mcp-cli`:
- `plugin_serena_serena/activate_project` - Activate project
- `plugin_serena_serena/onboarding` - Run onboarding
- `plugin_serena_serena/check_onboarding_performed` - Check if onboarded
- `plugin_serena_serena/write_memory` - Create memories
- `plugin_serena_serena/read_memory` - Read memories
- `plugin_serena_serena/list_memories` - List all memories
- `plugin_serena_serena/get_current_config` - Get Serena config

**Always check schema before calling:**
```bash
mcp-cli info plugin_serena_serena/<tool_name>
mcp-cli call plugin_serena_serena/<tool_name> '<json>'
```

## Complete Workflow

**⚠️ CRITICAL: You MUST complete ALL 11 steps. Do NOT stop after onboarding.**

Steps overview:
1. Welcome & Environment Check
2. Check Serena Installation
3. Auto-Detect Languages
4. Activate Project in Serena
5. Run Onboarding ← Call onboarding(), then create memories from ALL docs
6. **Configure Project Settings** ← Update project.yml (languages, ignored_paths)
7. **Update CLAUDE.md** ← Add Serena workflow section
8. **Install Git Hooks** ← Ask user, then install if yes
9. Verify Configuration
10. **Update Setup Status** ← Mark complete in .claude/everything-claude-code.setup-status.json
11. Return Setup Summary

---

### Step 1: Welcome & Environment Check

**Display**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Serena Integration Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Setting up memory-first workflow for this project.
```

### Step 2: Check Serena Installation

```
Check: SERENA_INSTALLED environment variable
Or use: mcp-cli info plugin_serena_serena/get_current_config
```

**If not installed**:
```
⚠️  Serena MCP plugin not found.

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

💡 TIP: For polyglot projects, consider JetBrains plugin ($5/mo or $50/yr)
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

### Step 5: Run Onboarding

**Check if already onboarded**:
```
Use Serena MCP: check_onboarding_performed()
```

**If not onboarded**, call onboarding and follow its instructions:
```
Use Serena MCP: onboarding()
```

The `onboarding()` function returns **instructions for creating initial memories**. You MUST follow these instructions.

**Scan for ALL documentation sources using Glob** to create comprehensive memories:

1. **CLAUDE files** (project instructions - highest priority):
   ```
   Glob: **/CLAUDE*.md
   ```

2. **README files** (project overviews):
   ```
   Glob: **/README*.md
   ```

3. **Documentation directories**:
   ```
   Glob: **/*.md
   ```

4. **Other important docs**:
   ```
   Glob: CONTRIBUTING.md, ARCHITECTURE.md, DESIGN.md, CHANGELOG.md
   ```

**Priority order for memory creation:**
1. `**/CLAUDE*.md` - Project-specific instructions (highest priority)
2. `**/README*.md` - Project overviews and setup
3. `CONTRIBUTING.md` - Contribution guidelines
4. `ARCHITECTURE.md`, `DESIGN.md` - Architecture decisions
5. `**/*.md` - Additional documentation

**⚠️ CRITICAL: Be THOROUGH. CLAUDE.md will be minimized in Step 7, so ALL valuable information must be captured as memories NOW.**

**Create memories using `write_memory()` for EACH distinct topic:**

Read each documentation file and extract into separate memories:
- `project_overview_guide` - Project purpose, goals, what it does
- `architecture_decisions_guide` - System design, patterns, structure
- `development_workflow_guide` - How to develop, branch strategy, PR process
- `coding_standards_guide` - Code style, conventions, linting rules
- `testing_requirements_guide` - Test strategy, coverage requirements, how to run tests
- `setup_instructions_guide` - How to install, configure, run the project
- `api_documentation_reference` - API endpoints, schemas, examples
- `domain_knowledge_guide` - Business logic, domain concepts

**Use descriptive memory names with valid suffixes** (_guide, _reference, _context, _decisions, etc.)

**Do NOT skip any significant content** - if it's in CLAUDE.md or other docs, it needs to be in a memory.

**→ CONTINUE to Step 6** (do not stop here)

### Step 6: Configure Project Settings

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

**→ CONTINUE to Step 7** (do not stop here)

### Step 7: Migrate and Minimize CLAUDE.md

**⚠️ CRITICAL: The goal is to DELETE the existing CLAUDE.md and replace it with a MINIMAL version. All content should already be in Serena memories from Step 5.**

**7a. Backup original CLAUDE.md:**
```bash
cp CLAUDE.md CLAUDE.md.backup.$(date +%Y%m%d_%H%M%S)
```

**7b. DELETE the existing CLAUDE.md:**
```bash
rm CLAUDE.md
```

**7c. Create NEW minimal CLAUDE.md:**

Use the Write tool to create a NEW CLAUDE.md with ONLY this content (customize project name and description):

```markdown
# [Project Name]

[One-sentence project description - what it does, main tech stack]

## Serena Memory-First Workflow

This project uses **Serena** for persistent memory across sessions. **All project details are stored in Serena memories.**

### Before Code Exploration
- Run `/before-exploring` to check existing memories
- Skip exploration if memories provide sufficient context

### After Code Exploration
- Run `/after-exploring` to document findings
- Store discoveries as Serena memories for future sessions

### Memory Management
- Check status: `/serena-status`
- Sync after git operations: `/git-sync`
- List memories: Use Serena `list_memories` tool
- Read a memory: Use Serena `read_memory` tool with memory name

---
*Detailed documentation migrated to Serena memories.*
```

**DO NOT include in the new CLAUDE.md:**
- ❌ Tech stack details
- ❌ Architecture information
- ❌ Coding standards
- ❌ Development workflows
- ❌ Testing requirements
- ❌ API documentation
- ❌ Any detailed content

**All of the above should be in Serena memories from Step 5.**

**Why DELETE and recreate?**
- Editing often leaves remnants of old content
- Fresh file ensures truly minimal CLAUDE.md
- Forces Claude to read Serena memories at session start
- Serena memories become the single source of truth

**→ CONTINUE to Step 8** (do not stop here - must ask about git hooks)

### Step 8: Install Git Hooks

**YOU MUST ask the user** using AskUserQuestion tool:

```
Question: "Install Serena git hooks for sync reminders?"
Header: "Git Hooks"
Options:
  - "Yes (Recommended)" - Reminds to sync memories after pull/merge/rebase
  - "No" - Skip git hooks installation
```

**If user selects Yes**, add Serena hooks to `.git/hooks/`:

**⚠️ IMPORTANT: Do NOT overwrite existing hooks. APPEND to them.**

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

   # --- Serena sync reminder (added by everything-claude-code) ---
   echo "[Serena] External changes detected. Run /git-sync to update memories."
   echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - post-merge" >> .git/serena-sync-reminder.log
   # --- End Serena section ---
   EOF
   ```

3. **If hook doesn't exist**: Create new hook with shebang
   ```bash
   cat > .git/hooks/post-merge << 'EOF'
   #!/bin/bash
   # Serena sync reminder (added by everything-claude-code)
   echo "[Serena] External changes detected. Run /git-sync to update memories."
   echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') - post-merge" >> .git/serena-sync-reminder.log
   EOF
   chmod +x .git/hooks/post-merge
   ```

4. Repeat for all hook types: `post-rebase`, `post-checkout`, `post-rewrite`

**Serena section marker** allows future updates/removal without affecting other hooks

**→ CONTINUE to Step 9** (do not stop here)

### Step 9: Verify Configuration

**Run checks**:
- [ ] Project activated
- [ ] Onboarding complete
- [ ] Languages configured in project.yml
- [ ] CLAUDE.md updated with Serena workflow
- [ ] Git hooks installed (if requested)

**→ CONTINUE to Step 10** (do not stop here)

### Step 10: Update Setup Status

**Update `.claude/everything-claude-code.setup-status.json`** to mark Serena setup complete:

```javascript
// Read existing everything-claude-code.setup-status.json
const statusFile = '.claude/everything-claude-code.setup-status.json';
const status = JSON.parse(fs.readFileSync(statusFile));

// Update Serena fields
status.serena_setup_complete = true;
status.serena_setup_needed = false;
status.serena_completed_at = new Date().toISOString();
status.serena_memories_created = ${COUNT}; // Number of memories created
status.serena_git_hooks_installed = ${true/false};

// Write back
fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
```

This ensures future sessions know Serena setup is complete.

**→ CONTINUE to Step 11** (must show summary to user)

### Step 11: Return Setup Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Serena Setup Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: ${PROJECT_NAME}
Languages: ${LANGUAGES} (configured in project.yml)
JetBrains: ${AVAILABLE/NOT_AVAILABLE}
Git Hooks: ${INSTALLED/SKIPPED}
Memories: ${COUNT} initial memories created
CLAUDE.md: Updated with Serena workflow

Next Steps:
1. Use /before-exploring before any code exploration
2. Document findings with /after-exploring
3. Check status anytime with /serena-status
```

## Idempotency

This setup is **safe to re-run**:
- Checks existing state before modifying
- Skips already-completed steps
- Won't duplicate memories or hooks
- Updates project.yml languages/ignored_paths (additive, won't remove existing)
- Updates CLAUDE.md (adds Serena section if not present)

## Troubleshooting

**Serena not found**:
```
Run: /plugin install serena
```

**Activation fails**:
```
Check .serena/project.yml exists and is valid YAML
```

**Onboarding fails**:
```
May need to create .serena/ directory first
Ensure CLAUDE.md exists for initial import
```

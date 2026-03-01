---
name: using-git-worktrees
description: Create isolated git worktrees for feature work. Provides filesystem isolation for parallel development, safe experimentation, and clean branch management. Works standalone or with Agent Teams.
user-invocable: false
context: fork
---

# Using Git Worktrees

Git worktrees create isolated workspaces sharing the same repository, enabling work on multiple branches simultaneously without switching or risking file conflicts.

## When to Activate

- Before implementing a feature that needs isolation from the current workspace
- When the approved plan specifies `feature-branch-merge` or `feature-branch-pr` delivery strategy
- When using Agent Teams with file ownership separation
- When experimenting with an approach that might be discarded
- When the user explicitly requests worktree-based isolation

## When NOT to Activate

- Simple changes on the current branch (`current-branch` delivery strategy)
- Single-file edits, bug fixes, documentation
- When the user says they'll handle branching themselves (`user-managed`)

## Directory Selection

Follow this priority order:

### 1. Check Existing Directories

```bash
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

If found, use that directory. If both exist, `.worktrees/` wins.

### 2. Check CLAUDE.md

Look for a documented worktree directory preference:

```bash
grep -i "worktree" CLAUDE.md 2>/dev/null
```

If a preference is specified, use it without asking.

### 3. Ask User

If no directory exists and no documented preference:

```
No worktree directory found. Where should I create worktrees?

(a) .worktrees/ — project-local, hidden (recommended)
(b) ~/worktrees/<project-name>/ — global location outside project
```

## Safety Verification

### For Project-Local Directories (.worktrees/ or worktrees/)

**MUST verify the directory is git-ignored before creating a worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null
```

**If NOT ignored** — fix it immediately:
1. Add `.worktrees/` (or `worktrees/`) to `.gitignore`
2. Commit the change: `git add .gitignore && git commit -m "chore: ignore worktree directory"`
3. Proceed with worktree creation

This prevents accidentally committing worktree contents to the repository.

### For Global Directories (~/worktrees/)

No .gitignore verification needed — outside the project entirely.

## Creation Steps

### 1. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Create Feature Branch + Worktree

```bash
# Project-local
git worktree add .worktrees/<branch-name> -b <branch-name>

# Global
git worktree add ~/worktrees/$project/<branch-name> -b <branch-name>
```

### 3. Install Dependencies (Ecosystem-Aware)

Auto-detect and run the appropriate setup:

| Indicator | Command |
|-----------|---------|
| `package.json` | `npm install` / `pnpm install` / `yarn install` (detect from lock file) |
| `pom.xml` | `./mvnw dependency:resolve` (or `mvn`) |
| `build.gradle*` | `./gradlew dependencies` (or `gradle`) |
| `pyproject.toml` | `pip install -e .` / `poetry install` / `uv sync` |
| `Cargo.toml` | `cargo build` |
| `requirements.txt` | `pip install -r requirements.txt` |

Use the project's detected package manager — don't guess.

### 4. Baseline Test Verification

Run tests to confirm the worktree starts clean:

```bash
# Use ecosystem-appropriate command
npm test / ./gradlew test / pytest / cargo test
```

- **Tests pass** — Report ready, proceed with work
- **Tests fail** — Report failures, ask whether to proceed or investigate

### 5. Report Location

```
Worktree ready at <full-path>
Branch: <branch-name>
Baseline: <N> tests passing, <M> failures
Ready to implement <feature-name>
```

## Cleanup

When work is complete, clean up the worktree:

```bash
# Remove worktree (after merging or discarding)
git worktree remove .worktrees/<branch-name>

# If the branch was merged or discarded
git branch -d <branch-name>    # safe delete (merged)
git branch -D <branch-name>    # force delete (discarded)

# List remaining worktrees
git worktree list
```

The `magic-claude:finishing-feature` skill handles structured cleanup with user confirmation.

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check CLAUDE.md -> Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail at baseline | Report failures + ask |
| No lock file / build file | Skip dependency install |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping ignore verification | Always `git check-ignore` before creating project-local worktree |
| Assuming directory location | Follow priority: existing > CLAUDE.md > ask |
| Proceeding with failing baseline | Report failures, get explicit permission |
| Hardcoding package manager | Detect from lock file or project config |
| Forgetting to clean up | Use `finishing-feature` skill or manual `git worktree remove` |

## Integration

**Called by:**
- `magic-claude:proactive-orchestration` Phase 4.7 (DELIVER) when delivery strategy is `feature-branch-merge` or `feature-branch-pr`
- `magic-claude:agent-teams` when agents need file ownership isolation
- Any workflow requiring an isolated workspace

**Pairs with:**
- `magic-claude:finishing-feature` — structured cleanup after work completes

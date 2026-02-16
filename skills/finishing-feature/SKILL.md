---
name: finishing-feature
description: Structured branch cleanup after feature work completes. Verifies tests, presents delivery options, executes the chosen workflow, and cleans up worktrees.
user-invocable: false
context: fork
---

# Finishing a Feature Branch

Guides the completion of feature work with test verification, structured delivery options, and cleanup.

## When to Activate

- After orchestration Phase 4 (REVIEW) completes with SHIP verdict
- When a feature branch is ready to be delivered
- When the user explicitly asks to finish/merge/close a feature branch
- After Agent Teams work completes on a feature branch

## Process

### Step 1: Verify Tests Pass

Before any delivery action, confirm the full test suite passes on the feature branch:

```bash
# Ecosystem-appropriate command
npm test / ./gradlew test / pytest / cargo test
```

**If tests fail:** STOP. Report failures and ask the user to fix them before proceeding. Do not offer delivery options with failing tests.

### Step 2: Determine Base Branch

Detect the base branch to merge into:

```bash
# Check for common base branches
git rev-parse --verify main 2>/dev/null && echo "main" || \
git rev-parse --verify master 2>/dev/null && echo "master" || \
git rev-parse --verify develop 2>/dev/null && echo "develop"
```

If ambiguous, ask the user which branch to target.

### Step 3: Present Options

If the approved plan already specifies a delivery strategy, use it directly. Otherwise, present exactly these options:

```
Feature branch ready. How would you like to proceed?

(a) Merge locally — merge into <base-branch>, verify tests, delete feature branch
(b) Push + PR — push branch, create pull request via gh cli
(c) Keep as-is — leave branch for later handling
(d) Discard — permanently delete branch and all changes
```

### Step 4: Execute

#### Option A: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Merge feature branch
git merge <feature-branch> --no-ff -m "feat: <feature-description>"

# Verify tests pass on merged result
npm test / ./gradlew test / pytest

# If tests pass: clean up
git branch -d <feature-branch>

# If tests fail: STOP, report, let user decide
```

**Critical:** Always verify tests on the merged result. Merge conflicts or subtle interactions between base branch changes and the feature can cause failures even when both branches pass independently.

#### Option B: Push + PR

```bash
# Push feature branch
git push -u origin <feature-branch>

# Create PR (use orchestration report as body if available)
gh pr create \
  --title "<feature-title>" \
  --body "$(cat <<'EOF'
## Summary
<summary from orchestration report or commit messages>

## Test Plan
- [ ] All tests passing (<N> tests, <coverage>% coverage)
- [ ] Spec review passed for all tasks
- [ ] Code review: <verdict>

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Report the PR URL to the user.

#### Option C: Keep As-Is

No action needed. Report the branch name and location for future reference:

```
Branch <feature-branch> preserved at <worktree-path or current location>.
To resume later: git checkout <feature-branch>
```

#### Option D: Discard

**Require explicit confirmation** before deleting:

```
Are you sure you want to permanently discard branch <feature-branch>?
This will delete all changes. Type "discard" to confirm.
```

Only proceed if the user types "discard" or equivalent explicit confirmation.

```bash
# If in worktree, switch out first
git checkout <base-branch>

# Force delete the branch
git branch -D <feature-branch>
```

### Step 5: Worktree Cleanup

If the feature branch was in a git worktree (from `using-git-worktrees` skill):

- **Options A and D:** Remove the worktree after branch cleanup
  ```bash
  git worktree remove <worktree-path>
  ```
- **Option B:** Keep the worktree until PR is merged (user may need to make changes)
- **Option C:** Keep the worktree

```bash
# Verify cleanup
git worktree list
```

## Quick Reference

| Option | Tests Required | Worktree Cleanup | Branch Deleted |
|--------|---------------|------------------|----------------|
| Merge locally | Before merge + after merge | Yes | Yes |
| Push + PR | Before push | No (keep for changes) | After PR merge |
| Keep as-is | Before reporting | No | No |
| Discard | No | Yes | Yes (force) |

## Rules

- **Never proceed if tests fail** (except Option D: discard)
- **Always verify tests on the merged result** (Option A) — not just on the feature branch
- **Require explicit "discard" confirmation** before Option D
- **Present exactly 4 options** — don't add extra choices or explanations
- **Use the plan's delivery strategy** if one was recorded — skip the options prompt

## Integration

**Called by:**
- `magic-claude:proactive-orchestration` Phase 4.7 (DELIVER)
- Manual invocation after any feature branch work

**Pairs with:**
- `magic-claude:using-git-worktrees` — worktree creation and management
- `magic-claude:proactive-orchestration` — full pipeline orchestrator

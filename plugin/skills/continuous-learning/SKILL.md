---
name: continuous-learning
description: >
  Use this skill to record facts about this codebase that future sessions will need: required setup steps, hard constraints (always use X, never use Y), behavioral quirks, project-specific conventions not obvious from the code. Trigger when you learn something through trial, error, or user correction that a developer would need on day one. Also triggered by [ContinuousLearning] hook signal. Skip generic programming advice, one-time debugging, or anything clearly in the README.
allowed-tools: Read, Write, Glob
---

# Continuous Learning

This skill extracts reusable patterns from the current session and saves them as learned skills so future sessions don't have to rediscover the same things.

## The Core Question

Before extracting anything, ask: **"If this session ended right now and a fresh Claude started tomorrow, what would it need to know that it wouldn't have by default?"**

That's what belongs in a skill.

## What's Worth Saving

**Save these:**

| Pattern type | Example |
|---|---|
| **Error resolution** | Build fails with obscure error → non-obvious fix (e.g., missing `"type": "module"` in `package.json`) |
| **User corrections** | User corrected your assumption about the codebase → reveals a convention or constraint |
| **Platform/tool quirk** | WSL doesn't propagate env vars to hooks → need a sentinel file |
| **Debugging technique** | Found a systematic way to isolate test pollution |
| **Project convention** | This project always uses snake_case for filenames, or always runs `db:seed` before tests |
| **Non-obvious integration** | Two tools that interact in a surprising way |

**Don't save these:**

- Simple typos or one-time edits
- Generic best practices already covered by existing rules
- Things Claude would know without any session history
- Incomplete solutions that weren't validated
- Anything the user explicitly said was temporary

## Scope Decision

**Project-level** (`.claude/skills/<name>/SKILL.md`): patterns specific to this codebase, this team's conventions, this environment.

**User-level** (`~/.claude/skills/<name>/SKILL.md`): patterns that transfer across projects — debugging techniques, tool quirks, general workarounds.

When in doubt, use project-level. It's easier to promote later than to clean up polluted user-level skills.

## Extraction Process

### 1. Scan the session

Look for:
- Moments where multiple attempts failed before something worked
- User corrections ("no, actually...", "remember that...", "we always...")
- Error messages and their resolutions
- Workarounds introduced mid-session
- Any explicit "remember this" or "save this" from the user

### 2. Filter ruthlessly

For each candidate, apply the test: **Would a 80th-percentile developer already know this?** If yes, skip it. The value is in the non-obvious.

Also check: **Is this already in an existing skill or rule?** Run a quick search before duplicating.

### 3. Draft the skill

Use this structure:

```markdown
---
name: <kebab-case-name>
description: <one sentence: what it is + when to use it>
---

# <Title>

## Context
<What problem this solves / why it's non-obvious>

## Pattern / Solution
<The actual thing to know — specific, actionable>

## Example
<Concrete example from the session if helpful>

## When This Applies
<Conditions under which this pattern is relevant>
```

Keep it under 50 lines. If it needs more, it's probably two skills.

### 4. Confirm with the user

Before writing anything, present the proposed skills:

> "I found 2 patterns worth preserving from this session:
> 1. **wsl-hook-env-vars** — WSL doesn't propagate env vars to hooks; use sentinel files instead
> 2. **always-use-pnpm** — This project uses pnpm, not npm
>
> Save both? Any changes?"

Then write the approved skills.

### 5. Write the skill files

Create the directory and SKILL.md at the appropriate location. Use `kebab-case` names. Keep names specific enough to be searchable — `wsl-hook-debugging` beats `debugging`.

## Naming Conventions

- Specific over generic: `wsl-hook-env-vars` not `env-vars`
- Problem-oriented: `fix-esm-cjs-mismatch` not `module-types`
- Action-oriented when appropriate: `always-seed-db-before-tests`

## What Good Output Looks Like

A learned skill should be immediately useful on first read. If someone reads it and thinks "I would have figured that out anyway", it's not worth saving. If they think "glad I didn't have to hit that wall again", it's a keeper.

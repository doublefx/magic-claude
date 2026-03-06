---
description: Quality pipeline for all code changes — TDD, verify, review, simplify
argument-hint: "[--full|--lite] [task description]"
---

# /craft — Quality Pipeline

Invoke the `magic-claude:craft` skill to run the quality pipeline on code changes.

## Usage

```bash
# Auto-detect mode (LITE for small changes, FULL for multi-file)
/craft "fix the login validation bug"

# Force full pipeline
/craft --full "add JWT authentication"

# Force lite pipeline
/craft --lite "fix typo in error message"
```

## Mode Selection

| Mode | When | Pipeline |
|------|------|----------|
| **LITE** | ≤2 files, ≤20 lines | TDD → VERIFY → REVIEW (single pass) |
| **FULL** | Multi-file, complex | DISCOVER → PLAN ↔ CRITIC → [UI DESIGN] → TDD → VERIFY → REVIEW+HARDEN → SIMPLIFY → DELIVER → REPORT |
| **Auto** (default) | Assessed at start | Craft skill decides based on scope |

## Delegation

Invoke `magic-claude:craft` with the task description and any mode override flags. The skill handles everything from there.

## Related Entry Points

| Command | What it does |
|---------|-------------|
| `/tdd` | Invokes craft in LITE mode (skip planning) |
| `/eval` | Invokes craft with eval define/check phases |
| `/code-review` | Standalone review (NOT part of craft) |
| `/verify` | Standalone verification check |

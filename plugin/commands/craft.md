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

Every invocation starts with **Phase 1.1: Quick Discover** — a lightweight impact scan (~30s) that determines the right mode based on actual fan-out analysis.

| Mode | When | Pipeline |
|------|------|----------|
| **LITE** | Fan-out ≤3 tested call sites, isolated, ≤2 files | QUICK DISCOVER → TDD → VERIFY → REVIEW (single pass) |
| **FULL** | Wider impact, untested callers, cross-module | QUICK DISCOVER → DEEP DISCOVER → PLAN ↔ PLAN CRITIC → [UI DESIGN] → TDD → VERIFY → REVIEW+HARDEN → SIMPLIFY → DELIVER → REPORT |
| **`--full`** | Force full pipeline | Skip Quick Discover gate, run full |
| **`--lite`** | Force lite pipeline | Skip Quick Discover, go straight to TDD |

## Delegation

Invoke `magic-claude:craft` with the task description and any mode override flags. The skill handles everything from there.

## Related Entry Points

| Command | What it does |
|---------|-------------|
| `/tdd` | Invokes craft in LITE mode (skip planning) |
| `/eval` | Invokes craft with eval define/check phases |
| `/code-review` | Standalone review (NOT part of craft) |
| `/verify` | Standalone verification check |

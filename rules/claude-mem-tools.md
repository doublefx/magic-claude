# claude-mem Tool Preference

When claude-mem is installed, **MUST search claude-mem BEFORE** using Explore agents, reading code for architectural understanding, or investigating bugs. A single `search()` call costs ~50-100 tokens per result — skipping it wastes far more tokens re-exploring what past sessions already resolved.

| Task | Instead of | Use |
|------|-----------|-----|
| Past decisions / rationale | Re-reading code + guessing intent | `search(query about decision)` |
| Why something was built a certain way | `Grep` + `Read` through history | `search(query about architecture)` |
| Recurring bug patterns | Investigating from scratch | `search(error or symptom)` |
| Architectural context before changes | `Explore` agent deep dive | `search(component or area)` |
| Timeline around an event | `git log` + manual reconstruction | `timeline(anchor=observation-id)` |
| Full observation details | N/A | `get_observations([ids])` after search |

## 3-Layer Progressive Retrieval

Always start cheap and go deeper only when needed:

1. **search** (~50-100 tokens/result) — Start here. Returns index with IDs, titles, types.
2. **timeline** (moderate) — Use after search to understand chronological context around a result.
3. **get_observations** (expensive) — Full observation content. Only fetch specific IDs you've filtered to.

## When to Skip claude-mem

- Brand-new code with no prior session history
- Current file contents (use Read, Grep, Glob)
- Symbol definitions and references (use Serena tools)
- Code just written in the current session

**Fallback:** If claude-mem returns no results or errors, fall back to codebase exploration. Do not retry more than once per failure type in a session.

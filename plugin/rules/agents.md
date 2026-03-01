<!-- managed by magic-claude plugin -->
# Agent Orchestration

Use agents proactively — no user prompt needed for code reviews, TDD, build fixes, or security audits.

**Skills with full guidance:**
- **`magic-claude:agent-coordination`** — Agent catalog, model tier costs, delegation decisions, parallel vs sequential patterns
- **`magic-claude:agent-teams`** — Experimental multi-instance parallel work (requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`)

**Quick rules:**
- Delegate when the subtask needs 3+ file reads and 5+ commands; do it yourself for smaller work
- Launch independent agents in parallel (single message, multiple Task calls)
- Sequential when outputs feed forward (plan -> implement -> review)
- Don't trust agent reports blindly — verify claims independently

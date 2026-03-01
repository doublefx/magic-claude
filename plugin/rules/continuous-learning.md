# Continuous Learning

## Auto-Learn on Hook Signal

When you see `[ContinuousLearning] ACTION REQUIRED` in hook output, you MUST:

1. Acknowledge the detected patterns to the user
2. Run `magic-claude:learn` to extract and save reusable patterns from the session
3. Present the extracted patterns for user confirmation before saving

This ensures session knowledge is captured before context is lost (compaction or session end).

## Pattern Types

- **error_resolution** — Bug fixes, error diagnosis, root cause analysis
- **user_corrections** — Corrections to Claude's approach or assumptions
- **workarounds** — Platform quirks, known issues, non-obvious solutions
- **debugging_techniques** — Investigation strategies, log analysis, trace patterns
- **architecture_decisions** — Design choices, tradeoffs, structural rationale

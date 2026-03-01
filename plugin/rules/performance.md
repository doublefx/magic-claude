# Performance Optimization

## Model Selection Strategy

**Haiku 4.5** (90% of Sonnet capability, 3x cost savings):
- Lightweight agents with frequent invocation
- Pair programming and code generation
- Worker agents in multi-agent systems

**Sonnet 4.5** (Best coding model):
- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**Opus 4.5** (Deepest reasoning):
- Complex architectural decisions
- Maximum reasoning requirements
- Research and analysis tasks

## Context Window Management

Avoid last 20% of context window for:
- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:
- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Ultrathink + Deep Reasoning

For complex tasks requiring deep reasoning:
1. Use `ultrathink` for enhanced thinking
2. Use **Plan Mode** for pure research/exploration only (for features, use orchestration instead)
3. "Rev the engine" with multiple critique rounds
4. Use split role sub-agents for diverse analysis

## Build Troubleshooting

If build fails:
1. Use `magic-claude:build-fix` command (auto-detects ecosystem)
2. Dispatches to **magic-claude:ts-build-resolver**, **magic-claude:jvm-build-resolver**, or **magic-claude:python-build-resolver**
3. Fix incrementally
4. Verify after each fix

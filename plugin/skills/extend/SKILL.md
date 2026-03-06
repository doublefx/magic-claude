---
name: extend
description: "Expand the magic-claude plugin with new language, framework, or infrastructure support. Invoke when you want to: add a new ecosystem (Go, Rust, Swift, PHP, Ruby, Terraform, Kubernetes...), create individual components (reviewer agent, patterns skill, formatter hook, setup command, style rule, build fixer), or generate production-ready plugin infrastructure. Discovers existing components to prevent conflicts and creates cross-linked documentation, agents, hooks, and commands following established patterns. Do NOT copy blindly — replace all language-specific content with researched domain knowledge from Step 5."
context: fork
agent: general-purpose
---

# Plugin Extension Workflow

## Steps 1–6 (Pre-Generation)

1. **Understand the request** — ecosystem, components requested, target level (user or project)
2. **Discover existing components** — grep for `<ecosystem>` in agents/, skills/, commands/, hooks/ to prevent conflicts
3. **Confirm target prefix** — `~/.claude/` (user-level) or `./.claude/` (project-level)
4. **Select components** — ask if unclear: patterns skill, reviewer agent, build resolver, formatter hook, command, rule, ecosystem module
5. **Research the ecosystem** — use context7 or ddg-search for current toolchain facts (formatter, linter, test framework, package manager). Do NOT use placeholder knowledge.
6. **Confirm plan** — list selected components + target path before generating

## Step 7: Generate Components

See [references/component-templates.md](references/component-templates.md) for the full template for each component type:

| Component | Template section |
|-----------|-----------------|
| Patterns skill (SKILL.md + references/) | 7a |
| Reviewer agent | 7b |
| Build resolver agent | 7c |
| Formatter hook + script | 7d |
| Command | 7e |
| Style rule | 7f |
| Ecosystem module (.cjs) | 7g |

## Steps 8–9: Report & Verify

See [references/verification-reporting.md](references/verification-reporting.md) for:
- Report format (generated files list + cross-links + next steps)
- Verification checklist (tests, skill/agent references, hook scripts, ecosystem registry)

## Reference Files

| File | Contents |
|------|----------|
| [references/component-templates.md](references/component-templates.md) | Full templates for all 7 component types (7a–7g) |
| [references/verification-reporting.md](references/verification-reporting.md) | Report format, verification steps, cross-linking rules, naming conventions |

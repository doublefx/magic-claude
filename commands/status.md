---
description: Show comprehensive plugin installation status and inventory
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/status-report.cjs" $ARGUMENTS
disable-model-invocation: false
---

Display the status report output in a code block, then analyze it and provide actionable guidance.

## Step 1: Display the Report

Show the full script output in a fenced code block exactly as produced.

## Step 2: Assess Required Components

Check the report for gaps that indicate incomplete setup. Flag any that apply:

- **Rules not synced**: If plugin rule count > user rule count, rules haven't been installed to `~/.claude/rules/`. Recommend running `/setup-rules` to sync them.
- **No ecosystem detected**: If ecosystem shows "none", the project type couldn't be determined. Recommend running `/setup-ecosystem` to configure it.
- **No package manager**: If package manager shows "none", detection failed. Recommend running `/setup-pm` to configure one.
- **Missing ecosystem tools**: If the ecosystem section shows tools under "Missing", recommend installing them (e.g., `pnpm` not found for a Node.js project).

## Step 3: Assess Companion Plugins

Cross-reference the **MCP Servers → Plugins** list and the **Optional Integrations** section to determine which companion plugins are installed. For each missing plugin, explain its benefit and provide install instructions. Skip any that are already installed.

### How plugins are installed

There are two sources:
- **Official plugins** (available by default): `/plugin install <name>`
- **Marketplace plugins** (must add the marketplace first): `/plugin marketplace add <owner>/<repo>` then `/plugin install <name>`

### Recommended companion plugins

| Plugin | Source | Key in enabledPlugins | Benefit | Install |
|--------|--------|-----------------------|---------|---------|
| **serena** | Official | `serena@claude-plugins-official` | Semantic code navigation (find symbol, find references, type hierarchy) — much more precise than grep-based search. Especially valuable for large or polyglot codebases. | `/plugin install serena` then `/serena-setup` to configure |
| **context7** | Official | `context7@claude-plugins-official` | Feeds LLMs the latest, version-specific documentation and code examples. Stops hallucinated or outdated API answers by injecting real docs into the model context. | `/plugin install context7` |
| **code-simplifier** | Official | `code-simplifier@claude-plugins-official` | Reviews changed code for reuse opportunities, quality issues, and efficiency improvements, then fixes any issues found. | `/plugin install code-simplifier` |
| **magic-claude-mem** | Marketplace | `magic-claude-mem@magic-claude-mem` | Cross-session memory — past decisions, bug patterns, and architectural context persist across conversations. Eliminates redundant re-exploration. | `/plugin marketplace add doublefx/magic-claude-mem` then `/plugin install magic-claude-mem` |
| **frontend-design** | Official | `frontend-design@claude-plugins-official` | Creates distinctive, production-grade frontend interfaces with high design quality. Valuable for projects with frontend components. | `/plugin install frontend-design` |
For each missing plugin, present it as a bullet with a one-sentence benefit and the install command(s). Only mention plugins that are NOT already in the Plugins list. Check both the **MCP Servers → Plugins** list and **MCP Servers → Manual** list, since some plugins appear as manually configured MCP servers.

### Recommended CLI tools with skills

These are not plugins but globally installed CLI tools that provide Claude Code skills for browser automation.

| Tool | Detection | Benefit | Install |
|------|-----------|---------|---------|
| **playwright-cli** | Check if `playwright-cli` command is available on PATH | Token-efficient browser automation via CLI + SKILLS — navigate pages, fill forms, take screenshots, run E2E tests. More context-efficient than MCP-based browser tools for coding agents. | `npm install -g @playwright/cli@latest` then `playwright-cli install --skills` to install skills into Claude Code. See [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli). |

To check if playwright-cli is installed, look for it in the ecosystem tools or run `which playwright-cli`. If missing, recommend installing it.

## Step 4: Summary

End with a one-line summary:
- If everything looks good: "All components are properly configured. No action needed."
- If there are gaps: "Found N item(s) to address — see recommendations above."

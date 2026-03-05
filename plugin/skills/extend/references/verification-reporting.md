# Verification & Reporting

## Step 8: Report Summary

Display all generated files with their absolute paths:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Plugin Extension Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ecosystem: <ecosystem>
Target: <user|project> (<path>)

Generated Components:
  [skill]     <path>/skills/<ecosystem>-patterns/SKILL.md
  [agent]     <path>/agents/<ecosystem>-reviewer.md
  [agent]     <path>/agents/<ecosystem>-build-resolver.md
  [hook]      <path>/hooks/hooks.json (appended)
  [script]    <path>/scripts/hooks/<ecosystem>-formatter.js
  [command]   <path>/commands/<ecosystem>-review.md
  [rule]      <path>/rules/<ecosystem>-style.md
  [ecosystem] <path>/ecosystems/<ecosystem>.cjs

Cross-Links:
  <ecosystem>-reviewer agent → uses <ecosystem>-patterns skill
  <ecosystem>-review command → delegates to <ecosystem>-reviewer agent
  formatter hook → runs <ecosystem>-formatter.js script

Next Steps:
  1. Review generated files and adjust content as needed
  2. Test: /<ecosystem>-review on a sample file
  3. Verify formatter hook triggers on file edit
```

## Step 9: Verify

1. **Tests** (if in plugin repo): `node tests/run-all.cjs`
2. **Agent skill references**: Grep agent `skills:` fields → verify referenced skill directories exist
3. **Command agent references**: Grep command bodies → verify named agents exist as files
4. **Hook script references**: Grep hook script paths → verify script files exist
5. **File existence**: Verify all generated files are readable
6. **Ecosystem registry** (if ecosystem module generated):
   ```bash
   node -e "const {getRegistry,ECOSYSTEMS} = require('./scripts/lib/ecosystems/index.cjs'); console.log('Registry:', Object.keys(getRegistry())); console.log('Constants:', ECOSYSTEMS)"
   ```

Report results with pass/fail for each check.

## Cross-Linking Rules

| Link | Mechanism |
|------|----------|
| Agent → Skill | `skills:` field in agent frontmatter |
| Command → Agent | Agent name mentioned in command body text |
| Hook → Script | Script path in hook `command` field |
| Skill → nothing | Skills are leaf nodes (no outgoing references) |
| Rule → nothing | Rules are leaf nodes (no outgoing references) |

## Idempotency

This workflow is **safe to re-run**:
- Discovery (Step 2) catches existing components
- Step 3 warns before overwriting, offers skip/rename
- Hook additions check for duplicate matchers before appending
- Generated files can be regenerated without side effects

## Error Handling

- **MCP unavailable** → WebSearch → WebFetch → Claude knowledge (graceful degradation)
- **Test failures after generation** → report but don't delete generated files
- **Invalid target directory** → create it (mkdir -p equivalent)
- **Formatter tool not installed** → generate the hook script anyway with "tool not found" warning
- **Name collision** → ask user: overwrite, rename, or skip

## Component Naming Convention

- Lowercase with hyphens: `go-patterns`, `rust-reviewer`, `swift-build-resolver`
- Ecosystem prefix: `<ecosystem>-<component-type>`
- Files: `<ecosystem>-<type>.md` for agents/commands/rules
- Directories: `<ecosystem>-<type>/SKILL.md` for skills
- Scripts: `<ecosystem>-<purpose>.js` for hook scripts

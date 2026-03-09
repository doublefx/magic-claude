# Rules & Disclosure System Comparison: magic-claude vs carl

## Overview

### magic-claude

magic-claude is a comprehensive Claude Code plugin providing agents, skills, hooks, commands, and rules evolved over 10+ months of production use. Its rules system is **static and always-loaded**: 13 rule files in `plugin/rules/` are installed to `~/.claude/rules/` and injected into every session regardless of context. Behavioral governance is enforced through a layered system of rules (always-on guidelines), skills (proactive workflow definitions invoked by Claude when context suggests), hooks (automated enforcement via tool events), and a meta-skill (`using-magic-claude`) that overrides default behavior on every session start.

### carl (Context Augmentation & Reinforcement Layer)

carl is a dynamic rule injection system that loads rules **only when relevant** based on keyword matching against the user's prompt. It solves context bloat by organizing rules into "domains" (thematic collections like DEVELOPMENT, CONTENT) that activate when trigger keywords appear in conversation. carl uses a single Python hook (`carl-hook.py`) on the `UserPromptSubmit` event to scan each prompt, match keywords from a manifest registry, and inject only the applicable rules as `<carl-rules>` XML blocks via `additionalContext`. Rules that are not relevant to the current prompt are never loaded.

---

## Architecture Comparison

| Dimension | magic-claude | carl |
|-----------|-------------|------|
| **Rule storage** | 13 Markdown files in `plugin/rules/` installed to `~/.claude/rules/` | Key-value pairs in flat files under `.carl/` directories (manifest, global, commands, context, custom domains) |
| **Loading mechanism** | All rules loaded at session start by Claude Code's native rules system (`~/.claude/rules/*.md`) | Dynamic per-prompt injection via `UserPromptSubmit` hook (`carl-hook.py`) scanning keywords |
| **Activation model** | **Always-on** -- every rule file is present in every interaction | **Keyword-triggered** -- domains activate only when RECALL keywords match the user's prompt |
| **Enforcement** | Multi-layer: rules (static), hooks (automated checks on tool events), skills (proactive workflows), meta-skill (disposition override) | Single layer: hook injects rules into `additionalContext`; compliance depends on Claude following `<carl-rules>` blocks |
| **Scope hierarchy** | Plugin rules + user-level `~/.claude/rules/` + project `CLAUDE.md` | Global (`~/.carl/`) + local (`./.carl/`) with local overriding global |
| **Context budget awareness** | `performance.md` rule advises avoiding last 20% of context; no automated adjustment | Built-in context brackets (FRESH/MODERATE/DEPLETED/CRITICAL) that change injection density based on token consumption percentage |
| **Session state** | `session-start.cjs` and `session-end.cjs` hooks persist/restore context; `pre-compact.cjs` saves state before compaction | Per-session JSON files in `.carl/sessions/{uuid}.json` tracking prompt count, activity timestamps, session titles; auto-cleanup of stale sessions |
| **User-facing configuration** | Edit Markdown files; use `/setup-rules` command | Interactive `*carl` star-command; `carl-manager` skill for conversational domain management; AUDIT-CLAUDEMD.md guides migration |
| **Disclosure to user** | Rules visible in `~/.claude/rules/` files; meta-skill announced at session start via hook; skills announce themselves ("Using [skill] for [purpose]") | `<carl-rules>` blocks show loaded domains, matched keywords, active bracket, and available unloaded domains with their recall keywords |
| **Exclusion mechanism** | None -- all rules always present | Two-level: `GLOBAL_EXCLUDE` (skip all domain matching) and per-domain `DOMAIN_EXCLUDE` (skip specific domain when blocking keywords detected) |
| **Implementation language** | Node.js (`.cjs` and `.js` scripts) | Python 3 (single `carl-hook.py`) |
| **Star-commands** | Slash commands (`/tdd`, `/plan`, `/code-review`, etc.) registered via plugin system | `*command` syntax in prompts (`*dev`, `*review`, `*brief`, `*plan`, `*debug`, `*explain`) parsed by the hook |

### Loading Flow Comparison

**magic-claude:**
```
Session Start
  -> Claude Code loads all ~/.claude/rules/*.md (always)
  -> SessionStart hook injects using-magic-claude meta-skill via additionalContext
  -> Meta-skill governs which skills to invoke per-message
  -> PostToolUse/PreToolUse/Stop hooks enforce specific checks (formatting, security, debug statements)
```

**carl:**
```
Each Prompt Submission
  -> UserPromptSubmit hook fires carl-hook.py
  -> Hook parses manifest for domain definitions
  -> Hook scans prompt text for RECALL keywords
  -> Checks GLOBAL_EXCLUDE and per-domain EXCLUDE
  -> Loads ALWAYS_ON domains + keyword-matched domains
  -> Determines context bracket (FRESH/MODERATE/DEPLETED/CRITICAL)
  -> Returns JSON with additionalContext containing <carl-rules> XML block
  -> Claude follows rules in that block (instructed by CARL-BLOCK in CLAUDE.md)
```

---

## Strengths: magic-claude

### 1. Deep enforcement through multiple layers
Rules are not just guidelines -- they are actively enforced. PostToolUse hooks run security scanners (SpotBugs, Semgrep, pip-audit), auto-formatters (ruff, prettier, google-java-format), type checkers (TypeScript tsc, Pyright), and debug statement detectors after every file edit. The Stop hook catches debug statements in modified files. The PreToolUse hook suggests code review before git commits. This is **active enforcement**, not passive guidance.

**Key files:** `plugin/hooks/hooks.json` (lines 74-196 define PostToolUse hooks), `plugin/scripts/hooks/smart-formatter.js`, `plugin/scripts/hooks/java-security.js`, `plugin/scripts/hooks/console-log-detector.cjs`

### 2. Proactive skill invocation with governance
The meta-skill (`plugin/skills/using-magic-claude/SKILL.md`) establishes a decision flowchart: check for applicable skills before every response, invoke `magic-claude:craft` for feature work, search claude-mem before exploration, and never skip verification. Skills run in forked context to avoid polluting the main conversation. This is a behavioral governance layer that carl lacks entirely.

### 3. Multi-ecosystem coverage
Rules and skills cover TypeScript/JavaScript, JVM (Java/Kotlin/Groovy), and Python with ecosystem-specific patterns, security checklists, TDD guides, build resolvers, and code reviewers. Each ecosystem has dedicated agents (e.g., `magic-claude:ts-tdd-guide`, `magic-claude:jvm-security-reviewer`, `magic-claude:python-build-resolver`).

**Key files:** `plugin/rules/coding-style.md`, `plugin/rules/java-style.md`, `plugin/rules/python-style.md`, `plugin/rules/security.md`, `plugin/skills/coding-standards/SKILL.md` (with 11 reference files)

### 4. Verification enforcement
The meta-skill bans vague completion claims ("should work", "looks correct") and requires fresh command output as evidence. This is a hard behavioral constraint that carl does not attempt.

### 5. Orchestration recovery
The meta-skill includes orchestration recovery logic for surviving compaction and `/clear` events, reading state from `.claude/craft-state.md` and auto-resuming interrupted pipelines.

### 6. Continuous learning
The `continuous-learning` rule and `evaluate-session.cjs` hook automatically detect extractable patterns at session end and pre-compaction, persisting them as learned skills for future sessions.

---

## Strengths: carl

### 1. Dynamic, context-aware rule loading (key innovation)
carl's core value proposition is that **irrelevant rules never enter context**. If you are discussing content strategy, development coding standards are not loaded. If you are debugging, content writing rules are not loaded. This directly addresses context window bloat, which is a real problem with magic-claude's always-on approach where all 13 rule files (plus the lengthy `CLAUDE.md`, plus user-level rules) are present regardless of relevance.

**Key mechanism:** `hooks/carl-hook.py` keyword matching against `RECALL` fields in `.carl/manifest`

### 2. Context bracket system
carl automatically adjusts its behavior based on token consumption:
- **FRESH (60-100%):** Minimal injection, lean operation
- **MODERATE (40-60%):** Reinforcing key context, periodic restatement
- **DEPLETED (25-40%):** Heavy reinforcement, checkpoints, handoff preparation
- **CRITICAL (<25%):** Emergency mode

This is defined in `.carl-template/context`. magic-claude has no equivalent automated system -- `performance.md` merely advises avoiding the last 20% but does not act on it.

### 3. Exclusion mechanism
The two-level exclusion system (`GLOBAL_EXCLUDE` and per-domain `DOMAIN_EXCLUDE`) prevents rules from loading when they would be counterproductive. For example, a DEVELOPMENT domain could have `EXCLUDE=documentation,readme` to avoid injecting coding rules during documentation-only work.

### 4. Transparent disclosure of loaded rules
Each `<carl-rules>` injection block shows which domains loaded, which keywords triggered them, the current context bracket, AND which domains are available but not loaded (with their trigger keywords). The user (and Claude) can see exactly what is and is not active. magic-claude's rules are opaque -- they are always present, and there is no per-prompt visibility into which rules are being applied.

### 5. Conversational configuration management
The `carl-manager` skill enables users to create domains, add rules, toggle activation, and manage star-commands through natural conversation. The `AUDIT-CLAUDEMD.md` guide helps migrate bloated CLAUDE.md content into carl domains. This is significantly more approachable than editing magic-claude's Markdown files manually.

### 6. Star-commands as mode switches
The `*command` syntax (`*dev`, `*review`, `*brief`, `*plan`, `*debug`, `*explain`) provides instant behavioral mode switching within a conversation. While magic-claude has slash commands, those invoke workflows/skills -- carl's star-commands change the behavioral posture (e.g., `*brief` = bullet points only, `*dev` = code over explanation). This is a different and complementary concept.

### 7. Lightweight, single-file implementation
The entire injection engine is one Python file (`carl-hook.py`) with no dependencies beyond Python 3. magic-claude's hook system spans dozens of Node.js scripts. carl is significantly easier to understand, audit, and modify.

### 8. Session tracking with auto-cleanup
carl tracks per-session metadata (prompt count, timestamps, titles) and auto-cleans stale sessions older than 24 hours. This provides session analytics without manual intervention.

---

## Weaknesses: magic-claude

### 1. Context bloat from always-on rules
All 13 rule files are loaded into every session regardless of relevance. The `java-style.md` rule alone is ~350 lines of Java-specific guidance that is irrelevant in a Python-only project. The `python-style.md` is ~400 lines irrelevant in a TypeScript project. Combined with the comprehensive `CLAUDE.md` and user-level rules, this consumes significant context budget on every interaction.

**Impact:** In a TypeScript-only session, Java-style, Python-style, Serena-tools, and claude-mem-tools rules are dead weight if those tools are not installed.

### 2. No per-prompt rule relevance filtering
There is no mechanism to load rules conditionally based on what the user is asking about. Every rule is always present. The skill system provides some selectivity (skills are invoked when relevant), but rules themselves have no activation/deactivation logic.

### 3. No context budget awareness at the rule injection level
While `performance.md` advises caution near context limits, there is no automated system that reduces rule injection density as context fills up. carl's bracket system actively adjusts behavior.

### 4. No exclusion mechanism
There is no way to prevent a rule from loading when it would be counterproductive. If a user wants to temporarily suspend immutability requirements for a quick prototype, they must edit the rule file.

### 5. No transparency about which rules are active
Users cannot easily see which rules are influencing Claude's behavior in a given interaction. There is no per-prompt disclosure of active rules. The meta-skill announces skills but not rules.

### 6. Complex multi-file architecture increases maintenance burden
13 rule files, 15+ hook scripts, 30+ agents, 15+ skills -- the surface area is large. Adding a new rule requires understanding where it fits in the hierarchy and whether it overlaps with existing rules, skills, or hooks.

---

## Weaknesses: carl

### 1. No active enforcement
carl injects rules as text that Claude is instructed to follow, but there is no automated verification. If Claude ignores a rule (e.g., leaves in `console.log` statements), there is no PostToolUse hook to catch it. magic-claude actively runs security scanners, type checkers, and debug statement detectors.

### 2. Keyword matching is fragile
Domain activation depends on keyword presence in the user's prompt. If a user says "update the handler" instead of "fix the code," a DEVELOPMENT domain triggered by "code, fix, bug, implement" might not activate. False negatives mean rules silently fail to load. False positives inject irrelevant rules.

### 3. No agent orchestration
carl has no concept of specialized agents, TDD enforcement, code review workflows, or multi-agent collaboration. It is purely a rule injection system with no workflow automation.

### 4. No skill system for proactive workflows
carl cannot proactively invoke complex multi-step workflows like magic-claude's craft pipeline (DISCOVER -> PLAN -> TDD -> VERIFY -> REVIEW -> DELIVER). Star-commands change behavioral posture but do not orchestrate.

### 5. No ecosystem-specific tooling
carl does not auto-detect project ecosystems or provide ecosystem-specific security scanning, auto-formatting, or type checking. It relies on the rules themselves to contain ecosystem guidance, but has no hooks to enforce it.

### 6. Python dependency in a Node.js ecosystem
Claude Code is a Node.js application. carl's hook is Python, which means users need Python 3 installed. magic-claude uses Node.js throughout, avoiding an extra dependency.

### 7. No continuous learning
carl has no mechanism to extract patterns from sessions, persist learned knowledge, or improve over time based on usage.

### 8. Limited governance depth
carl's rules are simple key-value pairs (`DOMAIN_RULE_N=instruction`). This format cannot express complex decision trees, verification requirements, or conditional logic. magic-claude's Markdown skills can contain flowcharts, tables, and multi-step workflows.

---

## Concepts & Techniques to Investigate

### 1. Dynamic Rule Loading Based on Context Relevance

**What carl does:** Scans each prompt for keywords, loads only matching domain rules.

**Why investigate:** magic-claude loads ~2,000+ lines of rules into every session regardless of relevance. In a TypeScript-only project, `java-style.md` (350 lines) and `python-style.md` (400 lines) are pure waste. Dynamic loading could save 30-50% of rule context in single-ecosystem sessions.

**Implementation approach:** Add a `UserPromptSubmit` hook (magic-claude already has one: `inject-prompt-context.cjs`) that detects the current ecosystem from the project and only injects ecosystem-relevant rules. Alternatively, add `RECALL` keyword metadata to each rule file's frontmatter and filter at injection time.

**Problem it solves:** Context budget efficiency, especially in long sessions where every token matters.

### 2. Context Bracket System

**What carl does:** Tracks token consumption percentage and adjusts injection density across FRESH/MODERATE/DEPLETED/CRITICAL brackets.

**Why investigate:** magic-claude's `performance.md` passively advises caution near context limits, but takes no automated action. carl's bracket system actively reduces injection overhead when context is scarce and reinforces key context when it risks being compacted away.

**Implementation approach:** The existing `inject-prompt-context.cjs` hook could estimate context usage (from prompt count or transcript size) and progressively reduce injected context. In DEPLETED mode, inject only critical rules (security, verification) and drop style guides.

**Problem it solves:** Prevents context exhaustion in long sessions; proactively manages the tradeoff between rule completeness and available working space.

### 3. Per-Prompt Rule Disclosure / Transparency

**What carl does:** Each `<carl-rules>` block shows loaded domains, trigger keywords, active bracket, AND available-but-unloaded domains with their keywords.

**Why investigate:** magic-claude users have no visibility into which of the 13 rule files are influencing behavior. Transparency builds trust and helps users understand (and debug) Claude's behavior.

**Implementation approach:** The `session-start.cjs` hook or `inject-prompt-context.cjs` could append a brief "Active rules" summary to `additionalContext`. This does not need to list every rule -- just the categories active for this session.

**Problem it solves:** Debuggability when Claude behaves unexpectedly; user awareness of what governance is active.

### 4. Exclusion Mechanism

**What carl does:** `GLOBAL_EXCLUDE` keywords prevent all domain matching; `DOMAIN_EXCLUDE` prevents specific domains from loading.

**Why investigate:** magic-claude has no way to temporarily suppress rules. If a user is prototyping and wants to skip the immutability requirement or TDD enforcement, they must edit rule files. An exclusion mechanism would allow per-session or per-prompt overrides.

**Implementation approach:** Support `EXCLUDE` keywords or a `*skip-rule <name>` star-command syntax. Store session-level overrides in the session state that `session-start.cjs` already manages.

**Problem it solves:** Flexibility for exploratory/prototyping work without permanently modifying rules.

### 5. Star-Commands as Behavioral Mode Switches

**What carl does:** `*brief`, `*dev`, `*review`, `*plan`, `*debug`, `*explain` instantly change Claude's behavioral posture mid-conversation.

**Why investigate:** magic-claude's slash commands invoke workflows (e.g., `/tdd` starts TDD, `/code-review` starts review). But there is no mechanism to say "switch to brief mode for the rest of this conversation" or "enter debug posture." Star-commands are complementary to slash commands.

**Implementation approach:** Parse `*` prefixed tokens in the `UserPromptSubmit` hook (`inject-prompt-context.cjs`), set a session-level mode flag, and inject the corresponding behavioral rules into `additionalContext`. Store the mode in session state so it persists across prompts.

**Problem it solves:** Quick behavioral adaptation without invoking full workflow skills; reduces friction for common mode switches.

### 6. CLAUDE.md Audit / Migration Tool

**What carl does:** `AUDIT-CLAUDEMD.md` provides a structured 5-step process for identifying which CLAUDE.md content should be migrated to carl domains, categorizing content by type (identity vs. behavioral), and presenting findings for user approval.

**Why investigate:** magic-claude's CLAUDE.md files tend to grow large. A tool that audits CLAUDE.md content and suggests which parts could become conditional rules (only loaded when relevant) would help manage bloat.

**Problem it solves:** CLAUDE.md maintenance; identifying content that could be dynamically loaded instead of always present.

### 7. Conversational Rule Management

**What carl does:** The `carl-manager` skill lets users create domains, add rules, toggle activation, and manage star-commands through natural conversation -- no file editing required.

**Why investigate:** magic-claude's rule management requires editing Markdown files and understanding the plugin structure. A conversational interface would lower the barrier to customization.

**Implementation approach:** A `magic-claude:rule-manager` skill that reads, creates, and modifies rule files in `~/.claude/rules/` or `.claude/rules/` through conversation.

**Problem it solves:** Accessibility for users who are not comfortable editing plugin configuration files directly.

---

## Recommendations

### Priority 1: Ecosystem-Aware Rule Filtering (High Impact, Medium Effort)

Add ecosystem detection to the existing `inject-prompt-context.cjs` UserPromptSubmit hook. At minimum:
- Detect active ecosystem from project indicators (package.json, build.gradle, pyproject.toml)
- Only inject ecosystem-relevant style rules (`java-style.md` for JVM, `python-style.md` for Python, etc.)
- Always inject universal rules (`security.md`, `testing.md`, `coding-style.md`, `git-workflow.md`)

This alone could reduce rule context by 30-50% in single-ecosystem projects with no user-facing changes.

### Priority 2: Context Bracket System (High Impact, Medium Effort)

Implement a FRESH/MODERATE/DEPLETED bracket system in `inject-prompt-context.cjs`:
- **FRESH:** Full rule injection (current behavior)
- **MODERATE:** Drop code examples from rules, keep summaries
- **DEPLETED:** Inject only security + verification rules; drop style guides entirely

Use prompt count as a proxy for context consumption (carl does this). The existing session state infrastructure (`session-start.cjs` / `session-end.cjs`) already tracks session data that could feed this.

### Priority 3: Star-Command Mode Switches (Medium Impact, Low Effort)

Parse `*brief`, `*dev`, `*review`, `*debug`, `*explain` in `inject-prompt-context.cjs` and inject corresponding behavioral rules. This is low-effort because the hook already processes every prompt. Store the active mode in session state.

### Priority 4: Rule Transparency / Disclosure (Medium Impact, Low Effort)

Append a brief "Active governance" section to the `additionalContext` injected by `session-start.cjs`, listing which rule categories are loaded and which skills are available. This helps users understand and debug Claude's behavior.

### Priority 5: Rule Exclusion Mechanism (Medium Impact, Medium Effort)

Support session-level rule overrides. Options:
- `*skip immutability` star-command to suppress a rule for the current session
- Per-session overrides stored in session state
- A `magic-claude:configure` skill for conversational rule management

### Priority 6: CLAUDE.md Audit Tool (Low Impact, Low Effort)

Create a `magic-claude:audit-claudemd` skill that analyzes the project's CLAUDE.md and suggests which content could be migrated to conditional rules. This is a one-time optimization tool, not a recurring need.

---

## Summary

carl and magic-claude solve overlapping but different problems. carl is laser-focused on **context efficiency** through dynamic rule injection -- it loads only what is relevant and adapts to context budget constraints. magic-claude is focused on **comprehensive quality enforcement** through multiple layers of rules, hooks, skills, and agents -- it ensures nothing is missed but at the cost of always-on context consumption.

The strongest takeaway from carl is that **not all rules are relevant all the time**, and magic-claude pays a real context budget cost for its always-on approach. Implementing ecosystem-aware filtering (Priority 1) and context brackets (Priority 2) would capture carl's key insight while preserving magic-claude's superior enforcement, orchestration, and multi-ecosystem support.

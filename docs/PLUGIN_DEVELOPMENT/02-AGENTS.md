# Agents - Complete Reference

**Official Documentation Sources:**
- Subagents: https://code.claude.com/docs/en/sub-agents
- Agent Teams: https://code.claude.com/docs/en/agent-teams
- Agent Teams Costs: https://code.claude.com/docs/en/costs
- CLI Reference (--agents flag): https://code.claude.com/docs/en/cli-reference
- Documentation Index: https://code.claude.com/docs/llms.txt

## What Are Agents?

Agents (also called subagents) are specialized AI assistants that handle specific types of tasks. Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions. When Claude encounters a task that matches a subagent's description, it delegates to that subagent, which works independently and returns results.

Subagents help you:

- **Preserve context** by keeping exploration and implementation out of your main conversation
- **Enforce constraints** by limiting which tools a subagent can use
- **Reuse configurations** across projects with user-level subagents
- **Specialize behavior** with focused system prompts for specific domains
- **Control costs** by routing tasks to faster, cheaper models like Haiku

**Important:** Subagents cannot spawn other subagents. If your workflow requires nested delegation, use Skills or chain subagents from the main conversation.

## Built-in Subagents

Claude Code includes built-in subagents that Claude automatically uses when appropriate:

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **Explore** | Haiku | Read-only (no Write/Edit) | File discovery, code search, codebase exploration. Invoked with thoroughness levels: `quick`, `medium`, or `very thorough` |
| **Plan** | Inherits | Read-only (no Write/Edit) | Codebase research during plan mode |
| **general-purpose** | Inherits | All tools | Complex research, multi-step operations, code modifications |
| **Bash** | Inherits | - | Running terminal commands in separate context |
| **statusline-setup** | Sonnet | - | When you run `/statusline` to configure your status line |
| **Claude Code Guide** | Haiku | - | When you ask questions about Claude Code features |

## Agent File Format

**Format:** Markdown file with YAML frontmatter + instructions in body

### Agent Scope and Locations

Agents can be stored in different locations depending on scope. When multiple agents share the same name, the higher-priority location wins:

| Location | Scope | Priority | Description |
|----------|-------|----------|-------------|
| `--agents` CLI flag | Current session only | 1 (highest) | Pass JSON when launching Claude Code |
| `.claude/agents/` | Current project | 2 | Check into version control for team use |
| `~/.claude/agents/` | All your projects | 3 | Personal agents available everywhere |
| Plugin's `agents/` directory | Where plugin is enabled | 4 (lowest) | Installed with plugins |

### Agent Frontmatter - COMPLETE REFERENCE

| Field | Type | Required | Default | Valid Values | Description |
|-------|------|----------|---------|--------------|-------------|
| `name` | string | Yes | - | lowercase-hyphens | Agent identifier (machine-readable) |
| `description` | string | Yes | - | Any string | When Claude should delegate to this agent (max 120 chars). Include "use proactively" for proactive delegation |
| `tools` | string | No | All inherited | Comma-separated tool names | Tools available to agent (allowlist) |
| `disallowedTools` | string | No | - | Comma-separated tool names | Tools to deny (denylist, removed from inherited or specified list) |
| `model` | string | No | `inherit` | `opus`, `sonnet`, `haiku`, `inherit` | Claude model to use. `inherit` uses main conversation's model |
| `permissionMode` | string | No | `default` | `default`, `acceptEdits`, `delegate`, `dontAsk`, `bypassPermissions`, `plan` | How the subagent handles permission prompts |
| `maxTurns` | number | No | - | Positive integer | Maximum number of agentic turns the subagent can take before stopping |
| `mcpServers` | string/object | No | - | Comma-separated server names, or inline YAML config | MCP servers available to this subagent. Can reference servers by name from project config, or define inline server configurations |
| `memory` | string | No | - | `user`, `project`, `local` | Persistent memory scope for the agent. `user` stores in `~/.claude/agent-memory/`, `project` stores in `.claude/agent-memory/` (committed), `local` stores in `.claude/agent-memory-local/` (gitignored) |
| `skills` | string | No | - | Comma-separated skill names | Skills preloaded into agent context (full content injected, not just available for invocation) |
| `hooks` | object | No | - | YAML hook definitions | Lifecycle hooks scoped to this subagent |

### Minimal Agent Example

```markdown
---
name: code-reviewer
description: Expert code review specialist ensuring code quality and security
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior code reviewer ensuring high standards of code quality and security.

Your responsibilities:
1. Review code for quality, security, and maintainability
2. Provide actionable feedback with specific fixes
3. Check for common vulnerabilities and issues
4. Ensure tests are adequate

Review Checklist:
- Code is simple and readable
- Functions are well-named (<50 lines each)
- No hardcoded secrets or API keys
- Proper error handling
- Good test coverage
```

### Complete Agent Example

```markdown
---
name: tdd-guide
description: Test-Driven Development specialist enforcing write-tests-first methodology
tools: Read, Write, Edit, Bash, Grep
model: opus
skills: tdd-workflow
---

You are a Test-Driven Development (TDD) specialist who ensures all code is developed test-first.

## Your Role

- Enforce tests-before-code methodology
- Guide developers through TDD Red-Green-Refactor cycle
- Ensure 80%+ test coverage
- Write comprehensive test suites (unit, integration, E2E)

## TDD Workflow

[Detailed instructions...]
```

### Agent with Multiple Skills

```markdown
---
name: security-architect
description: Security expert designing secure systems with comprehensive threat modeling
tools: Read, Grep, Glob, Bash
model: opus
skills: security-review, backend-patterns, coding-standards
---

You are a security architect ensuring all systems are designed securely from the start.

[Detailed instructions...]
```

## Agent Fields Explained in Detail

### `name`

**Type:** string
**Required:** Yes
**Rules:**
- Lowercase with hyphens only
- No spaces, underscores, camelCase
- 3-50 characters
- Unique within plugin

**Examples:**
- `code-reviewer` ✓
- `tdd-guide` ✓
- `security-reviewer` ✓
- `CodeReviewer` ✗ (not lowercase-hyphenated)
- `code_reviewer` ✗ (underscores not allowed)

### `description`

**Type:** string
**Required:** Yes
**Rules:**
- One-line description
- Should fit in UI tooltip (120 characters max)
- Describes what agent does or specializes in
- Action-oriented language

**Examples:**
- `Expert code review specialist. Proactively reviews code for quality, security, and maintainability.` ✓
- `Test-Driven Development specialist enforcing write-tests-first methodology.` ✓
- `Agent` ✗ (too vague)

### `tools`

**Type:** string
**Required:** Yes
**Rules:**
- Comma-separated list of tool names
- Tools must exist in Claude Code
- Subset of available tools (not all)

**Available Tools:**

| Tool | Purpose | When to Use |
|------|---------|-----------|
| `Read` | Read file contents | All agents that analyze code/files |
| `Write` | Create new files | Code generation, template creation |
| `Edit` | Modify file contents | Code fixes, refactoring |
| `Bash` | Run shell commands | Build, test, deploy tasks |
| `Grep` | Search file contents | Code analysis, pattern matching |
| `Glob` | Find files by pattern | File discovery, organization |
| `TaskCreate` | Create task items | Project management, delegation |
| `TaskUpdate` | Update task status | Workflow management |
| `Skill` | Invoke skills | Multi-agent workflows |

**Restricting Spawnable Subagents:**

Use `Task(agent_type)` syntax in the tools field to restrict which subagents this agent can spawn:

```markdown
---
tools: Read, Grep, Glob, Task(code-reviewer), Task(Explore)
---
```

This allows the agent to use Read, Grep, and Glob, and can only spawn `code-reviewer` and `Explore` subagents (not arbitrary ones).

**Best Practices:**
- Only include tools agent will actually use
- More tools = broader capability, more context used
- Fewer tools = focused, efficient agent

**Examples:**

```markdown
---
tools: Read, Grep, Glob, Bash
---
```

### `model`

**Type:** string
**Required:** No
**Default:** `inherit`
**Valid Values:** `opus`, `sonnet`, `haiku`, `inherit`

- **Model alias**: Use one of the available aliases: `sonnet`, `opus`, or `haiku`
- **inherit**: Use the same model as the main conversation
- **Omitted**: If not specified, defaults to `inherit`

**Model Comparison:**

| Model | Speed | Cost | Best For | Reasoning Depth |
|-------|-------|------|----------|-----------------|
| **opus** | Slow | Highest | Complex analysis, architecture, security | Maximum |
| **sonnet** | Medium | Medium | Feature implementation, code review | High |
| **haiku** | Fast | ~1/3 Sonnet | Simple tasks, worker agents | Good |
| **inherit** | Varies | Varies | Match main conversation model | Varies |

**Selection Strategy:**

- **Use Opus for:**
  - Complex architectural decisions
  - Security vulnerability analysis
  - Long-form planning
  - Novel problem solving

- **Use Sonnet for:**
  - Main feature implementation
  - Code generation and testing
  - Refactoring and code review

- **Use Haiku for:**
  - Quick fixes and validation
  - Worker agents (many invocations)
  - Simple formatting and checks

- **Use inherit for:**
  - When agent should match main conversation capability
  - Flexible agents that adapt to context

### `disallowedTools` (Optional)

**Type:** string
**Required:** No
**Rules:**
- Comma-separated tool names
- Tools to deny (denylist approach)
- Removed from inherited or specified tool list

**What it does:**

Use `disallowedTools` when you want to inherit most tools but exclude specific ones. This is the inverse of the `tools` allowlist.

**Example:**

```markdown
---
name: safe-researcher
description: Research agent with restricted capabilities
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---
```

### `permissionMode` (Optional)

**Type:** string
**Required:** No
**Default:** `default`
**Valid Values:**

| Mode | Behavior |
|------|----------|
| `default` | Standard permission checking with prompts |
| `acceptEdits` | Auto-accept file edits |
| `delegate` | Coordination-only mode for agent team leads; can spawn subagents but limited direct tool use |
| `dontAsk` | Auto-deny permission prompts (explicitly allowed tools still work) |
| `bypassPermissions` | Skip all permission checks (use with caution!) |
| `plan` | Plan mode (read-only exploration) |

**Warning:** Use `bypassPermissions` with caution. It skips all permission checks, allowing the subagent to execute any operation without approval.

**Note:** If the parent uses `bypassPermissions`, this takes precedence and cannot be overridden.

**Example:**

```markdown
---
name: auto-formatter
description: Automatically formats code without asking
permissionMode: acceptEdits
---
```

### `skills` (Optional)

**Type:** string
**Required:** No
**Rules:**
- Comma-separated skill names
- Skills must exist in plugin
- Multiple skills allowed
- Full skill content is injected into agent context at startup

**What it does:**

When `skills` is specified, the skill content is:
1. Loaded into agent's system prompt (full content injected)
2. Available throughout agent's execution
3. Integrated into agent instructions

**Important:** Subagents don't inherit skills from the parent conversation; you must list them explicitly. The full content of each skill is injected, not just made available for invocation.

**Examples:**

```markdown
---
skills: tdd-workflow
---
```

Multiple skills:
```markdown
---
skills: tdd-workflow, security-review, coding-standards
---
```

### `hooks` (Optional)

**Type:** object (YAML)
**Required:** No
**Rules:**
- Define hooks that run only while the subagent is active
- Hooks are cleaned up when the subagent finishes
- Valid events: `PreToolUse`, `PostToolUse`, `Stop`

**Hook Format in Frontmatter:**

```yaml
---
name: code-reviewer
description: Review code changes with automatic linting
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

**Hook Events in Subagent Frontmatter:**

| Event | Matcher Input | When it Fires |
|-------|---------------|---------------|
| `PreToolUse` | Tool name | Before the subagent uses a tool |
| `PostToolUse` | Tool name | After the subagent uses a tool |
| `Stop` | (none) | When the subagent finishes |

**Example: Database Query Validator**

```yaml
---
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---
```

### `maxTurns` (Optional)

**Type:** number
**Required:** No
**Rules:**
- Positive integer
- Limits how many agentic turns (tool calls) the subagent can make
- Useful for preventing runaway agents or bounding cost

**Example:**

```markdown
---
name: quick-checker
description: Fast validation with limited turns
tools: Read, Grep
model: haiku
maxTurns: 10
---
```

### `mcpServers` (Optional)

**Type:** string or object
**Required:** No
**Rules:**
- Reference MCP servers by name (comma-separated) from project configuration
- Or define inline server configurations in YAML
- Subagents do NOT inherit MCP servers from the parent conversation by default

**Example (name reference):**

```markdown
---
name: research-agent
description: Research agent with access to search and docs
tools: Read, Grep, Glob
mcpServers: context7, ddg-search
---
```

**Example (inline configuration):**

```yaml
---
name: db-analyst
description: Database analysis agent
tools: Read, Bash
mcpServers:
  my-db-server:
    command: npx
    args: ["-y", "@db/mcp-server"]
    env:
      DB_URL: "${DB_CONNECTION_STRING}"
---
```

### `memory` (Optional)

**Type:** string
**Required:** No
**Valid Values:** `user`, `project`, `local`

Enables persistent memory for the agent across sessions. The agent can read and write structured notes that survive between invocations.

| Scope | Storage Path | Git Tracked | Use Case |
|-------|-------------|-------------|----------|
| `user` | `~/.claude/agent-memory/` | No | Personal preferences, cross-project knowledge |
| `project` | `.claude/agent-memory/` | Yes (committed) | Shared team knowledge, project conventions |
| `local` | `.claude/agent-memory-local/` | No (gitignored) | Local environment details, credentials context |

**Example:**

```markdown
---
name: project-historian
description: Tracks project decisions and architectural history
tools: Read, Grep, Glob
model: sonnet
memory: project
---

You maintain a historical record of architectural decisions and project conventions.
When you learn something new about the project, write it to memory.
When answering questions, check memory first for relevant context.
```

## Complete Agent Structure

### Anatomy of an Agent File

```markdown
---
name: agent-identifier
description: One-line description
tools: Tool1, Tool2, Tool3
model: opus
skills: skill-name-1, skill-name-2
---

# Agent Title

## Role and Responsibilities

Description of what this agent does.

## When to Use

List scenarios for agent activation.

## Key Principles

Core principles agent follows.

## Workflow

Step-by-step instructions.

## Checklist

Success criteria:
- Criterion 1
- Criterion 2

## Example

Example interaction.
```

## Agent Invocation Patterns

### Direct Mention

```
User: Use the code-reviewer agent to review this change.
```

### Delegation in Commands

```markdown
---
description: Review code for quality and security
---

# Code Review

I'm delegating to the **code-reviewer** agent for analysis.
```

### Agent Collaboration

```markdown
---
name: architect
---

You may delegate code review to the **code-reviewer** agent.
```

### Proactive Delegation

Claude automatically delegates tasks based on the task description, the `description` field in agent configurations, and current context. To encourage proactive delegation, include phrases like "use proactively" in your agent's description:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Use proactively after code changes.
---
```

## Foreground vs Background Execution

Subagents can run in the foreground (blocking) or background (concurrent):

### Foreground Subagents
- Block the main conversation until complete
- Permission prompts and clarifying questions are passed through to you
- Full interactive capability

### Background Subagents
- Run concurrently while you continue working
- Before launching, Claude prompts for any tool permissions the subagent will need
- Once running, the subagent inherits these permissions and auto-denies anything not pre-approved
- If a background subagent needs to ask clarifying questions, that tool call fails but the subagent continues
- MCP tools are not available in background subagents

**Controls:**
- Ask Claude to "run this in the background"
- Press **Ctrl+B** to background a running task
- Set `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` to disable background tasks entirely

## Resume Subagents

Each subagent invocation creates a new instance with fresh context. To continue an existing subagent's work instead of starting over, ask Claude to resume it:

```
Use the code-reviewer subagent to review the authentication module
[Agent completes]

Continue that code review and now analyze the authorization logic
[Claude resumes the subagent with full context from previous conversation]
```

Resumed subagents retain their full conversation history, including all previous tool calls, results, and reasoning.

**Transcript Location:** `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`

## Disabling Specific Subagents

Prevent Claude from using specific subagents by adding them to the `deny` array in settings. Use the format `Task(subagent-name)`:

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-custom-agent)"]
  }
}
```

Or via CLI:
```bash
claude --disallowedTools "Task(Explore)"
```

## Project-Level Hooks for Subagent Events

Configure hooks in `settings.json` that respond to subagent lifecycle events in the main session:

| Event | Matcher Input | When it Fires |
|-------|---------------|---------------|
| `SubagentStart` | Agent type name | When a subagent begins execution |
| `SubagentStop` | Agent type name | When a subagent completes |

**Example: Setup/Cleanup for Database Agent**

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

## Common Subagent Patterns

### Isolate High-Volume Operations

Delegate operations that produce large output to keep verbose results out of your main context:

```
Use a subagent to run the test suite and report only the failing tests with their error messages
```

### Parallel Research

For independent investigations, spawn multiple subagents to work simultaneously:

```
Research the authentication, database, and API modules in parallel using separate subagents
```

Each subagent explores its area independently, then Claude synthesizes the findings.

**Warning:** When subagents complete, their results return to your main conversation. Running many subagents that each return detailed results can consume significant context.

### Chain Subagents

For multi-step workflows, use subagents in sequence:

```
Use the code-reviewer subagent to find performance issues, then use the optimizer subagent to fix them
```

Each subagent completes its task and returns results to Claude, which passes relevant context to the next subagent.

## CLI-Defined Subagents

Pass agents as JSON when launching Claude Code for session-only agents:

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

The `--agents` flag accepts JSON with these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `description` | Yes | When Claude should delegate to this agent |
| `prompt` | Yes | The system prompt (equivalent to markdown body in file-based agents) |
| `tools` | No | Array of tool names (e.g., `["Read", "Grep", "Glob"]`). Supports `Task(agent_type)` syntax. Inherits all if omitted |
| `disallowedTools` | No | Array of tool names to explicitly deny |
| `model` | No | Model alias: `sonnet`, `opus`, `haiku`, or `inherit` (default) |
| `skills` | No | Array of skill names to preload into context |
| `mcpServers` | No | Array of MCP server names (strings) or `{name: config}` objects |
| `maxTurns` | No | Maximum number of agentic turns before the subagent stops |
| `permissionMode` | No | Permission mode string (e.g., `"acceptEdits"`, `"plan"`) |
| `hooks` | No | Hook definitions object scoped to this agent |

## Model Selection Guide

| Scenario | Recommended Model | Reasoning |
|----------|-------------------|-----------|
| Planning complex features | opus | Deep reasoning for architecture |
| Implementing features | sonnet | Good balance of capability and speed |
| Quick validation | haiku | Fast, sufficient capability |
| Security analysis | opus | Maximum reasoning for vulnerabilities |
| Code formatting | haiku | Simple transformation, fast execution |
| Bug fixing | sonnet | Good for problem-solving |

## Permission Modes

Permission modes control how subagents handle permission prompts. Set via `permissionMode` in frontmatter:

```markdown
---
name: auto-editor
description: Automatically edits files without confirmation
permissionMode: acceptEdits
tools: Read, Write, Edit
---
```

| Mode | Use Case |
|------|----------|
| `default` | Standard interactive permissions |
| `acceptEdits` | Auto-formatter, code cleanup agents |
| `delegate` | Team lead agents that coordinate other subagents |
| `dontAsk` | Agents that should work silently |
| `bypassPermissions` | Trusted automation (use with caution) |
| `plan` | Read-only research and planning |

## Best Practices

### 1. Clear Role Definition

```markdown
---
name: good-agent
---

You are an expert in feature implementation.

Your role:
- Plan feature architecture
- Write implementation code
- Ensure tests pass
```

### 2. Focused Toolset

```markdown
---
tools: Read, Write, Edit, Bash
---
```

### 3. Appropriate Model Selection

Complex task = Opus
Standard task = Sonnet
Simple task = Haiku

### 4. Leverage Skills When Available

```markdown
---
skills: tdd-workflow
---

You MUST follow the **tdd-workflow** skill for TDD tasks.
```

## Agent Examples in This Repository

| Agent | Model | Purpose | Tools |
|-------|-------|---------|-------|
| `code-reviewer` | opus | Code quality and security | Read, Grep, Glob, Bash |
| `tdd-guide` | opus | Test-driven development | Read, Write, Edit, Bash, Grep |
| `security-reviewer` | opus | Security analysis | Read, Bash, Grep |
| `planner` | opus | Feature planning | Read, Write, Grep |
| `architect` | opus | System architecture | Read, Grep |
| `ts-build-resolver` | sonnet | Fix TypeScript/JS build errors | Read, Write, Edit, Bash, Grep, Glob |
| `jvm-build-resolver` | sonnet | Fix Java/Kotlin/Groovy build errors | Read, Write, Edit, Bash, Grep, Glob |
| `python-build-resolver` | sonnet | Fix Python build/type/lint errors | Read, Write, Edit, Bash, Grep, Glob |
| `e2e-runner` | sonnet | E2E test generation | Read, Write, Edit, Bash |
| `setup-agent` | sonnet | Project setup and configuration | Read, Write, Edit, Bash, Grep, Glob |
| `gradle-expert` | sonnet | Gradle build system specialist | Read, Write, Edit, Bash, Grep |
| `maven-expert` | sonnet | Maven build system specialist | Read, Write, Edit, Bash, Grep |
| `ci-cd-architect` | opus | CI/CD pipeline design | Read, Write, Edit, Bash, Grep, Glob |
| `python-reviewer` | sonnet | Python code review | Read, Grep, Glob, Bash |
| `java-reviewer` | sonnet | Java code review | Read, Grep, Glob, Bash |
| `groovy-reviewer` | sonnet | Groovy code review | Read, Grep, Glob, Bash |
| `kotlin-reviewer` | sonnet | Kotlin code review | Read, Grep, Glob, Bash |
| `refactor-cleaner` | haiku | Dead code removal | Read, Bash, Grep |
| `doc-updater` | haiku | Documentation updates | Read, Write, Edit |

## Agent Teams (Experimental)

Agent teams coordinate multiple Claude Code instances working together. One session acts as the **team lead**, coordinating work and assigning tasks. **Teammates** work independently, each in its own context window, and can communicate directly with each other.

**Status:** Experimental, disabled by default. Enable via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in environment or settings.json.

### Agent Teams vs Subagents

|  | Subagents | Agent Teams |
|--|-----------|-------------|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report results back to main agent only | Teammates message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Best for** | Focused tasks where only the result matters | Complex work requiring discussion and collaboration |
| **Token cost** | Lower: results summarized back to main context | Higher: each teammate is a separate Claude instance (~7x in plan mode) |

### When to Use Agent Teams

Agent teams add coordination overhead and use significantly more tokens than subagents. Use them only when parallel exploration genuinely adds value:

- **Multi-perspective code review** — 3 reviewers (security, performance, test coverage) examining the same PR simultaneously
- **Competing hypothesis debugging** — teammates testing different theories in parallel and challenging each other's findings
- **Cross-layer coordination** — frontend + backend + tests, each owned by a different teammate working on different files
- **Research and architecture exploration** — multiple teammates researching different approaches

### When NOT to Use Agent Teams

- Sequential tasks (use `/orchestrate` or subagents instead)
- Same-file edits (causes overwrites)
- Work with many dependencies between steps
- Routine single-feature development
- When token budget is a concern

### Token Cost Awareness

Agent teams consume significantly more tokens than a single session:
- Each teammate maintains its own full context window
- All teammates load CLAUDE.md, MCP configs, and skills at spawn
- Broadcasts multiply costs by team size
- Recommendation: max 2-3 teammates, focused spawn prompts, minimize broadcasts
- Delegate verbose I/O (tests, logs) to subagents within teammates, not teammates themselves

### Quality Gates with Hooks

Use `TeammateIdle` and `TaskCompleted` hooks to enforce quality before teammates finish:

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/verify-task-completion.cjs\""
          }
        ]
      }
    ]
  }
}
```

Exit code 2 blocks the action and feeds stderr back as feedback. See [Hooks Reference](03-HOOKS.md#teammateidle-input-schema) for full schemas.

### Display Modes

| Mode | Description | Requirements |
|------|-------------|--------------|
| `auto` (default) | Split panes if in tmux, otherwise in-process | None |
| `in-process` | All teammates in main terminal. Shift+Up/Down to select | Any terminal |
| `tmux` | Each teammate in its own pane | tmux or iTerm2 |

Set via `--teammate-mode` flag or `teammateMode` in settings.json.

### Limitations

- No session resumption with in-process teammates
- Task status can lag (teammates may not mark tasks as completed)
- One team per session, no nested teams
- Lead is fixed (cannot promote a teammate)
- All teammates start with lead's permission mode
- Split panes not supported in VS Code terminal, Windows Terminal, or Ghostty

## Complete Reference Checklist

### Creating an Agent

- [ ] File in `agents/` directory
- [ ] Filename: `lowercase-with-hyphens.md`
- [ ] Frontmatter: `name`, `description`, `tools`, `model`
- [ ] Clear role statement
- [ ] When to use scenarios
- [ ] Core principles explained
- [ ] Process/workflow documented
- [ ] Success criteria listed
- [ ] Example interaction shown
- [ ] Tools match responsibilities

---

**Last Updated:** 2026-02-14
**Version:** 3.1.0
**Status:** Complete Specification (includes Agent Teams, updated CLI schema)

**Strategy:**
- **Opus:** Planning, architecture, security review (1-2 agents)
- **Sonnet:** Main development work (2-4 agents)
- **Haiku:** Worker agents, quick fixes (1-2 agents)

### Tool Selection

Available tools for agents:

| Category | Tools |
|----------|-------|
| **File Operations** | Read, Write, Edit, Glob |
| **Search** | Grep |
| **System** | Bash |
| **Specialized** | Skill, TaskCreate, TaskUpdate, NotebookEdit |

**Tool Selection Tips:**
- Only include tools agent actually needs
- Fewer tools = faster reasoning
- Can reference other agents in instructions

## Agent Examples from Repository

### Example 1: Planner Agent (Opus)

```markdown
---
name: planner
description: Expert planning specialist for complex features and refactoring
tools: Read, Grep, Glob
model: opus
---

You are an expert planning specialist focused on creating comprehensive,
actionable implementation plans.

## Your Role

- Analyze requirements and create detailed implementation plans
- Break down complex features into manageable steps
- Identify dependencies and potential risks
- Suggest optimal implementation order
- Consider edge cases and error scenarios

## Planning Process

### 1. Requirements Analysis
- Understand the feature request completely
- Ask clarifying questions if needed
- Identify success criteria
- List assumptions and constraints

### 2. Architecture Review
- Analyze existing codebase structure
- Identify affected components
- Review similar implementations
- Consider reusable patterns

### 3. Step Breakdown
Create detailed steps with:
- Clear, specific actions
- File paths and locations
- Dependencies between steps
- Estimated complexity
- Potential risks

## Plan Format

# Implementation Plan: [Feature Name]

## Overview
[2-3 sentence summary]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Architecture Changes
- [Change 1: file path and description]

## Implementation Steps

### Phase 1: [Phase Name]
1. **[Step Name]** (File: path/to/file.ts)
   - Action: Specific action to take
   - Why: Reason for this step
   - Dependencies: None / Requires step X
   - Risk: Low/Medium/High

**Remember**: A great plan is specific, actionable, and considers both the happy path and edge cases.
```

### Example 2: Code Reviewer Agent (Opus)

```markdown
---
name: code-reviewer
description: Expert code review focused on quality, security, and best practices
tools: Read, Grep, Glob, Bash
model: opus
---

You are an expert code reviewer focused on comprehensive code quality,
security, and adherence to best practices.

## Your Role

- Review code for functionality, performance, and security
- Identify bugs, edge cases, and error handling issues
- Check adherence to coding standards and patterns
- Ensure test coverage is adequate
- Provide actionable improvement suggestions

## Review Process

### 1. Understand the Context
- Read related files and understand the architecture
- Check existing tests and test patterns
- Review similar implementations
- Understand the feature requirements

### 2. Code Quality Analysis
- Check for code smells (large functions, deep nesting, duplication)
- Verify error handling completeness
- Check input validation
- Review for performance issues
- Verify immutability and side effects

### 3. Security Analysis
- Check for hardcoded secrets
- Verify input validation
- Check for SQL injection vulnerabilities
- Verify authentication/authorization
- Review external API calls

### 4. Testing Analysis
- Verify test coverage (80%+ required)
- Check test quality and isolation
- Review edge case coverage
- Verify error scenario testing

## Review Format

# Code Review: [File/Feature]

## Summary
[1-2 sentence summary of findings]

## Critical Issues
- [ ] Issue: [Description]
  - Impact: [Why it matters]
  - Fix: [How to fix it]

## High Priority Issues
- [ ] Issue: [Description]
  - Suggestion: [How to improve]

## Medium Priority Issues
- [ ] Issue: [Description]
  - Suggestion: [Improvement]

## Low Priority Issues
- [ ] Issue: [Description]
  - Note: [Optional improvement]

## Summary
- Overall quality: [Excellent/Good/Fair/Poor]
- Ready to merge: [Yes/No - explain]
- Estimated fixes: [Time estimate]
```

### Example 3: TDD Guide Agent (Sonnet)

```markdown
---
name: tdd-guide
description: Test-driven development expert ensuring tests are written first
tools: Read, Write, Edit, Bash
model: sonnet
---

You are a Test-Driven Development expert who enforces the TDD workflow: RED → GREEN → REFACTOR.

## Your Role

- Enforce test-first development
- Generate comprehensive test suites
- Guide implementation to pass tests
- Ensure 80%+ coverage
- Review test quality

## TDD Workflow

### Phase 1: RED (Write Tests First)
- Generate test file with failing tests
- Each test covers one behavior
- Use Arrange-Act-Assert pattern
- Test edge cases and error paths

### Phase 2: GREEN (Write Code to Pass Tests)
- Write minimal code to pass tests
- No over-engineering
- Ignore optimization at this stage

### Phase 3: REFACTOR (Improve Code)
- Remove duplication
- Improve naming
- Optimize performance
- Keep tests green throughout

## Test Templates

### Unit Test Template
```typescript
describe('FunctionName', () => {
  describe('when [condition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = ...

      // Act
      const result = FunctionName(input)

      // Assert
      expect(result).toBe(...)
    })
  })
})
```

### Integration Test Template
```typescript
describe('GET /api/endpoint', () => {
  it('should return success response', async () => {
    const response = await request(app).get('/api/endpoint')
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
```

## Coverage Requirements
- Minimum 80% coverage
- All edge cases
- Error scenarios
- Boundary conditions

## Best Practices
1. One assertion per test
2. Descriptive test names
3. Independent tests (no dependencies)
4. Mock external dependencies
5. Fast test execution
6. Clean up after tests
```

### Example 4: Security Reviewer Agent (Opus)

```markdown
---
name: security-reviewer
description: Security expert analyzing code for vulnerabilities and best practices
tools: Read, Grep, Bash
model: opus
---

You are a security expert focused on identifying vulnerabilities,
enforcing security best practices, and ensuring secure coding standards.

## Your Role

- Identify security vulnerabilities
- Check for common attack vectors
- Verify secure coding practices
- Ensure compliance with standards
- Recommend security improvements

## Security Analysis Checklist

### Authentication & Authorization
- [ ] All protected endpoints verify authentication
- [ ] Authorization checks prevent privilege escalation
- [ ] Session management is secure (HTTPS only, secure flags)
- [ ] Password storage uses strong hashing

### Input Validation & Sanitization
- [ ] All user inputs are validated
- [ ] Input lengths are checked
- [ ] Special characters are properly escaped
- [ ] SQL injection is prevented (parameterized queries)
- [ ] XSS is prevented (output encoding)

### Secrets Management
- [ ] No hardcoded secrets in code
- [ ] API keys use environment variables
- [ ] Database credentials are secure
- [ ] Sensitive data is not logged
- [ ] Secrets are not in version control

### Data Protection
- [ ] Sensitive data is encrypted at rest
- [ ] Sensitive data uses HTTPS in transit
- [ ] PII is properly protected
- [ ] Access logs exist for sensitive operations
- [ ] Data retention policies are enforced

### Error Handling
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces not exposed to users
- [ ] Graceful fallbacks for failures
- [ ] Security warnings logged appropriately

## Security Review Format

# Security Review: [Component/Feature]

## Summary
[Overview of security posture]

## Critical Vulnerabilities
- [ ] Issue: [Vulnerability description]
  - Impact: [Severity and impact]
  - Fix: [How to remediate]

## High Risk Issues
- [ ] Issue: [Risk description]
  - Recommendation: [Improvement]

## Medium Risk Issues
- [ ] Issue: [Consideration]
  - Note: [Explanation]

## Recommendations
- [Security improvement 1]
- [Security improvement 2]

## Overall Assessment
- Secure: [Yes/No]
- Ready for production: [Yes/No]
```

### Example 5: Refactor Cleaner Agent (Haiku)

```markdown
---
name: refactor-cleaner
description: Quick refactoring for dead code removal and code cleanup
tools: Read, Grep, Bash, Edit
model: haiku
---

You are a refactoring specialist focused on identifying and removing
dead code, improving code clarity, and maintaining code health.

## Your Role

- Identify unused functions, variables, imports
- Remove dead code safely
- Simplify overcomplicated code
- Improve code clarity
- Maintain test coverage during refactoring

## Dead Code Patterns to Find

### Unused Imports
```typescript
import { unusedFunction } from './module'  // Never used
```

### Unused Variables
```typescript
const unused = getValue()  // Assigned but never used
```

### Unused Functions
```typescript
export function neverCalled() { }  // No callers
```

### Unreachable Code
```typescript
throw new Error('error')
console.log('unreachable')  // After throw
```

### Duplicate Code
```typescript
// Same code in multiple places
```

## Refactoring Process

1. **Identify Dead Code**
   - Use grep to find potential dead code
   - Check imports and exports
   - Verify no callers exist

2. **Remove Safely**
   - Keep tests green
   - Remove dead code
   - Verify no breakage

3. **Simplify**
   - Remove unnecessary complexity
   - Improve readability
   - Keep functionality same

4. **Verify**
   - Run tests
   - Check coverage unchanged
   - Confirm refactoring worked
```

## Creating Your Own Agent

### Step 1: Define Purpose

Ask:
- What expertise does this agent need?
- What specific tasks will it handle?
- What model best fits?
- What tools does it actually need?

### Step 2: Choose Model

- **Opus:** Complex reasoning, planning, security
- **Sonnet:** General development, code review
- **Haiku:** Quick tasks, worker agents

### Step 3: Select Tools

Include only tools agent actually uses:

```markdown
---
name: my-agent
description: Expert in [domain]
tools: Read, Grep, Bash
model: sonnet
---
```

### Step 4: Write Instructions

```markdown
You are an expert in [domain].

## Your Role

- Task 1
- Task 2

## Process

### Step 1: [Analysis]
...

### Step 2: [Implementation]
...

## Best Practices

1. Practice 1
2. Practice 2

## Format

[Output format if applicable]
```

### Step 5: Test

- Verify agent works as expected
- Check tool access
- Validate output quality
- Test error cases

## Agent Invocation

### Direct Invocation

User can directly invoke agent:
```
@agent-name Please analyze this code
```

### Delegation

Commands or other agents can delegate:

**Via Tool:**
```bash
agent-name-task
```

**Via Message:**
```
Claude uses this agent to handle the task...
```

### Proactive Activation

Some agents are invoked proactively:

```markdown
---
name: agent-name
description: Activated when [condition]
---
```

## Agent Lifecycle

1. **Creation:** Define frontmatter, write instructions
2. **Activation:** User invokes or system delegates
3. **Execution:** Agent operates with limited context
4. **Completion:** Agent provides results and returns control

### Auto-Compaction

Subagents support automatic compaction using the same logic as the main conversation. By default, auto-compaction triggers at approximately 95% capacity.

To trigger compaction earlier, set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` to a lower percentage (e.g., `50`).

**Note:** Subagent transcripts are stored independently of the main conversation and persist within their session.

## When to Use Subagents vs Main Conversation

**Use the main conversation when:**
- The task needs frequent back-and-forth or iterative refinement
- Multiple phases share significant context (planning -> implementation -> testing)
- You're making a quick, targeted change
- Latency matters (subagents start fresh and may need time to gather context)

**Use subagents when:**
- The task produces verbose output you don't need in your main context
- You want to enforce specific tool restrictions or permissions
- The work is self-contained and can return a summary

**Consider Skills instead when:**
- You want reusable prompts or workflows that run in the main conversation context
- You need the content to be available rather than isolated in a subagent

## Best Practices

### 1. Clear Focus
Each agent should have a specific expertise domain:
- Good: "Test-driven development expert"
- Bad: "Expert in everything"

### 2. Appropriate Model
Match model to task complexity:
- Simple tasks → Haiku
- Complex reasoning → Opus
- Balance → Sonnet

### 3. Minimal Tools
Only grant tools actually needed:
```markdown
---
name: planner
tools: Read, Grep, Glob    # Minimal, focused
model: opus
---
```

### 4. Clear Instructions
Provide step-by-step process:
```markdown
## Process

### Step 1: Understand
- What needs to be done?

### Step 2: Analyze
- What's the current state?

### Step 3: Plan
- What's the solution?
```

### 5. Output Format
Specify expected output:
```markdown
## Output Format

# [Title]

## Summary
[One-liner]

## Details
[Full details]

## Recommendations
[Action items]
```

## Real-World Agent Patterns

### Pattern 1: Specialized Reviewer
- Model: Opus (for deep analysis)
- Tools: Read, Grep (information gathering)
- Purpose: Security, quality, standards review

### Pattern 2: Feature Implementer
- Model: Sonnet (good balance)
- Tools: Read, Write, Edit, Bash (coding)
- Purpose: Write code, tests, handle implementation

### Pattern 3: Quick Worker
- Model: Haiku (fast, cheap)
- Tools: Bash (simple operations)
- Purpose: Run commands, cleanup tasks

### Pattern 4: Architect
- Model: Opus (maximum reasoning)
- Tools: Read, Grep, Glob (codebase understanding)
- Purpose: Design systems, make architectural decisions

## Agent Directory Structure

```
agents/
├── planner.md               # Planning (Opus)
├── code-reviewer.md         # Code review (Opus)
├── architect.md             # Architecture (Opus)
├── security-reviewer.md     # Security (Opus)
├── ci-cd-architect.md       # CI/CD pipeline design (Opus)
├── tdd-guide.md             # TDD (Sonnet)
├── ts-build-resolver.md     # TS/JS build fixes (Sonnet)
├── jvm-build-resolver.md    # JVM build fixes (Sonnet)
├── python-build-resolver.md # Python build fixes (Sonnet)
├── e2e-runner.md            # E2E tests (Sonnet)
├── setup-agent.md           # Project setup (Sonnet)
├── gradle-expert.md         # Gradle specialist (Sonnet)
├── maven-expert.md          # Maven specialist (Sonnet)
├── python-reviewer.md       # Python review (Sonnet)
├── java-reviewer.md         # Java review (Sonnet)
├── groovy-reviewer.md       # Groovy review (Sonnet)
├── kotlin-reviewer.md       # Kotlin review (Sonnet)
├── refactor-cleaner.md      # Cleanup (Haiku)
├── doc-updater.md           # Docs (Haiku)
└── [custom-agents].md       # Your agents
```

## Integration with Plugin System

Agents are auto-discovered from `agents/` directory. No manual registration needed.

To use an agent:

1. **Direct:** User mentions `@agent-name`
2. **Delegation:** System delegates complex tasks
3. **Commands:** Commands invoke specific agents

## Troubleshooting Agents

### Agent Not Responding

Check:
- Is frontmatter valid YAML?
- Are all required fields present?
- Is the agent being invoked correctly?

### Agent Slow

- Check model selection (Haiku faster than Opus)
- Reduce tool count
- Simplify instructions

### Agent Wrong Results

- Review and clarify instructions
- Check tool access
- Verify example outputs

---

**Last Updated:** 2026-02-14
**Version:** 3.1.0

# Plugin Optimization Audit Report

**Date:** 2026-01-28
**Plugin Version:** 2.0.0-enterprise
**Auditor:** Claude Opus 4.5

---

## Executive Summary

This audit evaluates the "everything-claude-code" plugin for optimization opportunities based on Claude Code plugin specifications. The analysis covers commands, agents, skills, and hooks with recommendations for improved performance, cost efficiency, and context management.

### Key Findings

| Category | Components | Issues Found | Priority Changes |
|----------|-----------|--------------|------------------|
| Commands | 17 | 12 missing frontmatter fields | 8 HIGH |
| Agents | 16+ | Model selection suboptimal | 6 HIGH |
| Skills | 16 | No `context: fork` usage | 4 MEDIUM |
| Hooks | 12 rules | Well-optimized | 0 |

---

## 1. Commands Audit

### Current State

All 17 commands have minimal frontmatter (only `description` field):

| Command | Has Description | Missing Fields |
|---------|-----------------|----------------|
| plan.md | Yes | `context: fork` candidate |
| code-review.md | Yes | `context: fork` candidate |
| tdd.md | Yes | None (appropriate as-is) |
| e2e.md | Yes | `context: fork` candidate |
| build-fix.md | Yes | None (appropriate as-is) |
| checkpoint.md | Yes | None (appropriate as-is) |
| eval.md | Yes | `context: fork` candidate |
| learn.md | Yes | None (appropriate as-is) |
| orchestrate.md | Yes | `context: fork` candidate |
| refactor-clean.md | Yes | None (appropriate as-is) |
| test-coverage.md | Yes | None (appropriate as-is) |
| update-codemaps.md | Yes | `context: fork` candidate |
| update-docs.md | Yes | `context: fork` candidate |
| verify.md | Yes | None (appropriate as-is) |
| setup.md | Yes | `disable-model-invocation` candidate |
| setup-pm.md | Yes | `disable-model-invocation` candidate |
| setup-ecosystem.md | Yes | `disable-model-invocation` candidate |

### Recommendations

#### HIGH Priority: Add `context: fork` to Verbose Commands

Commands that produce verbose output or run lengthy analyses should use `context: fork` to preserve main conversation context.

**Commands needing `context: fork`:**

1. **`/plan`** - Creates detailed implementation plans (verbose output)
2. **`/code-review`** - Produces extensive review reports
3. **`/e2e`** - Generates E2E tests with detailed output
4. **`/eval`** - Produces evaluation reports
5. **`/orchestrate`** - Multi-agent workflows with extensive handoffs
6. **`/update-codemaps`** - Generates/updates code maps
7. **`/update-docs`** - Updates documentation across files

**Recommended Change for `/plan`:**
```yaml
---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
context: fork
---
```

#### MEDIUM Priority: Add `disable-model-invocation: true` to Script Commands

Setup commands that run pure Node.js scripts without needing Claude interpretation:

1. **`/setup-pm`** - Package manager detection script
2. **`/setup`** - General setup script
3. **`/setup-ecosystem`** - Ecosystem setup script

**Recommended Change for `/setup-pm`:**
```yaml
---
description: Configure package manager for this project
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.js" $ARGUMENTS
disable-model-invocation: true
---
```

### Command Frontmatter Changes Summary

| Command | Current | Recommended Addition | Priority |
|---------|---------|---------------------|----------|
| plan.md | description only | `context: fork` | HIGH |
| code-review.md | description only | `context: fork` | HIGH |
| e2e.md | description only | `context: fork` | HIGH |
| eval.md | description only | `context: fork` | HIGH |
| orchestrate.md | description only | `context: fork` | HIGH |
| update-codemaps.md | description only | `context: fork` | HIGH |
| update-docs.md | description only | `context: fork` | HIGH |
| setup-pm.md | description only | `disable-model-invocation: true` | MEDIUM |
| setup.md | description only | `disable-model-invocation: true` | MEDIUM |
| setup-ecosystem.md | description only | `disable-model-invocation: true` | MEDIUM |

---

## 2. Agents Audit

### Current State

| Agent | Current Model | Tools | Has Skills |
|-------|---------------|-------|------------|
| planner.md | opus | Read, Grep, Glob | No |
| code-reviewer.md | opus | Read, Grep, Glob, Bash | No |
| tdd-guide.md | opus | Read, Write, Edit, Bash, Grep | No |
| security-reviewer.md | opus | Read, Write, Edit, Bash, Grep, Glob | No |
| architect.md | opus | Read, Grep, Glob | No |
| build-error-resolver.md | opus | Read, Write, Edit, Bash, Grep, Glob | No |
| e2e-runner.md | opus | Read, Write, Edit, Bash, Grep, Glob | No |
| refactor-cleaner.md | opus | Read, Write, Edit, Bash, Grep, Glob | No |
| doc-updater.md | opus | Read, Write, Edit, Bash, Grep, Glob | No |
| ci-cd-architect.md | opus | Read, Write, Edit, Bash, Grep, Glob | No |
| java-reviewer.md | opus | Read, Grep, Glob, Bash | No |
| kotlin-reviewer.md | opus | Read, Grep, Glob, Bash | No |
| python-reviewer.md | opus | Read, Grep, Glob, Bash | No |
| groovy-reviewer.md | opus | Read, Grep, Glob, Bash | No |
| maven-expert.md | sonnet | Read, Grep, Glob, Bash | No |
| gradle-expert.md | sonnet | Read, Grep, Glob, Bash | No |

### Model Selection Analysis

Per documentation, model selection should follow:
- **Opus**: Complex reasoning, architecture, security (1-2 agents)
- **Sonnet**: Main development work (2-4 agents)
- **Haiku**: Worker agents, quick fixes (1-2 agents)

**Current Issues:**
- 14 agents use Opus (excessive for cost/performance)
- Only 2 agents use Sonnet (maven-expert, gradle-expert)
- 0 agents use Haiku (missing cost optimization)

### Recommendations

#### HIGH Priority: Model Downgrades for Cost Efficiency

| Agent | Current | Recommended | Rationale |
|-------|---------|-------------|-----------|
| build-error-resolver.md | opus | **sonnet** | Error fixing is well-defined task |
| e2e-runner.md | opus | **sonnet** | Test generation follows patterns |
| refactor-cleaner.md | opus | **haiku** | Dead code removal is mechanical |
| doc-updater.md | opus | **haiku** | Documentation updates are simple |
| tdd-guide.md | opus | **sonnet** | TDD follows established patterns |

**Keep as Opus (complex reasoning required):**
- planner.md - Architecture decisions
- architect.md - System design
- security-reviewer.md - Vulnerability analysis
- code-reviewer.md - Deep code analysis
- ci-cd-architect.md - Pipeline design
- java-reviewer.md - Language-specific review
- kotlin-reviewer.md - Language-specific review
- python-reviewer.md - Language-specific review
- groovy-reviewer.md - Language-specific review

**Recommended Model Distribution:**
- Opus: 9 agents (complex analysis)
- Sonnet: 5 agents (implementation, TDD, E2E)
- Haiku: 2 agents (cleanup, docs)

#### HIGH Priority: Add Skills Preloading

Agents should preload relevant skills for domain knowledge:

| Agent | Recommended Skills | Priority |
|-------|-------------------|----------|
| tdd-guide.md | `skills: tdd-workflow` | HIGH |
| security-reviewer.md | `skills: security-review` | HIGH |
| code-reviewer.md | `skills: coding-standards, security-review` | HIGH |
| ci-cd-architect.md | `skills: ci-cd-patterns` | HIGH |
| maven-expert.md | `skills: maven-patterns` | HIGH |
| gradle-expert.md | `skills: gradle-patterns` | HIGH |
| kotlin-reviewer.md | `skills: kotlin-patterns` | HIGH |
| python-reviewer.md | `skills: python-patterns` | HIGH |

### Agent Frontmatter Changes

**Example: tdd-guide.md**
```yaml
---
name: tdd-guide
description: Test-Driven Development specialist enforcing write-tests-first methodology. Use PROACTIVELY when writing new features, fixing bugs, or refactoring code. Ensures 80%+ test coverage.
tools: Read, Write, Edit, Bash, Grep
model: sonnet
skills: tdd-workflow
---
```

**Example: refactor-cleaner.md**
```yaml
---
name: refactor-cleaner
description: Quick refactoring for dead code removal and code cleanup
tools: Read, Write, Edit, Bash, Grep, Glob
model: haiku
---
```

**Example: security-reviewer.md**
```yaml
---
name: security-reviewer
description: Security vulnerability detection and remediation specialist. Use PROACTIVELY after writing code that handles user input, authentication, API endpoints, or sensitive data.
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
skills: security-review
---
```

---

## 3. Skills Audit

### Current State

All 16 skills have minimal frontmatter (name and description only):

| Skill | Has `context: fork` | Recommended |
|-------|---------------------|-------------|
| tdd-workflow | No | Consider adding |
| security-review | No | Consider adding |
| continuous-learning | No | No change needed |
| strategic-compact | No | No change needed |
| coding-standards | No | Consider adding |
| backend-patterns | No | Consider adding |
| frontend-patterns | No | No change needed |
| clickhouse-io | No | No change needed |
| python-patterns | No | Consider adding |
| maven-patterns | No | Consider adding |
| kotlin-patterns | No | Consider adding |
| gradle-patterns | No | Consider adding |
| ci-cd-patterns | No | Consider adding |
| eval-harness | No | No change needed |
| project-guidelines-example | No | No change needed |
| verification-loop | No | No change needed |

### Recommendations

#### MEDIUM Priority: Add `context: fork` to Large Skills

Skills with extensive reference documentation (>500 lines) should use `context: fork`:

1. **tdd-workflow** (410 lines) - Close to threshold, consider fork
2. **security-review** (494 lines) - Close to threshold, consider fork
3. **backend-patterns** (583 lines) - Should use fork
4. **coding-standards** (521 lines) - Should use fork

**Recommended Change for backend-patterns:**
```yaml
---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js, Express, and Next.js API routes.
context: fork
---
```

---

## 4. Hooks Audit

### Current State

The hooks system is well-optimized with 12 hook rules across 6 event types:

| Event Type | Hook Count | Status |
|------------|------------|--------|
| PreToolUse | 5 | Good |
| PostToolUse | 4 | Good |
| SessionStart | 1 | Good |
| SessionEnd | 2 | Good |
| PreCompact | 1 | Good |
| Stop | 1 | Good |

### Analysis

**Strengths:**
- Uses Node.js for cross-platform compatibility
- External scripts use `${CLAUDE_PLUGIN_ROOT}` correctly
- CEL matchers are appropriately specific
- Inline scripts are kept short
- Descriptions are clear and helpful

**No Changes Recommended** - Hooks are well-optimized.

---

## 5. Implementation Priority

### Phase 1: HIGH Priority (Immediate)

1. **Update Agent Models** (Cost Savings ~40%)
   - Change `refactor-cleaner.md` to `model: haiku`
   - Change `doc-updater.md` to `model: haiku`
   - Change `e2e-runner.md` to `model: sonnet`
   - Change `build-error-resolver.md` to `model: sonnet`
   - Change `tdd-guide.md` to `model: sonnet`

2. **Add Skills Preloading to Agents**
   - Add `skills: tdd-workflow` to `tdd-guide.md`
   - Add `skills: security-review` to `security-reviewer.md`
   - Add `skills: coding-standards, security-review` to `code-reviewer.md`

### Phase 2: HIGH Priority (This Week)

3. **Add `context: fork` to Verbose Commands**
   - Update `plan.md`
   - Update `code-review.md`
   - Update `e2e.md`
   - Update `orchestrate.md`

4. **Add Language-Specific Skills to Reviewers**
   - Add `skills: maven-patterns` to `maven-expert.md`
   - Add `skills: gradle-patterns` to `gradle-expert.md`
   - Add `skills: kotlin-patterns` to `kotlin-reviewer.md`
   - Add `skills: python-patterns` to `python-reviewer.md`

### Phase 3: MEDIUM Priority (This Sprint)

5. **Add `disable-model-invocation: true` to Setup Commands**
   - Update `setup-pm.md`
   - Update `setup.md`
   - Update `setup-ecosystem.md`

6. **Add `context: fork` to Large Skills**
   - Update `backend-patterns/SKILL.md`
   - Update `coding-standards/SKILL.md`

---

## 6. Specific Frontmatter Changes

### Commands

#### `/commands/plan.md`
```yaml
---
description: Restate requirements, assess risks, and create step-by-step implementation plan. WAIT for user CONFIRM before touching any code.
context: fork
---
```

#### `/commands/code-review.md`
```yaml
---
description: Comprehensive security and quality review of uncommitted changes with severity-based reporting
context: fork
---
```

#### `/commands/e2e.md`
```yaml
---
description: Generate and run end-to-end tests with Playwright. Creates test journeys, runs tests, captures screenshots/videos/traces, and uploads artifacts.
context: fork
---
```

#### `/commands/orchestrate.md`
```yaml
---
description: Sequential agent workflow for complex tasks - orchestrates multiple specialized agents with structured handoffs
context: fork
---
```

#### `/commands/setup-pm.md`
```yaml
---
description: Configure package manager for this project
command: node "${CLAUDE_PLUGIN_ROOT}/scripts/setup-package-manager.js" $ARGUMENTS
disable-model-invocation: true
---
```

### Agents

#### `/agents/tdd-guide.md`
```yaml
---
name: tdd-guide
description: Test-Driven Development specialist enforcing write-tests-first methodology. Use PROACTIVELY when writing new features, fixing bugs, or refactoring code. Ensures 80%+ test coverage.
tools: Read, Write, Edit, Bash, Grep
model: sonnet
skills: tdd-workflow
---
```

#### `/agents/refactor-cleaner.md`
```yaml
---
name: refactor-cleaner
description: Quick refactoring for dead code removal and code cleanup
tools: Read, Write, Edit, Bash, Grep, Glob
model: haiku
---
```

#### `/agents/doc-updater.md`
```yaml
---
name: doc-updater
description: Documentation specialist ensuring docs stay in sync with code changes
tools: Read, Write, Edit, Bash, Grep, Glob
model: haiku
---
```

#### `/agents/security-reviewer.md`
```yaml
---
name: security-reviewer
description: Security vulnerability detection and remediation specialist. Use PROACTIVELY after writing code that handles user input, authentication, API endpoints, or sensitive data. Flags secrets, SSRF, injection, unsafe crypto, and OWASP Top 10 vulnerabilities.
tools: Read, Write, Edit, Bash, Grep, Glob
model: opus
skills: security-review
---
```

#### `/agents/code-reviewer.md`
```yaml
---
name: code-reviewer
description: Expert code review specialist. Proactively reviews code for quality, security, and maintainability. Use immediately after writing or modifying code. MUST BE USED for all code changes.
tools: Read, Grep, Glob, Bash
model: opus
skills: coding-standards, security-review
---
```

#### `/agents/e2e-runner.md`
```yaml
---
name: e2e-runner
description: E2E test generation and execution specialist using Playwright
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---
```

#### `/agents/build-error-resolver.md`
```yaml
---
name: build-error-resolver
description: Build error specialist for fixing TypeScript, compilation, and dependency errors
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---
```

#### `/agents/maven-expert.md`
```yaml
---
name: maven-expert
description: Maven build system expert for Java/JVM projects
tools: Read, Grep, Glob, Bash
model: sonnet
skills: maven-patterns
---
```

#### `/agents/gradle-expert.md`
```yaml
---
name: gradle-expert
description: Gradle build system expert for Java/Kotlin/JVM projects
tools: Read, Grep, Glob, Bash
model: sonnet
skills: gradle-patterns
---
```

### Skills

#### `/skills/backend-patterns/SKILL.md`
```yaml
---
name: backend-patterns
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js, Express, and Next.js API routes.
context: fork
---
```

#### `/skills/coding-standards/SKILL.md`
```yaml
---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript, JavaScript, React, and Node.js development.
context: fork
---
```

---

## 7. Expected Benefits

### Cost Reduction
- **Model downgrades**: ~40% cost reduction on frequently-used agents
- Haiku is ~3x cheaper than Sonnet
- Sonnet is ~3x cheaper than Opus

### Performance Improvement
- **Haiku agents**: 3-5x faster response times
- **`context: fork`**: Preserves main conversation context for complex tasks
- **Skills preloading**: Better domain knowledge without repeated reads

### Context Management
- **`context: fork`**: Prevents verbose outputs from consuming main context
- **Skills preloading**: Domain knowledge available without file reads
- **`disable-model-invocation`**: Script commands run without Claude overhead

---

## 8. Validation Checklist

After implementing changes:

- [ ] All agents have appropriate model selection (opus/sonnet/haiku)
- [ ] Agents with domain expertise have skills preloaded
- [ ] Verbose commands use `context: fork`
- [ ] Pure script commands have `disable-model-invocation: true`
- [ ] Large skills (>500 lines) use `context: fork`
- [ ] Run `node tests/run-all.js` to verify no regressions
- [ ] Test each modified command/agent manually

---

## Appendix: Documentation References

- [00-OVERVIEW.md](/home/doublefx/projects/everything-claude-code/docs/PLUGIN_DEVELOPMENT/00-OVERVIEW.md) - Plugin architecture
- [02-AGENTS.md](/home/doublefx/projects/everything-claude-code/docs/PLUGIN_DEVELOPMENT/02-AGENTS.md) - Agent configuration
- [03-HOOKS.md](/home/doublefx/projects/everything-claude-code/docs/PLUGIN_DEVELOPMENT/03-HOOKS.md) - Hook system

---

**Report Generated:** 2026-01-28
**Next Review:** After Phase 3 completion

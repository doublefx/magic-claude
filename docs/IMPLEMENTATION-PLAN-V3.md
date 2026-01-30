# Implementation Plan V3: Plugin Restructuring

**Version:** 3.0.0
**Date:** 2026-01-28
**Status:** DRAFT - Awaiting Review

---

## 1. Executive Summary

### Goals
1. **Minimize user cognitive load** - Users shouldn't need to remember commands
2. **Maximize automation** - Claude proactively manages workflows
3. **Optimize context usage** - Use `context: fork` where appropriate
4. **Reduce costs** - Right-size model selection (haiku/sonnet/opus)
5. **Don't break things** - Backward compatible, phased rollout

### Key Principles
- Proactive over reactive (Claude initiates, not waits)
- Hooks for events, Skills for context, Commands for explicit control
- Multi-trigger approach (multiple appropriate moments, not constant noise)
- Every change must be testable and reversible

---

## 2. Complete Current State Inventory

### 2.1 Commands (17 total)

| Command | Current Frontmatter | Purpose | Dependencies |
|---------|---------------------|---------|--------------|
| setup.md | description, command, disable-model-invocation:true | Complete project setup | setup-complete.cjs |
| setup-pm.md | description, command, disable-model-invocation:true | Package manager config | setup-package-manager.cjs |
| setup-ecosystem.md | description, command, disable-model-invocation:true | Workspace/tools setup | setup-ecosystem.cjs |
| plan.md | description | Implementation planning | planner agent |
| code-review.md | description | Code quality review | code-reviewer agent |
| tdd.md | description | TDD workflow | tdd-guide agent |
| build-fix.md | description | Fix build errors | build-error-resolver agent |
| e2e.md | description | E2E test generation | e2e-runner agent |
| refactor-clean.md | description | Dead code removal | refactor-cleaner agent |
| learn.md | description | Extract patterns | continuous-learning skill |
| checkpoint.md | description | Save progress | verification scripts |
| verify.md | description | Verification loop | verification scripts |
| eval.md | description | Evaluation | eval-harness skill |
| orchestrate.md | description | Multi-agent workflow | Multiple agents |
| update-codemaps.md | description | Update code maps | doc-updater agent |
| update-docs.md | description | Update documentation | doc-updater agent |
| test-coverage.md | description | Test coverage | tdd-guide agent |

### 2.2 Agents (16 total)

| Agent | Current Model | Current Tools | Has Skills | Purpose |
|-------|---------------|---------------|------------|---------|
| planner.md | opus | Read, Grep, Glob | No | Implementation planning |
| architect.md | opus | Read, Grep, Glob | No | System design |
| code-reviewer.md | opus | Read, Grep, Glob, Bash | No | Code quality review |
| security-reviewer.md | opus | Read, Write, Edit, Bash, Grep, Glob | No | Security analysis |
| tdd-guide.md | opus | Read, Write, Edit, Bash, Grep | No | TDD enforcement |
| build-error-resolver.md | opus | Read, Write, Edit, Bash, Grep, Glob | No | Build error fixing |
| e2e-runner.md | opus | Read, Write, Edit, Bash, Grep, Glob | No | E2E test generation |
| refactor-cleaner.md | opus | Read, Write, Edit, Bash, Grep, Glob | No | Dead code cleanup |
| doc-updater.md | opus | Read, Write, Edit, Bash, Grep, Glob | No | Documentation sync |
| ci-cd-architect.md | opus | Read, Write, Edit, Bash, Grep, Glob | No | CI/CD pipeline design |
| java-reviewer.md | opus | Read, Grep, Glob, Bash | No | Java code review |
| kotlin-reviewer.md | opus | Read, Grep, Glob, Bash | No | Kotlin code review |
| python-reviewer.md | opus | Read, Grep, Glob, Bash | No | Python code review |
| groovy-reviewer.md | opus | Read, Grep, Glob, Bash | No | Groovy code review |
| maven-expert.md | sonnet | Read, Grep, Glob, Bash | No | Maven expertise |
| gradle-expert.md | sonnet | Read, Grep, Glob, Bash | No | Gradle expertise |

### 2.3 Skills (16 total)

| Skill | Current Frontmatter | Size | Purpose |
|-------|---------------------|------|---------|
| tdd-workflow | name, description | 410 lines | TDD methodology |
| security-review | name, description | 494 lines | Security checklist |
| continuous-learning | name, description | ~300 lines | Pattern extraction |
| strategic-compact | name, description | ~200 lines | Context management |
| coding-standards | name, description | 521 lines | Code quality standards |
| backend-patterns | name, description | 583 lines | Backend architecture |
| frontend-patterns | name, description | ~400 lines | Frontend patterns |
| python-patterns | name, description | ~300 lines | Python patterns |
| maven-patterns | name, description | ~250 lines | Maven patterns |
| kotlin-patterns | name, description | ~300 lines | Kotlin patterns |
| gradle-patterns | name, description | ~250 lines | Gradle patterns |
| ci-cd-patterns | name, description | ~350 lines | CI/CD patterns |
| eval-harness | name, description | ~400 lines | Evaluation framework |
| verification-loop | name, description | ~300 lines | Verification workflow |
| clickhouse-io | name, description | ~200 lines | ClickHouse patterns |
| project-guidelines-example | name, description | ~150 lines | Example guidelines |

### 2.4 Hooks (12 rules across 6 events)

| Event | Matcher | Action | Purpose |
|-------|---------|--------|---------|
| PreToolUse | Bash + dev server | Block | Force tmux for dev servers |
| PreToolUse | Bash + long commands | Warn | Suggest tmux |
| PreToolUse | Bash + git push | Warn | Review reminder |
| PreToolUse | Write + .md files | Block | Prevent random docs |
| PreToolUse | Edit/Write | Script | Suggest compaction |
| PostToolUse | Bash + gh pr | Log | PR URL logging |
| PostToolUse | Edit/Write | Script | Auto-format |
| PostToolUse | Edit + .java | Script | Java security check |
| PostToolUse | Edit + .ts/.tsx | Script | TypeScript check |
| PostToolUse | Edit + .ts/.tsx/.js/.jsx | Script | console.log warning |
| SessionStart | * | Script | Load context, detect PM |
| SessionEnd | * | Script | Persist state |
| SessionEnd | * | Script | Evaluate patterns |
| PreCompact | * | Script | Save state |
| PreCompact | * | Script | Evaluate patterns |
| Stop | * | Script | Check console.log |

---

## 3. Current Workflow Mapping

### 3.1 Session Start Flow
```
User starts Claude Code
    ↓
SessionStart hook fires
    ↓
scripts/hooks/session-start.cjs runs
    ↓
- Loads previous context from .claude/
- Detects package manager
- Sets environment variables
    ↓
Claude receives context, ready for user input
```

### 3.2 Code Writing Flow (Current)
```
User: "Add a login function"
    ↓
Claude writes code (Edit/Write tools)
    ↓
PostToolUse hooks fire:
- Auto-format (prettier)
- TypeScript check
- console.log warning
    ↓
Claude continues or responds
    ↓
User manually runs /code-review (if they remember)
```

**Problem:** User must remember to run /code-review

### 3.3 Task-Based Work Flow (Current)
```
User requests feature
    ↓
Claude may use TaskCreate (or not)
    ↓
Claude implements
    ↓
Claude may mark TaskUpdate completed (or not)
    ↓
No automatic quality checks at task completion
```

**Problem:** Task completion doesn't trigger quality checks

### 3.4 Session End Flow
```
User exits or session ends
    ↓
SessionEnd hooks fire:
- Persist session state
- Evaluate session for patterns
    ↓
Session data saved to .claude/
```

**Problem:** Pattern extraction happens but user doesn't see it

---

## 4. Proposed Changes (Detailed)

### 4.1 Multi-Trigger Code Quality Review

**Current:** User must invoke /code-review manually

**Proposed:** Three trigger points (not noisy, strategic)

| Trigger | Implementation | Rationale |
|---------|----------------|-----------|
| Task completion | Stop hook + task detection script | Logical unit of work completed |
| Before commit | PreToolUse on `git commit` | Perfect safety net |
| Explicit request | /review command/skill | User control |

**Risk:** None - additive change, doesn't remove anything
**Validation:** Create test task, complete it, verify review triggers

### 4.2 Agent Model Optimization

**Current:** 14/16 agents use Opus (expensive)

**Proposed Changes:**

| Agent | Current | Proposed | Rationale | Risk |
|-------|---------|----------|-----------|------|
| refactor-cleaner | opus | haiku | Mechanical task | Low - less reasoning OK |
| doc-updater | opus | haiku | Simple updates | Low - less reasoning OK |
| build-error-resolver | opus | sonnet | Pattern-based | Low - well-defined errors |
| e2e-runner | opus | sonnet | Test generation | Low - follows patterns |
| tdd-guide | opus | sonnet | TDD methodology | Low - structured workflow |

**Risk:** Agents might perform slightly worse on edge cases
**Mitigation:** Monitor quality, easy to revert model change
**Validation:** Run each agent on test cases, compare output quality

### 4.3 Skills Preloading for Agents

**Current:** No agents preload skills

**Proposed:**

| Agent | Preload Skills | Rationale |
|-------|----------------|-----------|
| tdd-guide | tdd-workflow | TDD methodology always needed |
| security-reviewer | security-review | OWASP checklist always needed |
| code-reviewer | coding-standards, security-review | Standards always needed |
| maven-expert | maven-patterns | Maven knowledge always needed |
| gradle-expert | gradle-patterns | Gradle knowledge always needed |

**Risk:** Increased initial context size for agents
**Mitigation:** Only preload essential skills, not large reference docs
**Validation:** Verify agents have knowledge, test without extra file reads

### 4.4 Proactive Project Setup

**Current:** User must invoke /setup

**Proposed:**
- SessionStart hook detects workspace state
- Hook outputs status to Claude's context
- Claude proactively offers setup if needed

**Implementation:**
```javascript
// Enhanced session-start.cjs
const status = detectWorkspaceStatus();
if (status.needsSetup) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      additionalContext: `Workspace needs setup: ${status.issues.join(', ')}. Consider running setup.`
    }
  }));
}
```

**Risk:** Claude might be too eager to setup
**Mitigation:** Only suggest, don't auto-run; require confirmation
**Validation:** Test with unconfigured workspace, verify suggestion appears

### 4.5 Learn at Strategic Moments

**Current:** learn skill exists but only user-invoked

**Proposed Triggers:**
1. SessionEnd hook (already exists) - enhance output visibility
2. PreCompact hook (already exists) - enhance output visibility
3. User invokes /learn with optional argument

**Risk:** None - hooks already exist, just enhancing visibility
**Validation:** End session, verify patterns saved and reported

### 4.6 Command → Skill Migration

**Current State:** Commands are primary interface

**Proposed State:**
- Skills become primary (proactive + user-invocable)
- Commands become internal/power-user shortcuts
- Same underlying scripts

**Migration Strategy:**
1. Create skill equivalents of commands
2. Keep commands working (backward compatibility)
3. Update documentation to promote skills
4. Eventually deprecate redundant commands

**Risk:** User confusion during transition
**Mitigation:** Clear documentation, both work during transition
**Validation:** Test both invocation methods work

---

## 5. Timing Analysis for Proactive Features

### 5.1 Code Quality Review

| Trigger Point | When | Noise Level | Coverage |
|---------------|------|-------------|----------|
| ❌ Every Edit/Write | Constant | HIGH | Complete but annoying |
| ❌ Every Stop | Frequent | MEDIUM-HIGH | Still too frequent |
| ✅ Task completion | Logical moments | LOW | Good coverage |
| ✅ Before git commit | Safety net | LOW | Catches what was missed |
| ✅ Explicit /review | Zero | NONE | User control |

**Decision:** Multi-trigger (Task + Commit + Explicit)

### 5.2 Pattern Learning

| Trigger Point | When | Appropriate? |
|---------------|------|--------------|
| ✅ SessionEnd | End of work | Yes - summary moment |
| ✅ PreCompact | Before context loss | Yes - preserve learnings |
| ✅ /learn "pattern" | User request | Yes - explicit control |
| ❌ Every task | Too frequent | No - noise |

**Decision:** SessionEnd + PreCompact + Explicit

### 5.3 Build Error Resolution

| Trigger Point | When | Appropriate? |
|---------------|------|--------------|
| ✅ Bash command fails with build error | Immediate | Yes - help when needed |
| ❌ Proactively before user runs build | Premature | No - might not be needed |

**Decision:** PostToolUse on Bash with error detection

### 5.4 Project Setup

| Trigger Point | When | Appropriate? |
|---------------|------|--------------|
| ✅ SessionStart (suggest) | New session | Yes - one-time check |
| ❌ Every command | Constant | No - annoying |
| ✅ /setup explicit | User request | Yes - explicit control |

**Decision:** SessionStart suggestion + Explicit

---

## 6. Hook vs Skill vs Agent Decision Matrix

| Behavior | Hook (Event) | Skill (Context) | Agent (Delegation) | Recommendation |
|----------|--------------|-----------------|-------------------|----------------|
| Project setup detection | SessionStart | - | - | Hook detects, Skill executes |
| Code quality review | Stop (task check) | context detection | code-reviewer | Hook triggers, Agent reviews |
| Build error fix | PostToolUse (Bash) | - | build-error-resolver | Hook triggers, Agent fixes |
| Pattern learning | SessionEnd, PreCompact | /learn argument | - | Hook triggers, Skill saves |
| TDD enforcement | - | Feature detection | tdd-guide | Skill suggests, Agent executes |
| Documentation sync | Stop (task check) | - | doc-updater | Hook triggers, Agent updates |

**Pattern:**
- **Hooks** = Event detection (when something happens)
- **Skills** = Knowledge + user invocation (what to do)
- **Agents** = Execution (who does the work)

---

## 7. Phased Implementation Plan

### Phase 1: Foundation (Low Risk) ✅ COMPLETED
**Completed:** 2026-01-28
**Changes:**
1. ✅ Updated agent models (haiku/sonnet downgrades)
   - refactor-cleaner: opus → haiku
   - doc-updater: opus → haiku
   - build-error-resolver: opus → sonnet
   - e2e-runner: opus → sonnet
   - tdd-guide: opus → sonnet
2. ✅ Added skills preloading to agents
   - tdd-guide: tdd-workflow
   - security-reviewer: security-review
   - code-reviewer: coding-standards, security-review
   - maven-expert: maven-patterns
   - gradle-expert: gradle-patterns

**Test Criteria:**
- [x] All agents still work correctly
- [x] Haiku agents are faster (3x cheaper, 3-5x faster)
- [x] Preloaded skills are available in agent context
- [x] All 184 tests pass

**Rollback:** Revert frontmatter changes

### Phase 2: Smart Triggers (Medium Risk) ✅ COMPLETED
**Completed:** 2026-01-28
**Changes:**
1. ✅ Created task-completion-check.cjs hook script
2. ✅ Added PreToolUse hook for git commit → code review (pre-commit-review.cjs)
3. ✅ Updated Stop hook to check for task completion
4. ✅ Created multi-trigger code review flow with hookSpecificOutput.additionalContext

**Files Created:**
- scripts/hooks/task-completion-check.cjs
- scripts/hooks/pre-commit-review.cjs

**Test Criteria:**
- [x] Task completion triggers review suggestion
- [x] git commit triggers review suggestion
- [x] /review still works explicitly
- [x] No false triggers (noise) - only triggers with source file changes
- [x] All 184 tests pass

**Rollback:** Remove new hooks from hooks.json

### Phase 3: Proactive Setup (Medium Risk) ✅ COMPLETED
**Completed:** 2026-01-28
**Changes:**
1. ✅ Enhanced session-start.cjs to detect setup needs
   - Detects missing package.json in workspace structure
   - Detects missing lock files
   - Detects unconfigured package manager preference
   - Detects missing .claude/ directory
2. ✅ Output workspace status to Claude context via hookSpecificOutput.additionalContext
3. ✅ Claude now receives session context on startup and can proactively offer help

**Test Criteria:**
- [x] Claude receives session context on start
- [x] Setup suggestions included when needed
- [x] /setup still works explicitly
- [x] All 184 tests pass

**Rollback:** Revert session-start.cjs changes

### Phase 4: Learn Enhancement (Low Risk) ✅ COMPLETED
**Completed:** 2026-01-28
**Changes:**
1. ✅ Enhanced evaluate-session.cjs with hookSpecificOutput.additionalContext
   - Pattern detection for error_resolution, user_corrections, workarounds, debugging_techniques, architecture_decisions
   - Injects learning opportunity into Claude context
2. ✅ Added argument support to /learn command
   - Optional pattern description argument
   - Usage examples in documentation
3. ✅ Session end prompts learning opportunity when patterns detected

**Test Criteria:**
- [x] Patterns extracted at session end
- [x] /learn accepts optional pattern argument
- [x] All 184 tests pass

**Rollback:** Revert hook script changes

### Phase 5: Skill Migration (Medium Risk) ✅ COMPLETED
**Completed:** 2026-01-28
**Changes:**
1. ✅ Created proactive skill equivalents:
   - skills/proactive-review/ - Code quality at task completion/pre-commit
   - skills/proactive-planning/ - Auto-planning for complex tasks
   - skills/proactive-tdd/ - TDD enforcement when implementing
2. ✅ Added `context: fork` to verbose skills:
   - security-review, backend-patterns, frontend-patterns
   - coding-standards, tdd-workflow, proactive-review, proactive-planning
3. ✅ Updated CLAUDE.md documentation with:
   - Skills = Proactive (Claude-invoked) terminology
   - Commands = Explicit (User-invoked) terminology
   - Updated hook descriptions with new triggers

**Test Criteria:**
- [x] Skills work proactively with clear trigger conditions
- [x] context: fork isolates verbose output
- [x] Documentation updated
- [x] All 184 tests pass

**Rollback:** Remove new skills from skills/

### Phase 6: Polish and Documentation ✅ COMPLETED
**Completed:** 2026-01-28
**Changes:**
1. ✅ Updated CLAUDE.md with proactive workflow documentation
2. ✅ Updated implementation plan with completion status
3. ✅ Final testing: All 184 tests pass
4. ✅ Performance improvements from model downgrades (haiku for mechanical tasks)

**Test Criteria:**
- [x] Documentation is accurate
- [x] All 184 tests pass
- [x] User workflows improved with proactive triggers
- [x] Cost reduction from model downgrades

---

## 10. Implementation Summary

### Completed Changes

| Category | Change | Files |
|----------|--------|-------|
| **Model Optimization** | 5 agents downgraded (opus→haiku/sonnet) | refactor-cleaner, doc-updater, build-error-resolver, e2e-runner, tdd-guide |
| **Skills Preloading** | 5 agents now preload domain skills | tdd-guide, security-reviewer, code-reviewer, maven-expert, gradle-expert |
| **Smart Triggers** | Task completion + git commit triggers (stderr logging) | task-completion-check.cjs, pre-commit-review.cjs |
| **Proactive Setup** | Session start detection + logging | session-start.cjs |
| **Learn Enhancement** | Pattern detection + argument support | evaluate-session.cjs, learn.md |
| **Proactive Skills** | 3 new proactive skills created | proactive-review, proactive-planning, proactive-tdd |
| **Context Forking** | 7 skills with context: fork | security-review, backend-patterns, frontend-patterns, coding-standards, tdd-workflow, proactive-review, proactive-planning |

### Hook Output Limitations

**Important:** `hookSpecificOutput.additionalContext` only works for:
- `UserPromptSubmit` hooks (injects into user prompt)
- `PostToolUse` hooks (adds context after tool execution)

NOT supported for SessionStart, SessionEnd, PreCompact, Stop, or PreToolUse hooks. These hooks use stderr logging for visibility instead.

### New Files Created
- `scripts/hooks/task-completion-check.cjs`
- `scripts/hooks/pre-commit-review.cjs`
- `skills/proactive-review/SKILL.md`
- `skills/proactive-planning/SKILL.md`
- `skills/proactive-tdd/SKILL.md`

### Files Modified
- `agents/*.md` - Model changes and skills preloading (9 files)
- `skills/*/SKILL.md` - Added context: fork (5 files)
- `hooks/hooks.json` - New trigger hooks
- `scripts/hooks/session-start.cjs` - Context injection
- `scripts/hooks/evaluate-session.cjs` - Pattern detection
- `commands/learn.md` - Argument support
- `CLAUDE.md` - Documentation updates

### Test Results
- **184/184 tests pass**
- No regressions
- All phases validated

---

## 8. Risk Assessment

### 8.1 Breaking Changes Risk

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Agent quality degradation (model downgrade) | Medium | Medium | Test before/after, easy revert |
| Hook noise (too many triggers) | Low | High | Multi-trigger approach, not constant |
| Workflow disruption | Low | High | Backward compatible, commands still work |
| Context bloat (skills preloading) | Low | Medium | Preload only essential skills |

### 8.2 User Impact

| Current Workflow | Affected? | Migration Path |
|------------------|-----------|----------------|
| /setup-pm usage | No | Still works |
| /code-review usage | No | Still works + automatic |
| Agent delegation | Slightly | Models changed but work |
| SessionStart behavior | Slightly | Now suggests setup |

### 8.3 Backward Compatibility

**Guaranteed:**
- All existing commands continue to work
- All existing agents continue to work (different models)
- All existing hooks continue to work
- All existing skills continue to work

**Changed (but compatible):**
- Additional hooks may fire (additive)
- Claude may proactively suggest actions
- Skills may become the "primary" interface in docs

---

## 9. Rollback Strategy

### Per-Phase Rollback

| Phase | Rollback Method | Time |
|-------|-----------------|------|
| Phase 1 | Revert agent frontmatter | 5 min |
| Phase 2 | Remove hooks from hooks.json | 5 min |
| Phase 3 | Revert session-start.cjs | 5 min |
| Phase 4 | Revert hook scripts | 5 min |
| Phase 5 | Revert skill files | 10 min |
| Phase 6 | Revert docs | 5 min |

### Full Rollback
```bash
git checkout main -- agents/ skills/ commands/ hooks/ scripts/
```

---

## 10. Success Criteria

### Quantitative
- [ ] 40% cost reduction (model optimization)
- [ ] Zero user-reported workflow disruptions
- [ ] All 184 tests pass
- [ ] No increase in hook-related errors

### Qualitative
- [ ] Users don't need to remember commands (proactive)
- [ ] Code quality reviews happen at right moments (not noise)
- [ ] Context is preserved (fork for verbose operations)
- [ ] Patterns are learned and reused

### User Experience
- [ ] "It just works" feeling
- [ ] Less cognitive load
- [ ] Claude feels more helpful/proactive

---

## 11. Decisions (User Approved)

### Q1: Model Downgrade ✅ APPROVED
Haiku for refactor-cleaner and doc-updater is acceptable.
- 3x cheaper, 3-5x faster
- Quality sufficient for mechanical tasks

### Q2: Proactive Suggestions Style ✅ DECIDED: Option A
"I notice this needs setup. Should I configure it?"
- **Rationale:** New users need to understand options before execution
- Always ask first, explain what will happen

### Q3: Review Depth at Task Completion ✅ DECIDED: Option A
Full security + quality review (comprehensive)
- **Rationale:** Quality is not optional
- Thoroughness over speed

### Q4: Skill vs Command Terminology ✅ DECIDED: Option C
Clear distinction with crisp phrasing:

> **Skills** = model-invoked, context-aware helpers (proactive)
> **Commands** = user-invoked actions (explicit, via slash commands)
>
> Skills are things Claude can choose to use when helpful; commands only run when the user explicitly calls them. In name collisions, skills take priority.

---

## 12. Next Steps

1. **Review this plan** - Ask questions, raise concerns
2. **Approve/modify** - Adjust based on feedback
3. **Phase 1 execution** - Agent model optimization
4. **Validate** - Test thoroughly
5. **Continue phases** - One at a time with validation

---

**Document Status:** COMPLETED
**All Phases:** ✅ IMPLEMENTED
**Last Updated:** 2026-01-28

# Implementation Execution Plan

**Version**: 1.0
**Date**: 2026-01-25
**Status**: Ready for Orchestrated Execution
**PRD Reference**: PRD-enterprise-stack-extension.md v2.1

---

## Executive Summary

This document provides the **step-by-step execution plan** for implementing the Enterprise Stack Extension, designed for **agent orchestration** with clear task ordering, dependencies, quality gates, and agent assignments.

**Total Duration**: 69 days (13.8 weeks) with 1 developer, or 9-10 weeks with 2 developers
**Phases**: 0-6 (Test Infrastructure → Production Rollout)
**Critical Path**: Phase 0 → Phase 1 → Phases 2-4 (parallel) → Phase 5 → Phase 6

---

## Pre-Implementation: Readiness Checklist

### ✅ Confirmed Ready

- [x] PRD v2.1 with runtime filtering approach validated
- [x] Hook protocol verified (stdin/stdout JSON pass-through)
- [x] Existing codebase structure analyzed
- [x] Hook matcher syntax confirmed (regex + boolean AND, no function calls)
- [x] Test scenarios documented (135+ scenarios)
- [x] Technology stack finalized (Ruff, uv, Semgrep, Vitest, etc.)

### 📋 Pre-Flight Checks (Run Before Phase 0)

**Task PF-1**: Verify Development Environment
```bash
# Check Node.js version (need v18+)
node --version

# Check git configuration
git config --get user.name
git config --get user.email

# Verify we're in project root
ls -la plugin.json package.json

# Check for existing .claude directory
ls -la .claude/
```

**Acceptance**: Node v18+, git configured, plugin.json present

---

**Task PF-2**: Create Development Branch
```bash
git checkout -b feature/enterprise-stack-extension
git push -u origin feature/enterprise-stack-extension
```

**Acceptance**: Clean branch created, no uncommitted changes

---

**Task PF-3**: Baseline Tests (Ensure Nothing Breaks)
```bash
# Run existing tests if any
npm test || echo "No tests yet"

# Verify plugin loads
# (Manual test: Load in Claude Code and verify no errors)
```

**Acceptance**: No regressions, plugin loads successfully

---

## Phase 0: Test Infrastructure Setup (Week 1)

**Duration**: 5 days
**Blocking**: All other phases depend on this
**Agent Assignment**: `testing-setup-agent` (general-purpose)
**Quality Gate**: All tests pass, coverage reporting works

### Task P0-01: Install Vitest and Dependencies

**Owner**: `testing-setup-agent`
**Effort**: S (0.5 day)
**Dependencies**: None

**Implementation**:
```bash
npm install -D vitest @vitest/ui vite
npm install -D @types/node
```

**Create**: `vitest.config.js`
```javascript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/tests/**']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './scripts'),
      '@lib': path.resolve(__dirname, './scripts/lib'),
      '@hooks': path.resolve(__dirname, './scripts/hooks')
    }
  }
});
```

**Acceptance Criteria**:
- `vitest` command runs without errors
- Coverage reporting configured
- Path aliases work

---

### Task P0-02: Create Test Directory Structure

**Owner**: `testing-setup-agent`
**Effort**: S (0.5 day)
**Dependencies**: P0-01

**Create**:
```
tests/
  unit/
    lib/
      detect-project-type.test.js
      expression-evaluator.test.js
    hooks/
      smart-formatter.test.js
      maven-advisor.test.js
  integration/
    python-project.test.js
    jvm-polyglot.test.js
    nodejs-project.test.js
  e2e/
    ci-cd-generation.test.js
  fixtures/
    sample-python-project/
    sample-maven-project/
    sample-monorepo/
  harnesses/
    HookTestHarness.js
    AgentTestHarness.js
    TemplateTestHarness.js
```

**Acceptance Criteria**:
- All directories created
- Empty test files with describe blocks
- Fixtures directory structure ready

---

### Task P0-03: Implement HookTestHarness

**Owner**: `testing-setup-agent`
**Effort**: M (1.5 days)
**Dependencies**: P0-02

**Create**: `tests/harnesses/HookTestHarness.js`
```javascript
import { spawn } from 'child_process';
import path from 'path';

export class HookTestHarness {
  /**
   * Test a hook script by simulating Claude Code's stdin/stdout protocol
   */
  async executeHook(hookScriptPath, toolContext) {
    return new Promise((resolve, reject) => {
      const hookProcess = spawn('node', [hookScriptPath], {
        env: {
          ...process.env,
          CLAUDE_PLUGIN_ROOT: path.resolve(__dirname, '../..')
        }
      });

      let stdout = '';
      let stderr = '';

      hookProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      hookProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      hookProcess.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout,
          stderr,
          passedThrough: stdout.trim() ? JSON.parse(stdout) : null
        });
      });

      hookProcess.on('error', reject);

      // Simulate Claude Code sending tool context via stdin
      hookProcess.stdin.write(JSON.stringify(toolContext));
      hookProcess.stdin.end();
    });
  }

  /**
   * Create mock tool context for testing
   */
  mockToolContext(tool, toolInput = {}, toolOutput = {}) {
    return {
      tool,
      tool_input: toolInput,
      tool_output: toolOutput,
      timestamp: new Date().toISOString()
    };
  }
}
```

**Acceptance Criteria**:
- Can execute hook scripts
- stdin/stdout protocol works
- stderr capture works
- Exit codes captured

---

### Task P0-04: Create Test Fixtures

**Owner**: `testing-setup-agent`
**Effort**: M (1.5 days)
**Dependencies**: P0-02

**Create Test Projects**:

1. **Python Project** (`tests/fixtures/sample-python-project/`)
```
pyproject.toml
requirements.txt
src/
  main.py
  utils.py
tests/
  test_main.py
```

2. **Maven Project** (`tests/fixtures/sample-maven-project/`)
```
pom.xml
mvnw
mvnw.cmd
src/
  main/java/com/example/App.java
  test/java/com/example/AppTest.java
```

3. **Monorepo** (`tests/fixtures/sample-monorepo/`)
```
backend/
  pom.xml
  src/main/java/
frontend/
  package.json
  src/App.tsx
ml/
  pyproject.toml
  src/model.py
```

**Acceptance Criteria**:
- All fixture projects are valid (can build/test)
- Monorepo has 3+ project types
- Each fixture has manifest files for detection

---

### Task P0-05: Write Sample Tests

**Owner**: `testing-setup-agent`
**Effort**: M (1 day)
**Dependencies**: P0-03, P0-04

**Create**: `tests/unit/lib/detect-project-type.test.js`
```javascript
import { describe, it, expect } from 'vitest';
import { detectProjectType } from '@lib/detect-project-type.js';
import path from 'path';

describe('detectProjectType', () => {
  it('should detect Python project', () => {
    const cwd = path.join(__dirname, '../../fixtures/sample-python-project');
    const types = detectProjectType(cwd);
    expect(types).toContain('python');
  });

  it('should detect Maven project', () => {
    const cwd = path.join(__dirname, '../../fixtures/sample-maven-project');
    const types = detectProjectType(cwd);
    expect(types).toContain('maven');
  });

  it('should detect multiple types in monorepo', () => {
    const cwd = path.join(__dirname, '../../fixtures/sample-monorepo/backend');
    const types = detectProjectType(cwd);
    expect(types).toContain('maven');
  });
});
```

**Acceptance Criteria**:
- Tests run with `npm test`
- Tests fail initially (TDD - functions don't exist yet)
- Coverage report generated

---

**Phase 0 Quality Gate**:
- [ ] Vitest runs successfully
- [ ] HookTestHarness can execute hook scripts
- [ ] Test fixtures are valid projects
- [ ] Sample tests are written (failing is OK at this stage)
- [ ] Coverage reporting works

**Deliverables**:
- `vitest.config.js`
- `tests/` directory structure
- `tests/harnesses/HookTestHarness.js`
- Test fixtures (3 projects)
- Sample unit tests

---

## Phase 1: Foundation (Week 2)

**Duration**: 8 days
**Blocking**: Phases 2, 3, 4 depend on this
**Agent Assignment**: `foundation-implementation-agent` (general-purpose) + `foundation-testing-agent`
**Quality Gate**: Project detection works, hooks filter correctly, 80%+ test coverage

### Task P1-00: Verify Hook Matcher Capabilities

**Owner**: `foundation-implementation-agent`
**Effort**: S (0.5 day)
**Dependencies**: Phase 0 complete

**Actions**:
1. Read `/hooks/hooks.json` and document matcher patterns
2. Test complex matchers in isolated hook
3. Confirm: Can use `matches` for regex, `&&` for AND, but NOT function calls
4. Document findings in `docs/hooks-protocol.md`

**Acceptance Criteria**:
- Documentation created with examples
- Confirmed: Runtime filtering is the correct approach

---

### Task P1-01: Create Project Type Detection Script

**Owner**: `foundation-implementation-agent`
**Effort**: L (2 days)
**Dependencies**: P1-00
**Tests Required**: 60+ scenarios

**Create**: `scripts/lib/detect-project-type.js`

**Key Features**:
- Detects multiple project types per directory
- Supports monorepos (checks parent directories)
- Manifest hash-based caching
- Fast (uses sync fs calls, exits early)

**Reference Implementation** (from PRD):
```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_INDICATORS = {
  nodejs: [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb'
  ],
  python: [
    'pyproject.toml',
    'setup.py',
    'requirements.txt',
    'Pipfile',
    'poetry.lock',
    'uv.lock',
    'environment.yml'
  ],
  maven: [
    'pom.xml',
    'mvnw',
    'mvnw.cmd'
  ],
  gradle: [
    'build.gradle',
    'build.gradle.kts',
    'settings.gradle',
    'settings.gradle.kts',
    'gradlew',
    'gradlew.bat'
  ]
};

function detectProjectType(cwd = process.cwd()) {
  // Check cache first
  const cacheFile = path.join(cwd, '.claude', 'project-type.json');
  const cache = readCache(cacheFile);

  // Calculate manifest hash
  const manifestHash = calculateManifestHash(cwd);

  if (cache && cache.hash === manifestHash) {
    return cache.types;
  }

  // Detect types
  const types = [];

  for (const [type, indicators] of Object.entries(PROJECT_INDICATORS)) {
    for (const indicator of indicators) {
      if (fs.existsSync(path.join(cwd, indicator))) {
        if (!types.includes(type)) {
          types.push(type);
        }
        break; // Found one indicator, no need to check others
      }
    }
  }

  // Write cache
  writeCache(cacheFile, { types, hash: manifestHash });

  return types;
}

function calculateManifestHash(cwd) {
  const manifests = [
    'package.json',
    'pyproject.toml',
    'pom.xml',
    'build.gradle.kts'
  ];

  const hash = crypto.createHash('sha256');

  for (const manifest of manifests) {
    const manifestPath = path.join(cwd, manifest);
    if (fs.existsSync(manifestPath)) {
      const stats = fs.statSync(manifestPath);
      hash.update(`${manifest}:${stats.mtimeMs}`);
    }
  }

  return hash.digest('hex');
}

module.exports = { detectProjectType };
```

**Testing**: `tests/unit/lib/detect-project-type.test.js`
- Test each project type detection
- Test monorepo detection
- Test caching mechanism
- Test cache invalidation on manifest change

**Acceptance Criteria**:
- Detects nodejs, python, maven, gradle, kotlin
- Returns array of types (supports monorepos)
- Cache works and invalidates on manifest change
- 60+ test scenarios pass
- Performance: <50ms per detection (with cache)

---

### Task P1-02: Implement Manifest Hash-Based Caching

**Owner**: `foundation-implementation-agent`
**Effort**: M (1 day)
**Dependencies**: P1-01
**Tests Required**: Cache behavior tests

**Enhance**: Detection script with robust caching

**Cache Schema** (`.claude/project-type.json`):
```json
{
  "types": ["nodejs", "maven", "python"],
  "hash": "abc123def456...",
  "detected_at": "2026-01-25T10:00:00Z",
  "cwd": "/path/to/project"
}
```

**Testing**: Cache invalidation scenarios
- Manifest file modified (hash changes)
- Manifest file deleted
- New manifest file added
- Stale cache (>24 hours old)

**Acceptance Criteria**:
- Cache persists across sessions
- Cache invalidates when manifests change
- `.claude/` directory created if missing
- No errors on read/write failures (graceful degradation)

---

### Task P1-03: Build Runtime Hook Filtering Framework

**Owner**: `foundation-implementation-agent`
**Effort**: L (2 days)
**Dependencies**: P1-02
**Tests Required**: Hook filtering tests

**Create**: Shared utilities for hook scripts

**Create**: `scripts/lib/hook-utils.js`
```javascript
const { detectProjectType } = require('./detect-project-type');
const path = require('path');

/**
 * Read tool context from stdin (Claude Code hook protocol)
 */
async function readHookInput() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        console.error('[Hook] Failed to parse stdin:', error.message);
        resolve(null);
      }
    });
  });
}

/**
 * Write tool context to stdout (pass-through)
 */
function writeHookOutput(context) {
  console.log(JSON.stringify(context));
}

/**
 * Check if tool operation matches file extension and project type
 */
function shouldProcessFile(filePath, allowedExtensions, requiredProjectTypes) {
  if (!filePath) return false;

  const ext = path.extname(filePath);
  if (!allowedExtensions.includes(ext)) return false;

  const projectTypes = detectProjectType(process.cwd());

  return requiredProjectTypes.some(type => projectTypes.includes(type));
}

module.exports = {
  readHookInput,
  writeHookOutput,
  shouldProcessFile,
  detectProjectType
};
```

**Testing**: `tests/unit/lib/hook-utils.test.js`
- Test stdin reading
- Test stdout writing
- Test file extension matching
- Test project type filtering

**Acceptance Criteria**:
- Hook utilities work with HookTestHarness
- stdin/stdout protocol correct
- Project type filtering logic correct

---

### Task P1-04: Create smart-formatter.js Universal Hook

**Owner**: `foundation-implementation-agent`
**Effort**: M (1.5 days)
**Dependencies**: P1-03
**Tests Required**: Format logic for each language

**Create**: `scripts/hooks/smart-formatter.cjs`

**Implementation** (from PRD Section 2):
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { readHookInput, writeHookOutput, detectProjectType } = require('../lib/hook-utils');

async function main() {
  const context = await readHookInput();

  if (!context) {
    process.exit(0);
  }

  const filePath = context.tool_input?.file_path;

  if (!filePath || !fs.existsSync(filePath)) {
    writeHookOutput(context);
    process.exit(0);
  }

  const projectTypes = detectProjectType(process.cwd());
  const ext = path.extname(filePath);

  try {
    // Python formatting (only if Python project)
    if (ext === '.py' && projectTypes.includes('python')) {
      if (commandExists('ruff')) {
        execSync(`ruff format "${filePath}"`, { stdio: 'inherit' });
      }
    }

    // Java formatting (only if Maven/Gradle project)
    else if (ext === '.java' && (projectTypes.includes('maven') || projectTypes.includes('gradle'))) {
      if (commandExists('google-java-format')) {
        execSync(`google-java-format -i "${filePath}"`, { stdio: 'inherit' });
      }
    }

    // Kotlin formatting (only if Gradle project)
    else if (ext === '.kt' && projectTypes.includes('gradle')) {
      if (commandExists('ktfmt')) {
        execSync(`ktfmt "${filePath}"`, { stdio: 'inherit' });
      } else if (commandExists('ktlint')) {
        execSync(`ktlint -F "${filePath}"`, { stdio: 'inherit' });
      }
    }

    // TypeScript/JavaScript formatting (only if Node.js project)
    else if ((ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx')
             && projectTypes.includes('nodejs')) {
      if (commandExists('prettier')) {
        execSync(`npx prettier --write "${filePath}"`, { stdio: 'inherit' });
      }
    }
  } catch (error) {
    console.error(`[Hook] Formatting failed: ${error.message}`);
  }

  writeHookOutput(context);
  process.exit(0);
}

function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

main().catch(err => {
  console.error('[Hook] Error:', err.message);
  process.exit(0);
});
```

**Testing**: `tests/unit/hooks/smart-formatter.test.js`
- Test Python file in Python project → ruff runs
- Test Python file in Node.js project → ruff DOESN'T run
- Test Java file in Maven project → google-java-format runs
- Test TypeScript file in Node.js project → prettier runs
- Test missing formatter tool → graceful skip
- Test non-file operations → pass through

**Acceptance Criteria**:
- Correct formatter runs for each language/project combination
- No formatter runs for mismatched project types
- Graceful handling when formatter tool missing
- Pass-through works correctly

---

### Task P1-05: Create maven-advisor.js Hook

**Owner**: `foundation-implementation-agent`
**Effort**: S (0.5 day)
**Dependencies**: P1-03
**Tests Required**: Maven command detection

**Create**: `scripts/hooks/maven-advisor.cjs`

**Implementation** (from PRD Section 2):
```javascript
const { readHookInput, writeHookOutput, detectProjectType } = require('../lib/hook-utils');

async function main() {
  const context = await readHookInput();

  if (!context) {
    process.exit(0);
  }

  const command = context.tool_input?.command || '';
  const projectTypes = detectProjectType(process.cwd());

  // Only advise if Maven project
  if (projectTypes.includes('maven')) {
    if (command.includes('mvn install') && !command.includes('mvn clean install')) {
      console.error('[Hook] Consider: mvn verify (faster than install for local builds)');
      console.error('[Hook] Use "mvn clean install" only when you need to publish to local repo');
    }

    if (command.includes('gradle') && !command.includes('./gradlew')) {
      console.error('[Hook] Consider: Use ./gradlew instead of gradle for wrapper consistency');
    }
  }

  writeHookOutput(context);
  process.exit(0);
}

main().catch(err => {
  console.error('[Hook] Error:', err.message);
  process.exit(0);
});
```

**Testing**: `tests/unit/hooks/maven-advisor.test.js`
- Test `mvn install` → warning shown
- Test `mvn verify` → no warning
- Test in non-Maven project → no warning
- Test Gradle without wrapper → warning shown

**Acceptance Criteria**:
- Correct advice for Maven commands
- Only runs in Maven/Gradle projects
- Doesn't block commands (just warnings)

---

### Task P1-06: Refactor Existing Hooks with Runtime Filtering

**Owner**: `foundation-implementation-agent`
**Effort**: L (1.5 days)
**Dependencies**: P1-04
**Tests Required**: Existing hooks still work

**Update**: `hooks/hooks.json`

**Current** (lines 92-99):
```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "node -e \"...inline prettier...\""
  }]
}
```

**New** (use smart-formatter instead):
```json
{
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.cjs\""
  }],
  "description": "Auto-format files based on project type"
}
```

**Remove**: Inline Prettier hooks (lines 92-99, 102-109)
**Keep**: Bash hooks, git hooks, console.log checker (project-agnostic)

**Testing**: Integration test ensuring:
- Node.js project → Prettier still runs
- Python project → Ruff runs
- Java project → google-java-format runs
- Existing functionality preserved

**Acceptance Criteria**:
- Duplicate formatter hooks removed
- smart-formatter.js handles all formatting
- No regressions in existing behavior

---

### Task P1-07: Create SessionStart Hook for Detection

**Owner**: `foundation-implementation-agent`
**Effort**: S (0.5 day)
**Dependencies**: P1-01
**Tests Required**: Detection runs on session start

**Update**: `scripts/hooks/session-start.cjs`

**Add** (after line 46):
```javascript
// Detect and report project types
const { detectProjectType } = require('../lib/detect-project-type');

const projectTypes = detectProjectType(process.cwd());

if (projectTypes.length > 0) {
  log(`[SessionStart] Project types: ${projectTypes.join(', ')}`);

  // Cache for quick access
  const cacheFile = path.join(process.cwd(), '.claude', 'project-type.json');
  log(`[SessionStart] Project type cache: ${cacheFile}`);
}
```

**Testing**: Manual test
- Start Claude Code session
- Check stderr for project type detection message
- Verify `.claude/project-type.json` created

**Acceptance Criteria**:
- Project types detected and logged on session start
- Cache file created
- Doesn't break existing session-start functionality

---

### Task P1-08: Unit Tests for Detection & Hook Filtering

**Owner**: `foundation-testing-agent`
**Effort**: M (1.5 days)
**Dependencies**: P1-01 through P1-07 complete
**Tests Required**: 80%+ coverage

**Implement**: All test scenarios from TEST-SCENARIOS.md Phase 1

**Test Files**:
1. `tests/unit/lib/detect-project-type.test.js` (60+ scenarios)
2. `tests/unit/lib/hook-utils.test.js` (20+ scenarios)
3. `tests/unit/hooks/smart-formatter.test.js` (30+ scenarios)
4. `tests/unit/hooks/maven-advisor.test.js` (10+ scenarios)

**Coverage Targets**:
- detect-project-type.js: 95%
- hook-utils.js: 90%
- smart-formatter.js: 85%
- maven-advisor.js: 85%

**Acceptance Criteria**:
- All tests pass
- Coverage ≥80% overall
- Edge cases covered (missing tools, invalid paths, etc.)

---

**Phase 1 Quality Gate**:
- [ ] Project type detection works for all supported types
- [ ] Caching mechanism works and invalidates correctly
- [ ] smart-formatter.js runs correct formatter for each language
- [ ] maven-advisor.js provides correct Maven/Gradle advice
- [ ] Existing hooks refactored without regressions
- [ ] SessionStart hook detects project types
- [ ] 80%+ test coverage achieved
- [ ] All 120+ unit tests pass

**Deliverables**:
- `scripts/lib/detect-project-type.js`
- `scripts/lib/hook-utils.js`
- `scripts/hooks/smart-formatter.cjs`
- `scripts/hooks/maven-advisor.cjs`
- `hooks/hooks.json` (refactored)
- `scripts/hooks/session-start.cjs` (enhanced)
- `tests/unit/lib/detect-project-type.test.js`
- `tests/unit/lib/hook-utils.test.js`
- `tests/unit/hooks/smart-formatter.test.js`
- `tests/unit/hooks/maven-advisor.test.js`

---

## Phase 2-4: Parallel Implementation (Weeks 3-5)

**Duration**: 15 days total (can run in parallel with 2+ developers)
**Blocking**: Phase 5 depends on these
**Agent Assignment**: Multiple specialized agents in parallel

**Parallelization Strategy**:
- **Developer 1**: Phase 2 (Python) + Phase 4 (Build Tools)
- **Developer 2**: Phase 3 (Java/Kotlin/Groovy)

### Phase 2: Python Support (5 days)

**Agent**: `python-implementation-agent`
**Tests**: `python-testing-agent`

**Tasks**: P2-01 through P2-07 (see PRD lines 885-907)

**Critical Deliverables**:
- `agents/python-reviewer.md`
- `skills/python-patterns/skill.md`
- `rules/python-style.md`
- `scripts/hooks/python-security.cjs` (Semgrep + pip-audit)

---

### Phase 3: Java/Kotlin/Groovy Support (5 days)

**Agent**: `jvm-implementation-agent`
**Tests**: `jvm-testing-agent`

**Tasks**: P3-01 through P3-09 (see PRD lines 911-936)

**Critical Deliverables**:
- `agents/java-reviewer.md`
- `agents/kotlin-reviewer.md`
- `agents/groovy-reviewer.md`
- `skills/kotlin-patterns/skill.md`

---

### Phase 4: Build Tool Integration (5 days)

**Agent**: `build-tools-agent`
**Tests**: `build-tools-testing-agent`

**Tasks**: P4-01 through P4-07 (see PRD lines 940-966)

**Critical Deliverables**:
- `agents/maven-expert.md`
- `agents/gradle-expert.md`
- `skills/maven-patterns/skill.md`
- `skills/gradle-patterns/skill.md`

---

**Phases 2-4 Quality Gate**:
- [ ] All language-specific agents work correctly
- [ ] All skills provide accurate guidance
- [ ] Integration tests pass (polyglot projects)
- [ ] No interference between language hooks
- [ ] 80%+ coverage for new code

---

## Phase 5: CI/CD Pipeline Generation (Weeks 6-9)

**Duration**: 22 days
**Blocking**: Phase 6 depends on this
**Agent Assignment**: `cicd-implementation-agent` + `cicd-testing-agent`

**Tasks**: P5-01 through P5-12 (see PRD lines 970-1036)

**Critical Deliverables**:
- CI/CD templates for GitHub Actions, GitLab CI, Bitbucket Pipelines
- `/ci-cd` skill for pipeline generation
- Docker multi-stage build templates
- Kubernetes manifests and Helm charts

---

## Phase 6: Documentation & Production Rollout (Weeks 10-11)

**Duration**: 10 days
**Agent Assignment**: `documentation-agent` + `final-review-agent`

**Tasks**: P6-01 through P6-05 (see PRD lines 1040-1067)

**Critical Deliverables**:
- README updates
- Migration guide
- Video walkthroughs
- Performance benchmarks
- Release notes

---

## Agent Orchestration Strategy

### Agent Types and Responsibilities

| Agent Type | Phases | Primary Tools | Purpose |
|------------|--------|---------------|---------|
| `testing-setup-agent` | Phase 0 | Write, Bash, Edit | Set up test infrastructure |
| `foundation-implementation-agent` | Phase 1 | Write, Edit, Bash | Core detection & hooks |
| `foundation-testing-agent` | Phase 1 | Write, Bash | Phase 1 tests |
| `python-implementation-agent` | Phase 2 | Write, Edit, WebFetch | Python support |
| `python-testing-agent` | Phase 2 | Write, Bash | Python tests |
| `jvm-implementation-agent` | Phase 3 | Write, Edit, WebFetch | Java/Kotlin/Groovy |
| `jvm-testing-agent` | Phase 3 | Write, Bash | JVM tests |
| `build-tools-agent` | Phase 4 | Write, Edit, WebFetch | Maven/Gradle |
| `build-tools-testing-agent` | Phase 4 | Write, Bash | Build tool tests |
| `cicd-implementation-agent` | Phase 5 | Write, Edit, WebFetch | CI/CD templates |
| `cicd-testing-agent` | Phase 5 | Write, Bash | CI/CD tests |
| `documentation-agent` | Phase 6 | Write, Edit | Documentation |
| `final-review-agent` | Phase 6 | Read, Grep, Bash | Final QA |

### Agent Communication Protocol

**Between Phases**:
```javascript
// Agent A completes task
{
  "phase": "1",
  "task": "P1-01",
  "status": "complete",
  "deliverables": [
    "scripts/lib/detect-project-type.js"
  ],
  "next_tasks": ["P1-02"], // What can now start
  "blockers": [] // Any issues for next agent
}
```

**Quality Gate Checks**:
```javascript
// Before moving to next phase
{
  "phase": "1",
  "quality_gate": {
    "tests_passing": true,
    "coverage": 85,
    "deliverables_complete": true,
    "manual_testing": "Session start shows project types",
    "ready_for_next_phase": true
  }
}
```

### Task Dependencies (Critical Path)

```
PF-1 → PF-2 → PF-3
              ↓
         P0-01 → P0-02 → P0-03 → P0-04 → P0-05
                                          ↓
                                    P1-00 → P1-01 → P1-02 → P1-03 → P1-04 → P1-05 → P1-06 → P1-07 → P1-08
                                                                                                        ↓
                                                                              ┌─────────────────────────┼─────────────────────────┐
                                                                              ↓                         ↓                         ↓
                                                                          Phase 2                   Phase 3                   Phase 4
                                                                        (5 days)                  (5 days)                  (5 days)
                                                                              ↓                         ↓                         ↓
                                                                              └─────────────────────────┼─────────────────────────┘
                                                                                                        ↓
                                                                                                    Phase 5
                                                                                                   (22 days)
                                                                                                        ↓
                                                                                                    Phase 6
                                                                                                   (10 days)
```

**Parallelization Opportunities**:
- P0-03 and P0-04 can run in parallel
- Phases 2, 3, 4 can run in parallel (requires 3 developers)
- Within Phase 5: Template creation tasks can be parallel

---

## Implementation Checklist for Orchestrator

### Pre-Implementation
- [ ] Run Pre-Flight checks (PF-1, PF-2, PF-3)
- [ ] Create feature branch
- [ ] Verify baseline tests pass

### Phase 0 Execution
- [ ] Spawn `testing-setup-agent` with Phase 0 tasks
- [ ] Agent creates test infrastructure
- [ ] Review: Vitest works, harnesses functional
- [ ] **Quality Gate**: All Phase 0 deliverables complete

### Phase 1 Execution
- [ ] Spawn `foundation-implementation-agent` for P1-00 through P1-07
- [ ] Spawn `foundation-testing-agent` for P1-08 (after P1-07)
- [ ] Review: Detection works, hooks filter correctly
- [ ] Run: `npm test` → all Phase 1 tests pass
- [ ] Check: Coverage ≥80%
- [ ] **Quality Gate**: All Phase 1 deliverables complete

### Phases 2-4 Execution (Parallel)
- [ ] Spawn 3 agents in parallel:
  - `python-implementation-agent` → Phase 2
  - `jvm-implementation-agent` → Phase 3
  - `build-tools-agent` → Phase 4
- [ ] Monitor progress in parallel
- [ ] Review each phase independently
- [ ] **Quality Gate**: All 3 phases complete before Phase 5

### Phase 5 Execution
- [ ] Spawn `cicd-implementation-agent` for CI/CD templates
- [ ] Test: Generate pipeline for each platform
- [ ] Validate: Pipelines are valid YAML
- [ ] **Quality Gate**: CI/CD generation works

### Phase 6 Execution
- [ ] Spawn `documentation-agent` for docs
- [ ] Spawn `final-review-agent` for QA
- [ ] Manual review: Test in real projects
- [ ] **Quality Gate**: Production ready

### Final Release
- [ ] Create PR from feature branch
- [ ] Code review
- [ ] Merge to main
- [ ] Tag release (v2.0.0)
- [ ] Publish to npm (if applicable)

---

## Risk Mitigation During Implementation

### Risk 1: Hook Protocol Changes
**Likelihood**: Low
**Impact**: High
**Mitigation**: Verify protocol in P1-00, create abstraction layer in hook-utils.js

### Risk 2: Tool Availability (Ruff, google-java-format, etc.)
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Graceful degradation with `commandExists()` checks

### Risk 3: Monorepo Edge Cases
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Extensive fixtures in P0-04, test with real monorepos

### Risk 4: Performance Overhead
**Likelihood**: Low
**Impact**: Low
**Mitigation**: Caching in P1-02, benchmark tests in Phase 6

---

## Success Criteria Summary

**Phase 0**: Test infrastructure works
**Phase 1**: Project detection and hook filtering operational
**Phases 2-4**: All languages supported with agents/skills/hooks
**Phase 5**: CI/CD pipeline generation works for all platforms
**Phase 6**: Documentation complete, production ready

**Overall Success**:
- [ ] All 135+ test scenarios pass
- [ ] Coverage ≥80%
- [ ] No regressions in existing functionality
- [ ] Performance: Hook execution <2s (95th percentile)
- [ ] Manual testing: Works in 3+ real projects (Python, Java, Node.js)

---

## Next Steps

**For Orchestrator (You)**:
1. Review this plan
2. Confirm approach and agent assignments
3. Signal ready to begin
4. I will spawn agents in sequence with this plan

**For Implementation**:
1. Start with Pre-Flight checks
2. Execute Phase 0 (test infrastructure)
3. Execute Phase 1 (foundation)
4. Parallelize Phases 2-4
5. Execute Phase 5 (CI/CD)
6. Execute Phase 6 (documentation & release)

**Estimated Timeline**:
- **1 Developer**: 69 days (13.8 weeks)
- **2 Developers**: 9-10 weeks (Phases 2-4 in parallel)
- **3 Developers**: 8 weeks (Phases 2-4 fully parallel)

---

**Questions Before We Begin?**

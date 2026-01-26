# PRD: Enterprise Stack Extension for Everything Claude Code

**Version**: 2.1
**Date**: 2026-01-25
**Author**: Frédéric THOMAS (doublefx)
**Status**: Draft - Under Review
**Last Updated**: 2026-01-25 (Hook System Investigation)

---

## Executive Summary

Extend the Everything Claude Code plugin to support enterprise polyglot development environments (Python, Java, Groovy) with build tools (Maven, Gradle) and CI/CD pipelines (GitHub Actions, GitLab CI, Bitbucket Pipelines), while maintaining existing JavaScript/TypeScript capabilities with intelligent project-specific hook activation.

---

## Problem Statement

### Current State

The Everything Claude Code plugin is optimized for JavaScript/TypeScript ecosystems:
- **Agents**: Language-agnostic but lack domain expertise for JVM and Python
- **Hooks**: Hardcoded for JS/TS (Prettier, TypeScript, console.log checks)
- **Skills**: Frontend/backend patterns focus on Node.js/React
- **Rules**: Coding style emphasizes JS immutability patterns
- **CI/CD**: Zero support for pipeline generation/management

### Gaps for Enterprise Polyglot Teams

1. **Language Coverage**
   - ❌ No Python-specific code review (PEP 8, type hints, security)
   - ❌ No Java expertise (Google Style, null safety, concurrency)
   - ❌ No Groovy domain knowledge (DSL patterns, metaprogramming)
   - ❌ No Kotlin support (ktlint/ktfmt, detekt, coroutines, null safety)

2. **Build Tool Integration**
   - ❌ No Maven lifecycle awareness (dependency:tree, clean verify vs install, parallel builds)
   - ❌ No Gradle optimization (configuration cache [preferred in v9], build cache, version catalogs, dependency locking, parallel execution, task dependencies)
   - ❌ No multi-module project detection (settings.gradle.kts, parent POM, wrapper files)
   - ❌ No Maven/Gradle wrapper enforcement (mvnw, gradlew vs global commands)

3. **CI/CD Automation**
   - ❌ No GitHub Actions workflow generation
   - ❌ No GitLab CI pipeline scaffolding
   - ❌ No Bitbucket Pipelines support
   - ❌ No deployment strategy guidance

4. **Hook Limitations**
   - ⚠️ JS/TS hooks fire on all projects (conflicts with Python/Java)
   - ❌ No project-type detection for intelligent hook activation
   - ❌ No monorepo support (multi-language projects in same repo)
   - ❌ No Python linting (ruff for formatting+linting, mypy/pyright for type checking)
   - ❌ No Java formatting (google-java-format, checkstyle, spotbugs)
   - ❌ No Kotlin linting (ktlint/ktfmt, detekt)

---

## Goals and Success Criteria

### Primary Goals

1. **Universal Multi-Language Support**
   - Python, Java, Groovy developers get same quality experience as JS/TS
   - Language-specific agents for code review, security, testing
   - Build tool integration (Maven, Gradle) at parity with npm/yarn/pnpm

2. **CI/CD Pipeline Generation**
   - Generate GitHub Actions, GitLab CI, Bitbucket Pipelines from templates
   - Support multi-stage pipelines (build → test → deploy)
   - Best practices embedded (caching, matrix builds, security scanning)

3. **Intelligent Hook Activation**
   - Hooks activate only for relevant project types
   - JS/TS hooks disabled in Python/Java projects (and vice versa)
   - Project detection via manifest files (package.json, pom.xml, build.gradle)

### Success Metrics

- ✅ Python projects: ruff format+check on PostToolUse, mypy/pyright for type checking
- ✅ Java projects: google-java-format + spotbugs runs on Edit
- ✅ Kotlin projects: ktfmt/ktlint + detekt runs on Edit
- ✅ Maven projects: Build warnings suggest `mvn verify` over `install`
- ✅ Gradle projects: Wrapper enforcement (`./gradlew` vs `gradle`), version catalog detection
- ✅ Monorepo projects: Correct hooks fire per subdirectory (Python in /ml, Java in /backend, Node in /frontend)
- ✅ `/ci-cd` command generates working pipeline for any stack (GitHub, GitLab, Bitbucket)
- ✅ Hooks produce <0.5% false positives across project types
- ✅ Hook execution time <2 seconds (95th percentile)
- ✅ Test coverage ≥80% for all new code
- ✅ All existing JS/TS functionality preserved

---

## Target Users

### Primary Personas

1. **Full-Stack Polyglot Developer**
   - Works across React (frontend), Spring Boot (backend), Python (ML/data)
   - Needs context switching without reconfiguring Claude Code
   - Values consistency in code quality regardless of language

2. **Enterprise Java Developer**
   - Multi-module Maven/Gradle projects
   - GitLab CI pipelines for deployment
   - Needs review for concurrency, null safety, performance

3. **DevOps Engineer**
   - Maintains CI/CD pipelines across GitHub/GitLab/Bitbucket
   - Needs templates for build → test → deploy workflows
   - Values pipeline optimization (caching, parallelization)

4. **Data Engineer (Python)**
   - Python codebases with strict type checking (mypy)
   - AWS/GCP deployment via CI/CD
   - Security scanning (bandit, safety) in pipelines

---

## Technical Architecture

### 1. Project Detection System

**Goal**: Auto-detect project types (supporting monorepos with multiple languages) to activate appropriate hooks/agents.

**Detection Logic** (Enhanced for Monorepo Support):
```javascript
// scripts/detect-project-type.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Detect project types - supports multiple types in same directory (monorepos)
 * Returns array of detected types
 */
function detectProjectType(cwd) {
  const types = [];

  // Node.js detection
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    types.push('nodejs');
    // Detect package manager from lockfiles
    if (fs.existsSync(path.join(cwd, 'package-lock.json'))) types.push('npm');
    if (fs.existsSync(path.join(cwd, 'yarn.lock'))) types.push('yarn');
    if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) types.push('pnpm');
    if (fs.existsSync(path.join(cwd, 'bun.lockb'))) types.push('bun');
  }

  // Maven detection
  if (fs.existsSync(path.join(cwd, 'pom.xml'))) {
    types.push('maven');
    // Check for Maven wrapper
    if (fs.existsSync(path.join(cwd, 'mvnw'))) types.push('maven-wrapper');

    // Check for multi-module (read pom.xml for <packaging>pom</packaging>)
    try {
      const pomContent = fs.readFileSync(path.join(cwd, 'pom.xml'), 'utf8');
      if (pomContent.includes('<packaging>pom</packaging>') &&
          pomContent.includes('<modules>')) {
        types.push('maven-multi-module');
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  // Gradle detection
  const hasGradleBuild = fs.existsSync(path.join(cwd, 'build.gradle')) ||
                         fs.existsSync(path.join(cwd, 'build.gradle.kts'));
  if (hasGradleBuild) {
    types.push('gradle');

    // Kotlin DSL vs Groovy DSL
    if (fs.existsSync(path.join(cwd, 'build.gradle.kts'))) {
      types.push('gradle-kotlin-dsl');
    }

    // Check for Gradle wrapper
    if (fs.existsSync(path.join(cwd, 'gradlew'))) {
      types.push('gradle-wrapper');
    }

    // Check for version catalog (Gradle 9.0 standard)
    if (fs.existsSync(path.join(cwd, 'gradle/libs.versions.toml'))) {
      types.push('gradle-version-catalog');
    }

    // Check for multi-module (settings file)
    if (fs.existsSync(path.join(cwd, 'settings.gradle')) ||
        fs.existsSync(path.join(cwd, 'settings.gradle.kts'))) {
      types.push('gradle-multi-module');
    }
  }

  // Python detection (expanded)
  const pythonIndicators = [
    'setup.py',
    'pyproject.toml',
    'uv.lock',           // uv package manager (2026 standard)
    'poetry.lock',       // Poetry
    'Pipfile',           // Pipenv
    'requirements.txt',  // pip
    'environment.yml',   // Conda
    'environment.yaml',
    'conda.yaml',
    '.python-version'    // pyenv
  ];

  const hasPythonIndicator = pythonIndicators.some(
    indicator => fs.existsSync(path.join(cwd, indicator))
  );

  if (hasPythonIndicator) {
    types.push('python');

    // Detect specific package manager
    if (fs.existsSync(path.join(cwd, 'uv.lock'))) types.push('uv');
    if (fs.existsSync(path.join(cwd, 'poetry.lock'))) types.push('poetry');
    if (fs.existsSync(path.join(cwd, 'Pipfile'))) types.push('pipenv');
    if (fs.existsSync(path.join(cwd, 'environment.yml')) ||
        fs.existsSync(path.join(cwd, 'environment.yaml'))) types.push('conda');
  }

  // Kotlin detection (check for .kt files)
  if (types.includes('gradle')) {
    // Kotlin is often used with Gradle, check for .kt files
    const glob = require('glob');
    const hasKotlinFiles = glob.sync('**/*.kt', {
      cwd,
      nodir: true,
      ignore: ['**/node_modules/**', '**/build/**', '**/target/**'],
      maxDepth: 3
    }).length > 0;

    if (hasKotlinFiles) {
      types.push('kotlin');
    }
  }

  // Go detection
  if (fs.existsSync(path.join(cwd, 'go.mod'))) types.push('go');

  // CI/CD detection
  if (fs.existsSync(path.join(cwd, '.github/workflows'))) types.push('github-actions');
  if (fs.existsSync(path.join(cwd, '.gitlab-ci.yml'))) types.push('gitlab-ci');
  if (fs.existsSync(path.join(cwd, 'bitbucket-pipelines.yml'))) types.push('bitbucket-pipelines');

  return types;
}

/**
 * Calculate hash of manifest files for cache invalidation
 */
function calculateManifestHash(cwd) {
  const manifests = [
    'package.json', 'pom.xml', 'build.gradle', 'build.gradle.kts',
    'pyproject.toml', 'setup.py', 'go.mod', 'uv.lock', 'poetry.lock'
  ];

  const hash = crypto.createHash('sha256');

  for (const manifest of manifests) {
    const filePath = path.join(cwd, manifest);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      hash.update(manifest + ':' + content);
    }
  }

  return hash.digest('hex');
}

/**
 * Check if re-detection is needed (manifest files changed)
 */
function needsRedetection(cwd) {
  const cacheFile = path.join(cwd, '.claude/project-type.json');

  if (!fs.existsSync(cacheFile)) {
    return true;
  }

  try {
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const currentHash = calculateManifestHash(cwd);

    return cache.manifestHash !== currentHash;
  } catch (e) {
    return true; // Re-detect on any error
  }
}

module.exports = {
  detectProjectType,
  calculateManifestHash,
  needsRedetection
};
```

**Storage**: Cache in `${cwd}/.claude/project-type.json` with manifest hash for invalidation:
```json
{
  "types": ["nodejs", "maven", "python"],
  "manifestHash": "abc123...",
  "detectedAt": "2026-01-25T10:30:00Z"
}
```

**Monorepo Support**: For monorepos, detect types in subdirectories:
```
/monorepo
  /backend (.claude/project-type.json) → ["maven", "maven-wrapper"]
  /frontend (.claude/project-type.json) → ["nodejs", "pnpm"]
  /ml (.claude/project-type.json) → ["python", "uv"]
```

### 2. Conditional Hook System

**Goal**: Hooks fire only for relevant project types using runtime filtering in hook scripts.

**Claude Code Hook System Limitation**:

Research confirms that Claude Code's hook matchers support **only basic string/regex patterns**:
- ✅ Tool name matching: `"Edit"`, `"Edit|Write"`, `"Bash"`, `"*"`
- ✅ Regex wildcards: `"Notebook.*"`
- ❌ Function calls: `contains()`, `endsWith()`
- ❌ Method access: `tool_input.file_path.endsWith('.py')`
- ❌ Complex expressions: `&&`, `||`, variable injection

**Runtime Filtering Solution** (Phase 1 Implementation):

Since matchers cannot evaluate complex conditions, **hook scripts perform runtime filtering**:

```javascript
// scripts/hooks/smart-formatter.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { detectProjectType } = require('../detect-project-type');

/**
 * Universal formatter hook that runs project-appropriate formatters
 * Called by hook matcher: "Edit|Write"
 * Filters at runtime based on file extension and project type
 */
function formatFile(toolInput) {
  const filePath = toolInput?.file_path;
  if (!filePath) return; // Not a file operation

  // Detect project types (cached via .claude/project-type.json)
  const projectTypes = detectProjectType(process.cwd());
  const ext = path.extname(filePath);

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

  // Kotlin formatting (only if Gradle project with Kotlin)
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
}

function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Read tool context from stdin (Claude Code hook protocol)
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const context = JSON.parse(input);
  formatFile(context.tool_input);
  console.log(input); // Pass through (required by hook protocol)
});
```

**Hook Configuration** (Simple Matchers):

```json
{
  "matcher": "Edit|Write",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.cjs\""
    }
  ],
  "description": "Auto-format files based on project type"
}
```

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/maven-advisor.cjs\""
    }
  ],
  "description": "Maven command recommendations"
}
```

**maven-advisor.js Example** (Runtime Command Filtering):

```javascript
// scripts/hooks/maven-advisor.cjs
const { detectProjectType } = require('../detect-project-type');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const context = JSON.parse(input);
  const command = context.tool_input?.command || '';
  const projectTypes = detectProjectType(process.cwd());

  // Only advise if Maven project
  if (projectTypes.includes('maven') && command.includes('mvn install')) {
    console.error('[Hook] Consider: mvn verify (faster than install for local builds)');
  }

  console.log(input); // Pass through
});
```

**Hook Categories**:
- **Universal**: Git workflow, tmux reminders (all projects) - no project_types check
- **Language-Specific**: ruff (python), Prettier (nodejs), google-java-format (maven/gradle)
- **Build-Specific**: Maven lifecycle, Gradle task suggestions
- **CI/CD-Specific**: Pipeline validation, deployment checks

**Hook Priority** (Execution Order):

```json
{
  "matcher": "*",
  "priority": 100,  // Higher = runs first
  "hooks": [...]
}
```

Priority levels:
- **100+**: Pre-flight checks (tmux, git validation)
- **50-99**: Formatting (ruff, prettier, google-java-format)
- **10-49**: Linting and type checking (mypy, eslint, checkstyle)
- **1-9**: Security scanning (secrets, vulnerabilities)
- **0**: Cleanup and notifications

### 3. Language-Specific Agents

**New Agents**:

| Agent | Purpose | Model | Tools |
|-------|---------|-------|-------|
| `python-reviewer` | PEP 8, type hints, security (Semgrep patterns) | opus | Read, Grep, Glob, Bash |
| `java-reviewer` | Google Style, null safety, concurrency, security | opus | Read, Grep, Glob, Bash |
| `kotlin-reviewer` | Kotlin idioms, null safety, coroutines, Java interop | opus | Read, Grep, Glob, Bash |
| `groovy-reviewer` | DSL patterns, metaprogramming, Spock tests | sonnet | Read, Grep, Glob, Bash |
| `maven-expert` | Dependency management, multi-module, lifecycle, wrapper | sonnet | Read, Grep, Bash |
| `gradle-expert` | Task optimization, build cache, version catalogs, Kotlin DSL | sonnet | Read, Grep, Bash |
| `ci-cd-architect` | Pipeline design (GitHub/GitLab/Bitbucket), caching, security | opus | Read, Write, Bash |

**Agent Structure** (Example: `agents/python-reviewer.md`):
```markdown
---
name: python-reviewer
description: Python code review specialist (2026). Reviews for PEP 8, type hints, security, performance. Uses Ruff, Semgrep, pip-audit. Use after editing Python files.
tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior Python developer and code reviewer specializing in modern Python practices (2026).

## Review Checklist

### Critical (Security)
- No eval() or exec() usage
- SQL injection prevention (parameterized queries with sqlalchemy/psycopg3)
- No hardcoded credentials (use environment variables, vault integration)
- Input validation (Pydantic v2 schemas)
- Dependency vulnerabilities (pip-audit primary, safety secondary)
- SAST findings (Semgrep security rules)

### High (Type Safety & Correctness)
- Type hints on all public functions (PEP 484, 526, 585)
- mypy or pyright compliance (no Any types without justification)
- Proper exception handling (no bare except:)
- Resource cleanup (context managers, async context managers)
- Async/await patterns (proper use of asyncio, no blocking calls)

### Medium (Code Quality)
- PEP 8 compliance (Ruff formatted)
- Function size (<50 lines)
- Cyclomatic complexity (<10)
- No duplicated code (DRY principle)
- Docstrings on public APIs (Google or NumPy style)
- Modern Python features (match-case for Python 3.10+, structural pattern matching)

### Performance
- List comprehensions over map/filter where readable
- Generator expressions for large datasets
- Proper use of built-ins (any(), all(), zip())
- Avoid N+1 queries (eager loading, select_in_load)
- Use dataclasses or Pydantic for data containers

### Package Management (2026)
- Prefer uv for package management (10-100x faster than pip/poetry)
- Lock files for reproducible builds (uv.lock, poetry.lock)
- Version constraints in pyproject.toml

## Tools to Run

If available (graceful degradation if missing):

**Formatting & Linting (Ruff replaces black + flake8 + isort)**:
- `ruff format ${file}` - Auto-format (100x faster than black)
- `ruff check --fix ${file}` - Linting with auto-fix

**Type Checking**:
- `mypy ${file}` - Standard type checker
- OR `pyright ${file}` - Faster alternative (3-5x faster)

**Security Scanning**:
- `semgrep --config=auto ${file}` - SAST (recommended, AI-powered)
- OR `ruff check --select S ${file}` - Lightweight security rules (Bandit equivalent)
- `pip-audit` - Dependency vulnerability scan (PyPA official)
- `safety check` - Additional dependency scan

**Check Tool Availability**:
```bash
command -v ruff >/dev/null || echo "[Review] Install ruff: pip install ruff"
command -v mypy >/dev/null || echo "[Review] Install mypy: pip install mypy"
command -v semgrep >/dev/null || echo "[Review] Install semgrep: pip install semgrep"
```

## Output Format

```
[CRITICAL] SQL Injection Risk
File: app/db.py:42
Issue: String interpolation in SQL query
Fix: Use parameterized queries with SQLAlchemy

# Bad
query = f"SELECT * FROM users WHERE id = {user_id}"

# Good (SQLAlchemy 2.0)
from sqlalchemy import select, text
stmt = select(User).where(User.id == user_id)  # Type-safe
# OR with raw SQL:
stmt = text("SELECT * FROM users WHERE id = :id")
session.execute(stmt, {"id": user_id})
```

```
[HIGH] Missing Type Hints
File: utils.py:15
Issue: Function lacks return type annotation
Fix: Add type hints

# Bad
def process_data(items):
    return [item.upper() for item in items]

# Good
def process_data(items: list[str]) -> list[str]:
    return [item.upper() for item in items]
```
```

### 4. Build Tool Skills

**New Skills**:

| Skill | Content |
|-------|---------|
| `skills/maven-patterns/` | Multi-module projects, dependency management, lifecycle best practices, wrapper usage |
| `skills/gradle-patterns/` | Build cache, configuration cache (Gradle 9 preferred mode), version catalogs, dependency locking, task optimization, Kotlin DSL |
| `skills/python-patterns/` | Project structure, packaging (uv, poetry, setuptools), virtual envs, pyproject.toml |
| `skills/kotlin-patterns/` | Idioms, coroutines, null safety, Java interop, ktfmt/ktlint, detekt |
| `skills/groovy-patterns/` | DSL design, AST transformations, Spock testing |

**Skill Structure** (Example: `skills/maven-patterns/skill.md`):
```markdown
# Maven Best Practices

## Multi-Module Projects

### Directory Structure
parent/
├── pom.xml                 # Parent POM (packaging=pom)
├── module-api/             # API contracts
├── module-core/            # Business logic
└── module-web/             # REST controllers

### Parent POM Pattern
- Define `<dependencyManagement>` for version control
- Use `<pluginManagement>` for consistent builds
- Inherit from `spring-boot-starter-parent` or company parent

## Dependency Management

### Scope Best Practices
- `compile`: Default (transitive dependencies included)
- `provided`: Container-provided (e.g., servlet-api)
- `test`: Test-only (JUnit, Mockito)
- `runtime`: Execution-only (JDBC drivers)

### Version Management
```xml
<properties>
  <spring.version>5.3.20</spring.version>
</properties>

<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-core</artifactId>
      <version>${spring.version}</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

## Lifecycle Optimization

### Fast Local Builds
```bash
mvn clean verify          # Recommended (no install to local repo)
mvn clean verify -T 1C    # Parallel (1 thread per core)
mvn verify -DskipTests    # Skip tests (use sparingly)
```

### CI/CD Builds
```bash
mvn clean verify -B       # Batch mode (no color, simpler logs)
mvn clean verify -U       # Update snapshots
mvn verify -Pcoverage     # With code coverage profile
```

## Common Pitfalls

1. **Using `install` instead of `verify`**
   - `install` copies to ~/.m2/repository (slow, unnecessary in CI)
   - Use `verify` unless other local projects depend on this artifact

2. **Not using dependency:tree**
   - `mvn dependency:tree` - Find version conflicts
   - `mvn dependency:analyze` - Find unused/undeclared deps

3. **Snapshot dependencies in production**
   - SNAPSHOTs are mutable (builds non-reproducible)
   - Use release versions for production

## Plugin Configuration

### Compiler Plugin
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <version>3.11.0</version>
  <configuration>
    <release>17</release>
    <compilerArgs>
      <arg>-parameters</arg>  <!-- Preserve parameter names -->
    </compilerArgs>
  </configuration>
</plugin>
```
```

### 5. CI/CD Pipeline Generator

**New Command**: `/ci-cd`

**Workflow**:
1. Detect project type (maven, gradle, python, nodejs, kotlin)
2. Ask user: Target platform (GitHub Actions, GitLab CI, Bitbucket Pipelines)
3. Ask user: Deployment target (AWS, GCP, Azure, Docker, Kubernetes, none)
4. Ask user: Advanced features (matrix builds, reusable workflows, security scanning, container deployment)
5. Generate pipeline YAML with:
   - Build stage (dependency caching, matrix builds for multiple versions)
   - Test stage (parallel test execution)
   - Security scan stage (SAST, DAST, secrets, dependency scan, container scan)
   - Docker build stage (multi-stage builds, layer caching)
   - Deploy stage (conditional on branch, blue/green or canary strategies)

**Template Structure** (Enhanced for 2026):
```
skills/ci-cd-templates/
├── github-actions/
│   ├── basic/                       # Standard templates
│   │   ├── maven.yml
│   │   ├── gradle.yml
│   │   ├── python.yml
│   │   └── nodejs.yml
│   ├── advanced/                    # Modern patterns
│   │   ├── maven-matrix.yml        # Matrix builds (Java 11, 17, 21)
│   │   ├── maven-docker.yml        # Docker build + push
│   │   ├── maven-k8s-helm.yml      # Deploy to K8s with Helm
│   │   └── maven-security.yml      # Enhanced security scanning
│   └── reusable/                    # Reusable workflows (2026 standard)
│       ├── build-java.yml
│       ├── test-java.yml
│       ├── security-scan.yml
│       └── deploy-aws.yml
├── gitlab-ci/
│   ├── basic/
│   │   ├── maven.yml
│   │   ├── gradle.yml
│   │   ├── python.yml
│   │   └── nodejs.yml
│   └── advanced/
│       ├── maven-dag.yml           # DAG pipelines with 'needs'
│       ├── maven-parent-child.yml  # Parent-child for monorepos
│       ├── maven-security.yml      # GitLab native security scanning
│       └── maven-k8s.yml           # GitOps deployment
├── bitbucket-pipelines/
│   ├── basic/
│   │   ├── maven.yml
│   │   ├── gradle.yml
│   │   ├── python.yml
│   │   └── nodejs.yml
│   └── advanced/
│       ├── maven-parallel.yml      # Parallel steps
│       ├── maven-pipes.yml         # Bitbucket Pipes integration
│       ├── maven-jira.yml          # Jira integration (build status)
│       └── maven-docker.yml        # Docker build + deploy
├── docker/                          # Multi-stage Dockerfiles
│   ├── Dockerfile.maven
│   ├── Dockerfile.gradle
│   ├── Dockerfile.python
│   └── Dockerfile.nodejs
├── kubernetes/                      # K8s deployment manifests
│   ├── manifests/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── helm-charts/
│   │   └── app-chart/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       └── templates/
│   └── argo-rollouts/              # Canary/Blue-Green
│       ├── rollout-canary.yaml
│       └── rollout-bluegreen.yaml
└── deployment-patterns/             # Strategy guides
    ├── blue-green.md
    ├── canary.md
    └── gitops.md
```

**Example Template** (`skills/ci-cd-templates/github-actions/maven.yml`):
```yaml
name: Maven CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  JAVA_VERSION: '17'
  MAVEN_OPTS: '-Dmaven.repo.local=.m2/repository'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK ${{ env.JAVA_VERSION }}
      uses: actions/setup-java@v4
      with:
        java-version: ${{ env.JAVA_VERSION }}
        distribution: 'temurin'
        cache: 'maven'

    - name: Build with Maven
      run: mvn clean verify -B

    - name: Run tests
      run: mvn test -B

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results
        path: '**/target/surefire-reports/*.xml'

  security-scan:
    runs-on: ubuntu-latest
    needs: build

    steps:
    - uses: actions/checkout@v4

    - name: Run OWASP Dependency Check
      run: mvn org.owasp:dependency-check-maven:check

    - name: Upload dependency check report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: dependency-check-report
        path: '**/target/dependency-check-report.html'

  deploy:
    runs-on: ubuntu-latest
    needs: [build, security-scan]
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Set up JDK ${{ env.JAVA_VERSION }}
      uses: actions/setup-java@v4
      with:
        java-version: ${{ env.JAVA_VERSION }}
        distribution: 'temurin'
        cache: 'maven'

    - name: Build JAR
      run: mvn clean package -DskipTests -B

    - name: Deploy to AWS
      # Add deployment logic here
      run: echo "Deploy to AWS"
```

---

## Implementation Phases

### Phase 0: Test Infrastructure Setup (Week 1)

**Goal**: Establish comprehensive testing framework before implementation.

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P0-01 | Set up Vitest test runner | S | Vitest configured, sample test passes |
| P0-02 | Create HookTestHarness | M | Can simulate tool execution and verify hook behavior |
| P0-03 | Create AgentTestHarness | M | Can test agent behavior without API calls |
| P0-04 | Create TemplateTestHarness | S | Can validate CI/CD templates with snapshot testing |
| P0-05 | Set up GitHub Actions CI | M | Runs tests on push (Linux, macOS, Windows) |
| P0-06 | Create test project fixtures | M | Sample projects for Python, Java, Node.js, monorepo |

**Deliverables**:
- `tests/harness/hook-test-harness.js`
- `tests/harness/agent-test-harness.js`
- `tests/harness/template-test-harness.js`
- `.github/workflows/test.yml`
- `tests/fixtures/{python,java,nodejs,monorepo}/`

**Effort**: 5 days

---

### Phase 1: Foundation (Week 2)

**Goal**: Project detection, runtime hook filtering system, and intelligent hook activation (including monorepo support).

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P1-00 | Verify hook matcher capabilities | S | Document Claude Code hook limitations, confirm runtime filtering approach |
| P1-01 | Create project type detection script | L | Detects multiple types (nodejs+maven+python), supports monorepos |
| P1-02 | Implement manifest hash-based caching | M | Stores in `.claude/project-type.json` with hash invalidation |
| P1-03 | Build runtime hook filtering framework | L | Smart hook scripts filter by project type and file extension |
| P1-04 | Create smart-formatter.js universal hook | M | Runs ruff/prettier/google-java-format based on project type |
| P1-05 | Create maven-advisor.js hook | S | Recommends `mvn verify` over `install` in Maven projects |
| P1-06 | Refactor existing hooks with runtime filtering | L | JS/TS hooks only fire on nodejs projects via script logic |
| P1-07 | Create SessionStart hook for detection | S | Auto-detects project type on session start |
| P1-08 | Unit tests for detection & hook filtering | M | 60+ test scenarios covering edge cases |

**Deliverables**:
- `scripts/detect-project-type.js` (enhanced with monorepo support)
- `scripts/hooks/smart-formatter.cjs` (NEW - universal formatter)
- `scripts/hooks/maven-advisor.cjs` (NEW - Maven recommendations)
- `scripts/hooks/session-start.cjs` (enhanced)
- `hooks/hooks.json` (simple matchers: "Edit|Write", "Bash")
- `tests/lib/detect-project-type.test.js` (60+ scenarios)
- `tests/hooks/smart-formatter.test.js` (runtime filtering tests)

**Effort**: 8 days (unchanged)

---

### Phase 2: Python Support (Week 3)

**Goal**: Full Python ecosystem support with modern 2026 tooling (Ruff, uv, Semgrep).

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P2-01 | Create Python reviewer agent | L | Reviews for PEP 8, type hints, security (Semgrep patterns) |
| P2-02 | Create Python patterns skill | M | Project structure, packaging (uv, poetry, pyproject.toml), virtual envs |
| P2-03 | Add Python style rules | S | PEP 8, type hints, docstrings |
| P2-04 | Python PostToolUse hooks | M | **Ruff** (format+check), mypy/pyright on Edit |
| P2-05 | Python security checks | M | Semgrep SAST, pip-audit, no eval/exec warnings |
| P2-06 | Tool availability detection | S | Graceful degradation when ruff/mypy not installed |
| P2-07 | Integration tests | M | Test on real Python project (Flask/FastAPI app) |

**Deliverables**:
- `agents/python-reviewer.md` (updated with Ruff, Semgrep, pip-audit)
- `skills/python-patterns/skill.md` (includes uv, poetry)
- `rules/python-style.md`
- `scripts/hooks/python-format.cjs` (Ruff-based)
- `scripts/hooks/python-security.cjs` (Semgrep + pip-audit)
- `tests/integration/python-project.test.js`

**Effort**: 7 days (was 5)

---

### Phase 3: Java/Kotlin/Groovy Support (Week 4)

**Goal**: JVM ecosystem support (Java, Kotlin, Groovy) with layered security.

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P3-01 | Create Java reviewer agent | L | Google Style, null safety, concurrency, SpotBugs integration |
| P3-02 | Create Kotlin reviewer agent | L | Kotlin idioms, null safety, coroutines, ktfmt/ktlint, detekt |
| P3-03 | Create Groovy reviewer agent | M | DSL patterns, metaprogramming, Spock |
| P3-04 | Add Java style rules | S | Google Java Style Guide, layered security (SpotBugs, PMD, Checkstyle) |
| P3-05 | Add Kotlin patterns skill | M | Coroutines, null safety, Java interop annotations |
| P3-06 | Java PostToolUse hooks | M | google-java-format on Edit |
| P3-07 | Kotlin PostToolUse hooks | M | ktfmt/ktlint + detekt on Edit |
| P3-08 | Java security checks | M | SpotBugs + FindSecurityBugs, no SQL injection |
| P3-09 | Integration tests (polyglot) | M | Test Java + Kotlin in same project, verify correct hooks fire |

**Deliverables**:
- `agents/java-reviewer.md` (updated with SpotBugs, PMD, Checkstyle)
- `agents/kotlin-reviewer.md` (NEW)
- `agents/groovy-reviewer.md`
- `skills/kotlin-patterns/skill.md` (NEW)
- `rules/java-style.md`
- `scripts/hooks/java-format.cjs`
- `scripts/hooks/kotlin-format.cjs` (NEW)
- `tests/integration/jvm-polyglot.test.js` (NEW)

**Effort**: 8 days (was 5)

---

### Phase 4: Build Tools (Week 5)

**Goal**: Maven and Gradle expertise with modern features (wrapper, version catalogs, dependency locking).

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P4-01 | Create Maven expert agent | L | Dependency mgmt, multi-module, lifecycle, wrapper enforcement |
| P4-02 | Create Gradle expert agent | L | Version catalogs, dependency locking, configuration cache (v9 preferred), task optimization |
| P4-03 | Maven patterns skill | M | Multi-module, lifecycle, plugins, wrapper usage |
| P4-04 | Gradle patterns skill | M | **Version catalogs** (libs.versions.toml), dependency locking, build cache, configuration cache, Kotlin DSL |
| P4-05 | Maven wrapper detection | S | Detect mvnw, suggest wrapper over global maven |
| P4-06 | Gradle wrapper detection | S | Detect gradlew, suggest wrapper over global gradle |
| P4-07 | Gradle version catalog detection | M | Detect gradle/libs.versions.toml, parse for dependency versions |
| P4-08 | Maven PreToolUse hooks | S | Suggest `verify` over `install`, `mvnw` over `mvn` |
| P4-09 | Gradle PreToolUse hooks | S | Enforce wrapper (`./gradlew`), detect version catalog |
| P4-10 | Integration tests | M | Test Maven multi-module, Gradle with version catalog |

**Deliverables**:
- `agents/maven-expert.md` (wrapper enforcement)
- `agents/gradle-expert.md` (version catalogs, dependency locking)
- `skills/maven-patterns/skill.md`
- `skills/gradle-patterns/skill.md` (includes version catalogs, Gradle 9 features)
- `scripts/hooks/maven-suggestions.cjs`
- `scripts/hooks/gradle-wrapper.cjs`
- `tests/integration/maven-multi-module.test.js` (NEW)
- `tests/integration/gradle-version-catalog.test.js` (NEW)

**Effort**: 7 days (was 5)

---

### Phase 5: CI/CD Pipelines (Weeks 6-9)

**Goal**: Generate modern CI/CD pipelines for GitHub Actions, GitLab CI, and Bitbucket Pipelines with security scanning, Docker, and Kubernetes deployment.

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P5-01 | Create CI/CD architect agent | XL | Pipeline design for all 3 platforms, caching, security |
| **P5-02** | **GitHub Actions basic templates** | **M** | **Maven, Gradle, Python, Node.js, Kotlin (5 stacks)** |
| P5-03 | GitHub Actions reusable workflows | L | Shared build-java, test, security-scan, deploy workflows |
| P5-04 | GitHub Actions matrix builds | M | Test multiple Java versions (11, 17, 21), OS (Linux, Windows, macOS) |
| P5-05 | GitHub Actions advanced caching | M | Docker layer cache, Gradle configuration cache, build cache |
| **P5-06** | **GitLab CI basic templates** | **M** | **Maven, Gradle, Python, Node.js, Kotlin (5 stacks)** |
| P5-07 | GitLab CI DAG pipelines | M | Use `needs` keyword for parallel execution |
| P5-08 | GitLab CI parent-child pipelines | L | Monorepo support with parent-child triggers |
| P5-09 | GitLab CI native security | M | SAST, DAST, dependency scanning, container scanning |
| **P5-10** | **Bitbucket Pipelines basic templates** | **M** | **Maven, Gradle, Python, Node.js, Kotlin (5 stacks)** |
| P5-11 | Bitbucket Pipelines parallel steps | M | Parallel test execution |
| P5-12 | Bitbucket Pipes integration | M | AWS deployment, Jira integration |
| P5-13 | Docker multi-stage templates | L | Dockerfile for all stacks (Maven, Gradle, Python, Node.js) |
| P5-14 | Kubernetes manifests | L | Deployment, Service, Ingress for all stacks |
| P5-15 | Helm chart templates | XL | Generic app chart with customization for each stack |
| P5-16 | Enhanced security scanning | L | SAST (SonarQube/Semgrep), DAST (OWASP ZAP), secrets (GitLeaks), containers (Trivy) |
| P5-17 | Deployment patterns | M | Blue/Green, Canary, GitOps guides |
| P5-18 | Create `/ci-cd` command | M | Interactive generator for all platforms |
| P5-19 | CI/CD best practices skill | M | Caching, parallelization, security, cost optimization |
| P5-20 | Pipeline validation hooks | M | Validate YAML syntax on Write |
| P5-21 | Template testing automation | XL | Generate and validate pipelines for all stacks × platforms |
| P5-22 | Integration tests | L | Test generated pipelines on actual CI/CD platforms |

**Deliverables**:
- `agents/ci-cd-architect.md`
- **GitHub Actions**:
  - `skills/ci-cd-templates/github-actions/basic/` (5 stacks)
  - `skills/ci-cd-templates/github-actions/advanced/` (matrix, Docker, K8s, security)
  - `skills/ci-cd-templates/github-actions/reusable/` (shared workflows)
- **GitLab CI**:
  - `skills/ci-cd-templates/gitlab-ci/basic/` (5 stacks)
  - `skills/ci-cd-templates/gitlab-ci/advanced/` (DAG, parent-child, security, K8s)
- **Bitbucket Pipelines**:
  - `skills/ci-cd-templates/bitbucket-pipelines/basic/` (5 stacks)
  - `skills/ci-cd-templates/bitbucket-pipelines/advanced/` (parallel, Pipes, Jira)
- `skills/ci-cd-templates/docker/` (Dockerfiles for all stacks)
- `skills/ci-cd-templates/kubernetes/` (manifests, Helm charts, Argo Rollouts)
- `skills/deployment-patterns/` (blue-green.md, canary.md, gitops.md)
- `commands/ci-cd.md`
- `skills/ci-cd-patterns/skill.md` (enhanced with container/K8s patterns)
- `scripts/hooks/validate-pipeline.cjs`
- `tests/integration/ci-cd-templates.test.js`

**Effort**: 22 days (was 10 days)

---

### Phase 6: Comprehensive Testing & Documentation (Weeks 10-11)

**Goal**: Ensure 80%+ test coverage, cross-platform compatibility, and quality documentation.

| Task | Description | Effort | Acceptance Criteria |
|------|-------------|--------|---------------------|
| P6-01 | Unit tests comprehensive suite | L | 60+ scenarios, ≥80% coverage |
| P6-02 | Integration tests - Python | M | Ruff/mypy run correctly on real Flask app |
| P6-03 | Integration tests - Java/Kotlin | M | google-java-format + SpotBugs work on Spring Boot app |
| P6-04 | Integration tests - Build tools | M | Maven/Gradle suggestions fire correctly |
| P6-05 | Integration tests - Monorepo | L | Python in /ml, Java in /backend, Node in /frontend - correct hooks |
| P6-06 | Edge case testing | M | Missing tools, invalid configs, errors, cross-platform paths |
| P6-07 | Cross-platform validation | L | Test on Windows, macOS, Linux (WSL2) |
| P6-08 | Performance benchmarking | M | Hook execution <2s (95th percentile) |
| P6-09 | CI/CD template validation | L | All generated pipelines pass validation, run successfully |
| P6-10 | Security testing | M | Expression evaluator injection prevention, secret detection accuracy |
| P6-11 | Update README with new features | M | Document Python/Java/Kotlin/CI-CD support |
| P6-12 | Create migration guide | M | For existing plugin users (breaking changes, new features) |
| P6-13 | API documentation | S | Document all public functions, test harnesses |
| P6-14 | Contribute agents back to upstream | S | Submit PR with Python/Java/Kotlin agents |

**Deliverables**:
- `tests/unit/` (60+ test scenarios)
- `tests/integration/` (50+ test scenarios covering Python, Java, Kotlin, monorepo, CI/CD)
- `tests/edge-cases/` (25+ scenarios for errors, missing tools, cross-platform)
- Test coverage report (≥80%)
- Performance benchmark report
- `README.md` (updated with all new features)
- `MIGRATION.md` (new - breaking changes guide)
- `API.md` (new - public API documentation)
- PR to `affaan-m/everything-claude-code`

**Effort**: 12 days (was 5)

---

## Design Decisions

### 1. Project Detection Strategy

**Decision**: File-based detection (manifest files) with caching.

**Rationale**:
- Fast (no git/language detection needed)
- Reliable (manifest files are source of truth)
- Cacheable (TTL prevents repeated checks)
- Cross-platform (works on Windows/Mac/Linux)

**Alternatives Considered**:
- ❌ Language detection via file extensions (unreliable for mixed projects)
- ❌ Git history analysis (slow, not all projects use git)

### 2. Hook Conditional Logic

**Decision**: Extend matcher syntax with `project_type` variable.

**Rationale**:
- Backward compatible (existing matchers still work)
- Declarative (no code changes to hook system)
- Composable (can combine with existing matchers)

**Example**:
```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\.py$\" && project_type contains \"python\"",
  "hooks": [...]
}
```

**Alternatives Considered**:
- ❌ Separate hook files per project type (duplication)
- ❌ Runtime hook filtering in Node.js (requires core changes)

### 3. Agent Specialization

**Decision**: Create language-specific reviewer agents (python-reviewer, java-reviewer) rather than enhancing generic code-reviewer.

**Rationale**:
- **Domain Expertise**: Each language has unique patterns (Python: PEP 8, Java: null safety)
- **Model Selection**: Can use different models (opus for complex, sonnet for fast)
- **Tool Requirements**: Different linters per language (black vs google-java-format)
- **Prompt Size**: Keeps prompts focused (better results)

**Alternatives Considered**:
- ❌ Single generic reviewer with language parameter (prompt too large)
- ❌ Language detection within agent (adds complexity)

### 4. CI/CD Template Structure

**Decision**: YAML templates per platform × language, assembled by agent.

**Rationale**:
- **Maintainability**: Templates are standard YAML (no code generation)
- **Customizability**: Users can fork and edit templates
- **Best Practices**: Each template embeds platform-specific optimizations
- **Composability**: Agent can mix base template + deployment extensions

**Template Inheritance**:
```
base-template.yml          # Common stages (build, test, deploy)
├── maven.yml              # Maven-specific (dependency cache, verify command)
├── gradle.yml             # Gradle-specific (gradle cache, wrapper)
├── python.yml             # Python-specific (pip cache, venv)
└── nodejs.yml             # Node-specific (npm cache, node version)
```

**Alternatives Considered**:
- ❌ Code generation (complex, hard to maintain)
- ❌ Single universal template (too generic, misses optimizations)

### 5. Hook Execution Order

**Decision**: Execute language-agnostic hooks first, then language-specific.

**Order**:
1. Universal hooks (tmux check, git push review)
2. Language-specific hooks (black for Python, Prettier for JS)
3. Security hooks (credential scanning, dependency checks)

**Rationale**:
- Fast failures (tmux check fails immediately)
- Formatting before validation (prettier → typescript check)
- Security last (most expensive, only run if earlier checks pass)

---

## Migration Strategy

### For Existing Plugin Users

**Backward Compatibility**: All existing functionality preserved.

**Opt-In Migration**:
1. **No Action Required**: JS/TS projects work as before (project detection auto-enables hooks)
2. **Python Projects**: Hooks auto-activate when `pyproject.toml` or `setup.py` detected
3. **Java Projects**: Hooks auto-activate when `pom.xml` or `build.gradle` detected
4. **Manual Override**: `.claude/project-type.json` can force specific types

**Breaking Changes**: None.

---

## Testing Strategy

### Unit Tests

**Scope**: Individual scripts and functions.

**Tools**: Jest (Node.js test runner)

**Test Cases**:
- `detect-project-type.js`: Correctly identifies project types from manifests
- `python-format.js`: Runs black/flake8 only on .py files
- `java-format.js`: Runs google-java-format only on .java files
- `validate-pipeline.js`: Detects invalid YAML syntax

### Integration Tests

**Scope**: End-to-end workflows.

**Test Projects**:
1. **Python Flask API** (pyproject.toml, pytest)
2. **Spring Boot App** (pom.xml, JUnit)
3. **Gradle Multi-Module** (build.gradle.kts, Kotlin)
4. **React + Node.js** (package.json, Jest)

**Test Scenarios**:
- Edit Python file → black/flake8 run automatically
- Edit Java file → google-java-format runs
- Run `mvn install` → Hook suggests `mvn verify`
- Run `gradle build` → Hook suggests `./gradlew`
- `/ci-cd` command → Generates working GitHub Actions workflow

### Acceptance Tests

**Criteria**:
- ✅ Zero false positives (JS hooks don't fire on Python projects)
- ✅ All language-specific hooks execute within 2 seconds
- ✅ CI/CD templates pass validation (yamllint)
- ✅ Generated pipelines run successfully on target platforms

---

## Security Considerations

### Dependency Vulnerabilities

**Hooks** should detect:
- Python: `safety check`, `pip-audit`
- Maven: `mvn dependency-check:check`
- Gradle: `./gradlew dependencyCheckAnalyze`
- Node.js: `npm audit`, `yarn audit`

**CI/CD Templates** should include:
- OWASP Dependency Check (Maven/Gradle)
- Snyk or Trivy scanning (Docker images)
- SAST tools (SonarQube, CodeQL)

### Credential Scanning

**PreToolUse Hooks** should block:
- Hardcoded API keys (regex patterns)
- AWS credentials (access key format)
- Database passwords in code
- Private SSH keys in repository

**Patterns**:
```javascript
const DANGEROUS_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/,           // OpenAI API keys
  /AKIA[0-9A-Z]{16}/,              // AWS access keys
  /ghp_[a-zA-Z0-9]{36}/,           // GitHub personal tokens
  /postgres:\/\/.*:.*@/,            // DB connection strings with passwords
];
```

---

## Documentation Requirements

### User Documentation

1. **README.md Updates**
   - Multi-language support section
   - CI/CD generation guide
   - Project detection explanation

2. **New Guides**
   - `docs/python-setup.md` - Python environment setup
   - `docs/java-setup.md` - JDK, Maven, Gradle installation
   - `docs/ci-cd-guide.md` - Pipeline customization

3. **Agent Documentation**
   - Each agent has inline examples
   - Security checks documented with rationale
   - Tool requirements listed (black, mypy, etc.)

### Developer Documentation

1. **CONTRIBUTING.md Updates**
   - How to add new language support
   - Hook matcher syntax reference
   - Template inheritance patterns

2. **Architecture Docs**
   - `docs/architecture.md` - System design
   - `docs/hooks.md` - Hook execution flow
   - `docs/project-detection.md` - Detection algorithm

---

## Future Enhancements (Out of Scope)

### Phase 7+ Ideas

1. **More Languages**
   - Rust (Cargo, clippy)
   - Go (go.mod, golangci-lint)
   - Kotlin (ktlint, detekt)

2. **Advanced CI/CD**
   - Deployment strategies (blue-green, canary)
   - Multi-cloud pipelines (AWS + GCP)
   - GitOps integration (ArgoCD, Flux)

3. **Performance Optimization**
   - Parallel hook execution
   - Incremental linting (only changed files)
   - Build cache analysis

4. **AI-Powered Features**
   - Auto-fix suggestions (not just detection)
   - Performance profiling
   - Test generation

---

## Success Metrics (Post-Launch)

### Adoption Metrics

- **Fork Count**: Track forks of `doublefx/everything-claude-code`
- **Usage Analytics**: Number of `/ci-cd` command invocations
- **Contribution Rate**: PRs from community for new languages

### Quality Metrics

- **Hook Accuracy**: False positive rate < 0.5%
- **Pipeline Success**: Generated pipelines pass on first run > 90%
- **Performance**: Hooks execute in < 2 seconds (95th percentile)
- **Test Coverage**: ≥ 80% code coverage
- **Cross-Platform**: Works on Windows, macOS, Linux (WSL2) without issues

### Community Metrics

- **Upstream Contribution**: Python/Java agents merged to `affaan-m/everything-claude-code`
- **Issue Resolution**: <7 day average response time
- **Documentation Quality**: <5% "unclear docs" issues

---

## Risks and Mitigations

### Risk 1: Hook Performance Degradation

**Risk**: Running multiple linters (black, flake8, mypy) on every edit slows down workflow.

**Likelihood**: Medium
**Impact**: High

**Mitigation**:
- Run linters in parallel (Promise.all)
- Cache linter results (file hash-based)
- Provide opt-out via `.claude/disable-hooks.json`

### Risk 2: Platform Fragmentation

**Risk**: GitHub Actions, GitLab CI, Bitbucket have divergent YAML syntax, causing template maintenance burden.

**Likelihood**: High
**Impact**: Medium

**Mitigation**:
- Use common base template structure
- Document platform-specific quirks
- Automate template testing in CI

### Risk 3: False Positive Security Warnings

**Risk**: Regex-based credential detection flags legitimate code patterns.

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Whitelist patterns (e.g., test fixtures)
- Allow inline suppressions (`# nosec` comments)
- Provide clear error messages with fix suggestions

### Risk 4: Upstream Divergence

**Risk**: `affaan-m/everything-claude-code` releases breaking changes, causing merge conflicts.

**Likelihood**: Low
**Impact**: High

**Mitigation**:
- Subscribe to upstream releases
- Automated merge conflict detection
- Maintain comprehensive test suite

---

## Appendix

### A. Estimated Effort (Revised)

| Phase | Weeks | Person-Days | Original Estimate |
|-------|-------|-------------|-------------------|
| Phase 0: Test Infrastructure Setup | 1 | 5 | 0 (NEW) |
| Phase 1: Foundation | 1.5 | 8 | 5 (+60%) |
| Phase 2: Python Support | 1.5 | 7 | 5 (+40%) |
| Phase 3: Java/Kotlin/Groovy Support | 1.5 | 8 | 5 (+60%) |
| Phase 4: Build Tools | 1.5 | 7 | 5 (+40%) |
| Phase 5: CI/CD Pipelines | 4.5 | 22 | 10 (+120%) |
| Phase 6: Testing & Docs | 2.5 | 12 | 5 (+140%) |
| **Total** | **14** | **69** | **35 (+97%)** |

**Timeline Options**:

**1 Developer (Sequential)**:
- **14 weeks (69 days)** - All phases sequential
- Safest approach, lowest risk

**2 Developers (Parallelized)**:
- Phase 0: 1 week (both developers)
- Phase 1: 1.5 weeks (both developers - blocking)
- Phases 2-4: 1.5 weeks (parallel - Python + Java + Build Tools simultaneously)
- Phase 5: 4.5 weeks (both developers)
- Phase 6: 2.5 weeks (both developers)
- **Total: ~9-10 weeks**

**3 Developers (Maximum Parallelization)**:
- Phases 2-4 fully parallel: 1.5 weeks
- Diminishing returns on other phases
- **Total: ~7-8 weeks**

**Recommended**: **2 developers for 9-10 weeks** (best cost/speed balance)

**Assumptions**:
- Developers familiar with Node.js, Python, Java/Kotlin
- Access to test environments (GitHub, GitLab, Bitbucket)
- Includes comprehensive testing (80%+ coverage) and documentation
- Excludes future enhancements (Phase 7+)
- Includes 15% buffer for unknowns (industry standard)

### B. Technology Stack (Updated for 2026)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Hooks | Node.js | Cross-platform, existing plugin uses JS |
| Hook Filtering | Runtime JS scripts | Claude Code matchers support only basic patterns; runtime filtering for conditional logic |
| Templates | YAML | Standard for GitHub/GitLab/Bitbucket |
| Testing | **Vitest** | 5-10x faster than Jest, better ESM support, Jest-compatible API |
| **Python Linters** | **Ruff, Semgrep, pip-audit, mypy/pyright** | **2026 standards (10-100x faster than black/flake8)** |
| **Java Linters** | **google-java-format, SpotBugs, PMD, Checkstyle** | **Layered security approach** |
| **Kotlin Linters** | **ktfmt/ktlint, detekt** | **Kotlin code quality and style** |
| **Python Package Manager** | **uv (primary), poetry, pip** | **uv is 10-100x faster, 2026 standard** |
| CI/CD | GitHub Actions | For testing the plugin itself (cross-platform) |
| Container | Docker | Multi-stage builds for deployments |
| Orchestration | Kubernetes + Helm | Modern deployment patterns |

### C. Related Work

- **Upstream Plugin**: `affaan-m/everything-claude-code` (JS/TS focused)
- **Python Tooling**: Ruff documentation, Semgrep, pip-audit, uv package manager
- **Java Style**: Google Java Style Guide, SpotBugs, PMD, Checkstyle documentation
- **Kotlin**: Kotlin style guide, ktfmt/ktlint, detekt documentation
- **Gradle**: Gradle 9.0 documentation (version catalogs, configuration cache, dependency locking)
- **Maven**: Maven best practices, Maven 4.0 considerations
- **CI/CD**: GitHub Actions (reusable workflows), GitLab CI (DAG pipelines), Bitbucket Pipelines (Pipes, Jira integration)
- **Container/K8s**: Docker multi-stage builds, Helm charts, Argo Rollouts
- **Security**: OWASP SAST/DAST guidelines, Trivy, GitLeaks, Semgrep security rules

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Frédéric THOMAS | Initial PRD draft |
| 2.0 | 2026-01-25 | Frédéric THOMAS + Multi-Agent Review | **Major revision** based on comprehensive multi-agent review:<br>• Added Phase 0 (Test Infrastructure)<br>• Enhanced project detection for monorepos<br>• Added expression evaluator specification<br>• Updated Python tooling (Ruff, uv, Semgrep, pip-audit)<br>• Added Kotlin support (ktfmt, detekt)<br>• Added Gradle version catalogs and Gradle 9 features<br>• Expanded CI/CD (GitHub/GitLab/Bitbucket + Docker + K8s)<br>• Enhanced security scanning (SAST/DAST/secrets/containers)<br>• Revised timeline: 35 days → 69 days (realistic)<br>• Added comprehensive testing strategy (135+ scenarios) |
| 2.1 | 2026-01-25 | Frédéric THOMAS + Agent Research | **Critical architecture fix** based on Claude Code hooks investigation:<br>• Removed expression evaluator (Claude Code matchers don't support complex expressions)<br>• Replaced with **runtime filtering** approach in hook scripts<br>• Updated Section 2 "Conditional Hook System" with working implementation<br>• Updated Phase 1 tasks (P1-00 through P1-08) to reflect runtime filtering<br>• Removed `expr-eval` dependency from Technology Stack<br>• Added smart-formatter.js and maven-advisor.js examples<br>• Timeline unchanged (8 days Phase 1) |

---

**Approval**:
- [ ] Technical Review
- [ ] Stakeholder Sign-Off
- [ ] Resource Allocation

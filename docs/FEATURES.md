# Features Documentation

**Version**: 3.2.0
**Last Updated**: 2026-02-28

---

## Table of Contents

1. [Project Detection](#project-detection)
2. [Runtime Hook Filtering](#runtime-hook-filtering)
3. [Language Support](#language-support)
4. [Build Tools](#build-tools)
5. [CI/CD Generation](#cicd-generation)
6. [Security Scanning](#security-scanning)
7. [Agent Teams](#agent-teams-experimental)
8. [Performance](#performance)

---

## Project Detection

### Overview

The plugin automatically detects your project type(s) by scanning for manifest files. This powers intelligent hook filtering and agent selection.

### How It Works

**Detection Algorithm**:

1. **Scan current directory** for known manifest files
2. **Detect types** from manifest indicators
3. **Return detected types**

**Note:** Detection is fast and runs on-demand. No caching needed - Serena memories store project configuration if configured.

### Supported Project Types

| Type | Indicators |
|------|-----------|
| `nodejs` | package.json, package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb |
| `python` | pyproject.toml, setup.py, requirements.txt, Pipfile, poetry.lock, uv.lock, environment.yml |
| `maven` | pom.xml, mvnw, mvnw.cmd |
| `gradle` | build.gradle, build.gradle.kts, settings.gradle, settings.gradle.kts, gradlew, gradlew.bat |
| `kotlin` | build.gradle.kts + Kotlin source files |

### Code Example

```javascript
const { detectProjectType } = require('./scripts/lib/detect-project-type');

// Detect from current directory
const types = detectProjectType();
console.log(types); // ['nodejs', 'python'] (for a polyglot project)

// Detect from specific directory
const types2 = detectProjectType('/path/to/project');
console.log(types2); // ['maven', 'java']
```

### Configuration Storage

**Serena Integration (if installed):**
- Project configuration stored in `project_config_context` memory
- Package manager preference, ecosystems, project types
- Persistent across sessions

**Without Serena:**
- Detection runs on-demand (fast, <200ms)
- No persistent storage needed

### Performance

| Scenario | Time |
|----------|------|
| Direct detection | <200ms |
| Monorepo (3 types) | <300ms |

### Monorepo Support

The detector handles monorepos correctly by detecting **multiple project types**:

```bash
my-monorepo/
├── backend/          # Maven + Java
│   └── pom.xml
├── frontend/         # Node.js + TypeScript
│   └── package.json
└── ml/               # Python
    └── pyproject.toml
```

When working in `backend/`, detection returns: `['maven', 'java']`
When working in `frontend/`, detection returns: `['nodejs']`
When working in `ml/`, detection returns: `['python']`

---

## Runtime Hook Filtering

### Overview

Magic Claude uses **runtime filtering** inside hook scripts. This provides:

- **Flexibility**: Full JavaScript logic for filtering
- **Maintainability**: Easy to understand and modify
- **Performance**: Cached project detection is fast
- **Correctness**: No limitations of matcher syntax

### How It Works

**Runtime filtering**:
```json
{
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/smart-formatter.cjs\""
  }]
}
```

**Inside smart-formatter.js**:
```javascript
const { detectProjectType } = require('../lib/detect-project-type');
const projectTypes = detectProjectType(process.cwd());

if (ext === '.py' && projectTypes.includes('python')) {
  // Only run Ruff in Python projects
  execSync(`ruff format "${filePath}"`, { stdio: 'inherit' });
}
```

### Benefits

1. **No Cross-Language Interference**
   - Python hooks only run in Python projects
   - Java hooks only run in Java projects
   - No spurious warnings

2. **Monorepo Support**
   - Hooks detect the **current subdirectory** context
   - Correct tools run in each sub-project

3. **Graceful Degradation**
   - If tool not installed, hook skips silently
   - No failed builds due to missing formatters

4. **Caching**
   - Project detection cached (<50ms)
   - Hooks remain fast despite extra logic

### Universal Hook Pattern

All language-specific hooks follow this pattern:

```javascript
// 1. Read hook input (Claude Code protocol)
const context = await readHookInput();

// 2. Extract file path
const filePath = context.tool_input?.file_path;

// 3. Detect project type
const projectTypes = detectProjectType(process.cwd());

// 4. Check if file and project type match
const ext = path.extname(filePath);
if (ext === '.py' && projectTypes.includes('python')) {
  // Run Python-specific logic
}

// 5. Pass through context (always!)
writeHookOutput(context);
```

### Hook Execution Flow

```
Edit file (main.py)
    ↓
Claude Code fires hooks
    ↓
smart-formatter.js executes
    ↓
Detect project type (from cache: 5ms)
    ↓
Check: .py extension? YES
Check: Python project? YES
    ↓
Run: ruff format main.py
    ↓
Pass through context to Claude Code
```

---

## Language Support

### Feature Matrix

| Feature | Node.js | Python | Java | Kotlin | Groovy |
|---------|---------|--------|------|--------|--------|
| Auto-formatting | ✅ Prettier | ✅ Ruff | ✅ google-java-format | ✅ ktfmt/ktlint | ❌ |
| Type checking | ✅ TypeScript | ✅ Pyright | ✅ javac | ✅ kotlinc | ❌ |
| Linting | ✅ ESLint | ✅ Ruff | ✅ SpotBugs | ✅ Detekt | ✅ CodeNarc |
| Security scanning | ✅ npm audit | ✅ Semgrep | ✅ SpotBugs | ✅ Detekt | ❌ |
| Package manager | ✅ npm/yarn/pnpm/bun | ✅ pip/uv/poetry | ✅ Maven | ✅ Gradle | ✅ Gradle |
| CI/CD templates | ✅ | ✅ | ✅ | ✅ (via Gradle) | ✅ (via Gradle) |
| Code reviewer agent | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pattern skills | ✅ | ✅ | ❌ | ✅ | ❌ |

### Python Support

**Tools**:
- **Formatter**: Ruff (10-100x faster than black)
- **Linter**: Ruff (combines flake8, isort, pyupgrade, and more)
- **Type Checker**: Pyright (3-5x faster than mypy)
- **Security**: Semgrep (OWASP Top 10, SANS Top 25)
- **Package Manager**: uv (10-100x faster than pip)

**Agent**: `/python-reviewer`
- Reviews Python code for best practices
- Checks PEP 8 compliance
- Suggests modern idioms (f-strings, dataclasses, async/await)
- Security checks (SQL injection, XSS, etc.)

**Skill**: `python-patterns`
- Modern Python 3.10+ features
- FastAPI patterns
- Django best practices
- Async/await patterns
- Testing with pytest

**Hooks**:
- `smart-formatter.js`: Auto-format with Ruff on file save
- `python-security.js`: Run Semgrep on file save (detects security issues)

**Example Workflow**:
```bash
# 1. Edit Python file
vim src/main.py

# 2. Auto-formatting happens automatically (if Ruff installed)
# [Hook] Formatted src/main.py with Ruff

# 3. Security scanning happens automatically (if Semgrep installed)
# [Hook] Semgrep: Found 2 issues in src/main.py
#   - SQL injection vulnerability (line 42)
#   - Hardcoded secret (line 58)

# 4. Review code
/python-reviewer

# 5. Get patterns
/python-patterns
```

### Java Support

**Tools**:
- **Formatter**: google-java-format (Google Java Style)
- **Linter**: SpotBugs + Error Prone
- **Build**: Maven or Gradle
- **Security**: SpotBugs security rules

**Agents**:
- `/java-reviewer`: Java code review
- `/maven-expert`: Maven optimization tips
- `/gradle-expert`: Gradle optimization tips

**Skills**:
- `maven-patterns`: Maven best practices
- `gradle-patterns`: Gradle best practices

**Hooks**:
- `smart-formatter.js`: Auto-format with google-java-format
- `java-security.js`: Run SpotBugs security checks
- `maven-advisor.js`: Suggest better Maven commands

**Example Workflow**:
```bash
# 1. Edit Java file
vim src/main/java/com/example/App.java

# 2. Auto-formatting (if google-java-format installed)
# [Hook] Formatted App.java with google-java-format

# 3. Run Maven
mvn install

# 4. Get Maven advice
# [Hook] Consider: mvn verify (faster than install for local builds)

# 5. Review code
/java-reviewer

# 6. Get Maven optimization tips
/maven-expert
```

### Kotlin Support

**Tools**:
- **Formatter**: ktfmt (Google Kotlin Style) or ktlint
- **Linter**: Detekt
- **Build**: Gradle (Kotlin DSL preferred)
- **Type Checking**: kotlinc

**Agent**: `/kotlin-reviewer`
- Reviews Kotlin code for best practices
- Checks idiomatic Kotlin (data classes, sealed classes, coroutines)
- Spring Boot + Kotlin patterns

**Skill**: `kotlin-patterns`
- Modern Kotlin 1.9+ features
- Coroutines and Flow
- Spring Boot with Kotlin
- Kotlin DSL patterns

**Hooks**:
- `smart-formatter.js`: Auto-format with ktfmt/ktlint
- `maven-advisor.js`: Gradle optimization tips

**Example Workflow**:
```bash
# 1. Edit Kotlin file
vim src/main/kotlin/com/example/App.kt

# 2. Auto-formatting (if ktfmt installed)
# [Hook] Formatted App.kt with ktfmt

# 3. Review code
/kotlin-reviewer

# 4. Get Kotlin patterns
/kotlin-patterns
```

---

## Build Tools

### Maven vs Gradle Comparison

| Feature | Maven | Gradle |
|---------|-------|--------|
| **Build Speed** | Slower (sequential) | Faster (parallel, incremental) |
| **Configuration** | XML (verbose) | Groovy/Kotlin DSL (concise) |
| **Flexibility** | Convention over configuration | Highly customizable |
| **Learning Curve** | Easier | Steeper |
| **IDE Support** | Excellent | Excellent |
| **Plugin Ecosystem** | Mature | Growing |
| **Best For** | Enterprise, stability | Modern projects, monorepos |

### Maven Expert

**Agent**: `/maven-expert`

**Provides Advice On**:
- Dependency management (BOM, dependencyManagement)
- Plugin configuration
- Multi-module projects
- Build optimization (profiles, parallel builds)
- Maven wrapper usage

**Example Output**:
```
Maven Best Practices Analysis

1. Use Maven Wrapper (mvnw)
   - Ensures consistent Maven version across team
   - Add: mvn wrapper:wrapper

2. Enable Parallel Builds
   - Add to pom.xml:
     <build>
       <plugins>
         <plugin>
           <groupId>org.apache.maven.plugins</groupId>
           <artifactId>maven-surefire-plugin</artifactId>
           <configuration>
             <parallel>methods</parallel>
             <threadCount>4</threadCount>
           </configuration>
         </plugin>
       </plugins>
     </build>

3. Use BOM for Dependency Management
   - Avoid version conflicts
   - Example: Spring Boot BOM, JUnit BOM

4. Optimize Build Commands
   - Use: mvn verify (for local testing)
   - Use: mvn clean install (only when publishing to local repo)
   - Use: mvn -DskipTests package (when tests already passed)
```

### Gradle Expert

**Agent**: `/gradle-expert`

**Provides Advice On**:
- Build script optimization (Kotlin DSL, buildSrc, convention plugins)
- Dependency resolution
- Multi-project builds
- Build caching (local and remote)
- Gradle wrapper usage

**Example Output**:
```
Gradle Best Practices Analysis

1. Use Kotlin DSL (build.gradle.kts)
   - Type-safe configuration
   - Better IDE support
   - Refactoring support

2. Enable Build Caching
   - Add to gradle.properties:
     org.gradle.caching=true
     org.gradle.parallel=true
     org.gradle.daemon=true

3. Use Version Catalogs
   - Centralize dependency versions
   - Create: gradle/libs.versions.toml
   - Reference: libs.spring.boot

4. Optimize Build Performance
   - Use: ./gradlew assemble (for build only)
   - Use: ./gradlew check (for tests and checks)
   - Use: ./gradlew --build-cache (for faster builds)
   - Use: ./gradlew --parallel (for multi-project)
```

### Maven Advisor Hook

**Hook**: `maven-advisor.js`

**Triggers**: On Bash command execution

**Provides Real-Time Advice**:

```bash
# You run:
mvn install

# Hook warns:
[Hook] Consider: mvn verify (faster than install for local builds)
[Hook] Use "mvn clean install" only when you need to publish to local repo

# You run:
gradle build

# Hook warns:
[Hook] Consider: Use ./gradlew instead of gradle for wrapper consistency
```

---

## CI/CD Generation

### Overview

Generate production-ready CI/CD pipelines with a single command.

### Supported Platforms

1. **GitHub Actions** (6 templates)
2. **GitLab CI** (6 templates)
3. **Bitbucket Pipelines** (4 templates)

### Supported Languages

- Python
- Node.js (npm, yarn, pnpm, bun)
- Java (Maven)
- Java (Gradle)
- Kotlin (via Gradle)

### Command

```bash
/ci-cd <platform> <language>
```

**Examples**:
```bash
/ci-cd github-actions python
/ci-cd gitlab-ci java-maven
/ci-cd bitbucket-pipelines nodejs
```

### Generated Pipeline Features

All generated pipelines include:

1. **Dependency Caching**
   - npm/yarn/pnpm cache for Node.js
   - pip/uv cache for Python
   - Maven/Gradle cache for Java

2. **Testing**
   - Unit tests
   - Integration tests
   - Code coverage reporting

3. **Linting & Formatting**
   - Prettier (Node.js)
   - Ruff (Python)
   - google-java-format (Java)

4. **Security Scanning**
   - npm audit (Node.js)
   - Semgrep (Python)
   - SpotBugs (Java)

5. **Build Artifacts**
   - Docker images
   - JAR/WAR files
   - npm packages

6. **Deployment** (optional)
   - Staging environment
   - Production environment
   - Manual approval gates

### Example: GitHub Actions Python Pipeline

**Generated File**: `.github/workflows/ci.yml`

```yaml
name: Python CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Install dependencies
        run: uv pip install -r requirements.txt

      - name: Lint with Ruff
        run: ruff check .

      - name: Type check with Pyright
        run: pyright .

      - name: Test with pytest
        run: pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          python3 -m pip install semgrep
          semgrep --config auto .

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push myapp:${{ github.sha }}
```

### Docker Multi-Stage Builds

**Generated Files**: `templates/docker/Dockerfile.<language>`

**Python Example**:
```dockerfile
# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv
RUN pip install uv

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN uv pip install --system -r requirements.txt

# Copy source
COPY . .

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /app /app

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Kubernetes Manifests

**Generated Files** (6 manifests):
- `deployment.yaml`: Application deployment
- `service.yaml`: Load balancer service
- `ingress.yaml`: Ingress rules
- `configmap.yaml`: Configuration
- `secret.yaml`: Secrets (base64 encoded)
- `hpa.yaml`: Horizontal Pod Autoscaler

**Deployment Example**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: myapp-secret
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Helm Charts

**Generated Chart**: `templates/helm/app-chart/`

**Files**:
- `Chart.yaml`: Chart metadata
- `values.yaml`: Default configuration
- `templates/deployment.yaml`: Deployment template
- `templates/service.yaml`: Service template
- `templates/ingress.yaml`: Ingress template
- `templates/configmap.yaml`: ConfigMap template
- `templates/secret.yaml`: Secret template
- `templates/hpa.yaml`: HPA template
- `templates/_helpers.tpl`: Helper templates

**Usage**:
```bash
# Install chart
helm install myapp ./helm/app-chart

# Upgrade with custom values
helm upgrade myapp ./helm/app-chart --set image.tag=v1.2.3

# Uninstall
helm uninstall myapp
```

---

## Security Scanning

### Integrated Tools

1. **Semgrep** (Python, JavaScript, TypeScript)
   - OWASP Top 10
   - SANS Top 25
   - Language-specific rules
   - Custom rules support

2. **Gitleaks** (All languages)
   - Secret detection
   - API keys, passwords, tokens
   - Pre-commit and CI/CD scanning

3. **Trivy** (Docker images)
   - CVE scanning
   - Dependency vulnerabilities
   - IaC misconfigurations

4. **SpotBugs** (Java)
   - Static analysis
   - Security bugs
   - Performance issues

### Security Hooks

**typescript-security.js**:
- Runs Semgrep + npm audit on TypeScript/JavaScript file save
- Detects eval(), innerHTML/XSS, SQL injection, hardcoded credentials, command injection, open redirects
- Reports findings to stderr (doesn't block save)

**python-security.js**:
- Runs Semgrep on Python file save
- Detects SQL injection, XSS, insecure deserialization
- Reports findings to stderr (doesn't block save)

**java-security.js**:
- Runs SpotBugs on Java file save
- Detects SQL injection, XXE, hardcoded credentials
- Reports findings to stderr

### Security Configs

**Generated Files**:
- `.gitleaks.toml`: Gitleaks configuration
- `semgrep.yaml`: Semgrep rules
- `trivy.yaml`: Trivy configuration
- `.semgrepignore`: Files to ignore
- `.trivyignore`: CVEs to ignore

### Example: Semgrep Output

```bash
# Edit Python file with SQL injection
vim src/database.py

# On save, Semgrep runs automatically:
[Hook] Semgrep: Found 2 issues in src/database.py

  ❌ SQL injection vulnerability (line 42)
     Detected string concatenation in SQL query. Use parameterized queries.

     cursor.execute("SELECT * FROM users WHERE id = " + user_id)
                                                        ^^^^^^^^^
     Fix: cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))

  ⚠️  Hardcoded secret (line 58)
     Detected hardcoded API key. Move to environment variable.

     API_KEY = "sk_live_abc123def456"
               ^^^^^^^^^^^^^^^^^^^^^^
     Fix: API_KEY = os.getenv("API_KEY")

[Hook] Run: semgrep --config auto src/database.py
```

---

## Agent Teams (Experimental)

### Overview

Agent Teams coordinate multiple Claude Code instances working in parallel with a shared task list and inter-agent messaging. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

### When to Use

| Scenario | Use | Why |
|----------|-----|-----|
| Focused task, result only | **Subagent** (Task tool) | Lower tokens, no coordination overhead |
| Sequential pipeline | **`/orchestrate`** | Structured handoffs, proven workflow |
| Parallel exploration, agents need to talk | **Agent Teams** | Inter-agent messaging, shared task list |
| Quick delegation | **Subagent** (Task tool) | Fast, disposable, minimal context |

**Default to subagents.** Only use Agent Teams when parallel exploration with inter-agent communication genuinely adds value.

### Pre-Configured Scenarios

The `agent-teams` skill provides ready-to-use team configurations:

1. **Parallel Code Review** -- 3 reviewers (security, quality, performance) examine changes simultaneously
2. **Competing Hypothesis Debugging** -- Multiple investigators test different theories in parallel
3. **Cross-Layer Feature Work** -- Backend, frontend, and tests teammates with file ownership
4. **Research and Architecture Exploration** -- Multiple approaches evaluated simultaneously

### Token Cost Guard Rails

- Max 3 teammates unless explicitly requested
- Focused spawn prompts (only task-specific context)
- Minimize broadcasts (use targeted messages)
- Delegate verbose I/O to subagents within teammates
- Set clear completion criteria

### Quality Gates

Use `TeammateIdle` and `TaskCompleted` hooks to enforce standards:

```json
{
  "TaskCompleted": [{
    "hooks": [{
      "type": "command",
      "command": "npm test 2>&1 || (echo 'Tests must pass' >&2 && exit 2)",
      "statusMessage": "Running test gate..."
    }]
  }]
}
```

Exit code 2 blocks the action and feeds stderr back as feedback.

---

## Performance

### Project Detection Performance

| Scenario | Time (avg) | Cache Hit Rate |
|----------|-----------|----------------|
| Single project type (cached) | 5ms | 95% |
| Single project type (uncached) | 120ms | - |
| Monorepo with 3 types (cached) | 8ms | 92% |
| Monorepo with 3 types (uncached) | 180ms | - |

**Optimization Tips**:
- Cache is automatically maintained
- Cache invalidates on manifest file changes
- Cache is per-directory (supports monorepos)

### Hook Execution Performance

| Hook | Time (with cache) | Time (without cache) |
|------|------------------|---------------------|
| smart-formatter.js (Node.js) | 150ms | 280ms |
| smart-formatter.js (Python) | 200ms | 350ms |
| smart-formatter.js (Java) | 180ms | 320ms |
| python-security.js (Semgrep) | 1.5s | 1.7s |
| java-security.js (SpotBugs) | 2.0s | 2.2s |
| maven-advisor.js | 50ms | 150ms |

**95th Percentile**: <2s for all hooks

### Test Suite Performance

| Test Category | Tests | Time |
|--------------|-------|------|
| Unit tests (lib) | 60+ | 0.5s |
| Unit tests (hooks) | 47+ | 1.0s |
| Integration tests | 80+ | 3.5s |
| E2E tests | 30+ | 5.0s |
| **Total** | **387** | **~10s** |

### Tool Performance (2026 Improvements)

| Tool | Old (2024) | New (2026) | Speedup |
|------|-----------|-----------|---------|
| Python formatter | black (3s) | Ruff (30ms) | **100x** |
| Python linter | flake8 (2s) | Ruff (40ms) | **50x** |
| Python type checker | mypy (10s) | Pyright (3s) | **3x** |
| Python package manager | pip (60s) | uv (2s) | **30x** |
| Java formatter | Eclipse (500ms) | google-java-format (200ms) | **2.5x** |
| Kotlin formatter | ktlint (400ms) | ktfmt (150ms) | **2.7x** |

---

## Summary

Magic Claude provides:

- **Intelligent project detection** with caching (<50ms)
- **Runtime hook filtering** for multi-language projects
- **Production-grade tooling** for Python, Java, Kotlin, Groovy
- **One-command CI/CD generation** for 3 platforms
- **Security scanning** integrated into workflows
- **Excellent performance** with 2026 tooling
- **13 project rules** for security, coding style, testing, and more (install via `/setup-rules`)

> **Note:** Plugin rules are NOT auto-loaded by Claude Code. Run `/setup-rules --install` or `/setup` to copy them to `~/.claude/rules/`.

**Next Steps**:
- Read [AGENT-CATALOG.md](AGENT-CATALOG.md) for agent details
- Read [PERFORMANCE.md](PERFORMANCE.md) for optimization tips
- Try [tutorials](tutorials/) for hands-on guides

---

*Features Documentation Version: 3.2 | Last Updated: 2026-02-28*

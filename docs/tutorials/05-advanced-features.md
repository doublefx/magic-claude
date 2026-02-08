# Tutorial 5: Advanced Features

**Duration**: 30 minutes
**Prerequisites**: Tutorials 01-04 completed
**Learning Goals**: Monorepo support, hook customization, performance optimization, advanced workflows

---

## Overview

This tutorial covers advanced v2.0 features:
- Monorepo and polyglot project support
- Custom hooks and rules
- Performance optimization
- Multi-agent orchestration
- Memory persistence and continuous learning

---

## Part 1: Monorepo Support (10 minutes)

### Understanding Monorepo Detection

The plugin detects project types **per directory**, enabling different hooks for different sub-projects.

### Example Monorepo Structure

```bash
my-monorepo/
├── backend/          # Java + Maven
│   ├── pom.xml
│   └── src/main/java/
├── frontend/         # Node.js + TypeScript
│   ├── package.json
│   └── src/
└── ml/               # Python
    ├── pyproject.toml
    └── src/
```

### Test Monorepo Detection

```bash
# In backend/
cd backend
node -e "console.log(require('../scripts/lib/detect-project-type').detectProjectType())"
# Output: [ 'maven', 'java' ]

# In frontend/
cd ../frontend
node -e "console.log(require('../scripts/lib/detect-project-type').detectProjectType())"
# Output: [ 'nodejs' ]

# In ml/
cd ../ml
node -e "console.log(require('../scripts/lib/detect-project-type').detectProjectType())"
# Output: [ 'python' ]
```

### Hooks Behavior in Monorepo

**When editing Python file in `ml/`**:
```bash
# Edit ml/src/model.py
# Hooks that run:
✅ smart-formatter.js → Ruff (Python detected)
✅ python-security.js → Semgrep (Python detected)
❌ google-java-format (Java NOT detected)
❌ Prettier (Node.js NOT detected)
```

**When editing Java file in `backend/`**:
```bash
# Edit backend/src/main/java/App.java
# Hooks that run:
✅ smart-formatter.js → google-java-format (Java detected)
✅ java-security.js → SpotBugs (Java detected)
❌ Ruff (Python NOT detected)
❌ Prettier (Node.js NOT detected)
```

### Generate CI/CD for Monorepo

**Ask Claude**:
```
"Generate GitHub Actions workflow for monorepo with Python (ml/), Java (backend/), and Node.js (frontend/)"
```

**Generated**: `.github/workflows/monorepo.yml`

```yaml
name: Monorepo CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      ml: ${{ steps.filter.outputs.ml }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            backend:
              - 'backend/**'
            frontend:
              - 'frontend/**'
            ml:
              - 'ml/**'

  backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
      - name: Build with Maven
        run: ./mvnw verify

  frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  ml:
    needs: detect-changes
    if: needs.detect-changes.outputs.ml == 'true'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ml
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: pytest
```

**Benefits**:
- Only tests changed sub-projects
- Parallel execution (3 jobs run simultaneously)
- Faster CI/CD (no unnecessary tests)

---

## Part 2: Custom Hooks (8 minutes)

### Create a Custom Hook

**Scenario**: Add a hook that checks for TODO comments before committing.

```bash
# Create custom hook script
cat > scripts/hooks/check-todos.cjs << 'EOF'
const { readHookInput, writeHookOutput } = require('../lib/hook-utils');
const fs = require('fs');

async function main() {
  const context = await readHookInput();

  if (!context) {
    process.exit(0);
  }

  const filePath = context.tool_input?.file_path;

  if (filePath && fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const todos = content.match(/TODO:|FIXME:/g);

    if (todos && todos.length > 0) {
      console.error(`[Hook] Warning: Found ${todos.length} TODO/FIXME comments in ${filePath}`);
      console.error('[Hook] Consider resolving before committing');
    }
  }

  writeHookOutput(context);
  process.exit(0);
}

main().catch(err => {
  console.error('[Hook] Error:', err.message);
  process.exit(0);
});
EOF
```

### Add Hook to hooks.json

```json
{
  "matcher": "tool == \"Edit\" || tool == \"Write\"",
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check-todos.cjs\""
  }],
  "description": "Check for TODO comments"
}
```

### Test the Hook

```bash
# Edit a file with TODO
echo "// TODO: Implement this function" > test.js

# In Claude Code, edit the file
# You should see: [Hook] Warning: Found 1 TODO/FIXME comments in test.js
```

---

## Part 3: Custom Rules (5 minutes)

### Create Project-Specific Rules

```bash
# Create project rules directory
mkdir -p .claude/rules

# Create custom rule
cat > .claude/rules/api-standards.md << 'EOF'
# API Standards

## REST API Requirements

1. **Versioning**: All endpoints must be versioned (`/api/v1/...`)
2. **Error Responses**: Use RFC 7807 Problem Details format
3. **Authentication**: All non-public endpoints must require auth
4. **Rate Limiting**: Implement rate limiting (100 req/min default)
5. **CORS**: Configure CORS appropriately
6. **Pagination**: Use cursor-based pagination for list endpoints
7. **HTTP Methods**:
   - GET: Read operations
   - POST: Create operations
   - PUT/PATCH: Update operations
   - DELETE: Delete operations

## Response Format

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-01-25T10:00:00Z",
    "version": "1.0.0"
  }
}
```

## Error Format (RFC 7807)

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Resource Not Found",
  "status": 404,
  "detail": "User with ID 123 not found",
  "instance": "/api/v1/users/123"
}
```
EOF
```

### Use Project Rules

**Ask Claude**:
```
"Review the API endpoints against our API standards"
```

Claude will load `.claude/rules/api-standards.md` and check compliance.

---

## Part 4: Performance Optimization (5 minutes)

### Optimize Project Detection Cache

```bash
# Check cache
cat .claude/everything-claude-code.project-type.json

# Output:
# {
#   "types": ["nodejs", "python"],
#   "hash": "abc123...",
#   "detected_at": "2026-01-25T10:00:00Z"
# }

# Cache is automatically maintained
# No manual intervention needed!
```

### Disable Expensive Hooks Locally

For local development, disable slow security scans:

**Edit `~/.claude/settings.json`**:
```json
{
  "hooks": [
    {
      "matcher": "false",  // Disable hook
      "hooks": [{
        "type": "command",
        "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/python-security.cjs\""
      }],
      "description": "Disabled locally - run in CI only"
    }
  ]
}
```

**Keep security scans in CI/CD** where they don't slow you down.

### Optimize Tool Installation

**Use Docker** for consistent, fast tooling:

```dockerfile
# Dockerfile.dev
FROM python:3.12-slim

# Install all tools once
RUN pip install uv && \
    uv pip install ruff pyright semgrep pytest

# Volume mount your code
VOLUME /workspace
WORKDIR /workspace

CMD ["bash"]
```

**Usage**:
```bash
# Build once
docker build -f Dockerfile.dev -t dev-env .

# Use for all projects
docker run -v $(pwd):/workspace -it dev-env
```

---

## Part 5: Multi-Agent Orchestration (5 minutes)

### Use the Orchestrate Command

**Scenario**: Implement a complex feature with multiple steps.

**Ask Claude**:
```
/orchestrate "Implement user authentication with JWT, including registration, login, logout, and password reset"
```

**Claude will**:
1. Use `/planner` to create task breakdown
2. Spawn `/architect` for system design
3. Spawn `/tdd-guide` for test creation
4. Spawn `/security-reviewer` for security analysis
5. Spawn language-specific reviewers as needed
6. Coordinate all agents to complete the feature

**Benefits**:
- Comprehensive feature implementation
- Multiple expert perspectives
- Parallel agent execution
- Coordinated deliverables

---

## Part 6: Memory Persistence (3 minutes)

### Understanding Memory Persistence

The plugin saves session state automatically:

**On Session Start**:
```
[SessionStart] Loading saved context from .claude/session.json
[SessionStart] Loaded: Last task was implementing user authentication
```

**During Session**:
```
# Context is saved automatically
# No manual intervention needed
```

**On Session End**:
```
[SessionEnd] Saving session context to .claude/session.json
[SessionEnd] Saved: Current task, recent decisions, file history
```

### Viewing Saved Context

```bash
# View saved session
cat .claude/session.json

# Output (example):
# {
#   "lastTask": "Implementing user authentication",
#   "openFiles": ["src/auth.py", "tests/test_auth.py"],
#   "decisions": [
#     "Using JWT for tokens",
#     "Using bcrypt for password hashing"
#   ],
#   "timestamp": "2026-01-25T10:00:00Z"
# }
```

---

## Part 7: Continuous Learning (4 minutes)

### Extract Patterns from Sessions

**After completing a feature**, extract learnings:

```
/learn
```

**Claude will**:
1. Analyze the session
2. Extract patterns and decisions
3. Create/update skills automatically
4. Save to `.claude/skills/custom/`

**Example Output**:
```
Extracted Patterns from Session

1. Authentication Pattern
   - JWT with 15-minute access tokens
   - Refresh tokens with 7-day expiry
   - Stored in httpOnly cookies

2. Error Handling Pattern
   - Use custom exception classes
   - Map exceptions to HTTP status codes
   - Return RFC 7807 problem details

3. Testing Pattern
   - Use pytest fixtures for test users
   - Mock external services (email, SMS)
   - Test authentication flow end-to-end

Saved to: .claude/skills/custom/auth-patterns.md
```

### Use Extracted Patterns

Next time you work on authentication:

```
"Apply the auth patterns from auth-patterns.md"
```

Claude will load your custom skill and apply the patterns.

---

## Summary: Advanced Features

You've learned:

- ✅ **Monorepo support**: Different hooks for different sub-projects
- ✅ **Custom hooks**: Create project-specific automations
- ✅ **Custom rules**: Enforce project standards
- ✅ **Performance optimization**: Cache, Docker, selective hooks
- ✅ **Multi-agent orchestration**: Coordinate multiple agents
- ✅ **Memory persistence**: Context saved across sessions
- ✅ **Continuous learning**: Extract and reuse patterns

---

## Best Practices for Advanced Usage

1. **Monorepos**:
   - Use path filters in CI/CD
   - Test only changed sub-projects
   - Maintain separate dependency files

2. **Custom Hooks**:
   - Always pass through context (`writeHookOutput`)
   - Never block operations (use warnings, not errors)
   - Handle errors gracefully

3. **Performance**:
   - Keep cache enabled (automatic)
   - Run expensive checks in CI only
   - Use Docker for consistent tooling

4. **Multi-Agent**:
   - Use `/orchestrate` for complex features
   - Let Claude coordinate agents
   - Review agent outputs collectively

5. **Continuous Learning**:
   - Run `/learn` after completing features
   - Review and refine extracted patterns
   - Share skills across team

---

## Troubleshooting Advanced Issues

### Issue: Hooks Interfere in Monorepo

**Symptom**: Python hooks running in Java project

**Fix**: Check project detection:
```bash
cd your/subdirectory
node -e "console.log(require('../../scripts/lib/detect-project-type').detectProjectType())"
```

If incorrect, verify manifest files exist.

### Issue: Custom Hook Not Running

**Fix**:
1. Check `hooks.json` syntax
2. Verify `${CLAUDE_PLUGIN_ROOT}` is set
3. Test hook manually:
```bash
echo '{"tool":"Edit","tool_input":{"file_path":"test.py"}}' | node scripts/hooks/your-hook.cjs
```

### Issue: Memory Persistence Not Working

**Fix**:
1. Check `.claude/` directory exists
2. Verify write permissions
3. Check `session.json` format

---

## Next Steps

You've completed all tutorials!

**Further Reading**:
- [FEATURES.md](../FEATURES.md) - Deep dive into all features
- [AGENT-CATALOG.md](../AGENT-CATALOG.md) - Complete agent reference
- [PERFORMANCE.md](../PERFORMANCE.md) - Performance optimization guide

**Get Involved**:
- Contribute custom agents/skills
- Share your workflows
- Report issues on GitHub

---

**Congratulations!** You're now an expert in Everything Claude Code v2.0!

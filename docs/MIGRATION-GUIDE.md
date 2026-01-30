# Migration Guide: v1.0 to v2.0

**Version**: 2.0.0
**Date**: 2026-01-25
**Migration Time**: 15-30 minutes

---

## Overview

Everything Claude Code v2.0 is a **major upgrade** that adds enterprise polyglot support (Python, Java, Kotlin, Groovy), modern 2026 tooling, intelligent runtime hook filtering, and CI/CD pipeline generation. This guide will help you migrate smoothly.

**Good News**: v2.0 is **99% backwards compatible**. Existing JavaScript/TypeScript features continue to work exactly as before.

---

## What's New in v2.0

### Major Features

1. **Enterprise Polyglot Support**
   - Python (Ruff, uv, Pyright, Semgrep)
   - Java (google-java-format, SpotBugs, Maven/Gradle)
   - Kotlin (ktfmt, Detekt, Gradle Kotlin DSL)
   - Groovy (CodeNarc, Gradle scripting)

2. **Intelligent Runtime Hook Filtering**
   - Automatic project type detection
   - Hooks only run for relevant project types
   - No cross-language interference in monorepos
   - Manifest hash-based caching (<50ms detection)

3. **CI/CD Pipeline Generation**
   - 44 production-ready templates
   - GitHub Actions, GitLab CI, Bitbucket Pipelines
   - Docker multi-stage builds
   - Kubernetes manifests and Helm charts

4. **Modern 2026 Tooling**
   - Ruff (10-100x faster than black/flake8)
   - uv (10-100x faster than pip)
   - Pyright (3-5x faster than mypy)
   - Semgrep (2026 security rules)

### New Components

- **7 New Agents**: `python-reviewer`, `java-reviewer`, `kotlin-reviewer`, `groovy-reviewer`, `maven-expert`, `gradle-expert`, `ci-cd-architect`
- **5 New Skills**: `python-patterns`, `kotlin-patterns`, `maven-patterns`, `gradle-patterns`, `ci-cd-patterns`
- **4 New Hooks**: `smart-formatter.js`, `python-security.js`, `java-security.js`, `maven-advisor.js`
- **2 New Lib Modules**: `detect-project-type.js`, `hook-utils.js`
- **44 CI/CD Templates**: GitHub Actions, GitLab CI, Bitbucket, Docker, Kubernetes, Helm, Security configs

---

## Breaking Changes

### None!

v2.0 has **zero breaking changes** for existing users. All v1.0 features continue to work:

- Existing agents still work
- Existing skills still work
- Existing hooks still work
- Existing commands still work
- Package manager detection unchanged

### What Changed Internally

1. **Formatter Hook Consolidation**
   - Old: Separate inline Prettier hooks for JS/TS
   - New: Unified `smart-formatter.js` that handles all languages
   - **Impact**: None (Prettier still runs for JS/TS projects)

2. **Hook Execution**
   - Old: All hooks run for all projects
   - New: Hooks filter by project type at runtime
   - **Impact**: Faster hook execution, no spurious warnings

3. **Test Suite**
   - Old: ~30 tests
   - New: 156+ tests (unit + integration + e2e)
   - **Impact**: More reliable, better coverage

---

## Migration Steps

### Step 1: Update the Plugin (2 minutes)

If you installed via plugin marketplace:

```bash
# Update to latest version
/plugin update everything-claude-code@everything-claude-code
```

If you installed manually:

```bash
cd /path/to/everything-claude-code
git pull origin main

# Re-copy files if needed
cp agents/*.md ~/.claude/agents/
cp commands/*.md ~/.claude/commands/
cp -r skills/* ~/.claude/skills/
```

### Step 2: Verify Installation (1 minute)

Start a new Claude Code session and check:

```bash
# Verify project detection works
# Should see: "[SessionStart] Project types: nodejs" (or python, maven, etc.)
```

Check the following:

1. No errors in session start
2. Project type detected correctly
3. Existing commands still work (try `/plan`, `/tdd`, etc.)

### Step 3: Adopt New Features (Optional, 10-20 minutes)

#### For Python Projects

1. **Install Python tooling** (optional but recommended):
```bash
pip install ruff pyright semgrep
# or with uv
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install ruff pyright semgrep
```

2. **Try the python-reviewer**:
```bash
/python-reviewer
```

3. **Enable auto-formatting**: Already works automatically if Ruff is installed

4. **Enable security scanning**: python-security hook runs automatically on file write

#### For Java/Kotlin Projects

1. **Install Java tooling** (optional):
```bash
# google-java-format
brew install google-java-format  # macOS
# or download from https://github.com/google/google-java-format/releases

# ktfmt (Kotlin)
brew install ktfmt  # macOS
```

2. **Try the java-reviewer or kotlin-reviewer**:
```bash
/java-reviewer
/kotlin-reviewer
```

3. **Get build tool advice**:
```bash
/maven-expert
/gradle-expert
```

#### For All Projects: CI/CD Generation

Generate a production-ready CI/CD pipeline:

```bash
# For Python project
/ci-cd github-actions python

# For Java Maven project
/ci-cd github-actions java-maven

# For Node.js project
/ci-cd gitlab-ci nodejs
```

The generated pipeline will be written to `.github/workflows/`, `.gitlab-ci.yml`, or `bitbucket-pipelines.yml`.

### Step 4: Update Project Config (Optional, 5 minutes)

If you have a `.claude/CLAUDE.md` project config, you might want to add:

```markdown
# Project Configuration

## Project Type
This is a [Python/Java/Kotlin/Node.js/Polyglot] project.

## Enabled Features (v2.0)
- Auto-formatting with [Ruff/google-java-format/Prettier]
- Security scanning with Semgrep
- Maven/Gradle best practices
- CI/CD pipeline (GitHub Actions/GitLab CI)

## Disabled MCP Servers
If you're not using certain languages, disable their tools:
```

Add to your `~/.claude/settings.json` (if needed):

```json
{
  "disabledMcpServers": {
    "python-tools": false,  // Enable for Python projects
    "java-tools": false     // Enable for Java projects
  }
}
```

### Step 5: Run Tests (Optional, 2 minutes)

Verify everything works:

```bash
npm test
```

All 156+ tests should pass.

---

## Backwards Compatibility

### What Still Works

Everything from v1.0 continues to work:

- **Agents**: All original agents (planner, architect, tdd-guide, code-reviewer, security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner, doc-updater)
- **Skills**: All original skills (coding-standards, backend-patterns, frontend-patterns, continuous-learning, strategic-compact, tdd-workflow, security-review, eval-harness, verification-loop)
- **Commands**: All original commands (/tdd, /plan, /e2e, /code-review, /build-fix, /refactor-clean, /learn, /checkpoint, /verify, /setup-pm)
- **Hooks**: All original hooks (session-start, session-end, pre-compact, suggest-compact, evaluate-session)
- **Memory persistence**: Unchanged
- **Verification loops**: Unchanged
- **Package manager detection**: Unchanged

### What's Better

The new runtime filtering means:

- **Faster**: Hooks only run when relevant
- **Cleaner**: No spurious warnings for non-applicable tools
- **Smarter**: Monorepos work correctly (Python hooks in `/ml`, Java hooks in `/backend`, Node hooks in `/frontend`)

---

## Rollback Instructions

If you encounter issues, you can rollback to v1.0:

### If Installed via Plugin

```bash
# Uninstall current version
/plugin uninstall everything-claude-code@everything-claude-code

# Install specific v1.0 tag
/plugin install everything-claude-code@everything-claude-code#v1.0
```

### If Installed Manually

```bash
cd /path/to/everything-claude-code
git checkout v1.0

# Re-copy files
cp agents/*.md ~/.claude/agents/
cp commands/*.md ~/.claude/commands/
cp -r skills/* ~/.claude/skills/
```

**Note**: After rollback, you'll lose access to:
- Python/Java/Kotlin support
- CI/CD generation
- Smart hook filtering
- New agents and skills

---

## Common Migration Issues

### Issue 1: "Unknown command: /python-reviewer"

**Cause**: Plugin not updated or agents not copied

**Fix**:
```bash
# If using plugin
/plugin update everything-claude-code@everything-claude-code

# If manual install
cp agents/python-reviewer.md ~/.claude/agents/
```

### Issue 2: Hooks Not Running

**Cause**: Hook scripts not executable or `CLAUDE_PLUGIN_ROOT` not set

**Fix**:
1. Check `hooks.json` has correct paths
2. Verify scripts exist: `ls scripts/hooks/smart-formatter.cjs`
3. Hooks should reference `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/...`

### Issue 3: Project Type Not Detected

**Cause**: Cache stale or manifest files missing

**Fix**:
```bash
# Clear cache
rm .claude/everything-claude-code.project-type.json

# Verify manifest files exist
ls package.json      # Node.js
ls pyproject.toml    # Python
ls pom.xml           # Maven
ls build.gradle.kts  # Gradle
```

### Issue 4: CI/CD Templates Not Found

**Cause**: Templates directory missing

**Fix**:
```bash
# Verify templates exist
ls -la templates/github-actions/
ls -la templates/gitlab-ci/

# If missing, re-pull repository
git pull origin main
```

### Issue 5: Tests Failing

**Cause**: Missing dependencies or stale node_modules

**Fix**:
```bash
# Reinstall dependencies
npm ci

# Run tests
npm test
```

---

## Feature Adoption Checklist

Track your migration progress:

- [ ] Updated plugin to v2.0
- [ ] Verified existing features still work
- [ ] Project type detection works
- [ ] Tried new agents (`/python-reviewer`, `/java-reviewer`, etc.)
- [ ] Generated CI/CD pipeline
- [ ] Installed language-specific tools (optional)
- [ ] Updated project config (optional)
- [ ] Read new documentation (FEATURES.md, AGENT-CATALOG.md)
- [ ] Ran tests successfully

---

## Getting Help

If you encounter issues:

1. **Check Documentation**: Read [FEATURES.md](FEATURES.md) and [AGENT-CATALOG.md](AGENT-CATALOG.md)
2. **Run Tests**: `npm test` to verify installation
3. **Check Logs**: Look for errors in session-start output
4. **File Issue**: [GitHub Issues](https://github.com/affaan-m/everything-claude-code/issues)
5. **Community**: Join discussions on GitHub

---

## What's Next

After migrating:

1. **Explore New Agents**: Try `/python-reviewer`, `/maven-expert`, `/ci-cd-architect`
2. **Generate Pipelines**: Use `/ci-cd` to create production pipelines
3. **Read Tutorials**: Check out [tutorials](tutorials/) for detailed walkthroughs
4. **Optimize Performance**: See [PERFORMANCE.md](PERFORMANCE.md) for tips
5. **Contribute**: Add your own agents, skills, or templates

---

## Roadmap (Phase 7+)

Future enhancements planned:

- **More Languages**: Go, Rust, C#/.NET
- **More Platforms**: CircleCI, Azure DevOps, Jenkins
- **Advanced Features**: Multi-cloud deployment, GitOps workflows
- **ML/Data**: Data engineering patterns, MLOps templates

---

**Questions?** Open an issue on GitHub or check the documentation.

**Feedback?** We'd love to hear how the migration went!

---

*Migration Guide Version: 1.0 | Last Updated: 2026-01-25*

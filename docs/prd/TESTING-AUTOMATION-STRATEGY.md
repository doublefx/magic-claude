# Testing Automation Strategy - Enterprise Stack Extension

## Overview

This document outlines the comprehensive testing automation strategy for the Enterprise Stack Extension, including test frameworks, test harnesses, CI/CD integration, and performance benchmarking.

---

## 1. Test Framework Architecture

### 1.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Test Runner** | Jest (or Vitest) | Industry standard, great ecosystem |
| **Assertion Library** | Jest matchers + Custom | Built-in + domain-specific assertions |
| **Mocking** | Jest mocks + Sinon.js | Flexible mocking for external tools |
| **Fixtures** | Custom test projects | Real-world project structures |
| **Snapshot Testing** | Jest snapshots | Validate CI/CD templates |
| **Coverage** | Jest coverage (c8) | Track test coverage |
| **E2E Testing** | Custom harness | Simulate Claude Code runtime |

### 1.2 Alternative: Vitest (Recommended)

**Why Vitest over Jest?**
- ⚡ **Faster**: Vite-powered, instant hot module reload
- 🔧 **Better ESM support**: Native ES modules
- 📸 **Compatible API**: Drop-in replacement for Jest
- 🎯 **Better watch mode**: Faster incremental testing
- 🔥 **Modern**: Built for modern JavaScript

**Migration Path**:
```bash
npm install -D vitest
# Update package.json scripts
"test": "vitest"
"test:ui": "vitest --ui"
"test:coverage": "vitest --coverage"
```

---

## 2. Test Harness Implementation

### 2.1 Hook Test Harness

**Purpose**: Simulate Claude Code tool execution and verify hook behavior.

**File**: `tests/harness/HookTestHarness.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class HookTestHarness {
  constructor(projectType, workingDir) {
    this.projectType = projectType;
    this.workingDir = workingDir;
    this.hooksConfig = null;
    this.firedHooks = [];
    this.hookOutputs = [];
  }

  /**
   * Load hooks configuration from hooks.json
   */
  async loadHooksConfig() {
    const hooksPath = path.join(__dirname, '../../hooks/hooks.json');
    const content = await fs.readFile(hooksPath, 'utf-8');
    this.hooksConfig = JSON.parse(content);
  }

  /**
   * Set up project type detection cache
   */
  async setupProjectType() {
    const claudeDir = path.join(this.workingDir, '.claude');
    await fs.mkdir(claudeDir, { recursive: true });

    const cacheContent = {
      types: this.projectType,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    };

    await fs.writeFile(
      path.join(claudeDir, 'everything-claude-code.project-type.json'),
      JSON.stringify(cacheContent, null, 2)
    );
  }

  /**
   * Simulate tool execution (Edit, Write, Bash, etc.)
   */
  async simulateToolUse(tool, toolInput) {
    await this.loadHooksConfig();
    await this.setupProjectType();

    const context = {
      tool,
      tool_input: toolInput,
      project_type: this.projectType,
      cwd: this.workingDir
    };

    // Find matching hooks
    const matchingHooks = this.hooksConfig.hooks.filter(hook => {
      return this.evaluateMatcher(hook.matcher, context);
    });

    // Execute hooks
    for (const hook of matchingHooks) {
      const result = await this.executeHook(hook, context);
      this.firedHooks.push(hook.name || hook.command);
      this.hookOutputs.push(result);
    }

    return {
      firedHooks: this.firedHooks,
      outputs: this.hookOutputs
    };
  }

  /**
   * Evaluate matcher expression
   */
  evaluateMatcher(matcher, context) {
    // Simple matcher evaluation (enhance as needed)
    const { tool, tool_input, project_type } = context;

    // Replace variables in matcher
    let expression = matcher
      .replace(/tool/g, `"${tool}"`)
      .replace(/project_type/g, `${JSON.stringify(project_type)}`);

    // Handle tool_input references
    if (tool_input && tool_input.file_path) {
      expression = expression.replace(
        /tool_input\.file_path/g,
        `"${tool_input.file_path}"`
      );
    }

    // Evaluate expression safely
    try {
      // Use a safe evaluator (consider using a proper parser)
      return this.safeEval(expression);
    } catch (error) {
      console.error('Matcher evaluation failed:', error);
      return false;
    }
  }

  /**
   * Safe expression evaluator
   */
  safeEval(expression) {
    // Convert matcher syntax to JavaScript
    expression = expression
      .replace(/contains/g, '.includes')
      .replace(/matches/g, '.match');

    // Use Function constructor for safer evaluation
    const func = new Function(`return ${expression}`);
    return func();
  }

  /**
   * Execute a hook command
   */
  async executeHook(hook, context) {
    const command = hook.command || hook.script;

    // Replace environment variables
    const expandedCommand = command
      .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, path.join(__dirname, '../..'))
      .replace(/\$\{cwd\}/g, context.cwd);

    try {
      const output = execSync(expandedCommand, {
        cwd: context.cwd,
        encoding: 'utf-8',
        env: {
          ...process.env,
          CLAUDE_TOOL: context.tool,
          CLAUDE_PROJECT_TYPE: JSON.stringify(context.project_type)
        }
      });

      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout?.toString(),
        stderr: error.stderr?.toString()
      };
    }
  }

  /**
   * Assert that a hook fired
   */
  expectHookFired(hookName) {
    const fired = this.firedHooks.some(name =>
      name.includes(hookName) || hookName.includes(name)
    );

    if (!fired) {
      throw new Error(
        `Expected hook "${hookName}" to fire. ` +
        `Fired hooks: ${this.firedHooks.join(', ')}`
      );
    }
  }

  /**
   * Assert that a hook did NOT fire
   */
  expectHookNotFired(hookName) {
    const fired = this.firedHooks.some(name =>
      name.includes(hookName) || hookName.includes(name)
    );

    if (fired) {
      throw new Error(
        `Expected hook "${hookName}" NOT to fire. ` +
        `Fired hooks: ${this.firedHooks.join(', ')}`
      );
    }
  }

  /**
   * Get output from a specific hook
   */
  getHookOutput(hookName) {
    const index = this.firedHooks.findIndex(name =>
      name.includes(hookName) || hookName.includes(name)
    );

    return index >= 0 ? this.hookOutputs[index] : null;
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    // Remove .claude directory
    const claudeDir = path.join(this.workingDir, '.claude');
    await fs.rm(claudeDir, { recursive: true, force: true });

    // Reset state
    this.firedHooks = [];
    this.hookOutputs = [];
  }
}

module.exports = HookTestHarness;
```

**Example Usage**:

```javascript
// tests/hooks/python-hooks.test.js
const HookTestHarness = require('../harness/HookTestHarness');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Python hooks', () => {
  let harness;
  let testDir;

  beforeEach(async () => {
    // Create temp directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-'));

    // Create Python project structure
    await fs.writeFile(
      path.join(testDir, 'pyproject.toml'),
      '[tool.black]\nline-length = 88'
    );

    harness = new HookTestHarness(['python'], testDir);
  });

  afterEach(async () => {
    await harness.cleanup();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('fires python-format hook on Python file edit', async () => {
    await harness.simulateToolUse('Edit', {
      file_path: path.join(testDir, 'app.py'),
      old_string: 'x=1',
      new_string: 'x = 1'
    });

    harness.expectHookFired('python-format');
  });

  test('does NOT fire python-format on JS file edit', async () => {
    await harness.simulateToolUse('Edit', {
      file_path: path.join(testDir, 'app.js'),
      old_string: 'const x = 1;',
      new_string: 'const x = 2;'
    });

    harness.expectHookNotFired('python-format');
  });

  test('does NOT fire in Node.js project', async () => {
    // Create Node.js project instead
    const nodeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-node-'));
    await fs.writeFile(
      path.join(nodeDir, 'package.json'),
      '{"name": "test"}'
    );

    const nodeHarness = new HookTestHarness(['nodejs'], nodeDir);

    await nodeHarness.simulateToolUse('Edit', {
      file_path: path.join(nodeDir, 'app.py'),
      old_string: 'x=1',
      new_string: 'x = 1'
    });

    nodeHarness.expectHookNotFired('python-format');

    await nodeHarness.cleanup();
    await fs.rm(nodeDir, { recursive: true, force: true });
  });
});
```

### 2.2 Agent Test Harness

**Purpose**: Test agent behavior without invoking Claude Code.

**File**: `tests/harness/AgentTestHarness.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AgentTestHarness {
  constructor() {
    this.agentOutputs = [];
  }

  /**
   * Load and parse agent markdown file
   */
  async loadAgent(agentName) {
    const agentPath = path.join(__dirname, '../../agents', `${agentName}.md`);
    const content = await fs.readFile(agentPath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error(`No frontmatter found in agent: ${agentName}`);
    }

    const frontmatter = this.parseFrontmatter(frontmatterMatch[1]);
    const instructions = content.replace(frontmatterMatch[0], '').trim();

    return { frontmatter, instructions };
  }

  /**
   * Parse YAML frontmatter
   */
  parseFrontmatter(yaml) {
    const lines = yaml.split('\n');
    const result = {};

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2];
      }
    }

    return result;
  }

  /**
   * Simulate agent invocation with context
   * NOTE: This is a mock - in reality, you'd need to call Claude API
   */
  async invokeAgent(agentName, context) {
    const { frontmatter, instructions } = await this.loadAgent(agentName);

    // In a real implementation, you would:
    // 1. Construct a prompt with instructions + context
    // 2. Call Claude API with the prompt
    // 3. Parse and return the response

    // For testing purposes, we can use pattern matching
    return this.mockAgentResponse(agentName, context);
  }

  /**
   * Mock agent response based on known patterns
   */
  mockAgentResponse(agentName, context) {
    // Python reviewer patterns
    if (agentName === 'python-reviewer') {
      const issues = [];

      // Check for SQL injection
      if (context.code && context.code.match(/f["'].*SELECT.*{.*}["']/)) {
        issues.push({
          severity: 'CRITICAL',
          category: 'SQL Injection Risk',
          file: context.file || 'unknown',
          line: context.line || 0,
          message: 'String interpolation in SQL query',
          fix: 'Use parameterized queries'
        });
      }

      // Check for eval/exec
      if (context.code && context.code.match(/\b(eval|exec)\s*\(/)) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Security',
          file: context.file || 'unknown',
          line: context.line || 0,
          message: 'Use of eval() or exec() detected',
          fix: 'Avoid eval/exec, use safe alternatives'
        });
      }

      // Check for missing type hints
      if (context.code && context.code.match(/def\s+\w+\([^)]*\)\s*:/)) {
        const hasTypeHints = context.code.match(/def\s+\w+\([^)]*:\s*\w+/);
        if (!hasTypeHints) {
          issues.push({
            severity: 'HIGH',
            category: 'Type Safety',
            file: context.file || 'unknown',
            line: context.line || 0,
            message: 'Missing type hints on function',
            fix: 'Add type hints: def func(arg: str) -> int:'
          });
        }
      }

      return { issues };
    }

    // Java reviewer patterns
    if (agentName === 'java-reviewer') {
      const issues = [];

      // Check for null dereference
      if (context.code && context.code.match(/\w+\.\w+\(\)/)) {
        issues.push({
          severity: 'MEDIUM',
          category: 'Null Safety',
          file: context.file || 'unknown',
          line: context.line || 0,
          message: 'Potential null pointer dereference',
          fix: 'Use Optional or null check'
        });
      }

      return { issues };
    }

    return { issues: [] };
  }

  /**
   * Assert that agent found a specific issue
   */
  expectIssue(response, severity, pattern) {
    const found = response.issues?.some(issue =>
      issue.severity === severity &&
      (issue.message.match(pattern) || issue.category.match(pattern))
    );

    if (!found) {
      throw new Error(
        `Expected issue with severity "${severity}" matching "${pattern}". ` +
        `Found: ${JSON.stringify(response.issues, null, 2)}`
      );
    }
  }

  /**
   * Assert that agent found NO issues
   */
  expectNoIssues(response) {
    if (response.issues && response.issues.length > 0) {
      throw new Error(
        `Expected no issues. Found: ${JSON.stringify(response.issues, null, 2)}`
      );
    }
  }
}

module.exports = AgentTestHarness;
```

**Example Usage**:

```javascript
// tests/agents/python-reviewer.test.js
const AgentTestHarness = require('../harness/AgentTestHarness');

describe('Python reviewer agent', () => {
  let harness;

  beforeEach(() => {
    harness = new AgentTestHarness();
  });

  test('detects SQL injection vulnerability', async () => {
    const code = `
      query = f"SELECT * FROM users WHERE id = {user_id}"
      cursor.execute(query)
    `;

    const result = await harness.invokeAgent('python-reviewer', {
      code,
      file: 'app/db.py',
      line: 42
    });

    harness.expectIssue(result, 'CRITICAL', /SQL Injection/);
  });

  test('detects eval() usage', async () => {
    const code = `
      result = eval(user_input)
    `;

    const result = await harness.invokeAgent('python-reviewer', {
      code,
      file: 'app/main.py'
    });

    harness.expectIssue(result, 'CRITICAL', /eval/);
  });

  test('detects missing type hints', async () => {
    const code = `
      def process_data(data):
          return data.strip()
    `;

    const result = await harness.invokeAgent('python-reviewer', {
      code,
      file: 'app/utils.py'
    });

    harness.expectIssue(result, 'HIGH', /type hints/i);
  });

  test('accepts code with proper type hints', async () => {
    const code = `
      def process_data(data: str) -> str:
          return data.strip()
    `;

    const result = await harness.invokeAgent('python-reviewer', {
      code,
      file: 'app/utils.py'
    });

    // Should not complain about type hints
    const typeIssues = result.issues?.filter(i => i.category === 'Type Safety');
    expect(typeIssues).toHaveLength(0);
  });
});
```

### 2.3 Template Test Harness

**Purpose**: Validate CI/CD templates with snapshot testing.

**File**: `tests/harness/TemplateTestHarness.js`

```javascript
const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml'); // npm install yaml

class TemplateTestHarness {
  /**
   * Load and parse template
   */
  async loadTemplate(platform, language) {
    const templatePath = path.join(
      __dirname,
      '../../skills/ci-cd-templates',
      platform,
      `${language}.yml`
    );

    const content = await fs.readFile(templatePath, 'utf-8');
    return content;
  }

  /**
   * Generate workflow from template
   */
  async generateWorkflow(platform, language, options = {}) {
    let template = await this.loadTemplate(platform, language);

    // Replace variables
    if (options.javaVersion) {
      template = template.replace(/JAVA_VERSION: '.*'/, `JAVA_VERSION: '${options.javaVersion}'`);
    }

    if (options.nodeVersion) {
      template = template.replace(/NODE_VERSION: '.*'/, `NODE_VERSION: '${options.nodeVersion}'`);
    }

    if (options.pythonVersion) {
      template = template.replace(/PYTHON_VERSION: '.*'/, `PYTHON_VERSION: '${options.pythonVersion}'`);
    }

    return template;
  }

  /**
   * Validate YAML syntax
   */
  validateYaml(content) {
    try {
      const parsed = yaml.parse(content);
      return { valid: true, parsed };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        line: error.linePos?.[0]?.line
      };
    }
  }

  /**
   * Validate required sections for GitHub Actions
   */
  validateGitHubActions(content) {
    const issues = [];

    if (!content.includes('on:')) {
      issues.push('Missing "on:" trigger section');
    }

    if (!content.includes('jobs:')) {
      issues.push('Missing "jobs:" section');
    }

    if (!content.includes('runs-on:')) {
      issues.push('Missing "runs-on:" in job');
    }

    if (!content.includes('actions/checkout@')) {
      issues.push('Missing checkout action');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate required sections for GitLab CI
   */
  validateGitLabCI(content) {
    const issues = [];

    if (!content.includes('stages:')) {
      issues.push('Missing "stages:" section');
    }

    if (!content.includes('script:')) {
      issues.push('Missing "script:" in job');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate caching configuration
   */
  validateCaching(content, language) {
    const cachePatterns = {
      maven: ['cache:', '.m2/repository'],
      gradle: ['cache:', '.gradle'],
      python: ['cache:', 'pip'],
      nodejs: ['cache:', 'npm']
    };

    const patterns = cachePatterns[language];
    if (!patterns) return { valid: true };

    const hasCaching = patterns.every(pattern => content.includes(pattern));

    return {
      valid: hasCaching,
      message: hasCaching ? 'Caching configured' : 'Missing caching configuration'
    };
  }
}

module.exports = TemplateTestHarness;
```

**Example Usage**:

```javascript
// tests/templates/github-actions.test.js
const TemplateTestHarness = require('../harness/TemplateTestHarness');

describe('GitHub Actions templates', () => {
  let harness;

  beforeEach(() => {
    harness = new TemplateTestHarness();
  });

  describe('Maven template', () => {
    test('generates valid YAML', async () => {
      const workflow = await harness.generateWorkflow('github-actions', 'maven');
      const validation = harness.validateYaml(workflow);

      expect(validation.valid).toBe(true);
    });

    test('contains required sections', async () => {
      const workflow = await harness.generateWorkflow('github-actions', 'maven');
      const validation = harness.validateGitHubActions(workflow);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('uses correct Java version', async () => {
      const workflow = await harness.generateWorkflow('github-actions', 'maven', {
        javaVersion: '17'
      });

      expect(workflow).toContain("JAVA_VERSION: '17'");
      expect(workflow).toContain('actions/setup-java@v4');
    });

    test('includes Maven cache', async () => {
      const workflow = await harness.generateWorkflow('github-actions', 'maven');
      const validation = harness.validateCaching(workflow, 'maven');

      expect(validation.valid).toBe(true);
    });

    test('uses mvn verify (not install)', async () => {
      const workflow = await harness.generateWorkflow('github-actions', 'maven');

      expect(workflow).toContain('mvn clean verify');
      expect(workflow).not.toContain('mvn install');
    });

    test('matches snapshot', async () => {
      const workflow = await harness.generateWorkflow('github-actions', 'maven');

      // Snapshot testing - detects unintended changes
      expect(workflow).toMatchSnapshot();
    });
  });

  describe('All templates', () => {
    const platforms = ['github-actions', 'gitlab-ci', 'bitbucket-pipelines'];
    const languages = ['maven', 'gradle', 'python', 'nodejs'];

    test.each(platforms)('all %s templates are valid YAML', async (platform) => {
      for (const language of languages) {
        const workflow = await harness.generateWorkflow(platform, language);
        const validation = harness.validateYaml(workflow);

        expect(validation.valid).toBe(true);
      }
    });
  });
});
```

---

## 3. Integration Test Strategy

### 3.1 Test Fixtures

Create real-world project structures for testing.

**Directory Structure**:
```
tests/fixtures/
├── python-flask-api/
│   ├── pyproject.toml
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── db.py
│   ├── tests/
│   │   └── test_main.py
│   └── .gitignore
├── spring-boot-app/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/java/com/example/
│   │   │   ├── Application.java
│   │   │   └── controller/
│   │   └── test/java/com/example/
│   └── .gitignore
├── gradle-multi-module/
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── module-api/
│   ├── module-core/
│   └── module-web/
└── react-node-app/
    ├── package.json
    ├── src/
    └── public/
```

### 3.2 Integration Test Suite

**File**: `tests/integration/end-to-end.test.js`

```javascript
const HookTestHarness = require('../harness/HookTestHarness');
const fs = require('fs').promises;
const path = require('path');

describe('End-to-end integration tests', () => {
  describe('Python Flask API', () => {
    let harness;
    const fixtureDir = path.join(__dirname, '../fixtures/python-flask-api');

    beforeEach(() => {
      harness = new HookTestHarness(['python'], fixtureDir);
    });

    afterEach(async () => {
      await harness.cleanup();
    });

    test('editing Python file triggers black formatting', async () => {
      const filePath = path.join(fixtureDir, 'app/main.py');

      await harness.simulateToolUse('Edit', {
        file_path: filePath,
        old_string: 'x=1',
        new_string: 'x = 1'
      });

      harness.expectHookFired('python-format');

      const output = harness.getHookOutput('python-format');
      expect(output.success).toBe(true);
    });

    test('detects SQL injection in db.py', async () => {
      const filePath = path.join(fixtureDir, 'app/db.py');

      // Read file, introduce vulnerability, edit
      const original = await fs.readFile(filePath, 'utf-8');
      const vulnerable = original + '\nquery = f"SELECT * FROM users WHERE id = {user_id}"';

      await harness.simulateToolUse('Edit', {
        file_path: filePath,
        old_string: original,
        new_string: vulnerable
      });

      harness.expectHookFired('python-security');

      const output = harness.getHookOutput('python-security');
      expect(output.output).toContain('SQL Injection');
    });
  });

  describe('Spring Boot App', () => {
    let harness;
    const fixtureDir = path.join(__dirname, '../fixtures/spring-boot-app');

    beforeEach(() => {
      harness = new HookTestHarness(['maven'], fixtureDir);
    });

    afterEach(async () => {
      await harness.cleanup();
    });

    test('editing Java file triggers google-java-format', async () => {
      const filePath = path.join(fixtureDir, 'src/main/java/com/example/Application.java');

      await harness.simulateToolUse('Edit', {
        file_path: filePath,
        old_string: 'public class Application {',
        new_string: 'public class Application {\n  // Updated'
      });

      harness.expectHookFired('java-format');
    });

    test('mvn install triggers suggestion for mvn verify', async () => {
      await harness.simulateToolUse('Bash', {
        command: 'mvn clean install'
      });

      harness.expectHookFired('maven-suggestions');

      const output = harness.getHookOutput('maven-suggestions');
      expect(output.output).toContain('mvn verify');
    });
  });
});
```

---

## 4. CI/CD Automation

### 4.1 GitHub Actions Workflow for Plugin

**File**: `.github/workflows/test.yml`

```yaml
name: Plugin CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci
      - run: npm run lint

  unit-test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest' && matrix.node == '20'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-test:
    runs-on: ubuntu-latest
    needs: unit-test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      # Install language tools for testing
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install Python tools
        run: |
          pip install black flake8 mypy bandit

      - name: Install Java tools
        run: |
          wget https://github.com/google/google-java-format/releases/download/v1.18.1/google-java-format-1.18.1-all-deps.jar
          sudo mv google-java-format-1.18.1-all-deps.jar /usr/local/bin/google-java-format.jar

      - run: npm ci

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: tests/integration/reports/

  e2e-test:
    runs-on: ubuntu-latest
    needs: integration-test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Setup test projects
        run: npm run setup:test-fixtures

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-test-results
          path: tests/e2e/reports/

  template-validation:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Validate CI/CD templates
        run: npm run test:templates

      - name: Test template generation
        run: |
          npm run test:template-generation -- --platform github-actions
          npm run test:template-generation -- --platform gitlab-ci
          npm run test:template-generation -- --platform bitbucket-pipelines

  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci

      - name: Run performance benchmarks
        run: npm run test:performance

      - name: Upload benchmark results
        uses: actions/upload-artifact@v4
        with:
          name: performance-benchmarks
          path: tests/performance/results/

  all-tests-passed:
    runs-on: ubuntu-latest
    needs: [lint, unit-test, integration-test, e2e-test, template-validation, performance]
    if: always()

    steps:
      - name: Check test results
        run: |
          if [[ "${{ needs.lint.result }}" != "success" ]] ||
             [[ "${{ needs.unit-test.result }}" != "success" ]] ||
             [[ "${{ needs.integration-test.result }}" != "success" ]] ||
             [[ "${{ needs.e2e-test.result }}" != "success" ]] ||
             [[ "${{ needs.template-validation.result }}" != "success" ]] ||
             [[ "${{ needs.performance.result }}" != "success" ]]; then
            echo "One or more test jobs failed"
            exit 1
          fi
```

### 4.2 NPM Scripts

**File**: `package.json` (test scripts section)

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:e2e": "vitest tests/e2e",
    "test:templates": "vitest tests/templates",
    "test:performance": "node tests/performance/benchmark.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "setup:test-fixtures": "node tests/setup-fixtures.js"
  }
}
```

---

## 5. Performance Testing

### 5.1 Hook Performance Benchmark

**File**: `tests/performance/benchmark.js`

```javascript
const Benchmark = require('benchmark');
const HookTestHarness = require('../harness/HookTestHarness');
const path = require('path');

const suite = new Benchmark.Suite;

// Benchmark project detection
suite.add('Project detection (cold)', {
  defer: true,
  fn: async (deferred) => {
    const harness = new HookTestHarness([], '/tmp/test-project');
    await harness.setupProjectType();
    await harness.cleanup();
    deferred.resolve();
  }
});

// Benchmark hook matching
suite.add('Hook matching (Python file)', {
  defer: true,
  fn: async (deferred) => {
    const harness = new HookTestHarness(['python'], '/tmp/test-project');
    await harness.simulateToolUse('Edit', {
      file_path: '/tmp/test-project/app.py'
    });
    await harness.cleanup();
    deferred.resolve();
  }
});

// Run benchmarks
suite
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\nFastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
```

---

## 6. Test Coverage Requirements

### Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| Project detection | 90% | P0 |
| Hook matchers | 85% | P0 |
| Hook scripts | 80% | P1 |
| Template generation | 85% | P1 |
| Agents (mock tests) | 70% | P2 |

### Coverage Report

```bash
npm run test:coverage

# Output
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
scripts/               |   85.42 |    78.12 |   88.89 |   85.42 |
  detect-project-type.js|   92.31 |    87.50 |  100.00 |   92.31 |
  cache-manager.js     |   88.24 |    75.00 |   85.71 |   88.24 |
hooks/                 |   80.00 |    72.22 |   75.00 |   80.00 |
  python-format.js     |   85.00 |    80.00 |   83.33 |   85.00 |
  java-format.js       |   82.35 |    75.00 |   80.00 |   82.35 |
templates/             |   88.00 |    85.00 |   90.00 |   88.00 |
-----------------------|---------|----------|---------|---------|
All files              |   84.47 |    78.45 |   84.63 |   84.47 |
-----------------------|---------|----------|---------|---------|
```

---

## Conclusion

This testing automation strategy provides:

1. ✅ **Comprehensive test harnesses** for hooks, agents, and templates
2. ✅ **Integration tests** with real project fixtures
3. ✅ **CI/CD automation** for continuous testing
4. ✅ **Performance benchmarking** to meet < 2s targets
5. ✅ **Cross-platform validation** (Windows, Mac, Linux)
6. ✅ **Coverage tracking** with clear targets

**Estimated setup time**: 5-7 days (included in revised Phase 6 timeline)

**Benefits**:
- Catch regressions early
- Ensure cross-platform compatibility
- Validate templates before deployment
- Maintain code quality standards
- Reduce manual testing burden

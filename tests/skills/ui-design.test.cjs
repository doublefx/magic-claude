/**
 * Tests for skills/ui-design/ validation
 *
 * Run with: node tests/skills/ui-design.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Import utils
const { parseFrontmatter } = require(
  path.join(__dirname, '..', '..', 'plugin', 'scripts', 'lib', 'utils.cjs')
);

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    return true;
  } catch (err) {
    console.log(`  \u2717 ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Constants
const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_DIR = path.join(REPO_ROOT, 'plugin', 'skills', 'ui-design');
const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const SCRIPT_PATH = path.join(SKILL_DIR, 'detect-tools.cjs');
const TOOLS_DIR = path.join(SKILL_DIR, 'tools');
const ORCHESTRATOR_PATH = path.join(REPO_ROOT, 'plugin', 'skills', 'proactive-orchestration', 'SKILL.md');

const TOOL_REFERENCE_FILES = [
  'figma.md',
  'pencil.md',
  'penpot.md',
  'shadcn-ui.md',
  'storybook.md',
  'magic-ui.md',
  'screenshot.md',
  'playwright-cli.md'
];

// Test suite
function runTests() {
  console.log('\n=== Testing ui-design skill ===\n');

  let passed = 0;
  let failed = 0;

  // -- 1. SKILL.md Structure --
  console.log('SKILL.md Structure:');

  let skillContent = null;
  let frontmatter = null;

  if (test('SKILL.md exists', () => {
    assert.ok(fs.existsSync(SKILL_PATH), 'SKILL.md should exist');
    skillContent = fs.readFileSync(SKILL_PATH, 'utf8');
    assert.ok(skillContent.length > 0, 'SKILL.md should not be empty');
  })) passed++; else failed++;

  if (test('SKILL.md has valid YAML frontmatter', () => {
    assert.ok(skillContent, 'SKILL.md content should be loaded');
    frontmatter = parseFrontmatter(skillContent);
    assert.ok(frontmatter.attributes, 'Should have attributes');
    assert.ok(frontmatter.body, 'Should have body content');
  })) passed++; else failed++;

  if (test('frontmatter has name: ui-design', () => {
    assert.ok(frontmatter, 'frontmatter should be parsed');
    assert.strictEqual(
      frontmatter.attributes.name,
      'ui-design',
      'name should be ui-design'
    );
  })) passed++; else failed++;

  if (test('frontmatter has user-invocable: false', () => {
    assert.ok(frontmatter, 'frontmatter should be parsed');
    // parseFrontmatter returns strings for values; check string 'false'
    assert.strictEqual(
      String(frontmatter.attributes['user-invocable']),
      'false',
      'user-invocable should be false'
    );
  })) passed++; else failed++;

  if (test('frontmatter does NOT have context: fork', () => {
    assert.ok(frontmatter, 'frontmatter should be parsed');
    assert.ok(
      !frontmatter.attributes.context || frontmatter.attributes.context !== 'fork',
      'context should not be fork (runs inline in orchestrator)'
    );
  })) passed++; else failed++;

  if (test('frontmatter has non-empty description', () => {
    assert.ok(frontmatter, 'frontmatter should be parsed');
    assert.ok(
      frontmatter.attributes.description &&
      frontmatter.attributes.description.length > 10,
      'description should be a non-empty string'
    );
  })) passed++; else failed++;

  // -- 2. Required Sections --
  console.log('\nRequired Sections:');

  const requiredSections = [
    { name: 'When to Activate', pattern: /when\s+to\s+activate/i },
    { name: 'When NOT to Activate', pattern: /when\s+NOT\s+to\s+activate/i },
    { name: 'Tool Detection', pattern: /tool\s+detection/i },
    { name: 'Layered Fallback', pattern: /layered\s+fallback/i },
    { name: 'UI Design Spec', pattern: /ui\s+design\s+spec/i },
    { name: 'Integration with TDD', pattern: /integration\s+with\s+tdd/i },
    { name: 'Related', pattern: /##\s+related/i }
  ];

  for (const section of requiredSections) {
    if (test(`contains "${section.name}" section`, () => {
      assert.ok(skillContent, 'SKILL.md content should be loaded');
      assert.ok(
        section.pattern.test(skillContent),
        `Should contain section matching ${section.pattern}`
      );
    })) passed++; else failed++;
  }

  // -- 3. Integration References --
  console.log('\nIntegration References:');

  const integrationRefs = [
    { name: 'frontend-design', pattern: /frontend-design/i },
    { name: 'proactive-orchestration', pattern: /proactive-orchestration/i },
    { name: 'frontend-patterns', pattern: /frontend-patterns/i }
  ];

  for (const ref of integrationRefs) {
    if (test(`references ${ref.name}`, () => {
      assert.ok(skillContent, 'SKILL.md content should be loaded');
      assert.ok(
        ref.pattern.test(skillContent),
        `Should reference ${ref.name}`
      );
    })) passed++; else failed++;
  }

  // -- 4. Tool Reference Files --
  console.log('\nTool Reference Files:');

  for (const file of TOOL_REFERENCE_FILES) {
    const filePath = path.join(TOOLS_DIR, file);

    if (test(`${file} exists and is non-empty`, () => {
      assert.ok(fs.existsSync(filePath), `${file} should exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.length > 100, `${file} should have substantial content`);
    })) passed++; else failed++;
  }

  // -- 5. Tool Reference File Content --
  console.log('\nTool Reference File Content:');

  const requiredToolSections = [
    'Overview',
    'Tier',
    'Installation',
    'Limitations'
  ];

  for (const file of TOOL_REFERENCE_FILES) {
    const filePath = path.join(TOOLS_DIR, file);

    if (test(`${file} has required sections`, () => {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const section of requiredToolSections) {
        // screenshot.md uses "Key Capabilities" instead of "Installation"
        if (file === 'screenshot.md' && section === 'Installation') continue;
        assert.ok(
          new RegExp(section, 'i').test(content),
          `${file} should contain "${section}" section`
        );
      }
    })) passed++; else failed++;
  }

  if (test('all tool reference files have Last Verified section', () => {
    for (const file of TOOL_REFERENCE_FILES) {
      const content = fs.readFileSync(path.join(TOOLS_DIR, file), 'utf8');
      assert.ok(
        /last\s+verified/i.test(content),
        `${file} should have Last Verified section`
      );
    }
  })) passed++; else failed++;

  // -- 6. detect-tools.cjs --
  console.log('\ndetect-tools.cjs:');

  let scriptContent = null;

  if (test('detect-tools.cjs exists', () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), 'detect-tools.cjs should exist');
    scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf8');
    assert.ok(scriptContent.length > 0, 'Script should not be empty');
  })) passed++; else failed++;

  if (test('has shebang line', () => {
    assert.ok(scriptContent, 'Script content should be loaded');
    assert.ok(
      scriptContent.startsWith('#!/usr/bin/env node'),
      'Should start with Node.js shebang'
    );
  })) passed++; else failed++;

  if (test('is valid Node.js syntax', () => {
    const result = spawnSync('node', ['--check', SCRIPT_PATH], {
      encoding: 'utf8'
    });
    assert.strictEqual(
      result.status, 0,
      `Syntax check failed: ${result.stderr}`
    );
  })) passed++; else failed++;

  if (test('does not contain bash-isms', () => {
    assert.ok(scriptContent, 'Script content should be loaded');
    assert.ok(
      !scriptContent.includes('#!/bin/bash'),
      'Should not have bash shebang'
    );
    assert.ok(
      !scriptContent.includes('set -e'),
      'Should not have bash set -e'
    );
  })) passed++; else failed++;

  if (test('uses cross-platform path handling', () => {
    assert.ok(scriptContent, 'Script content should be loaded');
    assert.ok(
      /path\.(join|resolve)/.test(scriptContent),
      'Should use path.join or path.resolve'
    );
  })) passed++; else failed++;

  if (test('uses fs for file existence checks', () => {
    assert.ok(scriptContent, 'Script content should be loaded');
    assert.ok(
      /fs\.(existsSync|statSync|accessSync)/.test(scriptContent),
      'Should use fs methods for file checks'
    );
  })) passed++; else failed++;

  if (test('supports --help flag', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--help'], {
      encoding: 'utf8',
      timeout: 5000
    });
    const output = result.stdout + result.stderr;
    assert.ok(
      /usage|detect-tools|design/i.test(output),
      `--help should output usage info, got: ${output.slice(0, 200)}`
    );
  })) passed++; else failed++;

  if (test('supports --json flag and produces valid JSON', () => {
    const result = spawnSync('node', [SCRIPT_PATH, '--json'], {
      encoding: 'utf8',
      timeout: 5000
    });
    assert.strictEqual(result.status, 0, `Should exit cleanly, stderr: ${result.stderr}`);
    const parsed = JSON.parse(result.stdout);
    assert.ok(parsed.mcpTools !== undefined, 'JSON should have mcpTools');
    assert.ok(parsed.nativeTools !== undefined, 'JSON should have nativeTools');
    assert.ok(parsed.frontendDesignPlugin !== undefined, 'JSON should have frontendDesignPlugin');
    assert.ok(parsed.playwrightCli !== undefined, 'JSON should have playwrightCli');
    assert.ok(parsed.toolReferenceFiles !== undefined, 'JSON should have toolReferenceFiles');
  })) passed++; else failed++;

  if (test('gracefully handles missing config files', () => {
    // detect-tools.cjs should not crash even with non-standard config paths
    const result = spawnSync('node', [SCRIPT_PATH, '--json'], {
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, HOME: '/nonexistent' }
    });
    // Should still exit 0, just with empty results
    assert.strictEqual(result.status, 0, `Should exit cleanly even with bad HOME: ${result.stderr}`);
  })) passed++; else failed++;

  // -- 7. Orchestrator Integration --
  console.log('\nOrchestrator Integration:');

  let orchestratorContent = null;

  if (test('proactive-orchestration/SKILL.md exists', () => {
    assert.ok(fs.existsSync(ORCHESTRATOR_PATH), 'Orchestrator SKILL.md should exist');
    orchestratorContent = fs.readFileSync(ORCHESTRATOR_PATH, 'utf8');
  })) passed++; else failed++;

  if (test('orchestrator contains "Phase 1.75"', () => {
    assert.ok(orchestratorContent, 'Orchestrator content should be loaded');
    assert.ok(
      orchestratorContent.includes('Phase 1.75'),
      'Should contain Phase 1.75'
    );
  })) passed++; else failed++;

  if (test('orchestrator contains "UI DESIGN"', () => {
    assert.ok(orchestratorContent, 'Orchestrator content should be loaded');
    assert.ok(
      orchestratorContent.includes('UI DESIGN'),
      'Should contain UI DESIGN'
    );
  })) passed++; else failed++;

  if (test('orchestrator digraph has ui_gate node', () => {
    assert.ok(orchestratorContent, 'Orchestrator content should be loaded');
    assert.ok(
      orchestratorContent.includes('ui_gate'),
      'Should contain ui_gate digraph node'
    );
  })) passed++; else failed++;

  if (test('orchestrator digraph has ui_design node', () => {
    assert.ok(orchestratorContent, 'Orchestrator content should be loaded');
    assert.ok(
      orchestratorContent.includes('ui_design'),
      'Should contain ui_design digraph node'
    );
  })) passed++; else failed++;

  if (test('orchestrator report has UI DESIGN line', () => {
    assert.ok(orchestratorContent, 'Orchestrator content should be loaded');
    assert.ok(
      /UI DESIGN:\[/.test(orchestratorContent),
      'Should contain UI DESIGN report line'
    );
  })) passed++; else failed++;

  if (test('orchestrator references magic-claude:ui-design skill', () => {
    assert.ok(orchestratorContent, 'Orchestrator content should be loaded');
    assert.ok(
      orchestratorContent.includes('magic-claude:ui-design'),
      'Should reference magic-claude:ui-design skill'
    );
  })) passed++; else failed++;

  // -- Results --
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

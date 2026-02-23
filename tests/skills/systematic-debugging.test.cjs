/**
 * Tests for skills/systematic-debugging/ validation
 *
 * Run with: node tests/skills/systematic-debugging.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Import utils
const { parseFrontmatter } = require(
  path.join(__dirname, '..', '..', 'scripts', 'lib', 'utils.cjs')
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
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'systematic-debugging');
const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');

const SUPPORTING_FILES = [
  'root-cause-tracing.md',
  'defense-in-depth.md',
  'condition-based-waiting.md'
];

const SCRIPT_PATH = path.join(SKILL_DIR, 'find-polluter.cjs');

// Test suite
function runTests() {
  console.log('\n=== Testing systematic-debugging skill ===\n');

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

  if (test('frontmatter has name: systematic-debugging', () => {
    assert.ok(frontmatter, 'frontmatter should be parsed');
    assert.strictEqual(
      frontmatter.attributes.name,
      'systematic-debugging',
      'name should be systematic-debugging'
    );
  })) passed++; else failed++;

  if (test('frontmatter has context: fork', () => {
    assert.ok(frontmatter, 'frontmatter should be parsed');
    assert.strictEqual(
      frontmatter.attributes.context,
      'fork',
      'context should be fork'
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
    { name: 'Iron Law', pattern: /iron\s+law/i },
    { name: 'Anti-Rationalization', pattern: /anti-rationalization|rationalization/i },
    { name: 'Phase 1 (Root Cause Investigation)', pattern: /phase\s+1/i },
    { name: 'Phase 2 (Pattern Analysis)', pattern: /phase\s+2/i },
    { name: 'Phase 3 (Hypothesis Testing)', pattern: /phase\s+3/i },
    { name: 'Phase 4 (Implementation)', pattern: /phase\s+4/i },
    { name: 'Quick Reference / Flowchart', pattern: /quick\s+reference|flowchart|decision/i },
    { name: 'Integration Points', pattern: /integration\s+points?/i }
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
    { name: 'build resolvers', pattern: /build-resolver/i },
    { name: 'TDD agents', pattern: /tdd-guide|tdd\s+agent/i },
    { name: 'verification loop', pattern: /verify|verification/i }
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

  // -- 4. Supporting Files --
  console.log('\nSupporting Files:');

  for (const file of SUPPORTING_FILES) {
    const filePath = path.join(SKILL_DIR, file);

    if (test(`${file} exists and is non-empty`, () => {
      assert.ok(fs.existsSync(filePath), `${file} should exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.length > 100, `${file} should have substantial content`);
    })) passed++; else failed++;
  }

  // -- 5. Supporting File Content --
  console.log('\nSupporting File Content:');

  if (test('root-cause-tracing.md has 5-step process', () => {
    const content = fs.readFileSync(
      path.join(SKILL_DIR, 'root-cause-tracing.md'), 'utf8'
    );
    assert.ok(/step\s+[1-5]|5.step/i.test(content), 'Should mention steps');
    assert.ok(/trace|backward|call\s+stack/i.test(content), 'Should mention tracing');
  })) passed++; else failed++;

  if (test('defense-in-depth.md has 4 layers', () => {
    const content = fs.readFileSync(
      path.join(SKILL_DIR, 'defense-in-depth.md'), 'utf8'
    );
    assert.ok(/layer\s+1/i.test(content), 'Should mention Layer 1');
    assert.ok(/layer\s+4/i.test(content), 'Should mention Layer 4');
  })) passed++; else failed++;

  if (test('condition-based-waiting.md has waitFor pattern', () => {
    const content = fs.readFileSync(
      path.join(SKILL_DIR, 'condition-based-waiting.md'), 'utf8'
    );
    assert.ok(/waitFor|wait_for/i.test(content), 'Should mention waitFor pattern');
  })) passed++; else failed++;

  if (test('supporting files are concise (under 200 lines each)', () => {
    for (const file of SUPPORTING_FILES) {
      const content = fs.readFileSync(path.join(SKILL_DIR, file), 'utf8');
      const lineCount = content.split('\n').length;
      assert.ok(
        lineCount <= 200,
        `${file} has ${lineCount} lines (max 200)`
      );
    }
  })) passed++; else failed++;

  // -- 6. SKILL.md references supporting files --
  console.log('\nCross-References:');

  for (const file of SUPPORTING_FILES) {
    if (test(`SKILL.md references ${file}`, () => {
      assert.ok(skillContent, 'SKILL.md content should be loaded');
      assert.ok(
        skillContent.includes(file),
        `SKILL.md should reference ${file}`
      );
    })) passed++; else failed++;
  }

  // -- 7. find-polluter.cjs --
  console.log('\nfind-polluter.cjs:');

  let scriptContent = null;

  if (test('find-polluter.cjs exists', () => {
    assert.ok(fs.existsSync(SCRIPT_PATH), 'find-polluter.cjs should exist');
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
    assert.ok(
      !/\$[0-9]/.test(scriptContent),
      'Should not have bash positional args ($1, $2)'
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
      /usage|find-polluter|victim/i.test(output),
      `--help should output usage info, got: ${output.slice(0, 200)}`
    );
  })) passed++; else failed++;

  if (test('supports --dry-run flag', () => {
    assert.ok(scriptContent, 'Script content should be loaded');
    assert.ok(
      scriptContent.includes('dry-run') || scriptContent.includes('dryRun'),
      'Should support --dry-run flag'
    );
  })) passed++; else failed++;

  // -- 8. matchSimpleGlob functional tests --
  console.log('\nmatchSimpleGlob Logic:');

  // Extract the function from the script for testing
  const matchFnMatch = scriptContent
    ? scriptContent.match(/function matchSimpleGlob\(filePath, pattern\) \{[\s\S]*?^}/m)
    : null;
  let matchSimpleGlob = null;

  if (test('matchSimpleGlob function is extractable', () => {
    assert.ok(matchFnMatch, 'Should find matchSimpleGlob function in script');
    // eslint-disable-next-line no-new-func
    matchSimpleGlob = new Function(
      'filePath', 'pattern',
      matchFnMatch[0]
        .replace('function matchSimpleGlob(filePath, pattern) {', '')
        .replace(/}$/, '')
    );
  })) passed++; else failed++;

  if (test('matches direct children: tests/*.test.js', () => {
    assert.ok(matchSimpleGlob, 'Function should be loaded');
    assert.ok(
      matchSimpleGlob('tests/auth.test.js', 'tests/*.test.js'),
      'Should match tests/auth.test.js'
    );
    assert.ok(
      !matchSimpleGlob('tests/deep/auth.test.js', 'tests/*.test.js'),
      'Should NOT match nested path with single *'
    );
  })) passed++; else failed++;

  if (test('matches nested paths: tests/**/*.test.js', () => {
    assert.ok(matchSimpleGlob, 'Function should be loaded');
    assert.ok(
      matchSimpleGlob('tests/deep/auth.test.js', 'tests/**/*.test.js'),
      'Should match tests/deep/auth.test.js'
    );
    assert.ok(
      matchSimpleGlob('tests/a/b/c.test.js', 'tests/**/*.test.js'),
      'Should match deeply nested paths'
    );
  })) passed++; else failed++;

  if (test('handles Windows-style paths', () => {
    assert.ok(matchSimpleGlob, 'Function should be loaded');
    assert.ok(
      matchSimpleGlob('tests\\auth.test.js', 'tests/*.test.js'),
      'Should normalize backslashes'
    );
  })) passed++; else failed++;

  if (test('rejects non-matching patterns', () => {
    assert.ok(matchSimpleGlob, 'Function should be loaded');
    assert.ok(
      !matchSimpleGlob('src/main.js', 'tests/*.test.js'),
      'Should not match wrong directory'
    );
    assert.ok(
      !matchSimpleGlob('tests/auth.js', 'tests/*.test.js'),
      'Should not match wrong extension'
    );
  })) passed++; else failed++;

  // -- 9. parseArgs functional tests --
  console.log('\nparseArgs Logic:');

  const parseArgsFnMatch = scriptContent
    ? scriptContent.match(/function parseArgs\(argv\) \{[\s\S]*?^}/m)
    : null;
  let parseArgs = null;

  if (test('parseArgs function is extractable', () => {
    assert.ok(parseArgsFnMatch, 'Should find parseArgs function in script');
    // eslint-disable-next-line no-new-func
    parseArgs = new Function(
      'argv',
      parseArgsFnMatch[0]
        .replace('function parseArgs(argv) {', '')
        .replace(/}$/, '')
    );
  })) passed++; else failed++;

  if (test('parseArgs parses --victim and --suite', () => {
    assert.ok(parseArgs, 'Function should be loaded');
    const result = parseArgs(['node', 'script', '--victim', 'test.js', '--suite', 'npm test']);
    assert.strictEqual(result.victim, 'test.js');
    assert.strictEqual(result.suite, 'npm test');
    assert.strictEqual(result.dryRun, false);
    assert.strictEqual(result.help, false);
  })) passed++; else failed++;

  if (test('parseArgs recognizes --dry-run and --help', () => {
    assert.ok(parseArgs, 'Function should be loaded');
    const result = parseArgs(['node', 'script', '--help', '--dry-run']);
    assert.strictEqual(result.help, true);
    assert.strictEqual(result.dryRun, true);
  })) passed++; else failed++;

  // -- Results --
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

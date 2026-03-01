/**
 * Tests for status report (collectors + formatter)
 *
 * Run with: node tests/lib/status.test.cjs
 */

const assert = require('assert');
const path = require('path');
const { execSync } = require('child_process');

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

const REPO_ROOT = path.join(__dirname, '..', '..');
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugin');

// Import modules under test
const collectors = require(path.join(PLUGIN_ROOT, 'scripts', 'lib', 'status', 'collectors.cjs'));
const formatter = require(path.join(PLUGIN_ROOT, 'scripts', 'lib', 'status', 'formatter.cjs'));

function runTests() {
  console.log('\n=== Testing Status Report ===\n');

  let passed = 0;
  let failed = 0;

  // ============================================================
  // Collectors Unit Tests
  // ============================================================
  console.log('Collectors:');

  if (test('collectPluginInfo returns expected shape', () => {
    const data = collectors.collectPluginInfo(PLUGIN_ROOT);
    assert.strictEqual(typeof data.name, 'string');
    assert.strictEqual(typeof data.version, 'string');
    assert.strictEqual(typeof data.path, 'string');
    assert.strictEqual(typeof data.platform, 'string');
    assert.strictEqual(data.name, 'magic-claude');
    assert.ok(data.version.match(/^\d+\.\d+\.\d+$/), `version should be semver, got "${data.version}"`);
    assert.ok(['windows', 'macos', 'linux'].includes(data.platform), `platform "${data.platform}" not recognized`);
  })) passed++; else failed++;

  if (test('collectAgents returns agents grouped by model', () => {
    const data = collectors.collectAgents(PLUGIN_ROOT);
    assert.strictEqual(typeof data.total, 'number');
    assert.ok(data.total > 0, 'Should find at least one agent');
    assert.strictEqual(typeof data.byModel, 'object');
    assert.ok(Object.keys(data.byModel).length > 0, 'Should have at least one model group');
    // Verify known models exist
    assert.ok(data.byModel.opus, 'Should have opus agents');
    assert.ok(data.byModel.sonnet, 'Should have sonnet agents');
    assert.ok(data.byModel.haiku, 'Should have haiku agents');
    // Verify total matches sum of all model groups
    const summed = Object.values(data.byModel).reduce((s, arr) => s + arr.length, 0);
    assert.strictEqual(data.total, summed, 'Total should match sum of all model groups');
  })) passed++; else failed++;

  if (test('collectAgents detects background agents', () => {
    const data = collectors.collectAgents(PLUGIN_ROOT);
    assert.strictEqual(typeof data.backgroundCount, 'number');
    assert.ok(data.backgroundCount >= 1, 'Should detect at least 1 background agent (git-sync)');
  })) passed++; else failed++;

  if (test('collectSkills returns skills with categories', () => {
    const data = collectors.collectSkills(PLUGIN_ROOT);
    assert.strictEqual(typeof data.total, 'number');
    assert.ok(data.total > 0, 'Should find at least one skill');
    assert.strictEqual(typeof data.byCategory, 'object');
    // Check known categories exist
    assert.ok(data.byCategory.Meta, 'Should have Meta category');
    assert.ok(data.byCategory.Proactive, 'Should have Proactive category');
    assert.ok(data.byCategory.Domain, 'Should have Domain category');
    // using-magic-claude should be in Meta
    assert.ok(
      data.byCategory.Meta.includes('using-magic-claude'),
      'Meta should contain using-magic-claude'
    );
  })) passed++; else failed++;

  if (test('collectHooks returns hook counts by event type', () => {
    const data = collectors.collectHooks(PLUGIN_ROOT);
    assert.strictEqual(typeof data.totalRules, 'number');
    assert.strictEqual(typeof data.totalEventTypes, 'number');
    assert.ok(data.totalRules > 0, 'Should have at least one hook rule');
    assert.ok(data.totalEventTypes > 0, 'Should have at least one event type');
    assert.strictEqual(typeof data.byEventType, 'object');
    // Verify known event types
    assert.ok(data.byEventType.PostToolUse > 0, 'PostToolUse should have hooks');
    assert.ok(data.byEventType.SessionStart > 0, 'SessionStart should have hooks');
  })) passed++; else failed++;

  if (test('collectRules returns rule counts at plugin level', () => {
    const data = collectors.collectRules(PLUGIN_ROOT);
    assert.strictEqual(typeof data.pluginCount, 'number');
    assert.ok(data.pluginCount > 0, 'Should find at least one plugin rule');
    assert.ok(Array.isArray(data.pluginRules), 'pluginRules should be an array');
    assert.strictEqual(data.pluginCount, data.pluginRules.length, 'Count should match array length');
  })) passed++; else failed++;

  if (test('collectCommands returns command list', () => {
    const data = collectors.collectCommands(PLUGIN_ROOT);
    assert.strictEqual(typeof data.total, 'number');
    assert.ok(data.total > 0, 'Should find at least one command');
    assert.ok(Array.isArray(data.commands), 'commands should be an array');
    assert.strictEqual(data.total, data.commands.length, 'Count should match array length');
    // Verify known commands
    assert.ok(data.commands.includes('setup'), 'Should include setup command');
    assert.ok(data.commands.includes('tdd'), 'Should include tdd command');
    assert.ok(data.commands.includes('status'), 'Should include status command');
  })) passed++; else failed++;

  if (test('collectEcosystem returns object with detected key', () => {
    const data = collectors.collectEcosystem();
    assert.ok('detected' in data, 'Should have detected key');
    assert.ok('tools' in data, 'Should have tools key');
    assert.strictEqual(typeof data.tools, 'object');
  })) passed++; else failed++;

  if (test('collectPackageManager returns name and source', () => {
    const data = collectors.collectPackageManager();
    assert.strictEqual(typeof data.name, 'string');
    assert.strictEqual(typeof data.source, 'string');
    assert.ok(data.name.length > 0, 'name should not be empty');
  })) passed++; else failed++;

  if (test('collectWorkspace returns isWorkspace boolean', () => {
    const data = collectors.collectWorkspace();
    assert.strictEqual(typeof data.isWorkspace, 'boolean');
    assert.ok('type' in data, 'Should have type key');
    assert.ok('packageCount' in data, 'Should have packageCount key');
  })) passed++; else failed++;

  if (test('collectIntegrations returns boolean statuses', () => {
    const data = collectors.collectIntegrations();
    assert.strictEqual(typeof data.serena, 'boolean');
    assert.strictEqual(typeof data.jetbrains, 'boolean');
    assert.strictEqual(typeof data.claudeMem, 'boolean');
    assert.strictEqual(typeof data.frontendDesign, 'boolean');
    assert.strictEqual(typeof data.claudeCodeDocs, 'boolean');
  })) passed++; else failed++;

  if (test('collectMcpServers returns count structure', () => {
    const data = collectors.collectMcpServers();
    assert.strictEqual(typeof data.manual.count, 'number');
    assert.ok(Array.isArray(data.manual.names), 'manual.names should be array');
    assert.strictEqual(typeof data.plugins.count, 'number');
    assert.ok(Array.isArray(data.plugins.names), 'plugins.names should be array');
    assert.ok(Array.isArray(data.disabled), 'disabled should be array');
  })) passed++; else failed++;

  // ============================================================
  // Collectors Graceful Degradation
  // ============================================================
  console.log('\nGraceful Degradation:');

  if (test('collectAgents handles missing agents directory', () => {
    const data = collectors.collectAgents('/nonexistent/path');
    assert.strictEqual(data.total, 0);
    assert.deepStrictEqual(data.byModel, {});
  })) passed++; else failed++;

  if (test('collectSkills handles missing skills directory', () => {
    const data = collectors.collectSkills('/nonexistent/path');
    assert.strictEqual(data.total, 0);
    assert.deepStrictEqual(data.byCategory, {});
  })) passed++; else failed++;

  if (test('collectHooks handles missing hooks.json', () => {
    const data = collectors.collectHooks('/nonexistent/path');
    assert.strictEqual(data.totalRules, 0);
    assert.strictEqual(data.totalEventTypes, 0);
  })) passed++; else failed++;

  if (test('collectRules handles missing rules directory', () => {
    const data = collectors.collectRules('/nonexistent/path');
    assert.strictEqual(data.pluginCount, 0);
  })) passed++; else failed++;

  if (test('collectCommands handles missing commands directory', () => {
    const data = collectors.collectCommands('/nonexistent/path');
    assert.strictEqual(data.total, 0);
    assert.deepStrictEqual(data.commands, []);
  })) passed++; else failed++;

  if (test('collectPluginInfo handles missing plugin.json', () => {
    const data = collectors.collectPluginInfo('/nonexistent/path');
    assert.strictEqual(data.name, 'magic-claude');
    assert.strictEqual(data.version, 'unknown');
  })) passed++; else failed++;

  if (test('safeReadDir returns empty array for missing dir', () => {
    const result = collectors.safeReadDir('/nonexistent/dir');
    assert.deepStrictEqual(result, []);
  })) passed++; else failed++;

  if (test('safeParseJson returns null for invalid JSON', () => {
    assert.strictEqual(collectors.safeParseJson(null), null);
    assert.strictEqual(collectors.safeParseJson('not json'), null);
    assert.strictEqual(collectors.safeParseJson(''), null);
  })) passed++; else failed++;

  // ============================================================
  // Formatter Unit Tests
  // ============================================================
  console.log('\nFormatter:');

  if (test('formatSection wraps content with header', () => {
    const result = formatter.formatSection('Test', ['  line1', '  line2']);
    assert.ok(result.includes('--- Test ---'), 'Should have title header');
    assert.ok(result.includes('line1'), 'Should contain content');
    assert.ok(result.includes('line2'), 'Should contain content');
  })) passed++; else failed++;

  if (test('formatPluginSection formats plugin data', () => {
    const result = formatter.formatPluginSection({
      name: 'test', version: '1.0.0', path: '/test', platform: 'linux'
    });
    assert.ok(result.includes('Plugin'), 'Should have Plugin header');
    assert.ok(result.includes('test'), 'Should include name');
    assert.ok(result.includes('1.0.0'), 'Should include version');
  })) passed++; else failed++;

  if (test('formatAgentsSection groups by model', () => {
    const result = formatter.formatAgentsSection({
      total: 5, byModel: { opus: ['a', 'b'], sonnet: ['c', 'd', 'e'] }, backgroundCount: 1
    });
    assert.ok(result.includes('Agents (5)'), 'Should show total');
    assert.ok(result.includes('sonnet: 3'), 'Should show sonnet count');
    assert.ok(result.includes('opus: 2'), 'Should show opus count');
    assert.ok(result.includes('Background: 1'), 'Should show background count');
  })) passed++; else failed++;

  if (test('formatSkillsSection shows categories', () => {
    const result = formatter.formatSkillsSection({
      total: 3, byCategory: { Meta: ['a'], Proactive: ['b', 'c'] }, userInvocable: 1
    });
    assert.ok(result.includes('Skills (3)'), 'Should show total');
    assert.ok(result.includes('Meta:'), 'Should show Meta category');
    assert.ok(result.includes('Proactive:'), 'Should show Proactive category');
  })) passed++; else failed++;

  if (test('formatHooksSection shows event types', () => {
    const result = formatter.formatHooksSection({
      totalRules: 3, totalEventTypes: 2, byEventType: { PostToolUse: 2, Stop: 1 }
    });
    assert.ok(result.includes('3 rules across 2 event types'), 'Should show totals');
    assert.ok(result.includes('PostToolUse:'), 'Should show PostToolUse');
    assert.ok(result.includes('2 rules'), 'Should show plural');
    assert.ok(result.includes('1 rule'), 'Should show singular');
  })) passed++; else failed++;

  if (test('formatCommandsSection wraps command names', () => {
    const result = formatter.formatCommandsSection({
      total: 3, commands: ['alpha', 'beta', 'gamma']
    });
    assert.ok(result.includes('Commands (3)'), 'Should show total');
    assert.ok(result.includes('alpha'), 'Should contain commands');
  })) passed++; else failed++;

  if (test('formatIntegrationsSection shows status', () => {
    const result = formatter.formatIntegrationsSection({
      serena: true, jetbrains: false, claudeMem: false, frontendDesign: true, claudeCodeDocs: true
    });
    assert.ok(result.includes('Serena MCP:'), 'Should show Serena');
    assert.ok(result.includes('claude-code-docs:'), 'Should show claude-code-docs');
    assert.ok(result.includes('installed'), 'Should show installed');
    assert.ok(result.includes('not installed'), 'Should show not installed');
  })) passed++; else failed++;

  if (test('formatIntegrationsSection shows install hint when claude-code-docs not installed', () => {
    const result = formatter.formatIntegrationsSection({
      serena: false, jetbrains: false, claudeMem: false, frontendDesign: false, claudeCodeDocs: false
    });
    assert.ok(result.includes('claude-code-docs:'), 'Should show claude-code-docs');
    assert.ok(result.includes('not installed'), 'Should show not installed');
    assert.ok(result.includes('/plugin marketplace add doublefx/claude-code-docs'), 'Should show install hint');
  })) passed++; else failed++;

  if (test('formatMcpServersSection shows counts', () => {
    const result = formatter.formatMcpServersSection({
      plugins: { count: 3, names: ['serena', 'context7', 'atlassian'] },
      manual: { count: 1, names: ['custom-server'] },
      disabled: ['b']
    });
    assert.ok(result.includes('3 enabled'), 'Should show plugin count');
    assert.ok(result.includes('1 configured'), 'Should show manual count');
    assert.ok(result.includes('Disabled:'), 'Should show disabled');
  })) passed++; else failed++;

  if (test('formatFullReport includes all section headers', () => {
    const allData = {
      plugin: { name: 'test', version: '1.0.0', path: '/test', platform: 'linux' },
      agents: { total: 1, byModel: { opus: ['a'] }, backgroundCount: 0 },
      skills: { total: 1, byCategory: { Other: ['b'] }, userInvocable: 0 },
      hooks: { totalRules: 1, totalEventTypes: 1, byEventType: { Stop: 1 } },
      rules: { pluginCount: 1, pluginRules: ['r'], userCount: 0, userRules: [] },
      commands: { total: 1, commands: ['cmd'] },
      ecosystem: { detected: null, tools: {} },
      packageManager: { name: 'npm', source: 'default' },
      workspace: { isWorkspace: false, type: null, packageCount: 0 },
      integrations: { serena: false, jetbrains: false, claudeMem: false, frontendDesign: false, claudeCodeDocs: false },
      mcpServers: { manual: { count: 0, names: [] }, plugins: { count: 0, names: [] }, disabled: [] },
    };
    const report = formatter.formatFullReport(allData);
    assert.ok(report.includes('magic-claude Status Report'), 'Should have report header');
    assert.ok(report.includes('--- Plugin ---'), 'Should have Plugin section');
    assert.ok(report.includes('--- Agents'), 'Should have Agents section');
    assert.ok(report.includes('--- Skills'), 'Should have Skills section');
    assert.ok(report.includes('--- Hooks'), 'Should have Hooks section');
    assert.ok(report.includes('--- Rules ---'), 'Should have Rules section');
    assert.ok(report.includes('--- Commands'), 'Should have Commands section');
    assert.ok(report.includes('--- Ecosystem ---'), 'Should have Ecosystem section');
    assert.ok(report.includes('--- Package Manager ---'), 'Should have Package Manager section');
    assert.ok(report.includes('--- Workspace ---'), 'Should have Workspace section');
    assert.ok(report.includes('--- Optional Integrations ---'), 'Should have Integrations section');
    assert.ok(report.includes('--- MCP Servers ---'), 'Should have MCP Servers section');
  })) passed++; else failed++;

  if (test('formatFullReport handles null sections gracefully', () => {
    const report = formatter.formatFullReport({ plugin: null, agents: null });
    assert.ok(report.includes('magic-claude Status Report'), 'Should still have header');
    assert.ok(!report.includes('--- Plugin ---'), 'Should skip null sections');
  })) passed++; else failed++;

  // ============================================================
  // Integration Test
  // ============================================================
  console.log('\nIntegration:');

  if (test('status-report.cjs runs and exits with code 0', () => {
    const scriptPath = path.join(PLUGIN_ROOT, 'scripts', 'status-report.cjs');
    const output = execSync(`node "${scriptPath}"`, { encoding: 'utf8', timeout: 10000 });
    assert.ok(output.includes('magic-claude Status Report'), 'Output should contain report header');
    assert.ok(output.includes('--- Plugin ---'), 'Output should contain Plugin section');
    assert.ok(output.includes('--- Agents'), 'Output should contain Agents section');
    assert.ok(output.includes('--- Commands'), 'Output should contain Commands section');
  })) passed++; else failed++;

  if (test('status command .md file exists with correct frontmatter', () => {
    const cmdPath = path.join(PLUGIN_ROOT, 'commands', 'status.md');
    const content = require('fs').readFileSync(cmdPath, 'utf8');
    assert.ok(content.includes('disable-model-invocation: false'), 'Should use model invocation (prevents empty text block API errors)');
    assert.ok(content.includes('command:'), 'Should have command field');
    assert.ok(content.includes('status-report.cjs'), 'Should reference the script');
  })) passed++; else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

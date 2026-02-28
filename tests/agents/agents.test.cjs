/**
 * Tests for agents/discoverer.md and agents/plan-critic.md validation
 *
 * Run with: node tests/agents/agents.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

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
const AGENTS_DIR = path.join(REPO_ROOT, 'agents');
const DISCOVERER_PATH = path.join(AGENTS_DIR, 'discoverer.md');
const PLAN_CRITIC_PATH = path.join(AGENTS_DIR, 'plan-critic.md');
const PLANNER_PATH = path.join(AGENTS_DIR, 'planner.md');
const ORCHESTRATOR_PATH = path.join(REPO_ROOT, 'skills', 'proactive-orchestration', 'SKILL.md');
const PLAN_CRITIC_PROMPT_PATH = path.join(REPO_ROOT, 'skills', 'proactive-orchestration', 'plan-critic-prompt.md');

// Test suite
function runTests() {
  let passed = 0;
  let failed = 0;

  // ─── discoverer.md: File structure ───
  console.log('\n  discoverer.md: File structure');

  if (test('discoverer.md exists', () => {
    assert.ok(fs.existsSync(DISCOVERER_PATH), 'agents/discoverer.md not found');
  })) passed++; else failed++;

  const discovererContent = fs.existsSync(DISCOVERER_PATH)
    ? fs.readFileSync(DISCOVERER_PATH, 'utf-8')
    : '';
  const discovererFm = discovererContent ? parseFrontmatter(discovererContent) : null;

  if (test('has valid frontmatter with name: discoverer', () => {
    assert.ok(discovererFm, 'Could not parse frontmatter');
    assert.strictEqual(discovererFm.attributes.name, 'discoverer');
  })) passed++; else failed++;

  if (test('model is opus', () => {
    assert.strictEqual(discovererFm.attributes.model, 'opus');
  })) passed++; else failed++;

  if (test('skills include claude-mem-context and serena-code-navigation', () => {
    const skills = discovererFm.attributes.skills;
    assert.ok(skills, 'skills not found in frontmatter');
    assert.ok(skills.includes('claude-mem-context'), 'Missing claude-mem-context skill');
    assert.ok(skills.includes('serena-code-navigation'), 'Missing serena-code-navigation skill');
  })) passed++; else failed++;

  if (test('permissionMode is plan', () => {
    assert.strictEqual(discovererFm.attributes.permissionMode, 'plan');
  })) passed++; else failed++;

  // ─── discoverer.md: Required sections ───
  console.log('\n  discoverer.md: Required sections');

  const discovererSections = [
    'Your Role',
    'Discovery Protocol',
    'Anti-Hallucination Rules',
    'Scope Boundaries',
    'Discovery Brief Template',
    'Halt, Don\'t Improvise'
  ];

  for (const section of discovererSections) {
    if (test(`contains "${section}" section`, () => {
      assert.ok(
        discovererContent.includes(section),
        `Missing section: ${section}`
      );
    })) passed++; else failed++;
  }

  // ─── discoverer.md: Key anti-hallucination phrases ───
  console.log('\n  discoverer.md: Anti-hallucination phrases');

  const discovererPhrases = [
    'UNVERIFIED',
    'NEVER assert',
    'FACILITATOR',
    'FORBIDDEN'
  ];

  for (const phrase of discovererPhrases) {
    if (test(`contains key phrase: "${phrase}"`, () => {
      assert.ok(
        discovererContent.includes(phrase),
        `Missing phrase: ${phrase}`
      );
    })) passed++; else failed++;
  }

  // ─── plan-critic.md: File structure ───
  console.log('\n  plan-critic.md: File structure');

  if (test('plan-critic.md exists', () => {
    assert.ok(fs.existsSync(PLAN_CRITIC_PATH), 'agents/plan-critic.md not found');
  })) passed++; else failed++;

  const criticContent = fs.existsSync(PLAN_CRITIC_PATH)
    ? fs.readFileSync(PLAN_CRITIC_PATH, 'utf-8')
    : '';
  const criticFm = criticContent ? parseFrontmatter(criticContent) : null;

  if (test('has valid frontmatter with name: plan-critic', () => {
    assert.ok(criticFm, 'Could not parse frontmatter');
    assert.strictEqual(criticFm.attributes.name, 'plan-critic');
  })) passed++; else failed++;

  if (test('model is opus', () => {
    assert.strictEqual(criticFm.attributes.model, 'opus');
  })) passed++; else failed++;

  if (test('permissionMode is plan', () => {
    assert.strictEqual(criticFm.attributes.permissionMode, 'plan');
  })) passed++; else failed++;

  // ─── plan-critic.md: Required sections ───
  console.log('\n  plan-critic.md: Required sections');

  const criticSections = [
    'The Mandate',
    'Review Attack Plan',
    'Minimum Findings Requirement',
    'Severity Classification',
    'Human Filtering Caveat',
    'Plan Review Output Format',
    'Negative Constraints'
  ];

  for (const section of criticSections) {
    if (test(`contains "${section}" section`, () => {
      assert.ok(
        criticContent.includes(section),
        `Missing section: ${section}`
      );
    })) passed++; else failed++;
  }

  // ─── plan-critic.md: Adversarial mandate phrases ───
  console.log('\n  plan-critic.md: Adversarial mandate phrases');

  const criticPhrases = [
    'MUST find issues',
    'zero findings',
    'NOT LOOKING HARD ENOUGH',
    'CRITICAL',
    'false positives'
  ];

  for (const phrase of criticPhrases) {
    if (test(`contains adversarial phrase: "${phrase}"`, () => {
      assert.ok(
        criticContent.toLowerCase().includes(phrase.toLowerCase()),
        `Missing phrase: ${phrase}`
      );
    })) passed++; else failed++;
  }

  // ─── plan-critic-prompt.md: Template validation ───
  console.log('\n  plan-critic-prompt.md: Template validation');

  if (test('plan-critic-prompt.md exists', () => {
    assert.ok(fs.existsSync(PLAN_CRITIC_PROMPT_PATH), 'plan-critic-prompt.md not found');
  })) passed++; else failed++;

  const promptContent = fs.existsSync(PLAN_CRITIC_PROMPT_PATH)
    ? fs.readFileSync(PLAN_CRITIC_PROMPT_PATH, 'utf-8')
    : '';

  if (test('is non-empty', () => {
    assert.ok(promptContent.length > 100, 'Template is too short');
  })) passed++; else failed++;

  if (test('contains PLAN_CONTENT placeholder', () => {
    assert.ok(
      promptContent.includes('PLAN_CONTENT'),
      'Missing PLAN_CONTENT placeholder'
    );
  })) passed++; else failed++;

  if (test('contains DISCOVERY_BRIEF placeholder', () => {
    assert.ok(
      promptContent.includes('DISCOVERY_BRIEF'),
      'Missing DISCOVERY_BRIEF placeholder'
    );
  })) passed++; else failed++;

  if (test('contains integration section', () => {
    assert.ok(
      promptContent.includes('Called by') && promptContent.includes('Follows') && promptContent.includes('Precedes'),
      'Missing integration section'
    );
  })) passed++; else failed++;

  // ─── planner.md: Updated sections ───
  console.log('\n  planner.md: Discovery Context + anti-hallucination updates');

  const plannerContent = fs.existsSync(PLANNER_PATH)
    ? fs.readFileSync(PLANNER_PATH, 'utf-8')
    : '';

  if (test('contains "Discovery Context" section', () => {
    assert.ok(
      plannerContent.includes('Discovery Context'),
      'Missing Discovery Context section'
    );
  })) passed++; else failed++;

  if (test('references Discovery Brief', () => {
    assert.ok(
      plannerContent.includes('Discovery Brief'),
      'Missing Discovery Brief reference'
    );
  })) passed++; else failed++;

  if (test('contains UNVERIFIED marker rule', () => {
    assert.ok(
      plannerContent.includes('UNVERIFIED'),
      'Missing UNVERIFIED reference'
    );
  })) passed++; else failed++;

  if (test('contains Negative Constraints rule', () => {
    assert.ok(
      plannerContent.includes('Negative Constraints'),
      'Missing Negative Constraints reference'
    );
  })) passed++; else failed++;

  // ─── Orchestrator integration ───
  console.log('\n  Orchestrator integration');

  const orchestratorContent = fs.existsSync(ORCHESTRATOR_PATH)
    ? fs.readFileSync(ORCHESTRATOR_PATH, 'utf-8')
    : '';

  if (test('contains Phase 0.5: DISCOVER', () => {
    assert.ok(
      orchestratorContent.includes('Phase 0.5') && orchestratorContent.includes('DISCOVER'),
      'Missing Phase 0.5: DISCOVER'
    );
  })) passed++; else failed++;

  if (test('contains Phase 1.1: PLAN CRITIC', () => {
    assert.ok(
      orchestratorContent.includes('Phase 1.1') && orchestratorContent.includes('PLAN CRITIC'),
      'Missing Phase 1.1: PLAN CRITIC'
    );
  })) passed++; else failed++;

  if (test('digraph contains discover node', () => {
    assert.ok(
      orchestratorContent.includes('discover [label='),
      'Missing discover node in digraph'
    );
  })) passed++; else failed++;

  if (test('digraph contains plan_critic node', () => {
    assert.ok(
      orchestratorContent.includes('plan_critic [label='),
      'Missing plan_critic node in digraph'
    );
  })) passed++; else failed++;

  if (test('digraph edge: discover -> plan', () => {
    assert.ok(
      orchestratorContent.includes('discover -> plan'),
      'Missing discover -> plan edge'
    );
  })) passed++; else failed++;

  if (test('digraph edge: plan -> plan_critic', () => {
    assert.ok(
      orchestratorContent.includes('plan -> plan_critic'),
      'Missing plan -> plan_critic edge'
    );
  })) passed++; else failed++;

  if (test('digraph edge: plan_critic -> user_confirm', () => {
    assert.ok(
      orchestratorContent.includes('plan_critic -> user_confirm'),
      'Missing plan_critic -> user_confirm edge'
    );
  })) passed++; else failed++;

  if (test('report template includes DISCOVER line', () => {
    assert.ok(
      orchestratorContent.includes('DISCOVER:'),
      'Missing DISCOVER line in report template'
    );
  })) passed++; else failed++;

  if (test('report template includes CRITIC line', () => {
    assert.ok(
      orchestratorContent.includes('CRITIC:'),
      'Missing CRITIC line in report template'
    );
  })) passed++; else failed++;

  if (test('related section references discoverer agent', () => {
    assert.ok(
      orchestratorContent.includes('magic-claude:discoverer'),
      'Missing discoverer agent in related section'
    );
  })) passed++; else failed++;

  if (test('related section references plan-critic agent', () => {
    assert.ok(
      orchestratorContent.includes('magic-claude:plan-critic'),
      'Missing plan-critic agent in related section'
    );
  })) passed++; else failed++;

  if (test('related section references plan-critic-prompt.md', () => {
    assert.ok(
      orchestratorContent.includes('plan-critic-prompt.md'),
      'Missing plan-critic-prompt.md in related section'
    );
  })) passed++; else failed++;

  // ─── Summary ───
  console.log(`\n  ${passed} passed, ${failed} failed (${passed + failed} total)`);
  return { passed, failed };
}

// Run
console.log('\nagents.test.cjs');
const { passed, failed } = runTests();
process.exit(failed > 0 ? 1 : 0);

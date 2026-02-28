/**
 * Tests for hooks/hooks.json validation
 *
 * Run with: node tests/hooks/hooks.test.cjs
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

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
const HOOKS_PATH = path.join(REPO_ROOT, 'hooks', 'hooks.json');

const VALID_EVENT_TYPES = [
  'UserPromptSubmit',
  'PermissionRequest',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'Notification',
  'SubagentStart',
  'SubagentStop',
  'Stop',
  'TeammateIdle',
  'TaskCompleted',
  'PreCompact',
  'SessionStart',
  'SessionEnd',
  'ConfigChange',
  'WorktreeCreate',
  'WorktreeRemove'
];

const VALID_HANDLER_TYPES = ['command', 'prompt', 'agent', 'http'];

// Events that should NOT have matchers (they fire unconditionally)
const NO_MATCHER_EVENTS = ['Stop', 'TeammateIdle', 'TaskCompleted'];

// Test suite
function runTests() {
  console.log('\n=== Testing hooks.json ===\n');

  let passed = 0;
  let failed = 0;

  // -- 1. JSON Structure --
  console.log('JSON Structure:');

  let hooksData = null;

  if (test('hooks.json is valid JSON', () => {
    const content = fs.readFileSync(HOOKS_PATH, 'utf8');
    hooksData = JSON.parse(content);
  })) passed++; else failed++;

  if (test('hooks.json has a "hooks" property', () => {
    assert.ok(hooksData, 'hooksData should be parsed');
    assert.ok(hooksData.hooks, 'Should have a "hooks" property');
    assert.strictEqual(typeof hooksData.hooks, 'object', '"hooks" should be an object');
    assert.ok(!Array.isArray(hooksData.hooks), '"hooks" should not be an array');
  })) passed++; else failed++;

  // Bail early if hooksData is not parsed
  if (!hooksData || !hooksData.hooks) {
    console.log('\n=== Test Results ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total:  ${passed + failed}\n`);
    process.exit(1);
  }

  const hooks = hooksData.hooks;

  // -- 2. Valid Event Types --
  console.log('\nValid Event Types:');

  if (test('all keys under "hooks" are valid Claude Code hook event types', () => {
    const eventTypes = Object.keys(hooks);
    assert.ok(eventTypes.length > 0, 'Should have at least one event type');
    for (const eventType of eventTypes) {
      assert.ok(
        VALID_EVENT_TYPES.includes(eventType),
        `"${eventType}" is not a valid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}`
      );
    }
  })) passed++; else failed++;

  // -- 3. Hook Rule Structure --
  console.log('\nHook Rule Structure:');

  if (test('each event type maps to an array of hook rules', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      assert.ok(
        Array.isArray(rules),
        `"${eventType}" should map to an array, got ${typeof rules}`
      );
      assert.ok(
        rules.length > 0,
        `"${eventType}" should have at least one hook rule`
      );
    }
  })) passed++; else failed++;

  if (test('each hook rule has a required "hooks" array', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        assert.ok(
          rule.hooks,
          `${eventType}[${i}] is missing required "hooks" property`
        );
        assert.ok(
          Array.isArray(rule.hooks),
          `${eventType}[${i}].hooks should be an array, got ${typeof rule.hooks}`
        );
        assert.ok(
          rule.hooks.length > 0,
          `${eventType}[${i}].hooks should not be empty`
        );
      }
    }
  })) passed++; else failed++;

  if (test('hook rules only contain allowed properties', () => {
    const allowedRuleProps = ['matcher', 'hooks', 'description'];
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        for (const prop of Object.keys(rule)) {
          assert.ok(
            allowedRuleProps.includes(prop),
            `${eventType}[${i}] has unexpected property "${prop}". Allowed: ${allowedRuleProps.join(', ')}`
          );
        }
      }
    }
  })) passed++; else failed++;

  // -- 4. Hook Handler Fields --
  console.log('\nHook Handler Fields:');

  if (test('each handler has a required "type" field with valid value', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          assert.ok(
            handler.type,
            `${eventType}[${i}].hooks[${j}] is missing required "type" field`
          );
          assert.ok(
            VALID_HANDLER_TYPES.includes(handler.type),
            `${eventType}[${i}].hooks[${j}].type "${handler.type}" is not valid. Valid types: ${VALID_HANDLER_TYPES.join(', ')}`
          );
        }
      }
    }
  })) passed++; else failed++;

  if (test('handlers with type "command" have a "command" string field', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          if (handler.type === 'command') {
            assert.ok(
              handler.command,
              `${eventType}[${i}].hooks[${j}] with type "command" is missing "command" field`
            );
            assert.strictEqual(
              typeof handler.command,
              'string',
              `${eventType}[${i}].hooks[${j}].command should be a string, got ${typeof handler.command}`
            );
            assert.ok(
              handler.command.length > 0,
              `${eventType}[${i}].hooks[${j}].command should not be empty`
            );
          }
        }
      }
    }
  })) passed++; else failed++;

  // -- 5. Optional Fields Validation --
  console.log('\nOptional Fields Validation:');

  if (test('if "statusMessage" exists on a handler it is a string', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          if ('statusMessage' in handler) {
            assert.strictEqual(
              typeof handler.statusMessage,
              'string',
              `${eventType}[${i}].hooks[${j}].statusMessage should be a string, got ${typeof handler.statusMessage}`
            );
          }
        }
      }
    }
  })) passed++; else failed++;

  if (test('if "async" exists on a handler it is a boolean', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          if ('async' in handler) {
            assert.strictEqual(
              typeof handler.async,
              'boolean',
              `${eventType}[${i}].hooks[${j}].async should be a boolean, got ${typeof handler.async}`
            );
          }
        }
      }
    }
  })) passed++; else failed++;

  if (test('if "timeout" exists on a handler it is a number', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          if ('timeout' in handler) {
            assert.strictEqual(
              typeof handler.timeout,
              'number',
              `${eventType}[${i}].hooks[${j}].timeout should be a number, got ${typeof handler.timeout}`
            );
          }
        }
      }
    }
  })) passed++; else failed++;

  if (test('if "once" exists on a handler it is a boolean', () => {
    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          if ('once' in handler) {
            assert.strictEqual(
              typeof handler.once,
              'boolean',
              `${eventType}[${i}].hooks[${j}].once should be a boolean, got ${typeof handler.once}`
            );
          }
        }
      }
    }
  })) passed++; else failed++;

  // -- 6. Script File Existence --
  console.log('\nScript File Existence:');

  if (test('every command referencing ${CLAUDE_PLUGIN_ROOT}/scripts/... has corresponding file', () => {
    const scriptPathRegex = /\$\{CLAUDE_PLUGIN_ROOT\}\/(scripts\/[^"'\s]+)/g;
    const missingFiles = [];

    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].hooks.length; j++) {
          const handler = rules[i].hooks[j];
          if (handler.type === 'command' && handler.command) {
            let match;
            // Reset regex lastIndex for each command
            scriptPathRegex.lastIndex = 0;
            while ((match = scriptPathRegex.exec(handler.command)) !== null) {
              const relativePath = match[1];
              const absolutePath = path.join(REPO_ROOT, relativePath);
              if (!fs.existsSync(absolutePath)) {
                missingFiles.push({
                  eventType,
                  ruleIndex: i,
                  handlerIndex: j,
                  relativePath,
                  absolutePath
                });
              }
            }
          }
        }
      }
    }

    if (missingFiles.length > 0) {
      const details = missingFiles
        .map(f => `  ${f.eventType}[${f.ruleIndex}].hooks[${f.handlerIndex}]: ${f.relativePath}`)
        .join('\n');
      assert.fail(`Missing script files:\n${details}`);
    }
  })) passed++; else failed++;

  // -- 7. Matcher Validity for Events --
  console.log('\nMatcher Validity for Events:');

  if (test('Stop, TeammateIdle, TaskCompleted should NOT have matchers', () => {
    const violations = [];

    for (const eventType of NO_MATCHER_EVENTS) {
      if (!hooks[eventType]) continue;
      for (let i = 0; i < hooks[eventType].length; i++) {
        const rule = hooks[eventType][i];
        if ('matcher' in rule) {
          violations.push(`${eventType}[${i}] has a matcher ("${rule.matcher}") but should not`);
        }
      }
    }

    if (violations.length > 0) {
      assert.fail(`Events with invalid matchers:\n  ${violations.join('\n  ')}`);
    }
  })) passed++; else failed++;

  if (test('events that allow matchers have valid matcher strings or omit them', () => {
    const matcherEvents = Object.keys(hooks).filter(e => !NO_MATCHER_EVENTS.includes(e));
    for (const eventType of matcherEvents) {
      for (let i = 0; i < hooks[eventType].length; i++) {
        const rule = hooks[eventType][i];
        if ('matcher' in rule) {
          assert.strictEqual(
            typeof rule.matcher,
            'string',
            `${eventType}[${i}].matcher should be a string, got ${typeof rule.matcher}`
          );
          assert.ok(
            rule.matcher.length > 0,
            `${eventType}[${i}].matcher should not be an empty string`
          );
        }
      }
    }
  })) passed++; else failed++;

  // -- 8. No Duplicate Hook Rules --
  console.log('\nNo Duplicate Hook Rules:');

  if (test('no two hook rules in same event have identical matcher + command combinations', () => {
    const duplicates = [];

    for (const [eventType, rules] of Object.entries(hooks)) {
      const seen = new Set();
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        // Build a key from matcher + all command strings in the hooks array
        const matcher = rule.matcher || '<no-matcher>';
        const commands = rule.hooks
          .filter(h => h.type === 'command')
          .map(h => h.command)
          .sort()
          .join('|');
        const key = `${matcher}::${commands}`;

        if (seen.has(key)) {
          duplicates.push(`${eventType}[${i}]: matcher="${matcher}", commands="${commands}"`);
        }
        seen.add(key);
      }
    }

    if (duplicates.length > 0) {
      assert.fail(`Duplicate hook rules found:\n  ${duplicates.join('\n  ')}`);
    }
  })) passed++; else failed++;

  // -- 9. Description Field --
  console.log('\nDescription Field:');

  if (test('every hook rule has a description string', () => {
    const missing = [];

    for (const [eventType, rules] of Object.entries(hooks)) {
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (!('description' in rule)) {
          missing.push(`${eventType}[${i}] is missing "description" field`);
        } else if (typeof rule.description !== 'string') {
          missing.push(`${eventType}[${i}].description should be a string, got ${typeof rule.description}`);
        } else if (rule.description.trim().length === 0) {
          missing.push(`${eventType}[${i}].description should not be empty`);
        }
      }
    }

    if (missing.length > 0) {
      assert.fail(`Hook rules with missing or invalid descriptions:\n  ${missing.join('\n  ')}`);
    }
  })) passed++; else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();

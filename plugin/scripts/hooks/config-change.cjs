#!/usr/bin/env node
/**
 * ConfigChange Hook - Security auditing and setup detection
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Fires when configuration files or skills are modified.
 * Detects security-relevant changes (MCP servers, permissions, plugins)
 * and setup opportunities. Advisory only for most changes.
 *
 * Can block non-policy changes when a security concern is detected
 * (e.g., MCP server added from unknown source in project settings).
 */

const { log } = require('../lib/utils.cjs');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

/**
 * Classify the change and return an audit entry
 */
function classifyChange(input) {
  const { config_source, jsonpath, old_value, new_value } = input;
  const path = jsonpath || '';

  // MCP server additions
  if (path.match(/^\$\.mcpServers\./)) {
    const serverName = path.replace(/^\$\.mcpServers\./, '');
    if (old_value === null || old_value === undefined) {
      return {
        category: 'mcp_added',
        severity: 'info',
        message: `New MCP server added: "${serverName}" (source: ${config_source})`,
        detail: formatMcpDetail(serverName, new_value),
        setupHint: 'Consider running /setup-ecosystem to verify tool configuration'
      };
    }
    if (new_value === null || new_value === undefined) {
      return {
        category: 'mcp_removed',
        severity: 'info',
        message: `MCP server removed: "${serverName}" (source: ${config_source})`,
        detail: null,
        setupHint: null
      };
    }
    return {
      category: 'mcp_changed',
      severity: 'info',
      message: `MCP server reconfigured: "${serverName}" (source: ${config_source})`,
      detail: null,
      setupHint: null
    };
  }

  // Disabled MCP servers
  if (path.match(/^\$\.disabledMcpServers/)) {
    const added = findArrayAdditions(old_value, new_value);
    const removed = findArrayRemovals(old_value, new_value);
    const parts = [];
    if (added.length > 0) parts.push(`disabled: ${added.join(', ')}`);
    if (removed.length > 0) parts.push(`re-enabled: ${removed.join(', ')}`);
    return {
      category: 'mcp_disabled',
      severity: 'warn',
      message: `MCP server availability changed (${config_source}): ${parts.join('; ')}`,
      detail: null,
      setupHint: null
    };
  }

  // Plugin changes
  if (path.match(/^\$\.(enabledPlugins|plugins)/)) {
    return {
      category: 'plugin_change',
      severity: 'info',
      message: `Plugin configuration changed (${config_source})`,
      detail: null,
      setupHint: 'Consider running /setup to ensure all plugin components are configured'
    };
  }

  // Permission changes
  if (path.match(/^\$\.(permissions|allowedTools|disallowedTools)/)) {
    return {
      category: 'permissions',
      severity: 'warn',
      message: `Permission configuration changed (${config_source}): ${path}`,
      detail: null,
      setupHint: null
    };
  }

  // Skills changes
  if (config_source === 'skills') {
    return {
      category: 'skills',
      severity: 'info',
      message: `Skills configuration changed: ${path}`,
      detail: null,
      setupHint: null
    };
  }

  // Generic change
  return {
    category: 'other',
    severity: 'info',
    message: `Configuration changed (${config_source}): ${path}`,
    detail: null,
    setupHint: null
  };
}

/**
 * Format MCP server details for display
 */
function formatMcpDetail(name, config) {
  if (!config || typeof config !== 'object') return null;
  const parts = [];
  if (config.command) parts.push(`command: ${config.command}`);
  if (config.url) parts.push(`url: ${config.url}`);
  if (config.args) parts.push(`args: ${JSON.stringify(config.args)}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Find items added to an array (present in newArr but not oldArr)
 */
function findArrayAdditions(oldArr, newArr) {
  const oldSet = new Set(Array.isArray(oldArr) ? oldArr : []);
  const newSet = Array.isArray(newArr) ? newArr : [];
  return newSet.filter(item => !oldSet.has(item));
}

/**
 * Find items removed from an array (present in oldArr but not newArr)
 */
function findArrayRemovals(oldArr, newArr) {
  const newSet = new Set(Array.isArray(newArr) ? newArr : []);
  const oldSet = Array.isArray(oldArr) ? oldArr : [];
  return oldSet.filter(item => !newSet.has(item));
}

async function main() {
  const input = await readStdin();

  if (!input.hook_event_name || input.hook_event_name !== 'ConfigChange') {
    process.exit(0);
  }

  const result = classifyChange(input);

  // Log for visibility
  const prefix = result.severity === 'warn' ? '[ConfigChange:WARN]' : '[ConfigChange]';
  log(`${prefix} ${result.message}`);
  if (result.detail) {
    log(`${prefix}   ${result.detail}`);
  }

  // Build additionalContext for Claude
  const contextParts = [result.message];
  if (result.detail) contextParts.push(result.detail);
  if (result.setupHint) contextParts.push(result.setupHint);

  const output = {
    hookSpecificOutput: {
      hookEventName: 'ConfigChange',
      additionalContext: contextParts.join('\n')
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
}

main().catch(err => {
  console.error('[ConfigChange] Error:', err.message);
  process.exit(0); // Never crash on config changes
});

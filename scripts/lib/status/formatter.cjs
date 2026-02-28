#!/usr/bin/env node
/**
 * Status Report - Formatter
 *
 * Pure formatting functions that convert collector output to plain-text sections.
 * No I/O or side effects — takes data objects, returns strings.
 */

const SEPARATOR = '=';
const SECTION_PREFIX = '---';

/**
 * Format a section with a title header
 * @param {string} title
 * @param {string[]} lines
 * @returns {string}
 */
function formatSection(title, lines) {
  return `${SECTION_PREFIX} ${title} ${SECTION_PREFIX}\n${lines.join('\n')}`;
}

/**
 * Format the plugin info section
 */
function formatPluginSection(data) {
  return formatSection('Plugin', [
    `  Name:      ${data.name}`,
    `  Version:   ${data.version}`,
    `  Path:      ${data.path}`,
    `  Platform:  ${data.platform}`,
  ]);
}

/**
 * Format agents section with model breakdown
 */
function formatAgentsSection(data) {
  const lines = [];

  // Sort models by count descending
  const models = Object.entries(data.byModel)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [model, agents] of models) {
    lines.push(`  ${model}: ${agents.length}  (${agents.slice(0, 5).join(', ')}${agents.length > 5 ? ', ...' : ''})`);
  }

  if (data.backgroundCount > 0) {
    lines.push(`  Background: ${data.backgroundCount}`);
  }

  return formatSection(`Agents (${data.total})`, lines);
}

/**
 * Format skills section with category breakdown
 */
function formatSkillsSection(data) {
  const lines = [];

  // Fixed category order for consistent output
  const orderedCategories = [
    'Meta', 'Proactive', 'Domain', 'Debugging', 'Review',
    'Workflow', 'Branch', 'Serena', 'UI Design', 'Other'
  ];

  for (const category of orderedCategories) {
    const skills = data.byCategory[category];
    if (!skills || skills.length === 0) continue;
    const padded = (category + ':').padEnd(13);
    lines.push(`  ${padded} ${skills.length}  (${skills.slice(0, 4).join(', ')}${skills.length > 4 ? ', ...' : ''})`);
  }

  // Any categories not in ordered list
  for (const [category, skills] of Object.entries(data.byCategory)) {
    if (orderedCategories.includes(category)) continue;
    const padded = (category + ':').padEnd(13);
    lines.push(`  ${padded} ${skills.length}`);
  }

  return formatSection(`Skills (${data.total})`, lines);
}

/**
 * Format hooks section with event type breakdown
 */
function formatHooksSection(data) {
  const lines = [];

  // Sort by event type name
  const events = Object.entries(data.byEventType).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [eventType, count] of events) {
    const padded = (eventType + ':').padEnd(22);
    lines.push(`  ${padded} ${count} rule${count !== 1 ? 's' : ''}`);
  }

  return formatSection(`Hooks (${data.totalRules} rules across ${data.totalEventTypes} event types)`, lines);
}

/**
 * Format rules section
 */
function formatRulesSection(data) {
  const lines = [
    `  Plugin rules:  ${data.pluginCount}`,
    `  User rules:    ${data.userCount}`,
  ];

  return formatSection('Rules', lines);
}

/**
 * Format commands section
 */
function formatCommandsSection(data) {
  // Wrap command names into lines of ~70 chars
  const lines = [];
  let currentLine = '  ';

  for (let i = 0; i < data.commands.length; i++) {
    const cmd = data.commands[i];
    const separator = i < data.commands.length - 1 ? ', ' : '';
    if (currentLine.length + cmd.length + separator.length > 72 && currentLine.length > 2) {
      lines.push(currentLine);
      currentLine = '  ' + cmd + separator;
    } else {
      currentLine += cmd + separator;
    }
  }
  if (currentLine.trim().length > 0) lines.push(currentLine);

  return formatSection(`Commands (${data.total})`, lines);
}

/**
 * Format ecosystem section
 */
function formatEcosystemSection(data) {
  const lines = [`  Detected:  ${data.detected || 'none'}`];

  if (Object.keys(data.tools).length > 0) {
    const available = Object.entries(data.tools)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const unavailable = Object.entries(data.tools)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    if (available.length > 0) {
      lines.push(`  Available: ${available.join(', ')}`);
    }
    if (unavailable.length > 0) {
      lines.push(`  Missing:   ${unavailable.join(', ')}`);
    }
  }

  return formatSection('Ecosystem', lines);
}

/**
 * Format package manager section
 */
function formatPackageManagerSection(data) {
  return formatSection('Package Manager', [
    `  Active:  ${data.name}`,
    `  Source:  ${data.source}`,
  ]);
}

/**
 * Format workspace section
 */
function formatWorkspaceSection(data) {
  if (!data.isWorkspace) {
    return formatSection('Workspace', ['  Type:  none (single project)']);
  }

  return formatSection('Workspace', [
    `  Type:      ${data.type}`,
    `  Packages:  ${data.packageCount}`,
  ]);
}

/**
 * Format optional integrations section
 */
function formatIntegrationsSection(data) {
  const status = (installed) => installed ? 'installed' : 'not installed';

  return formatSection('Optional Integrations', [
    `  Serena MCP:       ${status(data.serena)}${data.jetbrains ? ' (JetBrains available)' : ''}`,
    `  claude-mem:       ${status(data.claudeMem)}`,
    `  frontend-design:  ${status(data.frontendDesign)}`,
  ]);
}

/**
 * Format MCP servers section
 */
function formatMcpServersSection(data) {
  const lines = [];

  if (data.plugins && data.plugins.count > 0) {
    lines.push(`  Plugins:   ${data.plugins.count} enabled (${data.plugins.names.join(', ')})`);
  }

  if (data.manual && data.manual.count > 0) {
    lines.push(`  Manual:    ${data.manual.count} configured (${data.manual.names.join(', ')})`);
  }

  if (lines.length === 0) {
    lines.push('  None configured');
  }

  if (data.disabled.length > 0) {
    lines.push(`  Disabled:  ${data.disabled.length} (${data.disabled.join(', ')})`);
  }

  return formatSection('MCP Servers', lines);
}

/**
 * Format the complete report from all collected data
 * @param {object} allData - Map of section name to collected data
 * @returns {string}
 */
function formatFullReport(allData) {
  const header = SEPARATOR.repeat(50) + '\n  magic-claude Status Report\n' + SEPARATOR.repeat(50);

  const sections = [];

  if (allData.plugin) sections.push(formatPluginSection(allData.plugin));
  if (allData.agents) sections.push(formatAgentsSection(allData.agents));
  if (allData.skills) sections.push(formatSkillsSection(allData.skills));
  if (allData.hooks) sections.push(formatHooksSection(allData.hooks));
  if (allData.rules) sections.push(formatRulesSection(allData.rules));
  if (allData.commands) sections.push(formatCommandsSection(allData.commands));
  if (allData.ecosystem) sections.push(formatEcosystemSection(allData.ecosystem));
  if (allData.packageManager) sections.push(formatPackageManagerSection(allData.packageManager));
  if (allData.workspace) sections.push(formatWorkspaceSection(allData.workspace));
  if (allData.integrations) sections.push(formatIntegrationsSection(allData.integrations));
  if (allData.mcpServers) sections.push(formatMcpServersSection(allData.mcpServers));

  const footer = SEPARATOR.repeat(50);

  return [header, ...sections, footer].join('\n');
}

module.exports = {
  formatSection,
  formatPluginSection,
  formatAgentsSection,
  formatSkillsSection,
  formatHooksSection,
  formatRulesSection,
  formatCommandsSection,
  formatEcosystemSection,
  formatPackageManagerSection,
  formatWorkspaceSection,
  formatIntegrationsSection,
  formatMcpServersSection,
  formatFullReport,
};

#!/usr/bin/env node
/**
 * Status Report - Entry Point
 *
 * Orchestrates data collection and formatting to produce
 * a comprehensive plain-text status report.
 *
 * Usage: node scripts/status-report.cjs
 */

const path = require('path');
const {
  collectPluginInfo,
  collectAgents,
  collectSkills,
  collectHooks,
  collectRules,
  collectCommands,
  collectEcosystem,
  collectPackageManager,
  collectWorkspace,
  collectIntegrations,
  collectMcpServers,
} = require('./lib/status/collectors.cjs');
const { formatFullReport } = require('./lib/status/formatter.cjs');

function main() {
  // Resolve plugin root: env var (plugin runtime) or repo root (development)
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');

  // Collect all data with graceful degradation per section
  const allData = {};

  const collectors = [
    ['plugin', () => collectPluginInfo(pluginRoot)],
    ['agents', () => collectAgents(pluginRoot)],
    ['skills', () => collectSkills(pluginRoot)],
    ['hooks', () => collectHooks(pluginRoot)],
    ['rules', () => collectRules(pluginRoot)],
    ['commands', () => collectCommands(pluginRoot)],
    ['ecosystem', () => collectEcosystem()],
    ['packageManager', () => collectPackageManager()],
    ['workspace', () => collectWorkspace()],
    ['integrations', () => collectIntegrations()],
    ['mcpServers', () => collectMcpServers()],
  ];

  for (const [name, collector] of collectors) {
    try {
      allData[name] = collector();
    } catch {
      allData[name] = null;
    }
  }

  // Format and output
  const report = formatFullReport(allData);
  console.log(report);
}

main();

#!/usr/bin/env node
/**
 * Status Report - Data Collectors
 *
 * Pure data-collection functions for each report section.
 * Each function returns a plain object; all file I/O is wrapped in try/catch
 * for graceful degradation.
 */

const path = require('path');
const fs = require('fs');
const { parseFrontmatter, readFile, getHomeDir, isWindows, isMacOS, isLinux } = require('../utils.cjs');
const { isSerenaInstalled, isJetBrainsAvailable } = require('../serena.cjs');

/**
 * Collect plugin metadata from .claude-plugin/plugin.json
 * @param {string} pluginRoot
 * @returns {{ name: string, version: string, path: string, platform: string }}
 */
function collectPluginInfo(pluginRoot) {
  const pluginJsonPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  const content = readFile(pluginJsonPath);

  let name = 'magic-claude';
  let version = 'unknown';
  let description = '';

  if (content) {
    try {
      const data = JSON.parse(content);
      name = data.name || name;
      version = data.version || version;
      description = data.description || '';
    } catch {
      // Use defaults
    }
  }

  let platform = 'unknown';
  if (isWindows) platform = 'windows';
  else if (isMacOS) platform = 'macos';
  else if (isLinux) platform = 'linux';

  return { name, version, description, path: pluginRoot, platform };
}

/**
 * Collect agents from agents/*.md, parse frontmatter for name/model/background
 * @param {string} pluginRoot
 * @returns {{ total: number, byModel: Record<string, string[]>, backgroundCount: number }}
 */
function collectAgents(pluginRoot) {
  const agentsDir = path.join(pluginRoot, 'agents');
  const byModel = {};
  let backgroundCount = 0;

  const files = safeReadDir(agentsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = readFile(path.join(agentsDir, file));
    if (!content) continue;

    const { attributes } = parseFrontmatter(content);
    const name = attributes.name || file.replace('.md', '');
    const model = attributes.model || 'default';

    if (!byModel[model]) byModel[model] = [];
    byModel[model].push(name);

    if (attributes.background === 'true') backgroundCount++;
  }

  const total = files.length;
  return { total, byModel, backgroundCount };
}

/**
 * Skill category classification
 */
const SKILL_CATEGORIES = {
  Meta: name => name === 'using-magic-claude',
  Proactive: name => name.startsWith('proactive-'),
  Domain: name => /(-(patterns|standards|workflow))$/.test(name),
  Debugging: name => name === 'systematic-debugging',
  Review: name => name.includes('review') && !name.startsWith('proactive-'),
  Workflow: name => ['continuous-learning', 'eval-harness', 'verification-loop', 'strategic-compact', 'extend'].includes(name),
  Branch: name => ['using-git-worktrees', 'finishing-feature'].includes(name),
  Serena: name => name.startsWith('serena-'),
  'UI Design': name => name === 'ui-design',
};

/**
 * Collect skills from skills/\*\/SKILL.md
 * @param {string} pluginRoot
 * @returns {{ total: number, byCategory: Record<string, string[]>, userInvocable: number }}
 */
function collectSkills(pluginRoot) {
  const skillsDir = path.join(pluginRoot, 'skills');
  const byCategory = {};
  let userInvocable = 0;

  const dirs = safeReadDir(skillsDir).filter(d => {
    const fullPath = path.join(skillsDir, d);
    try { return fs.statSync(fullPath).isDirectory(); } catch { return false; }
  });

  for (const dir of dirs) {
    const skillPath = path.join(skillsDir, dir, 'SKILL.md');
    const content = readFile(skillPath);
    if (!content) continue;

    const { attributes } = parseFrontmatter(content);
    const name = attributes.name || dir;

    if (attributes['user-invocable'] === 'true') userInvocable++;

    let categorized = false;
    for (const [category, matcher] of Object.entries(SKILL_CATEGORIES)) {
      if (matcher(name)) {
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(name);
        categorized = true;
        break;
      }
    }
    if (!categorized) {
      if (!byCategory['Other']) byCategory['Other'] = [];
      byCategory['Other'].push(name);
    }
  }

  const total = dirs.filter(d => {
    return fs.existsSync(path.join(skillsDir, d, 'SKILL.md'));
  }).length;

  return { total, byCategory, userInvocable };
}

/**
 * Collect hooks from hooks/hooks.json
 * @param {string} pluginRoot
 * @returns {{ totalRules: number, totalEventTypes: number, byEventType: Record<string, number> }}
 */
function collectHooks(pluginRoot) {
  const hooksPath = path.join(pluginRoot, 'hooks', 'hooks.json');
  const content = readFile(hooksPath);
  const byEventType = {};

  if (content) {
    try {
      const data = JSON.parse(content);
      const hooks = data.hooks || {};
      for (const [eventType, rules] of Object.entries(hooks)) {
        byEventType[eventType] = Array.isArray(rules) ? rules.length : 0;
      }
    } catch {
      // Use defaults
    }
  }

  const totalEventTypes = Object.keys(byEventType).length;
  const totalRules = Object.values(byEventType).reduce((sum, n) => sum + n, 0);

  return { totalRules, totalEventTypes, byEventType };
}

/**
 * Collect rules from rules/*.md at plugin and user levels
 * @param {string} pluginRoot
 * @returns {{ pluginCount: number, pluginRules: string[], userCount: number, userRules: string[] }}
 */
function collectRules(pluginRoot) {
  const pluginRulesDir = path.join(pluginRoot, 'rules');
  const pluginRules = safeReadDir(pluginRulesDir).filter(f => f.endsWith('.md'));

  const userRulesDir = path.join(getHomeDir(), '.claude', 'rules');
  const userRules = safeReadDir(userRulesDir).filter(f => f.endsWith('.md'));

  return {
    pluginCount: pluginRules.length,
    pluginRules: pluginRules.map(f => f.replace('.md', '')),
    userCount: userRules.length,
    userRules: userRules.map(f => f.replace('.md', '')),
  };
}

/**
 * Collect commands from commands/*.md and commands/*.cjs
 * @param {string} pluginRoot
 * @returns {{ total: number, commands: string[] }}
 */
function collectCommands(pluginRoot) {
  const commandsDir = path.join(pluginRoot, 'commands');
  const files = safeReadDir(commandsDir).filter(f => f.endsWith('.md') || f.endsWith('.cjs'));

  const commands = files.map(f => {
    if (f.endsWith('.md')) {
      const content = readFile(path.join(commandsDir, f));
      if (content) {
        const { attributes } = parseFrontmatter(content);
        if (attributes.name) return attributes.name;
      }
    }
    // Fallback: derive from filename
    return f.replace(/\.(md|cjs)$/, '');
  });

  return { total: commands.length, commands: commands.sort() };
}

/**
 * Collect ecosystem detection
 * @returns {{ detected: string|null, tools: Record<string, boolean> }}
 */
function collectEcosystem() {
  try {
    const { detectEcosystem } = require('../ecosystems/index.cjs');
    const { checkEcosystemTools } = require('../workspace/tool-detection.cjs');

    const detected = detectEcosystem(process.cwd());
    const type = detected ? detected.type : null;

    let tools = {};
    if (type) {
      tools = checkEcosystemTools(type);
    }

    return { detected: type, tools };
  } catch {
    return { detected: null, tools: {} };
  }
}

/**
 * Collect package manager info
 * @returns {{ name: string, source: string }}
 */
function collectPackageManager() {
  try {
    const { getPackageManager } = require('../package-manager.cjs');
    const pm = getPackageManager();
    return { name: pm.name || 'none', source: pm.source || 'unknown' };
  } catch {
    return { name: 'none', source: 'unknown' };
  }
}

/**
 * Collect workspace info
 * @returns {{ isWorkspace: boolean, type: string|null, packageCount: number }}
 */
function collectWorkspace() {
  try {
    const { isInWorkspace } = require('../package-manager.cjs');
    if (!isInWorkspace()) {
      return { isWorkspace: false, type: null, packageCount: 0 };
    }

    const { getWorkspaceContext } = require('../workspace-context.cjs');
    const ctx = getWorkspaceContext();
    return {
      isWorkspace: true,
      type: ctx.getType() || 'unknown',
      packageCount: ctx.getAllPackages().length,
    };
  } catch {
    return { isWorkspace: false, type: null, packageCount: 0 };
  }
}

/**
 * Check if claude-mem MCP plugin is installed
 * Reimplemented from session-start.cjs (not exported from a shared module)
 */
function isClaudeMemInstalled() {
  if (process.env.CLAUDE_MEM_INSTALLED === 'true') return true;

  try {
    const settingsPath = path.join(getHomeDir(), '.claude', 'settings.json');
    if (!fs.existsSync(settingsPath)) return false;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const enabledPlugins = settings.enabledPlugins || {};
    return Object.keys(enabledPlugins).some(
      key => key.startsWith('claude-mem') && enabledPlugins[key] === true
    );
  } catch {
    return false;
  }
}

/**
 * Check if frontend-design plugin is installed
 */
function isFrontendDesignInstalled() {
  try {
    const pluginsPath = path.join(getHomeDir(), '.claude', 'plugins', 'installed_plugins.json');
    if (!fs.existsSync(pluginsPath)) return false;

    const data = JSON.parse(fs.readFileSync(pluginsPath, 'utf-8'));
    return Object.keys(data).some(key => key.includes('frontend-design'));
  } catch {
    return false;
  }
}

/**
 * Collect optional integration statuses
 * @returns {{ serena: boolean, jetbrains: boolean, claudeMem: boolean, frontendDesign: boolean }}
 */
function collectIntegrations() {
  return {
    serena: isSerenaInstalled(),
    jetbrains: isJetBrainsAvailable(),
    claudeMem: isClaudeMemInstalled(),
    frontendDesign: isFrontendDesignInstalled(),
  };
}

/**
 * Collect MCP servers from settings hierarchy
 * @returns {{ global: { count: number, names: string[] }, project: { count: number, names: string[] }, disabled: string[] }}
 */
function collectMcpServers() {
  const result = {
    global: { count: 0, names: [] },
    project: { count: 0, names: [] },
    disabled: [],
  };

  // Global settings
  const globalPath = path.join(getHomeDir(), '.claude', 'settings.json');
  const globalSettings = safeParseJson(readFile(globalPath));
  if (globalSettings && globalSettings.mcpServers) {
    result.global.names = Object.keys(globalSettings.mcpServers);
    result.global.count = result.global.names.length;
  }
  if (globalSettings && Array.isArray(globalSettings.disabledMcpServers)) {
    result.disabled.push(...globalSettings.disabledMcpServers);
  }

  // Project settings
  const projectPath = path.join(process.cwd(), '.claude', 'project.json');
  const projectSettings = safeParseJson(readFile(projectPath));
  if (projectSettings && projectSettings.mcpServers) {
    result.project.names = Object.keys(projectSettings.mcpServers);
    result.project.count = result.project.names.length;
  }
  if (projectSettings && Array.isArray(projectSettings.disabledMcpServers)) {
    result.disabled.push(...projectSettings.disabledMcpServers);
  }

  // Deduplicate disabled list
  result.disabled = [...new Set(result.disabled)];

  return result;
}

// --- Helpers ---

function safeReadDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function safeParseJson(content) {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

module.exports = {
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
  // Exposed for testing
  isClaudeMemInstalled,
  isFrontendDesignInstalled,
  safeReadDir,
  safeParseJson,
  SKILL_CATEGORIES,
};

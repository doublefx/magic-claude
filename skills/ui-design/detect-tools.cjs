#!/usr/bin/env node
/**
 * UI Design Tool Detection Utility
 *
 * Scans MCP configuration, installed plugins, and tool reference files
 * to detect available design tools for the UI Design phase.
 *
 * Cross-platform (Windows, macOS, Linux).
 *
 * Usage:
 *   node detect-tools.cjs [--json] [--verbose] [--help]
 *
 * Examples:
 *   node detect-tools.cjs              # Human-readable summary
 *   node detect-tools.cjs --json       # Machine-readable JSON output
 *   node detect-tools.cjs --verbose    # Detailed config information
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Try to load utils from the plugin, fall back to inline implementations
let log, output;
try {
  const utils = require(path.join(__dirname, '..', '..', 'scripts', 'lib', 'utils.cjs'));
  log = utils.log;
  output = utils.output;
} catch {
  log = (msg) => process.stderr.write(`[detect-tools] ${msg}\n`);
  output = (msg) => process.stdout.write(`${msg}\n`);
}

// --- Constants ---

const DESIGN_MCP_PATTERNS = {
  figma: { patterns: ['figma'], category: 'design', tier: 'Freemium' },
  pencil: { patterns: ['pencil'], category: 'design', tier: 'Free (early access)' },
  penpot: { patterns: ['penpot'], category: 'design', tier: 'Free / Open Source' }
};

const COMPONENT_MCP_PATTERNS = {
  'shadcn-ui': { patterns: ['shadcn', '@shadcn/ui'], category: 'component-library', tier: 'Free' },
  storybook: { patterns: ['storybook', '@storybook/addon-mcp'], category: 'component-library', tier: 'Free' },
  'magic-ui': { patterns: ['magic-ui', '21st-dev', '@21st-dev/magic'], category: 'component-library', tier: 'Free' }
};

const ALL_MCP_PATTERNS = { ...DESIGN_MCP_PATTERNS, ...COMPONENT_MCP_PATTERNS };

const FRONTEND_DESIGN_PLUGIN_KEY = 'frontend-design@claude-plugins-official';

// --- Argument Parsing ---

function parseArgs(argv) {
  const args = {
    json: false,
    verbose: false,
    help: false
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--verbose') {
      args.verbose = true;
    }
  }

  return args;
}

// --- File Reading Utilities ---

/**
 * Safely read and parse a JSON file. Returns null on any error.
 */
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    log(`Warning: Could not read ${filePath}: ${err.message}`);
    return null;
  }
}

// --- MCP Server Detection ---

/**
 * Extract MCP server names from a config file's mcpServers key.
 * Returns an array of { name, config } objects.
 */
function extractMcpServers(configPath) {
  const data = readJsonFile(configPath);
  if (!data || !data.mcpServers) return [];

  return Object.entries(data.mcpServers).map(([name, config]) => ({
    name,
    config,
    source: configPath
  }));
}

/**
 * Extract disabled MCP server names from a config file.
 * Returns a Set of server names.
 */
function extractDisabledServers(configPath) {
  const data = readJsonFile(configPath);
  if (!data) return new Set();

  // disabledMcpServers can be an array of strings or an object with boolean values
  const disabled = data.disabledMcpServers;
  if (!disabled) return new Set();

  if (Array.isArray(disabled)) {
    return new Set(disabled);
  }

  if (typeof disabled === 'object') {
    return new Set(
      Object.entries(disabled)
        .filter(([, val]) => val === true)
        .map(([key]) => key)
    );
  }

  return new Set();
}

/**
 * Match a server name/config against known design tool patterns.
 */
function matchServerToTool(serverName, serverConfig) {
  const searchStr = [
    serverName,
    serverConfig?.command || '',
    serverConfig?.url || '',
    ...(serverConfig?.args || [])
  ].join(' ').toLowerCase();

  for (const [toolName, toolInfo] of Object.entries(ALL_MCP_PATTERNS)) {
    for (const pattern of toolInfo.patterns) {
      if (searchStr.includes(pattern.toLowerCase())) {
        return { toolName, ...toolInfo };
      }
    }
  }

  return null;
}

// --- Plugin Detection ---

/**
 * Check if the frontend-design plugin is installed.
 * Follows the isClaudeMemInstalled() pattern from session-start.cjs.
 */
function isFrontendDesignInstalled() {
  try {
    const homeDir = os.homedir();
    const installedPluginsPath = path.join(homeDir, '.claude', 'plugins', 'installed_plugins.json');
    const data = readJsonFile(installedPluginsPath);
    if (!data || !data.plugins) return false;

    return Object.keys(data.plugins).some(
      key => key.startsWith('frontend-design')
    );
  } catch {
    return false;
  }
}

// --- Tool Reference File Discovery ---

/**
 * Discover tool reference files at three levels (plugin, user, project).
 * Returns a map of tool name -> { path, level }.
 * Project level overrides user level overrides plugin level.
 */
function discoverToolReferenceFiles() {
  const homeDir = os.homedir();
  const cwd = process.cwd();

  const dirs = [
    { path: path.join(__dirname, 'tools'), level: 'plugin' },
    { path: path.join(homeDir, '.claude', 'skills', 'ui-design', 'tools'), level: 'user' },
    { path: path.join(cwd, '.claude', 'skills', 'ui-design', 'tools'), level: 'project' }
  ];

  const tools = new Map();

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir.path)) continue;

      const files = fs.readdirSync(dir.path).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const toolName = file.replace('.md', '');
        tools.set(toolName, {
          path: path.join(dir.path, file),
          level: dir.level
        });
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  return tools;
}

// --- Main Detection ---

function detectTools() {
  const homeDir = os.homedir();
  const cwd = process.cwd();

  // 1. Gather MCP servers from all config levels
  const configPaths = [
    path.join(homeDir, '.claude', 'settings.json'),
    path.join(cwd, '.claude', 'project.json'),
    path.join(cwd, '.claude', 'settings.json')
  ];

  const allServers = [];
  for (const configPath of configPaths) {
    allServers.push(...extractMcpServers(configPath));
  }

  // 2. Gather disabled servers from all config levels
  const disabledServers = new Set();
  for (const configPath of configPaths) {
    for (const name of extractDisabledServers(configPath)) {
      disabledServers.add(name);
    }
  }

  // 3. Match servers to known design tools
  const detectedMcpTools = [];
  const disabledMcpTools = [];

  for (const server of allServers) {
    const match = matchServerToTool(server.name, server.config);
    if (match) {
      const entry = {
        name: match.toolName,
        serverName: server.name,
        category: match.category,
        tier: match.tier,
        source: server.source
      };

      if (disabledServers.has(server.name)) {
        disabledMcpTools.push(entry);
      } else {
        detectedMcpTools.push(entry);
      }
    }
  }

  // 4. Check frontend-design plugin
  const frontendDesignInstalled = isFrontendDesignInstalled();

  // 5. Discover tool reference files
  const toolReferenceFiles = discoverToolReferenceFiles();

  // 6. Identify not-installed tools (have reference file but no MCP detected)
  const detectedToolNames = new Set(detectedMcpTools.map(t => t.name));
  const notInstalledTools = [];

  for (const [toolName, refInfo] of toolReferenceFiles) {
    if (toolName === 'screenshot') continue; // Always available, not an MCP tool
    if (!detectedToolNames.has(toolName) && ALL_MCP_PATTERNS[toolName]) {
      notInstalledTools.push({
        name: toolName,
        category: ALL_MCP_PATTERNS[toolName].category,
        tier: ALL_MCP_PATTERNS[toolName].tier,
        referenceFile: refInfo.path
      });
    }
  }

  return {
    mcpTools: detectedMcpTools,
    disabledTools: disabledMcpTools,
    notInstalledTools,
    frontendDesignPlugin: frontendDesignInstalled,
    toolReferenceFiles: Object.fromEntries(toolReferenceFiles),
    nativeTools: [{ name: 'screenshot', category: 'native', tier: 'Free (always available)' }]
  };
}

// --- Output Formatting ---

function formatHuman(result, verbose) {
  const lines = [];

  lines.push('UI Design Tool Detection Report');
  lines.push('================================\n');

  // Available MCP tools
  if (result.mcpTools.length > 0) {
    lines.push('Available Design MCP Tools:');
    for (const tool of result.mcpTools) {
      lines.push(`  + ${tool.name} (${tool.category}, ${tool.tier})`);
      if (verbose) {
        lines.push(`    Server: ${tool.serverName}`);
        lines.push(`    Config: ${tool.source}`);
      }
    }
    lines.push('');
  } else {
    lines.push('Available Design MCP Tools: none detected\n');
  }

  // Disabled tools
  if (result.disabledTools.length > 0) {
    lines.push('Disabled Tools (configured but disabled):');
    for (const tool of result.disabledTools) {
      lines.push(`  - ${tool.name} (${tool.serverName})`);
    }
    lines.push('');
  }

  // Not installed tools
  if (result.notInstalledTools.length > 0) {
    lines.push('Not Installed (reference docs available):');
    for (const tool of result.notInstalledTools) {
      lines.push(`  ? ${tool.name} (${tool.category}, ${tool.tier})`);
      if (verbose) {
        lines.push(`    Reference: ${tool.referenceFile}`);
      }
    }
    lines.push('');
  }

  // Frontend design plugin
  lines.push(`frontend-design Plugin: ${result.frontendDesignPlugin ? 'installed' : 'not detected'}`);
  if (!result.frontendDesignPlugin) {
    lines.push('  Install: /plugin marketplace add anthropics/claude-plugins-official');
    lines.push('  Then:    /plugin install frontend-design@claude-plugins-official');
  }
  lines.push('');

  // Native tools
  lines.push('Native Tools (always available):');
  for (const tool of result.nativeTools) {
    lines.push(`  * ${tool.name} (${tool.tier})`);
  }
  lines.push('');

  // Tool reference files
  if (verbose) {
    lines.push('Tool Reference Files:');
    for (const [name, info] of Object.entries(result.toolReferenceFiles)) {
      lines.push(`  ${name}: ${info.path} (${info.level})`);
    }
    lines.push('');
  }

  // Summary
  const totalAvailable = result.mcpTools.length + result.nativeTools.length +
    (result.frontendDesignPlugin ? 1 : 0);
  lines.push(`Summary: ${totalAvailable} tool(s) available, ${result.notInstalledTools.length} not installed, ${result.disabledTools.length} disabled`);

  return lines.join('\n');
}

function showHelp() {
  output(`Usage: node detect-tools.cjs [options]

UI Design Tool Detection - discovers available design MCP tools,
component library MCPs, and the frontend-design plugin.

Options:
  --json      Output machine-readable JSON
  --verbose   Show detailed configuration info
  --help, -h  Show this help message

Tool Discovery:
  Scans MCP config from three levels:
    1. ~/.claude/settings.json (global)
    2. .claude/project.json (project)
    3. .claude/settings.json (project settings)

  Checks for disabled servers in disabledMcpServers arrays.
  Reads ~/.claude/plugins/installed_plugins.json for frontend-design plugin.
  Discovers tool reference files at three levels:
    1. <plugin>/skills/ui-design/tools/ (plugin)
    2. ~/.claude/skills/ui-design/tools/ (user)
    3. .claude/skills/ui-design/tools/ (project, highest priority)

Examples:
  node detect-tools.cjs              # Human-readable summary
  node detect-tools.cjs --json       # For programmatic consumption
  node detect-tools.cjs --verbose    # Debug configuration issues`);
}

// --- Entry Point ---

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  const result = detectTools();

  if (args.json) {
    output(JSON.stringify(result, null, 2));
  } else {
    output(formatHuman(result, args.verbose));
  }
}

main();

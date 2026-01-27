#!/usr/bin/env node
/**
 * Ecosystem Setup Script
 *
 * Detects project ecosystem(s) and helps install missing development tools.
 *
 * Usage:
 *   node scripts/setup-ecosystem.cjs --detect
 *   node scripts/setup-ecosystem.cjs --check nodejs
 *   node scripts/setup-ecosystem.cjs --help python
 *   node scripts/setup-ecosystem.cjs --interactive
 */

const { getWorkspaceContext } = require('./lib/workspace-context.cjs');
const { detectPackageEcosystem } = require('./lib/workspace/ecosystems.cjs');
const {
  ToolDetector,
  checkEcosystemTools,
  getInstallationHelp
} = require('./lib/workspace/tool-detection.cjs');

// Ecosystem tool definitions
const ECOSYSTEM_TOOLS = {
  nodejs: {
    critical: ['node'],
    packageManagers: ['npm', 'pnpm', 'yarn', 'bun'],
    recommended: ['pnpm']
  },
  python: {
    critical: ['python', 'python3'],
    packageManagers: ['pip', 'pip3', 'poetry', 'uv'],
    recommended: ['pip3']
  },
  jvm: {
    critical: ['java', 'javac'],
    buildTools: ['mvn', 'gradle'],
    recommended: ['gradle']
  },
  rust: {
    critical: ['rustc', 'cargo'],
    packageManagers: ['cargo'],
    recommended: ['cargo']
  }
};

function showHelp() {
  console.log(`
Ecosystem Setup for Claude Code

Usage:
  node scripts/setup-ecosystem.cjs [options]

Options:
  --detect           Detect current ecosystem and check tools
  --check <eco>      Check tools for specific ecosystem (nodejs, python, jvm, rust)
  --help <tool>      Show installation help for specific tool
  --interactive      Interactive setup wizard
  --all              Show all ecosystems (for monorepos)

Examples:
  # Detect and check current project
  node scripts/setup-ecosystem.cjs --detect

  # Check Node.js tools
  node scripts/setup-ecosystem.cjs --check nodejs

  # Get Python installation help
  node scripts/setup-ecosystem.cjs --help python

  # Interactive setup
  node scripts/setup-ecosystem.cjs --interactive
`);
}

function detectAndShow() {
  const workspace = getWorkspaceContext();
  const detector = new ToolDetector();

  console.log('\n=== Ecosystem Detection ===\n');

  if (workspace.isWorkspace()) {
    console.log(`Workspace detected: ${workspace.getType()}`);
    console.log(`Packages: ${workspace.getAllPackages().length}`);
    console.log('');

    // Get all ecosystems in workspace
    const packages = workspace.getAllPackages();
    const ecosystemMap = {};

    for (const pkg of packages) {
      const eco = pkg.ecosystem || 'unknown';
      if (!ecosystemMap[eco]) {
        ecosystemMap[eco] = [];
      }
      ecosystemMap[eco].push(pkg.name);
    }

    // Check tools for each ecosystem
    for (const [ecosystem, pkgs] of Object.entries(ecosystemMap)) {
      if (ecosystem === 'unknown') continue;

      console.log(`${ecosystem.toUpperCase()} packages (${pkgs.length}):`);
      checkEcosystemAndReport(ecosystem, detector);
      console.log('');
    }
  } else {
    // Single project
    const ecosystem = detectPackageEcosystem(process.cwd());
    console.log(`Detected ecosystem: ${ecosystem}`);
    console.log('');

    if (ecosystem === 'unknown') {
      console.log('⚠ Could not detect ecosystem from current directory');
      console.log('No package.json, pom.xml, requirements.txt, or Cargo.toml found');
      console.log('');
      return;
    }

    checkEcosystemAndReport(ecosystem, detector);
  }
}

function checkEcosystemAndReport(ecosystem, detector) {
  const tools = ECOSYSTEM_TOOLS[ecosystem];
  if (!tools) {
    console.log(`⚠ Unknown ecosystem: ${ecosystem}`);
    return;
  }

  const results = checkEcosystemTools(ecosystem);
  const missing = [];

  // Check critical tools
  if (tools.critical) {
    console.log('Critical tools:');
    for (const tool of tools.critical) {
      const available = results[tool];
      const version = available ? detector.getVersion(tool) : null;
      if (available && version) {
        console.log(`  ✓ ${tool} (${version})`);
      } else if (available) {
        console.log(`  ✓ ${tool}`);
      } else {
        console.log(`  ✗ ${tool} (not installed)`);
        missing.push({ tool, critical: true });
      }
    }
  }

  // Check package managers / build tools
  const pmTools = tools.packageManagers || tools.buildTools || [];
  if (pmTools.length > 0) {
    console.log('Package managers / Build tools:');
    for (const tool of pmTools) {
      const available = results[tool];
      const isRecommended = tools.recommended && tools.recommended.includes(tool);
      const version = available ? detector.getVersion(tool) : null;

      if (available && version) {
        const marker = isRecommended ? '✓' : '•';
        console.log(`  ${marker} ${tool} (${version})`);
      } else if (available) {
        const marker = isRecommended ? '✓' : '•';
        console.log(`  ${marker} ${tool}`);
      } else {
        const marker = isRecommended ? '✗' : '○';
        const suffix = isRecommended ? ' (recommended)' : ' (optional)';
        console.log(`  ${marker} ${tool}${suffix}`);
        if (isRecommended) {
          missing.push({ tool, critical: false });
        }
      }
    }
  }

  // Show installation help for missing tools
  if (missing.length > 0) {
    console.log('');
    console.log('Missing tools:');
    for (const { tool, critical } of missing) {
      const severity = critical ? 'CRITICAL' : 'RECOMMENDED';
      console.log(`  ${severity}: ${tool}`);
    }
    console.log('');
    console.log(`Run with --help ${missing[0].tool} for installation instructions`);
    console.log('Or run with --interactive for guided setup');
  }
}

function checkSpecificEcosystem(ecosystem) {
  const detector = new ToolDetector();

  console.log(`\n=== Checking ${ecosystem.toUpperCase()} Tools ===\n`);

  if (!ECOSYSTEM_TOOLS[ecosystem]) {
    console.log(`Error: Unknown ecosystem "${ecosystem}"`);
    console.log('Supported: nodejs, python, jvm, rust');
    process.exit(1);
  }

  checkEcosystemAndReport(ecosystem, detector);
  console.log('');
}

function showToolHelp(tool) {
  console.log(`\n=== ${tool.toUpperCase()} Installation Guide ===\n`);

  const platform = process.platform;
  const platformName = platform === 'win32' ? 'Windows' :
                       platform === 'darwin' ? 'macOS' :
                       'Linux';

  console.log(`Platform: ${platformName}`);
  console.log('');

  const help = getInstallationHelp(tool, platform);
  console.log(help);
  console.log('');
}

async function interactiveSetup() {
  console.log('\n=== Ecosystem Setup Wizard ===\n');

  const workspace = getWorkspaceContext();
  const detector = new ToolDetector();

  // Detect ecosystem
  let ecosystem;
  if (workspace.isWorkspace()) {
    console.log('Workspace detected with multiple packages');
    console.log('This wizard will check tools for all detected ecosystems');
    console.log('');

    const packages = workspace.getAllPackages();
    const ecosystems = [...new Set(packages.map(p => p.ecosystem).filter(Boolean))];

    for (const eco of ecosystems) {
      console.log(`Checking ${eco}...`);
      await checkAndPromptInstall(eco, detector);
      console.log('');
    }
  } else {
    ecosystem = detectPackageEcosystem(process.cwd());
    console.log(`Detected ecosystem: ${ecosystem}\n`);

    if (ecosystem === 'unknown') {
      console.log('⚠ Could not detect ecosystem from current directory');
      console.log('Please navigate to a project directory or specify ecosystem with --check');
      return;
    }

    await checkAndPromptInstall(ecosystem, detector);
  }

  console.log('✓ Setup complete!');
  console.log('');
}

async function checkAndPromptInstall(ecosystem, detector) {
  const tools = ECOSYSTEM_TOOLS[ecosystem];
  if (!tools) return;

  const results = checkEcosystemTools(ecosystem);
  const missing = [];

  // Find missing critical tools
  if (tools.critical) {
    for (const tool of tools.critical) {
      if (!results[tool]) {
        missing.push({ tool, critical: true });
      }
    }
  }

  // Find missing recommended tools
  if (tools.recommended) {
    for (const tool of tools.recommended) {
      if (!results[tool]) {
        missing.push({ tool, critical: false });
      }
    }
  }

  if (missing.length === 0) {
    console.log(`✓ All required tools for ${ecosystem} are installed`);
    return;
  }

  console.log(`Missing ${missing.length} tool(s) for ${ecosystem}:`);
  for (const { tool, critical } of missing) {
    const severity = critical ? 'CRITICAL' : 'RECOMMENDED';
    console.log(`  ${severity}: ${tool}`);
  }
  console.log('');

  // Show installation help
  console.log('Installation instructions:');
  console.log('');
  for (const { tool } of missing) {
    const help = getInstallationHelp(tool, process.platform);
    console.log(`${tool}:`);
    console.log(help);
    console.log('');
  }
}

// Main
const args = process.argv.slice(2);

// Check for --help <tool> first (before bare --help)
const helpIdx = args.indexOf('--help');
if (helpIdx !== -1 && args[helpIdx + 1]) {
  const tool = args[helpIdx + 1];
  showToolHelp(tool);
  process.exit(0);
}

// Check for bare --help or no args
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--detect')) {
  detectAndShow();
  process.exit(0);
}

const checkIdx = args.indexOf('--check');
if (checkIdx !== -1) {
  const ecosystem = args[checkIdx + 1];
  if (!ecosystem) {
    console.error('Error: --check requires an ecosystem name');
    console.error('Supported: nodejs, python, jvm, rust');
    process.exit(1);
  }
  checkSpecificEcosystem(ecosystem);
  process.exit(0);
}

if (args.includes('--interactive')) {
  interactiveSetup().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
} else {
  console.error('Unknown option. Run with --help for usage information.');
  process.exit(1);
}

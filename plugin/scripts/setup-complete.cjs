#!/usr/bin/env node
/**
 * Complete Project Setup Script
 *
 * Simplified approach - Serena is the source of truth:
 * - No JSON config files created
 * - Setup completion = .serena/project.yml exists
 * - Package manager detected from lock files
 * - Project types detected on the fly
 *
 * Orchestrates:
 * 1. Workspace detection and initialization
 * 2. Package manager detection
 * 3. Ecosystem detection
 * 4. Rules installation (copies plugin rules to ~/.claude/rules/)
 * 5. Serena integration (main setup work)
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');

// Serena utilities
const {
  isSerenaInstalled,
  isSerenaEnabled,
  isProjectActivated,
  isJetBrainsAvailable,
  detectLanguages
} = require('./lib/serena.cjs');
const { isClaudeMemInstalled, isFrontendDesignInstalled, isClaudeCodeDocsInstalled } = require('./lib/status/collectors.cjs');
const { getAllProjectSubTypes } = require('./lib/ecosystems/index.cjs');

// Project type indicators — built dynamically from the ecosystem registry
const PROJECT_INDICATORS = getAllProjectSubTypes();

/**
 * Detect project types (no caching - just detection)
 */
function detectProjectTypes(cwd) {
  const types = [];

  for (const [type, indicators] of Object.entries(PROJECT_INDICATORS)) {
    for (const indicator of indicators) {
      if (fs.existsSync(path.join(cwd, indicator))) {
        if (!types.includes(type)) {
          types.push(type);
        }
        break;
      }
    }
  }

  return types;
}

/**
 * Check if Serena setup is complete (source of truth)
 */
function isSerenaSetupComplete() {
  const cwd = process.cwd();
  const serenaProjectFile = path.join(cwd, '.serena', 'project.yml');
  return fs.existsSync(serenaProjectFile);
}

function showHelp() {
  console.log(`
Complete Project Setup for Claude Code

Usage:
  node scripts/setup-complete.cjs [options] [directory]

Options:
  --yes, -y         Auto-accept all prompts with defaults
  --no-install      Skip dependency installation
  --check           Check only (don't modify anything)
  --verbose         Show detailed output
  --help, -h        Show this help message

Note: This script uses Serena as the source of truth for setup status.
      No JSON config files are created - all configuration is in Serena memories.

Examples:
  # Interactive setup in current directory
  node scripts/setup-complete.cjs

  # Automated setup (no prompts)
  node scripts/setup-complete.cjs --yes

  # Check only (dry run)
  node scripts/setup-complete.cjs --check
`);
}

function runScript(scriptName, args = [], options = {}) {
  const scriptPath = path.join(PLUGIN_ROOT, 'scripts', scriptName);
  const cmd = `node "${scriptPath}" ${args.join(' ')}`;

  if (options.verbose) {
    console.log(`\n→ Running: ${cmd}\n`);
  }

  try {
    execSync(cmd, {
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || process.cwd(),
      encoding: 'utf8'
    });
    return true;
  } catch (err) {
    if (!options.ignoreErrors) {
      console.error(`Error running ${scriptName}:`, err.message);
      return false;
    }
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Parse options
  const autoYes = args.includes('--yes') || args.includes('-y');
  const checkOnly = args.includes('--check');
  const verbose = args.includes('--verbose');
  const showHelpFlag = args.includes('--help') || args.includes('-h');

  if (showHelpFlag) {
    showHelp();
    process.exit(0);
  }

  // Get target directory
  const targetDir = args.find(arg => !arg.startsWith('--') && !arg.startsWith('-'));
  if (targetDir) {
    process.chdir(targetDir);
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           Complete Project Setup for Claude Code          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Directory: ${process.cwd()}\n`);

  if (checkOnly) {
    console.log('🔍 CHECK MODE - No modifications will be made\n');
  }

  // Step 1: Workspace Detection
  console.log('━━━ Step 1: Workspace Detection ━━━\n');

  const setupEcosystemArgs = ['--detect'];
  if (autoYes) setupEcosystemArgs.push('--yes');
  runScript('setup-ecosystem.cjs', setupEcosystemArgs, { verbose });

  // Step 2: Package Manager Detection (from lock files, no config file)
  console.log('\n━━━ Step 2: Package Manager Detection ━━━\n');

  runScript('setup-package-manager.cjs', ['--detect'], { verbose });

  // Step 3: Project Type Detection (no caching)
  console.log('\n━━━ Step 3: Project Type Detection ━━━\n');

  const projectTypes = detectProjectTypes(process.cwd());
  if (projectTypes.length > 0) {
    console.log(`✓ Detected project types: ${projectTypes.join(', ')}`);
  } else {
    console.log('○ No recognized project types detected');
  }

  // Step 4: Rules Installation
  console.log('\n━━━ Step 4: Rules Installation ━━━\n');

  runScript('setup-rules.cjs', ['--install'], { verbose });

  // Step 5: Optional Integrations Check
  console.log('\n━━━ Step 5: Optional Integrations ━━━\n');

  const integrations = [
    { name: 'claude-code-docs', installed: isClaudeCodeDocsInstalled(), install: '/plugin marketplace add doublefx/claude-code-docs && /plugin install claude-code-docs', desc: 'Offline Claude Code documentation' },
    { name: 'claude-mem', installed: isClaudeMemInstalled(), install: '/plugin marketplace add doublefx/claude-mem && /plugin install claude-mem', desc: 'Cross-session memory and decision history' },
    { name: 'frontend-design', installed: isFrontendDesignInstalled(), install: '/plugin marketplace add doublefx/frontend-design && /plugin install frontend-design', desc: 'Production-grade UI component generation' },
  ];

  const installed = integrations.filter(i => i.installed);
  const missing = integrations.filter(i => !i.installed);

  for (const i of installed) {
    console.log(`  ✓ ${i.name}`);
  }
  for (const i of missing) {
    console.log(`  ○ ${i.name} — ${i.desc}`);
    console.log(`    Install: ${i.install}`);
  }

  if (missing.length === 0) {
    console.log('  ✓ All optional integrations installed');
  }

  // Step 6: Serena Integration
  console.log('\n━━━ Step 6: Serena Integration ━━━\n');

  const serenaInstalled = isSerenaInstalled();
  const serenaSetupComplete = isSerenaSetupComplete();

  if (serenaInstalled) {
    console.log('✓ Serena MCP plugin detected');

    // Detect languages
    const languages = detectLanguages(process.cwd());
    if (languages.length > 0) {
      console.log(`  Languages detected: ${languages.join(', ')}`);
    }

    // Check JetBrains
    const jetbrainsAvailable = isJetBrainsAvailable();
    if (jetbrainsAvailable) {
      console.log('  ✓ JetBrains tools available');
    } else if (languages.length > 1) {
      console.log('  💡 TIP: Multiple languages detected - consider JetBrains plugin');
    }

    // Check Serena setup status (via .serena/project.yml)
    if (serenaSetupComplete) {
      console.log('  ✓ Serena setup complete (.serena/project.yml exists)');
    } else if (!checkOnly) {
      console.log('  → Serena setup needed');
      console.log('\n  ⚠️  CLAUDE: Invoke /serena-setup skill to complete Serena integration.');
      console.log('     This will:');
      console.log('     - Activate project in Serena');
      console.log('     - Configure project settings');
      console.log('     - Install git hooks for sync reminders');
    }

    // Persist to env file for other hooks
    if (!checkOnly && process.env.CLAUDE_ENV_FILE) {
      try {
        const envLines = [
          `export SERENA_INSTALLED="true"`,
          `export SERENA_SETUP_COMPLETE="${serenaSetupComplete}"`,
          `export SERENA_JETBRAINS_AVAILABLE="${jetbrainsAvailable}"`,
          `export SERENA_LANGUAGES="${languages.join(',')}"`
        ];
        fs.appendFileSync(process.env.CLAUDE_ENV_FILE, envLines.join('\n') + '\n');
      } catch {
        // Non-fatal
      }
    }
  } else {
    console.log('ℹ️  Serena MCP plugin not detected');
    console.log('   Serena provides semantic code analysis and persistent memory.');
    console.log('   To install: /plugin install serena');
  }

  // Step 7: Final Summary
  console.log('\n━━━ Setup Summary ━━━\n');

  const hasPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json'));
  const hasPnpmWorkspace = fs.existsSync(path.join(process.cwd(), 'pnpm-workspace.yaml'));

  if (hasPackageJson) {
    console.log('✓ package.json found');
  }

  if (hasPnpmWorkspace) {
    console.log('✓ Workspace configuration found');
  }

  if (projectTypes.length > 0) {
    console.log(`✓ Project types: ${projectTypes.join(', ')}`);
  }

  if (serenaInstalled && serenaSetupComplete) {
    console.log('✓ Serena integration complete');
  } else if (serenaInstalled) {
    console.log('○ Serena setup pending - invoke /serena-setup');
  } else {
    console.log('○ Serena not installed');
  }

  if (!checkOnly) {
    console.log('\n✓ Detection complete!');
    console.log('\nNext steps:');

    if (!serenaInstalled) {
      console.log('  • Install Serena for persistent memory: /plugin install serena');
      console.log('  • Then run: /serena-setup');
    } else if (!serenaSetupComplete) {
      console.log('  • Complete Serena setup: /serena-setup (REQUIRED)');
      console.log('    This creates Serena memories from your documentation');
    } else {
      console.log('  • Check Serena status: /serena-status');
    }
    console.log('  • Start coding!\n');
  } else {
    console.log('\n✓ Check complete (no changes made)\n');
  }
}

// Run
main().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});

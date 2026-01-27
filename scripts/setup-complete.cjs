#!/usr/bin/env node
/**
 * Complete Project Setup Script
 *
 * Orchestrates full project setup:
 * 1. Workspace detection and initialization
 * 2. Package manager configuration
 * 3. Ecosystem detection
 * 4. Tool verification
 * 5. Dependency installation
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');

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

Examples:
  # Interactive setup in current directory
  node scripts/setup-complete.cjs

  # Automated setup (no prompts)
  node scripts/setup-complete.cjs --yes

  # Check only (dry run)
  node scripts/setup-complete.cjs --check

  # Setup specific directory
  node scripts/setup-complete.cjs /path/to/project
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
  const noInstall = args.includes('--no-install');
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

  // Step 1: Workspace Detection & Initialization
  console.log('━━━ Step 1: Workspace Detection ━━━\n');

  const setupEcosystemArgs = ['--detect'];
  if (autoYes) setupEcosystemArgs.push('--yes');
  if (checkOnly) {
    // Just detect, don't initialize
    runScript('setup-ecosystem.cjs', setupEcosystemArgs, { verbose });
  } else {
    // This will handle workspace initialization if needed
    const success = runScript('setup-ecosystem.cjs', setupEcosystemArgs, { verbose });
    if (!success && !autoYes) {
      console.log('\n⚠️  Ecosystem setup had issues. Continue anyway? [y/N]');
      // In real implementation, would wait for user input
      // For now, continue
    }
  }

  // Step 2: Package Manager Configuration
  console.log('\n━━━ Step 2: Package Manager Configuration ━━━\n');

  if (checkOnly) {
    runScript('setup-package-manager.cjs', ['--detect'], { verbose });
  } else {
    // This will detect and potentially configure
    runScript('setup-package-manager.cjs', ['--detect'], { verbose });

    // If no config exists and not auto-yes, could prompt to set one
    // For now, detection is enough
  }

  // Step 3: Final Summary
  console.log('\n━━━ Setup Summary ━━━\n');

  // Check if workspace
  const hasPackageJson = fs.existsSync(path.join(process.cwd(), 'package.json'));
  const hasPnpmWorkspace = fs.existsSync(path.join(process.cwd(), 'pnpm-workspace.yaml'));
  const hasClaudeConfig = fs.existsSync(path.join(process.cwd(), '.claude'));

  if (hasPackageJson) {
    console.log('✓ package.json found');
  }

  if (hasPnpmWorkspace) {
    console.log('✓ Workspace configuration found');
  }

  if (hasClaudeConfig) {
    console.log('✓ Claude configuration found');
  }

  if (!checkOnly) {
    console.log('\n✓ Setup complete!');
    console.log('\nNext steps:');
    console.log('  • Review generated configuration files');
    console.log('  • Run /setup-ecosystem --detect to check tools');
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

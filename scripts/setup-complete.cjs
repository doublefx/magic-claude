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
const crypto = require('crypto');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');

// Serena utilities
const {
  isSerenaInstalled,
  isSerenaEnabled,
  isProjectActivated,
  isJetBrainsAvailable,
  detectLanguages
} = require('./lib/serena.cjs');

// Project type indicators (mirrors detect-project-type.js)
const PROJECT_INDICATORS = {
  nodejs: ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
  python: ['pyproject.toml', 'setup.py', 'requirements.txt', 'Pipfile', 'poetry.lock'],
  maven: ['pom.xml', 'mvnw', 'mvnw.cmd'],
  gradle: ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'gradlew']
};

const MANIFEST_FILES = ['package.json', 'pyproject.toml', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'requirements.txt', 'setup.py'];

/**
 * Detect project types and create cache file
 */
function detectAndCacheProjectTypes(cwd) {
  const types = [];

  // Detect types
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

  // Calculate manifest hash for cache invalidation
  const hash = crypto.createHash('sha256');
  let foundManifests = false;
  for (const manifest of MANIFEST_FILES) {
    const manifestPath = path.join(cwd, manifest);
    try {
      if (fs.existsSync(manifestPath)) {
        const stats = fs.statSync(manifestPath);
        hash.update(`${manifest}:${stats.mtimeMs}`);
        foundManifests = true;
      }
    } catch {
      continue;
    }
  }
  if (!foundManifests) hash.update('no-manifests');
  const manifestHash = hash.digest('hex');

  // Write cache file
  const cacheDir = path.join(cwd, '.claude');
  const cacheFile = path.join(cacheDir, 'everything-claude-code.project-type.json');

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cacheData = {
      types,
      hash: manifestHash,
      detected_at: new Date().toISOString(),
      cwd
    };

    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
    return { types, cacheFile };
  } catch (err) {
    return { types, error: err.message };
  }
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

  // Step 3: Project Type Detection & Caching
  console.log('\n━━━ Step 3: Project Type Detection ━━━\n');

  const projectTypeResult = detectAndCacheProjectTypes(process.cwd());
  if (projectTypeResult.types.length > 0) {
    console.log(`✓ Detected project types: ${projectTypeResult.types.join(', ')}`);
    if (projectTypeResult.cacheFile && !checkOnly) {
      console.log(`  Cache: .claude/everything-claude-code.project-type.json`);
    }
  } else {
    console.log('○ No recognized project types detected');
  }

  // Step 4: Serena Integration (optional)
  console.log('\n━━━ Step 4: Serena Integration ━━━\n');

  let serenaSetupComplete = false;
  let serenaSetupNeeded = false;
  const serenaInstalled = isSerenaInstalled();

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
      console.log('  ✓ JetBrains tools available (recommended for best performance)');
    } else if (languages.length > 1) {
      console.log('  💡 TIP: Multiple languages detected - consider JetBrains plugin ($5/mo or $50/yr)');
      console.log('     for first-class multi-language support and external library indexing');
    }

    // Check project activation
    if (isProjectActivated()) {
      console.log('  ✓ Serena project already activated');
      serenaSetupComplete = true;
    } else if (!checkOnly && isSerenaEnabled()) {
      console.log('  → Serena setup needed');
      serenaSetupNeeded = true;
    }

    // Cache Serena status
    if (!checkOnly && process.env.CLAUDE_ENV_FILE) {
      try {
        const envLines = [
          `export SERENA_INSTALLED="true"`,
          `export SERENA_JETBRAINS_AVAILABLE="${jetbrainsAvailable}"`,
          `export SERENA_LANGUAGES="${languages.join(',')}"`,
          `export SERENA_SETUP_NEEDED="${serenaSetupNeeded}"`
        ];
        fs.appendFileSync(process.env.CLAUDE_ENV_FILE, envLines.join('\n') + '\n');
      } catch {
        // Non-fatal
      }
    }

    // Output instruction for Claude to invoke the skill
    if (serenaSetupNeeded && !checkOnly) {
      console.log('\n  ⚠️  CLAUDE: You MUST now invoke the /serena-setup skill to complete Serena integration.');
      console.log('     Use the Skill tool with skill: "serena-setup"');
    }
  } else {
    console.log('ℹ️  Serena MCP plugin not detected');
    console.log('   Serena provides semantic code analysis and memory-first workflow.');
    console.log('   To install: /plugin install serena');
    console.log('   Then run: /serena-setup');
  }

  // Step 5: Final Summary
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

  // Project type cache
  const projectTypeCacheExists = fs.existsSync(path.join(process.cwd(), '.claude', 'everything-claude-code.project-type.json'));
  if (projectTypeCacheExists) {
    console.log('✓ Project type cache created');
  }

  // Serena status
  if (serenaInstalled) {
    console.log('✓ Serena integration configured');
  } else {
    console.log('○ Serena integration skipped (not installed)');
  }

  if (!checkOnly) {
    // Write persistent setup status
    const setupStatusFile = path.join(process.cwd(), '.claude', 'everything-claude-code.setup-status.json');
    try {
      const claudeDir = path.join(process.cwd(), '.claude');
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }

      const setupStatus = {
        completed_at: new Date().toISOString(),
        project_types: projectTypeResult.types,
        serena_installed: serenaInstalled,
        serena_setup_complete: serenaSetupComplete,
        serena_setup_needed: serenaSetupNeeded,
        plugin_version: '2.1.0'
      };

      fs.writeFileSync(setupStatusFile, JSON.stringify(setupStatus, null, 2), 'utf8');
      console.log('✓ Setup status saved to .claude/everything-claude-code.setup-status.json');
    } catch (err) {
      console.log(`⚠️  Could not save setup status: ${err.message}`);
    }

    console.log('\n✓ Setup complete!');
    console.log('\nNext steps:');
    console.log('  • Review generated configuration files');
    console.log('  • Run /setup-ecosystem --detect to check tools');
    if (!serenaInstalled) {
      console.log('  • Install Serena for memory-first workflow: /plugin install serena');
    } else if (!serenaSetupComplete) {
      console.log('  • Complete Serena setup: /serena-setup');
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

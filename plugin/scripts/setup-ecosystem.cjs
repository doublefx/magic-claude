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

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { getWorkspaceContext } = require('./lib/workspace-context.cjs');
const { detectPackageEcosystem } = require('./lib/workspace/ecosystems.cjs');
const {
  ToolDetector,
  checkEcosystemTools,
  getInstallationHelp
} = require('./lib/workspace/tool-detection.cjs');
const { ensureDir, writeFile } = require('./lib/utils.cjs');
const { getAllSetupToolCategories, ECOSYSTEMS } = require('./lib/ecosystems/index.cjs');

// Ecosystem tool definitions — built dynamically from the registry
const ECOSYSTEM_TOOLS = getAllSetupToolCategories();

/**
 * Detect if current directory could be a workspace root
 * @returns {object|null} { subPackages: [...], suggestedWorkspaceType: '...' }
 */
function detectPotentialWorkspace() {
  const cwd = process.cwd();

  // Check if root already has package.json
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    return null;
  }

  // Look for common workspace directories
  const commonDirs = ['packages', 'apps', 'services', 'libs', 'packages/*', 'apps/*'];
  const subPackages = [];

  for (const dir of ['packages', 'apps', 'services', 'libs']) {
    const dirPath = path.join(cwd, dir);
    if (!fs.existsSync(dirPath)) continue;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pkgJsonPath = path.join(dirPath, entry.name, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          subPackages.push({
            name: entry.name,
            path: path.join(dir, entry.name),
            ecosystem: detectPackageEcosystem(path.join(dirPath, entry.name))
          });
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  if (subPackages.length === 0) {
    return null;
  }

  // Suggest workspace type based on what's already there
  let suggestedType = 'pnpm'; // Default
  if (fs.existsSync(path.join(cwd, 'nx.json'))) {
    suggestedType = 'nx';
  } else if (fs.existsSync(path.join(cwd, 'lerna.json'))) {
    suggestedType = 'lerna';
  } else if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    suggestedType = 'pnpm';
  } else if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    suggestedType = 'yarn';
  }

  return { subPackages, suggestedType };
}

/**
 * Prompt user for input
 * @param {string} question
 * @param {string} defaultValue - Default value if --yes flag is used
 * @param {boolean} autoYes - If true, automatically return default
 * @returns {Promise<string>}
 */
function prompt(question, defaultValue = '', autoYes = false) {
  if (autoYes) {
    console.log(`${question}${defaultValue}`);
    return Promise.resolve(defaultValue);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Initialize workspace root with package.json and workspace config
 * @param {string} workspaceType - pnpm, yarn, npm, lerna, nx
 * @param {Array} subPackages - Detected sub-packages
 * @param {string} preferredPM - Preferred package manager
 */
async function initializeWorkspaceRoot(workspaceType, subPackages, preferredPM = 'pnpm') {
  const cwd = process.cwd();
  const dirname = path.basename(cwd);

  console.log('\n=== Initializing Workspace Root ===\n');

  // 1. Create root package.json
  const packageJson = {
    name: dirname,
    version: '1.0.0',
    private: true,
    packageManager: `${preferredPM}@latest`,
    scripts: {
      build: `${preferredPM} --recursive run build`,
      test: `${preferredPM} --recursive run test`,
      format: 'prettier --write "**/*.{js,ts,json,md,yml}"',
      'format:check': 'prettier --check "**/*.{js,ts,json,md,yml}"',
      lint: 'eslint . --ext .js,.ts',
      clean: `${preferredPM} --recursive run clean`
    },
    devDependencies: {
      prettier: '^3.0.0',
      eslint: '^8.0.0'
    }
  };

  writeFile(
    path.join(cwd, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log('✓ Created package.json');

  // 2. Create workspace config
  if (workspaceType === 'pnpm' || preferredPM === 'pnpm') {
    // Create pnpm-workspace.yaml
    const workspaceDirs = [...new Set(subPackages.map(p => p.path.split('/')[0]))];
    const workspaceYaml = `packages:\n${workspaceDirs.map(d => `  - '${d}/*'`).join('\n')}\n`;

    writeFile(
      path.join(cwd, 'pnpm-workspace.yaml'),
      workspaceYaml
    );
    console.log('✓ Created pnpm-workspace.yaml');
  } else if (workspaceType === 'yarn' || preferredPM === 'yarn') {
    // Yarn workspaces go in package.json
    packageJson.workspaces = [...new Set(subPackages.map(p => p.path.split('/')[0] + '/*'))];
    writeFile(
      path.join(cwd, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✓ Added workspaces to package.json');
  }

  // 3. Create .claude directory and config
  const claudeDir = path.join(cwd, '.claude');
  ensureDir(claudeDir);

  const pmConfig = {
    packageManager: preferredPM,
    setAt: new Date().toISOString()
  };
  writeFile(
    path.join(claudeDir, 'magic-claude.package-manager.json'),
    JSON.stringify(pmConfig, null, 2)
  );
  console.log('✓ Created .claude/magic-claude.package-manager.json');

  // 4. Create basic .prettierrc
  const prettierrc = {
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    tabWidth: 2,
    printWidth: 100
  };
  writeFile(
    path.join(cwd, '.prettierrc'),
    JSON.stringify(prettierrc, null, 2)
  );
  console.log('✓ Created .prettierrc');

  // 5. Create .gitignore if it doesn't exist
  const gitignorePath = path.join(cwd, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const gitignore = `node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
coverage/
.turbo/
`;
    writeFile(gitignorePath, gitignore);
    console.log('✓ Created .gitignore');
  }

  console.log('\n✓ Workspace root initialized!');

  return preferredPM;
}

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
  --yes, -y          Auto-accept prompts with defaults (for automation)

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

async function detectAndShow(autoYes = false) {
  // Check for potential workspace without root package.json
  const potentialWorkspace = detectPotentialWorkspace();
  if (potentialWorkspace) {
    console.log('\n⚠️  Workspace Structure Detected\n');
    console.log(`Found ${potentialWorkspace.subPackages.length} sub-package(s):`);
    for (const pkg of potentialWorkspace.subPackages) {
      console.log(`  - ${pkg.path} (${pkg.ecosystem})`);
    }
    console.log('\nBut no root package.json found.');
    console.log('A root package.json is recommended for:');
    console.log('  • Shared development tools (prettier, eslint)');
    console.log('  • Workspace orchestration scripts');
    console.log('  • Documentation formatting');
    console.log('  • Hook compatibility\n');

    const answer = await prompt('Initialize workspace root? [Y/n] ', 'y', autoYes);
    if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      // Ask for preferred package manager
      console.log('\nAvailable package managers:');
      const detector = new ToolDetector();
      const pms = ['pnpm', 'yarn', 'npm', 'bun'];
      for (const pm of pms) {
        const available = detector.isAvailable(pm);
        const marker = available ? '✓' : '✗';
        console.log(`  ${marker} ${pm}${pm === 'pnpm' ? ' (recommended)' : ''}`);
      }

      const pmAnswer = await prompt('\nPreferred package manager [pnpm]: ', 'pnpm', autoYes);
      const preferredPM = pmAnswer || 'pnpm';

      const installedPM = await initializeWorkspaceRoot(
        potentialWorkspace.suggestedType,
        potentialWorkspace.subPackages,
        preferredPM
      );

      // Offer to run install
      console.log('\nNext steps:');
      console.log(`  1. Run: ${installedPM} install`);
      console.log('  2. Review and adjust package.json scripts');
      console.log('  3. Configure shared tooling (.eslintrc, tsconfig.json)\n');

      const installAnswer = await prompt(`\nRun "${installedPM} install" now? [Y/n] `, 'y', autoYes);
      if (!installAnswer || installAnswer.toLowerCase() === 'y' || installAnswer.toLowerCase() === 'yes') {
        console.log(`\nRunning ${installedPM} install...\n`);
        const { execSync } = require('child_process');
        try {
          execSync(`${installedPM} install`, {
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log(`\n✓ Dependencies installed successfully!`);
        } catch (err) {
          console.error(`\n✗ Installation failed. You can run "${installedPM} install" manually.`);
        }
      }

      // Refresh workspace context after initialization
      const { getWorkspaceContext } = require('./lib/workspace-context.cjs');
      const newWorkspace = getWorkspaceContext(true); // Refresh

      console.log('\n=== Ecosystem Detection (after init) ===\n');
      console.log(`Workspace type: ${newWorkspace.getType()}`);
      console.log(`Packages: ${newWorkspace.getAllPackages().length}`);
      console.log('\nRun this command again to check tools for all packages.');
      return;
    } else {
      console.log('\nSkipping workspace initialization.');
      console.log('You can initialize manually later by creating package.json\n');
    }
  }

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
    const supported = Object.values(ECOSYSTEMS).filter(e => e !== 'unknown').join(', ');
    console.log(`Supported: ${supported}`);
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
  const autoYes = args.includes('--yes') || args.includes('-y');
  detectAndShow(autoYes)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
} else if (args.includes('--interactive')) {
  interactiveSetup().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
} else {
  const checkIdx = args.indexOf('--check');
  if (checkIdx !== -1) {
    const ecosystem = args[checkIdx + 1];
    if (!ecosystem) {
      console.error('Error: --check requires an ecosystem name');
      const supported = Object.values(ECOSYSTEMS).filter(e => e !== 'unknown').join(', ');
      console.error(`Supported: ${supported}`);
      process.exit(1);
    }
    checkSpecificEcosystem(ecosystem);
    process.exit(0);
  } else {
    console.error('Unknown option. Run with --help for usage information.');
    process.exit(1);
  }
}

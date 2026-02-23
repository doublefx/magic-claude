#!/usr/bin/env node
/**
 * Rules Installation Script
 *
 * Copies plugin rules from ${CLAUDE_PLUGIN_ROOT}/rules/ to ~/.claude/rules/
 * Claude Code does NOT auto-load rules from plugins - they must be installed
 * to ~/.claude/rules/ (user-level) or .claude/rules/ (project-level).
 *
 * Managed files are marked with a comment header to distinguish them from
 * user-created rules. User-modified files are never overwritten unless --force.
 *
 * Usage:
 *   node scripts/setup-rules.cjs --check       # Dry-run: show what would change
 *   node scripts/setup-rules.cjs --install      # Install/update managed rules
 *   node scripts/setup-rules.cjs --force        # Overwrite even user-modified files
 *   node scripts/setup-rules.cjs --uninstall    # Remove only managed rules
 *   node scripts/setup-rules.cjs --help         # Show help
 */

const fs = require('fs');
const path = require('path');
const { getClaudeDir, ensureDir, log } = require('./lib/utils.cjs');

const MANAGED_MARKER = '<!-- managed by magic-claude plugin -->';
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, '..');

/**
 * Get the plugin rules source directory
 */
function getPluginRulesDir() {
  return path.join(PLUGIN_ROOT, 'rules');
}

/**
 * Get the user-level rules target directory
 */
function getUserRulesDir() {
  return path.join(getClaudeDir(), 'rules');
}

/**
 * List all .md files in the plugin rules directory
 * @returns {string[]} Array of filenames (e.g., ['security.md', 'testing.md'])
 */
function getPluginRules() {
  const rulesDir = getPluginRulesDir();
  if (!fs.existsSync(rulesDir)) {
    return [];
  }

  return fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.md'))
    .sort();
}

/**
 * Check if a file in the target directory was installed by this plugin
 * @param {string} filePath - Absolute path to the target file
 * @returns {boolean}
 */
function isPluginManaged(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.startsWith(MANAGED_MARKER);
  } catch {
    return false;
  }
}

/**
 * Check the status of all rules
 * @returns {{ missing: string[], managed: string[], modified: string[], userOwned: string[] }}
 */
function checkRules() {
  const pluginRules = getPluginRules();
  const targetDir = getUserRulesDir();

  const missing = [];
  const managed = [];
  const modified = [];
  const userOwned = [];

  for (const filename of pluginRules) {
    const targetPath = path.join(targetDir, filename);

    if (!fs.existsSync(targetPath)) {
      missing.push(filename);
      continue;
    }

    if (isPluginManaged(targetPath)) {
      // Check if content matches current plugin version
      const sourceContent = fs.readFileSync(path.join(getPluginRulesDir(), filename), 'utf8');
      const targetContent = fs.readFileSync(targetPath, 'utf8');
      const expectedContent = MANAGED_MARKER + '\n' + sourceContent;

      if (targetContent === expectedContent) {
        managed.push(filename);
      } else {
        modified.push(filename);
      }
    } else {
      userOwned.push(filename);
    }
  }

  return { missing, managed, modified, userOwned };
}

/**
 * Install rules from plugin to user directory
 * @param {{ force?: boolean }} options
 * @returns {{ installed: string[], updated: string[], skipped: string[] }}
 */
function installRules(options = {}) {
  const { force = false } = options;
  const pluginRules = getPluginRules();
  const sourceDir = getPluginRulesDir();
  const targetDir = getUserRulesDir();

  ensureDir(targetDir);

  const installed = [];
  const updated = [];
  const skipped = [];

  for (const filename of pluginRules) {
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);
    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const managedContent = MANAGED_MARKER + '\n' + sourceContent;

    if (!fs.existsSync(targetPath)) {
      // New file - install it
      fs.writeFileSync(targetPath, managedContent, 'utf8');
      installed.push(filename);
      continue;
    }

    if (isPluginManaged(targetPath)) {
      // Plugin-managed file - update it
      const currentContent = fs.readFileSync(targetPath, 'utf8');
      if (currentContent !== managedContent) {
        fs.writeFileSync(targetPath, managedContent, 'utf8');
        updated.push(filename);
      } else {
        skipped.push(filename);
      }
      continue;
    }

    // User-owned file
    if (force) {
      fs.writeFileSync(targetPath, managedContent, 'utf8');
      updated.push(filename);
    } else {
      skipped.push(filename);
    }
  }

  return { installed, updated, skipped };
}

/**
 * Uninstall only plugin-managed rules from user directory
 * @returns {{ removed: string[], kept: string[] }}
 */
function uninstallRules() {
  const pluginRules = getPluginRules();
  const targetDir = getUserRulesDir();

  const removed = [];
  const kept = [];

  for (const filename of pluginRules) {
    const targetPath = path.join(targetDir, filename);

    if (!fs.existsSync(targetPath)) {
      continue;
    }

    if (isPluginManaged(targetPath)) {
      fs.unlinkSync(targetPath);
      removed.push(filename);
    } else {
      kept.push(filename);
    }
  }

  return { removed, kept };
}

// --- CLI ---

function showHelp() {
  console.log(`
Rules Installation for Claude Code

Claude Code does NOT auto-load rules from plugins. Rules must be installed
to ~/.claude/rules/ (user-level) to be active in every conversation.

Usage:
  node scripts/setup-rules.cjs [options]

Options:
  --check         Show current status without making changes
  --install       Install or update plugin rules to ~/.claude/rules/
  --force         Like --install but overwrites user-modified files too
  --uninstall     Remove only plugin-managed rules (keeps user rules)
  --help, -h      Show this help message

Examples:
  # Check which rules are missing
  node scripts/setup-rules.cjs --check

  # Install all plugin rules
  node scripts/setup-rules.cjs --install

  # Force overwrite even user-modified rules
  node scripts/setup-rules.cjs --force

  # Remove plugin-managed rules
  node scripts/setup-rules.cjs --uninstall
`);
}

function runCheck() {
  const status = checkRules();
  const pluginRules = getPluginRules();

  console.log('\n=== Rules Installation Status ===\n');
  console.log(`Plugin rules directory: ${getPluginRulesDir()}`);
  console.log(`Target rules directory: ${getUserRulesDir()}`);
  console.log(`Total plugin rules: ${pluginRules.length}\n`);

  if (status.managed.length > 0) {
    console.log(`Up to date (${status.managed.length}):`);
    status.managed.forEach(f => console.log(`  ✓ ${f}`));
  }

  if (status.modified.length > 0) {
    console.log(`\nOutdated - will update (${status.modified.length}):`);
    status.modified.forEach(f => console.log(`  ↻ ${f}`));
  }

  if (status.missing.length > 0) {
    console.log(`\nMissing - will install (${status.missing.length}):`);
    status.missing.forEach(f => console.log(`  ○ ${f}`));
  }

  if (status.userOwned.length > 0) {
    console.log(`\nUser-owned - will skip (${status.userOwned.length}):`);
    status.userOwned.forEach(f => console.log(`  ● ${f}`));
  }

  const actionNeeded = status.missing.length + status.modified.length;
  if (actionNeeded > 0) {
    console.log(`\n→ ${actionNeeded} rule(s) need attention. Run with --install to update.`);
  } else if (pluginRules.length > 0) {
    console.log('\n✓ All plugin rules are installed and up to date.');
  }

  console.log('');
}

function runInstall(force = false) {
  const result = installRules({ force });

  console.log('\n=== Rules Installation ===\n');

  if (result.installed.length > 0) {
    console.log(`Installed (${result.installed.length}):`);
    result.installed.forEach(f => console.log(`  + ${f}`));
  }

  if (result.updated.length > 0) {
    console.log(`\nUpdated (${result.updated.length}):`);
    result.updated.forEach(f => console.log(`  ↻ ${f}`));
  }

  if (result.skipped.length > 0) {
    console.log(`\nSkipped (${result.skipped.length}):`);
    result.skipped.forEach(f => console.log(`  - ${f}`));
  }

  const total = result.installed.length + result.updated.length;
  if (total > 0) {
    console.log(`\n✓ ${total} rule(s) installed/updated to ${getUserRulesDir()}`);
  } else {
    console.log('\n✓ All rules already up to date.');
  }

  console.log('');
}

function runUninstall() {
  const result = uninstallRules();

  console.log('\n=== Rules Uninstall ===\n');

  if (result.removed.length > 0) {
    console.log(`Removed (${result.removed.length}):`);
    result.removed.forEach(f => console.log(`  - ${f}`));
  }

  if (result.kept.length > 0) {
    console.log(`\nKept (user-owned) (${result.kept.length}):`);
    result.kept.forEach(f => console.log(`  ● ${f}`));
  }

  if (result.removed.length > 0) {
    console.log(`\n✓ ${result.removed.length} managed rule(s) removed.`);
  } else {
    console.log('✓ No managed rules found to remove.');
  }

  console.log('');
}

// Export for testing
module.exports = {
  MANAGED_MARKER,
  getPluginRulesDir,
  getUserRulesDir,
  getPluginRules,
  isPluginManaged,
  checkRules,
  installRules,
  uninstallRules
};

// CLI - only run when executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Default to --install when no args provided
  if (args.length === 0) {
    runInstall(false);
    process.exit(0);
  }

  if (args.includes('--check')) {
    runCheck();
    process.exit(0);
  }

  if (args.includes('--force')) {
    runInstall(true);
    process.exit(0);
  }

  if (args.includes('--install')) {
    runInstall(false);
    process.exit(0);
  }

  if (args.includes('--uninstall')) {
    runUninstall();
    process.exit(0);
  }

  console.error(`Error: Unknown option "${args[0]}"`);
  showHelp();
  process.exit(1);
}

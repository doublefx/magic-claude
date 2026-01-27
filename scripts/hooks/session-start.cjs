#!/usr/bin/env node
/**
 * SessionStart Hook - Load previous context on new session
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs when a new Claude session starts. Checks for recent session
 * files and notifies Claude of available context to load.
 */

const path = require('path');
const {
  getSessionsDir,
  getLearnedSkillsDir,
  findFiles,
  ensureDir,
  log
} = require('../lib/utils.cjs');
const {
  getPackageManager,
  getSelectionPrompt,
  isInWorkspace,
  getAllWorkspacePackageManagers
} = require('../lib/package-manager.cjs');

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // Ensure directories exist
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // Check for recent session files (last 7 days)
  const recentSessions = findFiles(sessionsDir, '*.tmp', { maxAge: 7 });

  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
    log(`[SessionStart] Latest: ${latest.path}`);
  }

  // Check for learned skills
  const learnedSkills = findFiles(learnedDir, '*.md');

  if (learnedSkills.length > 0) {
    log(`[SessionStart] ${learnedSkills.length} learned skill(s) available in ${learnedDir}`);
  }

  // Detect and report package manager / workspace
  if (isInWorkspace()) {
    log('[SessionStart] Workspace/monorepo detected');

    const workspaceManagers = getAllWorkspacePackageManagers();

    // Count unique package managers and ecosystems
    const uniquePMs = [...new Set(workspaceManagers.map(pm => pm.name))];
    const uniqueEcosystems = [...new Set(workspaceManagers.map(pm => pm.ecosystem).filter(Boolean))];

    log(`[SessionStart] Packages: ${workspaceManagers.length}`);
    log(`[SessionStart] Ecosystems: ${uniqueEcosystems.join(', ') || 'unknown'}`);
    log(`[SessionStart] Package managers: ${uniquePMs.join(', ')}`);

    // Show individual packages if there are multiple package managers
    if (uniquePMs.length > 1) {
      log('[SessionStart] Per-package configuration:');
      for (const pm of workspaceManagers) {
        log(`  - ${pm.packageName || 'root'}: ${pm.name} (${pm.ecosystem || 'unknown'})`);
      }
    }
  } else {
    // Single project (not in workspace)
    const pm = getPackageManager();
    log(`[SessionStart] Package manager: ${pm.name} (${pm.source})`);

    // If package manager was detected via fallback, show selection prompt
    if (pm.source === 'fallback' || pm.source === 'default') {
      log('[SessionStart] No package manager preference found.');
      log(getSelectionPrompt());
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  process.exit(0); // Don't block on errors
});

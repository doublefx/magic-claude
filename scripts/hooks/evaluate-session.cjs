#!/usr/bin/env node
/**
 * Continuous Learning - Session Evaluator
 *
 * Cross-platform (Windows, macOS, Linux)
 *
 * Runs on SessionEnd and PreCompact hooks to:
 * 1. Detect extractable patterns from sessions
 * 2. Inject context into Claude about learning opportunities
 * 3. Surface pattern learning prompts with visibility
 *
 * Why SessionEnd/PreCompact instead of Stop:
 * - SessionEnd runs at session termination (ideal for learning)
 * - PreCompact runs before context loss (preserve learnings)
 */

const path = require('path');
const fs = require('fs');
const {
  getUserLearnedSkillsDir,
  getProjectLearnedSkillsDir,
  ensureDir,
  readFile,
  countInFile,
  log
} = require('../lib/utils.cjs');

/**
 * Read hook input from stdin (JSON format)
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';

    // Set a timeout for hooks that may not have stdin
    const timeout = setTimeout(() => {
      resolve({});
    }, 100);

    process.stdin.on('data', chunk => {
      clearTimeout(timeout);
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });

    if (process.stdin.readableEnded) {
      clearTimeout(timeout);
      resolve({});
    }
  });
}

/**
 * Detect patterns worth extracting from the session
 */
function detectExtractablePatterns(transcriptPath) {
  try {
    const content = readFile(transcriptPath);
    if (!content) return [];

    const patterns = [];

    // Look for error resolution patterns
    if (/error|exception|failed|fix|resolve|solved/i.test(content)) {
      patterns.push('error_resolution');
    }

    // Look for user corrections
    if (/no,|actually|instead|not that|wrong|correct approach/i.test(content)) {
      patterns.push('user_corrections');
    }

    // Look for workarounds
    if (/workaround|hack|trick|quirk|issue with|known bug/i.test(content)) {
      patterns.push('workarounds');
    }

    // Look for debugging sessions
    if (/debug|investigate|trace|log|inspect|breakpoint/i.test(content)) {
      patterns.push('debugging_techniques');
    }

    // Look for architecture decisions
    if (/architect|design|pattern|structure|refactor|approach/i.test(content)) {
      patterns.push('architecture_decisions');
    }

    return patterns;
  } catch {
    return [];
  }
}

async function main() {
  const input = await readStdin();

  // Get script directory to find config
  const scriptDir = __dirname;
  const configFile = path.join(scriptDir, '..', '..', 'skills', 'continuous-learning', 'config.json');

  // Default configuration
  let minSessionLength = 10;
  const userLearnedSkillsPath = getUserLearnedSkillsDir();
  const projectLearnedSkillsPath = getProjectLearnedSkillsDir();

  // Load config if exists
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      const config = JSON.parse(configContent);
      minSessionLength = config.min_session_length || 10;
    } catch {
      // Invalid config, use defaults
    }
  }

  // Ensure directories exist
  ensureDir(userLearnedSkillsPath);
  if (projectLearnedSkillsPath) {
    ensureDir(projectLearnedSkillsPath);
  }

  // Get transcript path from environment (set by Claude Code)
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    console.log(JSON.stringify(input));
    process.exit(0);
  }

  // Count user messages in session
  const messageCount = countInFile(transcriptPath, /"type":"user"/g);

  // Skip short sessions
  if (messageCount < minSessionLength) {
    log(`[ContinuousLearning] Session too short (${messageCount} messages), skipping`);
    console.log(JSON.stringify(input));
    process.exit(0);
  }

  // Detect extractable patterns
  const patterns = detectExtractablePatterns(transcriptPath);

  // Build context message
  log(`[ContinuousLearning] Session has ${messageCount} messages`);

  if (patterns.length > 0) {
    // SessionEnd/PreCompact hooks do NOT support hookSpecificOutput
    // Log to stderr for visibility
    log(`[ContinuousLearning] Detected patterns: ${patterns.join(', ')}`);
    log(`[ContinuousLearning] Universal patterns → ${userLearnedSkillsPath}`);
    if (projectLearnedSkillsPath) {
      log(`[ContinuousLearning] Project-specific → ${projectLearnedSkillsPath}`);
    }
    log('[ContinuousLearning] Tip: Use /learn to save reusable patterns');
  }

  // SessionEnd/PreCompact hooks should exit cleanly
  process.exit(0);
}

main().catch(err => {
  console.error('[ContinuousLearning] Error:', err.message);
  console.log(JSON.stringify({}));
  process.exit(0);
});

#!/usr/bin/env node

/**
 * Maven/Gradle Advisor Hook
 * Provides best practice recommendations for Maven and Gradle commands
 *
 * Advice given:
 * - Suggest `mvn verify` instead of `mvn install` for local builds
 * - Suggest `./gradlew` instead of `gradle` for wrapper consistency
 */

import {
  readHookInput,
  writeHookResult,
  debugHook,
  getCommand,
  detectProjectType,
  logHook
} from '../lib/hook-utils.js';

/**
 * Main hook function
 */
async function main() {
  try {
    // Read tool context from stdin
    const context = await readHookInput();

    if (!context) {
      logHook('No context received from stdin', 'WARNING');
      process.exit(0);
    }

    // Extract command from context
    const command = getCommand(context);

    if (!command) {
      debugHook('maven-advisor', 'process', 'Skipping — no command in context');
      process.exit(0);
    }

    const projectTypes = detectProjectType(process.cwd());
    const advice = [];

    // Maven advice (only in Maven projects)
    if (projectTypes.includes('maven')) {
      if (command.includes('mvn install') && !command.includes('mvn clean install')) {
        advice.push('Consider: mvn verify (faster than install for local builds). Use "mvn clean install" only when publishing to local repo.');
      }
      if (command.includes('gradle') && !command.includes('./gradlew') && !command.includes('.\\gradlew')) {
        advice.push('Consider: Use ./gradlew instead of gradle for wrapper consistency.');
      }
    }

    // Gradle advice (only in Gradle projects)
    if (projectTypes.includes('gradle')) {
      if (command.includes('gradle') && !command.includes('./gradlew') && !command.includes('.\\gradlew')) {
        advice.push('Consider: Use ./gradlew instead of gradle for wrapper consistency.');
      }
    }

    if (advice.length > 0) {
      advice.forEach(a => logHook(a, 'INFO'));
      writeHookResult('PostToolUse', {
        additionalContext: `[Build Advisor] ${advice.join(' ')}`
      });
    }

    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    process.exit(0);
  }
}

main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(0);
});

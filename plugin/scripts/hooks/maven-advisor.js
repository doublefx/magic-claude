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
  writeHookOutput,
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

    // If no command, pass through
    if (!command) {
      writeHookOutput(context);
      process.exit(0);
    }

    // Detect project types in current directory
    const projectTypes = detectProjectType(process.cwd());

    // Maven advice (only in Maven projects)
    if (projectTypes.includes('maven')) {
      // Suggest mvn verify instead of mvn install for local builds
      if (command.includes('mvn install') && !command.includes('mvn clean install')) {
        logHook('Consider: mvn verify (faster than install for local builds)', 'INFO');
        logHook('Use "mvn clean install" only when you need to publish to local repo', 'INFO');
      }

      // Suggest using Gradle wrapper
      if (command.includes('gradle') && !command.includes('./gradlew') && !command.includes('.\\gradlew')) {
        logHook('Consider: Use ./gradlew instead of gradle for wrapper consistency', 'INFO');
      }
    }

    // Gradle advice (only in Gradle projects)
    if (projectTypes.includes('gradle')) {
      // Suggest using Gradle wrapper
      if (command.includes('gradle') && !command.includes('./gradlew') && !command.includes('.\\gradlew')) {
        logHook('Consider: Use ./gradlew instead of gradle for wrapper consistency', 'INFO');
      }
    }

    // Always pass through context (required by hook protocol)
    writeHookOutput(context);
    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    // Even on error, try to pass through empty context
    writeHookOutput({});
    process.exit(0);
  }
}

// Run main function
main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(0);
});

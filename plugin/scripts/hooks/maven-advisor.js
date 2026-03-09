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
  logHook,
  logTelemetry
} from '../lib/hook-utils.js';

/**
 * Main hook function
 */
async function main() {
  const start = Date.now();
  try {
    const context = await readHookInput();

    if (!context) {
      logHook('No context received from stdin', 'WARNING');
      logTelemetry({ hook: 'maven-advisor', event: 'PostToolUse', outcome: 'skipped', reason: 'no stdin context', duration_ms: Date.now() - start });
      process.exit(0);
    }

    const command = getCommand(context);

    if (!command) {
      debugHook('maven-advisor', 'process', 'Skipping — no command in context');
      logTelemetry({ hook: 'maven-advisor', event: 'PostToolUse', outcome: 'skipped', reason: 'no command in context', duration_ms: Date.now() - start });
      process.exit(0);
    }

    const projectTypes = detectProjectType(process.cwd());
    const advice = [];

    if (projectTypes.includes('maven')) {
      if (command.includes('mvn install') && !command.includes('mvn clean install')) {
        advice.push('Consider: mvn verify (faster than install for local builds). Use "mvn clean install" only when publishing to local repo.');
      }
      if (command.includes('gradle') && !command.includes('./gradlew') && !command.includes('.\\gradlew')) {
        advice.push('Consider: Use ./gradlew instead of gradle for wrapper consistency.');
      }
    }

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
      logTelemetry({ hook: 'maven-advisor', event: 'PostToolUse', outcome: 'fired', reason: `${advice.length} recommendation(s)`, duration_ms: Date.now() - start, tool: 'Bash' });
    } else {
      logTelemetry({ hook: 'maven-advisor', event: 'PostToolUse', outcome: 'skipped', reason: 'no advice applicable', duration_ms: Date.now() - start, tool: 'Bash' });
    }

    process.exit(0);

  } catch (error) {
    logHook(`Unexpected error: ${error.message}`, 'ERROR');
    logTelemetry({ hook: 'maven-advisor', event: 'PostToolUse', outcome: 'error', reason: error.message, duration_ms: Date.now() - start });
    process.exit(0);
  }
}

main().catch((err) => {
  logHook(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(0);
});

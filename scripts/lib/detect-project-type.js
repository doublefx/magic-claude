/**
 * Project Type Detection
 * Detects project types (Node.js, Python, Maven, Gradle) based on manifest files
 *
 * Simplified approach - no caching:
 * - Detection is fast (<200ms)
 * - No JSON config files created
 * - Serena memories can store project configuration if needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Project type indicators - files that identify a project type
 */
export const PROJECT_INDICATORS = {
  nodejs: [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'bun.lockb'
  ],
  python: [
    'pyproject.toml',
    'setup.py',
    'requirements.txt',
    'Pipfile',
    'poetry.lock',
    'uv.lock',
    'environment.yml'
  ],
  maven: [
    'pom.xml',
    'mvnw',
    'mvnw.cmd'
  ],
  gradle: [
    'build.gradle',
    'build.gradle.kts',
    'settings.gradle',
    'settings.gradle.kts',
    'gradlew',
    'gradlew.bat'
  ]
};

/**
 * Detect project types in a directory
 * @param {string} cwd - Directory to check (defaults to process.cwd())
 * @returns {string[]} Array of detected project types
 */
export function detectProjectType(cwd = process.cwd()) {
  // Handle edge cases
  if (cwd === null || cwd === '' || typeof cwd !== 'string') {
    return [];
  }

  // Check if directory exists
  try {
    if (!fs.existsSync(cwd)) {
      return [];
    }

    const stats = fs.statSync(cwd);
    if (!stats.isDirectory()) {
      return [];
    }
  } catch (_error) {
    // Permission error or other issue
    return [];
  }

  // Detect types by checking for indicator files
  const types = [];

  for (const [type, indicators] of Object.entries(PROJECT_INDICATORS)) {
    for (const indicator of indicators) {
      const indicatorPath = path.join(cwd, indicator);
      try {
        if (fs.existsSync(indicatorPath)) {
          if (!types.includes(type)) {
            types.push(type);
          }
          break; // Found one indicator, no need to check others for this type
        }
      } catch (_error) {
        // Permission error or other issue, skip this indicator
        continue;
      }
    }
  }

  return types;
}

/**
 * Clear cache for a directory (no-op in v3.0 - kept for backward compatibility)
 * @param {string} cwd - Directory to clear cache for
 */
export function clearCache(cwd = process.cwd()) {
  // No-op in v3.0 - caching removed
  // Kept for backward compatibility with code that calls this function
}

// Default export for CommonJS compatibility
export default {
  detectProjectType,
  clearCache,
  PROJECT_INDICATORS
};

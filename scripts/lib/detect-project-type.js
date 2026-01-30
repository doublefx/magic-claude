/**
 * Project Type Detection
 * Detects project types (Node.js, Python, Maven, Gradle) based on manifest files
 * Supports monorepos and caches results for performance
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
 * Manifest files to track for cache invalidation
 */
const MANIFEST_FILES = [
  'package.json',
  'pyproject.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'requirements.txt',
  'setup.py'
];

/**
 * Read cache file
 * @param {string} cacheFile - Path to cache file
 * @returns {object|null} Cache object or null if not found/invalid
 */
function readCache(cacheFile) {
  try {
    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const cacheContent = fs.readFileSync(cacheFile, 'utf8');
    const cache = JSON.parse(cacheContent);

    // Validate cache structure
    if (!cache.types || !Array.isArray(cache.types) || !cache.hash) {
      return null;
    }

    // Check if cache is stale (older than 24 hours)
    if (cache.detected_at) {
      const cacheAge = Date.now() - new Date(cache.detected_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
      if (cacheAge > maxAge) {
        return null;
      }
    }

    return cache;
  } catch (_error) {
    // Invalid cache file, return null
    return null;
  }
}

/**
 * Write cache file
 * @param {string} cacheFile - Path to cache file
 * @param {object} data - Cache data to write
 */
function writeCache(cacheFile, data) {
  try {
    const cacheDir = path.dirname(cacheFile);

    // Create .claude directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const cacheData = {
      ...data,
      detected_at: new Date().toISOString(),
      cwd: path.dirname(cacheFile).replace(/\/.claude$/, '')
    };

    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (_error) {
    // Fail silently - caching is optional
    // console.error(`[detect-project-type] Failed to write cache: ${error.message}`);
  }
}

/**
 * Calculate hash of manifest file modification times
 * @param {string} cwd - Directory to check
 * @returns {string} Hash of manifest mtimes
 */
function calculateManifestHash(cwd) {
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
    } catch (_error) {
      // Skip files we can't access
      continue;
    }
  }

  // If no manifests found, return a special hash
  if (!foundManifests) {
    hash.update('no-manifests');
  }

  return hash.digest('hex');
}

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

  // Check cache first
  const cacheFile = path.join(cwd, '.claude', 'everything-claude-code.project-type.json');
  const cache = readCache(cacheFile);

  // Calculate current manifest hash
  const manifestHash = calculateManifestHash(cwd);

  // If cache is valid and hash matches, return cached types
  if (cache && cache.hash === manifestHash) {
    return cache.types;
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

  // Write cache
  writeCache(cacheFile, { types, hash: manifestHash });

  return types;
}

/**
 * Clear cache for a directory
 * @param {string} cwd - Directory to clear cache for
 */
export function clearCache(cwd = process.cwd()) {
  const cacheFile = path.join(cwd, '.claude', 'everything-claude-code.project-type.json');
  try {
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  } catch (_error) {
    // Fail silently
  }
}

// Default export for CommonJS compatibility
export default {
  detectProjectType,
  clearCache,
  PROJECT_INDICATORS
};

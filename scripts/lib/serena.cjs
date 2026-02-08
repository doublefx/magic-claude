#!/usr/bin/env node
/**
 * Serena Utility Module
 *
 * Core utilities for Serena MCP integration:
 * - Installation and configuration detection
 * - Language detection for projects
 *
 * Cross-platform (Windows, macOS, Linux)
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// Constants
// =============================================================================

/**
 * Default Serena configuration
 */
const DEFAULT_CONFIG = {
  enabled: true,
  hooks_enabled: true,
  auto_activate_project: true,
  memory_on_task_completion: true,
  consolidation_threshold: 5
};

/**
 * Language detection patterns
 * Maps file patterns to language names
 */
const LANGUAGE_PATTERNS = {
  'package.json': 'javascript',
  'tsconfig.json': 'typescript',
  '*.ts': 'typescript',
  '*.tsx': 'typescript',
  '*.js': 'javascript',
  '*.jsx': 'javascript',
  'requirements.txt': 'python',
  'pyproject.toml': 'python',
  'setup.py': 'python',
  '*.py': 'python',
  'pom.xml': 'java',
  'build.gradle': 'java',
  'build.gradle.kts': 'kotlin',
  '*.java': 'java',
  '*.kt': 'kotlin',
  '*.kts': 'kotlin',
  'go.mod': 'go',
  '*.go': 'go',
  'Cargo.toml': 'rust',
  '*.rs': 'rust',
  '*.cs': 'csharp',
  '*.csproj': 'csharp',
  '*.rb': 'ruby',
  'Gemfile': 'ruby',
  '*.php': 'php',
  'composer.json': 'php',
  '*.scala': 'scala',
  'build.sbt': 'scala',
  '*.swift': 'swift',
  'Package.swift': 'swift',
  'pubspec.yaml': 'dart',
  '*.dart': 'dart',
  '*.hs': 'haskell',
  '*.ex': 'elixir',
  '*.exs': 'elixir',
  'mix.exs': 'elixir'
};

// =============================================================================
// Installation & Configuration
// =============================================================================

/**
 * Check if Serena is installed (cached in CLAUDE_ENV_FILE)
 * @returns {boolean}
 */
function isSerenaInstalled() {
  return process.env.SERENA_INSTALLED === 'true';
}

/**
 * Check if Serena integration is enabled
 * Returns false if not installed, or if disabled via config
 * @returns {boolean}
 */
function isSerenaEnabled() {
  if (!isSerenaInstalled()) {
    return false;
  }

  const config = getSerenaConfig();
  return config.enabled !== false;
}

/**
 * Check if JetBrains plugin is available (cached in CLAUDE_ENV_FILE)
 * @returns {boolean}
 */
function isJetBrainsAvailable() {
  return process.env.SERENA_JETBRAINS_AVAILABLE === 'true';
}

/**
 * Check if Serena project is activated for current directory
 * Validates that cached path matches current working directory
 * @returns {boolean}
 */
function isProjectActivated() {
  if (process.env.SERENA_PROJECT_ACTIVATED !== 'true') {
    return false;
  }

  // Validate path matches current directory
  const cachedPath = process.env.SERENA_PROJECT_PATH;
  const currentPath = process.cwd();

  return cachedPath === currentPath;
}

/**
 * Get Serena configuration
 * Checks .claude/serena-config.json, falls back to defaults
 * @returns {object}
 */
function getSerenaConfig() {
  const configPaths = [
    path.join(process.cwd(), '.claude', 'serena-config.json'),
    path.join(process.env.HOME || '', '.claude', 'serena-config.json')
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...config };
      }
    } catch {
      // Continue to next config path or defaults
    }
  }

  return { ...DEFAULT_CONFIG };
}

// =============================================================================
// Language Detection
// =============================================================================

/**
 * Detect programming languages used in a directory
 * @param {string} dir - Directory to scan
 * @returns {string[]} - Array of detected language names
 */
function detectLanguages(dir) {
  const detected = new Set();

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      // Check exact file matches
      for (const [pattern, language] of Object.entries(LANGUAGE_PATTERNS)) {
        if (!pattern.startsWith('*')) {
          if (file === pattern) {
            detected.add(language);
          }
        }
      }
    }

    // Check file extensions
    for (const file of files) {
      const ext = path.extname(file);
      if (ext) {
        const pattern = `*${ext}`;
        if (LANGUAGE_PATTERNS[pattern]) {
          detected.add(LANGUAGE_PATTERNS[pattern]);
        }
      }
    }

    // Recursively check common source directories (limit depth)
    const sourceDirs = ['src', 'lib', 'app', 'apps', 'packages', 'services'];
    for (const sourceDir of sourceDirs) {
      const sourcePath = path.join(dir, sourceDir);
      try {
        if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isDirectory()) {
          const subLangs = detectLanguagesInDir(sourcePath, 2);
          subLangs.forEach(lang => detected.add(lang));
        }
      } catch {
        // Skip inaccessible directories
      }
    }
  } catch {
    // Return empty array if directory cannot be read
  }

  return Array.from(detected);
}

/**
 * Helper to detect languages in a directory with depth limit
 * @param {string} dir - Directory to scan
 * @param {number} depth - Max depth to recurse
 * @returns {Set<string>}
 */
function detectLanguagesInDir(dir, depth) {
  const detected = new Set();

  if (depth <= 0) return detected;

  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);

      try {
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          const ext = path.extname(file);
          if (ext) {
            const pattern = `*${ext}`;
            if (LANGUAGE_PATTERNS[pattern]) {
              detected.add(LANGUAGE_PATTERNS[pattern]);
            }
          }
        } else if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          const subLangs = detectLanguagesInDir(filePath, depth - 1);
          subLangs.forEach(lang => detected.add(lang));
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directories
  }

  return detected;
}

// =============================================================================
// Exports
// =============================================================================

module.exports = {
  // Installation & Configuration
  isSerenaInstalled,
  isSerenaEnabled,
  isJetBrainsAvailable,
  isProjectActivated,
  getSerenaConfig,

  // Language Detection
  detectLanguages,

  // Constants (for testing)
  DEFAULT_CONFIG
};

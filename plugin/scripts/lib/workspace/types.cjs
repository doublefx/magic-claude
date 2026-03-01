/**
 * Workspace Types and Constants
 */

/**
 * Supported workspace types
 */
const WORKSPACE_TYPES = {
  PNPM: 'pnpm-workspace',
  NX: 'nx',
  LERNA: 'lerna',
  YARN: 'yarn-workspace',
  NPM: 'npm-workspace',
  TURBOREPO: 'turborepo',
  NONE: null
};

/**
 * Workspace indicator files
 * Used to detect workspace type
 */
const WORKSPACE_INDICATORS = {
  [WORKSPACE_TYPES.PNPM]: ['pnpm-workspace.yaml', 'pnpm-workspace.yml'],
  [WORKSPACE_TYPES.NX]: ['nx.json'],
  [WORKSPACE_TYPES.LERNA]: ['lerna.json'],
  [WORKSPACE_TYPES.TURBOREPO]: ['turbo.json'],
  // Yarn and NPM workspaces detected via package.json
};

module.exports = {
  WORKSPACE_TYPES,
  WORKSPACE_INDICATORS
};

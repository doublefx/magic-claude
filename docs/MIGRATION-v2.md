# Migration Guide: v1.0.0 → v2.0.0

**Workspace & Monorepo Support Release**

## Overview

Version 2.0.0 adds comprehensive monorepo and workspace support while maintaining **100% backward compatibility** with v1.0.0.

**If you're using a single-project setup, everything works exactly as before - no changes needed!**

## What's New

### 🎯 Monorepo & Workspace Support

- **Automatic workspace detection** - Supports pnpm workspaces, Nx, Lerna, Yarn workspaces, Turborepo
- **Multi-ecosystem support** - Mixed Node.js, Java/JVM, Python, and Rust projects in one workspace
- **Per-package configuration** - Each package can have its own package manager and settings
- **Configuration hierarchy** - Global, workspace, and package-level configs with proper precedence
- **Workspace-aware commands** - Tools understand package boundaries and dependencies
- **Cross-platform tool detection** - Checks for required tools and provides installation help

### 📦 New Workspace Infrastructure

**Ecosystem Modules** (`scripts/lib/workspace/ecosystems.cjs`):
- Detect project types: nodejs, jvm, python, rust
- Multi-ecosystem workspace support
- Ecosystem-specific configuration

**Workspace Detection** (`scripts/lib/workspace/detection.cjs`):
- Automatically finds workspace root
- Discovers all packages in workspace
- Supports all major workspace tools

**Configuration Hierarchy** (`scripts/lib/workspace/config.cjs`):
- Three-tier precedence: package > workspace > global
- Deep merge with array replacement
- Caching for performance

**Command Generation** (`scripts/lib/workspace/commands.cjs`):
- Platform-aware commands (Windows, macOS, Linux)
- Package manager support: npm, pnpm, yarn, bun, maven, gradle, pip, poetry, cargo
- Wrapper script detection (./gradlew, mvnw)

**Tool Detection** (`scripts/lib/workspace/tool-detection.cjs`):
- Check availability of development tools
- Version detection
- Platform-specific installation guidance

## Backward Compatibility Guarantee

### ✅ Zero Breaking Changes

All existing APIs work unchanged:
```javascript
// All v1.0.0 code continues to work in v2.0.0
const { getPackageManager } = require('./scripts/lib/package-manager.cjs');
const pm = getPackageManager();
// Still works exactly as before!
```

### ✅ Your Existing Setup

- Single-project workflows work identically
- All hooks function as before
- `/setup-pm` command unchanged
- Configuration files in same locations
- No migration required for single projects

## New Features (Opt-In)

### Workspace-Aware Package Manager Functions

**New functions available when you need them:**

```javascript
const {
  isInWorkspace,
  getPackageManagerForFile,
  getPackageManagerForPackage,
  getAllWorkspacePackageManagers
} = require('./scripts/lib/package-manager.cjs');

// Check if in a workspace
if (isInWorkspace()) {
  // Get all package managers used in workspace
  const allPMs = getAllWorkspacePackageManagers();
  console.log(`Using: ${allPMs.map(pm => pm.name).join(', ')}`);
}

// Get package manager for a specific file
const pm = getPackageManagerForFile('/path/to/packages/web/src/index.ts');
console.log(`File uses: ${pm.name}`);

// Get package manager for a specific package
const pkgPM = getPackageManagerForPackage('@myorg/api');
console.log(`Package uses: ${pkgPM.name}`);
```

### WorkspaceContext API

**Central abstraction for workspace operations:**

```javascript
const { getWorkspaceContext } = require('./scripts/lib/workspace-context.cjs');

const workspace = getWorkspaceContext();

// Check if in workspace
if (workspace.isWorkspace()) {
  console.log(`Workspace type: ${workspace.getType()}`);
  console.log(`Root: ${workspace.getRoot()}`);

  // Get all packages
  const packages = workspace.getAllPackages();
  console.log(`Found ${packages.length} packages`);

  // Find package for a file
  const pkg = workspace.findPackageForFile('/path/to/file.ts');
  if (pkg) {
    console.log(`File belongs to: ${pkg.name}`);
  }

  // Get configuration with hierarchy
  const config = workspace.getConfig(); // Merges global + workspace + package configs

  // Get ecosystem
  const ecosystem = workspace.getEcosystem();
  console.log(`Ecosystem: ${ecosystem}`);
}
```

### Enhanced Session Start Hook

**Automatically shows workspace context:**

```
[SessionStart] Workspace/monorepo detected
[SessionStart] Packages: 8
[SessionStart] Ecosystems: nodejs, python, rust
[SessionStart] Package managers: pnpm, pip, cargo
[SessionStart] Per-package configuration:
  - @myorg/web: pnpm (nodejs)
  - @myorg/api: pnpm (nodejs)
  - ml-service: pip (python)
  - core-lib: cargo (rust)
```

## Configuration Hierarchy

### Three-Tier System

Configuration now merges from three levels with proper precedence:

**Precedence**: Package > Workspace > Global

```
~/.claude/settings.json          # Global (lowest priority)
  ↓
workspace-root/.claude/settings.json  # Workspace
  ↓
package-dir/.claude/settings.json     # Package (highest priority)
```

### Example Configuration

**Global** (`~/.claude/settings.json`):
```json
{
  "editor": "code",
  "autoFormat": true,
  "testCoverage": 80
}
```

**Workspace** (`monorepo/.claude/settings.json`):
```json
{
  "testCoverage": 90,
  "strict": true
}
```

**Package** (`monorepo/packages/api/.claude/settings.json`):
```json
{
  "testCoverage": 95
}
```

**Merged result for package**:
```json
{
  "editor": "code",
  "autoFormat": true,
  "testCoverage": 95,  // Package override
  "strict": true        // From workspace
}
```

## Workspace Examples

### pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

Plugin automatically:
- Detects workspace type: `pnpm-workspace`
- Discovers all packages
- Detects ecosystem per package (nodejs, jvm, python, rust)
- Identifies package manager per package

### Nx Monorepo

```json
// nx.json
{
  "npmScope": "myorg"
}
```

Plugin automatically:
- Detects workspace type: `nx`
- Reads project configuration
- Maps dependencies
- Supports mixed ecosystems

### Lerna Monorepo

```json
// lerna.json
{
  "version": "independent",
  "packages": ["packages/*"]
}
```

Plugin automatically:
- Detects workspace type: `lerna`
- Discovers packages
- Respects Lerna configuration

### Mixed-Ecosystem Workspace

```
monorepo/
├── packages/
│   ├── web/          # Node.js + pnpm
│   ├── api/          # Node.js + pnpm
│   └── mobile/       # Node.js + yarn
├── services/
│   ├── analytics/    # Python + poetry
│   └── ml/           # Python + pip
├── libs/
│   ├── core/         # Rust + cargo
│   └── utils/        # Java + gradle
└── pnpm-workspace.yaml
```

Plugin automatically:
- Detects 4 ecosystems: nodejs, python, rust, jvm
- Identifies 5 package managers: pnpm, yarn, poetry, pip, cargo, gradle
- Per-package configuration support
- Cross-ecosystem dependency awareness

## Tool Detection

### Check Required Tools

```javascript
const { ToolDetector, checkEcosystemTools } = require('./scripts/lib/workspace/tool-detection.cjs');

// Check if tools are available
const detector = new ToolDetector();
console.log(`Node.js: ${detector.isAvailable('node')}`);
console.log(`Version: ${detector.getVersion('node')}`);

// Check all tools for an ecosystem
const tools = checkEcosystemTools('nodejs');
console.log(tools);
// { node: true, npm: true, pnpm: true, yarn: false, bun: false }
```

### Installation Guidance

```javascript
const { getInstallationHelp } = require('./scripts/lib/workspace/tool-detection.cjs');

// Get platform-specific installation instructions
const help = getInstallationHelp('pnpm', 'linux');
console.log(help);
/*
Install pnpm using npm:
  npm install -g pnpm

Or using standalone script:
  curl -fsSL https://get.pnpm.io/install.sh | sh -
*/
```

## Command Generation

### Generate Commands for Any Ecosystem

```javascript
const {
  CommandGenerator,
  generateInstallCommand,
  generateTestCommand
} = require('./scripts/lib/workspace/commands.cjs');

// Generate commands for Node.js with pnpm
const gen = new CommandGenerator('nodejs', { packageManager: 'pnpm' });
console.log(gen.install());  // pnpm install
console.log(gen.test());     // pnpm test
console.log(gen.build());    // pnpm build

// Generate for JVM with Gradle wrapper on Windows
const jvmGen = new CommandGenerator('jvm', {
  buildTool: 'gradle',
  useWrapper: true,
  platform: 'win32'
});
console.log(jvmGen.build());  // gradlew.bat build

// Convenience functions
console.log(generateInstallCommand('python', { packageManager: 'poetry' }));
// poetry install

console.log(generateTestCommand('rust'));
// cargo test
```

## Migration Checklist

### For Single-Project Users
- [ ] No action required - everything works as before!
- [ ] Optionally: Explore new workspace features if interested

### For Monorepo Users
- [ ] Verify workspace auto-detection works (check session start hook output)
- [ ] Review configuration hierarchy if using `.claude/` configs
- [ ] Test per-package commands work correctly
- [ ] Optionally: Use new workspace-aware functions in custom hooks

### For Plugin Developers
- [ ] Update custom hooks to use WorkspaceContext if handling monorepos
- [ ] Use workspace-aware package manager functions where appropriate
- [ ] Test hooks in both single-project and workspace contexts

## Troubleshooting

### Workspace Not Detected

**Issue**: Plugin doesn't detect your workspace

**Solutions**:
1. Check for workspace indicator files:
   - pnpm: `pnpm-workspace.yaml`
   - Nx: `nx.json`
   - Lerna: `lerna.json`
   - Yarn: `workspaces` field in root `package.json`
2. Verify file is in workspace root
3. Check session start hook output for detection messages

### Wrong Package Manager Detected

**Issue**: Plugin uses wrong package manager for a package

**Solutions**:
1. Add `.claude/everything-claude-code.package-manager.json` to package directory:
   ```json
   {
     "packageManager": "pnpm"
   }
   ```
2. Add `packageManager` field to package's `package.json`:
   ```json
   {
     "packageManager": "pnpm@8.6.0"
   }
   ```
3. Set `CLAUDE_PACKAGE_MANAGER` environment variable

### Configuration Not Merging

**Issue**: Package config doesn't override workspace config

**Solutions**:
1. Verify config file is valid JSON
2. Check file is in `.claude/` directory
3. Use same config file name (e.g., `settings.json`)
4. Clear config cache: `workspace.getConfig('current')` always reloads

## Support

- **Issues**: https://github.com/anthropics/claude-code/issues
- **Documentation**: See README.md and docs/ directory
- **Examples**: Check examples/ directory for workspace setups

## What's Next

Future enhancements planned:
- `/setup-ecosystem` command for runtime/SDK installation
- Workspace-aware testing commands
- Cross-package dependency analysis
- Monorepo-specific optimization patterns

---

**Remember**: This is a fully backward-compatible release. Single-project workflows continue to work exactly as before with zero changes required!

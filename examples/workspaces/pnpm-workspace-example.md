# pnpm Workspace Example

Example configuration for a pnpm workspace monorepo.

## Project Structure

```
my-monorepo/
├── pnpm-workspace.yaml
├── package.json
├── .claude/
│   └── settings.json           # Workspace-level config
├── packages/
│   ├── web/
│   │   ├── package.json
│   │   └── .claude/
│   │       └── settings.json   # Package-level config
│   ├── api/
│   │   └── package.json
│   └── shared/
│       └── package.json
└── apps/
    ├── mobile/
    │   └── package.json
    └── desktop/
        └── package.json
```

## Configuration Files

### `pnpm-workspace.yaml` (Root)

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

### `package.json` (Root)

```json
{
  "name": "my-monorepo",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "dev": "pnpm --parallel --recursive run dev",
    "build": "pnpm --recursive run build",
    "test": "pnpm --recursive run test",
    "lint": "pnpm --recursive run lint"
  }
}
```

### `.claude/settings.json` (Workspace)

```json
{
  "testCoverage": 80,
  "autoFormat": true,
  "strictMode": true,
  "hooks": {
    "preCommit": ["format", "lint", "test"],
    "postEdit": ["format"]
  }
}
```

### `packages/web/.claude/settings.json` (Package)

```json
{
  "testCoverage": 90,
  "e2eTests": true,
  "deploymentTarget": "vercel"
}
```

## Automatic Detection

When Claude Code runs in this workspace:

```
[SessionStart] Workspace/monorepo detected
[SessionStart] Packages: 5
[SessionStart] Ecosystems: nodejs
[SessionStart] Package managers: pnpm
[SessionStart] Workspace type: pnpm-workspace
```

## Per-Package Operations

Commands automatically work in the correct package context:

```javascript
const workspace = getWorkspaceContext();

// Find which package owns a file
const pkg = workspace.findPackageForFile('/path/to/packages/web/src/App.tsx');
console.log(pkg.name);  // @myorg/web

// Get package manager for that package
const pm = workspace.getPackageManagerForFile('/path/to/packages/web/src/App.tsx');
console.log(pm.name);   // pnpm
```

## Configuration Merging

For `packages/web`:

**Global** (`~/.claude/settings.json`):
```json
{
  "editor": "code"
}
```

**Workspace** (`my-monorepo/.claude/settings.json`):
```json
{
  "testCoverage": 80,
  "autoFormat": true
}
```

**Package** (`packages/web/.claude/settings.json`):
```json
{
  "testCoverage": 90,
  "e2eTests": true
}
```

**Merged result**:
```json
{
  "editor": "code",           // From global
  "testCoverage": 90,         // Package override
  "autoFormat": true,         // From workspace
  "e2eTests": true            // Package-specific
}
```

## Running Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm --recursive run build

# Test specific package
cd packages/web
pnpm test

# Run dev servers in parallel
pnpm --parallel --recursive run dev
```

## Benefits

- **Shared dependencies**: One `node_modules` at root
- **Efficient disk usage**: pnpm's hard-linking
- **Fast installs**: pnpm's content-addressable store
- **Per-package config**: Each package can override settings
- **Automatic detection**: Claude Code understands the structure

## Tips

1. Use `pnpm --filter` for selective operations:
   ```bash
   pnpm --filter @myorg/web run build
   ```

2. Set package manager in root `package.json`:
   ```json
   "packageManager": "pnpm@8.15.0"
   ```

3. Use `.npmrc` for pnpm-specific settings:
   ```
   auto-install-peers=true
   strict-peer-dependencies=false
   ```

4. Add workspace protocol for internal dependencies:
   ```json
   "dependencies": {
     "@myorg/shared": "workspace:*"
   }
   ```

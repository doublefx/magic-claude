# Mixed-Ecosystem Workspace Example

Example configuration for a monorepo with multiple programming languages and ecosystems.

## Project Structure

```
enterprise-monorepo/
├── pnpm-workspace.yaml
├── .claude/
│   └── settings.json
├── packages/
│   ├── web/                    # Node.js + pnpm
│   │   ├── package.json
│   │   └── .claude/
│   │       └── settings.json
│   ├── api/                    # Node.js + pnpm
│   │   └── package.json
│   └── mobile/                 # Node.js + yarn
│       ├── package.json
│       └── yarn.lock
├── services/
│   ├── analytics/              # Python + poetry
│   │   ├── pyproject.toml
│   │   └── poetry.lock
│   ├── ml-pipeline/            # Python + pip
│   │   └── requirements.txt
│   └── data-processor/         # Java + gradle
│       ├── build.gradle
│       └── gradlew
└── libs/
    ├── core/                   # Rust + cargo
    │   └── Cargo.toml
    └── shared-types/           # TypeScript
        └── package.json
```

## Configuration Files

### `pnpm-workspace.yaml` (Root)

```yaml
packages:
  - 'packages/*'
  - 'libs/shared-types'
```

### `.claude/settings.json` (Workspace)

```json
{
  "testCoverage": 80,
  "autoFormat": true,
  "security": {
    "scanOnCommit": true,
    "tools": ["semgrep", "gitleaks"]
  }
}
```

### `packages/web/.claude/settings.json` (Node.js Package)

```json
{
  "ecosystem": "nodejs",
  "packageManager": "pnpm",
  "testCoverage": 90,
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev"
}
```

### `services/analytics/.claude/settings.json` (Python Package)

```json
{
  "ecosystem": "python",
  "packageManager": "poetry",
  "testCoverage": 85,
  "formatter": "ruff",
  "linter": "ruff",
  "typeChecker": "pyright"
}
```

### `services/data-processor/.claude/settings.json` (Java Package)

```json
{
  "ecosystem": "jvm",
  "buildTool": "gradle",
  "testCoverage": 90,
  "useWrapper": true,
  "javaVersion": "17"
}
```

### `libs/core/.claude/settings.json` (Rust Package)

```json
{
  "ecosystem": "rust",
  "testCoverage": 95,
  "buildCommand": "cargo build --release",
  "testCommand": "cargo test"
}
```

## Automatic Detection

When Claude Code runs in this workspace:

```
[SessionStart] Workspace/monorepo detected
[SessionStart] Packages: 8
[SessionStart] Ecosystems: nodejs, python, jvm, rust
[SessionStart] Package managers: pnpm, yarn, poetry, pip, gradle, cargo
[SessionStart] Per-package configuration:
  - @myorg/web: pnpm (nodejs)
  - @myorg/api: pnpm (nodejs)
  - @myorg/mobile: yarn (nodejs)
  - analytics-service: poetry (python)
  - ml-pipeline: pip (python)
  - data-processor: gradle (jvm)
  - core-lib: cargo (rust)
  - @myorg/shared-types: pnpm (nodejs)
```

## Workspace API Usage

### Find Package by File

```javascript
const { getWorkspaceContext } = require('./scripts/lib/workspace-context.cjs');

const workspace = getWorkspaceContext();

// Find Python service
const pkg = workspace.findPackageForFile(
  '/path/to/services/analytics/src/analyzer.py'
);
console.log(pkg.name);       // analytics-service
console.log(pkg.ecosystem);  // python

// Find Rust library
const rustPkg = workspace.findPackageForFile(
  '/path/to/libs/core/src/lib.rs'
);
console.log(rustPkg.ecosystem);  // rust
```

### Get Package Manager by Ecosystem

```javascript
const { getAllWorkspacePackageManagers } = require('./scripts/lib/package-manager.cjs');

const allPMs = getAllWorkspacePackageManagers();

// Group by ecosystem
const byEcosystem = allPMs.reduce((acc, pm) => {
  if (!acc[pm.ecosystem]) acc[pm.ecosystem] = [];
  acc[pm.ecosystem].push(pm);
  return acc;
}, {});

console.log(byEcosystem);
/*
{
  nodejs: [
    { packageName: '@myorg/web', name: 'pnpm', ... },
    { packageName: '@myorg/api', name: 'pnpm', ... },
    { packageName: '@myorg/mobile', name: 'yarn', ... }
  ],
  python: [
    { packageName: 'analytics-service', name: 'poetry', ... },
    { packageName: 'ml-pipeline', name: 'pip', ... }
  ],
  jvm: [
    { packageName: 'data-processor', name: 'gradle', ... }
  ],
  rust: [
    { packageName: 'core-lib', name: 'cargo', ... }
  ]
}
*/
```

### Generate Commands by Ecosystem

```javascript
const { CommandGenerator } = require('./scripts/lib/workspace/commands.cjs');

// Node.js commands
const nodeGen = new CommandGenerator('nodejs', { packageManager: 'pnpm' });
console.log(nodeGen.install());  // pnpm install
console.log(nodeGen.test());     // pnpm test

// Python commands
const pyGen = new CommandGenerator('python', { packageManager: 'poetry' });
console.log(pyGen.install());    // poetry install
console.log(pyGen.test());       // poetry run pytest

// JVM commands
const jvmGen = new CommandGenerator('jvm', { buildTool: 'gradle', useWrapper: true });
console.log(jvmGen.build());     // ./gradlew build
console.log(jvmGen.test());      // ./gradlew test

// Rust commands
const rustGen = new CommandGenerator('rust');
console.log(rustGen.build());    // cargo build
console.log(rustGen.test());     // cargo test
```

### Check Tool Availability

```javascript
const { checkEcosystemTools } = require('./scripts/lib/workspace/tool-detection.cjs');

// Check Node.js tools
const nodeTools = checkEcosystemTools('nodejs');
console.log(nodeTools);
// { node: true, npm: true, pnpm: true, yarn: true, bun: false }

// Check Python tools
const pyTools = checkEcosystemTools('python');
console.log(pyTools);
// { python: true, python3: true, pip: true, pip3: true, poetry: true, uv: false }

// Check JVM tools
const jvmTools = checkEcosystemTools('jvm');
console.log(jvmTools);
// { java: true, javac: true, mvn: false, gradle: true }

// Check Rust tools
const rustTools = checkEcosystemTools('rust');
console.log(rustTools);
// { rustc: true, cargo: true }
```

## Running Commands

### Node.js Packages

```bash
# Install dependencies for web
cd packages/web
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

### Python Services

```bash
# Install dependencies for analytics
cd services/analytics
poetry install

# Run tests
poetry run pytest

# Start service
poetry run python -m analytics
```

### Java Services

```bash
# Build Java service
cd services/data-processor
./gradlew build

# Run tests
./gradlew test

# Run application
./gradlew run
```

### Rust Libraries

```bash
# Build Rust library
cd libs/core
cargo build --release

# Run tests
cargo test

# Check code
cargo clippy
```

## Cross-Package Dependencies

### Node.js → Rust (via NAPI)

```json
// packages/web/package.json
{
  "dependencies": {
    "@myorg/core-native": "workspace:*"
  }
}
```

### Python → Java (via gRPC)

```toml
# services/analytics/pyproject.toml
[tool.poetry.dependencies]
grpcio = "^1.60.0"
data-processor-proto = {path = "../data-processor/proto"}
```

### TypeScript Types Shared Across Languages

```json
// libs/shared-types/package.json
{
  "name": "@myorg/shared-types",
  "scripts": {
    "generate:python": "json2python types/ -o ../services/analytics/types/",
    "generate:java": "json2java types/ -o ../services/data-processor/src/main/java/types/",
    "generate:rust": "json2rust types/ -o ../libs/core/src/types/"
  }
}
```

## Benefits

- **Single repository**: All code in one place
- **Shared tooling**: CI/CD, linters, formatters
- **Cross-language types**: Type safety across ecosystems
- **Per-package optimization**: Each package uses best tools for its language
- **Unified configuration**: Workspace settings with package overrides
- **Automatic detection**: Claude Code understands all ecosystems

## Tips

1. **Use a task runner** for cross-package commands:
   ```json
   // package.json (root)
   {
     "scripts": {
       "build:all": "nx run-many --target=build --all",
       "test:all": "nx run-many --target=test --all"
     }
   }
   ```

2. **Set up shared dev containers**:
   ```json
   // .devcontainer/devcontainer.json
   {
     "features": {
       "ghcr.io/devcontainers/features/node:1": {},
       "ghcr.io/devcontainers/features/python:1": {},
       "ghcr.io/devcontainers/features/java:1": {},
       "ghcr.io/devcontainers/features/rust:1": {}
     }
   }
   ```

3. **Use workspace protocols** for internal dependencies:
   ```json
   "dependencies": {
     "@myorg/shared-types": "workspace:*"
   }
   ```

4. **Configure per-ecosystem hooks** in `.claude/settings.json`:
   ```json
   {
     "hooks": {
       "nodejs": {
         "postEdit": ["prettier"]
       },
       "python": {
         "postEdit": ["ruff format"]
       },
       "jvm": {
         "postEdit": ["google-java-format"]
       },
       "rust": {
         "postEdit": ["rustfmt"]
       }
     }
   }
   ```

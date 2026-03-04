# Caching Strategies

## Dependency Caching

Cache downloaded dependencies to avoid re-downloading on every build.

**Node.js**:
```yaml
cache:
  key:
    files:
      - package-lock.json  # npm
      - yarn.lock          # yarn
      - pnpm-lock.yaml     # pnpm
  paths:
    - node_modules/
    - .npm/
```

**Python**:
```yaml
cache:
  key:
    files:
      - requirements.txt
      - pyproject.toml
  paths:
    - .cache/pip
    - .venv/
```

**Java (Maven)**:
```yaml
cache:
  key:
    files:
      - pom.xml
  paths:
    - .m2/repository
```

**Java (Gradle)**:
```yaml
cache:
  key:
    files:
      - build.gradle
      - gradle.properties
  paths:
    - .gradle/caches
    - .gradle/wrapper
```

## Build Cache

Cache compiled artifacts to avoid re-compilation.

**Gradle Configuration Cache**:
```bash
./gradlew build --configuration-cache
```

**Docker Layer Cache**:
```dockerfile
# Good: Dependencies cached separately
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Bad: Changes to any file invalidate all caches
COPY . .
RUN npm ci && npm run build
```

## Cache Invalidation

Invalidate cache when dependencies change.

**GitHub Actions**:
```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**Key Principle**: Always hash lockfiles for cache keys. Never cache build outputs that contain secrets. Scope cache keys by OS when cross-platform.

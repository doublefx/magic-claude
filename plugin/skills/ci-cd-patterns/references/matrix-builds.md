# Matrix Builds

## Multi-Version Testing

Test across multiple language versions and operating systems.

**GitHub Actions**:
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
runs-on: ${{ matrix.os }}
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

**GitLab CI**:
```yaml
test:
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.10", "3.11", "3.12"]
        OS: ["ubuntu-latest", "alpine"]
  image: python:${PYTHON_VERSION}-${OS}
```

## Matrix Combinations

Test specific combinations of variables (include/exclude overrides).

```yaml
strategy:
  matrix:
    include:
      - node: 18
        npm: 9
      - node: 20
        npm: 10
      - node: 22
        npm: 10
```

**Tips**:
- Use `exclude` to remove unsupported combinations
- Use `include` to add extra variables to specific matrix entries
- Set `fail-fast: false` to let all matrix jobs run even if one fails
- Use `continue-on-error: true` for experimental matrix entries

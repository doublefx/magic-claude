# Pipeline Stages

## Build Stage

The build stage compiles code, runs static analysis, and prepares artifacts.

**Key Activities**:
- Compile source code
- Run linters and formatters
- Execute static analysis (SAST)
- Generate build artifacts

**Best Practices**:
- Use build caching to speed up compilation
- Run quick checks (linting) before expensive operations (compilation)
- Version artifacts with commit SHA and semantic versions
- Fail fast on compilation errors

**Example (Node.js)**:
```yaml
build:
  stage: build
  script:
    - npm ci
    - npm run lint
    - npm run build
  artifacts:
    paths:
      - dist/
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
```

## Test Stage

The test stage validates code correctness, quality, and security.

**Types of Tests**:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test complete user workflows
- **Security Tests**: SAST, DAST, dependency scanning
- **Performance Tests**: Load testing, stress testing

**Best Practices**:
- Run tests in parallel to save time
- Use test matrix for multi-version testing
- Collect and publish code coverage
- Fail on coverage threshold violations

**Example (Python)**:
```yaml
test:
  stage: test
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.10", "3.11", "3.12"]
  script:
    - pytest --cov=. --cov-report=xml
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'
```

## Deploy Stage

The deploy stage releases code to target environments.

**Environments**:
- **Development**: Continuous deployment on every commit
- **Staging**: Manual or automatic after tests pass
- **Production**: Manual approval required, tagged releases

**Best Practices**:
- Use environment-specific configurations
- Implement health checks before declaring success
- Support rollback mechanisms
- Implement deployment gates and approvals

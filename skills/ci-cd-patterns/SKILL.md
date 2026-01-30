---
name: ci-cd-patterns
description: Comprehensive CI/CD patterns, best practices, and implementation strategies for GitHub Actions, GitLab CI, and Bitbucket Pipelines. Use when implementing deployment pipelines, caching strategies, matrix builds, security scanning, or deployment strategies.
user-invocable: false
---

# CI/CD Patterns Skill

This skill provides comprehensive knowledge of modern CI/CD patterns, best practices, and implementation strategies for building robust deployment pipelines.

## Pipeline Stages

### Build Stage
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

### Test Stage
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

### Deploy Stage
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

## Caching Strategies

### Dependency Caching
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

### Build Cache
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

### Cache Invalidation
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

## Matrix Builds

### Multi-Version Testing
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

### Matrix Combinations
Test specific combinations of variables.

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

## Deployment Strategies

### Rolling Update
Gradually replace old pods with new pods.

**Characteristics**:
- Zero downtime
- Gradual rollout
- Easy rollback

**Kubernetes Deployment**:
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 1
```

**Process**:
1. Create new pods (maxSurge)
2. Wait for new pods to be ready
3. Terminate old pods (maxUnavailable)
4. Repeat until all pods are updated

### Blue/Green Deployment
Run two identical environments (blue and green), switch traffic between them.

**Characteristics**:
- Instant rollback (switch back to blue)
- Full environment isolation
- Requires double resources

**Implementation**:
```bash
# Deploy to green environment
kubectl apply -f deployment-green.yaml

# Test green environment
curl https://green.example.com/health

# Switch traffic to green
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue running for rollback
```

### Canary Deployment
Route small percentage of traffic to new version, gradually increase.

**Characteristics**:
- Risk mitigation
- Progressive rollout
- Monitoring-driven

**Istio Virtual Service**:
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
  - myapp.example.com
  http:
  - match:
    - headers:
        user-agent:
          regex: ".*canary.*"
    route:
    - destination:
        host: myapp-v2
  - route:
    - destination:
        host: myapp-v1
      weight: 90
    - destination:
        host: myapp-v2
      weight: 10
```

**Process**:
1. Deploy v2 alongside v1
2. Route 10% traffic to v2
3. Monitor metrics (error rate, latency)
4. If good, increase to 25%, 50%, 75%, 100%
5. If bad, rollback to 0%

## GitOps Patterns

### Pull-Based Deployment
Cluster pulls desired state from Git repository.

**ArgoCD**:
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: myapp
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**FluxCD**:
```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/myapp
  ref:
    branch: main
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: myapp
  namespace: flux-system
spec:
  interval: 5m
  path: ./k8s
  prune: true
  sourceRef:
    kind: GitRepository
    name: myapp
```

### Environment Promotion
Promote releases through environments using Git.

**Process**:
1. Developer merges to `main` branch
2. CI builds and tests
3. CI updates `dev` environment manifest
4. ArgoCD deploys to dev cluster
5. After testing, promote to `staging` branch
6. ArgoCD deploys to staging cluster
7. After approval, tag release and promote to `prod`
8. ArgoCD deploys to production cluster

## Security Scanning Integration

### Container Scanning (Trivy)
```yaml
trivy:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH myapp:$CI_COMMIT_SHA
  allow_failure: false
```

### Secret Scanning (GitLeaks)
```yaml
gitleaks:
  stage: security
  image:
    name: zricethezav/gitleaks:latest
    entrypoint: [""]
  script:
    - gitleaks detect --source . --verbose
```

### SAST (Semgrep)
```yaml
semgrep:
  stage: security
  image: returntocorp/semgrep:latest
  script:
    - semgrep --config=p/security-audit --config=p/owasp-top-ten --sarif > semgrep.sarif
  artifacts:
    reports:
      sast: semgrep.sarif
```

### Dependency Scanning
```yaml
# Node.js
npm audit:
  script:
    - npm audit --audit-level=moderate

# Python
safety:
  script:
    - pip install safety
    - safety check

# Java
dependency-check:
  script:
    - mvn org.owasp:dependency-check-maven:check
```

## Container Registry Best Practices

### Image Tagging Strategy
```bash
# Multi-tag strategy
docker tag myapp:build-123 myapp:$COMMIT_SHA
docker tag myapp:build-123 myapp:$BRANCH_NAME
docker tag myapp:build-123 myapp:latest
docker tag myapp:build-123 myapp:v1.2.3

# Push all tags
docker push --all-tags myapp
```

### Immutable Tags
```yaml
# Use specific SHA tags for production
deployment:
  production:
    image: myapp@sha256:abc123...
```

### Registry Cleanup
```bash
# Delete old images (keep last 10 versions)
gcloud container images list-tags gcr.io/myproject/myapp \
  --format="get(digest)" \
  --sort-by=~timestamp \
  --limit=999999 \
  | tail -n +11 \
  | xargs -I {} gcloud container images delete gcr.io/myproject/myapp@sha256:{} --quiet
```

## Performance Optimization

### Parallel Job Execution
```yaml
# GitLab CI DAG
build:
  stage: build
  script: npm run build

test:unit:
  stage: test
  needs: [build]  # Only depends on build
  script: npm test

test:e2e:
  stage: test
  needs: [build]  # Runs in parallel with test:unit
  script: npm run test:e2e

deploy:
  stage: deploy
  needs: [test:unit, test:e2e]  # Waits for both tests
  script: ./deploy.sh
```

### Conditional Execution
```yaml
# GitHub Actions: Skip jobs based on conditions
deploy:
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy
      run: ./deploy.sh

# GitLab CI: Only run on specific branches
deploy:
  only:
    - main
    - /^release-.*$/
  except:
    - schedules
```

### Resource Optimization
```yaml
# Use resource requests and limits
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Monitoring and Observability

### Metrics Collection
```yaml
# Prometheus metrics
- name: metrics
  containerPort: 9090
  protocol: TCP

# Pod annotations for Prometheus
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "9090"
  prometheus.io/path: "/metrics"
```

### Health Checks
```yaml
# Kubernetes health checks
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 5
```

### Structured Logging
```javascript
// JSON structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'Request processed',
  requestId: req.id,
  method: req.method,
  path: req.path,
  duration: elapsed,
  timestamp: new Date().toISOString()
}));
```

## Best Practices Summary

1. **Pipeline Design**
   - Keep pipelines simple and maintainable
   - Use reusable components (actions, includes, pipes)
   - Implement proper error handling
   - Document pipeline behavior

2. **Security**
   - Scan code, dependencies, and containers
   - Use secret management (never hardcode secrets)
   - Implement least privilege principle
   - Regular security audits

3. **Performance**
   - Cache dependencies and build artifacts
   - Run jobs in parallel when possible
   - Use matrix builds for multi-version testing
   - Optimize Docker layer caching

4. **Reliability**
   - Implement health checks
   - Use retry logic for flaky steps
   - Support rollback mechanisms
   - Monitor pipeline success rates

5. **Observability**
   - Collect metrics and logs
   - Publish test results and coverage
   - Track deployment success rates
   - Alert on pipeline failures

## Common Pitfalls to Avoid

1. **Caching Issues**
   - Not using lockfile hashes for cache keys
   - Caching too much (including build outputs)
   - Not implementing cache invalidation

2. **Security**
   - Hardcoding secrets in code or configs
   - Running containers as root
   - Not scanning for vulnerabilities
   - Using `latest` tags in production

3. **Performance**
   - Sequential execution of independent jobs
   - Not using caching at all
   - Rebuilding unchanged layers

4. **Reliability**
   - No health checks or readiness probes
   - Missing rollback strategies
   - No deployment gates or approvals
   - Flaky tests without retries

5. **Maintainability**
   - Copy-pasting pipeline configs
   - Not documenting environment variables
   - Complex, hard-to-understand pipelines
   - No versioning of pipeline configs

## Further Learning

- **GitHub Actions**: https://docs.github.com/en/actions
- **GitLab CI**: https://docs.gitlab.com/ee/ci/
- **Bitbucket Pipelines**: https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/
- **Kubernetes**: https://kubernetes.io/docs/
- **Helm**: https://helm.sh/docs/
- **ArgoCD**: https://argo-cd.readthedocs.io/
- **Trivy**: https://aquasecurity.github.io/trivy/
- **Semgrep**: https://semgrep.dev/docs/

# CI/CD Pipeline Generation Guide

This guide explains how to use the CI/CD pipeline generation features in Magic Claude to create modern, production-ready CI/CD pipelines for your projects.

## Table of Contents

- [Quick Start](#quick-start)
- [Supported Platforms](#supported-platforms)
- [Pipeline Generation](#pipeline-generation)
- [Platform Comparison](#platform-comparison)
- [Docker Integration](#docker-integration)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Security Scanning](#security-scanning)
- [Customization Guide](#customization-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Generate a Pipeline

The simplest way to generate a CI/CD pipeline is to use the `/ci-cd` command:

```bash
/ci-cd github-actions
```

This will:
1. Detect your project type (Node.js, Python, Java Maven, or Java Gradle)
2. Select the appropriate template
3. Generate a complete CI/CD pipeline configuration
4. Place it in the correct location for your chosen platform

### Available Platforms

- `github-actions` - GitHub Actions workflow (`.github/workflows/ci.yml`)
- `gitlab-ci` - GitLab CI configuration (`.gitlab-ci.yml`)
- `bitbucket-pipelines` - Bitbucket Pipelines (` bitbucket-pipelines.yml`)

### Generate Additional Files

You can also generate Docker, Kubernetes, and security scanning configurations:

```bash
/ci-cd github-actions docker kubernetes security
```

## Supported Platforms

### GitHub Actions

**Best for**: GitHub-hosted projects, open-source, integrated security scanning

**Features**:
- Reusable workflows
- Matrix builds (multi-version testing)
- GitHub Marketplace actions
- Integrated security scanning (CodeQL, Dependabot)
- Generous free tier for public repositories

**Output**: `.github/workflows/ci.yml`

**Example**:
```bash
/ci-cd github-actions
```

### GitLab CI

**Best for**: Self-hosted needs, complex pipelines, built-in DevOps features

**Features**:
- DAG pipelines (parallel execution with `needs` keyword)
- Parent-child pipelines for monorepos
- Native security scanning (SAST, DAST, dependency scanning)
- Integrated container registry
- Auto DevOps

**Output**: `.gitlab-ci.yml`

**Example**:
```bash
/ci-cd gitlab-ci
```

### Bitbucket Pipelines

**Best for**: Atlassian ecosystem, Jira integration, simplicity

**Features**:
- Parallel steps
- Bitbucket Pipes (reusable components)
- Jira integration and automation
- Deployment tracking
- Simple YAML configuration

**Output**: `bitbucket-pipelines.yml`

**Example**:
```bash
/ci-cd bitbucket-pipelines
```

## Pipeline Generation

### Automatic Project Detection

The pipeline generator automatically detects your project type based on manifest files:

| Project Type | Detection Files |
|--------------|-----------------|
| Node.js | `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Python | `pyproject.toml`, `requirements.txt`, `poetry.lock`, `uv.lock` |
| Java (Maven) | `pom.xml`, `mvnw` |
| Java (Gradle) | `build.gradle`, `build.gradle.kts`, `gradlew` |

### Priority Order

When multiple project types are detected (e.g., both Maven and Gradle), the generator follows this priority:

1. **Gradle** (highest priority)
2. **Maven**
3. **Node.js**
4. **Python** (lowest priority)

This ensures the most specific build tool is selected.

### Generated Pipeline Features

All generated pipelines include:

- **Multi-version testing**: Test across multiple language versions (Node 18/20/22, Python 3.10/3.11/3.12, Java 11/17/21)
- **Dependency caching**: Smart caching with lockfile-based cache keys
- **Security scanning**: Integrated vulnerability scanning
- **Code coverage**: Coverage collection and reporting
- **Parallel execution**: Independent jobs run concurrently
- **Best practices**: Following platform-specific conventions

## Platform Comparison

### Feature Matrix

| Feature | GitHub Actions | GitLab CI | Bitbucket Pipelines |
|---------|---------------|-----------|---------------------|
| Matrix Builds | ✅ | ✅ | ✅ |
| Caching | ✅ | ✅ | ✅ |
| Parallel Execution | ✅ | ✅ (DAG) | ✅ |
| Reusable Components | ✅ Workflows | ✅ Extends/Includes | ✅ Pipes |
| Container Registry | ✅ GHCR | ✅ Built-in | ✅ |
| Security Scanning | ✅ CodeQL | ✅ Native SAST | ⚠️ Third-party |
| Self-hosted Runners | ✅ | ✅ | ✅ |
| Free Tier (Public) | ✅ Generous | ✅ Very Generous | ✅ Limited |
| Free Tier (Private) | ✅ 2000 min/month | ✅ 400 min/month | ✅ 50 min/month |

### When to Choose Each

#### GitHub Actions
Choose when:
- Your code is on GitHub
- You need extensive marketplace of actions
- You want integrated security features (CodeQL, Dependabot)
- You're building open-source projects

#### GitLab CI
Choose when:
- You need self-hosted solution
- You have complex pipeline dependencies (DAG pipelines)
- You want all-in-one DevOps platform (registry, security, monitoring)
- You have monorepo projects (parent-child pipelines)

#### Bitbucket Pipelines
Choose when:
- You're using Atlassian stack (Jira, Confluence)
- You want simple, straightforward configuration
- You need tight Jira integration
- You prefer cloud-hosted simplicity

## Docker Integration

### Generate Dockerfile

```bash
/ci-cd github-actions docker
```

This generates:
- `Dockerfile` - Multi-stage build optimized for your project type
- `.dockerignore` - Excludes unnecessary files from build

### Dockerfile Features

Generated Dockerfiles include:

- **Multi-stage builds**: Separate stages for dependencies, build, and production
- **Layer optimization**: Smart layer ordering for maximum cache efficiency
- **Security hardening**: Non-root user, minimal base images
- **Health checks**: Built-in health check endpoints
- **BuildKit support**: Advanced caching and build features

### Example: Node.js Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init
USER node
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

## Kubernetes Deployment

### Generate Kubernetes Manifests

```bash
/ci-cd github-actions kubernetes
```

This creates a `k8s/` directory with:

- `deployment.yaml` - Pod deployment configuration
- `service.yaml` - Service definitions (ClusterIP, LoadBalancer, NodePort)
- `ingress.yaml` - Ingress with TLS support
- `configmap.yaml` - Application configuration
- `secret.yaml` - Secret management templates
- `hpa.yaml` - Horizontal Pod Autoscaler

### Kubernetes Best Practices

Generated manifests include:

- **Resource limits**: CPU and memory requests/limits
- **Health checks**: Liveness, readiness, and startup probes
- **Security context**: Non-root user, read-only filesystem
- **Pod disruption budget**: Ensures minimum availability
- **Affinity rules**: Pod anti-affinity for high availability
- **ConfigMaps and Secrets**: Externalized configuration

### Helm Charts

For more advanced deployments, Helm charts are available in `plugin/templates/helm/app-chart/`:

```bash
helm install myapp plugin/templates/helm/app-chart \
  --set image.repository=myapp \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=myapp.example.com
```

**Features**:
- Parameterized deployments
- Multiple environment support (dev, staging, prod)
- Value overrides
- Helm hooks for database migrations
- Chart dependencies

## Security Scanning

### Generate Security Configs

```bash
/ci-cd github-actions security
```

This generates:

- `trivy.yaml` - Container vulnerability scanning
- `.trivyignore` - Trivy ignore patterns
- `.gitleaks.toml` - Secret detection configuration
- `semgrep.yaml` - SAST rules
- `.semgrepignore` - Semgrep exclusions

### Security Tools

#### Trivy
Scans container images and filesystems for:
- CVE vulnerabilities
- Configuration issues
- Hardcoded secrets

```bash
trivy image myapp:latest
```

#### GitLeaks
Scans git history for exposed secrets:
- API keys
- Passwords
- Private keys
- AWS credentials

```bash
gitleaks detect --source . --verbose
```

#### Semgrep
Static application security testing (SAST):
- SQL injection
- XSS vulnerabilities
- Command injection
- Insecure deserialization

```bash
semgrep --config=p/security-audit --config=p/owasp-top-ten
```

### Security in CI/CD

All generated pipelines include security scanning stages:

- **Container scanning**: Trivy checks Docker images
- **Secret detection**: GitLeaks scans commits
- **SAST**: Semgrep analyzes code
- **Dependency scanning**: npm audit, Safety, OWASP Dependency-Check

## Customization Guide

### Modify Pipeline Configuration

After generation, customize the pipeline for your needs:

#### GitHub Actions

Edit `.github/workflows/ci.yml`:

```yaml
# Add custom environment variables
env:
  CUSTOM_VAR: value

# Add custom jobs
custom-job:
  runs-on: ubuntu-latest
  steps:
    - name: Custom step
      run: echo "Custom logic"

# Modify matrix
strategy:
  matrix:
    node-version: [18, 20, 22]
    os: [ubuntu-latest, windows-latest]  # Added Windows
```

#### GitLab CI

Edit `.gitlab-ci.yml`:

```yaml
# Add custom stages
stages:
  - build
  - test
  - custom  # New stage
  - deploy

# Add custom job
custom:
  stage: custom
  script:
    - ./custom-script.sh
  only:
    - main
```

#### Bitbucket Pipelines

Edit `bitbucket-pipelines.yml`:

```yaml
# Add custom step
definitions:
  steps:
    - step: &custom-step
        name: Custom Step
        script:
          - echo "Custom logic"

pipelines:
  default:
    - step: *custom-step
```

### Template Variables

Common variables to customize:

- **Node versions**: Change `node-version: [18, 20, 22]` to your preferred versions
- **Python versions**: Change `python-version: ['3.10', '3.11', '3.12']`
- **Java versions**: Change `java-version: [11, 17, 21]`
- **Docker registry**: Update `REGISTRY` environment variable
- **Deployment environments**: Modify environment names (dev, staging, prod)

## Best Practices

### Caching

- Use lockfile hashes for cache keys
- Cache dependencies, not build outputs
- Implement cache invalidation when dependencies change

```yaml
# Good: Cache based on lockfile
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/

# Bad: Static cache key (never invalidates)
cache:
  key: node-modules
  paths:
    - node_modules/
```

### Secrets Management

- **Never hardcode secrets** in pipeline configs
- Use platform secret storage (GitHub Secrets, GitLab CI/CD variables, Bitbucket Repository variables)
- Rotate secrets regularly
- Use least privilege principle

```yaml
# Good: Use secrets from vault
env:
  API_KEY: ${{ secrets.API_KEY }}

# Bad: Hardcoded secret
env:
  API_KEY: "sk-1234567890abcdef"
```

### Parallel Execution

- Run independent jobs in parallel
- Use matrix builds for multi-version testing
- Minimize sequential dependencies

```yaml
# Good: Parallel jobs
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    runs-on: ubuntu-latest
    steps: [...]

  security:
    runs-on: ubuntu-latest
    steps: [...]

# Jobs run in parallel by default
```

### Resource Optimization

- Use appropriate runner sizes
- Enable caching to reduce build times
- Skip unnecessary steps with conditionals
- Clean up old artifacts

```yaml
# Skip deploy on non-main branches
deploy:
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps: [...]
```

## Troubleshooting

### Pipeline Not Triggering

**GitHub Actions**:
- Check workflow file is in `.github/workflows/`
- Verify `on:` triggers are correct
- Check repository Actions are enabled

**GitLab CI**:
- Verify `.gitlab-ci.yml` is in repository root
- Check GitLab Runner is available
- Review pipeline schedule settings

**Bitbucket Pipelines**:
- Ensure `bitbucket-pipelines.yml` is in repository root
- Check Pipelines are enabled in repository settings
- Verify syntax is correct (YAML validation)

### Caching Issues

**Cache not working**:
- Verify cache key includes lockfile
- Check cache paths are correct
- Ensure cache size is under platform limits

**Stale cache**:
- Update cache key to include version
- Manually clear cache in platform settings
- Use fallback cache keys with restore-keys

### Build Failures

**Dependency installation fails**:
- Check lockfile is committed
- Verify package manager version
- Clear cache and rebuild

**Tests failing**:
- Run tests locally first
- Check environment variables
- Verify test database/services are available

**Docker build fails**:
- Check Dockerfile syntax
- Verify base image exists
- Review build logs for specific errors

### Deployment Issues

**Kubernetes deployment stuck**:
- Check pod logs: `kubectl logs deployment/myapp`
- Verify health checks are passing
- Check resource limits aren't too restrictive

**Health checks failing**:
- Increase `initialDelaySeconds`
- Verify health check endpoint exists
- Check application starts successfully

## Additional Resources

### Documentation

- **GitHub Actions**: https://docs.github.com/en/actions
- **GitLab CI**: https://docs.gitlab.com/ee/ci/
- **Bitbucket Pipelines**: https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/

### Tools

- **Trivy**: https://aquasecurity.github.io/trivy/
- **GitLeaks**: https://github.com/gitleaks/gitleaks
- **Semgrep**: https://semgrep.dev/docs/
- **Helm**: https://helm.sh/docs/
- **kubectl**: https://kubernetes.io/docs/reference/kubectl/

### Skills and Agents

- **CI/CD Patterns Skill**: `/use ci-cd-patterns` - Learn CI/CD best practices
- **CI/CD Architect Agent**: `/agent ci-cd-architect` - Get expert pipeline design advice

## Examples

### Full Stack Node.js Application

```bash
# Generate complete CI/CD setup
/ci-cd github-actions docker kubernetes security

# This creates:
# - .github/workflows/ci.yml
# - Dockerfile
# - .dockerignore
# - k8s/deployment.yaml
# - k8s/service.yaml
# - k8s/ingress.yaml
# - trivy.yaml
# - .gitleaks.toml
# - semgrep.yaml
```

### Python API Service

```bash
# Generate GitLab CI with Docker
/ci-cd gitlab-ci docker

# This creates:
# - .gitlab-ci.yml
# - Dockerfile
# - .dockerignore
```

### Java Microservice

```bash
# Generate Bitbucket Pipelines with Kubernetes
/ci-cd bitbucket-pipelines kubernetes

# This creates:
# - bitbucket-pipelines.yml
# - k8s/ directory with manifests
```

## Support

If you encounter issues or have questions:

1. Check this documentation
2. Review the generated pipeline comments
3. Consult the CI/CD Patterns skill: `/use ci-cd-patterns`
4. Ask the CI/CD Architect agent: `/agent ci-cd-architect`
5. Review platform-specific documentation

---

**Last Updated**: 2026-01-25
**Version**: 1.0.0

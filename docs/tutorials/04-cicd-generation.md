# Tutorial 4: CI/CD Pipeline Generation

**Duration**: 20 minutes
**Prerequisites**: Tutorial 01 completed, a project (Python, Java, or Node.js)
**Learning Goals**: Generate CI/CD pipelines, customize templates, deploy to production

---

## Overview

This tutorial covers one-command CI/CD pipeline generation for:
- GitHub Actions
- GitLab CI
- Bitbucket Pipelines

Plus Docker and Kubernetes deployment configurations.

---

## Step 1: Choose Your Platform (2 minutes)

### GitHub Actions
- **Best for**: GitHub-hosted projects
- **Features**: Matrix builds, reusable workflows, GitHub Marketplace actions
- **Free tier**: 2,000 minutes/month

### GitLab CI
- **Best for**: GitLab-hosted projects, self-hosted runners
- **Features**: DAG pipelines, parent-child pipelines, Auto DevOps
- **Free tier**: 400 minutes/month

### Bitbucket Pipelines
- **Best for**: Bitbucket-hosted projects, Atlassian integration
- **Features**: Parallel steps, Pipes, Jira integration
- **Free tier**: 50 minutes/month

---

## Step 2: Generate GitHub Actions Pipeline (5 minutes)

### For Python Projects

```bash
cd your-python-project

# Start Claude Code
claude
```

**Ask Claude**:
```
/ci-cd github-actions python
```

**Generated File**: `.github/workflows/ci.yml`

```yaml
name: Python CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.cache/uv
            ~/.cache/pip
          key: ${{ runner.os }}-python-${{ matrix.python-version }}-${{ hashFiles('**/requirements.txt', '**/pyproject.toml') }}

      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh

      - name: Install dependencies
        run: uv pip install -r requirements.txt

      - name: Lint with Ruff
        run: ruff check .

      - name: Type check with Pyright
        run: pyright .

      - name: Test with pytest
        run: pytest --cov=. --cov-report=xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          flags: unittests
          name: codecov-umbrella

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: |
          python3 -m pip install semgrep
          semgrep --config auto .

  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: myapp:${{ github.sha }},myapp:latest
          cache-from: type=registry,ref=myapp:buildcache
          cache-to: type=registry,ref=myapp:buildcache,mode=max
```

### For Java Maven Projects

```
/ci-cd github-actions java-maven
```

### For Node.js Projects

```
/ci-cd github-actions nodejs
```

---

## Step 3: Configure Secrets (3 minutes)

### Required Secrets

Go to GitHub Settings → Secrets and variables → Actions:

**For Docker**:
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub token

**For Deployment**:
- `SSH_PRIVATE_KEY`: For SSH deployments
- `KUBERNETES_TOKEN`: For Kubernetes deployments
- `AWS_ACCESS_KEY_ID`: For AWS deployments
- `AWS_SECRET_ACCESS_KEY`: For AWS deployments

### Add a Secret via CLI

```bash
# Using GitHub CLI
gh secret set DOCKER_USERNAME

# Paste your username when prompted
```

---

## Step 4: Test the Pipeline (5 minutes)

### Push to Trigger

```bash
# Create a new branch
git checkout -b feature/ci-cd-setup

# Add the workflow
git add .github/workflows/ci.yml

# Commit
git commit -m "feat: add GitHub Actions CI/CD pipeline"

# Push
git push -u origin feature/ci-cd-setup

# Create PR
gh pr create --title "Add CI/CD pipeline" --body "Adds GitHub Actions workflow"
```

### Monitor the Workflow

```bash
# View workflow runs
gh run list

# Watch a specific run
gh run watch

# View logs
gh run view --log
```

### Check Results

Visit: `https://github.com/<owner>/<repo>/actions`

You should see:
- ✅ Test job (matrix: Python 3.10, 3.11, 3.12)
- ✅ Security job (Semgrep scan)
- ✅ Build job (Docker image built)

---

## Step 5: Generate GitLab CI Pipeline (3 minutes)

### Switch to GitLab CI

**Ask Claude**:
```
/ci-cd gitlab-ci python
```

**Generated File**: `.gitlab-ci.yml`

```yaml
stages:
  - test
  - security
  - build
  - deploy

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"
  DOCKER_DRIVER: overlay2

.cache_template: &cache_template
  cache:
    key: "$CI_COMMIT_REF_SLUG"
    paths:
      - .cache/pip
      - .cache/uv

test:
  stage: test
  image: python:3.12-slim
  <<: *cache_template
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.10", "3.11", "3.12"]
  script:
    - curl -LsSf https://astral.sh/uv/install.sh | sh
    - export PATH="$HOME/.cargo/bin:$PATH"
    - uv pip install -r requirements.txt
    - ruff check .
    - pyright .
    - pytest --cov=. --cov-report=term --cov-report=xml
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

security:
  stage: security
  image: returntocorp/semgrep
  script:
    - semgrep --config auto .
  allow_failure: true

build:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
  only:
    - main
```

---

## Step 6: Docker Configuration (2 minutes)

### Generate Dockerfile

**Ask Claude**:
```
"Generate a Docker multi-stage build for Python FastAPI"
```

**Generated**: `Dockerfile`

```dockerfile
# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv
RUN pip install uv

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN uv pip install --system -r requirements.txt

# Copy source
COPY . .

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /app /app

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Test Docker Build

```bash
# Build image
docker build -t myapp:test .

# Run container
docker run -p 8000:8000 myapp:test

# Test
curl http://localhost:8000/health
```

---

## Step 7: Kubernetes Deployment (Optional) (3 minutes)

### Generate Kubernetes Manifests

**Ask Claude**:
```
"Generate Kubernetes manifests for Python FastAPI app"
```

**Generated Files**:
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/ingress.yaml`
- `k8s/configmap.yaml`
- `k8s/secret.yaml`
- `k8s/hpa.yaml`

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment
kubectl get deployments
kubectl get pods
kubectl get services

# Check logs
kubectl logs -f deployment/myapp

# Scale deployment
kubectl scale deployment myapp --replicas=5
```

---

## Customizing Pipelines

### Modify Generated Pipeline

Edit `.github/workflows/ci.yml`:

```yaml
# Add custom job
custom-checks:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run custom checks
      run: |
        echo "Running custom checks..."
        # Your custom commands here

# Add environment-specific deployment
deploy-staging:
  needs: [build]
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging..."
        # Your deployment commands

deploy-production:
  needs: [deploy-staging]
  runs-on: ubuntu-latest
  environment: production
  steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production..."
        # Your deployment commands
```

---

## Platform Comparison

| Feature | GitHub Actions | GitLab CI | Bitbucket Pipelines |
|---------|---------------|-----------|---------------------|
| **Matrix builds** | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Caching** | ✅ actions/cache | ✅ Built-in | ✅ Built-in |
| **Docker support** | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Free tier** | 2000 min/month | 400 min/month | 50 min/month |
| **Parallel jobs** | ✅ Yes (matrix) | ✅ Yes (parallel:) | ✅ Yes (parallel:) |
| **Reusable workflows** | ✅ Yes | ✅ Yes (includes:) | ❌ Limited |
| **Self-hosted runners** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Secrets management** | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Environments** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Manual approval** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Best Practices

- [ ] Use matrix builds for multi-version testing
- [ ] Enable dependency caching
- [ ] Run security scans in separate job
- [ ] Use Docker multi-stage builds
- [ ] Tag images with git SHA
- [ ] Use secrets for credentials
- [ ] Add manual approval for production
- [ ] Use environments for staging/production
- [ ] Enable code coverage reporting
- [ ] Run expensive checks only on main branch
- [ ] Use reusable workflows (DRY)
- [ ] Add status badges to README

---

## Troubleshooting

### Pipeline Fails on First Run

**Cause**: Missing secrets

**Fix**:
```bash
# Add required secrets
gh secret set DOCKER_USERNAME
gh secret set DOCKER_PASSWORD
```

### Cache Not Working

**Cause**: Cache key not matching

**Fix**: Check cache key includes all dependency files:
```yaml
key: ${{ hashFiles('**/requirements.txt', '**/pyproject.toml') }}
```

### Docker Build Fails

**Cause**: Missing Dockerfile

**Fix**: Generate Dockerfile first:
```
"Generate Dockerfile for Python FastAPI"
```

---

## Next Steps

- **Tutorial 05**: [Advanced Features](05-advanced-features.md) - Monorepos, customization
- **Read**: [CI/CD Patterns](../FEATURES.md#cicd-generation) - Deep dive

---

**Congratulations!** You now have production-ready CI/CD pipelines.

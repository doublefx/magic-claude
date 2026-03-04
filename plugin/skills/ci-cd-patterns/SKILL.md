---
name: ci-cd-patterns
description: Comprehensive CI/CD patterns, best practices, and implementation strategies for GitHub Actions, GitLab CI, and Bitbucket Pipelines. Use when implementing deployment pipelines, caching strategies, matrix builds, security scanning, or deployment strategies.
user-invocable: false
---

# CI/CD Patterns Skill

This skill provides comprehensive knowledge of modern CI/CD patterns, best practices, and implementation strategies for building robust deployment pipelines.

## When to Activate

- Implementing deployment pipelines (GitHub Actions, GitLab CI, Bitbucket Pipelines)
- Designing caching strategies for CI builds
- Setting up matrix builds or security scanning
- Configuring deployment strategies (blue-green, canary, rolling)

## Pipeline Stages

Three standard stages: **Build** (compile, lint, SAST, artifact generation), **Test** (unit, integration, E2E, security, performance), **Deploy** (dev/staging/production with gates and health checks).

- Fail fast: run linting before compilation, compilation before tests
- Version artifacts with commit SHA and semantic version tags
- Require manual approval for production deployments

See [references/pipeline-stages.md](references/pipeline-stages.md)

## Caching Strategies

Cache dependencies using lockfile hashes as cache keys, and structure Dockerfiles to cache dependency layers separately from source layers.

- Hash lockfiles (`package-lock.json`, `pom.xml`, `requirements.txt`) for cache invalidation
- Use `restore-keys` for partial cache hits when lockfile changes
- Never cache secrets or build outputs that embed environment-specific values

See [references/caching-strategies.md](references/caching-strategies.md)

## Matrix Builds

Run jobs across combinations of language versions and operating systems using `strategy.matrix` (GitHub Actions) or `parallel.matrix` (GitLab CI).

- Use `include` to pin specific version pairings (e.g. node 18 + npm 9)
- Use `exclude` to drop unsupported combinations
- Set `fail-fast: false` to let all matrix entries complete even if one fails

See [references/matrix-builds.md](references/matrix-builds.md)

## Deployment Strategies

Three primary strategies with different risk/cost tradeoffs:

- **Rolling**: gradual pod replacement, zero downtime, low resource overhead
- **Blue/Green**: instant traffic switch, instant rollback, requires double resources
- **Canary**: traffic-weighted progressive rollout, monitoring-driven, best for risk mitigation

See [references/deployment-strategies.md](references/deployment-strategies.md)

## GitOps Patterns

Use pull-based deployment (ArgoCD, FluxCD) where the cluster reconciles against a Git repository rather than being pushed to by CI.

- Git is the single source of truth; all changes are auditable
- `selfHeal: true` automatically corrects manual drift
- Promote environments by updating manifests in environment-specific branches or directories

See [references/gitops-patterns.md](references/gitops-patterns.md)

## Security Scanning

Integrate scanning at multiple layers in the correct order: secrets → SAST → dependencies → containers → DAST.

- Block on CRITICAL/HIGH container vulnerabilities (Trivy `--exit-code 1`)
- Publish SAST results as SARIF artifacts for GitHub Advanced Security
- Run dependency scanning per ecosystem: `npm audit`, `safety check`, OWASP dependency-check

See [references/security-scanning.md](references/security-scanning.md)

## Container Registry

Tag images with commit SHA for immutability, semantic version for releases, and branch name for review environments.

- Never use `latest` in production manifests — always pin to SHA digest
- Implement lifecycle policies to delete images older than N days or beyond N count
- Use `docker push --all-tags` to push all tags in one command

See [references/container-registry.md](references/container-registry.md)

## Performance Optimization

Use DAG job dependencies (`needs:`) to run independent jobs in parallel, and conditional execution (`if:` / `only:`) to skip irrelevant jobs.

- Parallel test jobs (unit + E2E) with a single deploy that waits for both
- Filter pipelines by file path changes to skip unaffected modules in monorepos
- Right-size runner resources; use spot instances for non-critical CI workloads

See [references/performance-optimization.md](references/performance-optimization.md)

## Monitoring and Observability

Emit structured JSON logs, expose Prometheus metrics, and configure Kubernetes liveness/readiness probes.

- `livenessProbe` restarts the container; `readinessProbe` removes it from traffic
- Use `startupProbe` for slow-starting applications
- Always include `requestId`/`traceId` in logs for distributed tracing correlation

See [references/monitoring-observability.md](references/monitoring-observability.md)

## Best Practices Summary

**Pipeline Design**: Keep pipelines simple, use reusable components, implement proper error handling, document environment variables.

**Security**: Scan code/dependencies/containers, use secret management (never hardcode), apply least privilege, audit regularly.

**Performance**: Cache dependencies and artifacts, run jobs in parallel, use matrix builds, optimize Docker layers.

**Reliability**: Implement health checks, use retry logic for flaky steps, support rollback, monitor success rates.

**Observability**: Collect metrics and logs, publish test/coverage results, track deployment success rates, alert on failures.

## Common Pitfalls

| Area | Pitfall |
|------|---------|
| Caching | Not hashing lockfiles; caching too much; no invalidation strategy |
| Security | Hardcoded secrets; running containers as root; using `latest` in production |
| Performance | Sequential independent jobs; no caching; rebuilding unchanged Docker layers |
| Reliability | No health checks; no rollback strategy; flaky tests without retries |
| Maintainability | Copy-pasting pipeline configs; undocumented env vars; no pipeline versioning |

## Further Learning

- [GitHub Actions](https://docs.github.com/en/actions)
- [GitLab CI](https://docs.gitlab.com/ee/ci/)
- [Bitbucket Pipelines](https://support.atlassian.com/bitbucket-cloud/docs/get-started-with-bitbucket-pipelines/)
- [Kubernetes](https://kubernetes.io/docs/)
- [ArgoCD](https://argo-cd.readthedocs.io/)
- [Trivy](https://aquasecurity.github.io/trivy/)
- [Semgrep](https://semgrep.dev/docs/)

## Reference Files

| File | Contents |
|------|----------|
| [pipeline-stages.md](references/pipeline-stages.md) | Build, Test, Deploy stage examples and best practices |
| [caching-strategies.md](references/caching-strategies.md) | Dependency, build, and Docker layer caching per ecosystem |
| [matrix-builds.md](references/matrix-builds.md) | Multi-version and multi-OS matrix configuration |
| [deployment-strategies.md](references/deployment-strategies.md) | Rolling, Blue/Green, Canary with full YAML examples |
| [gitops-patterns.md](references/gitops-patterns.md) | ArgoCD and FluxCD pull-based deployment patterns |
| [security-scanning.md](references/security-scanning.md) | Trivy, GitLeaks, Semgrep, and dependency scanning |
| [container-registry.md](references/container-registry.md) | Image tagging strategy, immutable tags, registry cleanup |
| [performance-optimization.md](references/performance-optimization.md) | Parallel jobs, conditional execution, resource sizing |
| [monitoring-observability.md](references/monitoring-observability.md) | Prometheus metrics, health probes, structured logging |

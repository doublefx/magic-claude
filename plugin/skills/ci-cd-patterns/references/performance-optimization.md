# Performance Optimization

## Parallel Job Execution

Use DAG (Directed Acyclic Graph) dependencies to run independent jobs concurrently.

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

## Conditional Execution

Skip jobs that are not relevant to the current event or branch.

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

## Resource Optimization

Right-size runner resources to avoid over-provisioning.

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

**Additional Tips**:
- Use self-hosted runners for heavy workloads to reduce per-minute costs
- Prefer spot/preemptible instances for non-critical CI jobs
- Share Docker layer cache between jobs with a registry-based cache backend
- Use `paths` filters in GitHub Actions to skip pipelines for irrelevant file changes

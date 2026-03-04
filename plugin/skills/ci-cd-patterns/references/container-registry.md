# Container Registry Best Practices

## Image Tagging Strategy

Use multiple tags to support traceability, branch tracking, and version pinning.

```bash
# Multi-tag strategy
docker tag myapp:build-123 myapp:$COMMIT_SHA
docker tag myapp:build-123 myapp:$BRANCH_NAME
docker tag myapp:build-123 myapp:latest
docker tag myapp:build-123 myapp:v1.2.3

# Push all tags
docker push --all-tags myapp
```

**Tagging Guidelines**:
- `latest` — convenience only, never use in production manifests
- `$BRANCH_NAME` — useful for staging/review environments
- `$COMMIT_SHA` — immutable, use in production
- `vX.Y.Z` — semantic versions for releases

## Immutable Tags

Always use digest or SHA-pinned tags for production deployments to guarantee reproducibility.

```yaml
# Use specific SHA tags for production
deployment:
  production:
    image: myapp@sha256:abc123...
```

## Registry Cleanup

Remove old images to control storage costs. Keep a fixed number of recent versions.

```bash
# Delete old images (keep last 10 versions)
gcloud container images list-tags gcr.io/myproject/myapp \
  --format="get(digest)" \
  --sort-by=~timestamp \
  --limit=999999 \
  | tail -n +11 \
  | xargs -I {} gcloud container images delete gcr.io/myproject/myapp@sha256:{} --quiet
```

**Cleanup Strategies**:
- Tag-based: delete images older than N days
- Count-based: keep last N images per branch
- Policy-based: use registry lifecycle policies (ECR, GCR, ACR all support this natively)

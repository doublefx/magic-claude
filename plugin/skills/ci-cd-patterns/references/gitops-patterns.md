# GitOps Patterns

## Pull-Based Deployment

Cluster pulls desired state from Git repository (as opposed to push-based CI/CD).

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

## Environment Promotion

Promote releases through environments using Git as the source of truth.

**Process**:
1. Developer merges to `main` branch
2. CI builds and tests
3. CI updates `dev` environment manifest
4. ArgoCD deploys to dev cluster
5. After testing, promote to `staging` branch
6. ArgoCD deploys to staging cluster
7. After approval, tag release and promote to `prod`
8. ArgoCD deploys to production cluster

**Key Benefits**:
- Git is the single source of truth for cluster state
- All changes are auditable via git history
- Rollback = revert commit
- Drift detection via `selfHeal: true`

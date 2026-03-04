# Deployment Strategies

## Rolling Update

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

## Blue/Green Deployment

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

## Canary Deployment

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

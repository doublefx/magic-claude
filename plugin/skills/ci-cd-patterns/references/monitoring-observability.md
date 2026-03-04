# Monitoring and Observability

## Metrics Collection

Expose Prometheus metrics from application containers and annotate pods for scraping.

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

## Health Checks

Kubernetes uses liveness and readiness probes to determine pod health and traffic routing.

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

**Probe Distinction**:
- `livenessProbe` — if it fails, the container is restarted
- `readinessProbe` — if it fails, traffic is stopped but container is not restarted
- `startupProbe` — use for slow-starting applications to avoid premature liveness failures

## Structured Logging

Emit JSON logs so aggregators (Loki, CloudWatch, Datadog) can parse and filter fields without regex.

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

**Standard Fields to Always Include**:
- `level` — info, warn, error
- `message` — human-readable description
- `timestamp` — ISO 8601
- `requestId` / `traceId` — for distributed tracing correlation
- `service` / `version` — for multi-service log aggregation

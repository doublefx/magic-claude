# Security Scanning Integration

## Container Scanning (Trivy)

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

## Secret Scanning (GitLeaks)

```yaml
gitleaks:
  stage: security
  image:
    name: zricethezav/gitleaks:latest
    entrypoint: [""]
  script:
    - gitleaks detect --source . --verbose
```

## SAST (Semgrep)

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

## Dependency Scanning

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

**Recommended Scanning Order**:
1. Secret scanning (fast, blocks secrets from entering repo)
2. SAST (static code analysis, no runtime needed)
3. Dependency scanning (known CVEs in dependencies)
4. Container scanning (image vulnerabilities, post-build)
5. DAST (dynamic analysis, requires running app)

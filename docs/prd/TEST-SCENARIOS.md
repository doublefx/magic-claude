# Comprehensive Test Scenarios for Enterprise Stack Extension

## 1. Unit Test Scenarios

### 1.1 Project Detection (`detect-project-type.js`)

| Test Case | Input | Expected Output | Priority |
|-----------|-------|-----------------|----------|
| Single Node.js project | `package.json` exists | `["nodejs"]` | P0 |
| Single Python project | `pyproject.toml` exists | `["python"]` | P0 |
| Single Maven project | `pom.xml` exists | `["maven"]` | P0 |
| Single Gradle project | `build.gradle` exists | `["gradle"]` | P0 |
| Gradle Kotlin DSL | `build.gradle.kts` exists | `["gradle"]` | P1 |
| Multi-project (Node + Python) | Both manifests | `["nodejs", "python"]` | P0 |
| Monorepo (Node + Maven + Python) | All manifests | `["nodejs", "maven", "python"]` | P1 |
| Empty directory | No manifests | `[]` | P1 |
| Cache hit (TTL valid) | Cached result | Return cached, no re-scan | P1 |
| Cache invalidation (manifest changed) | Modified `pom.xml` | Re-detect, update cache | P0 |
| Nested projects | Parent: `pom.xml`, Child: `package.json` | Detect based on CWD | P1 |
| Symlinked manifests | `package.json` is symlink | Detect correctly | P2 |

### 1.2 Hook Matchers (Conditional Logic)

| Test Case | Matcher | Project Type | File | Should Fire? |
|-----------|---------|--------------|------|--------------|
| Python format | `tool == "Edit" && file matches "\.py$" && project_type contains "python"` | `["python"]` | `app.py` | ✅ Yes |
| Python format (wrong type) | Same | `["nodejs"]` | `app.py` | ❌ No |
| Java format | `tool == "Edit" && file matches "\.java$" && project_type contains "maven"` | `["maven"]` | `App.java` | ✅ Yes |
| Java format (Gradle) | Same with `"gradle"` | `["gradle"]` | `App.java` | ✅ Yes |
| Prettier (Node.js only) | `tool == "Edit" && file matches "\.js$" && project_type contains "nodejs"` | `["nodejs"]` | `index.js` | ✅ Yes |
| Prettier (not in Python) | Same | `["python"]` | `index.js` | ❌ No |
| Universal hook (git) | `tool == "Bash" && command contains "git push"` | Any | N/A | ✅ Yes |
| Multi-project hook | `project_type contains "maven" OR project_type contains "gradle"` | `["maven", "nodejs"]` | `App.java` | ✅ Yes |

### 1.3 Hook Scripts

| Script | Test Case | Input | Expected Behavior | Priority |
|--------|-----------|-------|-------------------|----------|
| `python-format.js` | black installed | `app.py` | Run black, return formatted | P0 |
| `python-format.js` | black not installed | `app.py` | Log warning, skip | P0 |
| `python-format.js` | black fails (syntax error) | `bad.py` | Return error message | P1 |
| `java-format.js` | google-java-format installed | `App.java` | Run formatter | P0 |
| `java-format.js` | File unchanged | `App.java` | No-op, fast return | P1 |
| `maven-suggestions.js` | Command: `mvn install` | N/A | Suggest `mvn verify` | P0 |
| `gradle-wrapper.js` | Command: `gradle build` | N/A | Suggest `./gradlew` | P0 |
| `validate-pipeline.js` | Valid YAML | `.github/workflows/ci.yml` | Pass | P0 |
| `validate-pipeline.js` | Invalid YAML (syntax) | Malformed YAML | Error with line number | P0 |
| `validate-pipeline.js` | Missing required fields | No `jobs` section | Warning | P1 |

### 1.4 Cache Management

| Test Case | Scenario | Expected Behavior | Priority |
|-----------|----------|-------------------|----------|
| Initial detection | No cache exists | Detect, write to `.claude/project-type.json` | P0 |
| Cache hit | Cache valid, TTL not expired | Return cached result | P1 |
| Cache expiration | TTL expired | Re-detect, update cache | P1 |
| Cache invalidation | `pom.xml` modified after cache | Re-detect on next check | P0 |
| Corrupted cache | Invalid JSON | Re-detect, overwrite cache | P1 |
| Concurrent writes | Two sessions detect simultaneously | Last write wins (acceptable) | P2 |

## 2. Integration Test Scenarios

### 2.1 Python Project Tests

**Test Project**: Flask API with pytest, black, flake8, mypy

| Test Case | Action | Expected Hook Behavior | Verification |
|-----------|--------|------------------------|--------------|
| Edit Python file | Edit `app.py` | black formats on save | Check file formatted |
| Edit Python file | Edit with syntax error | flake8 reports error | Error message shown |
| Edit Python file | Edit with type error | mypy reports error | Type error shown |
| Edit Python file | Add `eval()` call | Security warning (eval) | Hook warns about eval |
| Run Python file | `Bash: python app.py` | No hooks fired | N/A |
| Import ordering | Edit with wrong import order | black/isort fixes | Imports reordered |
| Type hints missing | Edit function without hints | mypy warning | Warning shown |
| Security: SQL injection | Edit with f-string SQL | bandit pattern warning | Security alert |
| Performance: list comp | Edit with map/filter | No warning (acceptable) | N/A |
| Docstring missing | Edit public function | Warning (optional) | Warning shown |

### 2.2 Java Project Tests

**Test Project**: Spring Boot app with JUnit, Maven

| Test Case | Action | Expected Hook Behavior | Verification |
|-----------|--------|------------------------|--------------|
| Edit Java file | Edit `App.java` | google-java-format runs | Check file formatted |
| Edit Java file | Add unused import | Checkstyle warning | Warning shown |
| Edit Java file | Null dereference | Static analysis warning | Warning shown |
| Maven command | `Bash: mvn install` | Suggest `mvn verify` | Suggestion shown |
| Maven command | `Bash: mvn clean verify` | No suggestion | N/A |
| Maven dependency | Add dependency to `pom.xml` | No hook (not .java file) | N/A |
| Multi-module build | Edit in submodule | Hooks fire correctly | Check detection |
| Concurrency issue | Edit with synchronized | No warning (correct usage) | N/A |
| Security: reflection | Edit with `Class.forName()` | Warning (reflection risk) | Warning shown |

### 2.3 Gradle Project Tests

**Test Project**: Kotlin multi-module app

| Test Case | Action | Expected Hook Behavior | Verification |
|-----------|--------|------------------------|--------------|
| Edit Kotlin file | Edit `App.kt` | ktlint runs (if available) | Check formatted |
| Gradle command | `Bash: gradle build` | Suggest `./gradlew` | Suggestion shown |
| Gradle wrapper | `Bash: ./gradlew build` | No suggestion | N/A |
| Build cache | Edit `build.gradle.kts` | No hook (YAML validation only for CI) | N/A |
| Kotlin DSL | Edit Gradle Kotlin DSL | No Java hooks fired | Verify isolation |

### 2.4 Node.js Project Tests

**Test Project**: React app with TypeScript, ESLint, Prettier

| Test Case | Action | Expected Hook Behavior | Verification |
|-----------|--------|------------------------|--------------|
| Edit TS file | Edit `App.tsx` | Prettier formats | Check formatted |
| Edit TS file | Edit with type error | TypeScript error | Error shown |
| Edit TS file | Add console.log | console.log warning | Warning shown |
| NPM command | `Bash: npm install` | No hooks | N/A |
| ESLint error | Edit with unused variable | ESLint error | Error shown |
| Mixed project (Node + Python) | Edit `.py` file | Python hooks fire, not Prettier | Verify isolation |

### 2.5 CI/CD Generation Tests

| Test Case | Input | Expected Output | Verification |
|-----------|-------|-----------------|--------------|
| Maven + GitHub Actions | `/ci-cd` → Maven → GitHub | Valid `.github/workflows/maven.yml` | YAML validates, contains `mvn verify` |
| Maven + GitLab CI | `/ci-cd` → Maven → GitLab | Valid `.gitlab-ci.yml` | YAML validates, has stages |
| Gradle + Bitbucket | `/ci-cd` → Gradle → Bitbucket | Valid `bitbucket-pipelines.yml` | YAML validates, uses wrapper |
| Python + GitHub Actions | `/ci-cd` → Python → GitHub | Valid workflow with pip cache | YAML validates, has python setup |
| Node.js + GitHub Actions | `/ci-cd` → Node.js → GitHub | Valid workflow with npm cache | YAML validates, has node setup |
| Maven + AWS deployment | Maven → AWS → credentials | Workflow with AWS deploy step | Has AWS credential setup |
| Invalid combination | Python → Java-only template | Error message | User warned |
| Multi-module Maven | Maven multi-module → GitHub | Workflow builds all modules | Has multi-module support |
| Existing workflow | `/ci-cd` when workflow exists | Ask to overwrite or merge | User prompted |
| Missing tools | Maven project, no Maven installed | Warning, generate anyway | Warning shown |

### 2.6 Cross-Platform Tests

| Test Case | Platform | Scenario | Expected Behavior |
|-----------|----------|----------|-------------------|
| Windows paths | Windows | Edit `C:\projects\app.py` | Hooks fire correctly |
| WSL2 paths | WSL2 | Edit `/mnt/c/projects/app.py` | Hooks fire correctly |
| MacOS case sensitivity | MacOS | Edit `APP.py` vs `app.py` | Detect as same file |
| Symlinks | Linux | Project in symlinked dir | Detection works |
| Long paths | Windows | Path > 260 chars | Graceful degradation |
| Unicode paths | All | Edit `测试/app.py` | Hooks fire correctly |

### 2.7 Error Handling Tests

| Test Case | Scenario | Expected Behavior | Priority |
|-----------|----------|-------------------|----------|
| Tool not installed | black not in PATH | Log warning, skip formatting | P0 |
| Tool crash | black crashes with SIGSEGV | Catch error, log, continue | P1 |
| Tool timeout | mypy takes > 10s | Kill process, warn user | P1 |
| Network error | pip-audit fails (no internet) | Skip check, log warning | P2 |
| Permission error | Cannot write to cache file | Log warning, continue without cache | P1 |
| Disk full | Cannot write formatted file | Error message, rollback | P1 |
| Concurrent edits | Two edits to same file | Last write wins (acceptable) | P2 |

## 3. Edge Case Test Scenarios

### 3.1 Multi-Language Projects

| Test Case | Project Structure | Expected Behavior |
|-----------|-------------------|-------------------|
| Monorepo (Node + Python + Java) | Root with all manifests | All hooks available, fire correctly per file type |
| Backend (Java) + Frontend (Node) | Parent `pom.xml`, child `package.json` | Detect based on CWD context |
| Jupyter notebooks | Python project with `.ipynb` | Python hooks fire for `.ipynb` cells |
| Polyglot JVM | Gradle with Kotlin + Java + Groovy | All JVM hooks fire correctly |

### 3.2 Complex Build Scenarios

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Maven multi-module | Parent + 5 child modules | Detect as Maven, hooks fire in all modules |
| Gradle composite builds | Multiple included builds | Detect as Gradle, hooks fire globally |
| Gradle buildSrc | Custom Gradle plugins in `buildSrc/` | Detect as Gradle, hooks fire |
| Maven parent POM only | `packaging=pom`, no source | Detect as Maven, no Java hooks |

### 3.3 Hook Interaction Tests

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Hook execution order | Multiple hooks match same event | Execute in defined order |
| Hook failure propagation | First hook fails | Subsequent hooks still run |
| Hook timeout | Hook takes > 30s | Kill hook, log warning |
| Circular dependencies | Hook A triggers Hook B triggers Hook A | Detect cycle, abort |

## 4. Performance Test Scenarios

### 4.1 Hook Performance

| Test Case | Scenario | Performance Target | Priority |
|-----------|----------|-------------------|----------|
| Small file edit | Edit 100-line Python file | Hooks complete in < 1s | P0 |
| Large file edit | Edit 10,000-line Java file | Hooks complete in < 5s | P1 |
| Bulk edits | Edit 50 files in parallel | Hooks complete in < 10s | P2 |
| Project detection | Detect in large monorepo (10k files) | Complete in < 500ms | P1 |
| Cache performance | 100 sequential detections (cached) | < 10ms per detection | P2 |

### 4.2 Scalability

| Test Case | Scenario | Expected Behavior |
|-----------|----------|-------------------|
| Large monorepo | 50+ projects in repo | Detection completes in < 2s |
| Deep directory nesting | 20 levels deep | Detection works correctly |
| Many CI/CD templates | Generate 10 workflows | Completes in < 5s |

## 5. Regression Test Scenarios

### 5.1 Backward Compatibility

| Test Case | Scenario | Expected Behavior | Priority |
|-----------|----------|-------------------|----------|
| Existing Node.js project | Pure JS/TS project | All existing hooks work as before | P0 |
| Existing hooks config | User has custom hooks | Custom hooks still fire | P0 |
| No manifest files | Legacy project without manifests | Hooks don't break, log warning | P1 |
| Old cache format | Upgrade from v1.0 cache | Invalidate old cache, re-detect | P1 |

## 6. Security Test Scenarios

### 6.1 Credential Detection

| Test Case | Code Sample | Expected Behavior |
|-----------|-------------|-------------------|
| OpenAI API key | `api_key = "sk-..."` | [CRITICAL] Hardcoded API key |
| AWS credentials | `aws_access_key_id = "AKIA..."` | [CRITICAL] AWS credentials |
| GitHub token | `token = "ghp_..."` | [CRITICAL] GitHub token |
| Database password | `db_url = "postgres://user:pass@..."` | [CRITICAL] DB password in URL |
| False positive (test) | `# Test key: sk-test-fake` | No warning (comment) |
| Base64 encoded | `key = base64("secret")` | [HIGH] Potential encoded secret |

### 6.2 Vulnerability Detection

| Test Case | Language | Code Pattern | Expected Warning |
|-----------|----------|--------------|------------------|
| SQL injection | Python | `f"SELECT * FROM users WHERE id = {id}"` | [CRITICAL] SQL injection risk |
| Command injection | Python | `os.system(user_input)` | [CRITICAL] Command injection |
| XXE attack | Java | `DocumentBuilder` with external entities | [HIGH] XXE vulnerability |
| Path traversal | Java | `new File(userPath)` | [MEDIUM] Path traversal risk |
| Insecure random | Java | `new Random()` for security | [HIGH] Use SecureRandom |

## 7. Acceptance Test Scenarios

### 7.1 End-to-End Workflows

| Workflow | Steps | Success Criteria |
|----------|-------|------------------|
| New Python project setup | 1. Create `pyproject.toml` 2. Edit `app.py` 3. Run `/ci-cd` | Hooks fire, CI/CD generated |
| New Java project setup | 1. Create `pom.xml` 2. Edit `App.java` 3. Build | Hooks fire, formatting works |
| Migrate Node.js to Python | 1. Add `pyproject.toml` to Node.js project 2. Edit `.py` file | Python hooks fire, Node hooks still work |
| Generate and run CI/CD | 1. `/ci-cd` → GitHub Actions 2. Commit workflow 3. Push | Workflow runs successfully on GitHub |

## Test Execution Priority

### P0 (Critical) - Must Pass Before Release
- Project detection for all languages
- Hook firing for correct project types
- Hook isolation (no false positives)
- Backward compatibility with existing Node.js projects
- CI/CD template generation for primary languages

### P1 (High) - Should Pass Before Release
- Cache invalidation
- Error handling (tool not found)
- Cross-platform path handling
- Multi-language project support
- Hook performance (< 2s)

### P2 (Medium) - Can Address Post-Release
- Advanced edge cases (symlinks, Unicode paths)
- Performance optimization (large files)
- Concurrent operation handling
- Advanced multi-module scenarios

## Test Automation Strategy

### Unit Tests: `npm test`
- Run on every commit
- Coverage target: 80%
- Duration: < 30s

### Integration Tests: `npm run test:integration`
- Run on PR creation
- Coverage: All primary workflows
- Duration: < 5 minutes

### E2E Tests: `npm run test:e2e`
- Run nightly
- Coverage: Full workflows with real tools
- Duration: < 15 minutes

### Platform Tests: `npm run test:platform`
- Run on release candidate
- Coverage: Windows, Mac, Linux
- Duration: < 30 minutes

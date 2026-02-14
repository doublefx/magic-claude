# Agent & Skill Catalog

**Version**: 3.1.0
**Last Updated**: 2026-02-14
**Total Agents**: 27
**Total Skills**: 36

---

## Table of Contents

### Agents
1. [General Purpose Agents](#general-purpose-agents)
2. [Language-Specific Agents](#language-specific-agents)
3. [Build Tool Agents](#build-tool-agents)
4. [CI/CD Agents](#cicd-agents)

### Skills
1. [Language Pattern Skills](#language-pattern-skills)
2. [Architecture Skills](#architecture-skills)
3. [Testing Skills](#testing-skills)
4. [Advanced Skills](#advanced-skills)
5. [Coordination Skills](#coordination-skills)
6. [Serena Integration Skills](#serena-integration-skills)

---

## Agents

### General Purpose Agents

#### planner
**Command**: `/planner`
**Model**: Opus
**Description**: Feature implementation planning with task breakdown

**When to Use**:
- Starting a new feature
- Need to break down complex tasks
- Want to plan implementation order
- Need dependency analysis

**What It Does**:
- Analyzes feature requirements
- Creates task breakdown (P0, P1, P2 priorities)
- Identifies dependencies
- Estimates effort
- Suggests implementation approach

**Example**:
```
User: Plan implementation of user authentication

Agent Response:
Feature: User Authentication

Phase 1: Core Authentication (P0)
- Task 1.1: Design user model [2h]
- Task 1.2: Implement password hashing [1h]
- Task 1.3: Create login endpoint [3h]
- Task 1.4: Add JWT token generation [2h]

Phase 2: Session Management (P1)
- Task 2.1: Implement refresh tokens [2h]
- Task 2.2: Add session storage [1h]
- Task 2.3: Create logout endpoint [1h]

Phase 3: Security (P2)
- Task 3.1: Add rate limiting [2h]
- Task 3.2: Implement 2FA [4h]
- Task 3.3: Add audit logging [2h]

Dependencies:
- 1.1 → 1.2 → 1.3 → 1.4
- 1.4 → 2.1 → 2.2
- 2.1 → 3.1, 3.2

Estimated Total: 22 hours
```

---

#### architect
**Command**: `/architect`
**Model**: Opus
**Description**: System design and architecture decisions

**When to Use**:
- Designing new systems
- Need architecture review
- Evaluating trade-offs
- Planning for scale

**What It Does**:
- Proposes system architectures
- Evaluates design trade-offs
- Suggests patterns and practices
- Plans for scalability
- Identifies potential bottlenecks

**Example**:
```
User: Design architecture for a real-time chat application

Agent Response:
System Architecture: Real-Time Chat Application

Components:
1. WebSocket Server (Socket.io / WS)
   - Handles real-time connections
   - Broadcasts messages
   - Manages presence

2. API Server (REST)
   - User authentication
   - Chat history
   - User profiles

3. Message Queue (Redis Pub/Sub)
   - Scales WebSocket servers
   - Ensures message delivery
   - Handles backpressure

4. Database (PostgreSQL)
   - User data
   - Chat history
   - Message persistence

5. Cache (Redis)
   - Online users
   - Recent messages
   - Session data

Architecture Pattern: Microservices
- API Gateway (NGINX)
- Auth Service (JWT)
- Chat Service (WebSocket)
- Storage Service (Database)

Scalability:
- Horizontal scaling: Multiple WebSocket servers
- Load balancing: NGINX with sticky sessions
- Message persistence: Redis + PostgreSQL
- CDN: Static assets

Trade-offs:
- Consistency vs Availability: AP (eventual consistency)
- Latency vs Throughput: Optimized for latency
- Cost vs Performance: Redis cache reduces DB load
```

---

### Polyglot TDD Agents (Ecosystem-Specific)

#### ts-tdd-guide
**Command**: `/tdd` (auto-dispatched for TS/JS projects)
**Model**: Sonnet
**Skills**: `tdd-workflow`, `backend-patterns`, `claude-mem-context`
**Description**: TypeScript/JavaScript TDD with Jest/Vitest/Playwright

#### jvm-tdd-guide
**Command**: `/tdd` (auto-dispatched for JVM projects)
**Model**: Sonnet
**Skills**: `jvm-tdd-workflow`, `jvm-backend-patterns`, `claude-mem-context`
**Description**: JVM TDD with JUnit 5, Mockito, MockK, AssertJ, JaCoCo

#### python-tdd-guide
**Command**: `/tdd` (auto-dispatched for Python projects)
**Model**: Sonnet
**Skills**: `python-tdd-workflow`, `python-backend-patterns`, `claude-mem-context`
**Description**: Python TDD with pytest, unittest.mock, pytest-cov, hypothesis

**When to Use** (all three):
- Writing tests first
- Need TDD workflow guidance
- Want to improve test coverage

---

#### code-reviewer
**Command**: `/code-review`
**Model**: Opus
**Description**: Ecosystem-aware quality and security review

**When to Use**:
- Before committing code
- Need code review
- Want to improve code quality
- Security audit

**What It Does**:
- Detects ecosystem from changed file extensions
- Applies ecosystem-specific security and quality checks
- Delegates to language reviewers (java-reviewer, kotlin-reviewer, python-reviewer, groovy-reviewer)
- Dispatches to ecosystem-specific security reviewers for security-sensitive changes
- Provides remediation suggestions mapping issues to specific commands

---

### Polyglot Security Agents (Ecosystem-Specific)

#### ts-security-reviewer
**Command**: `/code-review` (auto-dispatched for TS/JS)
**Model**: Opus
**Description**: TypeScript/JavaScript/Next.js vulnerability analysis

#### jvm-security-reviewer
**Command**: `/code-review` (auto-dispatched for JVM)
**Model**: Opus
**Description**: JVM security with SpotBugs, OWASP dependency-check, Spring Security

#### python-security-reviewer
**Command**: `/code-review` (auto-dispatched for Python)
**Model**: Opus
**Description**: Python security with bandit, pip-audit, semgrep

---

### Polyglot Build Resolvers (Ecosystem-Specific)

#### ts-build-resolver
**Command**: `/build-fix` (auto-dispatched)
**Model**: Sonnet
**Skills**: `frontend-patterns`, `backend-patterns`, `coding-standards`, `serena-code-navigation`
**Description**: TypeScript/JavaScript build error resolution

#### jvm-build-resolver
**Command**: `/build-fix` (auto-dispatched)
**Model**: Sonnet
**Skills**: `gradle-patterns`, `maven-patterns`, `jvm-backend-patterns`, `serena-code-navigation`
**Description**: JVM build error resolution (Maven/Gradle)

#### python-build-resolver
**Command**: `/build-fix` (auto-dispatched)
**Model**: Sonnet
**Skills**: `python-patterns`, `python-backend-patterns`, `serena-code-navigation`
**Description**: Python build error resolution (pyright/ruff/pytest)

---

### Polyglot E2E Agents (Ecosystem-Specific)

#### ts-e2e-runner
**Command**: `/e2e` (auto-dispatched for TS/JS)
**Model**: Sonnet
**Description**: Playwright E2E testing for TypeScript/JavaScript

#### jvm-e2e-runner
**Command**: `/e2e` (auto-dispatched for JVM)
**Model**: Sonnet
**Description**: Selenium WebDriver and REST Assured E2E testing

#### python-e2e-runner
**Command**: `/e2e` (auto-dispatched for Python)
**Model**: Sonnet
**Description**: pytest-playwright E2E testing for Python

---

### Polyglot Refactor Agents (Ecosystem-Specific)

#### ts-refactor-cleaner
**Command**: `/refactor-clean` (auto-dispatched for TS/JS)
**Model**: Haiku
**Description**: TypeScript/JavaScript dead code cleanup (knip, depcheck, ts-prune)

#### jvm-refactor-cleaner
**Command**: `/refactor-clean` (auto-dispatched for JVM)
**Model**: Haiku
**Description**: JVM dead code cleanup (jdeps, mvn dependency:analyze, SpotBugs)

#### python-refactor-cleaner
**Command**: `/refactor-clean` (auto-dispatched for Python)
**Model**: Haiku
**Description**: Python dead code cleanup (vulture, ruff F401/F841, autoflake)

---

#### doc-updater
**Command**: `/doc-updater`
**Model**: Sonnet
**Description**: Documentation synchronization and updates

**When to Use**:
- Code changed, docs stale
- Need API documentation
- README updates
- Inline comment updates

**What It Does**:
- Syncs docs with code
- Generates API docs
- Updates README
- Improves inline comments

---

### Language-Specific Agents

#### python-reviewer
**Command**: `/python-reviewer`
**Model**: Opus
**Description**: Python code review with modern best practices

**When to Use**:
- Reviewing Python code
- Need Python idioms
- Want performance tips
- Security check for Python

**What It Does**:
- Checks PEP 8 compliance
- Suggests modern Python features (3.10+)
- Reviews FastAPI/Django patterns
- Detects security issues (SQL injection, XSS)
- Suggests type hints
- Recommends Ruff/Pyright

**Example**:
```python
# Before
def get_user(id):
    return db.execute("SELECT * FROM users WHERE id = " + str(id))

# Agent suggests:
# 1. Add type hints
# 2. Use parameterized queries (SQL injection risk!)
# 3. Use async/await for database calls
# 4. Add error handling

# After
async def get_user(user_id: int) -> User | None:
    try:
        result = await db.fetch_one(
            "SELECT * FROM users WHERE id = :id",
            {"id": user_id}
        )
        return User(**result) if result else None
    except DatabaseError as e:
        logger.error(f"Failed to fetch user {user_id}: {e}")
        raise
```

---

#### java-reviewer
**Command**: `/java-reviewer`
**Model**: Opus
**Description**: Java code review with Spring Boot and modern Java patterns

**When to Use**:
- Reviewing Java code
- Spring Boot projects
- Need Java idioms
- Performance optimization

**What It Does**:
- Checks Java conventions
- Reviews Spring Boot best practices
- Suggests modern Java features (17+)
- Detects common bugs (NullPointerException, resource leaks)
- Recommends google-java-format
- Validates dependency injection

**Example**:
```java
// Before
@Service
public class UserService {
    @Autowired
    private UserRepository repo;

    public User getUser(Long id) {
        return repo.findById(id).get();  // Risky!
    }
}

// Agent suggests:
// 1. Use constructor injection (not field injection)
// 2. Handle Optional properly (avoid .get())
// 3. Add logging
// 4. Consider caching

// After
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository repo;

    @Cacheable("users")
    public Optional<User> getUser(Long id) {
        log.debug("Fetching user: {}", id);
        return repo.findById(id);
    }
}
```

---

#### kotlin-reviewer
**Command**: `/kotlin-reviewer`
**Model**: Opus
**Description**: Kotlin code review with modern Kotlin patterns

**When to Use**:
- Reviewing Kotlin code
- Spring Boot + Kotlin
- Need Kotlin idioms
- Coroutines review

**What It Does**:
- Checks Kotlin conventions
- Reviews coroutines usage
- Suggests data classes, sealed classes
- Validates null safety
- Recommends ktfmt
- Spring Boot + Kotlin patterns

**Example**:
```kotlin
// Before
class UserService(val repo: UserRepository) {
    fun getUser(id: Long): User? {
        val user = repo.findById(id)
        if (user != null) {
            return user
        } else {
            return null
        }
    }
}

// Agent suggests:
// 1. Use Elvis operator
// 2. Make function suspend (for async)
// 3. Use inline return
// 4. Add data class

// After
@Service
class UserService(private val repo: UserRepository) {
    suspend fun getUser(id: Long): User? = repo.findById(id)
}

data class User(
    val id: Long,
    val name: String,
    val email: String
)
```

---

#### groovy-reviewer
**Command**: `/groovy-reviewer`
**Model**: Opus
**Description**: Groovy code review (primarily for Gradle scripts)

**When to Use**:
- Reviewing Groovy code
- Gradle build scripts
- Jenkins pipelines
- Groovy DSLs

**What It Does**:
- Reviews Gradle script quality
- Suggests Kotlin DSL migration
- Checks Groovy conventions
- Validates DSL patterns

---

### Build Tool Agents

#### maven-expert
**Command**: `/maven-expert`
**Model**: Opus
**Description**: Maven build optimization and best practices

**When to Use**:
- Maven project setup
- Build optimization
- Dependency management
- Multi-module projects

**What It Does**:
- Reviews pom.xml structure
- Suggests dependency optimizations
- Recommends parallel builds
- Validates Maven wrapper usage
- Checks plugin versions
- Advises on BOM usage

**Example Advice**:
```
Maven Optimization Report

1. Enable Parallel Builds
   Current: Sequential execution
   Suggestion: Add -T 4 (4 threads)
   Speed improvement: ~50%

2. Use Maven Wrapper
   Current: System Maven (varies by developer)
   Suggestion: Add mvnw with: mvn wrapper:wrapper
   Benefit: Consistent Maven version

3. Optimize Plugin Versions
   Outdated plugins found:
   - maven-compiler-plugin: 3.8.1 → 3.12.1
   - maven-surefire-plugin: 2.22.2 → 3.2.5

4. Use BOM for Dependencies
   Spring Boot BOM missing
   Add:
   <dependencyManagement>
     <dependencies>
       <dependency>
         <groupId>org.springframework.boot</groupId>
         <artifactId>spring-boot-dependencies</artifactId>
         <version>3.2.1</version>
         <type>pom</type>
         <scope>import</scope>
       </dependency>
     </dependencies>
   </dependencyManagement>

5. Cache Dependencies in CI/CD
   Add to GitHub Actions:
   - uses: actions/cache@v3
     with:
       path: ~/.m2/repository
       key: maven-${{ hashFiles('**/pom.xml') }}
```

---

#### gradle-expert
**Command**: `/gradle-expert`
**Model**: Opus
**Description**: Gradle build optimization and best practices

**When to Use**:
- Gradle project setup
- Build performance issues
- Multi-project builds
- Kotlin DSL migration

**What It Does**:
- Reviews build.gradle structure
- Suggests performance optimizations
- Recommends Kotlin DSL
- Validates Gradle wrapper usage
- Checks build caching
- Advises on version catalogs

**Example Advice**:
```
Gradle Optimization Report

1. Migrate to Kotlin DSL
   Current: Groovy DSL (build.gradle)
   Suggestion: Use Kotlin DSL (build.gradle.kts)
   Benefits: Type safety, IDE support, refactoring

2. Enable Build Caching
   Add to gradle.properties:
   org.gradle.caching=true
   org.gradle.parallel=true
   org.gradle.daemon=true
   Speed improvement: 30-50%

3. Use Version Catalogs
   Current: Hardcoded versions in build files
   Suggestion: Create gradle/libs.versions.toml
   Benefits: Centralized versions, type-safe dependencies

4. Optimize Dependency Resolution
   Current: Multiple repositories checked
   Suggestion: Order repositories by frequency
   repositories {
     mavenCentral()  // Most common
     gradlePluginPortal()
     mavenLocal()  // Last resort
   }

5. Use Configuration Cache
   Add to gradle.properties:
   org.gradle.configuration-cache=true
   Speed improvement: Up to 90% for repeated builds
```

---

### CI/CD Agents

#### ci-cd-architect
**Command**: `/ci-cd-architect`
**Model**: Opus
**Description**: CI/CD pipeline design and generation

**When to Use**:
- Setting up CI/CD
- Need pipeline design
- Multi-environment deployment
- GitOps setup

**What It Does**:
- Designs CI/CD pipelines
- Generates GitHub Actions/GitLab CI configs
- Recommends deployment strategies
- Validates security scanning
- Suggests Docker/Kubernetes configs

**Commands It Can Generate**:
```bash
/ci-cd github-actions python    # GitHub Actions for Python
/ci-cd gitlab-ci java-maven     # GitLab CI for Java Maven
/ci-cd bitbucket-pipelines nodejs  # Bitbucket for Node.js
```

---

## Skills

### Language Pattern Skills

#### python-patterns
**Path**: `skills/python-patterns/SKILL.md`
**Description**: Modern Python 3.10+ patterns and best practices

**Covers**:
- f-strings and format strings
- dataclasses and Pydantic models
- async/await patterns
- FastAPI best practices
- Django patterns
- pytest fixtures and parametrize
- Type hints with Pyright
- Modern package management (uv, poetry)

---

#### kotlin-patterns
**Path**: `skills/kotlin-patterns/SKILL.md`
**Description**: Modern Kotlin 1.9+ patterns

**Covers**:
- Data classes and sealed classes
- Coroutines and Flow
- Extension functions
- Null safety patterns
- Spring Boot + Kotlin
- DSL patterns
- Inline functions

---

### Build Tool Skills

#### maven-patterns
**Path**: `skills/maven-patterns/SKILL.md`
**Description**: Maven best practices and patterns

**Covers**:
- Multi-module projects
- Dependency management with BOMs
- Plugin configuration
- Profiles for environments
- Maven wrapper
- Release management

---

#### gradle-patterns
**Path**: `skills/gradle-patterns/SKILL.md`
**Description**: Gradle best practices and patterns

**Covers**:
- Kotlin DSL
- Multi-project builds
- Custom tasks and plugins
- Build caching
- Version catalogs
- Convention plugins

---

### Architecture Skills

#### backend-patterns
**Path**: `skills/backend-patterns/SKILL.md`
**Description**: Backend API and database patterns

**Covers**:
- REST API design
- GraphQL patterns
- Database optimization
- Caching strategies (Redis, Memcached)
- Message queues (RabbitMQ, Kafka)
- Microservices patterns

---

#### frontend-patterns
**Path**: `skills/frontend-patterns/SKILL.md`
**Description**: React and Next.js patterns

**Covers**:
- React hooks
- Next.js App Router
- State management (Zustand, Redux)
- Server components
- Client components
- Performance optimization

---

#### ci-cd-patterns
**Path**: `skills/ci-cd-patterns/SKILL.md`
**Description**: CI/CD and deployment patterns

**Covers**:
- Pipeline stages (build, test, deploy)
- Dependency caching
- Matrix builds
- Security scanning
- Docker multi-stage builds
- Kubernetes deployments
- GitOps workflows
- Blue-green deployments
- Canary releases

---

### Testing Skills

#### tdd-workflow
**Path**: `skills/tdd-workflow/SKILL.md`
**Description**: Test-driven development methodology

**Covers**:
- Red → Green → Refactor cycle
- Writing testable code
- Mocking and stubbing
- Test coverage requirements (80%+)
- Integration testing
- E2E testing

---

#### security-review
**Path**: `skills/security-review/SKILL.md`
**Description**: Security review checklist

**Covers**:
- OWASP Top 10
- SQL injection prevention
- XSS protection
- CSRF protection
- Authentication best practices
- Authorization patterns
- Secret management

---

### Advanced Skills

#### continuous-learning
**Path**: `skills/continuous-learning/SKILL.md`
**Description**: Auto-extract patterns from sessions ([Advanced Topics](guides/advanced-topics.md))

**Covers**:
- Pattern extraction
- Skill creation
- Knowledge capture
- Session analysis

---

#### verification-loop
**Path**: `skills/verification-loop/SKILL.md`
**Description**: Continuous verification ([Advanced Topics](guides/advanced-topics.md))

**Covers**:
- Checkpoint creation
- Verification loops
- Grader types
- Pass@k metrics

---

#### eval-harness
**Path**: `skills/eval-harness/SKILL.md`
**Description**: Verification loop evaluation ([Advanced Topics](guides/advanced-topics.md))

**Covers**:
- Evaluation frameworks
- Test harnesses
- Metrics collection
- Performance tracking

---

#### proactive-orchestration
**Path**: `skills/proactive-orchestration/SKILL.md`
**Description**: Top-level pipeline orchestrator for complex feature work

**Phases**: PLAN -> TDD -> VERIFY -> REVIEW -> REPORT

**When It Fires**:
- Complex feature requests (multiple components/files)
- Architectural changes (new endpoints, services, modules)
- Non-trivial scope ("add", "implement", "build", "create")

**Does NOT fire on**: Simple bug fixes, single-file edits, documentation, configuration, refactoring

**Agents Used**: planner, [ecosystem]-tdd-guide, [ecosystem]-build-resolver (if needed), code-reviewer, [ecosystem]-security-reviewer, language reviewers

**Relationship to other proactive skills**: Subsumes `proactive-planning`, `proactive-tdd`, and `proactive-review` for complex feature work. Individual skills fire only for standalone single-phase work.

---

### Coordination Skills

#### agent-teams
**Path**: `skills/agent-teams/SKILL.md`
**Description**: Guide for Agent Teams coordination when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is enabled

**Prerequisite**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be set

**Pre-Configured Scenarios**:
- Parallel code review (security, quality, performance reviewers)
- Competing hypothesis debugging (multiple investigators)
- Cross-layer feature work (backend, frontend, tests)
- Research and architecture exploration

**Guard Rails**: Max 3 teammates, focused spawn prompts, minimize broadcasts, delegate verbose I/O to subagents

---

#### extend
**Path**: `skills/extend/SKILL.md`
**Description**: Generate new plugin components following existing patterns

**Covers**:
- Scaffold new agents, skills, hooks, commands, rules
- Follow existing naming conventions and structure
- Auto-integrate with plugin.json

---

#### claude-mem-context
**Path**: `skills/claude-mem-context/SKILL.md`
**Description**: Cross-session historical context via claude-mem MCP

**Covers**:
- Query past decisions and architecture rationale
- Search debugging patterns and resolved issues
- Bridge context across sessions

---

#### clickhouse-io
**Path**: `skills/clickhouse-io/SKILL.md`
**Description**: ClickHouse database patterns and query optimization

**Covers**:
- Analytical query optimization
- Data engineering patterns
- High-performance analytical workloads

---

#### project-guidelines-example
**Path**: `skills/project-guidelines-example/SKILL.md`
**Description**: Template for project-specific skills

**Covers**:
- Example architecture documentation
- File structure conventions
- Code patterns and testing requirements

---

### Serena Integration Skills

#### serena-setup
**Path**: `skills/serena-setup/SKILL.md`
**Description**: Complete Serena MCP setup workflow

#### serena-status
**Path**: `skills/serena-status/SKILL.md`
**Description**: Serena configuration diagnostics

#### serena-cleanup
**Path**: `skills/serena-cleanup/SKILL.md`
**Description**: Safe Serena cleanup and removal

#### serena-code-navigation
**Path**: `skills/serena-code-navigation/SKILL.md`
**Description**: Serena MCP code navigation tool mapping

#### git-sync
**Path**: `skills/git-sync/SKILL.md`
**Description**: Analyze git changes and report codebase impact

---

## Usage Examples

### Example 1: Python Code Review Workflow

```bash
# 1. Write code
vim src/api/users.py

# 2. Review with Python expert
/python-reviewer

# 3. Apply Python patterns
/python-patterns

# 4. Security review
/security-reviewer

# 5. Run tests
pytest
```

### Example 2: Java Spring Boot Setup

```bash
# 1. Plan feature
/planner "User authentication with JWT"

# 2. Review architecture
/architect

# 3. Review Java code
/java-reviewer

# 4. Optimize Maven build
/maven-expert

# 5. Generate CI/CD
/ci-cd github-actions java-maven
```

### Example 3: Full-Stack Application

```bash
# Backend (Python FastAPI)
/python-reviewer
/python-patterns
/ci-cd github-actions python

# Frontend (Next.js)
/code-reviewer
/frontend-patterns
/ci-cd github-actions nodejs

# DevOps
/ci-cd-architect
```

---

## Summary

**27 Agents**:
- 2 planning agents (planner, architect)
- 3 TDD agents (ts-tdd-guide, jvm-tdd-guide, python-tdd-guide)
- 1 ecosystem-aware code reviewer
- 3 security reviewers (ts-, jvm-, python-)
- 3 build resolvers (ts-, jvm-, python-)
- 3 E2E runners (ts-, jvm-, python-)
- 3 refactor cleaners (ts-, jvm-, python-)
- 4 language reviewers (python, java, kotlin, groovy)
- 2 build tool agents (maven-expert, gradle-expert)
- 1 CI/CD agent
- 2 utility agents (doc-updater, setup-agent)

**36 Skills**:
- 3 coding standards skills (TS/JS, JVM, Python)
- 3 backend pattern skills (TS/JS, JVM, Python)
- 3 TDD workflow skills (TS/JS, JVM, Python)
- 3 security review skills (TS/JS, JVM, Python)
- 4 proactive skills (orchestration, review, planning, TDD)
- 5 language/build tool skills (python, kotlin, maven, gradle, ci-cd)
- 5 Serena integration skills (setup, status, cleanup, code-navigation, git-sync)
- 4 coordination/domain skills (agent-teams, claude-mem-context, clickhouse-io, extend)
- 6 general/advanced skills (continuous-learning, strategic-compact, eval-harness, verification-loop, frontend-patterns, project-guidelines-example)

**Best Practices**:
- Use language-specific agents for code review
- Use build tool agents for optimization
- Use planner for task breakdown
- Use architect for system design
- Combine multiple agents for comprehensive review
- Use Agent Teams for parallel exploration (when experimental flag is enabled)

---

*Agent & Skill Catalog Version: 3.1 | Last Updated: 2026-02-14*

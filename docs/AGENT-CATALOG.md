# Agent & Skill Catalog

**Version**: 2.0.0
**Last Updated**: 2026-01-25
**Total Agents**: 16
**Total Skills**: 16

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

#### tdd-guide
**Command**: `/tdd-guide`
**Model**: Sonnet
**Description**: Test-driven development guidance

**When to Use**:
- Writing tests first
- Need TDD workflow guidance
- Want to improve test coverage
- Learning TDD practices

**What It Does**:
- Guides through TDD workflow (Red → Green → Refactor)
- Suggests test cases
- Helps write testable code
- Ensures 80%+ coverage

---

#### code-reviewer
**Command**: `/code-reviewer`
**Model**: Opus
**Description**: General code quality and security review

**When to Use**:
- Before committing code
- Need code review
- Want to improve code quality
- Security audit

**What It Does**:
- Reviews code for quality
- Checks security vulnerabilities
- Suggests improvements
- Validates best practices

---

#### security-reviewer
**Command**: `/security-reviewer`
**Model**: Opus
**Description**: Deep security analysis and vulnerability detection

**When to Use**:
- Security audit required
- Sensitive code changes
- Pre-production review
- Compliance requirements

**What It Does**:
- OWASP Top 10 checks
- SQL injection detection
- XSS vulnerability analysis
- Authentication/authorization review
- Secret detection

---

#### build-error-resolver
**Command**: `/build-error-resolver`
**Model**: Sonnet
**Description**: Diagnose and fix build errors

**When to Use**:
- Build failing
- Compilation errors
- Dependency conflicts
- Configuration issues

**What It Does**:
- Analyzes error logs
- Identifies root cause
- Suggests fixes
- Provides step-by-step resolution

---

#### e2e-runner
**Command**: `/e2e-runner`
**Model**: Sonnet
**Description**: End-to-end test generation and execution (Playwright)

**When to Use**:
- Need E2E tests
- Testing user workflows
- Regression testing
- CI/CD integration

**What It Does**:
- Generates Playwright tests
- Covers user journeys
- Handles assertions
- Provides debugging tips

---

#### refactor-cleaner
**Command**: `/refactor-cleaner`
**Model**: Sonnet
**Description**: Dead code cleanup and refactoring

**When to Use**:
- Code cleanup needed
- Remove unused code
- Improve code structure
- Reduce complexity

**What It Does**:
- Identifies dead code
- Finds unused imports/variables
- Suggests simplifications
- Improves readability

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
**Description**: Auto-extract patterns from sessions (Longform Guide feature)

**Covers**:
- Pattern extraction
- Skill creation
- Knowledge capture
- Session analysis

---

#### verification-loop
**Path**: `skills/verification-loop/SKILL.md`
**Description**: Continuous verification (Longform Guide feature)

**Covers**:
- Checkpoint creation
- Verification loops
- Grader types
- Pass@k metrics

---

#### eval-harness
**Path**: `skills/eval-harness/SKILL.md`
**Description**: Verification loop evaluation (Longform Guide feature)

**Covers**:
- Evaluation frameworks
- Test harnesses
- Metrics collection
- Performance tracking

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

**16 Agents**:
- 9 general-purpose agents
- 4 language-specific agents
- 2 build tool agents
- 1 CI/CD agent

**16 Skills**:
- 2 language pattern skills
- 2 build tool skills
- 3 architecture skills
- 1 testing skill
- 8 general/advanced skills

**Best Practices**:
- Use language-specific agents for code review
- Use build tool agents for optimization
- Use planner for task breakdown
- Use architect for system design
- Combine multiple agents for comprehensive review

---

*Agent & Skill Catalog Version: 1.0 | Last Updated: 2026-01-25*

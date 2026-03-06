# Student Management System — Architecture Document

---

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                    │
│         (Axios, JWT stored in memory/cookie)        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS / REST / JSON
                      │ Authorization: Bearer <token>
┌─────────────────────▼───────────────────────────────┐
│                FastAPI Application                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │               Middleware Layer               │   │
│  │   JWT Auth • Request Logging • CORS          │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  ┌──────────────────────▼───────────────────────┐   │
│  │                Router Layer                  │   │
│  │   /api/v1/auth  • /api/v1/students           │   │
│  │   /api/v1/courses • /api/v1/students/{id}/   │   │
│  │                courses                       │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  ┌──────────────────────▼───────────────────────┐   │
│  │               Service Layer                  │   │
│  │   StudentService • CourseService             │   │
│  │   EnrollmentService • AuthService            │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  ┌──────────────────────▼───────────────────────┐   │
│  │             Repository Layer                 │   │
│  │   StudentRepository • CourseRepository       │   │
│  │   EnrollmentRepository • UserRepository      │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │ SQLAlchemy ORM (async)     │
└─────────────────────────┼───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                    PostgreSQL                       │
│         (students, courses, enrollments,            │
│          users, alembic_version)                    │
└─────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities

### Middleware Layer
- Intercepts every incoming request before it reaches a router
- Validates and decodes the JWT token; attaches the authenticated user context to the request state
- Enforces CORS policy for the React frontend origin
- Logs request method, path, and response status at INFO level
- Catches all unhandled exceptions and returns the standard error envelope — no raw exceptions reach the client

### Router Layer (`app/api/v1/`)
- Declares HTTP routes and maps them to service calls
- Owns request deserialization via Pydantic schemas and response serialization via the standard envelope
- Enforces role-based access at the route level using dependency injection (`Depends(require_role("admin"))`)
- Contains no business logic — every non-trivial operation is delegated to the service layer
- One file per resource: `auth.py`, `students.py`, `courses.py`, `enrollments.py`

### Service Layer (`app/services/`)
- Owns all business logic: duplicate checks, soft delete rules, enrollment conflict detection
- Orchestrates calls to one or more repositories to fulfil a use case
- Raises domain-specific exceptions (e.g., `StudentNotFoundException`, `EmailAlreadyExistsException`) which the middleware translates into error envelopes
- Has no knowledge of HTTP — receives plain Python objects, returns plain Python objects
- Fully unit-testable with mocked repositories; no real DB required in tests

### Repository Layer (`app/repositories/`)
- Sole layer permitted to interact with SQLAlchemy ORM models and execute DB queries
- Exposes a clean async interface: `get_by_id`, `get_all`, `create`, `update`, `delete`
- Contains no business logic — pure data access only
- Isolates the service layer from ORM specifics; swapping the ORM or DB engine requires changes only here

### Database Layer
- PostgreSQL stores all persistent state
- Schema managed exclusively via Alembic migrations — no manual schema changes
- SQLAlchemy async engine (`asyncpg` driver) used for all connections
- Unique constraints enforced at DB level for: `students.email`, `courses.course_code`, and the `(student_id, course_id)` pair in `enrollments`

---

## 3. Request Flow

**Example: Staff user assigns a course to a student**

```
1. React sends:
   POST /api/v1/students/{id}/courses
   Headers: Authorization: Bearer <token>
   Body: { "course_id": "uuid" }

2. Middleware Layer:
   - Decodes and validates JWT token
   - Attaches { id, email, role: "staff" } to request.state.user
   - Logs the incoming request

3. Router Layer (enrollments.py):
   - Validates request body via EnrollmentCreateSchema (Pydantic)
   - Checks role via Depends(require_role("staff")) — passes
   - Calls EnrollmentService.assign_course(student_id, course_id)

4. Service Layer (EnrollmentService):
   - Calls StudentRepository.get_by_id(student_id)
     → Raises StudentNotFoundException if not found or inactive
   - Calls CourseRepository.get_by_id(course_id)
     → Raises CourseNotFoundException if not found
   - Calls EnrollmentRepository.get_by_student_and_course(student_id, course_id)
     → Raises AlreadyEnrolledException if record exists
   - Calls EnrollmentRepository.create(student_id, course_id)
   - Returns enrollment domain object

5. Router Layer:
   - Wraps result in standard response envelope
   - Returns HTTP 201

6. Middleware Layer:
   - Logs response status 201
   - Returns response to client
```

---

## 4. Dependency Map

```
React Frontend
    └── Router Layer
            └── Service Layer
                    └── Repository Layer
                                └── SQLAlchemy Models
                                            └── PostgreSQL

Middleware Layer
    └── (wraps all Router Layer calls)

Pydantic Schemas
    └── (used by Router Layer for request/response only)

Alembic
    └── (manages PostgreSQL schema; independent of runtime)
```

**Rules:**
- Router → Service only (never Router → Repository directly)
- Service → Repository only (never Service → SQLAlchemy directly)
- Repository → SQLAlchemy Models only
- Pydantic Schemas are never used inside the Service or Repository layers
- Middleware has no dependency on any specific router or service

---

## 5. Architectural Decision Records (ADRs)

### ADR-01: Repository Pattern
**Context:** The service layer needs to read and write data to PostgreSQL.
**Decision:** Introduce a dedicated repository layer between the service and the ORM.
**Rationale:** Services can be unit-tested by mocking repositories — no real DB connection required. Business logic is decoupled from ORM specifics, so a future ORM change does not ripple into service code.
**Consequences:** One additional layer of abstraction per entity. Acceptable given the testability and maintainability gain.

---

### ADR-02: JWT Authentication via Middleware (not per-route)
**Context:** Every protected endpoint needs to validate the caller's identity and role.
**Decision:** JWT validation runs in a single middleware function, not as a decorator on each route.
**Rationale:** Centralising auth in middleware eliminates the risk of a developer accidentally omitting auth on a new route. Role enforcement (admin vs staff) is handled separately via a `require_role` dependency injected per route, keeping auth and authorisation cleanly separated.
**Consequences:** Every route is protected by default. Public routes (e.g., `/api/v1/auth/login`) must be explicitly excluded from the middleware check.

---

### ADR-03: Async-First Database Access
**Context:** FastAPI is an async framework; blocking DB calls inside async route handlers stall the event loop.
**Decision:** All database interactions use SQLAlchemy's async engine with the `asyncpg` driver.
**Rationale:** Prevents thread-blocking under concurrent load. Maintains consistency with FastAPI's async model throughout the stack.
**Consequences:** All repository methods must be declared `async`. Synchronous SQLAlchemy patterns (e.g., `session.execute()` without `await`) are not permitted.

---

### ADR-04: Domain Exceptions Translated at Middleware Boundary
**Context:** Services raise domain exceptions (e.g., `StudentNotFoundException`). These must become structured HTTP error responses.
**Decision:** A global exception handler in middleware maps each domain exception to its HTTP status code and error code string.
**Rationale:** Services remain HTTP-agnostic — they raise meaningful domain errors, not HTTP exceptions. This keeps the service layer portable and independently testable.
**Consequences:** Every new domain exception must be registered in the global exception handler. This is a known, low-cost maintenance overhead.

---

### ADR-05: Alembic for Schema Migrations
**Context:** The PostgreSQL schema will evolve as the system is built and extended.
**Decision:** All schema changes are managed exclusively via Alembic migration scripts. No manual DDL changes to the database are permitted.
**Rationale:** Alembic provides a versioned, reproducible migration history that is tied to the codebase. Any developer or environment can reach the correct schema state by running `alembic upgrade head`.
**Consequences:** Every schema change requires a corresponding Alembic migration file committed to the repository.

---

## 6. Future Extensibility

| Change                          | What Would Need to Modify                                      |
|---------------------------------|----------------------------------------------------------------|
| Add student-facing portal (v2)  | New router + service for student-scoped reads; new JWT role claim |
| Multi-tenant support            | Add `school_id` FK to all entities; repository queries scoped by tenant |
| Switch from PostgreSQL to another DB | Repository layer only; service and router layers unchanged   |
| Add caching (e.g., Redis)       | Repository layer — cache-aside pattern added per method        |
| Add background tasks (e.g., email notifications) | New `tasks/` module; services dispatch tasks post-commit; no router or repository changes |
| Scale to multiple backend instances | Stateless JWT auth already supports this; add a load balancer in front |
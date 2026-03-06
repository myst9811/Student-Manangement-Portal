# Student Management System — Claude Code Governance File

> This file is the single source of truth for how Claude Code generates,
> modifies, and reviews code in this project. Every rule here is non-negotiable.
> When in doubt, ask — do not invent.

---

## 1. Project Context

This is an internal Student Management System built for a single school.
- **Backend:** FastAPI (Python, async)
- **Frontend:** React
- **Database:** PostgreSQL (async via asyncpg)
- **ORM:** SQLAlchemy (async)
- **Migrations:** Alembic
- **Auth:** JWT (issued by backend, validated per request via middleware)
- **API Style:** REST, versioned under `/api/v1/`

---

## 2. Folder Structure

Do not deviate from this structure. Do not create files outside these locations.

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── students.py
│   │       ├── courses.py
│   │       └── enrollments.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── student_service.py
│   │   ├── course_service.py
│   │   └── enrollment_service.py
│   ├── repositories/
│   │   ├── user_repository.py
│   │   ├── student_repository.py
│   │   ├── course_repository.py
│   │   └── enrollment_repository.py
│   ├── models/
│   │   ├── user.py
│   │   ├── student.py
│   │   ├── course.py
│   │   └── enrollment.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── student.py
│   │   ├── course.py
│   │   └── enrollment.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   ├── middleware.py
│   │   └── security.py
│   └── main.py
├── migrations/
│   └── versions/
├── tests/
│   ├── services/
│   │   ├── test_student_service.py
│   │   ├── test_course_service.py
│   │   ├── test_enrollment_service.py
│   │   └── test_auth_service.py
│   └── conftest.py
├── alembic.ini
├── requirements.txt
└── .env.example

frontend/
├── src/
│   ├── api/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
└── package.json
```

---

## 3. Layering Rules

These rules are absolute. Violations must be corrected before moving forward.

```
Router  →  Service  →  Repository  →  SQLAlchemy Model  →  PostgreSQL
```

| Rule                                                         | Enforced |
|--------------------------------------------------------------|----------|
| Routers never import or call repositories directly           | ✅       |
| Services never import SQLAlchemy models or write ORM queries | ✅       |
| Repositories are the only layer that touches the ORM        | ✅       |
| Pydantic schemas are used only in the router layer           | ✅       |
| Services raise domain exceptions — never `HTTPException`     | ✅       |
| Routers never contain business logic                         | ✅       |

---

## 4. Naming Conventions

| Artifact              | Convention       | Example                        |
|-----------------------|------------------|--------------------------------|
| Files                 | snake_case       | `student_service.py`           |
| Classes               | PascalCase       | `StudentService`               |
| Functions / methods   | snake_case       | `get_student_by_id()`          |
| Pydantic schemas      | PascalCase + `Schema` suffix | `StudentCreateSchema`  |
| SQLAlchemy models     | PascalCase, no suffix | `Student`                 |
| Domain exceptions     | PascalCase + `Exception` suffix | `StudentNotFoundException` |
| Constants             | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE = 100`      |
| URL paths             | lowercase, plural nouns, kebab-case | `/api/v1/students` |
| JSON fields           | snake_case       | `first_name`, `course_code`    |
| Query parameters      | snake_case       | `page_size`, `include_inactive`|

---

## 5. Response Envelope

**Every endpoint must return this exact envelope. No exceptions.**

```python
# Success
{
    "success": True,
    "data": <resource or list>,
    "message": "<human readable string>",
    "meta": None  # or pagination dict on list endpoints
}

# Error
{
    "success": False,
    "data": None,
    "message": "<human readable string>",
    "error": {
        "code": "<SCREAMING_SNAKE_CASE>",
        "detail": "<specific context>",
        "field": None  # or field name on validation errors
    }
}

# Paginated list meta
"meta": {
    "page": <int>,
    "page_size": <int>,
    "total": <int>
}
```

Do not return raw Pydantic models, plain dicts, or bare lists as top-level responses.

---

## 6. Error Handling

- **Never** expose raw SQLAlchemy exceptions, Python exceptions, or stack traces to the API layer
- All domain exceptions are defined in `core/exceptions.py`
- All domain exceptions are caught and translated in `core/middleware.py`
- Every error response must include a `code` from this list:

```python
# Auth
MISSING_TOKEN
EXPIRED_TOKEN
INVALID_TOKEN
INVALID_CREDENTIALS
FORBIDDEN

# Student
STUDENT_NOT_FOUND
EMAIL_ALREADY_EXISTS

# Course
COURSE_NOT_FOUND
COURSE_CODE_ALREADY_EXISTS

# Enrollment
ALREADY_ENROLLED
ENROLLMENT_NOT_FOUND

# General
VALIDATION_ERROR
INTERNAL_ERROR
```

- Adding a new domain exception requires: (1) define in `core/exceptions.py`, (2) register handler in `core/middleware.py`, (3) add error code to the list above

---

## 7. Authentication & Authorisation

- JWT validation runs in middleware — not per-route decorators
- Role enforcement uses a `require_role` dependency injected per route:

```python
# Admin only
@router.post("/students", dependencies=[Depends(require_role("admin"))])

# Admin and Staff
@router.get("/students", dependencies=[Depends(require_role("admin", "staff"))])
```

- Public routes (login only) must be explicitly excluded from JWT middleware
- Never hardcode role strings outside of `core/security.py` — use constants:

```python
ROLE_ADMIN = "admin"
ROLE_STAFF = "staff"
```

---

## 8. Database & ORM Rules

- All DB interactions must use `async` SQLAlchemy sessions — no sync calls
- Session lifecycle managed via FastAPI dependency injection — never create sessions manually inside services or repositories
- All schema changes managed via Alembic migrations — never alter tables manually
- Unique constraints must exist at DB level for: `students.email`, `courses.course_code`, `enrollments(student_id, course_id)`
- Soft delete is implemented via `is_active = False` — never issue `DELETE` SQL for student or user records
- All timestamps stored in UTC
- `updated_at` must be refreshed on every write operation

---

## 9. Validation Rules

All request bodies validated via Pydantic schemas in `app/schemas/`. The following rules apply:

| Field             | Validation                                              |
|-------------------|---------------------------------------------------------|
| `email`           | `EmailStr` type — Pydantic handles format validation    |
| `first_name`      | `min_length=1`, `max_length=100`                        |
| `last_name`       | `min_length=1`, `max_length=100`                        |
| `enrollment_date` | `date` type, must not be a future date                  |
| `course_name`     | `min_length=1`, `max_length=200`                        |
| `course_code`     | `min_length=1`, `max_length=20`, regex: `^[A-Z0-9-]+$` |
| `password`        | `min_length=8`                                          |
| `page`            | `ge=1`                                                  |
| `page_size`       | `ge=1`, `le=100`                                        |

---

## 10. Logging Rules

Use Python's `logging` module via a logger instantiated per module:

```python
import logging
logger = logging.getLogger(__name__)
```

| Level   | When to use                                              |
|---------|----------------------------------------------------------|
| `INFO`  | All incoming requests (method, path, status, duration)   |
| `INFO`  | Successful service operations                            |
| `WARNING` | Expected failures (404, 409) — not errors, but notable |
| `ERROR` | All 5xx errors — always include stack trace via `exc_info=True` |

**Never log:** passwords, JWT tokens, or any PII (email, names)
**Never use:** `print()` statements anywhere in the codebase

---

## 11. Testing Rules

- Test location: `tests/services/` for all service unit tests
- Framework: `pytest` with `pytest-asyncio` for async tests
- Service tests mock the repository layer — no real DB connections in unit tests
- Every service function must have a corresponding test covering:
  - Happy path
  - At least 2 error paths (matching acceptance criteria)

```python
# Correct pattern — mock the repository
async def test_create_student_duplicate_email(mock_student_repo):
    mock_student_repo.get_by_email.return_value = existing_student
    with pytest.raises(EmailAlreadyExistsException):
        await student_service.create_student(payload, repo=mock_student_repo)
```

- Do not write tests that hit the real database in the `tests/services/` layer
- Integration tests (if added in v2) go in `tests/integration/`

---

## 12. File Size & Complexity Limits

| Rule                                             | Limit       |
|--------------------------------------------------|-------------|
| Maximum lines per file                           | 200 lines   |
| Maximum functions per service file               | 10 functions|
| If a file exceeds the limit                      | Split it    |

If Claude Code generates a file that exceeds 200 lines, stop and refactor before continuing.

---

## 13. What Claude Code Must Never Do

- **Never** create an endpoint not defined in `API-CONTRACTS.md` — add it to the contract first
- **Never** skip the service layer (router calling repository directly)
- **Never** return a raw exception or stack trace in an API response
- **Never** use `print()` — use the logger
- **Never** hardcode secrets, DB URLs, or tokens — use environment variables via `core/config.py`
- **Never** write synchronous DB calls inside async route handlers
- **Never** perform a hard delete on student or user records
- **Never** create a migration manually — always use `alembic revision --autogenerate`
- **Never** add a new error code without registering it in `core/exceptions.py` and `core/middleware.py`

---

## 14. Environment Variables

All configuration via environment variables. No hardcoded values anywhere.

```bash
# .env.example
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/sms_db
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=development
```

Accessed exclusively through `core/config.py` using Pydantic `BaseSettings`.
Never import `os.environ` directly outside of `core/config.py`.
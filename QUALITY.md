# Student Management System — Quality Standards

> A feature is not done when the code is written.
> A feature is done when it passes every check in this document.

---

## 1. Definition of Done

A user story is **DONE** when all of the following are true:

- [ ] Code written and passes all checks in this document
- [ ] Happy path tested and passing
- [ ] Minimum 2 error paths tested and passing (per acceptance criteria)
- [ ] Response shape matches `API-CONTRACTS.md` exactly — field names, types, and envelope
- [ ] All new domain exceptions registered in `core/exceptions.py` and `core/middleware.py`
- [ ] No linting errors (`ruff` or `flake8` passes clean)
- [ ] No `print()` statements in any file
- [ ] No hardcoded secrets, URLs, or tokens
- [ ] Alembic migration created for any schema change

---

## 2. Code Review Checklist

Run this checklist on every PR before merge.

### Response & Envelope
- [ ] Every endpoint returns the standard success envelope (`success`, `data`, `message`, `meta`)
- [ ] Every error returns the standard error envelope (`success`, `data`, `message`, `error.code`, `error.detail`, `error.field`)
- [ ] `error.code` is a value from the approved list in `CLAUDE.md` Section 6
- [ ] `meta` is present and populated on all list endpoints
- [ ] `meta` is `null` on all non-list endpoints
- [ ] `data` is never a bare list or raw Pydantic model at the top level
- [ ] Soft delete returns `200` with updated record showing `is_active: false`
- [ ] Unenrollment returns `200` with `data: null`

### Layering
- [ ] No router imports a repository directly
- [ ] No service imports a SQLAlchemy model or writes ORM queries
- [ ] No Pydantic schema is used inside a service or repository
- [ ] All business logic lives in the service layer — not in routers or repositories
- [ ] No `HTTPException` raised inside a service — only domain exceptions

### Auth & Authorisation
- [ ] Every protected route has a `require_role` dependency
- [ ] Login route is excluded from JWT middleware
- [ ] No route relies on frontend to enforce role — backend enforces it
- [ ] JWT secret and expiry read from `core/config.py` — not hardcoded

### Database & ORM
- [ ] All DB calls are `async` — no synchronous SQLAlchemy calls in async context
- [ ] No raw SQL strings — all queries via SQLAlchemy ORM
- [ ] No `DELETE` SQL issued for student or user records — soft delete only
- [ ] `updated_at` refreshed on every write
- [ ] All timestamps stored and returned in UTC / ISO 8601 format
- [ ] Schema changes have a corresponding Alembic migration committed

### Error Handling
- [ ] No raw exceptions or stack traces returned in API responses
- [ ] All domain exceptions caught in `core/middleware.py`
- [ ] 404 returned for missing or inactive student when `include_inactive` not set
- [ ] 409 returned for duplicate `email` on student create and update
- [ ] 409 returned for duplicate `course_code` on course create
- [ ] 409 returned for duplicate enrollment on course assignment
- [ ] 422 returned for all malformed or missing request body fields

### Validation
- [ ] All request bodies use Pydantic schemas from `app/schemas/`
- [ ] `email` fields use `EmailStr`
- [ ] `course_code` matches regex `^[A-Z0-9-]+$`
- [ ] `enrollment_date` rejects future dates
- [ ] `page_size` capped at 100

### Logging
- [ ] All incoming requests logged at `INFO` level
- [ ] All 5xx errors logged at `ERROR` level with `exc_info=True`
- [ ] No passwords, tokens, or PII present in any log output
- [ ] No `print()` statements anywhere in the codebase

### Code Quality
- [ ] No file exceeds 200 lines — split if needed
- [ ] No function exceeds 30 lines — refactor if needed
- [ ] No hardcoded values — all config via `core/config.py` and `.env`
- [ ] All environment variables documented in `.env.example`

---

## 3. API Consistency Checks

Verify these once per epic completion — not per story.

| Check                                                        | Expected                        |
|--------------------------------------------------------------|---------------------------------|
| All list endpoints support `page` and `page_size`           | ✅ Default: page=1, page_size=20 |
| `page_size` has a hard cap                                   | ✅ Max: 100                      |
| All list endpoints return `meta` with `page`, `page_size`, `total` | ✅                        |
| All single-record endpoints return `meta: null`             | ✅                               |
| Soft delete returns `200` — not `204`                       | ✅                               |
| Unenrollment returns `200` with `data: null`                | ✅                               |
| All timestamps in ISO 8601 UTC format                       | ✅ e.g. `2024-08-01T10:00:00Z`   |
| All URL paths lowercase plural nouns                        | ✅ `/students`, `/courses`       |
| No verbs in URL paths                                       | ✅                               |
| All JSON fields snake_case                                  | ✅ `first_name`, `course_code`   |

---

## 4. Testing Coverage Requirements

### Per Story Minimum
Every user story must have tests covering:

| Scenario                        | Required |
|---------------------------------|----------|
| Happy path                      | ✅ Mandatory |
| Resource not found (404)        | ✅ Mandatory for all `{id}` endpoints |
| Duplicate resource (409)        | ✅ Mandatory where applicable |
| Invalid request body (422)      | ✅ Mandatory for all POST/PUT endpoints |
| Wrong role (403)                | ✅ Mandatory for Admin-only endpoints |
| Missing/expired token (401)     | ✅ Mandatory for all protected endpoints |

### Service Layer Test Pattern
```python
# tests/services/test_student_service.py

async def test_create_student_success(mock_student_repo):
    mock_student_repo.get_by_email.return_value = None
    mock_student_repo.create.return_value = student_fixture
    result = await student_service.create_student(payload, repo=mock_student_repo)
    assert result.email == payload.email

async def test_create_student_duplicate_email(mock_student_repo):
    mock_student_repo.get_by_email.return_value = existing_student_fixture
    with pytest.raises(EmailAlreadyExistsException):
        await student_service.create_student(payload, repo=mock_student_repo)

async def test_get_student_not_found(mock_student_repo):
    mock_student_repo.get_by_id.return_value = None
    with pytest.raises(StudentNotFoundException):
        await student_service.get_student(student_id=999, repo=mock_student_repo)
```

### Coverage Targets
| Layer       | Target      | Notes                                      |
|-------------|-------------|--------------------------------------------|
| Service     | 90%+        | Unit tests with mocked repositories        |
| Router      | Happy path  | Verified via manual test checklist         |
| Repository  | Not unit tested | Covered implicitly by integration in v2 |

---

## 5. Manual Test Checklist (Pre-Submission)

Run these manually against a locally running instance before marking any epic complete.

### Authentication
- [ ] `POST /api/v1/auth/login` with valid credentials → 200 + JWT token returned
- [ ] `POST /api/v1/auth/login` with wrong password → 401 `INVALID_CREDENTIALS`
- [ ] `GET /api/v1/students` with no token → 401 `MISSING_TOKEN`
- [ ] `GET /api/v1/students` with expired token → 401 `EXPIRED_TOKEN`
- [ ] `POST /api/v1/students` with Staff JWT → 403 `FORBIDDEN`

### Student Management
- [ ] Create student → verify response matches `API-CONTRACTS.md` field-for-field
- [ ] Create student with duplicate email → 409 `EMAIL_ALREADY_EXISTS`
- [ ] Create student with missing `first_name` → 422 `VALIDATION_ERROR` with `field: "first_name"`
- [ ] Get student by ID → verify `courses` array is present (empty or populated)
- [ ] Get inactive student without `include_inactive=true` → 404 `STUDENT_NOT_FOUND`
- [ ] Get inactive student with `include_inactive=true` → 200 with `is_active: false`
- [ ] Update student email to duplicate → 409 `EMAIL_ALREADY_EXISTS`
- [ ] Soft delete student → 200 with `is_active: false`, record still in DB
- [ ] List students → verify pagination `meta` block present and accurate

### Course Management
- [ ] Create course → verify response matches `API-CONTRACTS.md` field-for-field
- [ ] Create course with duplicate `course_code` → 409 `COURSE_CODE_ALREADY_EXISTS`
- [ ] Get course with invalid ID → 404 `COURSE_NOT_FOUND`
- [ ] List courses → verify pagination `meta` block present

### Enrollment Management
- [ ] Assign course to student → 201 with enrollment record
- [ ] Assign course to inactive student → 404 `STUDENT_NOT_FOUND`
- [ ] Assign non-existent course → 404 `COURSE_NOT_FOUND`
- [ ] Assign same course twice → 409 `ALREADY_ENROLLED`
- [ ] List enrollments for student with no courses → 200 with empty array (not 404)
- [ ] Remove enrollment → 200 with `data: null`, student and course records unaffected
- [ ] Remove non-existent enrollment → 404 `ENROLLMENT_NOT_FOUND`

---

## 6. Pre-Submission Final Audit

Run this Claude Code prompt on completed code before submission:

```
I have built a Student Management System.

Documents:
- API-CONTRACTS.md: [paste]
- DATA-MODEL.md: [paste]
- CLAUDE.md: [paste]

Code files:
- app/api/v1/students.py: [paste]
- app/api/v1/courses.py: [paste]
- app/api/v1/enrollments.py: [paste]
- app/services/student_service.py: [paste]
- app/services/course_service.py: [paste]
- app/services/enrollment_service.py: [paste]

Audit for:
1. Does every endpoint return the standard response envelope?
2. Does every error use the correct error code from API-CONTRACTS.md?
3. Are there endpoints in code not defined in API-CONTRACTS.md?
4. Are there fields in responses that do not match DATA-MODEL.md columns?
5. Are there missing error cases from the acceptance criteria?
6. Are there any layering violations (router → repository, service → ORM)?
7. Are there any hardcoded values that should be in config?

List every gap found. Do not summarise — list each issue individually.
```
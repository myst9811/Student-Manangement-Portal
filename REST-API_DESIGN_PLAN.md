# Student Management System — REST API Design Plan

> This is a cross-check document. It does not introduce new decisions.
> Its sole purpose is to verify that API-CONTRACTS.md is internally consistent,
> correctly mapped to the backlog, and adheres to REST design principles.

---

## 1. Naming Convention Audit

### URL Structure Rules
| Rule                                      | Status | Notes                                              |
|-------------------------------------------|--------|----------------------------------------------------|
| All URLs lowercase                        | ✅     | `/api/v1/students`, `/api/v1/courses`              |
| Plural nouns for resource collections     | ✅     | `/students`, `/courses` — never `/student`         |
| No verbs in URLs                          | ✅     | No `/getStudent`, `/deleteStudent`, `/assignCourse`|
| Kebab-case for multi-word paths           | ✅     | N/A — all resource names are single words in v1   |
| Nested resource for enrollment            | ✅     | `/students/{id}/courses` — not `/enrollments`      |
| Versioning prefix on all routes           | ✅     | `/api/v1/` on every endpoint                       |
| Path parameters use snake_case            | ✅     | `student_id`, `course_id`                          |
| Query parameters use snake_case           | ✅     | `page`, `page_size`, `include_inactive`            |
| JSON fields use snake_case                | ✅     | `first_name`, `course_code`, `enrolled_at`         |

---

## 2. HTTP Method Mapping

| Action                        | Method   | Endpoint                                        | Status Code |
|-------------------------------|----------|-------------------------------------------------|-------------|
| Login                         | `POST`   | `/api/v1/auth/login`                            | 200         |
| Create student                | `POST`   | `/api/v1/students`                              | 201         |
| List students                 | `GET`    | `/api/v1/students`                              | 200         |
| Get single student            | `GET`    | `/api/v1/students/{student_id}`                 | 200         |
| Update student                | `PUT`    | `/api/v1/students/{student_id}`                 | 200         |
| Soft delete student           | `DELETE` | `/api/v1/students/{student_id}`                 | 200         |
| Create course                 | `POST`   | `/api/v1/courses`                               | 201         |
| List courses                  | `GET`    | `/api/v1/courses`                               | 200         |
| Get single course             | `GET`    | `/api/v1/courses/{course_id}`                   | 200         |
| Assign course to student      | `POST`   | `/api/v1/students/{student_id}/courses`         | 201         |
| List student enrollments      | `GET`    | `/api/v1/students/{student_id}/courses`         | 200         |
| Remove student enrollment     | `DELETE` | `/api/v1/students/{student_id}/courses/{course_id}` | 200     |

### Method Usage Rationale
- `POST` — used for all resource creation and login (login is not idempotent; a new token is issued each time)
- `PUT` — used for student update; supports partial updates (not strictly PATCH semantics, documented as such in contracts)
- `DELETE` — used for both soft delete and unenrollment; returns `200` with body rather than `204` to confirm the resulting state to the client
- `GET` — all read operations; no side effects

---

## 3. Backlog ↔ Endpoint Traceability

Every user story must map to at least one endpoint. Every endpoint must trace back to at least one user story.

| Story | Title                       | Endpoint(s)                                              | Covered |
|-------|-----------------------------|----------------------------------------------------------|---------|
| US-01 | Staff/Admin Login           | `POST /api/v1/auth/login`                                | ✅      |
| US-02 | Protected Route Enforcement | Middleware — applies to all endpoints                    | ✅      |
| US-03 | Create Student              | `POST /api/v1/students`                                  | ✅      |
| US-04 | List Students               | `GET /api/v1/students`                                   | ✅      |
| US-05 | Get Single Student          | `GET /api/v1/students/{student_id}`                      | ✅      |
| US-06 | Update Student              | `PUT /api/v1/students/{student_id}`                      | ✅      |
| US-07 | Soft Delete Student         | `DELETE /api/v1/students/{student_id}`                   | ✅      |
| US-08 | Create Course               | `POST /api/v1/courses`                                   | ✅      |
| US-09 | List & Get Courses          | `GET /api/v1/courses`, `GET /api/v1/courses/{course_id}` | ✅      |
| US-10 | Assign Course to Student    | `POST /api/v1/students/{student_id}/courses`             | ✅      |
| US-11 | List Student Enrollments    | `GET /api/v1/students/{student_id}/courses`              | ✅      |
| US-12 | Remove Student Enrollment   | `DELETE /api/v1/students/{student_id}/courses/{course_id}` | ✅    |

**Result: All 12 stories covered. No orphaned endpoints.**

---

## 4. Acceptance Criteria ↔ Error Contract Traceability

Every AC error path must have a corresponding error contract in API-CONTRACTS.md.

| AC Reference | Error Scenario                              | Error Code              | Contract Defined |
|--------------|---------------------------------------------|-------------------------|------------------|
| AC-01-3      | Login — email not found                     | `INVALID_CREDENTIALS`   | ✅               |
| AC-01-4      | Login — wrong password                      | `INVALID_CREDENTIALS`   | ✅               |
| AC-02-1      | Missing token                               | `MISSING_TOKEN`         | ✅               |
| AC-02-2      | Expired token                               | `EXPIRED_TOKEN`         | ✅               |
| AC-02-3      | Malformed token                             | `INVALID_TOKEN`         | ✅               |
| AC-02-4      | Role lacks permission                       | `FORBIDDEN`             | ✅               |
| AC-03-3      | Duplicate email on create                   | `EMAIL_ALREADY_EXISTS`  | ✅               |
| AC-05-2      | Student not found                           | `STUDENT_NOT_FOUND`     | ✅               |
| AC-05-3      | Inactive student without include_inactive   | `STUDENT_NOT_FOUND`     | ✅               |
| AC-06-4      | Email conflict on update                    | `EMAIL_ALREADY_EXISTS`  | ✅               |
| AC-07-5      | Deactivating already inactive student       | `STUDENT_NOT_FOUND`     | ✅               |
| AC-08-3      | Duplicate course code                       | `COURSE_CODE_ALREADY_EXISTS` | ✅          |
| AC-09-4      | Course not found                            | `COURSE_NOT_FOUND`      | ✅               |
| AC-10-3      | Enroll — student not found or inactive      | `STUDENT_NOT_FOUND`     | ✅               |
| AC-10-4      | Enroll — course not found                   | `COURSE_NOT_FOUND`      | ✅               |
| AC-10-5      | Duplicate enrollment                        | `ALREADY_ENROLLED`      | ✅               |
| AC-12-3      | Unenroll — student not found                | `STUDENT_NOT_FOUND`     | ✅               |
| AC-12-4      | Unenroll — course not found                 | `COURSE_NOT_FOUND`      | ✅               |
| AC-12-5      | Unenroll — enrollment not found             | `ENROLLMENT_NOT_FOUND`  | ✅               |

**Result: All AC error paths have a defined error contract. No gaps.**

---

## 5. PRD Functional Requirements ↔ Endpoint Coverage

| FR     | Requirement Summary                              | Endpoint                                              | Covered |
|--------|--------------------------------------------------|-------------------------------------------------------|---------|
| FR-01  | Auth via email + password → JWT                  | `POST /api/v1/auth/login`                             | ✅      |
| FR-02  | Reject invalid credentials → 401                 | `POST /api/v1/auth/login`                             | ✅      |
| FR-03  | Role-based access on every endpoint              | Middleware + `require_role` dependency                | ✅      |
| FR-04  | Reject missing/expired/malformed token → 401     | Middleware                                            | ✅      |
| FR-05  | Reject wrong role → 403                          | `require_role` dependency                             | ✅      |
| FR-06  | Create student with required fields              | `POST /api/v1/students`                               | ✅      |
| FR-07  | Prevent duplicate email → 409                    | `POST /api/v1/students`                               | ✅      |
| FR-08  | Paginated student list                           | `GET /api/v1/students`                                | ✅      |
| FR-09  | Single student with enrolled courses             | `GET /api/v1/students/{student_id}`                   | ✅      |
| FR-10  | 404 on missing or inactive student               | `GET`, `PUT`, `DELETE /api/v1/students/{student_id}`  | ✅      |
| FR-11  | Update student fields                            | `PUT /api/v1/students/{student_id}`                   | ✅      |
| FR-12  | Prevent email conflict on update → 409           | `PUT /api/v1/students/{student_id}`                   | ✅      |
| FR-13  | Soft delete → is_active = false                  | `DELETE /api/v1/students/{student_id}`                | ✅      |
| FR-14  | include_inactive query param on list + get       | `GET /api/v1/students`, `GET /api/v1/students/{id}`   | ✅      |
| FR-15  | Create course with required fields               | `POST /api/v1/courses`                                | ✅      |
| FR-16  | Prevent duplicate course_code → 409              | `POST /api/v1/courses`                                | ✅      |
| FR-17  | Paginated course list                            | `GET /api/v1/courses`                                 | ✅      |
| FR-18  | Single course by ID                              | `GET /api/v1/courses/{course_id}`                     | ✅      |
| FR-19  | 404 on missing course                            | `GET /api/v1/courses/{course_id}`                     | ✅      |
| FR-20  | Assign student to course                         | `POST /api/v1/students/{student_id}/courses`          | ✅      |
| FR-21  | 404 if student inactive or missing on enroll     | `POST /api/v1/students/{student_id}/courses`          | ✅      |
| FR-22  | 404 if course missing on enroll                  | `POST /api/v1/students/{student_id}/courses`          | ✅      |
| FR-23  | Prevent duplicate enrollment → 409               | `POST /api/v1/students/{student_id}/courses`          | ✅      |
| FR-24  | List student enrollments                         | `GET /api/v1/students/{student_id}/courses`           | ✅      |
| FR-25  | Remove enrollment                                | `DELETE /api/v1/students/{student_id}/courses/{id}`   | ✅      |
| FR-26  | 404 if enrollment not found on remove            | `DELETE /api/v1/students/{student_id}/courses/{id}`   | ✅      |

**Result: All 26 functional requirements covered. No gaps.**

---

## 6. Response Envelope Consistency Audit

| Endpoint                                          | Uses Standard Envelope | Returns `meta` | data shape    |
|---------------------------------------------------|------------------------|----------------|---------------|
| `POST /api/v1/auth/login`                         | ✅                     | null           | object        |
| `POST /api/v1/students`                           | ✅                     | null           | object        |
| `GET /api/v1/students`                            | ✅                     | paginated      | array         |
| `GET /api/v1/students/{student_id}`               | ✅                     | null           | object        |
| `PUT /api/v1/students/{student_id}`               | ✅                     | null           | object        |
| `DELETE /api/v1/students/{student_id}`            | ✅                     | null           | object        |
| `POST /api/v1/courses`                            | ✅                     | null           | object        |
| `GET /api/v1/courses`                             | ✅                     | paginated      | array         |
| `GET /api/v1/courses/{course_id}`                 | ✅                     | null           | object        |
| `POST /api/v1/students/{student_id}/courses`      | ✅                     | null           | object        |
| `GET /api/v1/students/{student_id}/courses`       | ✅                     | null           | array         |
| `DELETE /api/v1/students/{student_id}/courses/{course_id}` | ✅            | null           | null          |

**Result: All 12 endpoints use the standard envelope. Consistent throughout.**
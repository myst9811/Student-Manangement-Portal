# Student Management System — Product Requirements Document (PRD)

---

## 1. Functional Requirements

### Authentication & Authorization

**FR-01:** The system shall allow Admin and Staff users to authenticate using an email and password combination, returning a signed JWT token on success.

**FR-02:** The system shall reject authentication requests with invalid credentials and return a 401 response with a defined error code.

**FR-03:** The system shall enforce role-based access control on every protected endpoint using the JWT token's role claim (`admin` or `staff`).

**FR-04:** The system shall reject requests to protected endpoints that carry no token, an expired token, or a malformed token with a 401 response.

**FR-05:** The system shall reject requests where the authenticated role does not have permission for the requested action with a 403 response.

---

### Student Management

**FR-06:** The system shall allow Admin users to create a student record with the following required fields: `first_name`, `last_name`, `email`, `enrollment_date`.

**FR-07:** The system shall prevent creation of a student record if the provided email address already exists in the system, returning a 409 response.

**FR-08:** The system shall allow Admin and Staff users to retrieve a paginated list of all active student records.

**FR-09:** The system shall allow Admin and Staff users to retrieve a single student record by ID, including the student's currently enrolled courses.

**FR-10:** The system shall return a 404 response when a requested student ID does not exist or belongs to a soft-deleted record.

**FR-11:** The system shall allow Admin users to update the `first_name`, `last_name`, `email`, and `enrollment_date` fields of an existing student record.

**FR-12:** The system shall prevent an update that changes a student's email to one already used by another student record, returning a 409 response.

**FR-13:** The system shall allow Admin users to soft-delete a student record by setting `is_active = false`. The record must remain in the database.

**FR-14:** The system shall exclude soft-deleted students from all list and lookup responses unless an explicit `include_inactive=true` query parameter is provided.

---

### Course Management

**FR-15:** The system shall allow Admin users to create a course record with the following required fields: `course_name`, `course_code`, `description`.

**FR-16:** The system shall prevent creation of a course with a `course_code` that already exists, returning a 409 response.

**FR-17:** The system shall allow Admin and Staff users to retrieve a paginated list of all courses.

**FR-18:** The system shall allow Admin and Staff users to retrieve a single course record by ID.

**FR-19:** The system shall return a 404 response when a requested course ID does not exist.

---

### Enrollment Management

**FR-20:** The system shall allow Admin and Staff users to assign an existing student to an existing course, creating an enrollment record.

**FR-21:** The system shall return a 404 response when attempting to enroll a student using a `student_id` that does not exist or is inactive.

**FR-22:** The system shall return a 404 response when attempting to enroll a student in a course using a `course_id` that does not exist.

**FR-23:** The system shall prevent duplicate enrollments — if a student is already enrolled in a course, a second assignment attempt shall return a 409 response.

**FR-24:** The system shall allow Admin and Staff users to retrieve all courses currently assigned to a specific student.

**FR-25:** The system shall allow Admin and Staff users to remove a student's enrollment from a specific course without affecting the student record or the course record.

**FR-26:** The system shall return a 404 response when attempting to remove an enrollment that does not exist.

---

## 2. Non-Functional Requirements

**NFR-01:** API response time for all list endpoints must be under 300ms for datasets up to 1,000 records under normal load.

**NFR-02:** API response time for single-record GET endpoints must be under 100ms under normal load.

**NFR-03:** All user passwords must be hashed using bcrypt before storage. Plaintext passwords must never be persisted or logged.

**NFR-04:** JWT tokens must have a configurable expiry (default: 60 minutes). Expired tokens must be rejected on every request.

**NFR-05:** All API endpoints must return a consistent response envelope for both success and error states. No raw exceptions shall be exposed to the API consumer.

**NFR-06:** All error responses must include a machine-readable error code (e.g., `STUDENT_NOT_FOUND`) in addition to a human-readable message.

**NFR-07:** All database interactions must use async-compatible drivers. Synchronous DB calls inside async route handlers are not permitted.

**NFR-08:** The system must handle concurrent enrollment requests for the same student-course pair without creating duplicate records (database-level unique constraint required).

---

## 3. Constraints

- **Backend:** FastAPI (Python); async request handling required
- **Frontend:** React; communicates with backend exclusively via REST API
- **Database:** PostgreSQL; all schema changes managed via migrations
- **API Style:** REST, versioned under `/api/v1/`
- **Auth:** JWT-based; tokens issued by the backend, validated per request
- **Hard deletes:** Not exposed via any API endpoint in v1
- **Deployment:** Single-instance, single-school; no multi-tenant architecture

---

## 4. Out of Scope (v1)

- Student-facing login or self-service portal
- Student self-enrollment or course dropping
- Payment or fee processing
- Attendance or grade tracking
- Automated notifications or email triggers
- Reporting or analytics dashboards
- Mobile or offline support
- Multi-school / multi-tenant support

---

## 5. Success Metrics

- All P0 backlog stories pass their defined acceptance criteria
- Zero unhandled exceptions reaching the API response layer
- All list endpoints respond within the 300ms threshold under test load
- Role enforcement verified: Staff cannot execute Admin-only actions
- Duplicate email and duplicate enrollment constraints enforced at both API and database levels
- All soft-deleted records retained in DB and excluded from standard queries
- JWT expiry and rejection behavior verified via automated tests
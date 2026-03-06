# Student Management System — Backlog

---

## Epic 1: Authentication & Authorization
> Covers FR-01 through FR-05. Foundational to all other epics — must be completed first.

---

### US-01: Staff/Admin Login
**As an** Admin or Staff user
**I want to** log in with my email and password
**So that** I can receive a JWT token and access the system

**Acceptance Criteria:**
- AC-01-1: Returns 200 with a signed JWT token when valid credentials are provided
- AC-01-2: JWT payload contains the user's `id`, `email`, and `role` claim (`admin` or `staff`)
- AC-01-3: Returns 401 with error code `INVALID_CREDENTIALS` when email does not exist
- AC-01-4: Returns 401 with error code `INVALID_CREDENTIALS` when password is incorrect
- AC-01-5: Returns 422 with error code `VALIDATION_ERROR` when request body is missing email or password
- AC-01-6: Password is never returned in any response

**Priority:** P0
**Depends on:** None

---

### US-02: Protected Route Enforcement
**As a** system
**I want to** validate the JWT token on every protected request
**So that** unauthenticated or unauthorised users cannot access any data

**Acceptance Criteria:**
- AC-02-1: Returns 401 with error code `MISSING_TOKEN` when no Authorization header is present
- AC-02-2: Returns 401 with error code `EXPIRED_TOKEN` when the JWT token has expired
- AC-02-3: Returns 401 with error code `INVALID_TOKEN` when the JWT token is malformed
- AC-02-4: Returns 403 with error code `FORBIDDEN` when the authenticated role does not have permission for the requested action
- AC-02-5: Allows request to proceed when a valid, non-expired token with the correct role is provided

**Priority:** P0
**Depends on:** US-01

---

## Epic 2: Student Management
> Covers FR-06 through FR-14. Depends on Epic 1 for auth enforcement.

---

### US-03: Create Student
**As an** Admin user
**I want to** create a new student record
**So that** the student can be tracked and assigned to courses

**Acceptance Criteria:**
- AC-03-1: Returns 201 with the created student object when all required fields are valid
- AC-03-2: Created record contains: `id`, `first_name`, `last_name`, `email`, `enrollment_date`, `is_active: true`, `created_at`
- AC-03-3: Returns 409 with error code `EMAIL_ALREADY_EXISTS` when the provided email is already registered
- AC-03-4: Returns 422 with error code `VALIDATION_ERROR` when any required field is missing
- AC-03-5: Returns 422 with error code `VALIDATION_ERROR` when email format is invalid
- AC-03-6: Returns 403 with error code `FORBIDDEN` when a Staff user attempts this action

**Priority:** P0
**Depends on:** US-01, US-02

---

### US-04: List Students
**As an** Admin or Staff user
**I want to** retrieve a paginated list of students
**So that** I can browse and locate student records efficiently

**Acceptance Criteria:**
- AC-04-1: Returns 200 with a paginated list of active students by default
- AC-04-2: Response includes pagination metadata: `page`, `page_size`, `total`
- AC-04-3: Accepts `page` and `page_size` as query parameters; defaults to `page=1`, `page_size=20`
- AC-04-4: Returns only active students (`is_active=true`) when `include_inactive` is not provided
- AC-04-5: Returns all students including inactive when `include_inactive=true` query param is provided
- AC-04-6: Returns an empty list (not 404) when no students match the query
- AC-04-7: Returns 401/403 for unauthenticated or unauthorised requests

**Priority:** P0
**Depends on:** US-01, US-02

---

### US-05: Get Single Student
**As an** Admin or Staff user
**I want to** retrieve a single student's full profile including their enrolled courses
**So that** I can view complete information for a specific student

**Acceptance Criteria:**
- AC-05-1: Returns 200 with the student object and a nested list of enrolled courses
- AC-05-2: Returns 404 with error code `STUDENT_NOT_FOUND` when the student ID does not exist
- AC-05-3: Returns 404 with error code `STUDENT_NOT_FOUND` when the student is soft-deleted and `include_inactive` is not set
- AC-05-4: Returns the inactive student record when `include_inactive=true` is passed and student is soft-deleted
- AC-05-5: Returns an empty courses array (not 404) when student exists but has no enrollments
- AC-05-6: Returns 401/403 for unauthenticated or unauthorised requests

**Priority:** P0
**Depends on:** US-03

---

### US-06: Update Student
**As an** Admin user
**I want to** update a student's details
**So that** I can correct or maintain accurate student information

**Acceptance Criteria:**
- AC-06-1: Returns 200 with the updated student object when valid fields are provided
- AC-06-2: Allows partial updates — only provided fields are changed
- AC-06-3: Returns 404 with error code `STUDENT_NOT_FOUND` when the student ID does not exist
- AC-06-4: Returns 409 with error code `EMAIL_ALREADY_EXISTS` when the new email is already used by another student
- AC-06-5: Returns 422 with error code `VALIDATION_ERROR` when an invalid field format is provided (e.g., bad email)
- AC-06-6: Returns 403 with error code `FORBIDDEN` when a Staff user attempts this action

**Priority:** P0
**Depends on:** US-03

---

### US-07: Soft Delete Student
**As an** Admin user
**I want to** deactivate a student record
**So that** the student is removed from active use while their history is preserved

**Acceptance Criteria:**
- AC-07-1: Returns 200 with the updated student object showing `is_active: false`
- AC-07-2: The student record remains in the database after deactivation
- AC-07-3: The deactivated student no longer appears in standard list or lookup responses
- AC-07-4: Returns 404 with error code `STUDENT_NOT_FOUND` when the student ID does not exist
- AC-07-5: Returns 404 with error code `STUDENT_NOT_FOUND` when the student is already inactive
- AC-07-6: Returns 403 with error code `FORBIDDEN` when a Staff user attempts this action

**Priority:** P0
**Depends on:** US-03

---

## Epic 3: Course & Enrollment Management
> Covers FR-15 through FR-26. Course stories depend on Epic 1; Enrollment stories depend on both Epic 2 and Course stories.

---

### US-08: Create Course
**As an** Admin user
**I want to** create a new course record
**So that** students can be assigned to it

**Acceptance Criteria:**
- AC-08-1: Returns 201 with the created course object when all required fields are valid
- AC-08-2: Created record contains: `id`, `course_name`, `course_code`, `description`, `created_at`
- AC-08-3: Returns 409 with error code `COURSE_CODE_ALREADY_EXISTS` when the `course_code` is already registered
- AC-08-4: Returns 422 with error code `VALIDATION_ERROR` when any required field is missing
- AC-08-5: Returns 403 with error code `FORBIDDEN` when a Staff user attempts this action

**Priority:** P0
**Depends on:** US-01, US-02

---

### US-09: List & Get Courses
**As an** Admin or Staff user
**I want to** browse the course catalog and view individual course details
**So that** I can identify courses to assign to students

**Acceptance Criteria:**
- AC-09-1: Returns 200 with a paginated list of all courses on list request
- AC-09-2: Response includes pagination metadata: `page`, `page_size`, `total`
- AC-09-3: Returns 200 with the course object on single-record request
- AC-09-4: Returns 404 with error code `COURSE_NOT_FOUND` when the course ID does not exist
- AC-09-5: Returns an empty list (not 404) when no courses exist
- AC-09-6: Returns 401/403 for unauthenticated or unauthorised requests

**Priority:** P0
**Depends on:** US-08

---

### US-10: Assign Course to Student
**As an** Admin or Staff user
**I want to** assign a course to an existing active student
**So that** their enrollment is recorded in the system

**Acceptance Criteria:**
- AC-10-1: Returns 201 with the enrollment record when assignment is successful
- AC-10-2: Enrollment record contains: `id`, `student_id`, `course_id`, `enrolled_at`
- AC-10-3: Returns 404 with error code `STUDENT_NOT_FOUND` when the `student_id` does not exist or is inactive
- AC-10-4: Returns 404 with error code `COURSE_NOT_FOUND` when the `course_id` does not exist
- AC-10-5: Returns 409 with error code `ALREADY_ENROLLED` when the student is already enrolled in that course
- AC-10-6: Returns 422 with error code `VALIDATION_ERROR` when the request body is malformed
- AC-10-7: Returns 401/403 for unauthenticated or unauthorised requests

**Priority:** P0
**Depends on:** US-03, US-08

---

### US-11: List Student Enrollments
**As an** Admin or Staff user
**I want to** view all courses a specific student is enrolled in
**So that** I can review their current course load

**Acceptance Criteria:**
- AC-11-1: Returns 200 with a list of courses the student is enrolled in
- AC-11-2: Returns 404 with error code `STUDENT_NOT_FOUND` when the `student_id` does not exist
- AC-11-3: Returns an empty list (not 404) when the student exists but has no enrollments
- AC-11-4: Returns 401/403 for unauthenticated or unauthorised requests

**Priority:** P0
**Depends on:** US-10

---

### US-12: Remove Student Enrollment
**As an** Admin or Staff user
**I want to** remove a student's enrollment from a specific course
**So that** their course record stays accurate without affecting other data

**Acceptance Criteria:**
- AC-12-1: Returns 200 with a confirmation message when the enrollment is successfully removed
- AC-12-2: The student record and the course record remain unaffected after unenrollment
- AC-12-3: Returns 404 with error code `STUDENT_NOT_FOUND` when the `student_id` does not exist
- AC-12-4: Returns 404 with error code `COURSE_NOT_FOUND` when the `course_id` does not exist
- AC-12-5: Returns 404 with error code `ENROLLMENT_NOT_FOUND` when the student is not enrolled in that course
- AC-12-6: Returns 401/403 for unauthenticated or unauthorised requests

**Priority:** P0
**Depends on:** US-10

---

## Priority Summary

| Story | Title                        | Priority | Depends On         |
|-------|------------------------------|----------|--------------------|
| US-01 | Staff/Admin Login            | P0       | —                  |
| US-02 | Protected Route Enforcement  | P0       | US-01              |
| US-03 | Create Student               | P0       | US-01, US-02       |
| US-04 | List Students                | P0       | US-01, US-02       |
| US-05 | Get Single Student           | P0       | US-03              |
| US-06 | Update Student               | P0       | US-03              |
| US-07 | Soft Delete Student          | P0       | US-03              |
| US-08 | Create Course                | P0       | US-01, US-02       |
| US-09 | List & Get Courses           | P0       | US-08              |
| US-10 | Assign Course to Student     | P0       | US-03, US-08       |
| US-11 | List Student Enrollments     | P0       | US-10              |
| US-12 | Remove Student Enrollment    | P0       | US-10              |
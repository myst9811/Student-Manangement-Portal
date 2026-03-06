# Student Management System — Overview

---

## Problem Statement

Academic institutions managing student records through spreadsheets or disconnected tools face data inconsistency, duplicate records, and no reliable way to track course enrollments. This system provides a single, authoritative internal tool for staff to create, maintain, and query student records and their course assignments — replacing ad-hoc processes with a governed, auditable workflow.

---

## Target Users

- **Admin Staff** — Need full control over student records: creating new entries, updating details, deactivating students, and assigning them to courses.
- **Academic Staff** — Need read access to student records and the ability to assign or remove students from courses they oversee. They do not modify core student data.

---

## Key Capabilities

- Create and maintain student records with essential personal and enrollment information
- Deactivate students without permanently removing their historical record (soft delete)
- Create and manage a catalog of available courses
- Assign students to one or more courses and track those enrollments
- Remove a student from a course without affecting their student record
- Retrieve a student's full profile alongside their currently enrolled courses
- Enforce data integrity rules (e.g., no duplicate email addresses, no enrollment in non-existent courses)

---

## Scope Boundaries

**In scope:**
- Student record management (create, read, update, deactivate) — Admin only
- Course catalog management (create, read) — Admin only
- Student-to-course enrollment management (assign, list, remove) — Admin and Staff
- Student self-service portal: view own profile and enrollments — read-only
- Three roles: Admin, Staff, Student
- REST API consumed by a React frontend (internal staff view + student portal view)

**Out of scope:**
- Payment or fee processing
- Attendance tracking
- Notifications or email communication
- Mobile application
- Multi-school / multi-tenant support
- Student ability to self-enroll or modify any record

---

## Assumptions

- **Single institution:** The system serves one school. No tenant isolation is required in v1.
- **No student authentication:** Students do not log in. Only internal staff interact with the system.
- **Static course catalog:** Courses are pre-defined by admins. Dynamic course creation by staff is not supported in v1.
- **Soft delete as standard:** Deactivating a student preserves all historical enrollment data. Hard deletes are not exposed via the API.
- **Enrollment state is binary:** A student is either enrolled in a course or not. No waitlist, audit, or pending states in v1.

---

## Non-Goals (v1)

- No payment or invoicing functionality
- No attendance or grade tracking
- No automated notifications or email triggers
- No student-facing portal or login (v1)
- No reporting or analytics dashboards
- No mobile or offline support

---

## Success Criteria

- Admin users can perform all CRUD operations on student records without data loss or duplication
- Staff users can assign and view enrollments within their role permissions
- A student's profile and enrolled courses are retrievable in a single workflow
- Soft-deleted students are retained in the database and excluded from active queries
- All API responses conform to a consistent, documented contract
- Core workflows are covered by automated tests with no critical paths untested

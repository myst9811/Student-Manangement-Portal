# Student Management System — Data Model

---

## 1. Entity List

| Entity       | Table Name    | Purpose                                                  |
|--------------|---------------|----------------------------------------------------------|
| User         | `users`       | Admin and Staff accounts used for authentication         |
| Student      | `students`    | Core student records managed by staff                    |
| Course       | `courses`     | Course catalog entries created by admins                 |
| Enrollment   | `enrollments` | Junction table tracking student-to-course assignments    |

---

## 2. Entity Schemas

### `users`
| Column       | Type           | Constraints                        | Notes                              |
|--------------|----------------|------------------------------------|------------------------------------|
| id           | SERIAL         | PRIMARY KEY                        |                                    |
| email        | VARCHAR(255)   | NOT NULL, UNIQUE                   | Login identifier; indexed          |
| password     | VARCHAR(255)   | NOT NULL                           | bcrypt hash; never plaintext       |
| role         | VARCHAR(20)    | NOT NULL, CHECK IN ('admin','staff')| Drives all access control          |
| is_active    | BOOLEAN        | NOT NULL, DEFAULT TRUE             | Soft disable without deletion      |
| created_at   | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW()            | Audit column                       |
| updated_at   | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW()            | Updated on every write             |

---

### `students`
| Column          | Type           | Constraints             | Notes                              |
|-----------------|----------------|-------------------------|------------------------------------|
| id              | SERIAL         | PRIMARY KEY             |                                    |
| first_name      | VARCHAR(100)   | NOT NULL                |                                    |
| last_name       | VARCHAR(100)   | NOT NULL                |                                    |
| email           | VARCHAR(255)   | NOT NULL, UNIQUE        | Indexed; duplicate check on create |
| enrollment_date | DATE           | NOT NULL                |                                    |
| is_active       | BOOLEAN        | NOT NULL, DEFAULT TRUE  | Soft delete flag                   |
| created_at      | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW() | Audit column                       |
| updated_at      | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW() | Updated on every write             |

---

### `courses`
| Column       | Type           | Constraints             | Notes                                       |
|--------------|----------------|-------------------------|---------------------------------------------|
| id           | SERIAL         | PRIMARY KEY             |                                             |
| course_name  | VARCHAR(200)   | NOT NULL                |                                             |
| course_code  | VARCHAR(20)    | NOT NULL, UNIQUE        | Indexed; short identifier e.g. "CS-101"     |
| description  | TEXT           | NULLABLE                | Optional long-form description              |
| created_at   | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW() | Audit column                                |
| updated_at   | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW() | Updated on every write                      |

---

### `enrollments`
| Column      | Type           | Constraints                              | Notes                                          |
|-------------|----------------|------------------------------------------|------------------------------------------------|
| id          | SERIAL         | PRIMARY KEY                              |                                                |
| student_id  | INTEGER        | NOT NULL, FK → students(id) ON DELETE RESTRICT | Student must exist; block student hard delete  |
| course_id   | INTEGER        | NULLABLE, FK → courses(id) ON DELETE SET NULL  | Nullable; SET NULL preserves history if course deleted |
| enrolled_at | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW()                  | Enrollment timestamp                           |
| created_at  | TIMESTAMP(UTC) | NOT NULL, DEFAULT NOW()                  | Audit column                                   |

---

## 3. Relationships

```
users         (no FK relationships — standalone auth entity)

students ──────────────────────────────┐
  id (PK)                              │
                                       │ 1 student → many enrollments
enrollments                            │
  id (PK)                              │
  student_id (FK → students.id) ───────┘
  course_id  (FK → courses.id)  ───────┐
                                       │ 1 course → many enrollments
courses                                │
  id (PK)  ──────────────────────────┘
```

**Cardinality:**
- `students` → `enrollments`: One-to-Many (one student, many enrollments)
- `courses` → `enrollments`: One-to-Many (one course, many enrollments)
- `students` ↔ `courses`: Many-to-Many via `enrollments` junction table

---

## 4. Indexing Decisions

| Index Name                      | Table         | Column(s)               | Reason                                                   |
|---------------------------------|---------------|-------------------------|----------------------------------------------------------|
| `idx_users_email`               | `users`       | `email`                 | Login lookup on every auth request                       |
| `idx_students_email`            | `students`    | `email`                 | Duplicate check on create and update                     |
| `idx_students_is_active`        | `students`    | `is_active`             | Every list query filters by active status                |
| `idx_courses_course_code`       | `courses`     | `course_code`           | Duplicate check on course creation                       |
| `idx_enrollments_student_id`    | `enrollments` | `student_id`            | Frequent query: all courses for a given student          |
| `idx_enrollments_course_id`     | `enrollments` | `course_id`             | Frequent query: all students in a given course           |
| `uq_enrollments_student_course` | `enrollments` | `(student_id, course_id)` | Unique constraint — prevents duplicate enrollments at DB level |

---

## 5. Constraint Decisions

### Unique Constraints
- `students.email` — Enforced at DB level. API-level duplicate check runs first for a clean error message, but the DB constraint is the safety net for race conditions.
- `courses.course_code` — Same pattern as email: API checks first, DB enforces last.
- `enrollments(student_id, course_id)` — Composite unique constraint. Prevents duplicate enrollment even under concurrent requests.

### NOT NULL Constraints
- All identity and operational fields are NOT NULL by default.
- `courses.description` is intentionally NULLABLE — a course can exist before a description is written.
- `enrollments.course_id` is intentionally NULLABLE — SET NULL on course deletion preserves the enrollment history row.

### Foreign Key Behaviour
| FK                          | On Delete    | Rationale                                                             |
|-----------------------------|--------------|-----------------------------------------------------------------------|
| `enrollments.student_id`    | RESTRICT     | A student with active enrollments cannot be hard-deleted (moot in v1 since hard delete is not exposed, but enforced as a DB-level safety net) |
| `enrollments.course_id`     | SET NULL     | Deleting a course preserves enrollment history; `course_id` becomes NULL rather than losing the row |

---

## 6. Soft Delete Strategy

Soft delete is applied to `students` and `users` only. Courses do not have a soft delete flag in v1.

**Mechanism:** `is_active = false` on the record. The row is never removed from the database.

**Query behaviour:**
- All standard list and lookup queries include `WHERE is_active = true` by default
- Passing `include_inactive=true` removes this filter — available to both Admin and Staff (per FR-14)
- Soft-deleted students remain the target of existing enrollment rows (via RESTRICT FK)
- Soft-deleted students cannot receive new enrollments (service layer checks `is_active` before creating enrollment)

**Why not a `deleted_at` timestamp?**
A `deleted_at` nullable timestamp is a common alternative. `is_active` boolean was chosen here for query simplicity (`WHERE is_active = true` vs `WHERE deleted_at IS NULL`). If audit trail of deletion time becomes a requirement in v2, `deleted_at` can be added alongside `is_active` without a breaking change.

---

## 7. Audit Columns

All tables carry the following audit columns:

| Column       | Type           | Default    | Notes                                      |
|--------------|----------------|------------|--------------------------------------------|
| `created_at` | TIMESTAMP(UTC) | `NOW()`    | Set once on insert; never updated          |
| `updated_at` | TIMESTAMP(UTC) | `NOW()`    | Updated on every write via SQLAlchemy event or DB trigger |

`enrollments` carries `created_at` only — there is nothing to update on an enrollment row; it is created and deleted (or nullified) but never mutated.

All timestamps are stored in UTC. Timezone conversion is the responsibility of the frontend.
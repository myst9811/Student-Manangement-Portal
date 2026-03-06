# Student Management System — API Contracts

> Authoritative contract for all v1 endpoints.
> Claude Code must not implement any endpoint not defined here.
> All responses use the standard envelope defined in CLAUDE.md §5.

---

## Global Rules

- Base path: `/api/v1`
- All request bodies: `Content-Type: application/json`
- All timestamps returned as ISO 8601 UTC strings: `"2024-09-01T10:00:00Z"`
- All dates returned as ISO 8601 date strings: `"2024-09-01"`
- Auth header on all protected routes: `Authorization: Bearer <token>`
- Public routes (no token required): `POST /api/v1/auth/login` only

---

## Standard Envelope

```json
// Success
{ "success": true, "data": <object|array|null>, "message": "<string>", "meta": null }

// Success — paginated list
{ "success": true, "data": [<objects>], "message": "<string>", "meta": { "page": 1, "page_size": 20, "total": 45 } }

// Error
{ "success": false, "data": null, "message": "<string>", "error": { "code": "<ERROR_CODE>", "detail": "<string>", "field": null } }
```

---

## Auth Middleware Errors (applies to every protected endpoint)

| Scenario | Status | `error.code` |
|---|---|---|
| No `Authorization` header | 401 | `MISSING_TOKEN` |
| Token has expired | 401 | `EXPIRED_TOKEN` |
| Token is malformed / invalid signature | 401 | `INVALID_TOKEN` |
| Role does not have permission | 403 | `FORBIDDEN` |

---

## 1. POST /api/v1/auth/login

**Auth:** None (public)

### Request body
```json
{
  "email": "admin@school.com",
  "password": "secret123"
}
```

| Field | Type | Rules |
|---|---|---|
| `email` | string | required, valid email format |
| `password` | string | required, min 8 chars |

### 200 — Success
```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "token_type": "bearer"
  },
  "message": "Login successful",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` | `error.field` |
|---|---|---|---|
| Email not found or password wrong | 401 | `INVALID_CREDENTIALS` | null |
| Missing / invalid body fields | 422 | `VALIDATION_ERROR` | field name |

---

## 2. POST /api/v1/students

**Auth:** Bearer token — `admin` only

### Request body
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "enrollment_date": "2024-09-01"
}
```

| Field | Type | Rules |
|---|---|---|
| `first_name` | string | required, min 1, max 100 |
| `last_name` | string | required, min 1, max 100 |
| `email` | string | required, valid email format |
| `enrollment_date` | date | required, must not be a future date |

### 201 — Success
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "enrollment_date": "2024-09-01",
    "is_active": true,
    "created_at": "2024-09-01T10:00:00Z"
  },
  "message": "Student created successfully",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` | `error.field` |
|---|---|---|---|
| Email already registered | 409 | `EMAIL_ALREADY_EXISTS` | `email` |
| Missing or invalid fields | 422 | `VALIDATION_ERROR` | field name |
| Staff role | 403 | `FORBIDDEN` | null |

---

## 3. GET /api/v1/students

**Auth:** Bearer token — `admin` or `staff`

### Query parameters
| Param | Type | Default | Rules |
|---|---|---|---|
| `page` | integer | 1 | ge=1 |
| `page_size` | integer | 20 | ge=1, le=100 |
| `include_inactive` | boolean | false | optional |

### 200 — Success
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane.doe@example.com",
      "enrollment_date": "2024-09-01",
      "is_active": true,
      "created_at": "2024-09-01T10:00:00Z"
    }
  ],
  "message": "Students retrieved successfully",
  "meta": { "page": 1, "page_size": 20, "total": 1 }
}
```

> Returns empty `data: []` (not 404) when no students match.
> Returns only `is_active=true` records unless `include_inactive=true`.

---

## 4. GET /api/v1/students/{student_id}

**Auth:** Bearer token — `admin` or `staff`

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `student_id` | integer | required |

### Query parameters
| Param | Type | Default |
|---|---|---|
| `include_inactive` | boolean | false |

### 200 — Success
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "enrollment_date": "2024-09-01",
    "is_active": true,
    "created_at": "2024-09-01T10:00:00Z",
    "courses": [
      {
        "id": 3,
        "course_name": "Introduction to Python",
        "course_code": "CS-101",
        "enrolled_at": "2024-09-05T09:00:00Z"
      }
    ]
  },
  "message": "Student retrieved successfully",
  "meta": null
}
```

> `courses` is an empty array when the student has no enrollments.
> Enrollments where `course_id` is NULL (course deleted) are excluded from the `courses` array.

### Errors
| Scenario | Status | `error.code` |
|---|---|---|
| Student ID not found | 404 | `STUDENT_NOT_FOUND` |
| Student is inactive and `include_inactive` not set | 404 | `STUDENT_NOT_FOUND` |

---

## 5. PUT /api/v1/students/{student_id}

**Auth:** Bearer token — `admin` only

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `student_id` | integer | required |

### Request body
All fields optional — only provided fields are updated.
```json
{
  "first_name": "Janet",
  "last_name": "Doe",
  "email": "janet.doe@example.com",
  "enrollment_date": "2024-09-01"
}
```

| Field | Type | Rules |
|---|---|---|
| `first_name` | string | optional, min 1, max 100 |
| `last_name` | string | optional, min 1, max 100 |
| `email` | string | optional, valid email format |
| `enrollment_date` | date | optional, must not be a future date |

### 200 — Success
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "Janet",
    "last_name": "Doe",
    "email": "janet.doe@example.com",
    "enrollment_date": "2024-09-01",
    "is_active": true,
    "created_at": "2024-09-01T10:00:00Z"
  },
  "message": "Student updated successfully",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` | `error.field` |
|---|---|---|---|
| Student not found | 404 | `STUDENT_NOT_FOUND` | null |
| New email belongs to another student | 409 | `EMAIL_ALREADY_EXISTS` | `email` |
| Invalid field format | 422 | `VALIDATION_ERROR` | field name |
| Staff role | 403 | `FORBIDDEN` | null |

---

## 6. DELETE /api/v1/students/{student_id}

**Auth:** Bearer token — `admin` only

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `student_id` | integer | required |

### 200 — Success
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com",
    "enrollment_date": "2024-09-01",
    "is_active": false,
    "created_at": "2024-09-01T10:00:00Z"
  },
  "message": "Student deactivated successfully",
  "meta": null
}
```

> Sets `is_active = false`. Record is never deleted from the database.

### Errors
| Scenario | Status | `error.code` |
|---|---|---|
| Student not found | 404 | `STUDENT_NOT_FOUND` |
| Student already inactive | 404 | `STUDENT_NOT_FOUND` |
| Staff role | 403 | `FORBIDDEN` |

---

## 7. POST /api/v1/courses

**Auth:** Bearer token — `admin` only

### Request body
```json
{
  "course_name": "Introduction to Python",
  "course_code": "CS-101",
  "description": "An introductory course covering Python fundamentals."
}
```

| Field | Type | Rules |
|---|---|---|
| `course_name` | string | required, min 1, max 200 |
| `course_code` | string | required, min 1, max 20, regex `^[A-Z0-9-]+$` |
| `description` | string | optional, nullable |

### 201 — Success
```json
{
  "success": true,
  "data": {
    "id": 1,
    "course_name": "Introduction to Python",
    "course_code": "CS-101",
    "description": "An introductory course covering Python fundamentals.",
    "created_at": "2024-09-01T10:00:00Z"
  },
  "message": "Course created successfully",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` | `error.field` |
|---|---|---|---|
| `course_code` already exists | 409 | `COURSE_CODE_ALREADY_EXISTS` | `course_code` |
| Missing or invalid fields | 422 | `VALIDATION_ERROR` | field name |
| Staff role | 403 | `FORBIDDEN` | null |

---

## 8. GET /api/v1/courses

**Auth:** Bearer token — `admin` or `staff`

### Query parameters
| Param | Type | Default | Rules |
|---|---|---|---|
| `page` | integer | 1 | ge=1 |
| `page_size` | integer | 20 | ge=1, le=100 |

### 200 — Success
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "course_name": "Introduction to Python",
      "course_code": "CS-101",
      "description": "An introductory course covering Python fundamentals.",
      "created_at": "2024-09-01T10:00:00Z"
    }
  ],
  "message": "Courses retrieved successfully",
  "meta": { "page": 1, "page_size": 20, "total": 1 }
}
```

> Returns empty `data: []` (not 404) when no courses exist.

---

## 9. GET /api/v1/courses/{course_id}

**Auth:** Bearer token — `admin` or `staff`

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `course_id` | integer | required |

### 200 — Success
```json
{
  "success": true,
  "data": {
    "id": 1,
    "course_name": "Introduction to Python",
    "course_code": "CS-101",
    "description": "An introductory course covering Python fundamentals.",
    "created_at": "2024-09-01T10:00:00Z"
  },
  "message": "Course retrieved successfully",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` |
|---|---|---|
| Course ID not found | 404 | `COURSE_NOT_FOUND` |

---

## 10. POST /api/v1/students/{student_id}/courses

**Auth:** Bearer token — `admin` or `staff`

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `student_id` | integer | required |

### Request body
```json
{
  "course_id": 3
}
```

| Field | Type | Rules |
|---|---|---|
| `course_id` | integer | required |

### 201 — Success
```json
{
  "success": true,
  "data": {
    "id": 7,
    "student_id": 1,
    "course_id": 3,
    "enrolled_at": "2024-09-05T09:00:00Z"
  },
  "message": "Student enrolled successfully",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` |
|---|---|---|
| Student not found or inactive | 404 | `STUDENT_NOT_FOUND` |
| Course not found | 404 | `COURSE_NOT_FOUND` |
| Student already enrolled in this course | 409 | `ALREADY_ENROLLED` |
| Missing or malformed body | 422 | `VALIDATION_ERROR` |

---

## 11. GET /api/v1/students/{student_id}/courses

**Auth:** Bearer token — `admin` or `staff`

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `student_id` | integer | required |

### 200 — Success
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "course_name": "Introduction to Python",
      "course_code": "CS-101",
      "enrolled_at": "2024-09-05T09:00:00Z"
    }
  ],
  "message": "Enrollments retrieved successfully",
  "meta": null
}
```

> Returns empty `data: []` (not 404) when student exists but has no enrollments.
> Enrollments where `course_id` is NULL are excluded from the response.

### Errors
| Scenario | Status | `error.code` |
|---|---|---|
| Student not found | 404 | `STUDENT_NOT_FOUND` |

---

## 12. DELETE /api/v1/students/{student_id}/courses/{course_id}

**Auth:** Bearer token — `admin` or `staff`

### Path parameters
| Param | Type | Rules |
|---|---|---|
| `student_id` | integer | required |
| `course_id` | integer | required |

### 200 — Success
```json
{
  "success": true,
  "data": null,
  "message": "Enrollment removed successfully",
  "meta": null
}
```

### Errors
| Scenario | Status | `error.code` |
|---|---|---|
| Student not found | 404 | `STUDENT_NOT_FOUND` |
| Course not found | 404 | `COURSE_NOT_FOUND` |
| Enrollment not found (student not enrolled in this course) | 404 | `ENROLLMENT_NOT_FOUND` |

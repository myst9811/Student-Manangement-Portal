class StudentManagementException(Exception):
    def __init__(
        self,
        message: str,
        code: str,
        detail: str = "",
        field: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.detail = detail
        self.field = field


# --- Auth ---

class MissingTokenException(StudentManagementException):
    def __init__(self, detail: str = "Authorization header is missing") -> None:
        super().__init__("Authentication required", "MISSING_TOKEN", detail)


class ExpiredTokenException(StudentManagementException):
    def __init__(self, detail: str = "Token has expired") -> None:
        super().__init__("Token expired", "EXPIRED_TOKEN", detail)


class InvalidTokenException(StudentManagementException):
    def __init__(self, detail: str = "Token is invalid") -> None:
        super().__init__("Invalid token", "INVALID_TOKEN", detail)


class InvalidCredentialsException(StudentManagementException):
    def __init__(self, detail: str = "Email or password is incorrect") -> None:
        super().__init__("Invalid credentials", "INVALID_CREDENTIALS", detail)


class ForbiddenException(StudentManagementException):
    def __init__(self, detail: str = "Insufficient permissions") -> None:
        super().__init__("Forbidden", "FORBIDDEN", detail)


# --- Student ---

class StudentNotFoundException(StudentManagementException):
    def __init__(self, detail: str = "Student not found") -> None:
        super().__init__("Student not found", "STUDENT_NOT_FOUND", detail)


class EmailAlreadyExistsException(StudentManagementException):
    def __init__(self, detail: str = "A student with this email already exists") -> None:
        super().__init__("Email already exists", "EMAIL_ALREADY_EXISTS", detail, field="email")


# --- Course ---

class CourseNotFoundException(StudentManagementException):
    def __init__(self, detail: str = "Course not found") -> None:
        super().__init__("Course not found", "COURSE_NOT_FOUND", detail)


class CourseCodeAlreadyExistsException(StudentManagementException):
    def __init__(self, detail: str = "A course with this code already exists") -> None:
        super().__init__(
            "Course code already exists", "COURSE_CODE_ALREADY_EXISTS", detail, field="course_code"
        )


# --- Enrollment ---

class AlreadyEnrolledException(StudentManagementException):
    def __init__(self, detail: str = "Student is already enrolled in this course") -> None:
        super().__init__("Already enrolled", "ALREADY_ENROLLED", detail)


class EnrollmentNotFoundException(StudentManagementException):
    def __init__(self, detail: str = "Enrollment not found") -> None:
        super().__init__("Enrollment not found", "ENROLLMENT_NOT_FOUND", detail)


# --- General ---

class ValidationErrorException(StudentManagementException):
    def __init__(self, detail: str = "", field: str | None = None) -> None:
        super().__init__("Validation error", "VALIDATION_ERROR", detail, field)


class InternalErrorException(StudentManagementException):
    def __init__(self, detail: str = "An unexpected error occurred") -> None:
        super().__init__("Internal server error", "INTERNAL_ERROR", detail)

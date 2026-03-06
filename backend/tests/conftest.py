from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def mock_user():
    u = MagicMock()
    u.id = 1
    u.email = "admin@school.com"
    u.password = "hashed_password"
    u.role = "admin"
    u.is_active = True
    return u


@pytest.fixture
def mock_student():
    s = MagicMock()
    s.id = 1
    s.first_name = "Jane"
    s.last_name = "Doe"
    s.email = "jane@example.com"
    s.enrollment_date = date(2024, 9, 1)
    s.is_active = True
    s.enrollments = []
    return s


@pytest.fixture
def mock_course():
    c = MagicMock()
    c.id = 1
    c.course_name = "Intro to Python"
    c.course_code = "CS-101"
    c.description = "Python fundamentals"
    return c


@pytest.fixture
def mock_enrollment(mock_student, mock_course):
    e = MagicMock()
    e.id = 1
    e.student_id = 1
    e.course_id = 1
    e.course = mock_course
    e.student = mock_student
    return e

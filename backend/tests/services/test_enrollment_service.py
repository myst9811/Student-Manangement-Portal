from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import (
    AlreadyEnrolledException,
    CourseNotFoundException,
    EnrollmentNotFoundException,
    StudentNotFoundException,
)
from app.services import enrollment_service as enrollment_svc


async def test_enroll_student_success(mock_db, mock_student, mock_course, mock_enrollment):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo") as e_repo:
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        c_repo.get_by_id = AsyncMock(return_value=mock_course)
        e_repo.get_by_student_and_course = AsyncMock(return_value=None)
        e_repo.create = AsyncMock(return_value=mock_enrollment)
        result = await enrollment_svc.enroll_student(mock_db, 1, 1)
    assert result is mock_enrollment


async def test_enroll_student_student_not_found(mock_db):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo"):
        s_repo.get_by_id = AsyncMock(return_value=None)
        c_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(StudentNotFoundException):
            await enrollment_svc.enroll_student(mock_db, 99, 1)


async def test_enroll_student_course_not_found(mock_db, mock_student):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo"):
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        c_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(CourseNotFoundException):
            await enrollment_svc.enroll_student(mock_db, 1, 99)


async def test_enroll_student_already_enrolled(mock_db, mock_student, mock_course, mock_enrollment):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo") as e_repo:
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        c_repo.get_by_id = AsyncMock(return_value=mock_course)
        e_repo.get_by_student_and_course = AsyncMock(return_value=mock_enrollment)
        with pytest.raises(AlreadyEnrolledException):
            await enrollment_svc.enroll_student(mock_db, 1, 1)


async def test_list_student_enrollments_success(mock_db, mock_student, mock_enrollment):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "enrollment_repo") as e_repo:
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        e_repo.get_by_student_id = AsyncMock(return_value=[mock_enrollment])
        result = await enrollment_svc.list_student_enrollments(mock_db, 1)
    assert result == [mock_enrollment]


async def test_list_student_enrollments_student_not_found(mock_db):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "enrollment_repo"):
        s_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(StudentNotFoundException):
            await enrollment_svc.list_student_enrollments(mock_db, 99)


async def test_remove_enrollment_success(mock_db, mock_student, mock_course, mock_enrollment):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo") as e_repo:
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        c_repo.get_by_id = AsyncMock(return_value=mock_course)
        e_repo.get_by_student_and_course = AsyncMock(return_value=mock_enrollment)
        e_repo.delete = AsyncMock(return_value=None)
        await enrollment_svc.remove_enrollment(mock_db, 1, 1)
        e_repo.delete.assert_called_once_with(mock_db, mock_enrollment)


async def test_remove_enrollment_student_not_found(mock_db):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo"), \
         patch.object(enrollment_svc, "enrollment_repo"):
        s_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(StudentNotFoundException):
            await enrollment_svc.remove_enrollment(mock_db, 99, 1)


async def test_remove_enrollment_course_not_found(mock_db, mock_student):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo"):
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        c_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(CourseNotFoundException):
            await enrollment_svc.remove_enrollment(mock_db, 1, 99)


async def test_remove_enrollment_not_found(mock_db, mock_student, mock_course):
    with patch.object(enrollment_svc, "student_repo") as s_repo, \
         patch.object(enrollment_svc, "course_repo") as c_repo, \
         patch.object(enrollment_svc, "enrollment_repo") as e_repo:
        s_repo.get_by_id = AsyncMock(return_value=mock_student)
        c_repo.get_by_id = AsyncMock(return_value=mock_course)
        e_repo.get_by_student_and_course = AsyncMock(return_value=None)
        with pytest.raises(EnrollmentNotFoundException):
            await enrollment_svc.remove_enrollment(mock_db, 1, 1)

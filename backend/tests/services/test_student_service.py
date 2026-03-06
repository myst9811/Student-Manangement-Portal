from datetime import date
from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import EmailAlreadyExistsException, StudentNotFoundException
from app.services import student_service as student_svc


async def test_create_student_success(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_email = AsyncMock(return_value=None)
        mock_repo.create = AsyncMock(return_value=mock_student)
        result = await student_svc.create_student(mock_db, "Jane", "Doe", "jane@example.com", date(2024, 9, 1))
    assert result is mock_student


async def test_create_student_duplicate_email(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_email = AsyncMock(return_value=mock_student)
        with pytest.raises(EmailAlreadyExistsException):
            await student_svc.create_student(mock_db, "Jane", "Doe", "jane@example.com", date(2024, 9, 1))


async def test_list_students_returns_paginated(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_all = AsyncMock(return_value=([mock_student], 1))
        students, total = await student_svc.list_students(mock_db, page=1, page_size=20)
    assert students == [mock_student]
    assert total == 1


async def test_list_students_include_inactive(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_all = AsyncMock(return_value=([mock_student], 1))
        await student_svc.list_students(mock_db, page=1, page_size=20, include_inactive=True)
        mock_repo.get_all.assert_called_once_with(mock_db, 1, 20, True)


async def test_get_student_success(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=mock_student)
        result = await student_svc.get_student(mock_db, 1)
    assert result is mock_student


async def test_get_student_not_found(mock_db):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(StudentNotFoundException):
            await student_svc.get_student(mock_db, 99)


async def test_update_student_success(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=mock_student)
        mock_repo.get_by_email = AsyncMock(return_value=None)
        mock_repo.update = AsyncMock(return_value=mock_student)
        result = await student_svc.update_student(mock_db, 1, {"first_name": "Janet"})
    assert result is mock_student


async def test_update_student_not_found(mock_db):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(StudentNotFoundException):
            await student_svc.update_student(mock_db, 99, {"first_name": "X"})


async def test_update_student_email_conflict(mock_db, mock_student):
    other = mock_student
    current = mock_student
    current.email = "current@example.com"
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=current)
        mock_repo.get_by_email = AsyncMock(return_value=other)
        with pytest.raises(EmailAlreadyExistsException):
            await student_svc.update_student(mock_db, 1, {"email": "taken@example.com"})


async def test_deactivate_student_success(mock_db, mock_student):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=mock_student)
        mock_repo.deactivate = AsyncMock(return_value=mock_student)
        result = await student_svc.deactivate_student(mock_db, 1)
    assert result is mock_student


async def test_deactivate_student_not_found(mock_db):
    with patch.object(student_svc, "student_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(StudentNotFoundException):
            await student_svc.deactivate_student(mock_db, 99)

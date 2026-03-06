from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import CourseCodeAlreadyExistsException, CourseNotFoundException
from app.services import course_service as course_svc


async def test_create_course_success(mock_db, mock_course):
    with patch.object(course_svc, "course_repo") as mock_repo:
        mock_repo.get_by_code = AsyncMock(return_value=None)
        mock_repo.create = AsyncMock(return_value=mock_course)
        result = await course_svc.create_course(mock_db, "Intro to Python", "CS-101", "Fundamentals")
    assert result is mock_course


async def test_create_course_duplicate_code(mock_db, mock_course):
    with patch.object(course_svc, "course_repo") as mock_repo:
        mock_repo.get_by_code = AsyncMock(return_value=mock_course)
        with pytest.raises(CourseCodeAlreadyExistsException):
            await course_svc.create_course(mock_db, "Other Course", "CS-101", None)


async def test_list_courses_returns_paginated(mock_db, mock_course):
    with patch.object(course_svc, "course_repo") as mock_repo:
        mock_repo.get_all = AsyncMock(return_value=([mock_course], 1))
        courses, total = await course_svc.list_courses(mock_db, page=1, page_size=20)
    assert courses == [mock_course]
    assert total == 1


async def test_list_courses_empty(mock_db):
    with patch.object(course_svc, "course_repo") as mock_repo:
        mock_repo.get_all = AsyncMock(return_value=([], 0))
        courses, total = await course_svc.list_courses(mock_db, page=1, page_size=20)
    assert courses == []
    assert total == 0


async def test_get_course_success(mock_db, mock_course):
    with patch.object(course_svc, "course_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=mock_course)
        result = await course_svc.get_course(mock_db, 1)
    assert result is mock_course


async def test_get_course_not_found(mock_db):
    with patch.object(course_svc, "course_repo") as mock_repo:
        mock_repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(CourseNotFoundException):
            await course_svc.get_course(mock_db, 99)

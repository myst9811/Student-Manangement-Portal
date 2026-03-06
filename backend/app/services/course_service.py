import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CourseCodeAlreadyExistsException, CourseNotFoundException
from app.models.course import Course
from app.repositories import course_repository as course_repo

logger = logging.getLogger(__name__)


async def create_course(
    db: AsyncSession,
    course_name: str,
    course_code: str,
    description: str | None,
) -> Course:
    if await course_repo.get_by_code(db, course_code):
        raise CourseCodeAlreadyExistsException()
    course = await course_repo.create(db, course_name, course_code, description)
    logger.info("Course created id=%d code=%s", course.id, course.course_code)
    return course


async def list_courses(
    db: AsyncSession, page: int, page_size: int
) -> tuple[list[Course], int]:
    return await course_repo.get_all(db, page, page_size)


async def get_course(db: AsyncSession, course_id: int) -> Course:
    course = await course_repo.get_by_id(db, course_id)
    if not course:
        raise CourseNotFoundException(detail=f"Course id={course_id} not found")
    return course

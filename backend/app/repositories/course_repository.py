import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course

logger = logging.getLogger(__name__)


async def get_by_id(db: AsyncSession, course_id: int) -> Course | None:
    result = await db.execute(select(Course).where(Course.id == course_id))
    return result.scalar_one_or_none()


async def get_by_code(db: AsyncSession, course_code: str) -> Course | None:
    result = await db.execute(select(Course).where(Course.course_code == course_code))
    return result.scalar_one_or_none()


async def get_all(
    db: AsyncSession, page: int, page_size: int
) -> tuple[list[Course], int]:
    stmt = select(Course)

    count_result = await db.execute(
        select(func.count()).select_from(stmt.subquery())
    )
    total = count_result.scalar_one()

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    return list(result.scalars().all()), total


async def create(
    db: AsyncSession,
    course_name: str,
    course_code: str,
    description: str | None,
) -> Course:
    course = Course(
        course_name=course_name,
        course_code=course_code,
        description=description,
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)
    logger.info("Created course id=%d code=%s", course.id, course.course_code)
    return course

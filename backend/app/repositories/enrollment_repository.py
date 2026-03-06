import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enrollment import Enrollment

logger = logging.getLogger(__name__)


async def get_by_student_and_course(
    db: AsyncSession, student_id: int, course_id: int
) -> Enrollment | None:
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.course_id == course_id,
        )
    )
    return result.scalar_one_or_none()


async def get_by_student_id(
    db: AsyncSession, student_id: int
) -> list[Enrollment]:
    result = await db.execute(
        select(Enrollment).where(Enrollment.student_id == student_id)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession, student_id: int, course_id: int
) -> Enrollment:
    enrollment = Enrollment(student_id=student_id, course_id=course_id)
    db.add(enrollment)
    await db.flush()
    await db.refresh(enrollment)
    logger.info(
        "Created enrollment id=%d student_id=%d course_id=%d",
        enrollment.id, student_id, course_id,
    )
    return enrollment


async def delete(db: AsyncSession, enrollment: Enrollment) -> None:
    await db.delete(enrollment)
    await db.flush()
    logger.info("Deleted enrollment id=%d", enrollment.id)

import logging
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student import Student

logger = logging.getLogger(__name__)


async def get_by_id(
    db: AsyncSession, student_id: int, include_inactive: bool = False
) -> Student | None:
    stmt = select(Student).where(Student.id == student_id)
    if not include_inactive:
        stmt = stmt.where(Student.is_active == True)  # noqa: E712
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> Student | None:
    result = await db.execute(select(Student).where(Student.email == email))
    return result.scalar_one_or_none()


async def get_all(
    db: AsyncSession,
    page: int,
    page_size: int,
    include_inactive: bool = False,
) -> tuple[list[Student], int]:
    stmt = select(Student)
    if not include_inactive:
        stmt = stmt.where(Student.is_active == True)  # noqa: E712

    count_result = await db.execute(
        select(func.count()).select_from(stmt.subquery())
    )
    total = count_result.scalar_one()

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    return list(result.scalars().all()), total


async def create(
    db: AsyncSession,
    first_name: str,
    last_name: str,
    email: str,
    enrollment_date: date,
) -> Student:
    student = Student(
        first_name=first_name,
        last_name=last_name,
        email=email,
        enrollment_date=enrollment_date,
    )
    db.add(student)
    await db.flush()
    await db.refresh(student)
    logger.info("Created student id=%d", student.id)
    return student


async def update(db: AsyncSession, student: Student, data: dict) -> Student:
    for key, value in data.items():
        setattr(student, key, value)
    await db.flush()
    await db.refresh(student)
    logger.info("Updated student id=%d", student.id)
    return student


async def deactivate(db: AsyncSession, student: Student) -> Student:
    student.is_active = False
    await db.flush()
    await db.refresh(student)
    logger.info("Deactivated student id=%d", student.id)
    return student

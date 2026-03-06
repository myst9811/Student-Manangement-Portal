import logging
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyExistsException, StudentNotFoundException
from app.models.student import Student
from app.repositories import student_repository as student_repo

logger = logging.getLogger(__name__)


async def create_student(
    db: AsyncSession,
    first_name: str,
    last_name: str,
    email: str,
    enrollment_date: date,
) -> Student:
    if await student_repo.get_by_email(db, email):
        raise EmailAlreadyExistsException()
    student = await student_repo.create(db, first_name, last_name, email, enrollment_date)
    logger.info("Student created id=%d", student.id)
    return student


async def list_students(
    db: AsyncSession,
    page: int,
    page_size: int,
    include_inactive: bool = False,
) -> tuple[list[Student], int]:
    return await student_repo.get_all(db, page, page_size, include_inactive)


async def get_student(
    db: AsyncSession,
    student_id: int,
    include_inactive: bool = False,
) -> Student:
    student = await student_repo.get_by_id(db, student_id, include_inactive)
    if not student:
        raise StudentNotFoundException(detail=f"Student id={student_id} not found")
    return student


async def update_student(
    db: AsyncSession,
    student_id: int,
    data: dict,
) -> Student:
    student = await student_repo.get_by_id(db, student_id)
    if not student:
        raise StudentNotFoundException(detail=f"Student id={student_id} not found")
    if "email" in data and data["email"] != student.email:
        if await student_repo.get_by_email(db, data["email"]):
            raise EmailAlreadyExistsException()
    student = await student_repo.update(db, student, data)
    logger.info("Student updated id=%d", student_id)
    return student


async def deactivate_student(db: AsyncSession, student_id: int) -> Student:
    student = await student_repo.get_by_id(db, student_id)
    if not student:
        raise StudentNotFoundException(detail=f"Student id={student_id} not found or already inactive")
    student = await student_repo.deactivate(db, student)
    logger.info("Student deactivated id=%d", student_id)
    return student

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AlreadyEnrolledException,
    CourseNotFoundException,
    EnrollmentNotFoundException,
    StudentNotFoundException,
)
from app.models.enrollment import Enrollment
from app.repositories import course_repository as course_repo
from app.repositories import enrollment_repository as enrollment_repo
from app.repositories import student_repository as student_repo

logger = logging.getLogger(__name__)


async def enroll_student(
    db: AsyncSession, student_id: int, course_id: int
) -> Enrollment:
    student = await student_repo.get_by_id(db, student_id)
    if not student:
        raise StudentNotFoundException(detail=f"Student id={student_id} not found or inactive")

    course = await course_repo.get_by_id(db, course_id)
    if not course:
        raise CourseNotFoundException(detail=f"Course id={course_id} not found")

    if await enrollment_repo.get_by_student_and_course(db, student_id, course_id):
        raise AlreadyEnrolledException()

    enrollment = await enrollment_repo.create(db, student_id, course_id)
    logger.info("Student id=%d enrolled in course id=%d", student_id, course_id)
    return enrollment


async def list_student_enrollments(
    db: AsyncSession, student_id: int
) -> list[Enrollment]:
    student = await student_repo.get_by_id(db, student_id, include_inactive=True)
    if not student:
        raise StudentNotFoundException(detail=f"Student id={student_id} not found")
    return await enrollment_repo.get_by_student_id(db, student_id)


async def remove_enrollment(
    db: AsyncSession, student_id: int, course_id: int
) -> None:
    student = await student_repo.get_by_id(db, student_id, include_inactive=True)
    if not student:
        raise StudentNotFoundException(detail=f"Student id={student_id} not found")

    course = await course_repo.get_by_id(db, course_id)
    if not course:
        raise CourseNotFoundException(detail=f"Course id={course_id} not found")

    enrollment = await enrollment_repo.get_by_student_and_course(db, student_id, course_id)
    if not enrollment:
        raise EnrollmentNotFoundException()

    await enrollment_repo.delete(db, enrollment)
    logger.info("Removed enrollment student_id=%d course_id=%d", student_id, course_id)

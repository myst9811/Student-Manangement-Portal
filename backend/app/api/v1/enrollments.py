import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ROLE_ADMIN, ROLE_STAFF, require_role
from app.schemas.enrollment import EnrolledCourseSchema, EnrollmentCreateSchema, EnrollmentResponseSchema
from app.services import enrollment_service as enrollment_svc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/students", tags=["enrollments"])


@router.post("/{student_id}/courses", status_code=201, dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def enroll_student(
    student_id: int,
    body: EnrollmentCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    enrollment = await enrollment_svc.enroll_student(db, student_id, body.course_id)
    return {"success": True, "data": EnrollmentResponseSchema.model_validate(enrollment).model_dump(mode="json"),
            "message": "Student enrolled successfully", "meta": None}


@router.get("/{student_id}/courses", dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def list_student_enrollments(
    student_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    enrollments = await enrollment_svc.list_student_enrollments(db, student_id)
    data = [
        EnrolledCourseSchema(
            id=e.course.id,
            course_name=e.course.course_name,
            course_code=e.course.course_code,
            enrolled_at=e.enrolled_at,
        ).model_dump(mode="json")
        for e in enrollments
        if e.course is not None
    ]
    return {"success": True, "data": data, "message": "Enrollments retrieved successfully", "meta": None}


@router.delete("/{student_id}/courses/{course_id}", dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def remove_enrollment(
    student_id: int,
    course_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await enrollment_svc.remove_enrollment(db, student_id, course_id)
    return {"success": True, "data": None, "message": "Enrollment removed successfully", "meta": None}

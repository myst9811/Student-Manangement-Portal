import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ROLE_ADMIN, ROLE_STAFF, require_role
from app.schemas.enrollment import EnrolledCourseSchema
from app.schemas.student import StudentCreateSchema, StudentResponseSchema, StudentUpdateSchema
from app.services import student_service as student_svc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/students", tags=["students"])


@router.post("", status_code=201, dependencies=[Depends(require_role(ROLE_ADMIN))])
async def create_student(
    body: StudentCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    student = await student_svc.create_student(
        db, body.first_name, body.last_name, str(body.email), body.enrollment_date
    )
    return {"success": True, "data": StudentResponseSchema.model_validate(student).model_dump(mode="json"),
            "message": "Student created successfully", "meta": None}


@router.get("", dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def list_students(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    include_inactive: bool = Query(default=False),
) -> dict:
    students, total = await student_svc.list_students(db, page, page_size, include_inactive)
    return {
        "success": True,
        "data": [StudentResponseSchema.model_validate(s).model_dump(mode="json") for s in students],
        "message": "Students retrieved successfully",
        "meta": {"page": page, "page_size": page_size, "total": total},
    }


@router.get("/{student_id}", dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def get_student(
    student_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    include_inactive: bool = Query(default=False),
) -> dict:
    student = await student_svc.get_student(db, student_id, include_inactive)
    courses = [
        EnrolledCourseSchema(
            id=e.course.id,
            course_name=e.course.course_name,
            course_code=e.course.course_code,
            enrolled_at=e.enrolled_at,
        ).model_dump(mode="json")
        for e in student.enrollments
        if e.course is not None
    ]
    data = StudentResponseSchema.model_validate(student).model_dump(mode="json")
    data["courses"] = courses
    return {"success": True, "data": data, "message": "Student retrieved successfully", "meta": None}


@router.put("/{student_id}", dependencies=[Depends(require_role(ROLE_ADMIN))])
async def update_student(
    student_id: int,
    body: StudentUpdateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    student = await student_svc.update_student(db, student_id, body.model_dump(exclude_unset=True))
    return {"success": True, "data": StudentResponseSchema.model_validate(student).model_dump(mode="json"),
            "message": "Student updated successfully", "meta": None}


@router.delete("/{student_id}", dependencies=[Depends(require_role(ROLE_ADMIN))])
async def deactivate_student(
    student_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    student = await student_svc.deactivate_student(db, student_id)
    return {"success": True, "data": StudentResponseSchema.model_validate(student).model_dump(mode="json"),
            "message": "Student deactivated successfully", "meta": None}

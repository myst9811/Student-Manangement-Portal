import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import ROLE_ADMIN, ROLE_STAFF, require_role
from app.schemas.course import CourseCreateSchema, CourseResponseSchema
from app.services import course_service as course_svc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", status_code=201, dependencies=[Depends(require_role(ROLE_ADMIN))])
async def create_course(
    body: CourseCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    course = await course_svc.create_course(db, body.course_name, body.course_code, body.description)
    return {"success": True, "data": CourseResponseSchema.model_validate(course).model_dump(mode="json"),
            "message": "Course created successfully", "meta": None}


@router.get("", dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def list_courses(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    courses, total = await course_svc.list_courses(db, page, page_size)
    return {
        "success": True,
        "data": [CourseResponseSchema.model_validate(c).model_dump(mode="json") for c in courses],
        "message": "Courses retrieved successfully",
        "meta": {"page": page, "page_size": page_size, "total": total},
    }


@router.get("/{course_id}", dependencies=[Depends(require_role(ROLE_ADMIN, ROLE_STAFF))])
async def get_course(
    course_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    course = await course_svc.get_course(db, course_id)
    return {"success": True, "data": CourseResponseSchema.model_validate(course).model_dump(mode="json"),
            "message": "Course retrieved successfully", "meta": None}

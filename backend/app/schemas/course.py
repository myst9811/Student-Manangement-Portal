from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CourseCreateSchema(BaseModel):
    course_name: str = Field(min_length=1, max_length=200)
    course_code: str = Field(min_length=1, max_length=20, pattern=r"^[A-Z0-9-]+$")
    description: str | None = None


class CourseResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_name: str
    course_code: str
    description: str | None
    created_at: datetime


class CourseListQuerySchema(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

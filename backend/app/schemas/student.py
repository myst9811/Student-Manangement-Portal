from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.schemas.enrollment import EnrolledCourseSchema


class StudentCreateSchema(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    enrollment_date: date

    @field_validator("enrollment_date")
    @classmethod
    def enrollment_date_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("enrollment_date cannot be in the future")
        return v


class StudentUpdateSchema(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    enrollment_date: date | None = None

    @field_validator("enrollment_date")
    @classmethod
    def enrollment_date_not_future(cls, v: date | None) -> date | None:
        if v is not None and v > date.today():
            raise ValueError("enrollment_date cannot be in the future")
        return v


class StudentResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str
    enrollment_date: date
    is_active: bool
    created_at: datetime


class StudentWithCoursesResponseSchema(StudentResponseSchema):
    courses: list[EnrolledCourseSchema] = []


class StudentListQuerySchema(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    include_inactive: bool = False


class StudentGetQuerySchema(BaseModel):
    include_inactive: bool = False

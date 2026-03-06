from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EnrollmentCreateSchema(BaseModel):
    course_id: int


class EnrollmentResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int | None
    enrolled_at: datetime


class EnrolledCourseSchema(BaseModel):
    """Course as seen through an enrollment — used in student detail and enrollment list responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    course_name: str
    course_code: str
    enrolled_at: datetime

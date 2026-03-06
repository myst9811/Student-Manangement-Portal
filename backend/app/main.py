import logging

from fastapi import FastAPI

from app.api.v1 import auth, courses, enrollments, students
from app.core.middleware import register_exception_handlers, register_middleware

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Student Management System",
    version="1.0.0",
)

register_middleware(app)
register_exception_handlers(app)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(students.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(enrollments.router, prefix="/api/v1")

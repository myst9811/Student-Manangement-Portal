import logging

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    AlreadyEnrolledException,
    CourseCodeAlreadyExistsException,
    CourseNotFoundException,
    EmailAlreadyExistsException,
    EnrollmentNotFoundException,
    ExpiredTokenException,
    ForbiddenException,
    InternalErrorException,
    InvalidCredentialsException,
    InvalidTokenException,
    MissingTokenException,
    StudentManagementException,
    StudentNotFoundException,
    ValidationErrorException,
)

logger = logging.getLogger(__name__)

_STATUS_MAP: dict[type[StudentManagementException], int] = {
    MissingTokenException: 401,
    ExpiredTokenException: 401,
    InvalidTokenException: 401,
    InvalidCredentialsException: 401,
    ForbiddenException: 403,
    StudentNotFoundException: 404,
    CourseNotFoundException: 404,
    EnrollmentNotFoundException: 404,
    EmailAlreadyExistsException: 409,
    CourseCodeAlreadyExistsException: 409,
    AlreadyEnrolledException: 409,
    ValidationErrorException: 422,
    InternalErrorException: 500,
}


async def domain_exception_handler(request: Request, exc: StudentManagementException) -> JSONResponse:
    status_code = _STATUS_MAP.get(type(exc), 500)
    if status_code >= 500:
        logger.error("Internal error on %s %s: %s", request.method, request.url.path, exc.detail, exc_info=True)
    else:
        logger.warning("Domain error on %s %s: [%s] %s", request.method, request.url.path, exc.code, exc.detail)
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.message,
            "error": {
                "code": exc.code,
                "detail": exc.detail,
                "field": exc.field,
            },
        },
    )


def register_exception_handlers(app) -> None:
    app.add_exception_handler(StudentManagementException, domain_exception_handler)

import logging
import time

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

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
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

_PUBLIC_PATHS = {"/api/v1/auth/login"}

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


def _error_envelope(status: int, code: str, message: str, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={
            "success": False,
            "data": None,
            "message": message,
            "error": {"code": code, "detail": detail, "field": None},
        },
    )


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.monotonic()

        if request.url.path not in _PUBLIC_PATHS:
            auth_error = self._authenticate(request)
            if auth_error is not None:
                return auth_error

        response = await call_next(request)
        elapsed_ms = (time.monotonic() - start) * 1000
        logger.info("%s %s → %d (%.1fms)", request.method, request.url.path, response.status_code, elapsed_ms)
        return response

    @staticmethod
    def _authenticate(request: Request) -> JSONResponse | None:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return _error_envelope(401, "MISSING_TOKEN", "Authentication required", "Authorization header is missing")
        token = auth_header[7:]
        try:
            payload = decode_access_token(token)
        except ExpiredTokenException:
            return _error_envelope(401, "EXPIRED_TOKEN", "Token expired", "Token has expired")
        except InvalidTokenException:
            return _error_envelope(401, "INVALID_TOKEN", "Invalid token", "Token is invalid")
        request.state.user = {
            "id": int(payload["sub"]),
            "email": payload["email"],
            "role": payload["role"],
        }
        return None


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
            "error": {"code": exc.code, "detail": exc.detail, "field": exc.field},
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else {}
    field_parts = first.get("loc", ())[1:]
    field = ".".join(str(p) for p in field_parts) or None
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": None,
            "message": "Validation error",
            "error": {"code": "VALIDATION_ERROR", "detail": first.get("msg", "Invalid input"), "field": field},
        },
    )


def register_exception_handlers(app) -> None:
    app.add_exception_handler(StudentManagementException, domain_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)


def register_middleware(app) -> None:
    app.add_middleware(JWTMiddleware)

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import ExpiredTokenException, ForbiddenException, InvalidTokenException, MissingTokenException

ROLE_ADMIN = "admin"
ROLE_STAFF = "staff"

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "email": email, "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except ExpiredSignatureError:
        raise ExpiredTokenException()
    except JWTError:
        raise InvalidTokenException()


def require_role(*roles: str):
    """FastAPI dependency — enforces that the authenticated user holds one of the given roles."""
    from fastapi import Request

    async def _check(request: Request) -> None:
        user = getattr(request.state, "user", None)
        if user is None:
            raise MissingTokenException()
        if user.get("role") not in roles:
            raise ForbiddenException()

    return _check

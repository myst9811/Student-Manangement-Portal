from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from app.core.config import settings
from app.core.exceptions import ExpiredTokenException, ForbiddenException, InvalidTokenException, MissingTokenException

ROLE_ADMIN = "admin"
ROLE_STAFF = "staff"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


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

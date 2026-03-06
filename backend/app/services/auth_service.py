import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import InvalidCredentialsException
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories import user_repository as user_repo

logger = logging.getLogger(__name__)


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await user_repo.get_by_email(db, email)
    if not user or not user.is_active:
        raise InvalidCredentialsException()
    if not verify_password(password, user.password):
        raise InvalidCredentialsException()
    logger.info("Successful login for user id=%d", user.id)
    return user


def build_token(user: User) -> str:
    return create_access_token(user.id, user.email, user.role)

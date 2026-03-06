from unittest.mock import AsyncMock, patch

import pytest

from app.core.exceptions import InvalidCredentialsException
from app.services import auth_service as auth_svc


async def test_authenticate_user_success(mock_db, mock_user):
    with patch.object(auth_svc, "user_repo") as mock_repo:
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)
        with patch.object(auth_svc, "verify_password", return_value=True):
            user = await auth_svc.authenticate_user(mock_db, "admin@school.com", "secret123")
    assert user is mock_user


async def test_authenticate_user_email_not_found(mock_db):
    with patch.object(auth_svc, "user_repo") as mock_repo:
        mock_repo.get_by_email = AsyncMock(return_value=None)
        with pytest.raises(InvalidCredentialsException):
            await auth_svc.authenticate_user(mock_db, "nobody@school.com", "secret123")


async def test_authenticate_user_wrong_password(mock_db, mock_user):
    with patch.object(auth_svc, "user_repo") as mock_repo:
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)
        with patch.object(auth_svc, "verify_password", return_value=False):
            with pytest.raises(InvalidCredentialsException):
                await auth_svc.authenticate_user(mock_db, "admin@school.com", "wrong")


async def test_authenticate_user_inactive(mock_db, mock_user):
    mock_user.is_active = False
    with patch.object(auth_svc, "user_repo") as mock_repo:
        mock_repo.get_by_email = AsyncMock(return_value=mock_user)
        with pytest.raises(InvalidCredentialsException):
            await auth_svc.authenticate_user(mock_db, "admin@school.com", "secret123")


def test_build_token_returns_string(mock_user):
    with patch.object(auth_svc, "create_access_token", return_value="jwt.token.here"):
        token = auth_svc.build_token(mock_user)
    assert token == "jwt.token.here"

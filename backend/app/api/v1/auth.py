import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import LoginRequestSchema, TokenResponseSchema
from app.services import auth_service as auth_svc

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(
    body: LoginRequestSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    user = await auth_svc.authenticate_user(db, str(body.email), body.password)
    token = auth_svc.build_token(user)
    return {
        "success": True,
        "data": TokenResponseSchema(access_token=token).model_dump(),
        "message": "Login successful",
        "meta": None,
    }

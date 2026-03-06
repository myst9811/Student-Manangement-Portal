from pydantic import BaseModel, EmailStr, Field


class LoginRequestSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"

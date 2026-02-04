from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    date_of_birth: date

class UserCreate(UserBase):
    password: str
    
    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must include at least one number")
        if not any(not char.isalnum() for char in v):
            raise ValueError("Password must include at least one special character")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def name_required(cls, v: str):
        if not v.strip():
            raise ValueError("Name fields cannot be empty")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    date_of_birth: date
    email_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(TokenResponse):
    user: UserResponse


class VerifyEmailResponse(AuthResponse):
    message: str


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    message: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must include at least one number")
        if not any(not char.isalnum() for char in v):
            raise ValueError("Password must include at least one special character")
        return v

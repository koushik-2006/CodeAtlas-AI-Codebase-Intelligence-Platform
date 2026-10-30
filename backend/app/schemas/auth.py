from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class GoogleAuthRequest(BaseModel):
    code: Optional[str] = None
    credential: Optional[str] = None
    redirect_uri: Optional[str] = None


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the user")
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(..., min_length=8, max_length=128, description="Plain text password (min 8 chars)")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Password")


class SessionUser(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = "Software Engineer"
    provider: Optional[str] = "credentials"
    github_connected: bool = False
    is_active: bool = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 86400
    user_id: str
    email: str
    name: Optional[str] = None
    github_connected: bool = False


class AuthSuccessResponse(BaseModel):
    success: bool = True
    message: str
    requiresVerification: bool = False
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    expires_in: Optional[int] = 86400
    user: Optional[SessionUser] = None


class SessionStatusResponse(BaseModel):
    success: bool = True
    isAuthenticated: bool
    user: Optional[SessionUser] = None

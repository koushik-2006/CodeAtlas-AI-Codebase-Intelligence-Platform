from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import RedirectResponse
import httpx
from app.config import settings
from app.dependencies import (
    get_auth_service,
    get_current_user,
    get_optional_current_user,
    get_account_repo,
    get_user_repo
)
from app.services.auth_service import AuthService
from app.security.csrf import generate_oauth_state
from app.security.sessions import create_access_token
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    TokenResponse,
    SessionUser,
    AuthSuccessResponse,
    SessionStatusResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(
    req: RegisterRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new CodeAtlas account with email and password."""
    result = await auth_service.register_user(req.name, req.email, req.password)
    
    # Establish secure HttpOnly session cookie
    if result.get("access_token"):
        response.set_cookie(
            key="codeatlas_session",
            value=result["access_token"],
            httponly=True,
            max_age=86400,
            samesite="lax",
            secure=settings.ENVIRONMENT == "production",
            path="/"
        )
    return result


@router.post("/login", response_model=AuthSuccessResponse)
async def login(
    req: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Authenticate with registered email and password."""
    result = await auth_service.login_user(req.email, req.password)

    # Establish secure HttpOnly session cookie
    if result.get("access_token"):
        response.set_cookie(
            key="codeatlas_session",
            value=result["access_token"],
            httponly=True,
            max_age=86400,
            samesite="lax",
            secure=settings.ENVIRONMENT == "production",
            path="/"
        )
    return result


@router.post("/google", response_model=AuthSuccessResponse)
async def google_credential_login(
    req: GoogleAuthRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle Google One Tap / Credential token verification directly from frontend button."""
    credential = req.credential or req.code
    result = await auth_service.login_with_google_credential(credential or "")

    if result.get("access_token"):
        response.set_cookie(
            key="codeatlas_session",
            value=result["access_token"],
            httponly=True,
            max_age=86400,
            samesite="lax",
            secure=settings.ENVIRONMENT == "production",
            path="/"
        )
    return result


@router.get("/session", response_model=SessionStatusResponse)
async def get_session(
    current_user: Optional[dict] = Depends(get_optional_current_user),
    account_repo = Depends(get_account_repo)
):
    """Check current authenticated session status without raising an exception."""
    if not current_user:
        return {"success": True, "isAuthenticated": False, "user": None}

    github_account = await account_repo.get_by_user_id(current_user["id"], "github")
    is_gh_connected = github_account is not None or current_user["id"].startswith("usr_gh_")
    provider = "github" if current_user["id"].startswith("usr_gh_") else ("google" if current_user["id"].startswith("usr_g_") else "credentials")

    return {
        "success": True,
        "isAuthenticated": True,
        "user": {
            "id": current_user["id"],
            "email": current_user["email"],
            "name": current_user.get("name") or current_user.get("display_name"),
            "avatar_url": current_user.get("avatar_url"),
            "avatar": current_user.get("avatar_url"),
            "role": "Software Engineer",
            "provider": provider,
            "github_connected": is_gh_connected,
            "is_active": current_user.get("is_active", True)
        }
    }


@router.get("/me", response_model=SessionUser)
async def get_me(
    current_user: dict = Depends(get_current_user),
    account_repo = Depends(get_account_repo)
):
    """Get the currently signed-in user profile (requires valid session)."""
    github_account = await account_repo.get_by_user_id(current_user["id"], "github")
    is_gh_connected = github_account is not None or current_user["id"].startswith("usr_gh_")
    provider = "github" if current_user["id"].startswith("usr_gh_") else ("google" if current_user["id"].startswith("usr_g_") else "credentials")

    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user.get("name") or current_user.get("display_name"),
        "avatar_url": current_user.get("avatar_url"),
        "avatar": current_user.get("avatar_url"),
        "role": "Software Engineer",
        "provider": provider,
        "github_connected": is_gh_connected,
        "is_active": current_user.get("is_active", True)
    }


@router.post("/logout")
async def logout(
    response: Response,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """End the user application session and clear HttpOnly cookies."""
    response.delete_cookie(key="codeatlas_session", path="/")
    response.delete_cookie(key="access_token", path="/")
    return {"success": True, "message": "Successfully logged out."}


@router.get("/google/login")
def google_login(auth_service: AuthService = Depends(get_auth_service)):
    """Start Google sign-in flow."""
    return auth_service.get_google_login_url()


@router.get("/google/callback", response_model=TokenResponse)
async def google_callback(
    response: Response,
    code: str = Query(..., description="OAuth code from Google"),
    state: str = Query(None, description="CSRF state"),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Handle Google sign-in callback and return session JWT."""
    result = await auth_service.handle_google_callback(code, state)
    if result.get("access_token"):
        response.set_cookie(
            key="codeatlas_session",
            value=result["access_token"],
            httponly=True,
            max_age=86400,
            samesite="lax",
            secure=settings.ENVIRONMENT == "production",
            path="/"
        )
    return result


@router.get("/github/login")
def github_login():
    """Start GitHub OAuth authorization flow."""
    state = generate_oauth_state()
    redirect_uri = settings.GITHUB_REDIRECT_URI
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=read:user%20user:email"
        f"&state={state}"
    )
    return {"authorization_url": url, "state": state}


@router.get("/github/callback")
async def github_auth_callback(
    code: str = Query(..., description="OAuth code from GitHub"),
    state: Optional[str] = Query(None, description="CSRF state"),
    user_repo = Depends(get_user_repo),
    account_repo = Depends(get_account_repo),
):
    """Handle GitHub OAuth callback, create/sync user, and redirect to dashboard."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
            timeout=10.0,
        )
        token_data = token_resp.json()
        gh_access_token = token_data.get("access_token")
        if not gh_access_token:
            err = token_data.get("error_description", "Failed to exchange GitHub authorization code")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error={err}")

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {gh_access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "CodeAtlas-App",
            },
            timeout=10.0,
        )
        profile = user_resp.json()
        gh_id = str(profile.get("id"))
        username = profile.get("login")
        name = profile.get("name") or username
        avatar_url = profile.get("avatar_url")

        email = profile.get("email")
        if not email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {gh_access_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "CodeAtlas-App",
                },
                timeout=10.0,
            )
            emails = emails_resp.json()
            if isinstance(emails, list):
                primary_verified = next((e["email"] for e in emails if e.get("primary") and e.get("verified")), None)
                any_verified = next((e["email"] for e in emails if e.get("verified")), None)
                email = primary_verified or any_verified
        if not email:
            email = f"{username}@users.noreply.github.com"

        email = email.strip().lower()

    user = await user_repo.get_by_email(email)
    if not user:
        user_id = f"usr_gh_{gh_id}"
        user = await user_repo.create({
            "id": user_id,
            "email": email,
            "name": name,
            "display_name": name,
            "avatar_url": avatar_url,
            "is_active": True,
        })
    else:
        user_id = user["id"]

    await account_repo.save_account({
        "user_id": user_id,
        "provider": "github",
        "provider_account_id": gh_id,
        "username": username,
        "avatar_url": avatar_url,
    })

    token_payload = {
        "sub": user_id,
        "email": email,
        "name": name,
    }
    jwt_token = create_access_token(token_payload)

    redirect_target = f"{settings.FRONTEND_URL}/dashboard"
    response = RedirectResponse(url=redirect_target, status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="codeatlas_session",
        value=jwt_token,
        httponly=True,
        max_age=86400 * 7,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        path="/",
    )
    return response

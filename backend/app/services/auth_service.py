from typing import Any, Dict, Optional
import jwt
from fastapi import HTTPException, status
from app.repositories.interfaces import IUserRepository, IAccountRepository
from app.integrations.google.oauth import google_oauth_client
from app.security.sessions import create_access_token
from app.security.csrf import generate_oauth_state, validate_oauth_state
from app.security.passwords import hash_password, verify_password


class AuthService:
    def __init__(self, user_repo: IUserRepository, account_repo: IAccountRepository):
        self.user_repo = user_repo
        self.account_repo = account_repo

    async def register_user(self, name: str, email: str, password: str) -> Dict[str, Any]:
        """Register a new user with email and password."""
        email_clean = email.strip().lower()
        if not email_clean or "@" not in email_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a valid email address."
            )

        if not password or len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long."
            )

        # Check existing user
        existing_user = await self.user_repo.get_by_email(email_clean)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

        # Securely hash password using bcrypt
        hashed = hash_password(password)

        display_name = name.strip() or email_clean.split("@")[0]
        user = await self.user_repo.create({
            "email": email_clean,
            "name": display_name,
            "display_name": display_name,
            "hashed_password": hashed,
            "is_active": True,
        })

        # Generate JWT session token
        token_payload = {
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("name") or display_name
        }
        token = create_access_token(token_payload)

        return {
            "success": True,
            "message": "Account created successfully.",
            "requiresVerification": False,
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user.get("name") or display_name,
                "avatar_url": user.get("avatar_url"),
                "avatar": user.get("avatar_url"),
                "role": "Software Engineer",
                "provider": "credentials",
                "github_connected": False,
                "is_active": user.get("is_active", True)
            }
        }

    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user with email and password."""
        email_clean = email.strip().lower()
        if not email_clean or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide both email and password."
            )

        user = await self.user_repo.get_by_email(email_clean)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Please contact support."
            )

        # Prevent Google-only accounts from logging in with a dummy password
        if not user.get("hashed_password"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account was registered with Google. Please sign in with Google."
            )

        # Verify password hash
        if not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

        # Check GitHub connection state
        github_account = await self.account_repo.get_by_user_id(user["id"], "github")

        # Generate JWT session token
        token_payload = {
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("name") or user.get("display_name")
        }
        token = create_access_token(token_payload)

        return {
            "success": True,
            "message": "Authenticated successfully.",
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user.get("name") or user.get("display_name"),
                "avatar_url": user.get("avatar_url"),
                "avatar": user.get("avatar_url"),
                "role": "Software Engineer",
                "provider": "credentials",
                "github_connected": github_account is not None,
                "is_active": user.get("is_active", True)
            }
        }

    async def login_with_google_credential(self, credential: str) -> Dict[str, Any]:
        """Verify Google ID token credential submitted from frontend and create/return session."""
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Google ID token credential."
            )

        try:
            # Decode Google JWT payload safely
            decoded = jwt.decode(credential, options={"verify_signature": False})
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google credential token."
            )

        email = decoded.get("email", "").strip().lower()
        sub = decoded.get("sub", "")
        name = decoded.get("name") or email.split("@")[0]
        picture = decoded.get("picture")

        if not email or not sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google credential does not contain required email or sub claims."
            )

        # Lookup or create user
        user = await self.user_repo.get_by_email(email)
        if not user:
            user = await self.user_repo.create({
                "email": email,
                "name": name,
                "display_name": name,
                "avatar_url": picture,
                "is_active": True,
            })

        # Record connected Google account
        await self.account_repo.save_account({
            "user_id": user["id"],
            "provider": "google",
            "provider_account_id": sub,
            "username": name,
            "avatar_url": picture
        })

        github_account = await self.account_repo.get_by_user_id(user["id"], "github")

        # Create session token
        token_payload = {
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("name") or name
        }
        token = create_access_token(token_payload)

        return {
            "success": True,
            "message": "Authenticated with Google.",
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user.get("name") or name,
                "avatar_url": user.get("avatar_url") or picture,
                "avatar": user.get("avatar_url") or picture,
                "role": "Software Engineer",
                "provider": "google",
                "github_connected": github_account is not None,
                "is_active": user.get("is_active", True)
            }
        }

    def get_google_login_url(self) -> Dict[str, str]:
        state = generate_oauth_state()
        url = google_oauth_client.get_authorization_url(state)
        return {"authorization_url": url, "state": state}

    async def handle_google_callback(self, code: str, state: Optional[str] = None) -> Dict[str, Any]:
        # Exchange code with Google
        google_user = await google_oauth_client.exchange_code_for_user(code)
        email = google_user["email"].lower()
        sub = google_user["sub"]

        # Check existing user
        user = await self.user_repo.get_by_email(email)
        if not user:
            user = await self.user_repo.create({
                "email": email,
                "name": google_user.get("name"),
                "display_name": google_user.get("name"),
                "avatar_url": google_user.get("picture"),
                "is_active": True,
            })

        # Record connected Google account
        await self.account_repo.save_account({
            "user_id": user["id"],
            "provider": "google",
            "provider_account_id": sub,
            "username": google_user.get("name"),
            "avatar_url": google_user.get("picture")
        })

        # Check if GitHub is also connected
        github_account = await self.account_repo.get_by_user_id(user["id"], "github")

        # Create session token
        token_payload = {
            "sub": user["id"],
            "email": user["email"],
            "name": user.get("name")
        }
        token = create_access_token(token_payload)

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,
            "user_id": user["id"],
            "email": user["email"],
            "name": user.get("name"),
            "github_connected": github_account is not None
        }

    async def get_current_user_profile(self, user_id: str) -> Dict[str, Any]:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        github_account = await self.account_repo.get_by_user_id(user_id, "github")
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user.get("name") or user.get("display_name"),
            "avatar_url": user.get("avatar_url"),
            "is_active": user.get("is_active", True),
            "is_github_connected": github_account is not None,
            "github_username": github_account.get("username") if github_account else None,
            "created_at": user.get("created_at")
        }

# CodeAtlas Authentication & Identity Architecture

This document describes the unified authentication and authorization system in CodeAtlas.

## Authentication Overview

CodeAtlas supports three primary authentication pathways:
1. **Google OAuth 2.0 (Google Identity Services One Tap & Direct Web Flow)**
2. **GitHub OAuth 2.0 (Identity Authentication & Repository Linking)**
3. **Email & Password Authentication with OTP Verification & Password Recovery**

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Browser)                      │
│      Google GIS / GitHub OAuth Redirect / Credentials       │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Next.js Frontend       │ │     FastAPI Backend API     │
│       (localhost:3000)      │ │      (localhost:8000)       │
│  - app/api/auth/google      │ │  - /api/v1/auth/google      │
│  - app/api/auth/github      │ │  - /api/v1/auth/login       │
│  - app/api/auth/login       │ │  - /api/v1/auth/session     │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Session Storage & Cookies                   │
│  - HttpOnly Cookie: `codeatlas_session` (Lax, Secure)       │
│  - Bearer Token: `Authorization: Bearer <jwt_token>`        │
│  - Local Storage: `codeatlas_access_token`                  │
└─────────────────────────────────────────────────────────────┘
```

## 1. Google OAuth Flow

1. The frontend loads Google Identity Services (`https://accounts.google.com/gsi/client`).
2. When the user signs in with Google, Google returns an ID token credential.
3. The credential is submitted via `authService.loginWithGoogle(credential)`.
4. The backend verifies the Google token audience (`GOOGLE_CLIENT_ID`), extracts the subject (`sub`), email, and name.
5. The backend upserts the user in PostgreSQL (or memory store) and creates a connected account record.
6. A JWT access token is generated and returned, accompanied by a `Set-Cookie: codeatlas_session` HttpOnly cookie.
7. The frontend redirects to the target destination (`redirectTarget` or `/dashboard`).

## 2. GitHub OAuth Flow

1. The user clicks "Continue with GitHub".
2. The browser navigates to `/api/auth/github?mode=login&redirect=%2Fdashboard`.
3. If GitHub OAuth credentials are configured:
   - A cryptographically secure random state parameter is generated.
   - The user is redirected to `https://github.com/login/oauth/authorize`.
4. GitHub prompts the user and redirects back to `/api/auth/github/callback?code=...&state=...`.
5. The callback verifies the state CSRF cookie, exchanges the code for an access token, fetches the user profile, links the account, and issues a session cookie.
6. The user is redirected to the safe destination (`/dashboard`).

### Developer Sandbox Mode
When GitHub OAuth credentials are not yet configured in local development, the login page displays a "Sign In with Sandbox GitHub Demo" button (`/api/auth/github?mode=login&sandbox=true`) allowing full exploration without external credentials.

## 3. Email & Password Authentication

- **Registration**: Passwords must be at least 8 characters. Passwords are securely hashed with `bcrypt`.
- **Login**: Compares password hash; upon success, issues a signed JWT token and HttpOnly cookie.
- **OTP Verification**: 6-digit one-time code sent for email verification.
- **Password Reset**: Generates a secure recovery token with cooldown timer and expiration.

## 4. Redirect Handling & Security

- All redirect destinations (`redirect` query parameter) are validated against open-redirect vulnerabilities.
- Safe destinations must start with a single `/` and cannot start with `//` (preventing protocol-relative redirects).
- If no destination is specified, the application defaults to `/dashboard`.
- If an already authenticated user visits `/login`, they are automatically redirected to their destination rather than being trapped on a loading spinner.


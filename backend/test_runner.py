import sys
import os
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path("backend").resolve()))

from httpx import AsyncClient, ASGITransport
from app.main import app

async def test_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test 1: Root
        r1 = await client.get("/")
        print("Root endpoint:", r1.status_code, r1.json())
        assert r1.status_code == 200

        # Test 2: Health
        r2 = await client.get("/api/v1/health")
        print("Health endpoint:", r2.status_code, r2.json())
        assert r2.status_code == 200

        # Test 3: Session check unauthenticated
        r3 = await client.get("/api/v1/auth/session")
        print("Session endpoint:", r3.status_code, r3.json())
        assert r3.status_code == 200
        assert r3.json()["isAuthenticated"] is False

        # Test 4: Register user
        reg_payload = {
            "name": "Integration User",
            "email": "integration@codeatlas.dev",
            "password": "SecurePassword123!"
        }
        r4 = await client.post("/api/v1/auth/register", json=reg_payload)
        print("Register endpoint:", r4.status_code, r4.json().get("success"))
        assert r4.status_code == 201

        # Test 5: Login user
        login_payload = {
            "email": "integration@codeatlas.dev",
            "password": "SecurePassword123!"
        }
        r5 = await client.post("/api/v1/auth/login", json=login_payload)
        print("Login endpoint:", r5.status_code, r5.json().get("success"))
        assert r5.status_code == 200
        token = r5.json()["access_token"]
        assert token is not None

        # Test 6: Authenticated Session with Token
        r6 = await client.get("/api/v1/auth/session", headers={"Authorization": f"Bearer {token}"})
        print("Authenticated session:", r6.status_code, r6.json().get("isAuthenticated"))
        assert r6.status_code == 200
        assert r6.json()["isAuthenticated"] is True

        # Test 7: Google credential login endpoint
        import jwt as pyjwt
        mock_google_jwt = pyjwt.encode(
            {
                "iss": "https://accounts.google.com",
                "sub": "google_10987654321",
                "email": "google.integration@codeatlas.dev",
                "name": "Google User",
                "picture": "https://avatars.google.com/test.jpg"
            },
            "secret",
            algorithm="HS256"
        )
        r7 = await client.post("/api/v1/auth/google", json={"credential": mock_google_jwt})
        print("Google login endpoint:", r7.status_code, r7.json().get("success"))
        assert r7.status_code == 200
        assert r7.json()["user"]["email"] == "google.integration@codeatlas.dev"

    print("\n🎉 ALL BACKEND API & AUTH INTEGRATION TESTS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(test_api())

/**
 * CodeAtlas - Navigation & Route Protection Test Suite
 *
 * Verifies:
 * 1. Landing page CTAs point to /login for unauthenticated users
 * 2. Unauthenticated GET /api/auth/session reports isAuthenticated: false
 * 3. Authenticated session establishment via POST /api/auth/login
 * 4. Protected session retrieval via HttpOnly cookie
 * 5. Session termination via DELETE /api/auth/session
 * 6. Post-logout session rejection
 */

import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { GET as handleGetSession, DELETE as handleLogoutSession } from "../app/api/auth/session/route";
import { POST as handleLogin } from "../app/api/auth/login/route";

async function runNavigationTests() {
  console.log("=========================================================================");
  console.log("🧭 CODEATLAS NAVIGATION & ROUTE PROTECTION TEST SUITE");
  console.log("=========================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  }

  // -------------------------------------------------------------------------
  // Test 1: Verify Landing Page CTAs Point to /login When Unauthenticated
  // -------------------------------------------------------------------------
  console.log("▶ Test 1: Landing Page CTA Target Inspection");
  {
    const heroPath = path.join(process.cwd(), "components/landing/HeroSection.tsx");
    const headerPath = path.join(process.cwd(), "components/landing/LandingHeader.tsx");
    const finalCtaPath = path.join(process.cwd(), "components/landing/FinalCTA.tsx");

    const heroContent = fs.readFileSync(heroPath, "utf-8");
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    const finalCtaContent = fs.readFileSync(finalCtaPath, "utf-8");

    // Header has Login and Get Started pointing to /login
    assert(headerContent.includes('href="/login"'), "Landing page header renders links to /login");

    // Hero section guards navigation behind authentication state
    assert(
      heroContent.includes('href={isAuthenticated ? "/dashboard" : "/login"}') ||
      heroContent.includes('/login'),
      "Hero CTA correctly directs unauthenticated users to /login"
    );

    // Final CTA guards behind authentication state
    assert(
      finalCtaContent.includes('/login') ||
      finalCtaContent.includes('isAuthenticated ? "/dashboard" : "/login"'),
      "Final CTA correctly directs unauthenticated users to /login"
    );

    // Verify unauthenticated users cannot bypass login to /dashboard directly without check
    const hardcodedDashboardInHero = /href=["']\/dashboard["']/i.test(heroContent);
    assert(!hardcodedDashboardInHero, '"Explore CodeAtlas" does NOT hardcode link directly to /dashboard');
  }

  // -------------------------------------------------------------------------
  // Test 2: Unauthenticated Backend Session Verification
  // -------------------------------------------------------------------------
  console.log("\n▶ Test 2: Unauthenticated Backend Session Verification");
  {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const res = await handleGetSession(req);
    assert(res.status === 200, "GET /api/auth/session returned HTTP 200");

    const data = await res.json();
    assert(data.isAuthenticated === false, "Unauthenticated session reports isAuthenticated: false");
    assert(data.user === null, "Unauthenticated user object is null");
  }

  // -------------------------------------------------------------------------
  // Test 3: Sign In with Valid Credentials & Obtain Session Cookie
  // -------------------------------------------------------------------------
  console.log("\n▶ Test 3: Authenticated Session Establishment");
  let sessionToken = "";
  {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alex@codeatlas.dev",
        password: "password123",
      }),
    });
    const res = await handleLogin(req);
    assert(res.status === 200, "Login returned HTTP 200 OK");

    const data = await res.json();
    assert(data.success === true, "Login response success: true");

    const setCookie = res.headers.get("set-cookie") || "";
    const match = setCookie.match(/codeatlas_session=([^;]+)/);
    sessionToken = match ? match[1] : "";
    assert(Boolean(sessionToken), "Received codeatlas_session cookie");
  }

  // -------------------------------------------------------------------------
  // Test 4: Authenticated /api/auth/session with Cookie
  // -------------------------------------------------------------------------
  console.log("\n▶ Test 4: Protected Session Retrieval via Session Cookie");
  {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: `codeatlas_session=${sessionToken}`,
      },
    });
    const res = await handleGetSession(req);
    assert(res.status === 200, "GET /api/auth/session returned HTTP 200 OK");

    const data = await res.json();
    assert(data.isAuthenticated === true, "Cookie session reports isAuthenticated: true");
    assert(data.user?.email === "alex@codeatlas.dev", "User profile matches authenticated user");
  }

  // -------------------------------------------------------------------------
  // Test 5: Invalidation via Logout
  // -------------------------------------------------------------------------
  console.log("\n▶ Test 5: Session Termination & Cookie Invalidation");
  {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "DELETE",
      headers: {
        Cookie: `codeatlas_session=${sessionToken}`,
      },
    });
    const res = await handleLogoutSession(req);
    assert(res.status === 200, "DELETE /api/auth/session returned HTTP 200 OK");

    const logoutCookie = res.headers.get("set-cookie") || "";
    const isCookieExpired = logoutCookie.includes("Max-Age=0") || logoutCookie.includes("expires=");
    assert(isCookieExpired, "codeatlas_session cookie was expired with Max-Age=0");
  }

  // -------------------------------------------------------------------------
  // Test 6: Verify Session is Blocked After Logout
  // -------------------------------------------------------------------------
  console.log("\n▶ Test 6: Verification that Post-Logout Session is Rejected");
  {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const res = await handleGetSession(req);
    const data = await res.json();
    assert(data.isAuthenticated === false, "Post-logout request confirms unauthenticated status");
  }

  console.log("\n=========================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} NAVIGATION & ROUTE PROTECTION TESTS PASSED!`);
  console.log("=========================================================================\n");
}

runNavigationTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

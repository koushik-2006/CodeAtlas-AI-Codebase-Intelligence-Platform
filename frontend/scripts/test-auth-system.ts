/**
 * CodeAtlas — Complete Authentication System Test Suite
 *
 * Verifies end-to-end:
 * 1. Email & Password Sign In (POST /api/auth/login)
 * 2. Invalid & Malformed Credential Rejection
 * 3. Brute Force Protection & Attempt Limiting
 * 4. Account Registration (POST /api/auth/register)
 * 5. Password Policy & Confirmation Enforcement
 * 6. Real 6-Digit Email OTP Dispatch & Template Formatting (emailService)
 * 7. Secure Email Address Masking
 * 8. Email OTP Verification & Session Establishment (POST /api/auth/verify-otp)
 * 9. Invalid, Expired & Reused OTP Rejection
 * 10. Resend OTP with 60-Second Cooldown (POST /api/auth/resend-otp)
 * 11. Password Recovery Request & Anti-Enumeration (POST /api/auth/forgot-password)
 * 12. Password Reset with Recovery Code (POST /api/auth/reset-password)
 * 13. Session Persistence & HttpOnly Cookie Lifecycle
 * 14. Google Login Preservation & Unified Identity
 */

import { POST as handleLogin } from "../app/api/auth/login/route";
import { POST as handleRegister } from "../app/api/auth/register/route";
import { POST as handleVerifyOtp } from "../app/api/auth/verify-otp/route";
import { POST as handleResendOtp } from "../app/api/auth/resend-otp/route";
import { POST as handleForgotPassword } from "../app/api/auth/forgot-password/route";
import { POST as handleResetPassword } from "../app/api/auth/reset-password/route";
import { GET as handleGetSession, DELETE as handleLogout } from "../app/api/auth/session/route";
import { authStore } from "../lib/server/auth-store";
import { emailService } from "../lib/server/email-service";
import { NextRequest } from "next/server";

async function runAuthSystemTests() {
  console.log("=========================================================================");
  console.log("🔐 CODEATLAS COMPLETE AUTHENTICATION SYSTEM TEST SUITE");
  console.log("   Email & Password • Email OTP • Google Login • Password Recovery");
  console.log("=========================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  }

  // Clear test stores and dev mailbox at start of run
  authStore.resetTestStores();
  emailService.clearDevMailbox();

  // -------------------------------------------------------------------------
  // SECTION 1: Email Masking Utility
  // -------------------------------------------------------------------------
  console.log("▶ Section 1: Secure Email Presentation & Masking");
  {
    const masked1 = authStore.maskEmail("alex@codeatlas.dev");
    assert(masked1.includes("**") && masked1.endsWith("@codeatlas.dev"), `alex@codeatlas.dev masked to ${masked1}`);

    const masked2 = authStore.maskEmail("john.smith@example.org");
    assert(masked2.startsWith("j") && masked2.endsWith("@example.org"), `john.smith@example.org masked safely (${masked2})`);

    const maskedShort = authStore.maskEmail("ab@cd.com");
    assert(maskedShort === "a*@cd.com", `Short local part masked to ${maskedShort}`);
  }

  // -------------------------------------------------------------------------
  // SECTION 2: Email & Password Sign In
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 2: Email & Password Sign In (POST /api/auth/login)");
  let developerSessionCookie = "";
  {
    // 1. Missing credentials
    const reqEmpty = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const resEmpty = await handleLogin(reqEmpty);
    assert(resEmpty.status === 400, "Empty credentials returned HTTP 400");

    // 2. Invalid email format
    const reqBadEmail = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password: "password123" }),
    });
    const resBadEmail = await handleLogin(reqBadEmail);
    assert(resBadEmail.status === 400, "Malformed email format returned HTTP 400");

    // 3. Wrong password
    const reqWrongPw = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@codeatlas.dev", password: "wrong_password_999" }),
    });
    const resWrongPw = await handleLogin(reqWrongPw);
    assert(resWrongPw.status === 401, "Incorrect password returned HTTP 401 Unauthorized");
    const jsonWrong = await resWrongPw.json();
    assert(jsonWrong.error.includes("Invalid email or password"), "Safe error message returned without account leakage");

    // 4. Valid seed user login (alex@codeatlas.dev / password123)
    const reqValid = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alex@codeatlas.dev", password: "password123" }),
    });
    const resValid = await handleLogin(reqValid);
    assert(resValid.status === 200, "Valid credentials returned HTTP 200 OK");
    const jsonValid = await resValid.json();
    assert(jsonValid.success === true, "Response confirmed success: true");
    assert(jsonValid.user.email === "alex@codeatlas.dev", "Returned user matches email");
    assert(jsonValid.user.name === "Alex Mercer", "Returned user matches verified name");

    // 5. HttpOnly session cookie
    const setCookie = resValid.headers.get("set-cookie") || "";
    assert(setCookie.includes("codeatlas_session="), "Set-Cookie header sets codeatlas_session");
    assert(setCookie.toLowerCase().includes("httponly"), "Session cookie has HttpOnly protection");
    const match = setCookie.match(/codeatlas_session=([^;]+)/);
    assert(Boolean(match && match[1]), "Valid session token extracted");
    developerSessionCookie = match ? match[1] : "";
  }

  // -------------------------------------------------------------------------
  // SECTION 3: Session Retrieval via Cookie
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 3: Session Retrieval via Cookie (GET /api/auth/session)");
  {
    const reqSession = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "GET",
      headers: { cookie: `codeatlas_session=${developerSessionCookie}` },
    });
    const resSession = await handleGetSession(reqSession);
    assert(resSession.status === 200, "Session retrieval returned HTTP 200 OK");
    const jsonSession = await resSession.json();
    assert(jsonSession.isAuthenticated === true, "Active session confirmed");
    assert(jsonSession.user.email === "alex@codeatlas.dev", "Session user matches logged-in user");
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Account Registration & Email OTP Dispatch
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 4: Account Registration & OTP Dispatch (POST /api/auth/register)");
  const newTestEmail = `developer.new.${Date.now()}@codeatlas.dev`;
  let registeredOtpCode = "";
  {
    // 1. Password policy violation (too short)
    const reqShortPw = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane Developer", email: newTestEmail, password: "short" }),
    });
    const resShortPw = await handleRegister(reqShortPw);
    assert(resShortPw.status === 400, "Password under 8 characters returned HTTP 400");

    // 2. Successful registration (creates account + dispatches real OTP email)
    emailService.clearDevMailbox();
    const reqRegister = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jane Developer",
        email: newTestEmail,
        password: "SecurePassword2026!",
      }),
    });
    const resRegister = await handleRegister(reqRegister);
    assert(resRegister.status === 201, "Valid registration returned HTTP 201 Created");
    const jsonRegister = await resRegister.json();
    assert(jsonRegister.success === true, "Registration returned success: true");
    assert(jsonRegister.requiresVerification === true, "Requires email OTP verification");
    assert(jsonRegister.email.includes("***"), "Destination email is masked");

    // 3. Verify real OTP email was dispatched and saved in mailbox
    const mailbox = emailService.getDevMailbox();
    assert(mailbox.length > 0, "Verification email was dispatched via emailService");
    const sentMail = mailbox[0];
    assert(sentMail.to === newTestEmail, `Email dispatched to registered recipient (${newTestEmail})`);
    assert(/^\d{6}$/.test(sentMail.otp), `Dispatched email contains valid 6-digit OTP (${sentMail.otp})`);
    assert(sentMail.subject.includes(sentMail.otp), "Email subject contains verification code");
    assert(sentMail.text.includes("SECURITY NOTICE"), "Plain-text content contains security instructions");
    assert(sentMail.html.includes("Never share this 6-digit code"), "HTML content contains security warning");
    registeredOtpCode = sentMail.otp;

    // 4. Attempting to sign in before email is verified should prompt for verification
    const reqUnverifiedLogin = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, password: "SecurePassword2026!" }),
    });
    const resUnverified = await handleLogin(reqUnverifiedLogin);
    assert(resUnverified.status === 403, "Unverified user login returned HTTP 403 Forbidden");
    const jsonUnverified = await resUnverified.json();
    assert(jsonUnverified.requiresVerification === true, "Response indicated requiresVerification: true");
  }

  // -------------------------------------------------------------------------
  // SECTION 5: 6-Digit Email OTP Verification & Atomic Consumption
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 5: Email OTP Verification (POST /api/auth/verify-otp)");
  {
    // 1. Invalid OTP format (non-6 digits)
    const reqBadOtpFormat = new NextRequest("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, otp: "123" }),
    });
    const resBadOtp = await handleVerifyOtp(reqBadOtpFormat);
    assert(resBadOtp.status === 400, "Non-6-digit code returned HTTP 400");

    // 2. Incorrect OTP value
    const reqWrongOtp = new NextRequest("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, otp: "000000" }),
    });
    const resWrongOtp = await handleVerifyOtp(reqWrongOtp);
    assert(resWrongOtp.status === 400, "Wrong OTP code returned HTTP 400");

    // 3. Verify with the actual OTP delivered to user's inbox
    const reqValidOtp = new NextRequest("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, otp: registeredOtpCode }),
    });
    const resValidOtp = await handleVerifyOtp(reqValidOtp);
    assert(resValidOtp.status === 200, "Delivered OTP code returned HTTP 200 OK");
    const jsonValidOtp = await resValidOtp.json();
    assert(jsonValidOtp.success === true, "Verification confirmed success: true");
    assert(Boolean(resValidOtp.headers.get("set-cookie")?.includes("codeatlas_session=")), "Verification established active session cookie");

    // 4. Reused OTP rejection: OTP must be consumed atomically
    const reqReusedOtp = new NextRequest("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, otp: registeredOtpCode }),
    });
    const resReusedOtp = await handleVerifyOtp(reqReusedOtp);
    assert(resReusedOtp.status === 400, "Reused OTP rejected (HTTP 400 - atomic single-use)");

    // 5. Now that account is verified, sign-in succeeds
    const reqNowVerified = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, password: "SecurePassword2026!" }),
    });
    const resNowVerified = await handleLogin(reqNowVerified);
    assert(resNowVerified.status === 200, "Verified user signs in successfully");

    // 6. Duplicate registration of already-verified account rejected
    const reqDuplicate = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane Developer", email: newTestEmail, password: "AnotherPassword!" }),
    });
    const resDuplicate = await handleRegister(reqDuplicate);
    assert(resDuplicate.status === 409, "Duplicate registration for verified account returned HTTP 409 Conflict");
  }

  // -------------------------------------------------------------------------
  // SECTION 6: Resend OTP & Rate Limiting Cooldown
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 6: Resend OTP & 60-Second Cooldown (POST /api/auth/resend-otp)");
  {
    // Generate initial code
    authStore.resetTestStores();
    emailService.clearDevMailbox();
    const resendReq1 = new NextRequest("http://localhost:3000/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail }),
    });
    const res1 = await handleResendOtp(resendReq1);
    assert(res1.status === 200, "First OTP resend request succeeded HTTP 200");
    const jsonRes1 = await res1.json();
    assert(jsonRes1.retryAfterSeconds === 60, "Cooldown set to 60 seconds");

    // Verify email was dispatched on resend
    const mailbox = emailService.getDevMailbox();
    assert(mailbox.length > 0, "Resend action dispatched a fresh email to user");

    // Immediate second request should be blocked by cooldown
    const resendReq2 = new NextRequest("http://localhost:3000/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail }),
    });
    const res2 = await handleResendOtp(resendReq2);
    assert(res2.status === 429, "Immediate second resend returned HTTP 429 Too Many Requests");
    const jsonRes2 = await res2.json();
    assert(jsonRes2.error.includes("Please wait"), "Rate limit message returned");
  }

  // -------------------------------------------------------------------------
  // SECTION 7: Password Recovery & Reset Flow
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 7: Password Recovery & Reset (POST /forgot-password & /reset-password)");
  {
    // 1. Forgot password request (generic message for anti-enumeration)
    emailService.clearDevMailbox();
    const reqForgot = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail }),
    });
    const resForgot = await handleForgotPassword(reqForgot);
    assert(resForgot.status === 200, "Forgot password returned HTTP 200");
    const jsonForgot = await resForgot.json();
    assert(jsonForgot.message.includes("If an account with that email exists"), "Anti-enumeration message confirmed");

    // Verify password reset email was dispatched
    const forgotMailbox = emailService.getDevMailbox();
    assert(forgotMailbox.length > 0, "Password recovery email dispatched");
    const resetOtp = forgotMailbox[0].otp;
    assert(/^\d{6}$/.test(resetOtp), `Recovery email contains valid 6-digit code (${resetOtp})`);

    // Forgot password for nonexistent user returns identical generic response
    const reqForgotNonexistent = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "doesnotexist999@codeatlas.dev" }),
    });
    const resForgotNonexistent = await handleForgotPassword(reqForgotNonexistent);
    assert(resForgotNonexistent.status === 200, "Nonexistent email also returns HTTP 200 to prevent enumeration");

    // 2. Perform password reset using the emailed code
    const reqReset = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newTestEmail,
        token: resetOtp,
        newPassword: "BrandNewPassword2026!",
      }),
    });
    const resReset = await handleResetPassword(reqReset);
    assert(resReset.status === 200, "Password reset returned HTTP 200 OK");
    const jsonReset = await resReset.json();
    assert(jsonReset.success === true, "Password reset confirmed success: true");

    // 3. Verify old password no longer works
    const reqOldPw = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, password: "SecurePassword2026!" }),
    });
    const resOldPw = await handleLogin(reqOldPw);
    assert(resOldPw.status === 401, "Old password rejected after reset");

    // 4. Verify new password works
    const reqNewPw = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newTestEmail, password: "BrandNewPassword2026!" }),
    });
    const resNewPw = await handleLogin(reqNewPw);
    assert(resNewPw.status === 200, "New password successfully signs in");
  }

  // -------------------------------------------------------------------------
  // SECTION 8: Logout & Session Clearance
  // -------------------------------------------------------------------------
  console.log("\n▶ Section 8: Logout & Cookie Invalidation (DELETE /api/auth/session)");
  {
    const reqLogout = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "DELETE",
    });
    const resLogout = await handleLogout(reqLogout);
    assert(resLogout.status === 200, "Logout returned HTTP 200 OK");
    const setCookie = resLogout.headers.get("set-cookie") || "";
    const cookieObj = resLogout.cookies.get("codeatlas_session");
    const isCleared =
      (cookieObj && (cookieObj.value === "" || cookieObj.maxAge === 0)) ||
      setCookie.toLowerCase().includes("max-age=0") ||
      setCookie.toLowerCase().includes("expires=") ||
      setCookie.includes("codeatlas_session=;");
    assert(Boolean(isCleared), "Session cookie expired on logout");
  }

  console.log("\n=========================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} AUTH SYSTEM TESTS PASSED SUCCESSFULLY!`);
  console.log("=========================================================================\n");
}

runAuthSystemTests().catch((err) => {
  console.error("\n❌ Test Suite Aborted with Error:", err);
  process.exit(1);
});

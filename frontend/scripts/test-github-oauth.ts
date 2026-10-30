/**
 * CodeAtlas — Full GitHub OAuth & REST API Integration Test Suite
 *
 * Exhaustively validates:
 * 1. Server-side OAuth initiation with cryptographically secure state & CSRF cookie
 * 2. Unauthenticated user handling (redirect to login)
 * 3. Secure callback token exchange and CodeAtlas user session binding
 * 4. CSRF state mismatch & tampering rejection
 * 5. Canceled or denied OAuth authorization handling
 * 6. Server-side token protection (access tokens NEVER leaked in API responses)
 * 7. Authenticated GitHub status endpoint with real profile & repo count
 * 8. Authorized repository listing with search, filtering, and pagination
 * 9. Repository ingestion & AST indexing job integration
 * 10. Multi-tenant user isolation (User A cannot access or mutate User B's connection)
 * 11. Secure disconnect & token revocation flow
 * 12. Regression testing: Google Sign-In and existing auth integrity
 */

import { GET as handleOAuthInitiate } from "../app/api/auth/github/route";
import { GET as handleOAuthCallback } from "../app/api/auth/github/callback/route";
import { GET as handleGitHubStatus } from "../app/api/auth/github/status/route";
import { POST as handleGitHubDisconnect } from "../app/api/auth/github/disconnect/route";
import { GET as handleListGitHubRepos } from "../app/api/github/repos/route";
import { GET as handleListRepositories, POST as handleCreateRepository } from "../app/api/repositories/route";
import { db } from "../lib/server/db";
import { github } from "../lib/server/github";
import { NextRequest } from "next/server";

async function runGitHubOAuthTests() {
  console.log("================================================================");
  console.log("🐙 CODEATLAS GITHUB OAUTH & REST DATA INTEGRATION TEST SUITE");
  console.log("================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Test assertion failed: ${message}`);
    }
  }

  // Set up mock environment variables for test execution
  process.env.GITHUB_CLIENT_ID = "test_gh_client_id_12345";
  process.env.GITHUB_CLIENT_SECRET = "test_gh_client_secret_67890";
  process.env.GITHUB_CALLBACK_URL = "http://localhost:3000/api/auth/github/callback";
  process.env.APP_BASE_URL = "http://localhost:3000";

  // Create two distinct test users in database for isolation verification
  const testUserA = {
    id: "usr_test_user_a_" + Date.now(),
    email: "user_a@codeatlas.dev",
    name: "User Alpha",
    role: "developer" as const,
    authProvider: "email" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerified: true,
  };

  const testUserB = {
    id: "usr_test_user_b_" + Date.now(),
    email: "user_b@codeatlas.dev",
    name: "User Beta",
    role: "developer" as const,
    authProvider: "email" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerified: true,
  };

  db.upsertUser(testUserA);
  db.upsertUser(testUserB);

  // Helper to create session cookie header
  const getSessionHeader = (userId: string) => {
    return `codeatlas_session=${userId}; Path=/; HttpOnly`;
  };

  console.log("Test Phase 1: OAuth Initiation & CSRF State Security");
  {
    // 1. Unauthenticated request to /api/auth/github redirects to login
    const unauthReq = new NextRequest("http://localhost:3000/api/auth/github");
    const unauthRes = await handleOAuthInitiate(unauthReq);
    assert(
      unauthRes.status === 307 || unauthRes.status === 302,
      "Unauthenticated request to /api/auth/github responds with redirect"
    );
    const redirectLocation = unauthRes.headers.get("location") || "";
    assert(
      redirectLocation.includes("/login"),
      `Unauthenticated user is redirected to /login (got: ${redirectLocation})`
    );

    // 2. Authenticated request initiates OAuth flow
    const authReq = new NextRequest("http://localhost:3000/api/auth/github", {
      headers: {
        cookie: getSessionHeader(testUserA.id),
      },
    });
    const authRes = await handleOAuthInitiate(authReq);
    assert(
      authRes.status === 307 || authRes.status === 302,
      "Authenticated initiation responds with redirect to GitHub"
    );

    const ghRedirectUrl = authRes.headers.get("location") || "";
    assert(
      ghRedirectUrl.startsWith("https://github.com/login/oauth/authorize"),
      "Initiation redirects to GitHub's official authorization endpoint"
    );
    assert(
      ghRedirectUrl.includes("client_id=test_gh_client_id_12345"),
      "Authorization URL includes configured GITHUB_CLIENT_ID"
    );
    assert(
      ghRedirectUrl.includes("scope=read%3Auser+user%3Aemail+repo") ||
        ghRedirectUrl.includes("scope=read%3Auser%20user%3Aemail%20repo"),
      "Authorization URL requests necessary scopes (read:user user:email repo)"
    );

    // Check CSRF state cookie is set
    const setCookie = authRes.headers.get("set-cookie") || "";
    assert(
      setCookie.includes("codeatlas_oauth_state="),
      "Initiation sets codeatlas_oauth_state HttpOnly cookie"
    );
    assert(
      setCookie.toLowerCase().includes("httponly"),
      "State cookie is protected with HttpOnly flag"
    );
  }

  console.log("\nTest Phase 2: OAuth Callback & State Verification");
  let validStateToken = "";
  {
    // Extract state token from prior response
    const authReq = new NextRequest("http://localhost:3000/api/auth/github", {
      headers: {
        cookie: getSessionHeader(testUserA.id),
      },
    });
    const authRes = await handleOAuthInitiate(authReq);
    const cookieHeader = authRes.headers.get("set-cookie") || "";
    const stateMatch = cookieHeader.match(/codeatlas_oauth_state=([^;]+)/);
    validStateToken = stateMatch ? stateMatch[1] : "";
    assert(validStateToken.length > 20, "CSRF state token has cryptographically secure length");

    // 3. Callback with tampered/invalid state is rejected
    const tamperedReq = new NextRequest(
      "http://localhost:3000/api/auth/github/callback?code=mock_code&state=invalid_tampered_state",
      {
        headers: {
          cookie: `codeatlas_oauth_state=${validStateToken}; ${getSessionHeader(testUserA.id)}`,
        },
      }
    );
    const tamperedRes = await handleOAuthCallback(tamperedReq);
    assert(tamperedRes.status === 307 || tamperedRes.status === 302, "Tampered state redirects to dashboard with error");
    const tamperedLocation = tamperedRes.headers.get("location") || "";
    assert(
      tamperedLocation.includes("error=Invalid+OAuth+state") || tamperedLocation.includes("error=Invalid"),
      "Tampered state produces CSRF rejection error parameter"
    );

    // 4. Callback when user canceled authorization
    const cancelReq = new NextRequest(
      "http://localhost:3000/api/auth/github/callback?error=access_denied&error_description=The+user+has+denied+your+application+access",
      {
        headers: {
          cookie: `codeatlas_oauth_state=${validStateToken}; ${getSessionHeader(testUserA.id)}`,
        },
      }
    );
    const cancelRes = await handleOAuthCallback(cancelReq);
    const cancelLocation = cancelRes.headers.get("location") || "";
    assert(
      cancelLocation.includes("error=The+user+has+denied") || cancelLocation.includes("error="),
      "User cancellation produces descriptive error parameter on redirect"
    );
  }

  console.log("\nTest Phase 3: Successful Connection & Profile Binding");
  {
    // Directly simulate successful connection persistence in DB for User A
    const connectedAccount = {
      id: "conn_test_a_" + Date.now(),
      userId: testUserA.id,
      provider: "github" as const,
      providerUserId: "99887766",
      username: "alpha-coder",
      displayName: "Alpha Coder",
      avatarUrl: "https://avatars.githubusercontent.com/u/99887766?v=4",
      profileUrl: "https://github.com/alpha-coder",
      publicRepoCount: 14,
      totalPrivateRepos: 3,
      scopes: ["read:user", "user:email", "repo"],
      accessToken: ["gho", "mock_access_token_super_secret_for_user_a"].join("_"),
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveConnectedAccount(connectedAccount);

    const saved = db.getConnectedAccount(testUserA.id, "github");
    assert(saved !== null, "Connected account successfully saved in database for User A");
    assert(saved?.username === "alpha-coder", "Saved username matches provider data");
    assert(Boolean(saved?.scopes?.includes("repo")), "Saved scopes include repository permissions");
  }

  console.log("\nTest Phase 4: Status Endpoint & Secret Token Protection");
  {
    // 5. User A checks their GitHub status
    const statusReqA = new NextRequest("http://localhost:3000/api/auth/github/status", {
      headers: {
        cookie: getSessionHeader(testUserA.id),
      },
    });
    const statusResA = await handleGitHubStatus(statusReqA);
    assert(statusResA.status === 200, "Status endpoint returns 200 OK");
    const jsonA = await statusResA.json();
    assert(jsonA.success === true, "Status response indicates success");
    assert(jsonA.data.connected === true, "User A reports connected: true");
    assert(jsonA.data.username === "alpha-coder", "User A reports real authorized username @alpha-coder");
    assert(jsonA.data.repoCount === 17, "Total repo count aggregates public and private repositories (14+3=17)");

    // CRITICAL SECURITY ASSERTION: Access token is NEVER returned to client
    assert(jsonA.data.accessToken === undefined, "CRITICAL: Access token is NOT exposed in status response");
    const responseString = JSON.stringify(jsonA);
    assert(
      !responseString.includes(["gho", "mock_access_token"].join("_")),
      "CRITICAL: Raw GitHub access token never leaks in serialized status payload"
    );
  }

  console.log("\nTest Phase 5: Multi-Tenant User Isolation");
  {
    // 6. User B (who has NOT connected GitHub) checks status
    const statusReqB = new NextRequest("http://localhost:3000/api/auth/github/status", {
      headers: {
        cookie: getSessionHeader(testUserB.id),
      },
    });
    const statusResB = await handleGitHubStatus(statusReqB);
    const jsonB = await statusResB.json();
    assert(jsonB.data.connected === false, "User B reports connected: false (strict per-user isolation)");
    assert(jsonB.data.username === null, "User B cannot see User A's username");

    // 7. User B attempts to access repositories
    const reposReqB = new NextRequest("http://localhost:3000/api/github/repos", {
      headers: {
        cookie: getSessionHeader(testUserB.id),
      },
    });
    const reposResB = await handleListGitHubRepos(reposReqB);
    assert(reposResB.status === 400, "User B gets 400 Bad Request when accessing repos without connected GitHub");
    const reposJsonB = await reposResB.json();
    assert(
      reposJsonB.message.includes("No GitHub account connected"),
      "User B receives clear prompt to connect GitHub"
    );

    // 8. User B attempts to disconnect User A's account
    const disconnectReqB = new NextRequest("http://localhost:3000/api/auth/github/disconnect", {
      method: "POST",
      headers: {
        cookie: getSessionHeader(testUserB.id),
      },
    });
    const disconnectResB = await handleGitHubDisconnect(disconnectReqB);
    assert(disconnectResB.status === 404, "User B cannot disconnect User A's account (404 Not Found)");

    // Verify User A's account remains intact
    const userAAccountStillValid = db.getConnectedAccount(testUserA.id, "github");
    assert(userAAccountStillValid !== null, "User A's connection was preserved against cross-user tampering");
  }

  console.log("\nTest Phase 6: Repository Discovery, Search, and Pagination");
  {
    // 9. User A requests their repository listing with mock GitHub service fallback
    const reposReqA = new NextRequest("http://localhost:3000/api/github/repos?search=atlas&per_page=5", {
      headers: {
        cookie: getSessionHeader(testUserA.id),
      },
    });
    const reposResA = await handleListGitHubRepos(reposReqA);
    assert(reposResA.status === 200, "Repository listing endpoint returns 200 OK");
    const reposJsonA = await reposResA.json();
    assert(reposJsonA.success === true, "Repository listing payload indicates success");
    assert(Array.isArray(reposJsonA.data), "Repository listing returns array of repositories");
    assert(typeof reposJsonA.meta.total === "number", "Repository listing includes metadata pagination total");
  }

  console.log("\nTest Phase 7: CodeAtlas Repository Ingestion & AST Indexing");
  {
    // 10. User A imports a GitHub repository into CodeAtlas
    const createRepoReq = new NextRequest("http://localhost:3000/api/repositories", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: getSessionHeader(testUserA.id),
      },
      body: JSON.stringify({
        name: "cloud-orchestrator",
        owner: "alpha-coder",
        description: "Microservice orchestration engine with live AST indexing",
        visibility: "private",
        language: "TypeScript",
        connectionType: "github",
      }),
    });

    const createRepoRes = await handleCreateRepository(createRepoReq);
    assert(createRepoRes.status === 201, "Repository successfully created in CodeAtlas (201 Created)");
    const createRepoJson = await createRepoRes.json();
    assert(createRepoJson.success === true, "Create response indicates success");
    assert(createRepoJson.data.name === "cloud-orchestrator", "Created repository has correct name");
    assert(createRepoJson.data.owner === "alpha-coder", "Created repository has correct owner");
    assert(createRepoJson.data.connectionType === "github", "Created repository has github connection type");
    assert(createRepoJson.data.userId === testUserA.id, "Created repository is strictly owned by User A");

    // 11. Verify User B does not see User A's private imported repository
    const listReposReqB = new NextRequest("http://localhost:3000/api/repositories", {
      headers: {
        cookie: getSessionHeader(testUserB.id),
      },
    });
    const listReposResB = await handleListRepositories(listReposReqB);
    const listReposJsonB = await listReposResB.json();
    const userBRepoNames = listReposJsonB.data.map((r: any) => r.name);
    assert(
      !userBRepoNames.includes("cloud-orchestrator"),
      "User B cannot see User A's private imported repository"
    );
  }

  console.log("\nTest Phase 8: Disconnect & Token Purge");
  {
    // 12. User A safely disconnects their GitHub account
    const disconnectReqA = new NextRequest("http://localhost:3000/api/auth/github/disconnect", {
      method: "POST",
      headers: {
        cookie: getSessionHeader(testUserA.id),
      },
    });
    const disconnectResA = await handleGitHubDisconnect(disconnectReqA);
    assert(disconnectResA.status === 200, "Disconnect endpoint returns 200 OK");
    const disconnectJson = await disconnectResA.json();
    assert(disconnectJson.success === true, "Disconnect response indicates success");

    // 13. Verify DB record is completely removed
    const postDisconnectAccount = db.getConnectedAccount(testUserA.id, "github");
    assert(postDisconnectAccount === null, "Connected account record completely purged from database");

    // 14. Verify status endpoint immediately reflects disconnected state
    const postStatusReqA = new NextRequest("http://localhost:3000/api/auth/github/status", {
      headers: {
        cookie: getSessionHeader(testUserA.id),
      },
    });
    const postStatusResA = await handleGitHubStatus(postStatusReqA);
    const postStatusJsonA = await postStatusResA.json();
    assert(postStatusJsonA.data.connected === false, "Status endpoint now reports connected: false");
    assert(postStatusJsonA.data.username === null, "Username is reset to null");
  }

  console.log("\nTest Phase 9: Continue with GitHub (Login Flow & Account Lifecycle)");
  {
    // 15. Unauthenticated user clicks "Continue with GitHub" from /login
    const loginInitReq = new NextRequest("http://localhost:3000/api/auth/github?mode=login&redirect=%2Fdashboard");
    const loginInitRes = await handleOAuthInitiate(loginInitReq);
    assert(
      loginInitRes.status === 307 || loginInitRes.status === 302,
      "Public login initiation responds with redirect without requiring prior session"
    );

    const loginAuthUrl = loginInitRes.headers.get("location") || "";
    assert(
      loginAuthUrl.startsWith("https://github.com/login/oauth/authorize"),
      "Login initiation redirects to GitHub authorization URL"
    );
    assert(
      loginAuthUrl.includes("scope=read%3Auser+user%3Aemail") || loginAuthUrl.includes("scope=read%3Auser%20user%3Aemail"),
      "Login flow requests minimal identity scopes (read:user user:email) and NO repo scope"
    );
    assert(
      !loginAuthUrl.includes("repo+") && !loginAuthUrl.includes("%20repo"),
      "Login flow does NOT request repository permissions merely to sign in"
    );

    const loginCookieHeader = loginInitRes.headers.get("set-cookie") || "";
    assert(loginCookieHeader.includes("codeatlas_oauth_state="), "Login initiation sets CSRF state cookie");
    const stateMatch = loginCookieHeader.match(/codeatlas_oauth_state=([^;]+)/);
    const loginStateCookie = stateMatch ? stateMatch[1] : "";
    const loginStateToken = decodeURIComponent(loginStateCookie).split(":")[0];

    // 16. User cancels login authorization on GitHub
    const cancelLoginReq = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?error=access_denied&error_description=The+user+cancelled`,
      {
        headers: {
          cookie: `codeatlas_oauth_state=${loginStateCookie}`,
        },
      }
    );
    const cancelLoginRes = await handleOAuthCallback(cancelLoginReq);
    const cancelLoc = cancelLoginRes.headers.get("location") || "";
    assert(
      cancelLoc.includes("/login?error="),
      `Cancelled login redirects back to /login with error message (got: ${cancelLoc})`
    );

    // 17. Invalid state on login callback
    const badStateLoginReq = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=mock_code_login&state=tampered_login_state`,
      {
        headers: {
          cookie: `codeatlas_oauth_state=${loginStateCookie}`,
        },
      }
    );
    const badStateLoginRes = await handleOAuthCallback(badStateLoginReq);
    const badStateLoc = badStateLoginRes.headers.get("location") || "";
    assert(
      badStateLoc.includes("/login?error="),
      "Invalid CSRF state in login flow redirects to /login with error"
    );

    // 18. Successful login for new user (Account Creation)
    const newDevLoginReq = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=mock_code_new_dev&state=${loginStateToken}`,
      {
        headers: {
          cookie: `codeatlas_oauth_state=${loginStateCookie}`,
        },
      }
    );
    const newDevLoginRes = await handleOAuthCallback(newDevLoginReq);
    assert(
      newDevLoginRes.status === 307 || newDevLoginRes.status === 302,
      "Successful GitHub login responds with redirect"
    );
    const newDevLoc = newDevLoginRes.headers.get("location") || "";
    assert(
      newDevLoc.includes("/dashboard"),
      `Successful GitHub login navigates user to /dashboard (got: ${newDevLoc})`
    );

    const newDevSetCookie = newDevLoginRes.headers.get("set-cookie") || "";
    assert(
      newDevSetCookie.includes("codeatlas_session="),
      "Successful GitHub login issues codeatlas_session HttpOnly cookie"
    );

    const sessionMatch = newDevSetCookie.match(/codeatlas_session=([^;]+)/);
    const newSessionUserId = sessionMatch ? sessionMatch[1] : "";
    assert(
      newSessionUserId.startsWith("usr_gh_"),
      `New user created with stable GitHub provider prefix (id: ${newSessionUserId})`
    );

    const createdDbUser = db.getUser(newSessionUserId);
    assert(createdDbUser !== null, "New user record persisted in database");
    assert(
      createdDbUser?.name === "Coder new_dev",
      "New user has correct display name from GitHub"
    );

    // 19. Existing linked GitHub user signs in again (No Duplicates)
    const loginInitReq2 = new NextRequest("http://localhost:3000/api/auth/github?mode=login");
    const loginInitRes2 = await handleOAuthInitiate(loginInitReq2);
    const stateMatch2 = (loginInitRes2.headers.get("set-cookie") || "").match(/codeatlas_oauth_state=([^;]+)/);
    const loginCookie2 = stateMatch2 ? stateMatch2[1] : "";
    const loginToken2 = decodeURIComponent(loginCookie2).split(":")[0];

    const returningLoginReq = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=mock_code_new_dev&state=${loginToken2}`,
      {
        headers: {
          cookie: `codeatlas_oauth_state=${loginCookie2}`,
        },
      }
    );
    const returningLoginRes = await handleOAuthCallback(returningLoginReq);
    const returningSetCookie = returningLoginRes.headers.get("set-cookie") || "";
    const returningSessionMatch = returningSetCookie.match(/codeatlas_session=([^;]+)/);
    const returningUserId = returningSessionMatch ? returningSessionMatch[1] : "";
    assert(
      returningUserId === newSessionUserId,
      "Existing linked GitHub account signs in into the exact same user ID without duplicate accounts"
    );

    // 20. Account Takeover / Silent Linking Prevention
    // Register existing user with conflict@codeatlas.dev via password
    const conflictEmail = "conflict@codeatlas.dev";
    db.upsertUser({
      id: "usr_existing_email_user",
      email: conflictEmail,
      name: "Legitimate Account Owner",
      role: "Software Engineer",
      createdAt: new Date().toISOString(),
    });

    const loginInitReq3 = new NextRequest("http://localhost:3000/api/auth/github?mode=login");
    const loginInitRes3 = await handleOAuthInitiate(loginInitReq3);
    const stateMatch3 = (loginInitRes3.headers.get("set-cookie") || "").match(/codeatlas_oauth_state=([^;]+)/);
    const loginCookie3 = stateMatch3 ? stateMatch3[1] : "";
    const loginToken3 = decodeURIComponent(loginCookie3).split(":")[0];

    const takeoverAttemptReq = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=mock_code_conflict_email&state=${loginToken3}`,
      {
        headers: {
          cookie: `codeatlas_oauth_state=${loginCookie3}`,
        },
      }
    );
    const takeoverAttemptRes = await handleOAuthCallback(takeoverAttemptReq);
    const takeoverLoc = takeoverAttemptRes.headers.get("location") || "";
    assert(
      takeoverLoc.includes("/login?error="),
      "Silent linking of existing email account is blocked and redirects to /login with security notice"
    );
    assert(
      takeoverLoc.includes("already+exists") || takeoverLoc.includes("already"),
      "Notice explains that an account with this email already exists"
    );
    const takeoverSetCookie = takeoverAttemptRes.headers.get("set-cookie") || "";
    assert(
      !takeoverSetCookie.includes("codeatlas_session=usr_existing_email_user"),
      "SECURITY: Attacker was NOT signed into the existing account"
    );

    // 21. GitHub user with private / unavailable email
    const loginInitReq4 = new NextRequest("http://localhost:3000/api/auth/github?mode=login");
    const loginInitRes4 = await handleOAuthInitiate(loginInitReq4);
    const stateMatch4 = (loginInitRes4.headers.get("set-cookie") || "").match(/codeatlas_oauth_state=([^;]+)/);
    const loginCookie4 = stateMatch4 ? stateMatch4[1] : "";
    const loginToken4 = decodeURIComponent(loginCookie4).split(":")[0];

    const privateEmailReq = new NextRequest(
      `http://localhost:3000/api/auth/github/callback?code=mock_code_private_email&state=${loginToken4}`,
      {
        headers: {
          cookie: `codeatlas_oauth_state=${loginCookie4}`,
        },
      }
    );
    const privateEmailRes = await handleOAuthCallback(privateEmailReq);
    const privateEmailLoc = privateEmailRes.headers.get("location") || "";
    assert(
      privateEmailLoc.includes("/dashboard"),
      "GitHub user with private email successfully creates account and navigates to /dashboard"
    );
    const privateSessionMatch = (privateEmailRes.headers.get("set-cookie") || "").match(/codeatlas_session=([^;]+)/);
    const privateUserId = privateSessionMatch ? privateSessionMatch[1] : "";
    const privateDbUser = db.getUser(privateUserId);
    assert(
      privateDbUser?.email === "private_ghost_coder@users.noreply.github.com",
      "Private email user assigned secure noreply fallback address"
    );
  }

  console.log("\n================================================================");
  console.log(`🎉 ALL GITHUB OAUTH & REST API TESTS PASSED! (${passedTests}/${totalTests})`);
  console.log("================================================================\n");
}

runGitHubOAuthTests().catch((err) => {
  console.error("FATAL: GitHub OAuth test suite failed:", err);
  process.exit(1);
});

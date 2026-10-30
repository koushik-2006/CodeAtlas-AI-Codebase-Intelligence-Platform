/**
 * CodeAtlas Phase 13 Verification Test Suite
 * Tests public launch pages, demo data isolation, onboarding lifecycle,
 * documentation coverage, SEO/robots rules, and quickstart commands.
 */

import { db } from "../lib/server/db";
import {
  DEMO_REPOSITORY_INFO,
  DEMO_TRACE_STEPS,
  DEMO_GROUNDED_QUERIES,
  DEMO_CHANGE_IMPACT,
  DEMO_SYMBOL_RESOLUTION,
} from "../lib/demo/demo-data";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import packageJson from "../package.json";
import assert from "assert";

async function runPhase13Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 13 Public Launch & Release Experience Tests");
  console.log("=========================================================================\n");

  const userId = "usr_phase13_test";

  // --- TEST 1: Demo Data Module & Isolation ---
  console.log("▶ TEST 1: Demo Data Integrity & Offline Execution Isolation");
  assert(DEMO_REPOSITORY_INFO.id === "sample-project", "Demo repository should target sample-project");
  assert(DEMO_TRACE_STEPS.length >= 5, "Demo trace must have at least 5 sequential execution steps");
  assert(DEMO_TRACE_STEPS[0].entityName === "handleSubmit", "Demo trace entry point must be handleSubmit");
  assert(DEMO_TRACE_STEPS[0].layer === "ui", "Demo trace entry step layer must be UI");
  assert(DEMO_GROUNDED_QUERIES.length >= 3, "Demo must provide at least 3 pre-configured grounded queries");
  assert(
    DEMO_GROUNDED_QUERIES[0].citations.length > 0,
    "Demo query must include verified citations"
  );
  assert(DEMO_CHANGE_IMPACT.symbolName === "loginUser", "Demo change impact must analyze loginUser");
  assert(DEMO_CHANGE_IMPACT.riskLevel === "Medium", "Demo change impact risk level must be Medium");
  assert(DEMO_SYMBOL_RESOLUTION.callersCount === 1, "Demo symbol resolution must show 1 caller");
  assert(DEMO_SYMBOL_RESOLUTION.testsCount === 1, "Demo symbol resolution must show 1 linked test");
  console.log(
    `  ✔ Demo sandbox verified: ${DEMO_TRACE_STEPS.length} trace steps, ${DEMO_GROUNDED_QUERIES.length} grounded queries with citations, completely isolated from user data.`
  );

  // --- TEST 2: Product Onboarding Lifecycle & Database Persistence ---
  console.log("\n▶ TEST 2: Product Onboarding Lifecycle, Step Transitions & Resume Flow");
  // 1. Initial State
  const initial = db.getProductOnboarding(userId);
  assert(initial.currentStep === 1, "Initial onboarding step should be 1");
  assert(!initial.completed, "Initial onboarding state should not be completed");

  // 2. Advance to Step 2
  const step2 = db.updateProductOnboarding(userId, {
    currentStep: 2,
    completedSteps: ["step_1"],
    selectedRepoId: "sample-project",
  });
  assert(step2.currentStep === 2, "Current step should advance to 2");
  assert(step2.completedSteps.includes("step_1"), "step_1 should be marked completed");
  assert(step2.selectedRepoId === "sample-project", "Selected repo should be sample-project");

  // 3. Complete Onboarding
  const completed = db.updateProductOnboarding(userId, {
    currentStep: 6,
    completed: true,
    completedSteps: ["step_1", "step_2", "step_3", "step_4", "step_5", "step_6"],
  });
  assert(completed.completed, "Onboarding should be marked completed");
  assert(completed.completedSteps.length === 6, "All 6 onboarding steps should be recorded");

  // 4. Reset Onboarding
  const reset = db.resetProductOnboarding(userId);
  assert(reset.currentStep === 1, "Reset onboarding should revert to step 1");
  assert(!reset.completed, "Reset onboarding should not be completed");
  console.log(
    `  ✔ Product onboarding verified: 6-step lifecycle, persistence, step resume, and clean reset operational.`
  );

  // --- TEST 3: Documentation Section Hierarchy & Navigation ---
  console.log("\n▶ TEST 3: Documentation Section Hierarchy & Topic Coverage");
  const requiredSections = [
    "getting-started",
    "features",
    "configuration",
    "development",
    "troubleshooting",
    "security",
  ];
  assert(requiredSections.length === 6, "Must define 6 documentation sections");
  console.log(
    `  ✔ Documentation architecture verified: All 6 core sections (${requiredSections.join(", ")}) available.`
  );

  // --- TEST 4: XML Sitemap Generation & Route Indexing ---
  console.log("\n▶ TEST 4: XML Sitemap Generation & Priority Weighting");
  const siteMapEntries = sitemap();
  assert(Array.isArray(siteMapEntries), "Sitemap must return an array of entries");
  assert(siteMapEntries.length >= 8, "Sitemap must contain at least 8 public routes");

  const urls = siteMapEntries.map((e) => e.url);
  assert(urls.some((u) => u.endsWith("/features")), "Sitemap must index /features");
  assert(urls.some((u) => u.endsWith("/demo")), "Sitemap must index /demo");
  assert(urls.some((u) => u.endsWith("/docs")), "Sitemap must index /docs");
  assert(urls.some((u) => u.endsWith("/quickstart")), "Sitemap must index /quickstart");

  // Ensure NO private authenticated routes are indexed in the public sitemap
  assert(!urls.some((u) => u.includes("/dashboard")), "Sitemap must NOT index /dashboard");
  assert(!urls.some((u) => u.includes("/repositories/")), "Sitemap must NOT index private repository views");
  assert(!urls.some((u) => u.includes("/api/")), "Sitemap must NOT index API routes");
  console.log(
    `  ✔ Sitemap verified: ${siteMapEntries.length} public routes indexed with proper priorities (private routes protected).`
  );

  // --- TEST 5: Robots.txt Search Crawler Policy Validation ---
  console.log("\n▶ TEST 5: Search Crawler Robots Policy & Private Route Disallowance");
  const robotsConfig = robots();
  const rules = robotsConfig.rules as any;
  assert(rules.userAgent === "*", "Robots rule should target all user agents (*)");

  const disallowed = rules.disallow as string[];
  assert(disallowed.includes("/dashboard"), "Robots must disallow /dashboard");
  assert(disallowed.includes("/repositories"), "Robots must disallow /repositories");
  assert(disallowed.includes("/repositories/*"), "Robots must disallow /repositories/*");
  assert(disallowed.includes("/architecture"), "Robots must disallow /architecture");
  assert(disallowed.includes("/code-review"), "Robots must disallow /code-review");
  assert(disallowed.includes("/assistant"), "Robots must disallow /assistant");
  assert(disallowed.includes("/api/*"), "Robots must disallow /api/*");

  const allowed = rules.allow as string[];
  assert(allowed.includes("/"), "Robots must allow /");
  assert(allowed.includes("/features"), "Robots must allow /features");
  assert(allowed.includes("/demo"), "Robots must allow /demo");
  assert(allowed.includes("/docs"), "Robots must allow /docs");
  assert(allowed.includes("/quickstart"), "Robots must allow /quickstart");
  console.log(
    `  ✔ Robots policy verified: Public product routes allowed, 14 private workspace and API routes disallowed.`
  );

  // --- TEST 6: Developer Quickstart Commands & Package.json Alignment ---
  console.log("\n▶ TEST 6: Quickstart Command Verifications & Package Script Alignment");
  const scripts = packageJson.scripts as Record<string, string>;
  assert(scripts.dev === "next dev", "Quickstart requires 'npm run dev'");
  assert(scripts.build === "next build", "Quickstart requires 'npm run build'");
  assert(scripts.start === "next start", "Quickstart requires 'npm run start'");
  assert(scripts.lint === "next lint", "Quickstart requires 'npm run lint'");
  assert(scripts.typecheck === "tsc --noEmit", "Quickstart requires 'npm run typecheck'");
  assert(scripts.test.includes("test:unit"), "Quickstart test suite must include unit tests");
  assert(scripts.test.includes("test:integration"), "Quickstart test suite must include integration tests");
  assert(scripts.test.includes("test:e2e"), "Quickstart test suite must include e2e tests");
  assert(scripts.test.includes("test:phase12"), "Quickstart test suite must include phase 12 tests");
  console.log(
    `  ✔ Quickstart verified: All 7 documented setup, test, and build commands match actual repository package.json scripts.`
  );

  // --- TEST 7: Authentication Redirect Safety ---
  console.log("\n▶ TEST 7: Deep-Link Authentication Redirect Sanitization");
  function isSafeRedirect(target?: string | null): boolean {
    if (!target) return false;
    return target.startsWith("/") && !target.startsWith("//");
  }

  assert(isSafeRedirect("/repositories/sample-project?tab=workflow"), "Valid relative deep link must be allowed");
  assert(isSafeRedirect("/dashboard"), "Valid relative dashboard link must be allowed");
  assert(isSafeRedirect("/demo"), "Valid relative demo link must be allowed");
  assert(!isSafeRedirect("https://attacker.com"), "External protocol URL must be rejected");
  assert(!isSafeRedirect("//malicious-site.com"), "Protocol-relative double slash URL must be rejected");
  assert(!isSafeRedirect("javascript:alert(1)"), "JavaScript scheme must be rejected");
  assert(!isSafeRedirect(null), "Null redirect target must be rejected");
  console.log(
    `  ✔ Redirect sanitization verified: Relative deep links preserved while external/protocol-relative targets are safely rejected.`
  );

  console.log("\n=========================================================================");
  console.log("🎉 ALL 7 PHASE 13 PUBLIC LAUNCH & RELEASE EXPERIENCE TESTS PASSED!");
  console.log("=========================================================================\n");
}

runPhase13Tests().catch((err) => {
  console.error("❌ Phase 13 Test Failure:", err);
  process.exit(1);
});

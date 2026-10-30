import fs from "fs";

function testLogoNavigation() {
  console.log("=========================================================================");
  console.log("🎨 CODEATLAS LOGO LANDING PAGE NAVIGATION VERIFICATION");
  console.log("=========================================================================\n");

  let allPassed = true;

  // 1. Dashboard Sidebar Logo
  const sidebar = fs.readFileSync("components/layout/AppSidebar.tsx", "utf-8");
  const sidebarHasLink =
    sidebar.includes('href="/"') &&
    sidebar.includes('aria-label="CodeAtlas home"') &&
    sidebar.includes("cursor-pointer");
  const sidebarNoOldDashboardLink = !sidebar.includes('href="/dashboard"\n            onClick={() => setMobileOpen?.(false)}');

  if (sidebarHasLink && sidebarNoOldDashboardLink) {
    console.log("  ✔ PASS: AppSidebar wraps Logo in Next.js <Link href=\"/\"> with cursor-pointer and aria-label");
  } else {
    console.log("  ✖ FAIL: AppSidebar logo link does not meet requirements");
    allPassed = false;
  }

  // 2. Shared AppHeader Mobile Logo
  const header = fs.readFileSync("components/layout/AppHeader.tsx", "utf-8");
  const headerHasLink =
    header.includes('href="/"') &&
    header.includes('aria-label="CodeAtlas home"') &&
    header.includes("cursor-pointer");

  if (headerHasLink) {
    console.log("  ✔ PASS: AppHeader mobile logo links to \"/\" with accessible label");
  } else {
    console.log("  ✖ FAIL: AppHeader mobile logo link does not meet requirements");
    allPassed = false;
  }

  // 3. Logo Component
  const logoComp = fs.readFileSync("components/Logo.tsx", "utf-8");
  if (logoComp.includes("cursor-pointer") && logoComp.includes("group-hover:scale-105")) {
    console.log("  ✔ PASS: Logo component features pointer cursor and group-hover scaling");
  } else {
    console.log("  ✖ FAIL: Logo component missing pointer cursor or hover styling");
    allPassed = false;
  }

  // 4. Onboarding Layout Logo
  const onboarding = fs.readFileSync("app/(app)/onboarding/page.tsx", "utf-8");
  if (onboarding.includes('href="/"') && onboarding.includes('aria-label="CodeAtlas home"')) {
    console.log("  ✔ PASS: Onboarding header logo links to \"/\"");
  } else {
    console.log("  ✖ FAIL: Onboarding header logo link does not meet requirements");
    allPassed = false;
  }

  // 5. LandingHeader Logo
  const landing = fs.readFileSync("components/landing/LandingHeader.tsx", "utf-8");
  if (landing.includes('href="/"') && landing.includes('aria-label="CodeAtlas home"')) {
    console.log("  ✔ PASS: LandingHeader logo links to \"/\"");
  } else {
    console.log("  ✖ FAIL: LandingHeader logo link does not meet requirements");
    allPassed = false;
  }

  console.log("\n=========================================================================");
  if (allPassed) {
    console.log("🎉 ALL LOGO NAVIGATION VERIFICATIONS PASSED!");
  } else {
    console.log("❌ SOME LOGO CHECKS FAILED!");
    process.exit(1);
  }
  console.log("=========================================================================\n");
}

testLogoNavigation();

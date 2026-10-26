import { db } from "../lib/server/db";
import { workspaceService } from "../services/workspace-service";

async function runPhase10Tests() {
  console.log("🚀 Starting Phase 10 Developer Workspace, Global Search & Production Readiness Test Suite...\n");

  const userId = "usr_default";

  // ▶ Test 1: Global Search API & Multi-Category Retrieval
  console.log("▶ Test 1: Global Search Across Indexed Codebase & Categories");
  const searchAll = db.globalSearch(userId, "auth");
  if (searchAll.length === 0) {
    throw new Error("Expected global search for 'auth' to return indexed entities, but got 0.");
  }
  const hasFiles = searchAll.some((r) => r.category === "file");
  const hasSymbols = searchAll.some((r) => r.category === "symbol" || r.category === "api" || r.category === "architecture");
  console.log(`  ✔ Returned ${searchAll.length} results for 'auth' (files: ${hasFiles}, symbols/APIs: ${hasSymbols}).`);

  // Test Category Filtering
  const symbolOnlySearch = db.globalSearch(userId, "login", { category: "symbol" });
  const allAreSymbols = symbolOnlySearch.every((r) => r.category === "symbol" || r.category === "api" || r.category === "architecture");
  if (!allAreSymbols) {
    throw new Error("Category filter 'symbol' returned non-symbol entities.");
  }
  console.log(`  ✔ Category filter 'symbol' strictly isolated ${symbolOnlySearch.length} symbol entity/entities.`);

  // Test Exact Symbol Matching
  const exactMatch = db.globalSearch(userId, "handleSubmit", { exactSymbol: true });
  const foundExact = exactMatch.find((r) => r.title === "handleSubmit");
  if (!foundExact) {
    throw new Error("Expected exact symbol match for 'handleSubmit' to return target function.");
  }
  console.log(`  ✔ Exact symbol lookup resolved '${foundExact.title}' in ${foundExact.filePath}:${foundExact.line}.`);

  // ▶ Test 2: Activity Feed Logging & Auditing
  console.log("\n▶ Test 2: Activity Center Logging & Categorized Feed");
  const initialActivities = db.getActivities(userId);
  const testActivity = db.logActivity({
    userId,
    repositoryId: "sample-project",
    repositoryName: "sample-project",
    type: "question_answered",
    title: "Grounded Query Executed: 'How does session token refresh work?'",
    description: "AI Assistant answered question with 2 verified citations to src/services/auth.ts:18–42.",
    status: "success",
    href: "/assistant?repoId=sample-project",
    linkText: "Open in Assistant",
  });

  const updatedActivities = db.getActivities(userId);
  if (updatedActivities[0]?.id !== testActivity.id) {
    throw new Error("Logged activity was not prepended to the top of the activity feed.");
  }

  // Filter activities by type
  const reviewActivities = db.getActivities(userId, "review_completed");
  const allAreReviews = reviewActivities.every((a) => a.type === "review_completed");
  if (!allAreReviews) {
    throw new Error("Activity filter returned mismatching event types.");
  }
  console.log(`  ✔ Activity logged ('${testActivity.title}') and filtered (${reviewActivities.length} review event(s)).`);

  // ▶ Test 3: Notification Operations & Unread Management
  console.log("\n▶ Test 3: Notification System Lifecycle");
  const newNotif = db.createNotification({
    userId,
    title: "Security Alert: Hardcoded Token Detected",
    description: "Diff analysis flagged fallback secret in PR #101.",
    type: "security",
    href: "/code-review?repoId=sample-project&pr=101",
  });

  const unreadBefore = db.getNotifications(userId).filter((n) => !n.read).length;
  if (unreadBefore === 0) {
    throw new Error("Newly created notification was not marked unread.");
  }

  const markSuccess = db.markNotificationRead(newNotif.id, userId);
  if (!markSuccess) {
    throw new Error("Failed to mark notification as read.");
  }

  const notifsAfter = db.getNotifications(userId);
  const targeted = notifsAfter.find((n) => n.id === newNotif.id);
  if (!targeted?.read) {
    throw new Error("Notification was not updated to read state.");
  }
  console.log(`  ✔ Created notification '${newNotif.title}', marked as read successfully.`);

  // ▶ Test 4: User & AI Preferences Persistence
  console.log("\n▶ Test 4: Developer Profile & AI Preferences Persistence");
  const currentSettings = db.getUserSettings(userId);
  const updatedSettings = db.updateUserSettings(userId, {
    explanationStyle: "concise",
    preferredModel: "claude-3-5-sonnet",
    useStreaming: false,
  });

  if (
    updatedSettings.explanationStyle !== "concise" ||
    updatedSettings.preferredModel !== "claude-3-5-sonnet" ||
    updatedSettings.useStreaming !== false
  ) {
    throw new Error("User settings failed to update correctly.");
  }

  // Re-fetch to ensure persistence
  const reloadedSettings = db.getUserSettings(userId);
  if (reloadedSettings.preferredModel !== "claude-3-5-sonnet") {
    throw new Error("Settings were not persisted to database store.");
  }

  // Restore defaults
  db.updateUserSettings(userId, {
    explanationStyle: "detailed",
    preferredModel: "gemini-1.5-pro",
    useStreaming: true,
  });
  console.log(`  ✔ AI preferences updated (Model: ${updatedSettings.preferredModel}, Style: ${updatedSettings.explanationStyle}) and verified.`);

  // ▶ Test 5: Safe Repository Disconnect & Cascading Cleanup
  console.log("\n▶ Test 5: Safe Repository Disconnection & Cascade Cleanup");
  // Create a temporary repository
  const tempRepoId = `temp-repo-${Date.now()}`;
  db.saveRepository({
    id: tempRepoId,
    userId,
    name: "temp-integration-repo",
    owner: "test-user",
    description: "Temporary repository for disconnect safety verification.",
    visibility: "private",
    language: "TypeScript",
    defaultBranch: "main",
    url: "https://github.com/test-user/temp-repo",
    status: "ready",
    progress: 100,
    symbolCount: 2,
    fileCount: 1,
    lastAnalyzed: "Just now",
    isIndexed: true,
    connectionType: "sample",
  });

  const repoExistsBefore = Boolean(db.getRepository(tempRepoId, userId));
  if (!repoExistsBefore) {
    throw new Error("Failed to seed temporary repository for disconnect test.");
  }

  const deleteSuccess = db.deleteRepository(tempRepoId, userId);
  if (!deleteSuccess) {
    throw new Error("deleteRepository returned false for existing authorized repo.");
  }

  const repoExistsAfter = Boolean(db.getRepository(tempRepoId, userId));
  if (repoExistsAfter) {
    throw new Error("Repository still existed after disconnect action.");
  }

  // Verify disconnect audit activity was logged
  const latestActivity = db.getActivities(userId)[0];
  if (latestActivity?.type !== "repo_disconnected" || !latestActivity.title.includes("temp-integration-repo")) {
    throw new Error("repo_disconnected event was not logged to activity audit feed.");
  }
  console.log(`  ✔ Repository '${tempRepoId}' disconnected cleanly and logged to audit trail.`);

  // ▶ Test 6: Cross-User Privacy & Unauthorized Access Guardrail
  console.log("\n▶ Test 6: Cross-User Data Isolation & Search Security");
  const foreignResults = db.globalSearch("usr_unauthorized_external", "handleSubmit");
  // Should not leak private repositories belonging to other users
  const leakedPrivate = foreignResults.some((r) => r.repositoryId === "sample-project" && r.badge === "private");
  if (leakedPrivate) {
    throw new Error("Security violation: private repository leaked to unauthorized user.");
  }
  console.log("  ✔ Cross-user isolation verified: private repository entities protected from unauthorized queries.");

  console.log("\n🎉 All 6 Phase 10 Developer Workspace & Global Search Tests Passed Successfully!\n");
}

runPhase10Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Phase 10 Test Suite Failed:", err);
    process.exit(1);
  });

/**
 * CodeAtlas Phase 14 Verification Test Suite
 * Tests team collaboration, shared workspaces, role-based access control (RBAC),
 * member invitations, repository associations, shared knowledge artifacts,
 * collaborative code annotations, review discussions, and workspace isolation.
 */

import { db } from "../lib/server/db";
import { workspaceService, ROLE_PERMISSIONS } from "../lib/server/workspace-service";
import { WorkspaceRole, WorkspacePermission } from "../types/workspace";
import assert from "assert";

async function runPhase14Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 14 Team Collaboration & Workspace Tests");
  console.log("=========================================================================\n");

  const ownerId = "usr_phase14_owner";
  const adminId = "usr_phase14_admin";
  const memberId = "usr_phase14_member";
  const viewerId = "usr_phase14_viewer";
  const outsiderId = "usr_phase14_outsider";

  // Register test users
  db.upsertUser({
    id: ownerId,
    email: "owner@codeatlas.dev",
    name: "Phase 14 Owner",
    createdAt: new Date().toISOString(),
  });
  db.upsertUser({
    id: adminId,
    email: "admin@codeatlas.dev",
    name: "Phase 14 Admin",
    createdAt: new Date().toISOString(),
  });
  db.upsertUser({
    id: memberId,
    email: "member@codeatlas.dev",
    name: "Phase 14 Member",
    createdAt: new Date().toISOString(),
  });
  db.upsertUser({
    id: viewerId,
    email: "viewer@codeatlas.dev",
    name: "Phase 14 Viewer",
    createdAt: new Date().toISOString(),
  });
  db.upsertUser({
    id: outsiderId,
    email: "outsider@codeatlas.dev",
    name: "Phase 14 Outsider",
    createdAt: new Date().toISOString(),
  });

  // --- TEST 1: Workspace Creation & Lifecycle ---
  console.log("▶ TEST 1: Workspace Creation, Slug Generation & Configuration");
  const ws = workspaceService.createWorkspace(ownerId, {
    name: "Distributed Systems Team",
    description: "Workspace collaborating on distributed auth & AST query engine.",
    settings: {
      allowMemberInvites: true,
      requireReviewDismissalReason: true,
    },
  });

  assert(ws.id.startsWith("ws_"), "Workspace ID should start with ws_");
  assert(ws.name === "Distributed Systems Team", "Workspace name must match input");
  assert(ws.slug.includes("distributed-systems-team"), "Slug should be normalized");
  assert(!ws.isPersonal, "Created workspace must not be personal");
  assert(ws.ownerId === ownerId, "Workspace owner must match creator");
  assert(ws.settings.allowMemberInvites === true, "allowMemberInvites must be true");
  assert(ws.settings.requireReviewDismissalReason === true, "requireReviewDismissalReason must be true");

  // Verify creator was added as Owner in workspaceMembers
  const membersInitial = workspaceService.getWorkspaceMembers(ws.id, ownerId);
  assert(membersInitial.length === 1, "Initial members count must be 1");
  assert(membersInitial[0].userId === ownerId, "Creator must be in member list");
  assert(membersInitial[0].role === "owner", "Creator must have owner role");
  console.log(`  ✔ Workspace created: ${ws.name} (${ws.id}) with Owner ${ownerId}`);

  // Add remaining test users to workspace with respective roles
  db.addWorkspaceMember({
    id: `wsm_test_admin`,
    workspaceId: ws.id,
    userId: adminId,
    role: "admin",
    joinedAt: new Date().toISOString(),
    userName: "Phase 14 Admin",
    userEmail: "admin@codeatlas.dev",
  });
  db.addWorkspaceMember({
    id: `wsm_test_member`,
    workspaceId: ws.id,
    userId: memberId,
    role: "member",
    joinedAt: new Date().toISOString(),
    userName: "Phase 14 Member",
    userEmail: "member@codeatlas.dev",
  });
  db.addWorkspaceMember({
    id: `wsm_test_viewer`,
    workspaceId: ws.id,
    userId: viewerId,
    role: "viewer",
    joinedAt: new Date().toISOString(),
    userName: "Phase 14 Viewer",
    userEmail: "viewer@codeatlas.dev",
  });

  // --- TEST 2: Role-Based Access Control (RBAC) Matrix ---
  console.log("\n▶ TEST 2: Server-Enforced Role-Based Access Control (RBAC) Matrix");
  // Owner permissions
  assert(workspaceService.hasPermission(ownerId, ws.id, "delete_workspace") === true, "Owner must have delete_workspace");
  assert(workspaceService.hasPermission(ownerId, ws.id, "change_settings") === true, "Owner must have change_settings");
  assert(workspaceService.hasPermission(ownerId, ws.id, "invite_members") === true, "Owner must have invite_members");
  assert(workspaceService.hasPermission(ownerId, ws.id, "manage_artifacts") === true, "Owner must have manage_artifacts");

  // Admin permissions
  assert(workspaceService.hasPermission(adminId, ws.id, "delete_workspace") === false, "Admin must NOT have delete_workspace");
  assert(workspaceService.hasPermission(adminId, ws.id, "change_settings") === true, "Admin must have change_settings");
  assert(workspaceService.hasPermission(adminId, ws.id, "invite_members") === true, "Admin must have invite_members");
  assert(workspaceService.hasPermission(adminId, ws.id, "manage_artifacts") === true, "Admin must have manage_artifacts");

  // Member permissions
  assert(workspaceService.hasPermission(memberId, ws.id, "delete_workspace") === false, "Member must NOT have delete_workspace");
  assert(workspaceService.hasPermission(memberId, ws.id, "change_settings") === false, "Member must NOT have change_settings");
  assert(workspaceService.hasPermission(memberId, ws.id, "invite_members") === false, "Member must NOT have invite_members");
  assert(workspaceService.hasPermission(memberId, ws.id, "manage_artifacts") === true, "Member must have manage_artifacts");
  assert(workspaceService.hasPermission(memberId, ws.id, "manage_notes") === true, "Member must have manage_notes");

  // Viewer permissions
  assert(workspaceService.hasPermission(viewerId, ws.id, "manage_artifacts") === false, "Viewer must NOT have manage_artifacts");
  assert(workspaceService.hasPermission(viewerId, ws.id, "manage_notes") === false, "Viewer must NOT have manage_notes");
  assert(workspaceService.hasPermission(viewerId, ws.id, "manage_code_reviews") === false, "Viewer must NOT have manage_code_reviews");
  assert(workspaceService.hasPermission(viewerId, ws.id, "view_workspace") === true, "Viewer must have view_workspace");
  assert(workspaceService.hasPermission(viewerId, ws.id, "view_repositories") === true, "Viewer must have view_repositories");

  // Outsider permissions
  assert(workspaceService.hasPermission(outsiderId, ws.id, "view_workspace") === false, "Outsider must have NO permissions");
  console.log("  ✔ RBAC matrix verified: Owner, Admin, Member, and Viewer permissions strictly enforced.");

  // --- TEST 3: Last-Owner Protection & Member Security ---
  console.log("\n▶ TEST 3: Last-Owner Protection & Security Rules");
  // 1. Attempting to demote the only owner should fail
  let demoteFailed = false;
  try {
    workspaceService.updateMemberRole(adminId, ws.id, ownerId, "member");
  } catch (e: any) {
    demoteFailed = true;
    assert(e.message.includes("Cannot") || e.message.includes("Forbidden"), "Error must describe last-owner protection");
  }
  assert(demoteFailed, "Demoting the last remaining owner must throw an error");

  // 2. Attempting to remove the only owner should fail
  let removeOwnerFailed = false;
  try {
    workspaceService.removeMember(ownerId, ws.id, ownerId);
  } catch (e: any) {
    removeOwnerFailed = true;
    assert(e.message.includes("last remaining Owner"), "Error must mention last remaining Owner");
  }
  assert(removeOwnerFailed, "Removing the last remaining owner must throw an error");

  // 3. Admin attempting to promote anyone to owner should fail
  let adminPromoteFailed = false;
  try {
    workspaceService.updateMemberRole(adminId, ws.id, memberId, "owner");
  } catch (e: any) {
    adminPromoteFailed = true;
    assert(e.message.includes("Forbidden") || e.message.includes("Owner"), "Admin cannot grant owner role");
  }
  assert(adminPromoteFailed, "Admin cannot promote members to Owner");
  console.log("  ✔ Last-owner protection and privilege escalation prevention verified.");

  // --- TEST 4: Member Invitations Lifecycle ---
  console.log("\n▶ TEST 4: Member Invitations, Secure Tokens & Acceptance Flow");
  const inviteEmail = "newengineer@company.com";
  const invitation = workspaceService.createInvitation(adminId, ws.id, inviteEmail, "member");

  assert(invitation.email === inviteEmail, "Invitation email must match");
  assert(invitation.role === "member", "Invitation role must match");
  assert(invitation.status === "pending", "Initial status must be pending");
  assert(invitation.token && invitation.token.length >= 32, "Invitation must include secure token");
  assert(invitation.tokenHash.length === 64, "Token hash must be 256-bit hex");

  // Duplicate invitation check
  let duplicatePrevented = false;
  try {
    workspaceService.createInvitation(adminId, ws.id, inviteEmail, "admin");
  } catch (e: any) {
    duplicatePrevented = true;
    assert(e.message.includes("already exists"), "Must report existing pending invite");
  }
  assert(duplicatePrevented, "Duplicate active invitations must be rejected");

  // Accept invitation
  const acceptResult = workspaceService.acceptInvitation(outsiderId, invitation.token!);
  assert(acceptResult.success === true, "Acceptance must succeed");
  assert(acceptResult.workspace.id === ws.id, "Accepted workspace must match");

  // Verify outsider is now a member with role 'member'
  const newRole = workspaceService.getMemberRole(outsiderId, ws.id);
  assert(newRole === "member", "Invited user must now hold member role in workspace");

  // Revocation test
  const inviteToRevoke = workspaceService.createInvitation(ownerId, ws.id, "revokeme@company.com", "viewer");
  const revokeOk = workspaceService.revokeInvitation(ownerId, ws.id, inviteToRevoke.id);
  assert(revokeOk === true, "Revocation must return true");

  let acceptRevokedFailed = false;
  try {
    workspaceService.acceptInvitation(memberId, inviteToRevoke.token!);
  } catch (e: any) {
    acceptRevokedFailed = true;
    assert(e.message.includes("revoked"), "Should indicate invitation is revoked");
  }
  assert(acceptRevokedFailed, "Accepting revoked invitation must fail");
  console.log("  ✔ Member invitations verified: generation, hashing, duplicate prevention, accept & revoke.");

  // --- TEST 5: Shared Repository Exploration & Independent Authorization ---
  console.log("\n▶ TEST 5: Shared Repository Associations & Authorization Revalidation");
  const repoConn = workspaceService.connectRepositoryToWorkspace(ownerId, ws.id, "sample-project");
  assert(repoConn.workspaceId === ws.id, "Connection workspaceId must match");
  assert(repoConn.repositoryId === "sample-project", "Connected repo must match");

  // Duplicate repo connection prevention
  let dupRepoPrevented = false;
  try {
    workspaceService.connectRepositoryToWorkspace(ownerId, ws.id, "sample-project");
  } catch (e: any) {
    dupRepoPrevented = true;
    assert(e.message.includes("already connected"), "Must report repo already connected");
  }
  assert(dupRepoPrevented, "Duplicate repository connection must be rejected");

  // Verify repository exploration
  const wsRepos = workspaceService.getWorkspaceRepositories(ws.id, memberId);
  assert(wsRepos.some((r) => r.id === "sample-project"), "Connected repo must appear in workspace listing");

  // Repository access revalidation
  const canAccess = workspaceService.canAccessRepositoryInWorkspace(memberId, ws.id, "sample-project");
  assert(canAccess === true, "Authorized workspace member can access connected repository");
  console.log("  ✔ Shared repository exploration verified with independent authorization checks.");

  // --- TEST 6: Shared Knowledge Artifacts & Stale Revision Detection ---
  console.log("\n▶ TEST 6: Shared Knowledge Artifacts & Stale Revision Detection");
  const artifact = workspaceService.createSharedArtifact(memberId, ws.id, {
    title: "Auth Pipeline Invariants",
    description: "Detailed invariant checklist for authentication token flow.",
    type: "architecture_snapshot",
    repositoryId: "sample-project",
    sourceRevision: "Today at 10:15 AM",
    content: "### Invariant 1: Constant-time comparison on hashes.\n### Invariant 2: Session expiry enforced at 15 minutes.",
  });

  assert(artifact.title === "Auth Pipeline Invariants", "Artifact title must match");
  assert(artifact.creatorId === memberId, "Artifact creator must match");
  assert(artifact.isStale === false, "Freshly created artifact should not be stale");

  // Test Stale Revision Detection
  const staleCheck = workspaceService.checkArtifactFreshness({
    ...artifact,
    sourceRevision: "Old Revision Commit #abc1234",
  });
  assert(staleCheck.isStale === true, "Artifact referencing old commit must be flagged as stale");
  assert(staleCheck.reason !== undefined, "Stale reason must be provided");

  // Artifact edit authorization (member can edit own artifact, viewer cannot)
  const updatedArt = workspaceService.updateSharedArtifact(memberId, ws.id, artifact.id, {
    title: "Auth Pipeline Invariants (Updated v2)",
  });
  assert(updatedArt.title.includes("v2"), "Update must succeed");

  let viewerEditFailed = false;
  try {
    workspaceService.updateSharedArtifact(viewerId, ws.id, artifact.id, {
      title: "Hacked by Viewer",
    });
  } catch (e: any) {
    viewerEditFailed = true;
    assert(e.message.includes("Forbidden"), "Viewer editing another's artifact must be forbidden");
  }
  assert(viewerEditFailed, "Viewer cannot edit shared artifacts");
  console.log("  ✔ Shared artifacts verified: creation, stale revision detection, and permission enforcement.");

  // --- TEST 7: Collaborative Code Annotations ---
  console.log("\n▶ TEST 7: Collaborative Code Notes & Stale Line Detection");
  const note = workspaceService.createAnnotation(memberId, ws.id, {
    repositoryId: "sample-project",
    filePath: "src/services/auth.ts",
    startLine: 18,
    endLine: 42,
    symbolName: "loginUser",
    content: "Team note: Do not refactor password comparison without security peer review.",
    category: "decision",
  });

  assert(note.filePath === "src/services/auth.ts", "File path must match");
  assert(note.startLine === 18, "Start line must match");
  assert(note.category === "decision", "Category must match");
  assert(note.authorId === memberId, "Author must match");

  // Query annotations
  const annotations = workspaceService.getAnnotations(ws.id, "sample-project", "src/services/auth.ts");
  assert(annotations.some((a) => a.id === note.id), "Created note must appear in query");

  // Stale line detection test (e.g. startLine exceeds file lineCount)
  const isStale = workspaceService.checkAnnotationStale(
    { ...note, startLine: 9999 },
    100 // file only has 100 lines
  );
  assert(isStale === true, "Annotation beyond file line count must be marked stale");
  console.log("  ✔ Collaborative code annotations verified with stable symbol references.");

  // --- TEST 8: Shared Code Review Finding Discussions & Audit Tracking ---
  console.log("\n▶ TEST 8: Code Review Finding Discussions & Audit Decision Tracking");
  const reviewSessionId = "rev_phase14_pr101";
  const findingId = "vuln-jwt-secret";

  // Post comments from two different users
  const disc1 = workspaceService.addFindingDiscussion(
    memberId,
    ws.id,
    "sample-project",
    reviewSessionId,
    findingId,
    "Confirmed this issue in staging environment. Missing secret leads to undefined token signing."
  );
  assert(disc1.authorId === memberId, "Discussion 1 author must match");

  const disc2 = workspaceService.addFindingDiscussion(
    adminId,
    ws.id,
    "sample-project",
    reviewSessionId,
    findingId,
    "Approved fix plan. Patch will land in PR #104."
  );
  assert(disc2.authorId === adminId, "Discussion 2 author must match");

  // Query discussions
  const discussions = workspaceService.getFindingDiscussions(ws.id, reviewSessionId, findingId);
  assert(discussions.length >= 2, "Must return both comments");

  // Test Policy Enforcement: Workspace requires reason when dismissing findings
  let dismissWithoutReasonFailed = false;
  try {
    workspaceService.updateFindingDecision(
      memberId,
      ws.id,
      "sample-project",
      reviewSessionId,
      findingId,
      {
        status: "dismissed",
        // no dismissalReason provided
      }
    );
  } catch (e: any) {
    dismissWithoutReasonFailed = true;
    assert(e.message.includes("requires a reason"), "Must enforce dismissal reason policy");
  }
  assert(dismissWithoutReasonFailed, "Dismissal without justification must fail under policy");

  // Acknowledge with assignee
  const decision = workspaceService.updateFindingDecision(
    memberId,
    ws.id,
    "sample-project",
    reviewSessionId,
    findingId,
    {
      status: "acknowledged",
      assigneeId: memberId,
    }
  );
  assert(decision.status === "acknowledged", "Status must be acknowledged");
  assert(decision.assigneeId === memberId, "Assignee must match");
  assert(decision.updatedBy === memberId, "updatedBy must record acting user");
  console.log("  ✔ Shared review finding discussions and audit policy enforcement verified.");

  // --- TEST 9: Team Workspace Activity Feed ---
  console.log("\n▶ TEST 9: Team Workspace Activity Stream & Event Categorization");
  const activityResult = workspaceService.getWorkspaceActivities(ws.id, ownerId, "all", 20);
  assert(activityResult.items.length > 0, "Activity stream must contain logged events");
  assert(activityResult.total >= activityResult.items.length, "Total count must be accurate");

  const repoActivity = workspaceService.getWorkspaceActivities(ws.id, ownerId, "repositories");
  assert(repoActivity.items.every((a) => a.category === "repositories"), "Filtered category must match");
  console.log(`  ✔ Workspace activity feed verified: ${activityResult.items.length} real events captured.`);

  // --- TEST 10: Cross-Workspace Isolation ---
  console.log("\n▶ TEST 10: Cross-Workspace Security & Tenant Isolation");
  const wsOther = workspaceService.createWorkspace(ownerId, {
    name: "Confidential Security Audit Workspace",
    description: "Highly restricted workspace for external vulnerability penetration testing.",
  });

  // User in ws cannot access wsOther without membership
  assert(workspaceService.getMemberRole(memberId, wsOther.id) === null, "Member of ws must NOT have role in wsOther");
  assert(workspaceService.hasPermission(memberId, wsOther.id, "view_workspace") === false, "Member of ws cannot view wsOther");

  let crossAccessDenied = false;
  try {
    workspaceService.getWorkspace(wsOther.id, memberId);
  } catch (e) {
    crossAccessDenied = true;
  }
  // If getWorkspace returns null or throws, access is prevented
  const accessed = workspaceService.getWorkspace(wsOther.id, memberId);
  assert(accessed === null, "Unpermitted user must receive null or forbidden");

  let artifactAccessDenied = false;
  try {
    workspaceService.getSharedArtifacts(wsOther.id, memberId);
  } catch (e: any) {
    artifactAccessDenied = true;
    assert(e.message.includes("Forbidden"), "Must deny artifact access across workspace boundaries");
  }
  assert(artifactAccessDenied, "Cross-workspace artifact leakage strictly blocked");

  // Delete test team workspace
  const delResult = workspaceService.deleteWorkspace(ownerId, wsOther.id);
  assert(delResult.success === true, "Team workspace deletion must succeed");
  console.log("  ✔ Cross-workspace security verified: Zero leakage across workspace boundaries.");

  console.log("\n=========================================================================");
  console.log("✅ ALL PHASE 14 VERIFICATION TESTS PASSED SUCCESSFULLY (10/10)");
  console.log("=========================================================================\n");
}

runPhase14Tests().catch((err) => {
  console.error("\n❌ PHASE 14 TEST SUITE FAILED:", err);
  process.exit(1);
});

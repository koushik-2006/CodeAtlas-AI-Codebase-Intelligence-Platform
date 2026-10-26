import crypto from "crypto";
import { db } from "./db";
import {
  DbWorkspace,
  DbWorkspaceMember,
  DbWorkspaceInvitation,
  DbWorkspaceRepository,
  DbSharedArtifact,
  DbCodeAnnotation,
  DbReviewFindingDiscussion,
  DbFindingDecision,
  DbWorkspaceActivityEvent,
  WorkspaceRole,
  WorkspacePermission,
  WorkspaceSettings,
} from "@/types/workspace";
import { DbRepository, DbUser } from "@/types/database";

export const ROLE_PERMISSIONS: Record<WorkspaceRole, Set<WorkspacePermission>> = {
  owner: new Set([
    "view_workspace",
    "view_repositories",
    "connect_repository",
    "disconnect_repository",
    "run_indexing",
    "access_source_code",
    "view_ai_conversations",
    "manage_artifacts",
    "manage_notes",
    "manage_code_reviews",
    "invite_members",
    "manage_members",
    "change_settings",
    "delete_workspace",
  ]),
  admin: new Set([
    "view_workspace",
    "view_repositories",
    "connect_repository",
    "disconnect_repository",
    "run_indexing",
    "access_source_code",
    "view_ai_conversations",
    "manage_artifacts",
    "manage_notes",
    "manage_code_reviews",
    "invite_members",
    "manage_members",
    "change_settings",
  ]),
  member: new Set([
    "view_workspace",
    "view_repositories",
    "run_indexing",
    "access_source_code",
    "view_ai_conversations",
    "manage_artifacts",
    "manage_notes",
    "manage_code_reviews",
  ]),
  viewer: new Set([
    "view_workspace",
    "view_repositories",
    "access_source_code",
    "view_ai_conversations",
  ]),
};

export class WorkspaceService {
  // --- Workspace Initialization & Helpers ---
  private ensureInitialized() {
    db.ensureWorkspacesSeeded();
  }

  // --- RBAC & Permissions ---
  getMemberRole(userId: string, workspaceId: string): WorkspaceRole | null {
    this.ensureInitialized();
    const members = db.getWorkspaceMembers(workspaceId);
    const member = members.find((m) => m.userId === userId);
    return member ? member.role : null;
  }

  hasPermission(userId: string, workspaceId: string, permission: WorkspacePermission): boolean {
    const role = this.getMemberRole(userId, workspaceId);
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
  }

  // --- Workspaces Management ---
  getWorkspaces(userId: string): Array<DbWorkspace & { userRole: WorkspaceRole; memberCount: number; repoCount: number }> {
    this.ensureInitialized();
    const allWorkspaces = db.getWorkspaces();
    const allMembers = db.getAllWorkspaceMembers();
    const allRepos = db.getAllWorkspaceRepositories();

    const userMemberships = allMembers.filter((m) => m.userId === userId);
    const accessibleWorkspaceIds = new Set(userMemberships.map((m) => m.workspaceId));

    return allWorkspaces
      .filter((ws) => accessibleWorkspaceIds.has(ws.id))
      .map((ws) => {
        const membership = userMemberships.find((m) => m.workspaceId === ws.id);
        const memberCount = allMembers.filter((m) => m.workspaceId === ws.id).length;
        const repoCount = allRepos.filter((r) => r.workspaceId === ws.id).length;
        return {
          ...ws,
          userRole: membership?.role || "viewer",
          memberCount,
          repoCount,
        };
      })
      .sort((a, b) => (a.isPersonal ? -1 : b.isPersonal ? 1 : b.createdAt.localeCompare(a.createdAt)));
  }

  getWorkspace(workspaceId: string, userId: string): (DbWorkspace & { userRole: WorkspaceRole; members: DbWorkspaceMember[]; repoCount: number }) | null {
    this.ensureInitialized();
    const ws = db.getWorkspace(workspaceId);
    if (!ws) return null;

    const role = this.getMemberRole(userId, workspaceId);
    if (!role) return null; // Access denied

    const members = db.getWorkspaceMembers(workspaceId);
    const repos = db.getWorkspaceRepositories(workspaceId);

    return {
      ...ws,
      userRole: role,
      members,
      repoCount: repos.length,
    };
  }

  createWorkspace(
    userId: string,
    data: { name: string; description?: string; settings?: Partial<WorkspaceSettings> }
  ): DbWorkspace {
    this.ensureInitialized();
    const user = db.getUser(userId);
    if (!user) throw new Error("Unauthorized: User not found");

    const trimmedName = data.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error("Workspace name must be at least 2 characters");
    }

    const wsId = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newWorkspace: DbWorkspace = {
      id: wsId,
      name: trimmedName,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      description: data.description?.trim() || "",
      ownerId: userId,
      isPersonal: false,
      settings: {
        allowMemberInvites: data.settings?.allowMemberInvites ?? true,
        defaultRepoId: data.settings?.defaultRepoId,
        requireReviewDismissalReason: data.settings?.requireReviewDismissalReason ?? true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addWorkspace(newWorkspace);

    // Add creator as Owner
    const ownerMember: DbWorkspaceMember = {
      id: `wsm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId: wsId,
      userId,
      role: "owner",
      joinedAt: new Date().toISOString(),
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
    };
    db.addWorkspaceMember(ownerMember);

    this.logActivity({
      workspaceId: wsId,
      category: "settings",
      actorId: userId,
      actorName: user.name,
      action: "created workspace",
      target: newWorkspace.name,
      targetHref: `/workspaces/${wsId}`,
      status: "success",
    });

    return newWorkspace;
  }

  updateWorkspace(
    userId: string,
    workspaceId: string,
    data: { name?: string; description?: string; settings?: Partial<WorkspaceSettings> }
  ): DbWorkspace {
    if (!this.hasPermission(userId, workspaceId, "change_settings")) {
      throw new Error("Forbidden: You do not have permission to change workspace settings");
    }

    const existing = db.getWorkspace(workspaceId);
    if (!existing) throw new Error("Workspace not found");

    const actor = db.getUser(userId);

    const updated: DbWorkspace = {
      ...existing,
      name: data.name?.trim() ? data.name.trim() : existing.name,
      description: data.description !== undefined ? data.description.trim() : existing.description,
      settings: {
        ...existing.settings,
        ...(data.settings || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    db.updateWorkspace(updated);

    this.logActivity({
      workspaceId,
      category: "settings",
      actorId: userId,
      actorName: actor?.name || "Member",
      action: "updated workspace settings",
      target: updated.name,
      targetHref: `/workspaces/${workspaceId}`,
      status: "info",
    });

    return updated;
  }

  deleteWorkspace(userId: string, workspaceId: string): { success: boolean; message: string } {
    const ws = db.getWorkspace(workspaceId);
    if (!ws) throw new Error("Workspace not found");

    if (ws.isPersonal) {
      throw new Error("Cannot delete a personal workspace. Personal workspaces are permanent.");
    }

    if (!this.hasPermission(userId, workspaceId, "delete_workspace")) {
      throw new Error("Forbidden: Only the workspace Owner can delete this workspace");
    }

    db.deleteWorkspace(workspaceId);
    return { success: true, message: `Workspace '${ws.name}' was successfully deleted.` };
  }

  // --- Membership Management ---
  getWorkspaceMembers(workspaceId: string, userId: string): DbWorkspaceMember[] {
    if (!this.hasPermission(userId, workspaceId, "view_workspace")) {
      throw new Error("Forbidden: Access denied to workspace members");
    }
    return db.getWorkspaceMembers(workspaceId);
  }

  updateMemberRole(
    actorId: string,
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole
  ): DbWorkspaceMember {
    if (!this.hasPermission(actorId, workspaceId, "manage_members")) {
      throw new Error("Forbidden: You do not have permission to manage members");
    }

    const actorRole = this.getMemberRole(actorId, workspaceId);
    const members = db.getWorkspaceMembers(workspaceId);
    const targetMember = members.find((m) => m.userId === targetUserId);
    if (!targetMember) throw new Error("Target member not found in workspace");

    // Protection: Admins cannot promote anyone to owner or change owner's role
    if (actorRole === "admin") {
      if (newRole === "owner") {
        throw new Error("Forbidden: Only an Owner can transfer or grant Owner role");
      }
      if (targetMember.role === "owner") {
        throw new Error("Forbidden: Admins cannot change an Owner's role");
      }
    }

    // Protection: Cannot demote the last owner
    if (targetMember.role === "owner" && newRole !== "owner") {
      const owners = members.filter((m) => m.role === "owner");
      if (owners.length <= 1) {
        throw new Error("Forbidden: Cannot demote the last remaining Owner of the workspace. Transfer ownership first.");
      }
    }

    const updated = db.updateWorkspaceMemberRole(workspaceId, targetUserId, newRole);
    const actor = db.getUser(actorId);

    this.logActivity({
      workspaceId,
      category: "members",
      actorId,
      actorName: actor?.name || "Admin",
      action: `changed role for ${targetMember.userName || targetMember.userId} to ${newRole}`,
      target: targetMember.userName || targetMember.userId,
      targetHref: `/workspaces/${workspaceId}`,
      status: "info",
    });

    // Notify the target user
    db.addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: targetUserId,
      title: "Workspace Role Updated",
      description: `Your role in workspace was updated to ${newRole}.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "system",
      href: `/workspaces/${workspaceId}`,
    });

    return updated;
  }

  removeMember(actorId: string, workspaceId: string, targetUserId: string): boolean {
    if (!this.hasPermission(actorId, workspaceId, "manage_members") && actorId !== targetUserId) {
      throw new Error("Forbidden: You do not have permission to remove members");
    }

    const members = db.getWorkspaceMembers(workspaceId);
    const targetMember = members.find((m) => m.userId === targetUserId);
    if (!targetMember) throw new Error("Member not found in workspace");

    const actorRole = this.getMemberRole(actorId, workspaceId);

    // Admins cannot remove owners
    if (actorRole === "admin" && targetMember.role === "owner") {
      throw new Error("Forbidden: Admins cannot remove an Owner");
    }

    // Last-owner protection
    if (targetMember.role === "owner") {
      const owners = members.filter((m) => m.role === "owner");
      if (owners.length <= 1) {
        throw new Error("Forbidden: Cannot remove the last remaining Owner. Transfer ownership before leaving.");
      }
    }

    const success = db.removeWorkspaceMember(workspaceId, targetUserId);
    const actor = db.getUser(actorId);

    if (success) {
      this.logActivity({
        workspaceId,
        category: "members",
        actorId,
        actorName: actor?.name || "User",
        action: actorId === targetUserId ? "left the workspace" : `removed ${targetMember.userName || targetUserId}`,
        target: targetMember.userName || targetUserId,
        status: "warning",
      });
    }

    return success;
  }

  // --- Member Invitations ---
  createInvitation(
    actorId: string,
    workspaceId: string,
    email: string,
    role: "admin" | "member" | "viewer"
  ): DbWorkspaceInvitation {
    if (!this.hasPermission(actorId, workspaceId, "invite_members")) {
      throw new Error("Forbidden: You do not have permission to invite members");
    }

    const ws = db.getWorkspace(workspaceId);
    if (!ws) throw new Error("Workspace not found");
    if (!ws.settings.allowMemberInvites && this.getMemberRole(actorId, workspaceId) !== "owner") {
      throw new Error("Member invites are disabled in this workspace settings");
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please enter a valid email address");
    }

    // Check if already a member
    const existingMembers = db.getWorkspaceMembers(workspaceId);
    const isAlreadyMember = existingMembers.some((m) => m.userEmail?.toLowerCase() === cleanEmail);
    if (isAlreadyMember) {
      throw new Error("User with this email is already a member of this workspace");
    }

    // Check for existing pending invitation
    const pendingInvites = db.getWorkspaceInvitations(workspaceId);
    const activeExisting = pendingInvites.find(
      (inv) => inv.email.toLowerCase() === cleanEmail && inv.status === "pending" && new Date(inv.expiresAt) > new Date()
    );
    if (activeExisting) {
      throw new Error("An active pending invitation already exists for this email address");
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const actor = db.getUser(actorId);

    const invitation: DbWorkspaceInvitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId,
      email: cleanEmail,
      role,
      tokenHash,
      token: rawToken, // Returned for dev workflow/shareable invite link
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: "pending",
      invitedBy: actorId,
      invitedByName: actor?.name || "Teammate",
      createdAt: new Date().toISOString(),
    };

    db.addWorkspaceInvitation(invitation);

    this.logActivity({
      workspaceId,
      category: "members",
      actorId,
      actorName: actor?.name || "Admin",
      action: `invited ${cleanEmail} as ${role}`,
      target: cleanEmail,
      status: "info",
    });

    return invitation;
  }

  getWorkspaceInvitations(workspaceId: string, actorId: string): DbWorkspaceInvitation[] {
    if (!this.hasPermission(actorId, workspaceId, "invite_members")) {
      throw new Error("Forbidden: Access denied to workspace invitations");
    }
    return db.getWorkspaceInvitations(workspaceId);
  }

  getInvitationByToken(token: string): { invitation: DbWorkspaceInvitation; workspace: DbWorkspace } | null {
    this.ensureInitialized();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const all = db.getAllWorkspaceInvitations();
    const inv = all.find((i) => i.tokenHash === tokenHash || i.token === token);
    if (!inv) return null;

    const ws = db.getWorkspace(inv.workspaceId);
    if (!ws) return null;

    // Check if expired
    if (inv.status === "pending" && new Date(inv.expiresAt) < new Date()) {
      db.updateInvitationStatus(inv.id, "expired");
      inv.status = "expired";
    }

    return { invitation: inv, workspace: ws };
  }

  acceptInvitation(userId: string, token: string): { success: boolean; workspace: DbWorkspace } {
    this.ensureInitialized();
    const found = this.getInvitationByToken(token);
    if (!found) throw new Error("Invitation not found or invalid token");

    const { invitation, workspace } = found;
    if (invitation.status !== "pending") {
      throw new Error(`Invitation cannot be accepted because its status is ${invitation.status}`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      db.updateInvitationStatus(invitation.id, "expired");
      throw new Error("This invitation has expired");
    }

    const user = db.getUser(userId);
    if (!user) throw new Error("User not found");

    // Add user as member
    const newMember: DbWorkspaceMember = {
      id: `wsm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId: workspace.id,
      userId,
      role: invitation.role,
      joinedAt: new Date().toISOString(),
      userName: user.name,
      userEmail: user.email,
      userAvatar: user.avatar,
    };

    db.addWorkspaceMember(newMember);
    db.updateInvitationStatus(invitation.id, "accepted", userId);

    this.logActivity({
      workspaceId: workspace.id,
      category: "members",
      actorId: userId,
      actorName: user.name,
      action: `joined workspace via invitation as ${invitation.role}`,
      target: user.name,
      targetHref: `/workspaces/${workspace.id}`,
      status: "success",
    });

    return { success: true, workspace };
  }

  revokeInvitation(actorId: string, workspaceId: string, invitationId: string): boolean {
    if (!this.hasPermission(actorId, workspaceId, "invite_members")) {
      throw new Error("Forbidden: You do not have permission to revoke invitations");
    }
    const inv = db.getWorkspaceInvitation(invitationId);
    if (!inv || inv.workspaceId !== workspaceId) {
      throw new Error("Invitation not found in this workspace");
    }

    const success = db.updateInvitationStatus(invitationId, "revoked");
    const actor = db.getUser(actorId);

    if (success) {
      this.logActivity({
        workspaceId,
        category: "members",
        actorId,
        actorName: actor?.name || "Admin",
        action: `revoked invitation for ${inv.email}`,
        target: inv.email,
        status: "warning",
      });
    }

    return success;
  }

  // --- Shared Repository Exploration ---
  getWorkspaceRepositories(workspaceId: string, userId: string): DbRepository[] {
    if (!this.hasPermission(userId, workspaceId, "view_repositories")) {
      throw new Error("Forbidden: Access denied to workspace repositories");
    }

    const repoAssociations = db.getWorkspaceRepositories(workspaceId);
    const repoIds = new Set(repoAssociations.map((r) => r.repositoryId));

    const allRepos = db.getAllRepositories();
    return allRepos.filter((r) => repoIds.has(r.id));
  }

  connectRepositoryToWorkspace(
    actorId: string,
    workspaceId: string,
    repositoryId: string
  ): DbWorkspaceRepository {
    if (!this.hasPermission(actorId, workspaceId, "connect_repository")) {
      throw new Error("Forbidden: You do not have permission to connect repositories to this workspace");
    }

    // Verify repository exists and actor has access to it
    const repo = db.getRepositoryById(repositoryId);
    if (!repo) throw new Error("Repository not found");

    // Ensure actor owns the repo, or repo is public/sample
    if (repo.visibility === "private" && repo.userId !== actorId) {
      throw new Error("Forbidden: You can only connect repositories you own or have authorized access to");
    }

    const existing = db.getWorkspaceRepositories(workspaceId);
    if (existing.some((r) => r.repositoryId === repositoryId)) {
      throw new Error("Repository is already connected to this workspace");
    }

    const connection: DbWorkspaceRepository = {
      id: `wsr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId,
      repositoryId,
      addedBy: actorId,
      addedAt: new Date().toISOString(),
    };

    db.addWorkspaceRepository(connection);
    const actor = db.getUser(actorId);

    this.logActivity({
      workspaceId,
      category: "repositories",
      actorId,
      actorName: actor?.name || "User",
      action: "connected repository",
      target: repo.name,
      targetHref: `/repositories/${repo.id}`,
      status: "success",
    });

    return connection;
  }

  disconnectRepositoryFromWorkspace(
    actorId: string,
    workspaceId: string,
    repositoryId: string
  ): boolean {
    if (!this.hasPermission(actorId, workspaceId, "disconnect_repository")) {
      throw new Error("Forbidden: You do not have permission to disconnect repositories");
    }

    const repo = db.getRepositoryById(repositoryId);
    const success = db.removeWorkspaceRepository(workspaceId, repositoryId);
    const actor = db.getUser(actorId);

    if (success) {
      this.logActivity({
        workspaceId,
        category: "repositories",
        actorId,
        actorName: actor?.name || "User",
        action: "disconnected repository",
        target: repo?.name || repositoryId,
        status: "warning",
      });
    }

    return success;
  }

  canAccessRepositoryInWorkspace(userId: string, workspaceId: string, repositoryId: string): boolean {
    if (!this.hasPermission(userId, workspaceId, "view_repositories")) return false;
    const wsRepos = db.getWorkspaceRepositories(workspaceId);
    if (!wsRepos.some((r) => r.repositoryId === repositoryId)) return false;

    // Check repository authorization
    const repo = db.getRepositoryById(repositoryId);
    if (!repo) return false;
    if (repo.visibility === "public" || repo.connectionType === "sample") return true;
    if (repo.userId === userId) return true;

    // In a team workspace, connected repos are accessible to permitted members
    return true;
  }

  // --- Shared Knowledge Artifacts ---
  getSharedArtifacts(workspaceId: string, userId: string, type?: string): DbSharedArtifact[] {
    if (!this.hasPermission(userId, workspaceId, "view_workspace")) {
      throw new Error("Forbidden: Access denied to workspace artifacts");
    }

    const artifacts = db.getSharedArtifacts(workspaceId);
    return artifacts
      .filter((a) => {
        if (a.visibility === "private" && a.creatorId !== userId) return false;
        if (type && a.type !== type) return false;
        return true;
      })
      .map((a) => {
        const freshness = this.checkArtifactFreshness(a);
        return { ...a, isStale: freshness.isStale };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getSharedArtifact(workspaceId: string, artifactId: string, userId: string): DbSharedArtifact | null {
    if (!this.hasPermission(userId, workspaceId, "view_workspace")) {
      throw new Error("Forbidden: Access denied");
    }
    const artifact = db.getSharedArtifact(artifactId);
    if (!artifact || artifact.workspaceId !== workspaceId) return null;
    if (artifact.visibility === "private" && artifact.creatorId !== userId) return null;

    const freshness = this.checkArtifactFreshness(artifact);
    return { ...artifact, isStale: freshness.isStale };
  }

  createSharedArtifact(
    actorId: string,
    workspaceId: string,
    data: {
      repositoryId?: string;
      title: string;
      description: string;
      type: DbSharedArtifact["type"];
      content: string;
      sourceRevision?: string;
      visibility?: "workspace" | "private";
      metadata?: Record<string, any>;
    }
  ): DbSharedArtifact {
    if (!this.hasPermission(actorId, workspaceId, "manage_artifacts")) {
      throw new Error("Forbidden: You do not have permission to create artifacts in this workspace");
    }

    const actor = db.getUser(actorId);
    const repo = data.repositoryId ? db.getRepositoryById(data.repositoryId) : null;

    const newArtifact: DbSharedArtifact = {
      id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId,
      repositoryId: data.repositoryId,
      title: data.title.trim(),
      description: data.description.trim(),
      type: data.type,
      creatorId: actorId,
      creatorName: actor?.name || "Workspace Member",
      creatorAvatar: actor?.avatar,
      sourceRevision: data.sourceRevision || repo?.lastAnalyzed || new Date().toISOString(),
      content: data.content,
      metadata: data.metadata || {},
      visibility: data.visibility || "workspace",
      isStale: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addSharedArtifact(newArtifact);

    this.logActivity({
      workspaceId,
      category: "artifacts",
      actorId,
      actorName: actor?.name || "Member",
      action: `created shared artifact: ${newArtifact.title}`,
      target: newArtifact.title,
      targetHref: `/workspaces/${workspaceId}?tab=artifacts&art=${newArtifact.id}`,
      status: "success",
    });

    return newArtifact;
  }

  updateSharedArtifact(
    actorId: string,
    workspaceId: string,
    artifactId: string,
    data: Partial<Pick<DbSharedArtifact, "title" | "description" | "content" | "visibility">>
  ): DbSharedArtifact {
    const artifact = db.getSharedArtifact(artifactId);
    if (!artifact || artifact.workspaceId !== workspaceId) {
      throw new Error("Artifact not found in this workspace");
    }

    const actorRole = this.getMemberRole(actorId, workspaceId);
    const isCreator = artifact.creatorId === actorId;
    const canManageAll = actorRole === "owner" || actorRole === "admin";

    if (!isCreator && !canManageAll) {
      throw new Error("Forbidden: Only the artifact creator or workspace admins can edit this artifact");
    }

    const updated: DbSharedArtifact = {
      ...artifact,
      title: data.title !== undefined ? data.title.trim() : artifact.title,
      description: data.description !== undefined ? data.description.trim() : artifact.description,
      content: data.content !== undefined ? data.content : artifact.content,
      visibility: data.visibility || artifact.visibility,
      updatedAt: new Date().toISOString(),
    };

    db.updateSharedArtifact(updated);
    const actor = db.getUser(actorId);

    this.logActivity({
      workspaceId,
      category: "artifacts",
      actorId,
      actorName: actor?.name || "Member",
      action: `updated artifact: ${updated.title}`,
      target: updated.title,
      targetHref: `/workspaces/${workspaceId}?tab=artifacts&art=${updated.id}`,
      status: "info",
    });

    return updated;
  }

  deleteSharedArtifact(actorId: string, workspaceId: string, artifactId: string): boolean {
    const artifact = db.getSharedArtifact(artifactId);
    if (!artifact || artifact.workspaceId !== workspaceId) {
      throw new Error("Artifact not found in this workspace");
    }

    const actorRole = this.getMemberRole(actorId, workspaceId);
    const isCreator = artifact.creatorId === actorId;
    const canManageAll = actorRole === "owner" || actorRole === "admin";

    if (!isCreator && !canManageAll) {
      throw new Error("Forbidden: Only the artifact creator or workspace admins can delete this artifact");
    }

    const success = db.deleteSharedArtifact(artifactId);
    const actor = db.getUser(actorId);

    if (success) {
      this.logActivity({
        workspaceId,
        category: "artifacts",
        actorId,
        actorName: actor?.name || "Member",
        action: `deleted artifact: ${artifact.title}`,
        target: artifact.title,
        status: "warning",
      });
    }

    return success;
  }

  checkArtifactFreshness(artifact: DbSharedArtifact): { isStale: boolean; currentRevision?: string; reason?: string } {
    if (!artifact.repositoryId || !artifact.sourceRevision) {
      return { isStale: false };
    }

    const repo = db.getRepositoryById(artifact.repositoryId);
    if (!repo) {
      return { isStale: true, reason: "Referenced repository no longer exists" };
    }

    // If repo was re-analyzed after artifact creation, flag as stale
    if (repo.lastAnalyzed && repo.lastAnalyzed !== artifact.sourceRevision) {
      return {
        isStale: true,
        currentRevision: repo.lastAnalyzed,
        reason: "Repository index has changed since this artifact was generated",
      };
    }

    return { isStale: false, currentRevision: repo.lastAnalyzed };
  }

  // --- Collaborative Code Annotations ---
  getAnnotations(workspaceId: string, repositoryId: string, filePath?: string): DbCodeAnnotation[] {
    const all = db.getAnnotations(workspaceId, repositoryId);
    return filePath ? all.filter((a) => a.filePath === filePath) : all;
  }

  createAnnotation(
    actorId: string,
    workspaceId: string,
    data: {
      repositoryId: string;
      filePath: string;
      startLine: number;
      endLine: number;
      symbolName?: string;
      content: string;
      category?: DbCodeAnnotation["category"];
    }
  ): DbCodeAnnotation {
    if (!this.hasPermission(actorId, workspaceId, "manage_notes")) {
      throw new Error("Forbidden: You do not have permission to add notes in this workspace");
    }

    const actor = db.getUser(actorId);
    const file = db.getFileByPath(data.repositoryId, data.filePath);
    const isStale = file ? data.startLine > file.lineCount : false;

    const annotation: DbCodeAnnotation = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId,
      repositoryId: data.repositoryId,
      filePath: data.filePath,
      startLine: data.startLine,
      endLine: data.endLine,
      symbolName: data.symbolName,
      content: data.content.trim(),
      category: data.category || "architecture",
      authorId: actorId,
      authorName: actor?.name || "Teammate",
      authorAvatar: actor?.avatar,
      isStale,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addAnnotation(annotation);

    this.logActivity({
      workspaceId,
      category: "annotations",
      actorId,
      actorName: actor?.name || "Member",
      action: `added code note on ${data.filePath}:${data.startLine}`,
      target: data.symbolName || data.filePath,
      targetHref: `/repositories/${data.repositoryId}?file=${encodeURIComponent(data.filePath)}&line=${data.startLine}`,
      status: "info",
    });

    return annotation;
  }

  updateAnnotation(
    actorId: string,
    workspaceId: string,
    annotationId: string,
    content: string
  ): DbCodeAnnotation {
    const ann = db.getAnnotation(annotationId);
    if (!ann || ann.workspaceId !== workspaceId) {
      throw new Error("Annotation not found in this workspace");
    }

    const actorRole = this.getMemberRole(actorId, workspaceId);
    if (ann.authorId !== actorId && actorRole !== "owner" && actorRole !== "admin") {
      throw new Error("Forbidden: Only the author or workspace admins can edit this note");
    }

    const updated: DbCodeAnnotation = {
      ...ann,
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };

    db.updateAnnotation(updated);
    return updated;
  }

  deleteAnnotation(actorId: string, workspaceId: string, annotationId: string): boolean {
    const ann = db.getAnnotation(annotationId);
    if (!ann || ann.workspaceId !== workspaceId) {
      throw new Error("Annotation not found in this workspace");
    }

    const actorRole = this.getMemberRole(actorId, workspaceId);
    if (ann.authorId !== actorId && actorRole !== "owner" && actorRole !== "admin") {
      throw new Error("Forbidden: Only the author or workspace admins can delete this note");
    }

    return db.deleteAnnotation(annotationId);
  }

  checkAnnotationStale(annotation: DbCodeAnnotation, fileLinesCount: number): boolean {
    if (fileLinesCount <= 0) return true;
    return annotation.startLine > fileLinesCount;
  }

  // --- Shared Code Review & Finding Discussions ---
  getFindingDiscussions(
    workspaceId: string,
    reviewSessionId: string,
    findingId: string
  ): DbReviewFindingDiscussion[] {
    return db.getFindingDiscussions(workspaceId, reviewSessionId, findingId);
  }

  addFindingDiscussion(
    actorId: string,
    workspaceId: string,
    repositoryId: string,
    reviewSessionId: string,
    findingId: string,
    comment: string
  ): DbReviewFindingDiscussion {
    if (!this.hasPermission(actorId, workspaceId, "manage_code_reviews")) {
      throw new Error("Forbidden: You do not have permission to post comments in this workspace");
    }

    const trimmed = comment.trim();
    if (!trimmed) throw new Error("Comment cannot be empty");

    const actor = db.getUser(actorId);

    const discussion: DbReviewFindingDiscussion = {
      id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workspaceId,
      repositoryId,
      reviewSessionId,
      findingId,
      authorId: actorId,
      authorName: actor?.name || "Reviewer",
      authorAvatar: actor?.avatar,
      comment: trimmed,
      createdAt: new Date().toISOString(),
    };

    db.addFindingDiscussion(discussion);

    this.logActivity({
      workspaceId,
      category: "reviews",
      actorId,
      actorName: actor?.name || "Reviewer",
      action: "commented on code review finding",
      target: findingId,
      targetHref: `/code-review?repoId=${repositoryId}&reviewId=${reviewSessionId}`,
      status: "info",
    });

    return discussion;
  }

  getFindingDecision(
    workspaceId: string,
    reviewSessionId: string,
    findingId: string
  ): DbFindingDecision | null {
    return db.getFindingDecision(workspaceId, reviewSessionId, findingId);
  }

  updateFindingDecision(
    actorId: string,
    workspaceId: string,
    repositoryId: string,
    reviewSessionId: string,
    findingId: string,
    data: {
      status: "open" | "acknowledged" | "dismissed";
      dismissalReason?: string;
      assigneeId?: string;
    }
  ): DbFindingDecision {
    if (!this.hasPermission(actorId, workspaceId, "manage_code_reviews")) {
      throw new Error("Forbidden: You do not have permission to update review findings");
    }

    const ws = db.getWorkspace(workspaceId);
    if (ws?.settings.requireReviewDismissalReason && data.status === "dismissed") {
      if (!data.dismissalReason || !data.dismissalReason.trim()) {
        throw new Error("Workspace policy requires a reason when dismissing review findings");
      }
    }

    const actor = db.getUser(actorId);
    let assigneeName: string | undefined;
    if (data.assigneeId) {
      const assigneeUser = db.getUser(data.assigneeId);
      assigneeName = assigneeUser?.name;
    }

    const decision: DbFindingDecision = {
      id: `dec_${reviewSessionId}_${findingId}`,
      workspaceId,
      repositoryId,
      reviewSessionId,
      findingId,
      status: data.status,
      dismissalReason: data.dismissalReason?.trim(),
      assigneeId: data.assigneeId,
      assigneeName,
      updatedBy: actorId,
      updatedByName: actor?.name || "Reviewer",
      updatedAt: new Date().toISOString(),
    };

    db.saveFindingDecision(decision);

    this.logActivity({
      workspaceId,
      category: "reviews",
      actorId,
      actorName: actor?.name || "Reviewer",
      action: `marked finding ${findingId} as ${data.status}${assigneeName ? ` (assigned to ${assigneeName})` : ""}`,
      target: findingId,
      targetHref: `/code-review?repoId=${repositoryId}&reviewId=${reviewSessionId}`,
      status: data.status === "dismissed" ? "warning" : "success",
    });

    // Notify assignee if assigned to someone else
    if (data.assigneeId && data.assigneeId !== actorId) {
      db.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: data.assigneeId,
        title: "Review Finding Assigned",
        description: `${actor?.name || "A teammate"} assigned a code review finding to you in ${ws?.name}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: "review",
        href: `/code-review?repoId=${repositoryId}&reviewId=${reviewSessionId}`,
      });
    }

    return decision;
  }

  // --- Workspace Activity Feed ---
  getWorkspaceActivities(
    workspaceId: string,
    userId: string,
    category?: string,
    limit: number = 50,
    offset: number = 0
  ): { items: DbWorkspaceActivityEvent[]; total: number } {
    if (!this.hasPermission(userId, workspaceId, "view_workspace")) {
      throw new Error("Forbidden: Access denied to workspace activities");
    }

    const all = db.getWorkspaceActivities(workspaceId);
    const filtered = category && category !== "all" ? all.filter((a) => a.category === category) : all;
    const sorted = [...filtered].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return {
      items: sorted.slice(offset, offset + limit),
      total: sorted.length,
    };
  }

  logActivity(event: Omit<DbWorkspaceActivityEvent, "id" | "timestamp">): DbWorkspaceActivityEvent {
    const fullEvent: DbWorkspaceActivityEvent = {
      ...event,
      id: `ws_act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    db.addWorkspaceActivity(fullEvent);
    return fullEvent;
  }
}

export const workspaceService = new WorkspaceService();

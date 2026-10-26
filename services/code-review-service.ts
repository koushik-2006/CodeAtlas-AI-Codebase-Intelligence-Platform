import {
  PullRequestDetail,
  ReviewSession,
  FindingStatus,
} from "@/types/review";

class CodeReviewService {
  async getPullRequests(
    repositoryId: string = "sample-project",
    state: "open" | "closed" | "all" = "open"
  ): Promise<any[]> {
    try {
      const res = await fetch(
        `/api/github/pulls?repoId=${encodeURIComponent(repositoryId)}&state=${state}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch (err) {
      console.warn("Failed to fetch pull requests:", err);
    }
    return [];
  }

  async getPullRequestDetail(
    repositoryId: string = "sample-project",
    pullNumber: number = 101
  ): Promise<PullRequestDetail | null> {
    try {
      const res = await fetch(
        `/api/github/pulls/${pullNumber}?repoId=${encodeURIComponent(repositoryId)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn("Failed to fetch pull request detail:", err);
    }
    return null;
  }

  async runCodeReview(
    repositoryId: string = "sample-project",
    pullRequestNumber: number = 101,
    isSecurityReviewOnly: boolean = false
  ): Promise<ReviewSession | null> {
    try {
      const res = await fetch("/api/review/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId,
          pullRequestNumber,
          isSecurityReviewOnly,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.error("Code review execution failed:", err);
    }
    return null;
  }

  async getReviewSession(
    repositoryId: string,
    pullRequestNumber: number
  ): Promise<ReviewSession | null> {
    try {
      const res = await fetch(
        `/api/review/session?repoId=${encodeURIComponent(repositoryId)}&prNumber=${pullRequestNumber}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn("Failed to retrieve review session:", err);
    }
    return null;
  }

  async updateFindingStatus(
    sessionId: string,
    findingId: string,
    status: FindingStatus,
    dismissReason?: string
  ): Promise<boolean> {
    try {
      const res = await fetch("/api/review/finding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          findingId,
          status,
          dismissReason,
        }),
      });
      const json = await res.json();
      return Boolean(json.success);
    } catch (err) {
      console.error("Failed to update finding status:", err);
      return false;
    }
  }

  async publishCommentToGitHub(
    repositoryId: string,
    pullRequestNumber: number,
    findingId: string,
    commentBody: string
  ): Promise<{ success: boolean; commentUrl?: string; message?: string }> {
    try {
      const res = await fetch("/api/review/publish-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId,
          pullRequestNumber,
          findingId,
          commentBody,
        }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to publish comment" };
    }
  }
}

export const codeReviewService = new CodeReviewService();

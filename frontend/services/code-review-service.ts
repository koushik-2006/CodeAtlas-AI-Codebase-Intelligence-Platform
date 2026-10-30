import {
  PullRequestDetail,
  ReviewSession,
  FindingStatus,
} from "@/types/review";
import { apiClient } from "./api-client";

class CodeReviewService {
  async getPullRequests(
    repositoryId: string = "sample-project",
    state: "open" | "closed" | "all" = "open"
  ): Promise<any[]> {
    try {
      const res = await apiClient.get<any>(
        `/api/github/pulls?repoId=${encodeURIComponent(repositoryId)}&state=${state}`
      );
      const json = res.data || {};
      const list = Array.isArray(res.data) ? res.data : json.data;
      if (res.success && Array.isArray(list)) {
        return list;
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
      const res = await apiClient.get<any>(
        `/api/github/pulls/${pullNumber}?repoId=${encodeURIComponent(repositoryId)}`
      );
      const json = res.data || {};
      if (res.success && (json.data || json.pullRequest)) {
        return json.data || json.pullRequest || json;
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
      const res = await apiClient.post<any>("/api/review/analyze", {
        repositoryId,
        pullRequestNumber,
        isSecurityReviewOnly,
      });
      const json = res.data || {};
      if (res.success && (json.data || json.session)) {
        return json.data || json.session || json;
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
      const res = await apiClient.get<any>(
        `/api/review/session?repoId=${encodeURIComponent(repositoryId)}&prNumber=${pullRequestNumber}`
      );
      const json = res.data || {};
      if (res.success && (json.data || json.session)) {
        return json.data || json.session || json;
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
      const res = await apiClient.patch<any>("/api/review/finding", {
        sessionId,
        findingId,
        status,
        dismissReason,
      });
      return res.success;
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
      const res = await apiClient.post<any>("/api/review/publish-comment", {
        repositoryId,
        pullRequestNumber,
        findingId,
        commentBody,
      });
      const json = res.data || {};
      return {
        success: res.success,
        commentUrl: json.commentUrl,
        message: json.message || res.message,
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to publish comment" };
    }
  }
}

export const codeReviewService = new CodeReviewService();

/**
 * CodeAtlas Code Review Service
 * Operates client-side with shared store persistence, local static checks,
 * and direct Firebase AI Logic (Gemini Flash) review execution.
 */

import {
  PullRequestDetail,
  ReviewSession,
  FindingStatus,
  ReviewFinding,
} from "@/types/review";
import {
  getPullRequests as getStorePullRequests,
  getPullRequestById,
  updateFindingDecision,
  addInlineComment,
  getStore,
  saveStore,
  logActivity,
} from "@/lib/demo/store";
import { executeAIReview } from "@/lib/demo/review-engine";

class CodeReviewService {
  async getPullRequests(
    repositoryId: string = "sample-project",
    sourceFilter: string = "all",
    tabFilter: string = "open"
  ): Promise<PullRequestDetail[]> {
    return getStorePullRequests(repositoryId, sourceFilter, tabFilter);
  }

  async getPullRequestDetail(
    repositoryId: string = "sample-project",
    pullNumber: number | string = 101
  ): Promise<PullRequestDetail | null> {
    return getPullRequestById(pullNumber);
  }

  async runCodeReview(
    repositoryId: string = "sample-project",
    pullRequestNumber: number | string = 101,
    isSecurityReviewOnly: boolean = false,
    onChunk?: (text: string) => void,
    signal?: AbortSignal
  ): Promise<ReviewSession | null> {
    const pr = getPullRequestById(pullRequestNumber);
    if (!pr) return null;

    try {
      const result = await executeAIReview(pr, {
        isSecurityOnly: isSecurityReviewOnly,
        onChunk,
        signal,
      });

      const store = getStore();
      if (!store.reviewSessions) store.reviewSessions = {};

      const sessionKey = `${repositoryId}_${pr.number}`;
      const session: ReviewSession = {
        id: `rev_session_${sessionKey}_${Date.now()}`,
        repositoryId,
        pullRequestId: pr.id,
        pullRequestNumber: pr.number,
        commitSha: pr.headSha,
        createdAt: new Date().toISOString(),
        summary: result.summary.risk || result.summary.what,
        findings: result.findings,
        affectedComponents: result.affectedComponents,
        relatedTests: result.relatedTests,
        isSecurityReviewOnly,
        isStale: false,
        isSimulated: false,
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
      };

      store.reviewSessions[sessionKey] = session;

      // Update PR metadata with risk score & AI summary
      const prInStore = store.pullRequests?.find((p: any) => p.id === pr.id);
      if (prInStore) {
        prInStore.riskScore = result.riskScore;
        prInStore.riskLevel = result.riskLevel;
        prInStore.aiSummary = result.summary;
      }

      saveStore(store);
      return session;
    } catch (err: any) {
      console.error("Code review execution failed:", err);
      return null;
    }
  }

  async getReviewSession(
    repositoryId: string,
    pullRequestNumber: number | string
  ): Promise<ReviewSession | null> {
    const store = getStore();
    const sessionKey = `${repositoryId}_${pullRequestNumber}`;
    return store.reviewSessions?.[sessionKey] || null;
  }

  async updateFindingStatus(
    sessionId: string,
    findingId: string,
    status: FindingStatus,
    reason?: string,
    prId?: string
  ): Promise<boolean> {
    const targetPrId = prId || sessionId.split("_")[2] || "pr_101";
    return updateFindingDecision(targetPrId, findingId, status, reason);
  }

  async publishCommentToGitHub(
    repositoryId: string,
    pullRequestNumber: number,
    findingId: string,
    commentBody: string
  ): Promise<{ success: boolean; commentUrl?: string; message?: string }> {
    const pr = getPullRequestById(pullRequestNumber);
    if (!pr) return { success: false, message: "PR not found" };

    // Record comment into PR timeline and inline comments
    addInlineComment(pr.id, {
      file: pr.files?.[0]?.filename || "src/main.ts",
      line: 1,
      text: commentBody,
    });

    logActivity({
      type: "review_comment_published",
      title: `Published Review Comment on PR #${pullRequestNumber}`,
      description: commentBody.slice(0, 100),
      href: `/code-review?pr=${pr.id}`,
      status: "success",
    });

    return {
      success: true,
      commentUrl: `https://github.com/codeatlas-demo/${repositoryId}/pull/${pullRequestNumber}#issuecomment-${Date.now()}`,
      message: "Review comment published and recorded in audit trail.",
    };
  }
}

export const codeReviewService = new CodeReviewService();

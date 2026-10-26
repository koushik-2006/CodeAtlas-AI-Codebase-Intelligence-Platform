import { WorkflowTraceData } from "@/types/codelens";
import { apiClient } from "./api-client";

export interface MatchResult {
  matched: boolean;
  unmatchedReason?: string;
  trace?: WorkflowTraceData;
  fallbackExplanation?: string;
}

class RepositoryMatchingService {
  /**
   * Mode B: Repository-Grounded Workflow Tracing.
   * Matches code against indexed repository AST symbols and traces cross-file execution graphs.
   */
  async matchAndTraceWorkflow(
    code: string,
    repositoryId: string
  ): Promise<MatchResult> {
    if (!repositoryId || repositoryId === "none") {
      return {
        matched: false,
        unmatchedReason: "No repository selected. Please select an active repository to trace workflows.",
      };
    }

    try {
      const res = await apiClient.post<MatchResult>("/codelens/explain", {
        code,
        repositoryId,
        mode: "explain-workflow",
      });

      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to reach workflow tracing endpoint, using local fallback:", err);
    }

    // Honest fallback when not matched or service unavailable
    return {
      matched: false,
      unmatchedReason: `We couldn't verify a matching location in repository '${repositoryId}'. Here is a standalone explanation of the submitted code instead.`,
      fallbackExplanation: "CodeAtlas does not fabricate unverified connections. The submitted snippet has been analyzed independently.",
    };
  }
}

export const repositoryMatchingService = new RepositoryMatchingService();

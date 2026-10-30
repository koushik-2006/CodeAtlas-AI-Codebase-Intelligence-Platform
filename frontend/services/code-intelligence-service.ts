import { KnowledgeGraphData, KnowledgeGraphQueryOptions } from "@/types/knowledge-graph";
import { RepositoryOverviewData, OnboardingJourneyData } from "@/types/onboarding";
import { SymbolNavigationResult } from "@/types/symbol-navigation";
import { WorkflowTraceData, AvailableWorkflowEntryPoint } from "@/types/workflow-trace";
import { RepositoryLearningPath } from "@/types/learning-path";
import { RepositoryHealthScore } from "@/types/health-insights";
import { apiClient } from "./api-client";

class CodeIntelligenceService {
  async getKnowledgeGraph(
    repoId: string = "sample-project",
    options?: KnowledgeGraphQueryOptions
  ): Promise<KnowledgeGraphData | null> {
    try {
      const params = new URLSearchParams();
      if (options?.nodeTypes) params.set("nodeTypes", options.nodeTypes.join(","));
      if (options?.verifiedOnly) params.set("verifiedOnly", "true");
      if (options?.searchQuery) params.set("q", options.searchQuery);
      if (options?.focusNodeId) params.set("focus", options.focusNodeId);
      if (options?.neighborhoodRadius) params.set("radius", String(options.neighborhoodRadius));
      if (options?.limit) params.set("limit", String(options.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const res = await apiClient.get<any>(`/api/repositories/${encodeURIComponent(repoId)}/knowledge-graph${queryStr}`);
      const json = res.data || {};
      if (res.success && (json.data || json.nodes)) return json.data || json;
    } catch (e) {
      console.warn("Failed to fetch knowledge graph:", e);
    }
    return null;
  }

  async getOnboardingData(
    repoId: string = "sample-project"
  ): Promise<{ overview: RepositoryOverviewData; journey: OnboardingJourneyData } | null> {
    try {
      const res = await apiClient.get<any>(`/api/repositories/${encodeURIComponent(repoId)}/onboarding`);
      const json = res.data || {};
      if (res.success && (json.data || json.overview)) return json.data || json;
    } catch (e) {
      console.warn("Failed to fetch onboarding data:", e);
    }
    return null;
  }

  async completeOnboardingStep(repoId: string, stepId: string): Promise<OnboardingJourneyData | null> {
    try {
      const res = await apiClient.post<any>(`/api/repositories/${encodeURIComponent(repoId)}/onboarding`, {
        stepId,
      });
      const json = res.data || {};
      if (res.success && (json.data || json.journey)) return json.data || json;
    } catch (e) {
      console.warn("Failed to complete onboarding step:", e);
    }
    return null;
  }

  async navigateSymbol(
    repoId: string,
    file: string,
    line: number,
    symbol?: string
  ): Promise<SymbolNavigationResult | null> {
    try {
      const params = new URLSearchParams({ file, line: String(line) });
      if (symbol) params.set("symbol", symbol);

      const res = await apiClient.get<any>(`/api/repositories/${encodeURIComponent(repoId)}/symbols/navigate?${params.toString()}`);
      const json = res.data || {};
      if (res.success && (json.data || json.target)) return json.data || json;
    } catch (e) {
      console.warn("Failed to navigate symbol:", e);
    }
    return null;
  }

  async getWorkflowTrace(
    repoId: string = "sample-project",
    entryPoint: string = "handleSubmit"
  ): Promise<{ trace: WorkflowTraceData; availableEntryPoints: AvailableWorkflowEntryPoint[] } | null> {
    try {
      const res = await apiClient.get<any>(
        `/api/repositories/${encodeURIComponent(repoId)}/workflow-trace?entryPoint=${encodeURIComponent(entryPoint)}`
      );
      const json = res.data || {};
      if (res.success && (json.data || json.trace)) return json.data || json;
    } catch (e) {
      console.warn("Failed to fetch workflow trace:", e);
    }
    return null;
  }

  async getLearningPath(repoId: string = "sample-project"): Promise<RepositoryLearningPath | null> {
    try {
      const res = await apiClient.get<any>(`/api/repositories/${encodeURIComponent(repoId)}/learning-path`);
      const json = res.data || {};
      if (res.success && (json.data || json.modules)) return json.data || json;
    } catch (e) {
      console.warn("Failed to fetch learning path:", e);
    }
    return null;
  }

  async toggleLearningPathStep(repoId: string, stepId: string): Promise<RepositoryLearningPath | null> {
    try {
      const res = await apiClient.post<any>(`/api/repositories/${encodeURIComponent(repoId)}/learning-path`, {
        stepId,
      });
      const json = res.data || {};
      if (res.success && (json.data || json.modules)) return json.data || json;
    } catch (e) {
      console.warn("Failed to toggle learning step:", e);
    }
    return null;
  }

  async getHealthInsights(repoId: string = "sample-project"): Promise<RepositoryHealthScore | null> {
    try {
      const res = await apiClient.get<any>(`/api/repositories/${encodeURIComponent(repoId)}/health-insights`);
      const json = res.data || {};
      if (res.success && (json.data || json.score !== undefined)) return json.data || json;
    } catch (e) {
      console.warn("Failed to fetch health insights:", e);
    }
    return null;
  }

  async dismissHealthInsight(repoId: string, insightId: string): Promise<RepositoryHealthScore | null> {
    try {
      const res = await apiClient.post<any>(`/api/repositories/${encodeURIComponent(repoId)}/health-insights`, {
        insightId,
      });
      const json = res.data || {};
      if (res.success && (json.data || json.score !== undefined)) return json.data || json;
    } catch (e) {
      console.warn("Failed to dismiss health insight:", e);
    }
    return null;
  }
}

export const codeIntelligenceService = new CodeIntelligenceService();

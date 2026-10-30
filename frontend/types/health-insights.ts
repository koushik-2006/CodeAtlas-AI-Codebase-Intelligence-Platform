export type HealthInsightCategory =
  | "circular_dependency"
  | "god_module"
  | "untested_symbol"
  | "orphan_symbol"
  | "complexity"
  | "stale_index";

export type HealthInsightSeverity = "high" | "medium" | "low" | "info";

export interface HealthInsightEvidence {
  file: string;
  line?: number;
  metricLabel: string;
  metricValue: string | number;
  detail: string;
}

export interface HealthInsight {
  id: string;
  category: HealthInsightCategory;
  severity: HealthInsightSeverity;
  title: string;
  description: string;
  evidence: HealthInsightEvidence;
  recommendation: string;
  isHeuristic: boolean; // clearly distinguishes measured static facts from heuristic suggestions
  isDismissed: boolean;
}

export interface RepositoryHealthScore {
  repositoryId: string;
  overallScore: number; // 0 - 100
  testCoverageRatio: number; // 0 - 1.0
  modularityScore: number; // 0 - 100
  circularDependencyCount: number;
  totalInsightsCount: number;
  activeInsightsCount: number;
  insights: HealthInsight[];
  lastCalculated: string;
}

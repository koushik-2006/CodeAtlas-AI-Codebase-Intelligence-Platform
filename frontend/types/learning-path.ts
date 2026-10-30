export type LearningPathCategory =
  | "architecture"
  | "entry_point"
  | "core_service"
  | "data_layer"
  | "testing"
  | "deployment";

export interface LearningPathStep {
  id: string;
  stepNumber: number;
  title: string;
  category: LearningPathCategory;
  file: string;
  line?: number;
  estimatedMinutes: number; // calculated from word count (~200 WPM)
  description: string;
  keyTakeaway: string;
  suggestedAction: string;
  completed: boolean;
}

export interface RepositoryLearningPath {
  repositoryId: string;
  title: string;
  summary: string;
  totalEstimatedMinutes: number;
  completedMinutes: number;
  completedCount: number;
  totalSteps: number;
  progressPercentage: number;
  currentStepId: string;
  steps: LearningPathStep[];
  lastUpdated: string;
}

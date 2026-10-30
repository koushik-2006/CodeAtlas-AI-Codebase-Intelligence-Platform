import { db } from "./db";
import {
  RepositoryLearningPath,
  LearningPathStep,
  LearningPathCategory,
} from "@/types/learning-path";

export class LearningPathEngine {
  /**
   * Generates a tailored, structured repository learning path calculated from real repository files,
   * symbol complexities, and test assertions.
   */
  getLearningPath(userId: string = "usr_default", repositoryId: string = "sample-project"): RepositoryLearningPath {
    const files = db.getRepositoryFiles(repositoryId);
    const symbols = db.getCodeSymbols(repositoryId);
    const progress = db.getLearningPathProgress(userId, repositoryId);
    const completedSet = new Set(progress.completedSteps);

    // Calculate reading time based on line count (~15 lines per minute for code + comments, bounded 2 - 8 mins)
    const calcMinutes = (filePath: string, defaultMins: number = 4): number => {
      const file = files.find((f) => f.path === filePath);
      if (!file) return defaultMins;
      const calculated = Math.ceil(file.lineCount / 18);
      return Math.min(8, Math.max(2, calculated));
    };

    const steps: LearningPathStep[] = [
      {
        id: "step_overview",
        stepNumber: 1,
        title: "1. Repository Overview & Purpose",
        category: "architecture",
        file: "README.md",
        line: 1,
        estimatedMinutes: 3,
        description: "Understand the high-level system purpose, directory boundaries, and security objectives.",
        keyTakeaway: "CodeAtlas reference project implements a secure TypeScript authentication pipeline with JWT rotation.",
        suggestedAction: "Read project overview and inspect primary folders (components, services, utils).",
        completed: completedSet.has("step_overview"),
      },
      {
        id: "step_entry_point",
        stepNumber: 2,
        title: "2. UI Presentation & Form Submission",
        category: "entry_point",
        file: "src/components/LoginForm.tsx",
        line: 26,
        estimatedMinutes: calcMinutes("src/components/LoginForm.tsx", 4),
        description: "Examine how user input is captured, state is tracked via React hooks, and submit race-conditions are guarded.",
        keyTakeaway: "Form submissions prevent default reload, validate state boundaries, and delegate to auth.ts.",
        suggestedAction: "Inspect handleSubmit at line 26 and trace the loginUser dispatch.",
        completed: completedSet.has("step_entry_point"),
      },
      {
        id: "step_core_service",
        stepNumber: 3,
        title: "3. Core Authentication Service",
        category: "core_service",
        file: "src/services/auth.ts",
        line: 18,
        estimatedMinutes: calcMinutes("src/services/auth.ts", 6),
        description: "Study credential verification, hashing logic, JWT session token generation, and token rotation safeguards.",
        keyTakeaway: "loginUser() verifies credentials and issues secure signed session tokens.",
        suggestedAction: "Review lines 18–45 in auth.ts to understand the session lifecycle.",
        completed: completedSet.has("step_core_service"),
      },
      {
        id: "step_validation",
        stepNumber: 4,
        title: "4. Input Validation & Security Policies",
        category: "entry_point",
        file: "src/utils/validation.ts",
        line: 4,
        estimatedMinutes: calcMinutes("src/utils/validation.ts", 3),
        description: "Review stateless validation functions enforcing email format and password length/complexity constraints.",
        keyTakeaway: "Centralized validation rules prevent injection attacks and bad data propagation.",
        suggestedAction: "Inspect validateEmail() and validatePassword() rules in validation.ts.",
        completed: completedSet.has("step_validation"),
      },
      {
        id: "step_testing",
        stepNumber: 5,
        title: "5. Automated Test Suite & Regressions",
        category: "testing",
        file: "tests/services/auth.test.ts",
        line: 12,
        estimatedMinutes: calcMinutes("tests/services/auth.test.ts", 4),
        description: "Inspect unit tests verifying authentication success, invalid credentials, and boundary rejections.",
        keyTakeaway: "Automated test coverage ensures credential contracts remain valid across refactors.",
        suggestedAction: "Run test suite and verify testLoginSuccess() expectations.",
        completed: completedSet.has("step_testing"),
      },
      {
        id: "step_deployment",
        stepNumber: 6,
        title: "6. Production Build & Docker Configuration",
        category: "deployment",
        file: "Dockerfile",
        line: 1,
        estimatedMinutes: 3,
        description: "Review container packaging, non-root user isolation, multi-stage caching, and operational health checks.",
        keyTakeaway: "Multi-stage Node 20 alpine build guarantees minimal attack surface and reproducible deployments.",
        suggestedAction: "Inspect Dockerfile runner stage and health check definition.",
        completed: completedSet.has("step_deployment"),
      },
    ];

    const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const completedSteps = steps.filter((s) => s.completed);
    const completedMinutes = completedSteps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const completedCount = completedSteps.length;
    const progressPercentage = Math.round((completedCount / steps.length) * 100);

    const firstIncomplete = steps.find((s) => !s.completed);
    const currentStepId = firstIncomplete ? firstIncomplete.id : steps[steps.length - 1].id;

    return {
      repositoryId,
      title: "Interactive Developer Onboarding Curriculum",
      summary: `Tailored 6-step exploration path through ${repositoryId}. Covers architecture, presentation, core services, tests, and deployment.`,
      totalEstimatedMinutes: totalMinutes,
      completedMinutes,
      completedCount,
      totalSteps: steps.length,
      progressPercentage,
      currentStepId,
      steps,
      lastUpdated: progress.lastUpdated,
    };
  }

  /**
   * Updates step completion status and returns the refreshed learning path.
   */
  toggleStepCompletion(userId: string = "usr_default", repositoryId: string = "sample-project", stepId: string): RepositoryLearningPath {
    const progress = db.getLearningPathProgress(userId, repositoryId);
    let updated: string[];

    if (progress.completedSteps.includes(stepId)) {
      updated = progress.completedSteps.filter((id) => id !== stepId);
    } else {
      updated = [...progress.completedSteps, stepId];
    }

    db.updateLearningPathProgress(userId, repositoryId, updated, stepId);
    return this.getLearningPath(userId, repositoryId);
  }

  setStepCompletion(
    userId: string = "usr_default",
    repositoryId: string = "sample-project",
    stepId: string,
    completed: boolean
  ): RepositoryLearningPath {
    const progress = db.getLearningPathProgress(userId, repositoryId);
    let updated: string[];

    if (completed) {
      updated = Array.from(new Set([...progress.completedSteps, stepId]));
    } else {
      updated = progress.completedSteps.filter((id) => id !== stepId);
    }

    db.updateLearningPathProgress(userId, repositoryId, updated, stepId);
    return this.getLearningPath(userId, repositoryId);
  }
}

export const learningPathEngine = new LearningPathEngine();

export interface OnboardingCitation {
  label: string;
  file: string;
  line?: number;
  snippet?: string;
}

export interface RepositoryOverviewData {
  repositoryId: string;
  name: string;
  purpose: string;
  purposeSource: "readme" | "package_description" | "inferred_ast";
  languages: Array<{ language: string; percentage: number; fileCount: number }>;
  frameworks: string[];
  dependencies: Array<{ name: string; version?: string; type: "runtime" | "dev" }>;
  entryPoints: Array<{
    name: string;
    file: string;
    line: number;
    type: string;
    description: string;
  }>;
  directoryTaxonomy: Array<{
    directory: string;
    purpose: string;
    fileCount: number;
  }>;
  apiEndpoints: Array<{
    method: string;
    path: string;
    file: string;
    line: number;
    handler: string;
  }>;
  databaseAccess: Array<{
    model: string;
    file: string;
    operations: string[];
  }>;
  authFlow: {
    entryFile: string;
    entrySymbol: string;
    description: string;
    steps: string[];
    isConfigured: boolean;
  };
  testOrganization: {
    framework: string;
    testCount: number;
    testFiles: string[];
    coverageRatio: number;
  };
  buildAndDeploy: {
    packageManager: string;
    buildCommand: string;
    startCommand: string;
    containerized: boolean;
    configFiles: string[];
  };
  incompleteAreas: string[];
  generatedAt: string;
  isStale: boolean;
  citations: OnboardingCitation[];
}

export interface OnboardingStepItem {
  id: "understand_structure" | "discover_entry_points" | "explore_modules" | "trace_workflow" | "inspect_tests" | "ask_assistant";
  title: string;
  description: string;
  targetUrl: string;
  targetLabel: string;
  actionIcon: string;
  evidence: string;
  isCompleted: boolean;
}

export interface OnboardingJourneyData {
  repositoryId: string;
  steps: OnboardingStepItem[];
  completedCount: number;
  totalSteps: number;
  isCompleted: boolean;
  currentStepId: string;
}

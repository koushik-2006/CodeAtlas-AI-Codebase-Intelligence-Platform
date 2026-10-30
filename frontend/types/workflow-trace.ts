export type WorkflowStepType =
  | "ui_event"
  | "endpoint"
  | "function"
  | "service"
  | "validation"
  | "db_query"
  | "test";

export interface WorkflowStep {
  stepNumber: number;
  entityId: string;
  name: string;
  type: WorkflowStepType;
  file: string;
  line: number;
  endLine?: number;
  codeSnippet: string;
  relationshipToPrev?: string;
  isVerified: boolean;
  confidence: number;
  notes: string;
}

export interface WorkflowTraceData {
  id: string;
  title: string;
  description: string;
  entryPoint: {
    name: string;
    file: string;
    line: number;
    type: string;
  };
  steps: WorkflowStep[];
  limitations: string[];
  verifiedRatio: number; // e.g. 1.0 = 100%
  totalSteps: number;
  generatedAt: string;
}

export interface AvailableWorkflowEntryPoint {
  id: string;
  name: string;
  file: string;
  line: number;
  type: "ui_event" | "endpoint" | "service" | "function";
  label: string;
}

export type ImpactSeverity = "High" | "Medium" | "Low";

export type AnalysisStatus = "idle" | "loading" | "success" | "error" | "empty";

export interface EndpointImpact {
  method: string;
  path: string;
  file: string;
  line?: number;
}

export interface ComponentImpact {
  name: string;
  file: string;
  callerLine: number;
}

export interface ServiceImpact {
  name: string;
  file: string;
  line?: number;
}

export interface TestToRerun {
  name: string;
  file: string;
  line?: number;
  status: "passing" | "needs-update" | "broken";
}

export interface AffectedComponent {
  id: string;
  name: string;
  type: "component" | "endpoint" | "service" | "test" | "database" | "external";
  file: string;
  line?: number;
  reason: string;
  severity: ImpactSeverity;
  relationship: string;
}

export interface ImpactAnalysisRequest {
  repositoryId: string;
  file: string;
  symbol: string;
  options?: {
    includeDownstream?: boolean;
    includeTests?: boolean;
    includeAPIs?: boolean;
  };
}

export interface ChangeImpactResult {
  symbol: string;
  file: string;
  riskLevel: ImpactSeverity;
  riskScore: number;
  affectedEndpoints: EndpointImpact[];
  affectedComponents: ComponentImpact[];
  affectedServices: ServiceImpact[];
  testsToRerun: TestToRerun[];
  directlyDependent: AffectedComponent[];
  downstreamAffected: AffectedComponent[];
  reviewRequired: AffectedComponent[];
  recommendation: string;
  limitationsNote?: string;
  isSimulated?: boolean;
}

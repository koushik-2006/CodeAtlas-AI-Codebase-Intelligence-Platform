export type RepositoryFreshness = "ready" | "stale" | "indexing" | "pending" | "error";

export interface MultiRepoSummary {
  id: string;
  name: string;
  owner: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  languages: string[];
  branch: string;
  revision: string;
  status: RepositoryFreshness;
  progress: number;
  lastIndexed: string;
  isStale: boolean;
  symbolCount: number;
  fileCount: number;
  workspaceId?: string;
}

export type CrossRepoEntityType =
  | "all"
  | "symbol"
  | "file"
  | "api"
  | "config"
  | "documentation"
  | "manifest"
  | "test"
  | "architecture";

export interface CrossRepoSearchRequest {
  query: string;
  repositoryIds?: string[];
  workspaceId?: string;
  category?: CrossRepoEntityType;
  language?: string;
  exactSymbol?: boolean;
  limit?: number;
  offset?: number;
}

export interface CrossRepoSearchResultItem {
  id: string;
  repositoryId: string;
  repositoryName: string;
  revision: string;
  title: string;
  subtitle: string;
  category: CrossRepoEntityType;
  filePath: string;
  line: number;
  snippet?: string;
  matchType: "exact_symbol" | "path" | "keyword" | "semantic_content";
  badge: string;
  href: string;
  isStaleRepo?: boolean;
}

export interface CrossRepoSearchResponse {
  query: string;
  total: number;
  results: CrossRepoSearchResultItem[];
  groupedByRepo: Record<string, { repoName: string; count: number; results: CrossRepoSearchResultItem[] }>;
  groupedByCategory: Record<string, number>;
  categories: Array<{ category: string; label: string; count: number }>;
  limit: number;
  offset: number;
  searchMethod: "exact_and_ast_index" | "semantic_vector_disabled";
  staleNotice?: string;
}

export type CrossRepoRelationshipType =
  | "verified_package_dependency"
  | "versioned_internal_library"
  | "verified_source_reference"
  | "configured_service_relationship"
  | "documented_relationship"
  | "inferred_relationship"
  | "unresolved_possible_relationship";

export interface CrossRepoRelationship {
  id: string;
  sourceRepoId: string;
  sourceRepoName: string;
  targetRepoId: string;
  targetRepoName: string;
  type: CrossRepoRelationshipType;
  typeLabel: string;
  packageName?: string;
  versionConstraint?: string;
  resolvedVersion?: string;
  evidenceFile: string;
  evidenceLine: number;
  evidenceSnippet: string;
  confidence: "verified" | "configured" | "inferred" | "unresolved";
  description: string;
  lastVerified: string;
}

export interface CrossRepoDependencyGraph {
  nodes: Array<{
    id: string;
    name: string;
    owner: string;
    language: string;
    isStale: boolean;
    symbolCount: number;
    description: string;
    branch: string;
    revision: string;
  }>;
  edges: CrossRepoRelationship[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    internalLibraries: number;
    serviceIntegrations: number;
    packageDependencies: number;
  };
}

export interface CrossRepoQuestionRequest {
  question: string;
  repositoryIds: string[];
  workspaceId?: string;
  conversationHistory?: Array<{ sender: "user" | "ai"; text: string }>;
}

export interface CrossRepoCitation {
  repositoryId: string;
  repositoryName: string;
  revision: string;
  filePath: string;
  startLine: number;
  endLine?: number;
  snippet: string;
  symbolName?: string;
}

export interface CrossRepoAnswerResponse {
  answer: string;
  repositoryIds: string[];
  citations: CrossRepoCitation[];
  confirmedFacts: string[];
  inferredExplanations: string[];
  crossRepoConnections: string[];
  unavailableContext: string[];
  confidence: "supported" | "inferred" | "unsupported";
  limitations: string[];
  isConfigured: boolean;
  provider: string;
}

export type DuplicateCategory =
  | "utility"
  | "validation"
  | "api_client"
  | "config"
  | "transformation"
  | "error_handling"
  | "test_helper";

export type DuplicateDetectionMethod = "exact_normalized" | "ast_structural" | "lexical_symbol";

export interface DuplicateInstance {
  repositoryId: string;
  repositoryName: string;
  revision: string;
  filePath: string;
  symbolName: string;
  lineRange: { start: number; end: number };
  snippet: string;
  language: string;
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  category: DuplicateCategory;
  categoryLabel: string;
  detectionMethod: DuplicateDetectionMethod;
  detectionMethodLabel: string;
  similarityScore: number; // 0 - 100
  instances: DuplicateInstance[];
  matchingEvidence: string;
  keyDifferences: string[];
  reuseRecommendation: string;
  isExactMatch: boolean;
}

export interface SharedServiceEndpoint {
  id: string;
  serviceName: string;
  repositoryId: string;
  repositoryName: string;
  httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpointPath: string;
  definitionLocation: {
    file: string;
    line: number;
    snippet: string;
    symbolName?: string;
  };
  consumers: Array<{
    repositoryId: string;
    repositoryName: string;
    clientFile: string;
    line: number;
    callType: "configured_url" | "typed_client" | "fetch_call";
    snippet: string;
    isRuntimeConfirmed: boolean;
  }>;
  schemaContract?: {
    requestType?: string;
    responseType?: string;
    file?: string;
  };
  relatedTests: Array<{
    repositoryId: string;
    repositoryName: string;
    testFile: string;
    line: number;
    testName: string;
  }>;
}

export interface CrossRepoImpactRequest {
  sourceRepoId: string;
  changedComponent: {
    type: "package" | "symbol" | "api_endpoint" | "file";
    name: string;
    file: string;
    newSignatureOrSchema?: string;
    isBreaking?: boolean;
  };
  targetRepoIds?: string[];
  workspaceId?: string;
}

export interface AffectedRepositoryImpact {
  repositoryId: string;
  repositoryName: string;
  relationshipType: CrossRepoRelationshipType;
  versionConstraint?: string;
  affectedFiles: Array<{
    path: string;
    line: number;
    symbol?: string;
    contextSnippet: string;
  }>;
  severity: "breaking" | "compatible" | "warning";
  details: string;
  recommendedTests: Array<{
    file: string;
    line: number;
    testName: string;
  }>;
}

export interface CrossRepoImpactReport {
  changeId: string;
  sourceRepository: {
    id: string;
    name: string;
    revision: string;
  };
  targetComponent: string;
  changeType: string;
  isBreaking: boolean;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  riskScore: number; // 0 - 100
  affectedRepositories: AffectedRepositoryImpact[];
  summary: string;
  verificationGuidelines: string[];
  limitationsNotice: string;
}

export interface TechnologyInsightsSummary {
  workspaceId?: string;
  totalRepositories: number;
  indexedRepositories: number;
  staleRepositories: number;
  indexingCoveragePercentage: number;
  languages: Array<{
    name: string;
    repoCount: number;
    percentage: number;
  }>;
  topDependencies: Array<{
    name: string;
    repoCount: number;
    isInternal: boolean;
    versions: string[];
  }>;
  internalLibrariesCount: number;
  detectedServiceConnections: number;
  duplicateCandidateCount: number;
  methodologyNotice: string;
}

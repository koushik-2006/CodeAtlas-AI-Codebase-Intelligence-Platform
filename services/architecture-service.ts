import { ArchitectureNode, ArchitectureEdge, ArchitectureGraphData } from "@/types/architecture";

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  nodeTypeBreakdown: Record<string, number>;
  circularDependencies: string[][];
  isolatedNodes: string[];
  centralNodes: { id: string; name: string; connections: number }[];
  maxDepth: number;
}

export interface PathStep {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  file: string;
  line?: number;
  relationshipToNext?: string;
  evidence?: string;
}

export interface PathResult {
  found: boolean;
  sourceId: string;
  targetId: string;
  steps: PathStep[];
  length: number;
  message?: string;
}

export interface DependencyAnalysisResult {
  nodeId: string;
  nodeName: string;
  file: string;
  directDependencies: { id: string; name: string; type: string; file: string; line?: number }[];
  directDependents: { id: string; name: string; type: string; file: string; line?: number }[];
  transitiveDependencies: string[];
  dependencyDepth: number;
  isCircular: boolean;
  cycleMembers?: string[];
  linkedTests: { name: string; file: string; line?: number }[];
  relatedEndpoints: { name: string; file: string }[];
  relatedDatabase: { name: string; file: string }[];
}

const SAMPLE_PROJECT_NODES: ArchitectureNode[] = [
  {
    id: "node-login-form",
    label: "LoginForm.tsx",
    name: "LoginForm",
    type: "Source file",
    file: "src/components/LoginForm.tsx",
    line: 1,
    lines: "1 to 45",
    symbolName: "LoginForm",
    description: "Client React component with form state, validation, and submit dispatch to auth service.",
    code: `export function LoginForm() {\n  const [email, setEmail] = useState("");\n  const [password, setPassword] = useState("");\n  const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    const result = await loginUser(email, password);\n  };\n}`,
    callers: ["User Browser / Page Layout"],
    callees: ["POST /auth", "validateEmail()"],
    tests: ["tests/auth.test.ts:testLoginFormRendering"],
    incomingRelationships: [],
    outgoingRelationships: [
      {
        nodeId: "node-api-auth",
        nodeName: "POST /auth",
        nodeType: "API endpoint",
        file: "src/services/auth.ts",
        relationship: "API calls",
        description: "Dispatches HTTP POST with credentials payload",
      },
      {
        nodeId: "node-validate-email",
        nodeName: "validateEmail()",
        nodeType: "Function",
        file: "src/utils/validation.ts",
        relationship: "Function calls",
        description: "Runs format regex validation before network call",
      },
    ],
    color: "#6C4DFF",
    x: 100,
    y: 200,
    cx: 140,
    cy: 160,
    a: 28,
    h: 75,
    tone: "brand",
  },
  {
    id: "node-api-auth",
    label: "POST /auth",
    name: "POST /auth",
    type: "API endpoint",
    file: "src/services/auth.ts",
    line: 18,
    lines: "18 to 25",
    symbolName: "handleAuthEndpoint",
    description: "Gateway network endpoint receiving and authenticating JSON login credentials.",
    code: `export async function handleAuthRoute(req: Request) {\n  const { email, password } = await req.json();\n  return loginUser(email, password);\n}`,
    callers: ["LoginForm.tsx"],
    callees: ["loginUser()"],
    tests: ["tests/auth.test.ts:testEndpointStatus"],
    incomingRelationships: [
      {
        nodeId: "node-login-form",
        nodeName: "LoginForm.tsx",
        nodeType: "Source file",
        file: "src/components/LoginForm.tsx",
        relationship: "API calls",
      },
    ],
    outgoingRelationships: [
      {
        nodeId: "node-login-user",
        nodeName: "loginUser()",
        nodeType: "Function",
        file: "src/services/auth.ts",
        relationship: "Function calls",
      },
    ],
    color: "#8B7CFF",
    x: 280,
    y: 130,
    cx: 240,
    cy: 130,
    a: 20,
    h: 65,
    tone: "brand",
  },
  {
    id: "node-validate-email",
    label: "validateEmail()",
    name: "validateEmail",
    type: "Function",
    file: "src/utils/validation.ts",
    line: 4,
    lines: "4 to 12",
    symbolName: "validateEmail",
    description: "Pure utility function asserting RFC 5322 email string validation format.",
    code: `export function validateEmail(email: string): boolean {\n  if (!email) return false;\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim());\n}`,
    callers: ["LoginForm.tsx", "loginUser()"],
    callees: [],
    tests: ["tests/auth.test.ts:testValidateEmail"],
    incomingRelationships: [
      {
        nodeId: "node-login-form",
        nodeName: "LoginForm.tsx",
        nodeType: "Source file",
        file: "src/components/LoginForm.tsx",
        relationship: "Function calls",
      },
      {
        nodeId: "node-login-user",
        nodeName: "loginUser()",
        nodeType: "Function",
        file: "src/services/auth.ts",
        relationship: "Function calls",
      },
    ],
    outgoingRelationships: [],
    color: "#29D3C2",
    x: 280,
    y: 270,
    cx: 240,
    cy: 220,
    a: 18,
    h: 45,
    tone: "mint",
  },
  {
    id: "node-login-user",
    label: "loginUser()",
    name: "loginUser",
    type: "Function",
    file: "src/services/auth.ts",
    line: 18,
    lines: "18 to 42",
    symbolName: "loginUser",
    description: "Core service function handling credential parsing, hashing checks, and session tokens.",
    code: `export async function loginUser(email, password) {\n  if (!validateEmail(email)) throw new Error("Invalid email");\n  const user = await UserService.findByEmail(email);\n  return createSessionToken(user);\n}`,
    callers: ["POST /auth"],
    callees: ["UserService", "validateEmail()", "bcrypt"],
    tests: ["tests/auth.test.ts:testLoginSuccess", "tests/auth.test.ts:testLoginFailure"],
    incomingRelationships: [
      {
        nodeId: "node-api-auth",
        nodeName: "POST /auth",
        nodeType: "API endpoint",
        file: "src/services/auth.ts",
        relationship: "Function calls",
      },
    ],
    outgoingRelationships: [
      {
        nodeId: "node-user-service",
        nodeName: "UserService",
        nodeType: "Service",
        file: "src/services/auth.ts",
        relationship: "Function calls",
      },
      {
        nodeId: "node-validate-email",
        nodeName: "validateEmail()",
        nodeType: "Function",
        file: "src/utils/validation.ts",
        relationship: "Function calls",
      },
      {
        nodeId: "node-crypto",
        nodeName: "bcrypt / crypto",
        nodeType: "External dependency",
        file: "package.json",
        relationship: "Dependency",
      },
    ],
    color: "#6C4DFF",
    x: 460,
    y: 130,
    cx: 340,
    cy: 140,
    a: 24,
    h: 80,
    tone: "brand",
  },
  {
    id: "node-user-service",
    label: "UserService",
    name: "UserService",
    type: "Service",
    file: "src/services/auth.ts",
    line: 38,
    lines: "38 to 55",
    symbolName: "UserService",
    description: "Encapsulates user profile retrieval and persistence queries to the PostgreSQL database.",
    code: `export const UserService = {\n  async findByEmail(email: string) {\n    return db.query("SELECT * FROM users WHERE email = $1", [email]);\n  }\n};`,
    callers: ["loginUser()"],
    callees: ["users table"],
    tests: ["tests/auth.test.ts:testUserServiceMock"],
    incomingRelationships: [
      {
        nodeId: "node-login-user",
        nodeName: "loginUser()",
        nodeType: "Function",
        file: "src/services/auth.ts",
        relationship: "Function calls",
      },
    ],
    outgoingRelationships: [
      {
        nodeId: "node-db-users",
        nodeName: "users table",
        nodeType: "Database model or table",
        file: "src/services/auth.ts",
        relationship: "Data access",
      },
    ],
    color: "#F3C969",
    x: 640,
    y: 130,
    cx: 440,
    cy: 160,
    a: 22,
    h: 60,
    tone: "sun",
  },
  {
    id: "node-db-users",
    label: "users table",
    name: "users table",
    type: "Database model or table",
    file: "src/services/auth.ts",
    line: 22,
    lines: "22 to 24",
    symbolName: "usersTable",
    description: "Relational persistence table storing hashed credentials and account profiles.",
    code: `CREATE TABLE users (\n  id UUID PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  password_hash VARCHAR(255) NOT NULL\n);`,
    callers: ["UserService"],
    callees: [],
    tests: [],
    incomingRelationships: [
      {
        nodeId: "node-user-service",
        nodeName: "UserService",
        nodeType: "Service",
        file: "src/services/auth.ts",
        relationship: "Data access",
      },
    ],
    outgoingRelationships: [],
    color: "#2FD6A0",
    x: 820,
    y: 130,
    cx: 540,
    cy: 190,
    a: 26,
    h: 55,
    tone: "mint",
  },
  {
    id: "node-auth-test",
    label: "auth.test.ts",
    name: "auth.test.ts",
    type: "Test",
    file: "tests/auth.test.ts",
    line: 1,
    lines: "1 to 65",
    symbolName: "authTestSuite",
    description: "Integration test suite validating authentication endpoints, tokens, and error branches.",
    code: `describe("Authentication Test Suite", () => {\n  it("successfully issues token with valid credentials", async () => {\n    const res = await loginUser("alex@codeatlas.dev", "validPassword123");\n    expect(res.token).toBeDefined();\n  });\n});`,
    callers: ["CI Test Runner"],
    callees: ["loginUser()"],
    tests: [],
    incomingRelationships: [],
    outgoingRelationships: [
      {
        nodeId: "node-login-user",
        nodeName: "loginUser()",
        nodeType: "Function",
        file: "src/services/auth.ts",
        relationship: "Test coverage",
      },
    ],
    color: "#FF5A5F",
    x: 460,
    y: 270,
    cx: 340,
    cy: 230,
    a: 20,
    h: 50,
    tone: "coral",
  },
  {
    id: "node-crypto",
    label: "bcrypt / crypto",
    name: "bcrypt",
    type: "External dependency",
    file: "package.json",
    line: 12,
    lines: "12 to 14",
    symbolName: "bcrypt",
    description: "External npm package used for password hashing and salting operations.",
    code: `"dependencies": {\n  "bcrypt": "^5.1.0"\n}`,
    callers: ["loginUser()"],
    callees: [],
    tests: [],
    incomingRelationships: [
      {
        nodeId: "node-login-user",
        nodeName: "loginUser()",
        nodeType: "Function",
        file: "src/services/auth.ts",
        relationship: "Dependency",
      },
    ],
    outgoingRelationships: [],
    color: "#A0AEC0",
    x: 460,
    y: 20,
    cx: 340,
    cy: 70,
    a: 16,
    h: 35,
    tone: "cyan",
  },
];

const SAMPLE_PROJECT_EDGES: ArchitectureEdge[] = [
  { id: "e1", source: "node-login-form", target: "node-api-auth", label: "API calls", type: "API calls" },
  { id: "e2", source: "node-login-form", target: "node-validate-email", label: "Function calls", type: "Function calls" },
  { id: "e3", source: "node-api-auth", target: "node-login-user", label: "Function calls", type: "Function calls" },
  { id: "e4", source: "node-login-user", target: "node-user-service", label: "Function calls", type: "Function calls" },
  { id: "e5", source: "node-user-service", target: "node-db-users", label: "Data access", type: "Data access" },
  { id: "e6", source: "node-auth-test", target: "node-login-user", label: "Test coverage", type: "Test coverage" },
  { id: "e7", source: "node-login-user", target: "node-crypto", label: "Dependency", type: "Dependency" },
];

class ArchitectureService {
  /**
   * Fetches the architecture graph for a given repository.
   */
  async getGraphForRepository(repositoryId: string = "sample-project"): Promise<{
    data: ArchitectureGraphData;
    metrics?: GraphMetrics;
  }> {
    try {
      const res = await fetch(`/api/architecture/graph?repoId=${encodeURIComponent(repositoryId)}`);
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.nodes) && json.data.nodes.length > 0) {
        return {
          data: {
            repositoryId,
            nodes: json.data.nodes,
            edges: json.data.edges || [],
          },
          metrics: json.data.metrics,
        };
      }
    } catch (err) {
      console.warn("Failed to load live architecture graph, falling back to sample:", err);
    }

    return {
      data: {
        repositoryId,
        nodes: SAMPLE_PROJECT_NODES,
        edges: SAMPLE_PROJECT_EDGES,
      },
    };
  }

  /**
   * Finds the shortest verified architecture path between two entities.
   */
  async findPath(repositoryId: string, sourceId: string, targetId: string): Promise<PathResult> {
    try {
      const res = await fetch(
        `/api/architecture/path?repoId=${encodeURIComponent(repositoryId)}&source=${encodeURIComponent(sourceId)}&target=${encodeURIComponent(targetId)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn("Path finding request failed:", err);
    }

    return {
      found: false,
      sourceId,
      targetId,
      steps: [],
      length: 0,
      message: "Path search unavailable.",
    };
  }

  /**
   * Retrieves neighborhood subgraph for lazy loading or focusing.
   */
  async getNeighborhood(
    repositoryId: string,
    nodeId: string,
    depth: number = 1
  ): Promise<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] }> {
    try {
      const res = await fetch(
        `/api/architecture/neighborhood?repoId=${encodeURIComponent(repositoryId)}&nodeId=${encodeURIComponent(nodeId)}&depth=${depth}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn("Neighborhood request failed:", err);
    }

    return { nodes: [], edges: [] };
  }

  /**
   * Retrieves upstream callers, downstream dependencies, and cycle info for a node.
   */
  async getDependencies(
    repositoryId: string,
    nodeId: string
  ): Promise<DependencyAnalysisResult | null> {
    try {
      const res = await fetch(
        `/api/architecture/dependencies?repoId=${encodeURIComponent(repositoryId)}&nodeId=${encodeURIComponent(nodeId)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn("Dependency analysis request failed:", err);
    }

    return null;
  }

  async getNodeDetails(nodeId: string): Promise<ArchitectureNode | null> {
    return SAMPLE_PROJECT_NODES.find((n) => n.id === nodeId) || null;
  }
}

export { SAMPLE_PROJECT_NODES, SAMPLE_PROJECT_EDGES };
export const architectureService = new ArchitectureService();

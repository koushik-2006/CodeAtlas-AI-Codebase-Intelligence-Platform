/**
 * CodeAtlas Demo Data Module
 * Provides isolated, realistic, and internally consistent demo data for the public product demo.
 * Zero private credentials or live external APIs required.
 */

export interface DemoGroundedQuery {
  id: string;
  question: string;
  answer: string;
  sourceType: "example_receipt" | "grounded_ast";
  citations: Array<{
    file: string;
    lineRange: [number, number];
    snippet: string;
    symbolName?: string;
  }>;
}

export interface DemoTraceStep {
  step: number;
  layer: "ui" | "service" | "db" | "test";
  entityName: string;
  filePath: string;
  line: number;
  relation: string;
  codeSnippet: string;
  verified: boolean;
}

export interface DemoChangeImpact {
  symbolName: string;
  filePath: string;
  line: number;
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
  upstreamCallers: string[];
  downstreamCallees: string[];
  affectedTests: string[];
  blastRadiusFiles: string[];
}

export const DEMO_REPOSITORY_INFO = {
  id: "sample-project",
  name: "demo-auth-service",
  tagline: "Authentication & Session Management Architecture",
  description: "A production-grade TypeScript authentication service showcasing AST symbol resolution, multi-tier call graphs, and verified test assertions.",
  languages: [
    { name: "TypeScript", percentage: 88, color: "#3178C6" },
    { name: "Markdown", percentage: 12, color: "#8B949E" },
  ],
  stats: {
    filesCount: 5,
    symbolsCount: 6,
    relationshipsCount: 15,
    testCoverage: "85%",
    completenessScore: 100,
  },
};

export const DEMO_TRACE_STEPS: DemoTraceStep[] = [
  {
    step: 1,
    layer: "ui",
    entityName: "handleSubmit",
    filePath: "src/components/LoginForm.tsx",
    line: 26,
    relation: "Entry Point (DOM Form Submit)",
    codeSnippet: "const handleSubmit = async (e: React.FormEvent) => {\n  e.preventDefault();\n  const result = await loginUser(email, password);\n};",
    verified: true,
  },
  {
    step: 2,
    layer: "ui",
    entityName: "setEmail",
    filePath: "src/components/LoginForm.tsx",
    line: 18,
    relation: "State Dispatcher Hook",
    codeSnippet: "const [email, setEmail] = useState('');\nconst [password, setPassword] = useState('');",
    verified: true,
  },
  {
    step: 3,
    layer: "service",
    entityName: "validateEmail",
    filePath: "src/utils/validation.ts",
    line: 4,
    relation: "Input Sanitization & Regex Check",
    codeSnippet: "export function validateEmail(email: string): boolean {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n}",
    verified: true,
  },
  {
    step: 4,
    layer: "service",
    entityName: "loginUser",
    filePath: "src/services/auth.ts",
    line: 18,
    relation: "Domain Authentication Handler",
    codeSnippet: "export async function loginUser(email: string, pass: string): Promise<SessionToken> {\n  const user = await UserService.findUserByEmail(email);\n  return issueSessionToken(user);\n}",
    verified: true,
  },
  {
    step: 5,
    layer: "db",
    entityName: "UserService.findUserByEmail",
    filePath: "src/services/auth.ts",
    line: 44,
    relation: "Data Access Operation (SELECT)",
    codeSnippet: "static async findUserByEmail(email: string): Promise<UserRecord> {\n  return db.users.find((u) => u.email === email);\n}",
    verified: true,
  },
  {
    step: 6,
    layer: "test",
    entityName: "testLoginSuccess",
    filePath: "tests/auth.test.ts",
    line: 18,
    relation: "Verified Automated Assertion",
    codeSnippet: "test('testLoginSuccess', async () => {\n  const session = await loginUser('alice@example.com', 'ValidPass123!');\n  expect(session.token).toBeDefined();\n});",
    verified: true,
  },
];

export const DEMO_GROUNDED_QUERIES: DemoGroundedQuery[] = [
  {
    id: "query-auth-start",
    question: "Where does the application authentication start?",
    answer: "Authentication initiates on the client inside `src/components/LoginForm.tsx:26` through the `handleSubmit` event handler. The form handler triggers state evaluation and invokes `loginUser()` in `src/services/auth.ts:18`.",
    sourceType: "grounded_ast",
    citations: [
      {
        file: "src/components/LoginForm.tsx",
        lineRange: [26, 38],
        snippet: "const handleSubmit = async (e: React.FormEvent) => {\n  const res = await loginUser(email, password);\n};",
        symbolName: "handleSubmit",
      },
      {
        file: "src/services/auth.ts",
        lineRange: [18, 30],
        snippet: "export async function loginUser(email: string, password: string) { ... }",
        symbolName: "loginUser",
      },
    ],
  },
  {
    id: "query-db-access",
    question: "Where is the user database or persistent store accessed?",
    answer: "User records are accessed by `UserService.findUserByEmail()` in `src/services/auth.ts:44`. It performs an email lookup against the user storage store before validating password hashes.",
    sourceType: "grounded_ast",
    citations: [
      {
        file: "src/services/auth.ts",
        lineRange: [44, 52],
        snippet: "static async findUserByEmail(email: string) {\n  return db.users.find(u => u.email === email);\n}",
        symbolName: "UserService",
      },
    ],
  },
  {
    id: "query-test-coverage",
    question: "Which automated tests verify the authentication pipeline?",
    answer: "The authentication workflow is verified by `tests/auth.test.ts:18` in the test suite `testLoginSuccess()`. It asserts that valid credentials yield an active signed session token.",
    sourceType: "grounded_ast",
    citations: [
      {
        file: "tests/auth.test.ts",
        lineRange: [18, 30],
        snippet: "test('testLoginSuccess', async () => {\n  const session = await loginUser('alice@example.com', 'ValidPass123!');\n  expect(session.token).toBeDefined();\n});",
        symbolName: "testLoginSuccess",
      },
    ],
  },
];

export const DEMO_CHANGE_IMPACT: DemoChangeImpact = {
  symbolName: "loginUser",
  filePath: "src/services/auth.ts",
  line: 18,
  riskLevel: "Medium",
  riskScore: 45,
  upstreamCallers: ["handleSubmit (src/components/LoginForm.tsx:26)"],
  downstreamCallees: ["UserService.findUserByEmail (src/services/auth.ts:44)", "validateEmail (src/utils/validation.ts:4)"],
  affectedTests: ["testLoginSuccess (tests/auth.test.ts:18)"],
  blastRadiusFiles: ["src/components/LoginForm.tsx", "src/services/auth.ts", "src/utils/validation.ts", "tests/auth.test.ts"],
};

export const DEMO_SYMBOL_RESOLUTION = {
  name: "loginUser",
  type: "function",
  file: "src/services/auth.ts",
  line: 18,
  signature: "async function loginUser(email: string, password: string): Promise<SessionToken>",
  callersCount: 1,
  calleesCount: 2,
  referencesCount: 9,
  testsCount: 1,
};

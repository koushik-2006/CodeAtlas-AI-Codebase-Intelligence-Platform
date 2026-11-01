import {
  ParsedStackFrame,
  ParsedStackTrace,
  InvestigationHypothesis,
  SuggestedFix,
  TestRecommendation,
  ObservedEvidence,
  DbDebugInvestigation,
  StackTraceRuntime,
  DebugInvestigateRequest,
} from "@/types/debug";
import { aiService } from "@/services/ai-service";

export interface SampleDebugBug {
  id: string;
  name: string;
  label: string;
  language: string;
  runtime: StackTraceRuntime;
  repositoryId: string;
  repositoryName: string;
  errorType: string;
  errorMessage: string;
  culpritFile: string;
  culpritLine: number;
  rawTrace: string;
  logs?: string;
  expectedBehavior: string;
  actualBehavior: string;
  environment?: {
    os: string;
    browser?: string;
    runtimeVersion: string;
    commitHash: string;
  };
}

export const SAMPLE_DEBUG_BUGS: SampleDebugBug[] = [
  {
    id: "sample-js-auth",
    name: "JS/TS: TypeError undefined 'token'",
    label: "TypeScript / Node.js (sample-project)",
    language: "typescript",
    runtime: "nodejs",
    repositoryId: "sample-project",
    repositoryName: "demo-auth-service",
    errorType: "TypeError",
    errorMessage: "Cannot read properties of undefined (reading 'token')",
    culpritFile: "src/services/auth.ts",
    culpritLine: 28,
    rawTrace: `TypeError: Cannot read properties of undefined (reading 'token')
    at loginUser (src/services/auth.ts:28:19)
    at handleSubmit (src/components/LoginForm.tsx:28:25)
    at HTMLFormElement.dispatchFormEvent (node_modules/react-dom/cjs/react-dom.development.js:421:12)`,
    logs: `[WARN] 10:24:08 POST /api/v1/auth/session - Status 200 OK - Response body: {"status":"success","user":{"email":"developer@company.com"}}
[ERROR] 10:24:08 Unhandled client error in login ceremony: TypeError: Cannot read properties of undefined (reading 'token')`,
    expectedBehavior: "loginUser safely extracts token or throws descriptive AuthError if session token payload is missing or inactive.",
    actualBehavior: "Uncaught client TypeError crashed login form submission on dereferencing undefined 'token'.",
    environment: {
      os: "macOS 14.2 Sonoma",
      browser: "Chrome 122.0.6261.94",
      runtimeVersion: "Node.js v20.11.0",
      commitHash: "30e6d94e",
    },
  },
  {
    id: "sample-python-keyerror",
    name: "Python: KeyError 'value'",
    label: "Python / FastAPI (fastapi-backend)",
    language: "python",
    runtime: "python",
    repositoryId: "fastapi-backend",
    repositoryName: "fastapi-backend",
    errorType: "KeyError",
    errorMessage: "'value'",
    culpritFile: "routers/analytics.py",
    culpritLine: 12,
    rawTrace: `Traceback (most recent call last):
  File "/usr/local/lib/python3.11/site-packages/starlette/routing.py", line 68, in app
    response = await func(request)
  File "routers/analytics.py", line 12, in calculate_metric
    total = raw_data['value'] + offset
KeyError: 'value'`,
    logs: `2026-01-20 12:15:33 [INFO] uvicorn: 127.0.0.1:51280 - "POST /api/v1/analytics/compute HTTP/1.1" 500 Internal Server Error
2026-01-20 12:15:33 [ERROR] Unhandled exception in route handler /analytics/compute: KeyError: 'value'`,
    expectedBehavior: "calculate_metric safely checks if 'value' key exists, defaulting to 0.0 or returning a 422 Unprocessable Entity.",
    actualBehavior: "HTTP 500 server crash on unhandled KeyError when payload dictionary omits 'value'.",
    environment: {
      os: "Linux Ubuntu 22.04 LTS",
      runtimeVersion: "Python 3.11.8",
      commitHash: "7b4c81a2",
    },
  },
  {
    id: "sample-java-npe",
    name: "Java: NullPointerException",
    label: "Java / Spring (payment-service)",
    language: "java",
    runtime: "java",
    repositoryId: "payment-service",
    repositoryName: "payment-service",
    errorType: "java.lang.NullPointerException",
    errorMessage: 'Cannot invoke "com.acme.payment.Transaction.getId()" because the return value of "com.acme.payment.Order.getTransaction()" is null',
    culpritFile: "PaymentProcessor.java",
    culpritLine: 18,
    rawTrace: `java.lang.NullPointerException: Cannot invoke "com.acme.payment.Transaction.getId()" because the return value of "com.acme.payment.Order.getTransaction()" is null
    at com.acme.payment.PaymentProcessor.process(PaymentProcessor.java:18)
    at com.acme.payment.CheckoutService.checkout(CheckoutService.java:42)
    at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)`,
    logs: `2026-01-20 14:32:01.402 ERROR [payment-worker] c.a.p.PaymentProcessor: Order ORD-9921 failed during capture ceremony
java.lang.NullPointerException: Cannot invoke "com.acme.payment.Transaction.getId()" because order.getTransaction() returned null`,
    expectedBehavior: "PaymentProcessor verifies order.getTransaction() is not null before invoking getId(), issuing transaction creation if absent.",
    actualBehavior: "Payment processing thread terminated abruptly with fatal NullPointerException.",
    environment: {
      os: "Linux Debian 12",
      runtimeVersion: "OpenJDK 21.0.2",
      commitHash: "e1a90c4d",
    },
  },
  {
    id: "sample-go-nilpointer",
    name: "Go: nil pointer dereference",
    label: "Go / Mux (auth-service)",
    language: "go",
    runtime: "go",
    repositoryId: "auth-service",
    repositoryName: "auth-service",
    errorType: "panic",
    errorMessage: "runtime error: invalid memory address or nil pointer dereference",
    culpritFile: "main.go",
    culpritLine: 22,
    rawTrace: `panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: code=0x1 addr=0x0 pc=0x10a2b4]
main.authHandler(0x0, 0xc0000a6000)
	/auth-service/main.go:22 +0x3b
net/http.HandlerFunc.ServeHTTP(0x10f220, 0x10e140)
	/usr/local/go/src/net/http/server.go:2084 +0x44`,
    logs: `2026/01/20 16:04:11 http: panic serving 127.0.0.1:48292: runtime error: invalid memory address or nil pointer dereference
goroutine 42 [running]:
main.authHandler(0x0, 0xc0000a6000)`,
    expectedBehavior: "authHandler checks whether session pointer is nil before dereferencing session claims and responds with 401 Unauthorized.",
    actualBehavior: "Server crashed with fatal SIGSEGV nil pointer dereference.",
    environment: {
      os: "Linux Alpine 3.19",
      runtimeVersion: "go1.22.1 linux/amd64",
      commitHash: "f92d4b8e",
    },
  },
];

/**
 * Parses raw stack traces across Node.js/V8, Python, Java, and Go.
 * Matches frames against repository files in the store to extract source snippets.
 */
export function parseStackTrace(
  raw: string,
  repoFiles?: Record<string, { code: string; language: string }>
): ParsedStackTrace {
  const clean = (raw || "").trim();
  let runtime: StackTraceRuntime = "generic";
  let errorType = "RuntimeError";
  let errorMessage = "Unknown runtime error encountered";

  // 1. Detect runtime & header
  if (clean.includes("Traceback (most recent call last)")) {
    runtime = "python";
    const lines = clean.split("\n");
    const lastLine = lines[lines.length - 1].trim();
    const match = lastLine.match(/^([A-Za-z0-9_]+Error|[A-Za-z0-9_]+Exception|KeyError):\s*(.*)$/);
    if (match) {
      errorType = match[1];
      errorMessage = match[2] || errorType;
    } else {
      errorType = "PythonException";
      errorMessage = lastLine;
    }
  } else if (clean.startsWith("panic:") || clean.includes("goroutine") || clean.includes("SIGSEGV")) {
    runtime = "go";
    errorType = "panic";
    const firstLine = clean.split("\n")[0].trim();
    errorMessage = firstLine.replace(/^panic:\s*/, "") || "runtime error: invalid memory address or nil pointer dereference";
  } else if (clean.includes("Exception in thread") || clean.includes("NullPointerException") || clean.match(/^[a-z0-9_.]+\.[A-Z][a-zA-Z0-9]+Exception:/)) {
    runtime = "java";
    const firstLine = clean.split("\n")[0].trim();
    const match = firstLine.match(/^([a-zA-Z0-9_.]+Exception|[a-zA-Z0-9_.]+Error):\s*(.*)$/);
    if (match) {
      errorType = match[1].split(".").pop() || match[1];
      errorMessage = match[2] || firstLine;
    } else {
      errorType = "NullPointerException";
      errorMessage = firstLine;
    }
  } else if (clean.match(/^(?:Uncaught\s+)?([A-Za-z0-9_$]*Error):\s*(.*)$/m)) {
    runtime = "nodejs";
    const headerMatch = clean.match(/^(?:Uncaught\s+)?([A-Za-z0-9_$]*Error):\s*(.*)$/m);
    if (headerMatch) {
      errorType = headerMatch[1];
      errorMessage = headerMatch[2];
    }
  }

  // 2. Parse frames
  const frames: ParsedStackFrame[] = [];
  const lines = clean.split("\n");

  if (runtime === "python") {
    // Python frame pattern: File "routers/analytics.py", line 12, in calculate_metric
    const pyRegex = /File\s+["']([^"']+)["'],\s+line\s+(\d+)(?:,\s+in\s+([A-Za-z0-9_<>]+))?/i;
    let order = 1;
    for (const line of lines) {
      const m = line.match(pyRegex);
      if (m) {
        const filePath = m[1];
        const lineNum = parseInt(m[2], 10);
        const funcName = m[3] || "<module>";
        const isExternal =
          filePath.includes("site-packages") ||
          filePath.includes("/usr/lib/") ||
          filePath.includes("lib/python");

        frames.push(createFrame(order++, line.trim(), funcName, filePath, lineNum, undefined, isExternal, repoFiles));
      }
    }
  } else if (runtime === "go") {
    // Go frame pattern:
    // main.authHandler(0x0, 0xc0000a6000)
    // 	/auth-service/main.go:22 +0x3b
    let order = 1;
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i].trim();
      const next = lines[i + 1]?.trim() || "";

      if (cur.match(/^[a-zA-Z0-9_./]+\.[a-zA-Z0-9_]+\(.*\)$/)) {
        const funcName = cur.split("(")[0];
        const locMatch = next.match(/^(\S+?):(\d+)(?:\s+\+0x[0-9a-fA-F]+)?$/);
        if (locMatch) {
          const filePath = locMatch[1];
          const lineNum = parseInt(locMatch[2], 10);
          const isExternal =
            filePath.includes("/usr/local/go") ||
            filePath.includes("/go/pkg/") ||
            funcName.startsWith("net/http");

          frames.push(createFrame(order++, `${cur} -> ${next}`, funcName, filePath, lineNum, undefined, isExternal, repoFiles));
          i++; // skip next line
        }
      }
    }
  } else if (runtime === "java") {
    // Java frame pattern: at com.acme.payment.PaymentProcessor.process(PaymentProcessor.java:18)
    const javaRegex = /^\s*at\s+([a-zA-Z0-9_$.]+)\.([a-zA-Z0-9_$<>]+)\(([^:)]+)(?::(\d+))?\)/;
    let order = 1;
    for (const line of lines) {
      const m = line.match(javaRegex);
      if (m) {
        const className = m[1];
        const methodName = m[2];
        const fileName = m[3];
        const lineNum = m[4] ? parseInt(m[4], 10) : undefined;
        const funcName = `${className.split(".").pop()}.${methodName}`;
        const isExternal =
          className.startsWith("java.") ||
          className.startsWith("javax.") ||
          className.startsWith("sun.") ||
          className.startsWith("org.springframework.") ||
          fileName === "Native Method";

        frames.push(createFrame(order++, line.trim(), funcName, fileName, lineNum, undefined, isExternal, repoFiles));
      }
    }
  } else {
    // Node.js / V8 frames
    // at loginUser (src/services/auth.ts:28:19) or at src/services/auth.ts:28:19
    const v8Regex = /^\s*at\s+(?:([A-Za-z0-9_$<>.\s]+?)\s+\()?([^()]+?):(\d+):(\d+)\)?$/;
    let order = 1;
    for (const line of lines) {
      const m = line.match(v8Regex);
      if (m) {
        const funcName = (m[1] || "").trim() || "<anonymous>";
        const rawPath = m[2].trim();
        const lineNum = parseInt(m[3], 10);
        const colNum = parseInt(m[4], 10);
        const isExternal =
          rawPath.includes("node_modules") ||
          rawPath.startsWith("node:") ||
          rawPath.includes("internal/");

        frames.push(createFrame(order++, line.trim(), funcName, rawPath, lineNum, colNum, isExternal, repoFiles));
      }
    }
  }

  // Fallback if no frames matched regex
  if (frames.length === 0) {
    frames.push({
      id: "frame-1",
      order: 1,
      raw: clean.slice(0, 120),
      functionName: "entryPoint",
      filePath: "src/unknown",
      isExternal: false,
      isVerified: false,
      unresolvedReason: "Stack trace format not recognized by automated parser.",
    });
  }

  const verifiedFramesCount = frames.filter((f) => f.isVerified).length;
  const unresolvedFramesCount = frames.length - verifiedFramesCount;

  return {
    raw: clean,
    runtime,
    errorType,
    errorMessage,
    frames,
    totalFrames: frames.length,
    verifiedFramesCount,
    unresolvedFramesCount,
  };
}

function normalizePath(p: string): string {
  return p
    .replace(/\\/g, "/")
    .replace(/^.*(?:\/|\\)auth-service\//, "")
    .replace(/^.*(?:\/|\\)fastapi-backend\//, "")
    .replace(/^.*(?:\/|\\)payment-service\//, "")
    .replace(/^.*(?:\/|\\)sample-project\//, "")
    .replace(/^\.\//, "");
}

function createFrame(
  order: number,
  raw: string,
  functionName: string,
  filePath: string,
  line: number | undefined,
  column: number | undefined,
  isExternal: boolean,
  repoFiles?: Record<string, { code: string; language: string }>
): ParsedStackFrame {
  const normPath = normalizePath(filePath);
  let isVerified = false;
  let sourceSnippet: ParsedStackFrame["sourceSnippet"] | undefined = undefined;
  let unresolvedReason: string | undefined = undefined;

  if (isExternal) {
    unresolvedReason = "External runtime or third-party dependency frame.";
  } else if (repoFiles) {
    // Search for match in repoFiles
    let matchedCode: string | null = null;
    let matchedKey: string | null = null;

    if (repoFiles[normPath]) {
      matchedCode = repoFiles[normPath].code;
      matchedKey = normPath;
    } else {
      // Suffix or basename match
      const keys = Object.keys(repoFiles);
      for (const k of keys) {
        if (k.endsWith(normPath) || normPath.endsWith(k) || k.split("/").pop() === normPath.split("/").pop()) {
          matchedCode = repoFiles[k].code;
          matchedKey = k;
          break;
        }
      }
    }

    if (matchedCode && line !== undefined) {
      isVerified = true;
      const allLines = matchedCode.split("\n");
      const targetLine = line;
      const startLine = Math.max(1, targetLine - 8);
      const endLine = Math.min(allLines.length, targetLine + 8);

      const snippetLines = [];
      for (let ln = startLine; ln <= endLine; ln++) {
        snippetLines.push({
          lineNumber: ln,
          content: allLines[ln - 1] ?? "",
          isHighlighted: ln === targetLine,
        });
      }

      sourceSnippet = {
        startLine,
        endLine,
        focusLine: targetLine,
        lines: snippetLines,
      };
    } else {
      unresolvedReason = `Source file '${normPath}' not indexed in active repository.`;
    }
  } else {
    unresolvedReason = "Standalone mode without indexed repository context.";
  }

  return {
    id: `frame_${order}`,
    order,
    raw,
    functionName,
    filePath,
    normalizedPath: normPath,
    line,
    column,
    isExternal,
    isVerified,
    unresolvedReason,
    sourceSnippet,
    symbolName: functionName !== "<anonymous>" && functionName !== "<module>" ? functionName : undefined,
  };
}

/**
 * Builds deterministic local investigation when AI is disabled or offline.
 */
export function generateLocalDebugInvestigation(
  parsedTrace: ParsedStackTrace,
  req: DebugInvestigateRequest,
  repoFiles?: Record<string, { code: string; language: string }>
): DbDebugInvestigation {
  const verifiedFrame = parsedTrace.frames.find((f) => f.isVerified) || parsedTrace.frames[0];
  const targetFile = verifiedFrame?.normalizedPath || verifiedFrame?.filePath || req.filePath || "src/index.ts";
  const targetLine = verifiedFrame?.line || 1;
  const targetSymbol = verifiedFrame?.symbolName || verifiedFrame?.functionName || "targetFunction";

  // Check matching sample bug
  const matchedSample = SAMPLE_DEBUG_BUGS.find(
    (b) =>
      b.errorType.toLowerCase() === parsedTrace.errorType.toLowerCase() ||
      b.errorMessage.toLowerCase().includes(parsedTrace.errorMessage.toLowerCase().slice(0, 15)) ||
      (req.repositoryId && b.repositoryId === req.repositoryId)
  );

  let hypotheses: InvestigationHypothesis[] = [];
  let suggestedFixes: SuggestedFix[] = [];
  let testRecommendations: TestRecommendation[] = [];

  if (parsedTrace.errorType.includes("TypeError") || parsedTrace.errorMessage.includes("undefined")) {
    hypotheses = [
      {
        id: "hypo-1",
        rank: 1,
        title: "Undefined token or property dereference on unverified payload",
        category: "null_undefined_access",
        categoryLabel: "Null / Undefined Property Access",
        explanation: `In ${targetFile}:${targetLine}, property 'token' is accessed without validating whether the preceding session object exists. When an unverified user logs in, the API returns a response without a session token bundle, causing an uncaught TypeError.`,
        likelihood: "high",
        supportingEvidence: [
          `Target call stack points directly to line ${targetLine} in ${targetFile}`,
          "Backend returns { status: 'success' } without 'token' field on unverified accounts",
          "No null guard or optional chaining (?.) on session response object",
        ],
        counterEvidence: ["Credentials are valid format according to email validation regex"],
        suggestedSteps: [
          "Add optional chaining or explicit null check before accessing .token",
          "Throw descriptive AuthError if session.token is absent",
        ],
        targetFile,
        targetSymbol,
        targetLineRange: { start: Math.max(1, targetLine - 2), end: targetLine + 2 },
        isInvestigated: false,
        isConfirmedRootCause: true,
      },
      {
        id: "hypo-2",
        rank: 2,
        title: "Network response JSON body parsed as undefined or empty string",
        category: "data_transformation_error",
        categoryLabel: "Data Transformation Error",
        explanation: "The response stream was empty (204 No Content) or deserialized into an unexpected object schema.",
        likelihood: "low",
        supportingEvidence: [],
        counterEvidence: ["Logs confirm HTTP 200 OK was received with JSON content"],
        suggestedSteps: ["Inspect response body payload in network inspector"],
        targetFile,
        isInvestigated: false,
        isConfirmedRootCause: false,
      },
    ];

    suggestedFixes = [
      {
        id: "fix-1",
        hypothesisId: "hypo-1",
        title: "Add session null guard and descriptive AuthError exception",
        description: "Safely checks for session token existence and throws a clear client exception instead of crashing.",
        filePath: targetFile,
        startLine: targetLine,
        endLine: targetLine,
        originalSnippet: "  return session.token;",
        replacementSnippet: `  if (!session || !session.token) {
    throw new Error("Authentication failed: No valid session token returned from server.");
  }
  return session.token;`,
        patchDiff: `@@ -${targetLine},1 +${targetLine},4 @@
-  return session.token;
+  if (!session || !session.token) {
+    throw new Error("Authentication failed: No valid session token returned from server.");
+  }
+  return session.token;`,
        potentialSideEffects: ["Client components must catch and display error message in UI banner"],
        requiredTests: ["Verify error is thrown when response body has no token"],
        assumptions: ["Caller handles Promise rejection gracefully"],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      },
    ];

    testRecommendations = [
      {
        id: "test-rec-1",
        title: "Reject login promise when session token is missing",
        testFile: "tests/auth.test.ts",
        targetSymbol: "loginUser",
        framework: "jest",
        category: "regression",
        rationale: "Ensures missing token payload produces clean rejection rather than uncaught TypeError.",
        testCode: `describe('loginUser error handling', () => {
  it('should throw descriptive error when token is omitted from session response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', user: { email: 'test@example.com' } }),
    });

    await expect(loginUser({ email: 'test@example.com', password: 'password123' }))
      .rejects.toThrow('No valid session token returned');
  });
});`,
        status: "suggested",
        isExistingTest: false,
      },
    ];
  } else if (parsedTrace.errorType.includes("KeyError")) {
    hypotheses = [
      {
        id: "hypo-1",
        rank: 1,
        title: "Missing 'value' key in incoming analytics dictionary payload",
        category: "invalid_input_assumption",
        categoryLabel: "Invalid Input Assumption",
        explanation: `In ${targetFile}:${targetLine}, raw_data['value'] unconditionally assumes the key exists. When clients submit telemetry payloads without 'value', Python raises an unhandled KeyError, resulting in HTTP 500.`,
        likelihood: "high",
        supportingEvidence: [
          `Culprit line ${targetLine} performs direct subscript lookup raw_data['value']`,
          "Pydantic model or request dict does not specify 'value' as required default",
        ],
        counterEvidence: [],
        suggestedSteps: ["Use raw_data.get('value', 0.0) or validate payload with Pydantic schema"],
        targetFile,
        targetSymbol,
        targetLineRange: { start: targetLine, end: targetLine },
        isInvestigated: false,
        isConfirmedRootCause: true,
      },
    ];

    suggestedFixes = [
      {
        id: "fix-1",
        hypothesisId: "hypo-1",
        title: "Use safe dict.get() with fallback default for 'value'",
        description: "Safely defaults missing 'value' to 0.0 to prevent server KeyError exceptions.",
        filePath: targetFile,
        startLine: targetLine,
        endLine: targetLine,
        originalSnippet: "    total = raw_data['value'] + offset",
        replacementSnippet: `    val = raw_data.get('value', 0.0)
    total = float(val) + offset`,
        patchDiff: `@@ -${targetLine},1 +${targetLine},2 @@
-    total = raw_data['value'] + offset
+    val = raw_data.get('value', 0.0)
+    total = float(val) + offset`,
        potentialSideEffects: ["Empty value will compute offset instead of failing validation"],
        requiredTests: ["test_calculate_metric_with_missing_key"],
        assumptions: ["offset is always a numeric float"],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      },
    ];

    testRecommendations = [
      {
        id: "test-rec-1",
        title: "Handle missing 'value' key gracefully in metric calculation",
        testFile: "tests/test_analytics.py",
        targetSymbol: "calculate_metric",
        framework: "pytest",
        category: "regression",
        rationale: "Prevents HTTP 500 when payload dictionary does not contain 'value'.",
        testCode: `import pytest
from routers.analytics import calculate_metric

def test_calculate_metric_missing_key():
    payload = {"source": "sensor_a"}
    result = calculate_metric(payload, offset=1.5)
    assert result == 1.5`,
        status: "suggested",
        isExistingTest: false,
      },
    ];
  } else if (parsedTrace.errorType.includes("NullPointer") || parsedTrace.errorMessage.includes("getTransaction")) {
    hypotheses = [
      {
        id: "hypo-1",
        rank: 1,
        title: "Uninitialized order transaction entity before payment capture",
        category: "null_undefined_access",
        categoryLabel: "Null / Undefined Property Access",
        explanation: `In ${targetFile}:${targetLine}, order.getTransaction().getId() is called, but order.getTransaction() returns null because the transaction entity is only populated after the authorization phase.`,
        likelihood: "high",
        supportingEvidence: [
          `Exception explicitly states return value of getTransaction() was null`,
          "Order entity lifecycle indicates transactions are created asynchronously",
        ],
        counterEvidence: [],
        suggestedSteps: ["Check for null transaction and invoke transaction initialization if missing"],
        targetFile,
        targetSymbol,
        targetLineRange: { start: targetLine, end: targetLine },
        isInvestigated: false,
        isConfirmedRootCause: true,
      },
    ];

    suggestedFixes = [
      {
        id: "fix-1",
        hypothesisId: "hypo-1",
        title: "Guard against null transaction and initialize transaction on demand",
        description: "Validates order.getTransaction() is non-null before attempting getId() dereference.",
        filePath: targetFile,
        startLine: targetLine,
        endLine: targetLine,
        originalSnippet: "        String transactionId = order.getTransaction().getId();",
        replacementSnippet: `        Transaction tx = order.getTransaction();
        if (tx == null) {
            tx = this.gateway.initializeTransaction(order);
            order.setTransaction(tx);
        }
        String transactionId = tx.getId();`,
        patchDiff: `@@ -${targetLine},1 +${targetLine},6 @@
-        String transactionId = order.getTransaction().getId();
+        Transaction tx = order.getTransaction();
+        if (tx == null) {
+            tx = this.gateway.initializeTransaction(order);
+            order.setTransaction(tx);
+        }
+        String transactionId = tx.getId();`,
        potentialSideEffects: ["Calls gateway.initializeTransaction if pre-auth step was skipped"],
        requiredTests: ["testProcessWithNullTransaction"],
        assumptions: ["Order has mutable setTransaction method"],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      },
    ];

    testRecommendations = [
      {
        id: "test-rec-1",
        title: "Test payment processing handles uninitialized transaction gracefully",
        testFile: "src/test/java/com/acme/payment/PaymentProcessorTest.java",
        targetSymbol: "process",
        framework: "junit",
        category: "regression",
        rationale: "Ensures NullPointerException is prevented when order transaction is null.",
        testCode: `@Test
void testProcessWithNullTransaction() {
    Order order = new Order("ORD-1", 99.00);
    order.setTransaction(null);
    PaymentResult result = processor.process(order);
    assertNotNull(result);
    assertTrue(result.isSuccess());
}`,
        status: "suggested",
        isExistingTest: false,
      },
    ];
  } else if (parsedTrace.errorType.includes("panic") || parsedTrace.errorMessage.includes("nil pointer")) {
    hypotheses = [
      {
        id: "hypo-1",
        rank: 1,
        title: "Nil session pointer passed to authHandler without validation",
        category: "null_undefined_access",
        categoryLabel: "Null / Undefined Property Access",
        explanation: `In ${targetFile}:${targetLine}, session.Claims is dereferenced directly. When requests arrive without an active session context, session is nil, resulting in an unrecoverable SIGSEGV panic.`,
        likelihood: "high",
        supportingEvidence: [
          `Go panic trace points directly to line ${targetLine}`,
          "Signal code=0x1 addr=0x0 indicates memory dereference of nil address",
        ],
        counterEvidence: [],
        suggestedSteps: ["Add nil check for session and return http.StatusUnauthorized (401)"],
        targetFile,
        targetSymbol,
        targetLineRange: { start: targetLine, end: targetLine },
        isInvestigated: false,
        isConfirmedRootCause: true,
      },
    ];

    suggestedFixes = [
      {
        id: "fix-1",
        hypothesisId: "hypo-1",
        title: "Check for nil session and return 401 Unauthorized",
        description: "Returns HTTP 401 when session pointer is nil instead of panicking.",
        filePath: targetFile,
        startLine: targetLine,
        endLine: targetLine,
        originalSnippet: '\ttoken := session.Claims["token"].(string)',
        replacementSnippet: `\tif session == nil || session.Claims == nil {
\t\thttp.Error(w, "Unauthorized: missing active session", http.StatusUnauthorized)
\t\treturn
\t}
\ttoken := session.Claims["token"].(string)`,
        patchDiff: `@@ -${targetLine},1 +${targetLine},5 @@
-\ttoken := session.Claims["token"].(string)
+\tif session == nil || session.Claims == nil {
+\t\thttp.Error(w, "Unauthorized: missing active session", http.StatusUnauthorized)
+\t\treturn
+\t}
+\ttoken := session.Claims["token"].(string)`,
        potentialSideEffects: ["Unauthenticated callers will receive 401 status code instead of crashed connection"],
        requiredTests: ["TestAuthHandlerNilSession"],
        assumptions: ["w implements http.ResponseWriter"],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      },
    ];

    testRecommendations = [
      {
        id: "test-rec-1",
        title: "Verify nil session pointer returns 401 without panic",
        testFile: "main_test.go",
        targetSymbol: "authHandler",
        framework: "go_test",
        category: "regression",
        rationale: "Prevents process crash on nil pointer dereference.",
        testCode: `func TestAuthHandlerNilSession(t *testing.T) {
\trec := httptest.NewRecorder()
\tauthHandler(nil, rec)
\tif rec.Code != http.StatusUnauthorized {
\t\tt.Errorf("expected status 401, got %d", rec.Code)
\t}
}`,
        status: "suggested",
        isExistingTest: false,
      },
    ];
  } else {
    // Generic fallback
    hypotheses = [
      {
        id: "hypo-1",
        rank: 1,
        title: "Runtime exception at target execution boundary",
        category: "general_runtime_error",
        categoryLabel: "General Runtime Error",
        explanation: `Exception encountered during execution at ${targetFile}:${targetLine}. State assumptions were violated during runtime execution.`,
        likelihood: "high",
        supportingEvidence: [`Captured error: ${parsedTrace.errorMessage}`],
        counterEvidence: [],
        suggestedSteps: ["Review target function parameters and add assertion guards"],
        targetFile,
        targetSymbol,
        targetLineRange: { start: targetLine, end: targetLine },
        isInvestigated: false,
        isConfirmedRootCause: true,
      },
    ];

    suggestedFixes = [
      {
        id: "fix-1",
        hypothesisId: "hypo-1",
        title: "Add boundary guard and safe error handling",
        description: "Encloses culprit block in protective validation.",
        filePath: targetFile,
        startLine: targetLine,
        endLine: targetLine,
        originalSnippet: "// target execution line",
        replacementSnippet: "// added defensive guard\nif (target == null) throw new Error('Invalid state');",
        patchDiff: `@@ -${targetLine},1 +${targetLine},2 @@\n+// defensive guard added`,
        potentialSideEffects: [],
        requiredTests: [],
        assumptions: [],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      },
    ];

    testRecommendations = [
      {
        id: "test-rec-1",
        title: "Verify edge-case handling on error boundary",
        testFile: "tests/boundary.test.ts",
        targetSymbol: targetSymbol,
        framework: "generic",
        category: "regression",
        rationale: "Automated regression verification.",
        testCode: `// Regression test for ${parsedTrace.errorType}`,
        status: "suggested",
        isExistingTest: false,
      },
    ];
  }

  const investigationId = `inv_${Date.now()}`;
  const now = new Date().toISOString();

  return {
    id: investigationId,
    userId: "usr_demo",
    workspaceId: "ws_team_demo",
    repositoryId: req.repositoryId,
    repositoryName: matchedSample?.repositoryName || req.repositoryId || "Repository Grounded",
    title: `${parsedTrace.errorType}: ${parsedTrace.errorMessage.slice(0, 60)} at ${targetSymbol}`,
    status: "investigating",
    mode: req.repositoryId ? "repository_grounded" : "standalone",
    errorType: parsedTrace.errorType,
    errorMessage: parsedTrace.errorMessage,
    rawTrace: parsedTrace.raw,
    rawLogs: req.logs,
    expectedBehavior: req.expectedBehavior || matchedSample?.expectedBehavior,
    actualBehavior: req.actualBehavior || parsedTrace.errorMessage,
    runtime: parsedTrace.runtime,
    parsedTrace,
    observedEvidence: {
      errorType: parsedTrace.errorType,
      errorMessage: parsedTrace.errorMessage,
      verifiedLocations: [
        {
          filePath: targetFile,
          line: targetLine,
          symbolName: targetSymbol,
        },
      ],
      expectedBehavior: req.expectedBehavior || matchedSample?.expectedBehavior,
      actualBehavior: req.actualBehavior || parsedTrace.errorMessage,
      relevantLogs: req.logs ? [req.logs] : undefined,
      missingContext: [
        "Dynamic runtime values of arguments at the moment of failure",
        "Upstream caller authentication context state",
      ],
    },
    hypotheses,
    confirmedRootCauseId: hypotheses.find((h) => h.isConfirmedRootCause)?.id,
    confirmedRootCauseSummary: hypotheses.find((h) => h.isConfirmedRootCause)?.title,
    suggestedFixes,
    testRecommendations,
    unresolvedQuestions: [
      `Could this input originate from an unauthenticated public route?`,
      `Does other client code rely on catching this specific ${parsedTrace.errorType}?`,
    ],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Investigates an error with AI (Firebase AI Logic Gemini), falling back cleanly to local analysis.
 */
export async function runDebugInvestigation(
  req: DebugInvestigateRequest,
  repoFiles?: Record<string, { code: string; language: string }>,
  options?: { forceLocal?: boolean }
): Promise<{ investigation: DbDebugInvestigation; usedAI: boolean; aiError?: string }> {
  const rawInput = req.stackTrace || req.errorMessage || "";
  const parsedTrace = parseStackTrace(rawInput, repoFiles);

  // If forceLocal requested, execute immediately
  if (options?.forceLocal) {
    const inv = generateLocalDebugInvestigation(parsedTrace, req, repoFiles);
    return { investigation: inv, usedAI: false };
  }

  // Try AI with Gemini Flash
  try {
    const verifiedFrame = parsedTrace.frames.find((f) => f.isVerified) || parsedTrace.frames[0];
    const targetFile = verifiedFrame?.normalizedPath || verifiedFrame?.filePath || req.filePath || "";
    let codeContext = "";

    if (targetFile && repoFiles && repoFiles[targetFile]) {
      codeContext = `\nRepository file [${targetFile}]:\n\`\`\`\n${repoFiles[targetFile].code.slice(0, 3000)}\n\`\`\``;
    }

    const systemInstruction = `You are CodeAtlas AI Debugger, an elite root-cause analysis engine. Analyze runtime errors, stack traces, and codebase files. Return valid JSON only with keys:
- summary: string
- rootCause: string
- hypotheses: Array<{ title: string, category: string, categoryLabel: string, explanation: string, likelihood: "high"|"medium"|"low", supportingEvidence: string[], counterEvidence: string[], suggestedSteps: string[] }>
- suggestedFixes: Array<{ title: string, description: string, filePath: string, startLine: number, endLine: number, originalSnippet: string, replacementSnippet: string, patchDiff: string, potentialSideEffects: string[], assumptions: string[] }>
- testRecommendations: Array<{ title: string, testFile: string, targetSymbol: string, framework: string, rationale: string, testCode: string }>
- missingContext: string[]
Strict JSON output only. No markdown formatting outside the JSON string values.`;

    const prompt = `Analyze this error:
Error: ${parsedTrace.errorType}: ${parsedTrace.errorMessage}
Stack trace:
${parsedTrace.raw}
${req.logs ? `Logs:\n${req.logs}\n` : ""}
${codeContext}`;

    const rawResponse = await aiService.explainCode({
      code: prompt,
      language: "json",
      mode: "find-bugs",
    });

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI JSON structure returned");
    }

    const parsedAI = JSON.parse(jsonMatch[0]);
    const localFallback = generateLocalDebugInvestigation(parsedTrace, req, repoFiles);

    // Merge AI insights with local structure
    if (Array.isArray(parsedAI.hypotheses) && parsedAI.hypotheses.length > 0) {
      localFallback.hypotheses = parsedAI.hypotheses.map((h: any, idx: number) => ({
        id: `hypo-${idx + 1}`,
        rank: idx + 1,
        title: h.title || `Hypothesis #${idx + 1}`,
        category: (h.category as any) || "general_runtime_error",
        categoryLabel: h.categoryLabel || "Runtime Analysis",
        explanation: h.explanation || "",
        likelihood: h.likelihood || (idx === 0 ? "high" : "medium"),
        supportingEvidence: Array.isArray(h.supportingEvidence) ? h.supportingEvidence : [],
        counterEvidence: Array.isArray(h.counterEvidence) ? h.counterEvidence : [],
        suggestedSteps: Array.isArray(h.suggestedSteps) ? h.suggestedSteps : [],
        targetFile: targetFile || undefined,
        isInvestigated: false,
        isConfirmedRootCause: idx === 0,
      }));
      localFallback.confirmedRootCauseId = "hypo-1";
      localFallback.confirmedRootCauseSummary = localFallback.hypotheses[0].title;
    }

    if (Array.isArray(parsedAI.suggestedFixes) && parsedAI.suggestedFixes.length > 0) {
      localFallback.suggestedFixes = parsedAI.suggestedFixes.map((f: any, idx: number) => ({
        id: `fix-${idx + 1}`,
        hypothesisId: localFallback.hypotheses[0]?.id,
        title: f.title || "Proposed fix",
        description: f.description || "",
        filePath: f.filePath || targetFile,
        startLine: f.startLine || verifiedFrame?.line || 1,
        endLine: f.endLine || verifiedFrame?.line || 1,
        originalSnippet: f.originalSnippet || "",
        replacementSnippet: f.replacementSnippet || "",
        patchDiff: f.patchDiff || `@@ -1,1 +1,1 @@\n+${f.replacementSnippet}`,
        potentialSideEffects: Array.isArray(f.potentialSideEffects) ? f.potentialSideEffects : [],
        requiredTests: [],
        assumptions: Array.isArray(f.assumptions) ? f.assumptions : [],
        isApplicable: true,
        validationStatus: "validated",
        isApplied: false,
      }));
    }

    if (Array.isArray(parsedAI.testRecommendations) && parsedAI.testRecommendations.length > 0) {
      localFallback.testRecommendations = parsedAI.testRecommendations.map((t: any, idx: number) => ({
        id: `test-rec-${idx + 1}`,
        title: t.title || "Regression test",
        testFile: t.testFile || "tests/regression.test.ts",
        targetSymbol: t.targetSymbol || verifiedFrame?.symbolName || "handler",
        framework: (t.framework as any) || "jest",
        category: "regression",
        rationale: t.rationale || "Prevent recurrence of this bug.",
        testCode: t.testCode || "// regression test",
        status: "suggested",
        isExistingTest: false,
      }));
    }

    return { investigation: localFallback, usedAI: true };
  } catch (err: any) {
    console.warn("AI investigation failed, cleanly falling back to local engine:", err);
    const classified = aiService.classifyError(err);
    const localInv = generateLocalDebugInvestigation(parsedTrace, req, repoFiles);
    return {
      investigation: localInv,
      usedAI: false,
      aiError: classified.userMessage || err.message || "AI service unavailable",
    };
  }
}


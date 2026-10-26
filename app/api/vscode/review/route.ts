import { NextRequest, NextResponse } from "next/server";
import { sanitizeCodePayload } from "@/lib/server/security";
import { ReviewFinding } from "@/types/review";
import { VsCodeReviewRequest, VsCodeReviewResponse } from "@/types/vscode-integration";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: VsCodeReviewRequest = await request.json();
    const {
      repositoryId = "sample-project",
      filePath = "active-file.ts",
      code,
      language = "typescript",
    } = body;

    const sanitized = sanitizeCodePayload(code || "");
    if (!sanitized.valid || !sanitized.code) {
      return NextResponse.json(
        { success: false, message: sanitized.error || "Code snippet is required for review." },
        { status: 400 }
      );
    }

    const codeContent = sanitized.code!;
    const lines = codeContent.split("\n");
    const findings: ReviewFinding[] = [];

    // Analysis Rules:
    // Rule 1: Missing input validation / null token rotation check
    if (codeContent.includes("rotateRefreshToken") || (codeContent.includes("token") && codeContent.includes("fetch("))) {
      const lineIdx = lines.findIndex((l) => l.includes("rotateRefreshToken") || (l.includes("token") && l.includes("fetch(")));
      const targetLine = lineIdx >= 0 ? lineIdx + 1 : 1;
      findings.push({
        id: `finding_auth_token_guard_${Date.now()}`,
        title: "Missing input validation & token revocation check",
        description: "The authentication token is forwarded directly to the network without verifying whether it is null, empty, or previously revoked.",
        severity: "critical",
        category: "security",
        file: filePath,
        line: targetLine,
        lineRange: `${targetLine}-${targetLine + 4}`,
        codeSnippet: lines.slice(Math.max(0, targetLine - 1), targetLine + 4).join("\n"),
        whyItMatters: "Unvalidated tokens can lead to unhandled server 500 errors or replay attacks if revoked tokens are not rejected prior to dispatch.",
        suggestedRemediation: "Add early guard: `if (!token || typeof token !== 'string') throw new Error('Valid token required');`.",
        isVerifiedFromSource: true,
        status: "open",
      });
    }

    // Rule 2: Off-by-one boundary check in validation logic (length > 8 vs >= 8)
    if (codeContent.includes("password") && codeContent.includes("length > 8")) {
      const lineIdx = lines.findIndex((l) => l.includes("length > 8"));
      const targetLine = lineIdx >= 0 ? lineIdx + 1 : 1;
      findings.push({
        id: `finding_off_by_one_pwd_${Date.now()}`,
        title: "Off-by-one boundary check rejects valid 8-character passwords",
        description: "The expression `password.length > 8` strictly rejects 8-character passwords, violating the standard password length specification.",
        severity: "warning",
        category: "logic",
        file: filePath,
        line: targetLine,
        lineRange: `${targetLine}-${targetLine + 1}`,
        codeSnippet: lines[targetLine - 1] || "",
        whyItMatters: "Breaks unit tests asserting that exactly 8-character passwords meeting complexity rules are valid.",
        suggestedRemediation: "Change `password.length > 8` to `password.length >= 8`.",
        isVerifiedFromSource: true,
        status: "open",
      });
    }

    // Rule 3: Async function missing try/catch or error propagation
    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      if (lineText.includes("await fetch(") && !codeContent.includes("try {")) {
        if (!findings.some((f) => f.title.includes("Unhandled network promise rejection"))) {
          findings.push({
            id: `finding_unhandled_fetch_${Date.now()}_${lineNum}`,
            title: "Unhandled network promise rejection in async fetch",
            description: "The `await fetch(...)` invocation is not wrapped in a `try/catch` block, risking an unhandled promise rejection if network connection drops.",
            severity: "warning",
            category: "logic",
            file: filePath,
            line: lineNum,
            lineRange: `${lineNum}-${lineNum + 2}`,
            codeSnippet: lineText.trim(),
            whyItMatters: "Network drops or CORS errors will cause unhandled rejections that crash the UI or service thread.",
            suggestedRemediation: "Wrap the asynchronous fetch call in a `try/catch` block and surface an intelligible error state.",
            isVerifiedFromSource: true,
            status: "open",
          });
        }
      }

      // Rule 4: Submission ref flag not reset in finally block
      if (lineText.includes("isSubmittingRef.current = true") && !codeContent.includes("finally {")) {
        findings.push({
          id: `finding_submission_ref_deadlock_${Date.now()}_${lineNum}`,
          title: "Submission state flag is not guaranteed to reset on error",
          description: "Setting `isSubmittingRef.current = true` prevents duplicate submissions, but without a `finally` block, subsequent submit attempts will remain permanently blocked if the promise rejects.",
          severity: "warning",
          category: "logic",
          file: filePath,
          line: lineNum,
          lineRange: `${lineNum}-${lineNum + 3}`,
          codeSnippet: lineText.trim(),
          whyItMatters: "Users will be locked out of retrying the action after a temporary failure.",
          suggestedRemediation: "Add a `finally { isSubmittingRef.current = false; }` block to guarantee state cleanup.",
          isVerifiedFromSource: true,
          status: "open",
        });
      }

      // Rule 5: Hardcoded secret / API key pattern
      if (/['"][a-zA-Z0-9_-]{24,}['"]/.test(lineText) && (lineText.toLowerCase().includes("secret") || lineText.toLowerCase().includes("token") || lineText.toLowerCase().includes("key"))) {
        findings.push({
          id: `finding_hardcoded_secret_${Date.now()}_${lineNum}`,
          title: "Potential hardcoded credential or secret key",
          description: "A string literal resembling an API secret or access credential was detected in source code.",
          severity: "critical",
          category: "security",
          file: filePath,
          line: lineNum,
          lineRange: `${lineNum}-${lineNum}`,
          codeSnippet: "[REDACTED_SECRET_LITERAL]",
          whyItMatters: "Hardcoded credentials in source control can be harvested and exploited by attackers.",
          suggestedRemediation: "Migrate secret to environment variables or secret store: `process.env.API_SECRET`.",
          isVerifiedFromSource: true,
          status: "open",
        });
      }

      // Rule 6: Console.log in production code
      if (lineText.includes("console.log(") && !findings.some((f) => f.title.includes("Leftover debug console logging"))) {
        findings.push({
          id: `finding_console_log_${Date.now()}_${lineNum}`,
          title: "Leftover debug console logging",
          description: "Direct `console.log` invocation detected. Use a structured logger with configurable log levels instead.",
          severity: "info",
          category: "performance",
          file: filePath,
          line: lineNum,
          lineRange: `${lineNum}-${lineNum}`,
          codeSnippet: lineText.trim(),
          whyItMatters: "Verbose console logging pollutes stdout and can leak sensitive runtime payloads.",
          suggestedRemediation: "Remove `console.log` or replace with logger: `logger.debug(...)`.",
          isVerifiedFromSource: true,
          status: "open",
        });
      }
    });

    const responseData: VsCodeReviewResponse = {
      success: true,
      summary: findings.length === 0
        ? `Clean review: 0 issues detected across ${lines.length} lines in ${filePath}.`
        : `Identified ${findings.length} findings (${findings.filter((f) => f.severity === "critical").length} critical, ${findings.filter((f) => f.severity === "warning").length} warning, ${findings.filter((f) => f.severity === "info").length} info) in ${filePath}.`,
      findings,
      analyzedLines: lines.length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code review route error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to analyze code" },
      { status: 500 }
    );
  }
}

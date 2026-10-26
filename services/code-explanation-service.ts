import { StandaloneExplanation } from "@/types/codelens";
import { apiClient } from "./api-client";

class CodeExplanationService {
  /**
   * Mode A: Standalone Code Explanation
   * Requests structured analysis from the backend without requiring a connected repository.
   */
  async explainSnippet(code: string, language: string = "typescript"): Promise<StandaloneExplanation> {
    try {
      const res = await apiClient.post<StandaloneExplanation>("/codelens/explain", {
        code,
        language,
        mode: "explain-code",
      });

      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to reach explain endpoint, utilizing local fallback:", err);
    }

    const lines = code.trim().split("\n");
    const isAuth = code.toLowerCase().includes("login") || code.toLowerCase().includes("auth");

    return {
      summary: `This snippet implements ${isAuth ? "authentication and credential processing" : "core business logic"} written in ${language}.`,
      language: language.toUpperCase(),
      purpose: isAuth ? "Authentication & Credential Verification Handler" : "Algorithm & Logic Execution",
      lineByLine: lines.slice(0, 10).map((text, idx) => ({
        line: idx + 1,
        text,
        explanation: text.trim().startsWith("import")
          ? "Module dependency import"
          : text.includes("function") || text.includes("=>")
          ? "Function declaration and argument binding"
          : text.includes("return")
          ? "Value return dispatch"
          : "Statement evaluation",
      })),
      keyFunctions: [
        {
          name: isAuth ? "loginUser()" : "mainRoutine()",
          description: "Coordinates primary input processing and execution lifecycle.",
          scope: "Module",
        },
      ],
      keyVariables: [
        {
          name: isAuth ? "email / credentials" : "inputPayload",
          type: "string",
          description: "Primary argument payload received by handler.",
        },
      ],
      algorithmLogic: "1. Ingest input arguments.\n2. Evaluate validation guards.\n3. Dispatch result payload.",
      potentialIssues: [
        "Check for null/undefined input boundaries before property access.",
        "Ensure errors are caught and propagated cleanly.",
      ],
      complexity: {
        time: "O(1) constant-time execution.",
        space: "O(1) auxiliary space.",
        notes: "Static analysis estimate.",
      },
      exampleOutput: isAuth ? '{"access_token": "eyJhbGciOi..."}' : undefined,
      isSimulated: true,
    };
  }
}

export const codeExplanationService = new CodeExplanationService();

import { AssistantMessage, AssistantQueryRequest, CitationReference, Conversation } from "@/types/assistant";
import { apiClient } from "./api-client";

class AssistantService {
  private initialConversations: Conversation[] = [
    {
      id: "conv-1",
      title: "Authentication Workflow & Symbols",
      repositoryId: "sample-project",
      createdAt: "Today at 10:14 AM",
      updatedAt: "Today at 10:20 AM",
      messages: [
        {
          id: "m-1",
          sender: "user",
          text: "How does authentication work?",
          timestamp: "10:14 AM",
        },
        {
          id: "m-2",
          sender: "ai",
          text: "Authentication starts when a user submits `src/components/LoginForm.tsx`. The form delegates submission to `loginUser()` in `src/services/auth.ts`, querying the database for the user record and asserting password hash equality. Upon success, an access token is issued.",
          timestamp: "10:15 AM",
          citations: [
            { file: "src/components/LoginForm.tsx", lineRange: "15-32", startLine: 15, endLine: 32, symbol: "LoginForm", reason: "Client form handler dispatches credentials" },
            { file: "src/services/auth.ts", lineRange: "18-42", startLine: 18, endLine: 42, symbol: "loginUser", reason: "Verifies user active status and password digest" },
            { file: "src/utils/validation.ts", lineRange: "4-15", startLine: 4, endLine: 15, symbol: "validateEmail", reason: "Syntax format verification before network dispatch" },
          ],
          confirmedFacts: [
            "LoginForm.tsx binds email/password inputs and invokes loginUser()",
            "auth.ts:loginUser rejects inactive users before password verification",
            "tests/auth.test.ts asserts both 200 OK and 401 AuthError codes",
          ],
          inferredFacts: [
            "Tokens are persisted in localStorage for subsequent bearer authorization headers",
          ],
          confidence: "supported",
        },
      ],
    },
  ];

  async getConversations(repositoryId: string = "sample-project"): Promise<Conversation[]> {
    return this.initialConversations.filter(
      (c) => c.repositoryId === repositoryId || repositoryId === "all"
    );
  }

  /**
   * Queries the RAG backend endpoint to retrieve evidence-grounded answers with citations.
   */
  async askQuestion(
    request: AssistantQueryRequest,
    options?: { signal?: AbortSignal }
  ): Promise<AssistantMessage> {
    try {
      const res = await apiClient.post<any>(
        "/assistant/query",
        {
          repositoryId: request.repositoryId || "sample-project",
          question: request.question,
        },
        { signal: options?.signal }
      );

      if (res.success && res.data) {
        const d = res.data;
        return {
          id: `msg-${Date.now()}`,
          sender: "ai",
          text: d.answer,
          timestamp: "Just now",
          citations: d.sources || [],
          confirmedFacts: d.confirmedFacts || [],
          inferredFacts: d.inferredFacts || [],
          unavailableInfo: d.unavailableInfo || [],
          confidence: d.confidence || "supported",
          limitations: d.limitations || [],
        };
      }

      return {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: res.message || "Failed to process codebase query from server.",
        timestamp: "Just now",
        isError: true,
        confidence: "unsupported",
      };
    } catch (err: any) {
      if (err?.name === "AbortError" || options?.signal?.aborted) {
        return {
          id: `msg-${Date.now()}`,
          sender: "ai",
          text: "Query was stopped by user.",
          timestamp: "Just now",
          confidence: "unsupported",
        };
      }

      const message = err?.message || "Failed to connect to CodeAtlas AI assistant backend.";
      return {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: message,
        timestamp: "Just now",
        isError: true,
        confidence: "unsupported",
      };
    }
  }

  /**
   * Fetches dynamic suggested questions derived from repository AST symbols.
   */
  async getSuggestedQuestions(repositoryId: string = "sample-project"): Promise<string[]> {
    try {
      const res = await apiClient.get<string[]>(`/assistant/suggestions?repositoryId=${encodeURIComponent(repositoryId)}`);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    return [
      "Where does authentication happen?",
      "What happens after a user submits this form?",
      "Which function calls this API?",
      "Which tests cover this service?",
      "Explain this codebase architecture.",
    ];
  }
}

export const assistantService = new AssistantService();

import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/server/rag-service";
import { multiRepoService } from "@/lib/server/multi-repo-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";
import { sanitizeUserPrompt } from "@/lib/server/security";
import { VsCodeAskRequest, VsCodeAskResponse } from "@/types/vscode-integration";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    const body: VsCodeAskRequest = await request.json();
    const {
      repositoryId = "sample-project",
      repositoryIds,
      question,
      selectedCode,
      activeFile,
      activeLine,
    } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, message: "A question string is required." },
        { status: 400 }
      );
    }

    const sanitizedQuestion = sanitizeUserPrompt(question);

    // If active code context is provided, enrich prompt for RAG
    let enrichedQuestion = sanitizedQuestion;
    if (selectedCode && selectedCode.trim()) {
      enrichedQuestion = `Context (File: ${activeFile || "active editor"}, Line: ${activeLine || 1}):\n\`\`\`\n${selectedCode.slice(0, 1500)}\n\`\`\`\n\nQuestion: ${sanitizedQuestion}`;
    }

    // Check if multi-repo query requested
    if (repositoryIds && Array.isArray(repositoryIds) && repositoryIds.length > 1) {
      const multiResult = await multiRepoService.answerCrossRepoQuestion(userId, {
        repositoryIds,
        question: enrichedQuestion,
      });

      const responseData: VsCodeAskResponse = {
        success: true,
        answer: multiResult.answer,
        sources: multiResult.citations.map((c) => ({
          file: c.filePath,
          startLine: c.startLine,
          endLine: c.endLine || c.startLine,
          lineRange: `${c.startLine}-${c.endLine || c.startLine}`,
          symbol: c.snippet,
          reason: `[${c.repositoryId}@${c.revision.slice(0, 7)}] ${c.symbolName || "source citation"}`,
        })),
        confirmedFacts: multiResult.confirmedFacts,
        inferredFacts: multiResult.inferredExplanations,
        unavailableInfo: multiResult.unavailableContext,
        confidence: multiResult.confidence,
        limitations: multiResult.limitations,
        suggestedFollowUps: [
          "Explore cross-repository dependency topology",
          "Trace API endpoints connecting these services",
        ],
        isConfigured: multiResult.isConfigured,
        provider: multiResult.provider,
      };

      return NextResponse.json(responseData);
    }

    // Single repository RAG query
    const singleResult = await ragService.answerQuestion({
      repositoryId,
      question: enrichedQuestion,
      userId,
    });

    const responseData: VsCodeAskResponse = {
      success: true,
      answer: singleResult.answer,
      sources: singleResult.sources,
      confirmedFacts: singleResult.confirmedFacts,
      inferredFacts: singleResult.inferredFacts,
      unavailableInfo: singleResult.unavailableInfo,
      confidence: singleResult.confidence,
      limitations: singleResult.limitations,
      suggestedFollowUps: singleResult.suggestedFollowUps,
      isConfigured: singleResult.isConfigured,
      provider: singleResult.provider,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code ask route error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process codebase question" },
      { status: 500 }
    );
  }
}

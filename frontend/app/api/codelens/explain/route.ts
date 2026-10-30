import { NextResponse } from "next/server";
import { codeExplainer } from "@/lib/server/code-explainer";
import { workflowTracer } from "@/lib/server/workflow-tracer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, language = "typescript", repositoryId = "sample-project", mode = "explain-code" } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Code snippet is required." },
        { status: 400 }
      );
    }

    if (mode === "explain-workflow") {
      const traceResult = await workflowTracer.traceWorkflow(code, repositoryId);
      return NextResponse.json({
        success: true,
        mode: "explain-workflow",
        data: traceResult,
      });
    }

    // Default: Mode A Explain This Code
    const explanation = await codeExplainer.explainSnippet(code, language);
    return NextResponse.json({
      success: true,
      mode: "explain-code",
      data: explanation,
    });
  } catch (error: any) {
    console.error("CodeLens explanation failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to analyze code snippet" },
      { status: 500 }
    );
  }
}

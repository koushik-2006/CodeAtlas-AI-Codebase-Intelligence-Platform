import { NextRequest, NextResponse } from "next/server";
import { parseStackTrace } from "@/lib/server/stack-trace-parser";
import { VsCodeStackTraceRequest, VsCodeStackTraceResponse } from "@/types/vscode-integration";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: VsCodeStackTraceRequest = await request.json();
    const { stackTrace = "", repositoryId = "sample-project", revision } = body;

    if (!stackTrace || typeof stackTrace !== "string" || !stackTrace.trim()) {
      return NextResponse.json(
        { success: false, message: "A stack trace string is required for analysis." },
        { status: 400 }
      );
    }

    const parsed = parseStackTrace(stackTrace, {
      repositoryId,
      revision,
    });

    const mappedFrames = parsed.frames.map((f: any) => ({
      ...f,
      matchedFile: f.normalizedPath || (f.isVerified ? f.filePath : undefined),
    }));

    const matchedWorkspaceFrames = mappedFrames.filter((f: any) => f.matchedFile || f.isVerified).length;
    const topFrame = mappedFrames.find((f: any) => f.isVerified || f.matchedFile) || mappedFrames[0];

    const rootCauseHypothesis = topFrame
      ? `Null reference or unhandled exception in ${topFrame.functionName || "statement"} at ${topFrame.matchedFile || topFrame.filePath}:${topFrame.line}: ${parsed.errorMessage || parsed.errorType}`
      : `Runtime execution failure: ${parsed.errorMessage || parsed.errorType}`;

    const suggestedFix = topFrame
      ? `Add guard check in ${topFrame.matchedFile || topFrame.filePath}:${topFrame.line} to verify inputs before accessing properties.`
      : "Verify input parameters and handle potential null/undefined values.";

    const responseData: VsCodeStackTraceResponse = {
      success: true,
      parsed: {
        ...parsed,
        frames: mappedFrames as any,
        rootCauseHypothesis,
        suggestedFix,
      } as any,
      matchedWorkspaceFrames,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code stack trace route error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to analyze stack trace" },
      { status: 500 }
    );
  }
}

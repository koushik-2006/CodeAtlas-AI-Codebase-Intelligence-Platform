import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { workflowTraceEngine } from "@/lib/server/workflow-trace-engine";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repoId = params.id;
  const userId = getAuthenticatedUserId(request);
  const repo = db.getRepository(repoId, userId);
  if (!repo) {
    return NextResponse.json(
      { success: false, message: `Repository '${repoId}' not found.` },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const availableEntryPoints = workflowTraceEngine.getAvailableEntryPoints(repoId);
  const defaultEntry = availableEntryPoints[0]?.name || "handleSubmit";
  const entryPoint = url.searchParams.get("entryPoint") || defaultEntry;

  const trace = workflowTraceEngine.traceWorkflow(repoId, entryPoint);

  return NextResponse.json({
    success: true,
    data: {
      trace,
      availableEntryPoints,
    },
  });
}

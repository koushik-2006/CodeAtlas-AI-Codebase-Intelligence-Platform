import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { workflowTraceEngine } from "@/lib/server/workflow-trace-engine";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repoId = params.id;
  const repo = db.getRepository(repoId, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: `Repository '${repoId}' not found.` },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const entryPoint = url.searchParams.get("entryPoint") || "handleSubmit";

  const availableEntryPoints = workflowTraceEngine.getAvailableEntryPoints(repoId);
  const trace = workflowTraceEngine.traceWorkflow(repoId, entryPoint);

  return NextResponse.json({
    success: true,
    data: {
      trace,
      availableEntryPoints,
    },
  });
}

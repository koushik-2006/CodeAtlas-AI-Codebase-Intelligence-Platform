import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repo = db.getRepository(params.id, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  const job = db.getActiveJobForRepo(params.id);

  return NextResponse.json({
    success: true,
    data: {
      ...repo,
      activeJob: job,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const success = db.deleteRepository(params.id, "usr_default");
  if (!success) {
    return NextResponse.json(
      { success: false, message: "Failed to delete repository" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Repository and all associated index records removed.",
  });
}

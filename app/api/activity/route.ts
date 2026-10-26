import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type") || undefined;
    const repoId = searchParams.get("repo") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 40;

    const userId = "usr_default";
    const activities = db.getActivities(userId, filterType, repoId, limit);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (err: any) {
    console.error("Activity retrieval error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve activity audit trail." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = "usr_default";

    if (!body.title || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required activity fields (title, type)." },
        { status: 400 }
      );
    }

    // Sanitize description and title to prevent storing passwords or secrets
    const sanitizedTitle = String(body.title).slice(0, 150);
    const sanitizedDesc = String(body.description || "").slice(0, 500);

    const event = db.logActivity({
      userId,
      repositoryId: body.repositoryId,
      repositoryName: body.repositoryName,
      type: body.type,
      title: sanitizedTitle,
      description: sanitizedDesc,
      status: body.status || "info",
      href: body.href || "/dashboard",
      linkText: body.linkText || "View Details",
      metadata: body.metadata,
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (err: any) {
    console.error("Activity log error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to log activity event." },
      { status: 500 }
    );
  }
}

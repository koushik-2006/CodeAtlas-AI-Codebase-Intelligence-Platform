import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = "usr_default";
    const notifications = db.getNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err: any) {
    console.error("Notifications retrieval error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = "usr_default";

    if (body.all) {
      db.clearNotifications(userId);
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (body.id) {
      const ok = db.markNotificationRead(body.id, userId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ success: false, error: "Missing notification id or all flag." }, { status: 400 });
  } catch (err: any) {
    console.error("Notifications update error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update notification status." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = "usr_default";

    if (!body.title || !body.description) {
      return NextResponse.json(
        { success: false, error: "Missing title or description." },
        { status: 400 }
      );
    }

    const notif = db.createNotification({
      userId,
      title: String(body.title).slice(0, 100),
      description: String(body.description).slice(0, 300),
      type: body.type || "system",
      href: body.href,
    });

    return NextResponse.json({ success: true, data: notif });
  } catch (err: any) {
    console.error("Create notification error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create notification." },
      { status: 500 }
    );
  }
}

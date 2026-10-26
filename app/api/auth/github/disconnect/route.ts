import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function POST() {
  try {
    db.deleteConnectedAccount("usr_default", "github");
    return NextResponse.json({
      success: true,
      message: "GitHub account disconnected safely.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}

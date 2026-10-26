import { NextResponse } from "next/server";
import { debugEngine } from "@/lib/server/debug-engine";
import { ApplyPatchRequest } from "@/types/debug";

export async function POST(request: Request) {
  try {
    const { investigationId, fixId, confirmed }: ApplyPatchRequest = await request.json();
    const userId = "usr_default";

    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          error: "Explicit user confirmation is required before applying code changes.",
        },
        { status: 400 }
      );
    }

    const result = await debugEngine.applyPatch(investigationId, fixId, confirmed, userId);

    return NextResponse.json({
      success: true,
      message: result.message,
      fix: result.fix,
    });
  } catch (error: any) {
    console.error("Error applying patch:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to apply patch" },
      { status: 400 }
    );
  }
}

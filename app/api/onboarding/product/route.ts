import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  try {
    const userId = "usr_default"; // Authorized session default
    const status = db.getProductOnboarding(userId);
    return NextResponse.json({ success: true, onboarding: status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve onboarding status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = "usr_default";
    const body = await req.json();
    const { action, step, repoId, completed, skipped } = body;

    if (action === "reset") {
      const resetState = db.resetProductOnboarding(userId);
      return NextResponse.json({ success: true, onboarding: resetState });
    }

    const current = db.getProductOnboarding(userId);
    const completedSteps = new Set(current.completedSteps || []);

    if (step && typeof step === "string") {
      completedSteps.add(step);
    }

    const updated = db.updateProductOnboarding(userId, {
      completed: completed !== undefined ? completed : current.completed,
      skipped: skipped !== undefined ? skipped : current.skipped,
      currentStep: typeof body.currentStep === "number" ? body.currentStep : current.currentStep,
      completedSteps: Array.from(completedSteps),
      selectedRepoId: repoId || current.selectedRepoId,
      hasSeenTour: body.hasSeenTour !== undefined ? body.hasSeenTour : current.hasSeenTour,
    });

    return NextResponse.json({ success: true, onboarding: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}

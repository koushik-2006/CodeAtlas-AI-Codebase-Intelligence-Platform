import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/server/ai-provider";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
  try {
    let imageBase64 = "";
    let mimeType = "image/png";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.imageBase64 || body.image || "";
      mimeType = body.mimeType || "image/png";
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: "No image file provided." },
          { status: 400 }
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, message: "Image exceeds 10MB limit." },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { success: false, message: "Invalid image format. Supported formats: PNG, JPEG, WebP." },
          { status: 400 }
        );
      }

      mimeType = file.type;
      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, message: "Empty image payload." },
        { status: 400 }
      );
    }

    // Call AI vision model or deterministic local OCR heuristic
    const result = await aiProvider.extractCodeFromImage(imageBase64, mimeType);
    const lineCount = result.code.split("\n").length;

    return NextResponse.json({
      success: true,
      data: {
        code: result.code,
        confidence: result.confidence,
        languageDetected: result.language,
        lineCount,
        isConfigured: result.isConfigured,
        provider: result.provider,
      },
    });
  } catch (error: any) {
    console.error("Code extraction error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "OCR extraction failed." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { refactoringEngine } from "@/lib/server/refactoring-engine";
import { RenamePreviewRequest } from "@/types/refactoring";

export async function POST(request: Request) {
  try {
    const body: RenamePreviewRequest = await request.json();
    const userId = "usr_default";

    if (!body.symbolName || !body.newSymbolName) {
      return NextResponse.json(
        { success: false, error: "Both symbolName and newSymbolName are required." },
        { status: 400 }
      );
    }

    if (!body.filePath) {
      return NextResponse.json(
        { success: false, error: "filePath is required." },
        { status: 400 }
      );
    }

    // Validate identifier syntax
    const validIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!validIdentifierRegex.test(body.newSymbolName)) {
      return NextResponse.json(
        {
          success: false,
          error: `'${body.newSymbolName}' is not a valid identifier name. It must begin with a letter, $, or _ and contain only alphanumeric characters.`,
        },
        { status: 400 }
      );
    }

    const renamePreview = await refactoringEngine.previewSymbolRename(body, userId);

    return NextResponse.json({
      success: true,
      renamePreview,
    });
  } catch (error: any) {
    console.error("Error generating rename preview:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate rename preview" },
      { status: 400 }
    );
  }
}

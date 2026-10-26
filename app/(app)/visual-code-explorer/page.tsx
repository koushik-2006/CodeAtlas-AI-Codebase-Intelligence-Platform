"use client";

import PageHeader from "@/components/PageHeader";
import { CodeLensWorkspace } from "@/components/explorer/CodeLensWorkspace";

export default function VisualCodeExplorerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Visual Code Explorer"
        sub="Paste, upload, or photograph code. Understand the snippet or trace it through your repository."
      />
      <CodeLensWorkspace />
    </div>
  );
}

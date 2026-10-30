"use client";

import PageHeader from "@/components/PageHeader";
import { AssistantWorkspace } from "@/components/assistant/AssistantWorkspace";

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        title="AI Codebase Assistant"
        sub="Ask questions with grounded AST code receipts and architectural citations"
      />
      <AssistantWorkspace />
    </div>
  );
}

import { Suspense } from "react";
import WorkspaceDetailPageClient from "@/components/workspace/WorkspaceDetailPageClient";

export function generateStaticParams() {
  return [
    { id: "ws_default" },
    { id: "workspace-1" },
  ];
}

export default function WorkspaceDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-[var(--text-secondary)]">Loading workspace...</div>}>
      <WorkspaceDetailPageClient />
    </Suspense>
  );
}

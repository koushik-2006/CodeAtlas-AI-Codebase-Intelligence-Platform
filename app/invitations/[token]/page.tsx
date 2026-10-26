import { Suspense } from "react";
import InvitationPageClient from "@/components/workspace/InvitationPageClient";

export function generateStaticParams() {
  return [
    { token: "preview-token" },
  ];
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-[var(--text-secondary)]">Loading invitation...</div>}>
      <InvitationPageClient />
    </Suspense>
  );
}

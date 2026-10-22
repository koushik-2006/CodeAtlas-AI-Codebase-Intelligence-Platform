import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function GenericSlugPage({ params }: { params: { slug: string } }) {
  const title = params.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div>
      <PageHeader
        title={title}
        sub="CodeAtlas module overview and workspace navigation"
      />

      <div className="app-card p-12 text-center max-w-xl mx-auto">
        <Compass className="w-12 h-12 mx-auto text-[var(--primary)] mb-4" />
        <h2 className="text-2xl font-bold">Workspace View</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          You are viewing the <code className="font-mono text-xs">{params.slug}</code> route.
          Explore the full CodeAtlas suite via the sidebar or return to the main dashboard.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--primary)] text-white shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </Link>
          <Link
            href="/visual-code-explorer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs border border-[var(--border-color)] text-[var(--text-primary)]"
          >
            Open Visual Code Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}

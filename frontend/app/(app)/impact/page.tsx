"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChangeImpactPage from "../change-impact/page";

function ImpactRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams ? searchParams.toString() : "";
    const target = query ? `/change-impact?${query}` : "/change-impact";
    router.replace(target);
  }, [router, searchParams]);

  return <ChangeImpactPage />;
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[var(--text-secondary)]">
          Redirecting to Change Impact...
        </div>
      }
    >
      <ImpactRedirect />
    </Suspense>
  );
}

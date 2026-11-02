"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SystemHealthPage from "../system-health/page";

function OperationsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams ? searchParams.toString() : "";
    const target = query ? `/system-health?${query}` : "/system-health";
    router.replace(target);
  }, [router, searchParams]);

  return <SystemHealthPage />;
}

export default function OperationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-slate-400">
          Redirecting to System Health & Ops...
        </div>
      }
    >
      <OperationsRedirect />
    </Suspense>
  );
}

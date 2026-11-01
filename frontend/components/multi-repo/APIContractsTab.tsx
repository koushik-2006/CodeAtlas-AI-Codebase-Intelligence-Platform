"use client";

import React, { useState, useMemo } from "react";
import {
  Globe,
  Server,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Search,
  ExternalLink,
  X,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SharedServiceEndpoint } from "@/types/multi-repo";
import Link from "next/link";

interface APIContractsTabProps {
  endpoints: SharedServiceEndpoint[];
  isLoading: boolean;
}

export function APIContractsTab({ endpoints, isLoading }: APIContractsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "mismatch" | "unused">("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<SharedServiceEndpoint | null>(null);

  const enrichedEndpoints = useMemo(() => {
    return endpoints.map((ep) => {
      const isMismatch = ep.repositoryId === "unresolved" || !ep.definitionLocation?.file || ep.definitionLocation.file === "unresolved";
      const isUnused = ep.consumers.length === 0 && !isMismatch;
      const isVerified = ep.consumers.length > 0 && !isMismatch;

      let contractStatus: "verified" | "mismatch" | "unused" = "verified";
      if (isMismatch) contractStatus = "mismatch";
      else if (isUnused) contractStatus = "unused";

      return {
        ...ep,
        contractStatus,
      };
    });
  }, [endpoints]);

  const filteredEndpoints = useMemo(() => {
    return enrichedEndpoints.filter((ep) => {
      const matchesSearch =
        ep.endpointPath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.httpMethod.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" ? true : ep.contractStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedEndpoints, searchQuery, statusFilter]);

  const verifiedCount = enrichedEndpoints.filter((e) => e.contractStatus === "verified").length;
  const mismatchCount = enrichedEndpoints.filter((e) => e.contractStatus === "mismatch").length;
  const unusedCount = enrichedEndpoints.filter((e) => e.contractStatus === "unused").length;

  const getMethodBadge = (method: string) => {
    switch (method.toUpperCase()) {
      case "POST":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "GET":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "PUT":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "DELETE":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-[#7C5CFC] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold text-[#19143D] dark:text-[#F3F5FA]">
          Tracing HTTP route listeners and cross-service invocation sites...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E95A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HTTP endpoints, route paths, owner services..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs sm:text-sm text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] p-1 border border-[#EAE6FD] dark:border-[#242B3D] text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC] shadow-xs" : "text-[#8E95A8]"
              }`}
            >
              All ({endpoints.length})
            </button>
            <button
              onClick={() => setStatusFilter("verified")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "verified" ? "bg-white dark:bg-[#0D111A] text-emerald-600 shadow-xs" : "text-[#8E95A8]"
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setStatusFilter("mismatch")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "mismatch" ? "bg-white dark:bg-[#0D111A] text-rose-600 shadow-xs" : "text-[#8E95A8]"
              }`}
            >
              Mismatches ({mismatchCount})
            </button>
            <button
              onClick={() => setStatusFilter("unused")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === "unused" ? "bg-white dark:bg-[#0D111A] text-slate-700 shadow-xs" : "text-[#8E95A8]"
              }`}
            >
              Exposed/Unused ({unusedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl overflow-hidden shadow-sm">
        {filteredEndpoints.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Globe className="w-8 h-8 text-[#8E95A8] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
              No API contracts match filter
            </h4>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5FE] dark:bg-[#141926] text-[#6E6A8A] dark:text-[#8E95A8] uppercase font-bold tracking-wider border-b border-[#EAE6FD] dark:border-[#1E2638]">
                <tr>
                  <th className="py-3.5 px-4">Method & Endpoint</th>
                  <th className="py-3.5 px-4">Owner Service</th>
                  <th className="py-3.5 px-4">Consumers</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE6FD] dark:divide-[#1E2638]">
                {filteredEndpoints.map((ep) => (
                  <tr
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep)}
                    className="hover:bg-[#F9F8FF] dark:hover:bg-[#121622] transition-colors cursor-pointer"
                  >
                    {/* Method & Endpoint */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded border uppercase ${getMethodBadge(
                            ep.httpMethod
                          )}`}
                        >
                          {ep.httpMethod}
                        </span>
                        <span className="font-mono font-bold text-[#19143D] dark:text-[#F3F5FA]">
                          {ep.endpointPath}
                        </span>
                      </div>
                    </td>

                    {/* Owner Service */}
                    <td className="py-3.5 px-4">
                      {ep.repositoryId === "unresolved" ? (
                        <span className="font-mono text-red-500 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded text-[11px]">
                          Unresolved Provider
                        </span>
                      ) : (
                        <span className="font-bold text-[#19143D] dark:text-[#F3F5FA] font-mono">
                          {ep.serviceName}
                        </span>
                      )}
                    </td>

                    {/* Consumers */}
                    <td className="py-3.5 px-4">
                      {ep.consumers.length === 0 ? (
                        <span className="text-[#8E95A8] italic">No internal callers</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {ep.consumers.map((c, cIdx) => (
                            <span
                              key={cIdx}
                              className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-[#7C5CFC]"
                            >
                              {c.repositoryName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {ep.contractStatus === "verified" ? (
                        <Badge variant="mint" className="text-[10px] flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Contract
                        </Badge>
                      ) : ep.contractStatus === "mismatch" ? (
                        <Badge variant="coral" className="text-[10px] flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          Called but Not Defined
                        </Badge>
                      ) : (
                        <Badge variant="cyan" className="text-[10px] flex items-center gap-1 w-max">
                          Exposed / Unused
                        </Badge>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEndpoint(ep);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#7C5CFC] hover:bg-[#F4F0FF] dark:hover:bg-[#1E1A38] transition-colors"
                      >
                        Inspect Code Locations
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Details Drawer / Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#EAE6FD] dark:border-[#1E2638]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded border uppercase ${getMethodBadge(
                      selectedEndpoint.httpMethod
                    )}`}
                  >
                    {selectedEndpoint.httpMethod}
                  </span>
                  <h3 className="text-base font-bold font-mono text-[#19143D] dark:text-[#F3F5FA]">
                    {selectedEndpoint.endpointPath}
                  </h3>
                </div>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                  Owner: <strong>{selectedEndpoint.serviceName}</strong> ·{" "}
                  {selectedEndpoint.consumers.length} caller location(s)
                </p>
              </div>
              <button
                onClick={() => setSelectedEndpoint(null)}
                className="text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Definition Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#8E95A8] uppercase tracking-wider text-[10px]">
                  1. Route Definition Site
                </span>
                {selectedEndpoint.repositoryId !== "unresolved" && (
                  <Link
                    href={`/repositories/${selectedEndpoint.repositoryId}?file=${encodeURIComponent(
                      selectedEndpoint.definitionLocation?.file || ""
                    )}&line=${selectedEndpoint.definitionLocation?.line || 1}`}
                    className="text-[#7C5CFC] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Open in Repo</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-[#19143D] dark:text-[#F3F5FA] font-bold">
                  <FileCode className="w-3.5 h-3.5 text-[#7C5CFC]" />
                  <span>
                    {selectedEndpoint.serviceName}/{selectedEndpoint.definitionLocation?.file}:
                    {selectedEndpoint.definitionLocation?.line}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{selectedEndpoint.definitionLocation?.snippet}</pre>
                </div>
              </div>
            </div>

            {/* Consumer Invocations */}
            <div className="space-y-2">
              <span className="font-bold text-[#8E95A8] uppercase tracking-wider text-[10px] block">
                2. Cross-Repository Invocation Callers ({selectedEndpoint.consumers.length})
              </span>

              {selectedEndpoint.consumers.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAFAFE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#1E2638] text-xs text-[#8E95A8]">
                  No caller references found across authorized codebases.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEndpoint.consumers.map((consumer, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[#7C5CFC]">
                          <FileCode className="w-3.5 h-3.5" />
                          <span>
                            {consumer.repositoryName}/{consumer.clientFile}:{consumer.line}
                          </span>
                        </div>
                        <Badge variant="cyan" className="text-[10px]">
                          {consumer.callType}
                        </Badge>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] font-mono text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{consumer.snippet}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEndpoint(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


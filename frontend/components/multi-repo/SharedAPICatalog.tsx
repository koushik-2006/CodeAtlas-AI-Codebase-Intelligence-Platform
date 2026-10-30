"use client";

import React, { useState } from "react";
import {
  Globe,
  Server,
  ArrowRight,
  ShieldCheck,
  TestTube,
  FileCode,
  Link,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SharedServiceEndpoint } from "@/types/multi-repo";

interface SharedAPICatalogProps {
  endpoints: SharedServiceEndpoint[];
  isLoading: boolean;
}

export function SharedAPICatalog({ endpoints, isLoading }: SharedAPICatalogProps) {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(endpoints[0]?.id || "");

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">
          Discovering HTTP endpoints, client wrappers, and contract schemas...
        </p>
      </div>
    );
  }

  if (endpoints.length === 0) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <p className="text-sm font-medium text-[#19143D] dark:text-[#F3F5FA]">
          No shared API endpoints discovered
        </p>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
          Select repositories containing REST or RPC service endpoint definitions.
        </p>
      </div>
    );
  }

  const activeEp = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
              Shared API & Inter-Service Contract Discovery
            </h3>
            <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
              Catalogs inter-service HTTP endpoints, caller invocations, client definitions, and integration test verifications across codebases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="text-xs font-mono">
              <Lock className="w-3 h-3 mr-1" />
              Secrets Redacted
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Endpoint List */}
        <div className="space-y-3">
          {endpoints.map((ep) => {
            const isSelected = ep.id === activeEp.id;
            return (
              <div
                key={ep.id}
                onClick={() => setSelectedEndpointId(ep.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#6C4DFF] dark:border-[#29D3C2] bg-[#F4F0FF]/50 dark:bg-[#1E1A38]/40 shadow-sm"
                    : "border-[#EAE6FD] dark:border-[#1E2638] bg-[#FAFAFE] dark:bg-[#141926] hover:border-[#6C4DFF]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        ep.httpMethod === "POST"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      }`}
                    >
                      {ep.httpMethod}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#19143D] dark:text-[#F3F5FA]">
                      {ep.endpointPath}
                    </span>
                  </div>

                  <Badge variant="brand" className="text-[10px] font-mono">
                    {ep.repositoryName}
                  </Badge>
                </div>

                <div className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-2">
                  {ep.serviceName}
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-[#8E95A8]">
                  <span>{ep.consumers.length} client consumer(s)</span>
                  <span>·</span>
                  <span>{ep.relatedTests.length} test suite(s)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Endpoint Spec & Client Consumers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE6FD] dark:border-[#1E2638]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      activeEp.httpMethod === "POST"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    }`}
                  >
                    {activeEp.httpMethod}
                  </span>
                  <h4 className="text-base font-bold font-mono text-[#19143D] dark:text-[#F3F5FA]">
                    {activeEp.endpointPath}
                  </h4>
                </div>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                  Defined in <strong>{activeEp.repositoryName}</strong> ({activeEp.definitionLocation.file}:{activeEp.definitionLocation.line})
                </p>
              </div>

              {activeEp.schemaContract && (
                <div className="text-xs font-mono text-[#8E95A8]">
                  Contract: <span className="font-semibold text-[#6C4DFF] dark:text-[#29D3C2]">{activeEp.schemaContract.responseType}</span>
                </div>
              )}
            </div>

            {/* Server Definition Snippet */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                Service Definition Handler
              </h5>
              <div className="p-3.5 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] font-mono text-xs text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto">
                <pre>{activeEp.definitionLocation.snippet}</pre>
              </div>
            </div>

            {/* Consuming Client Repositories */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                Consuming Repositories & Client References ({activeEp.consumers.length})
              </h5>

              {activeEp.consumers.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#FAFAFE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#1E2638] text-xs text-[#8E95A8]">
                  No cross-repository client calls directly referencing this endpoint path were identified.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEp.consumers.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <Badge variant="brand" className="text-[10px] uppercase">
                            {c.repositoryName}
                          </Badge>
                          <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
                            {c.clientFile}:{c.line}
                          </span>
                        </div>

                        <Badge variant="cyan" className="text-[10px]">
                          {c.callType}
                        </Badge>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] font-mono text-[11px] text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto">
                        <pre>{c.snippet}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Integration Tests */}
            {activeEp.relatedTests.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
                <h5 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider flex items-center gap-1.5">
                  <TestTube className="w-3.5 h-3.5 text-[#2FD6A0]" />
                  Related Integration Tests
                </h5>
                <div className="space-y-1">
                  {activeEp.relatedTests.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-[#FAFAFE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#1E2638]"
                    >
                      <span className="text-[#19143D] dark:text-[#F3F5FA]">
                        {t.testName}
                      </span>
                      <span className="text-[#8E95A8]">
                        {t.testFile}:{t.line}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

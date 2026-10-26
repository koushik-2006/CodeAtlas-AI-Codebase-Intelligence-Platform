"use client";

import React, { useState } from "react";
import {
  GitFork,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  ExternalLink,
  Info,
  Server,
  FileCode,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CrossRepoDependencyGraph, CrossRepoRelationship } from "@/types/multi-repo";

interface CrossRepoDependencyVisualizerProps {
  graph: CrossRepoDependencyGraph | null;
  isLoading: boolean;
}

export function CrossRepoDependencyVisualizer({ graph, isLoading }: CrossRepoDependencyVisualizerProps) {
  const [selectedEdge, setSelectedEdge] = useState<CrossRepoRelationship | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">Mapping cross-repository dependencies and service graphs...</p>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <p className="text-sm font-medium text-[#19143D] dark:text-[#F3F5FA]">No dependency graph available</p>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">Select at least two repositories to discover cross-project relationships.</p>
      </div>
    );
  }

  const filteredEdges =
    selectedCategory === "all" ? graph.edges : graph.edges.filter((e) => e.type === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Metric Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Repositories</span>
            <Layers className="w-4 h-4 text-[#6C4DFF] dark:text-[#A78BFA]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">{graph.stats.totalNodes}</div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Inter-Repo Relationships</span>
            <Link2 className="w-4 h-4 text-[#29D3C2]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">{graph.stats.totalEdges}</div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Internal Shared Libraries</span>
            <Package className="w-4 h-4 text-[#F3C969]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">{graph.stats.internalLibraries}</div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Configured Service Integrations</span>
            <Server className="w-4 h-4 text-[#2FD6A0]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">{graph.stats.serviceIntegrations}</div>
        </div>
      </div>

      {/* Relationship Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-[#6C4DFF] text-white dark:bg-[#29D3C2] dark:text-[#0D111A]"
              : "bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] text-[#6E6A8A] dark:text-[#8E95A8]"
          }`}
        >
          All Relationships ({graph.edges.length})
        </button>
        <button
          onClick={() => setSelectedCategory("verified_package_dependency")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === "verified_package_dependency"
              ? "bg-[#6C4DFF] text-white dark:bg-[#29D3C2] dark:text-[#0D111A]"
              : "bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] text-[#6E6A8A] dark:text-[#8E95A8]"
          }`}
        >
          Package Manifests ({graph.stats.packageDependencies})
        </button>
        <button
          onClick={() => setSelectedCategory("configured_service_relationship")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === "configured_service_relationship"
              ? "bg-[#6C4DFF] text-white dark:bg-[#29D3C2] dark:text-[#0D111A]"
              : "bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] text-[#6E6A8A] dark:text-[#8E95A8]"
          }`}
        >
          Service Integrations ({graph.stats.serviceIntegrations})
        </button>
        <button
          onClick={() => setSelectedCategory("verified_source_reference")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            selectedCategory === "verified_source_reference"
              ? "bg-[#6C4DFF] text-white dark:bg-[#29D3C2] dark:text-[#0D111A]"
              : "bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] text-[#6E6A8A] dark:text-[#8E95A8]"
          }`}
        >
          Direct Source Imports
        </button>
      </div>

      {/* Main Two-Column Graph & Evidence View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Repositories & Relationships Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
              Repository Dependency Topology
            </h3>

            <div className="space-y-3">
              {filteredEdges.map((edge) => {
                const isSelected = selectedEdge?.id === edge.id;
                return (
                  <div
                    key={edge.id}
                    onClick={() => setSelectedEdge(edge)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#6C4DFF] dark:border-[#29D3C2] bg-[#F4F0FF]/50 dark:bg-[#1E1A38]/40 shadow-sm"
                        : "border-[#EAE6FD] dark:border-[#1E2638] bg-[#FAFAFE] dark:bg-[#141926] hover:border-[#6C4DFF]/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-[#19143D] dark:text-[#F3F5FA] px-2 py-0.5 rounded bg-[#EAE6FD] dark:bg-[#1E2638]">
                          {edge.sourceRepoName}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#8E95A8]" />
                        <span className="font-bold text-[#6C4DFF] dark:text-[#29D3C2] px-2 py-0.5 rounded bg-[#6C4DFF]/10 dark:bg-[#29D3C2]/10">
                          {edge.targetRepoName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" className="text-[10px]">
                          {edge.typeLabel}
                        </Badge>
                        <Badge variant="mint" className="text-[10px] uppercase">
                          {edge.confidence}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-2">
                      {edge.description}
                    </p>

                    {edge.packageName && (
                      <div className="mt-2 text-xs font-mono text-[#6C4DFF] dark:text-[#29D3C2]">
                        Package: {edge.packageName} ({edge.versionConstraint})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Edge Evidence Inspector */}
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
            <h3 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2FD6A0]" />
              Verified Manifest & Source Evidence
            </h3>

            {selectedEdge ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#8E95A8] uppercase tracking-wider">
                    Relationship Type
                  </div>
                  <div className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] mt-0.5">
                    {selectedEdge.typeLabel}
                  </div>
                  <div className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                    Confidence: <span className="font-semibold text-emerald-500 uppercase">{selectedEdge.confidence}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#8E95A8] uppercase tracking-wider">
                    Evidence Location
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <FileCode className="w-3.5 h-3.5 text-[#6C4DFF] dark:text-[#29D3C2]" />
                    <span className="text-xs font-mono font-medium text-[#19143D] dark:text-[#F3F5FA]">
                      {selectedEdge.sourceRepoName}/{selectedEdge.evidenceFile}:{selectedEdge.evidenceLine}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#8E95A8] uppercase tracking-wider mb-1.5">
                    Code Snippet / Manifest Entry
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] font-mono text-xs text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto">
                    {selectedEdge.evidenceSnippet}
                  </div>
                </div>

                <div className="pt-2 text-xs text-[#8E95A8] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Verified from AST index and package manifests.</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#8E95A8]">
                Click on any relationship to inspect verified manifest coordinates and source evidence.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

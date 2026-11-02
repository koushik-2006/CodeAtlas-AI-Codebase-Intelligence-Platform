"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Cpu,
  HardDrive,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Package,
  ArrowUpCircle,
  ExternalLink,
  Wrench,
  Check,
  RefreshCw,
} from "lucide-react";
import { Github } from "@/components/Icons";
import { DependencyHealth } from "@/types/observability";
import { getStore, saveRefactoringProposal, logActivity } from "@/lib/demo/store";

interface DependencyHealthPanelProps {
  dependencies: DependencyHealth[];
}

interface PackageDependencyItem {
  name: string;
  ecosystem: "npm" | "pypi";
  manifest: string;
  currentVersion: string;
  latestVersion: string;
  status: "up_to_date" | "outdated" | "major_behind" | "deprecated";
  repositoryId: string;
}

const DEFAULT_PACKAGES: PackageDependencyItem[] = [
  {
    name: "next",
    ecosystem: "npm",
    manifest: "frontend/package.json",
    currentVersion: "14.2.3",
    latestVersion: "15.0.2",
    status: "major_behind",
    repositoryId: "sample-project",
  },
  {
    name: "react",
    ecosystem: "npm",
    manifest: "frontend/package.json",
    currentVersion: "18.3.1",
    latestVersion: "19.0.0",
    status: "major_behind",
    repositoryId: "sample-project",
  },
  {
    name: "@xyflow/react",
    ecosystem: "npm",
    manifest: "frontend/package.json",
    currentVersion: "12.3.0",
    latestVersion: "12.3.2",
    status: "outdated",
    repositoryId: "sample-project",
  },
  {
    name: "lucide-react",
    ecosystem: "npm",
    manifest: "frontend/package.json",
    currentVersion: "0.378.0",
    latestVersion: "0.454.0",
    status: "outdated",
    repositoryId: "sample-project",
  },
  {
    name: "tailwindcss",
    ecosystem: "npm",
    manifest: "frontend/package.json",
    currentVersion: "3.4.1",
    latestVersion: "3.4.14",
    status: "outdated",
    repositoryId: "sample-project",
  },
  {
    name: "fastapi",
    ecosystem: "pypi",
    manifest: "backend/pyproject.toml",
    currentVersion: "0.110.0",
    latestVersion: "0.115.4",
    status: "outdated",
    repositoryId: "fastapi-backend",
  },
  {
    name: "pydantic",
    ecosystem: "pypi",
    manifest: "backend/pyproject.toml",
    currentVersion: "2.7.1",
    latestVersion: "2.9.2",
    status: "outdated",
    repositoryId: "fastapi-backend",
  },
  {
    name: "zod",
    ecosystem: "npm",
    manifest: "frontend/package.json",
    currentVersion: "3.23.8",
    latestVersion: "3.23.8",
    status: "up_to_date",
    repositoryId: "sample-project",
  },
];

export function DependencyHealthPanel({ dependencies }: DependencyHealthPanelProps) {
  const [activeTab, setActiveTab] = useState<"packages" | "infrastructure">("packages");
  const [packages, setPackages] = useState<PackageDependencyItem[]>(DEFAULT_PACKAGES);
  const [upgradedPackage, setUpgradedPackage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getCategoryIcon = (category: DependencyHealth["category"]) => {
    switch (category) {
      case "database":
        return <Database className="w-5 h-5 text-emerald-400" />;
      case "ai_provider":
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case "vcs_gateway":
        return <Github className="w-5 h-5 text-slate-300" />;
      case "file_storage":
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case "job_queue":
        return <Layers className="w-5 h-5 text-cyan-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: DependencyHealth["status"]) => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Healthy
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Degraded
          </span>
        );
      case "unhealthy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Unhealthy
          </span>
        );
      case "unconfigured":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            Unconfigured
          </span>
        );
    }
  };

  const getPackageBadge = (status: PackageDependencyItem["status"]) => {
    switch (status) {
      case "up_to_date":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Up to date
          </span>
        );
      case "outdated":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ArrowUpCircle className="w-3 h-3" /> Outdated
          </span>
        );
      case "major_behind":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Major Behind
          </span>
        );
      case "deprecated":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-700/50 text-slate-400 border border-slate-600/20">
            Deprecated
          </span>
        );
    }
  };

  const handleCreateUpgradeProposal = (pkg: PackageDependencyItem) => {
    const proposalId = `prop_dep_${pkg.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
    const manifestFile = pkg.manifest;

    const diffContent =
      pkg.ecosystem === "npm"
        ? `--- a/${manifestFile}\n+++ b/${manifestFile}\n@@ -20,1 +20,1 @@\n-    "${pkg.name}": "^${pkg.currentVersion}",\n+    "${pkg.name}": "^${pkg.latestVersion}",`
        : `--- a/${manifestFile}\n+++ b/${manifestFile}\n@@ -15,1 +15,1 @@\n-dependencies = ["${pkg.name}>=${pkg.currentVersion}"]\n+dependencies = ["${pkg.name}>=${pkg.latestVersion}"]`;

    const newProposal = {
      id: proposalId,
      repositoryId: pkg.repositoryId,
      userId: "usr_demo",
      title: `Upgrade ${pkg.name} from v${pkg.currentVersion} to v${pkg.latestVersion}`,
      operationType: "dependency_upgrade",
      operation: "dependency_upgrade",
      filePath: manifestFile,
      targetFile: manifestFile,
      description: `Upgrade package ${pkg.name} to latest upstream release ${pkg.latestVersion} from ${pkg.ecosystem.toUpperCase()} registry.`,
      status: "open",
      diff: diffContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedEffort: pkg.status === "major_behind" ? "4 hours" : "1 hour",
      impactLevel: pkg.status === "major_behind" ? "High" : "Low",
    };

    saveRefactoringProposal(newProposal);

    logActivity({
      module: "refactoring",
      action: "create",
      type: "refactoring_proposed",
      title: `Created Refactoring Proposal: Upgrade ${pkg.name}`,
      description: `Targeting automated manifest upgrade in ${manifestFile} to ${pkg.latestVersion}.`,
      href: "/refactoring",
      link: "/refactoring",
      linkText: "View in Refactoring",
      status: "success",
      target: { type: "proposal", id: proposalId, name: newProposal.title },
      repositoryId: pkg.repositoryId,
      details: {
        diff: diffContent,
        metadata: {
          package: pkg.name,
          currentVersion: pkg.currentVersion,
          latestVersion: pkg.latestVersion,
        },
      },
    });

    setUpgradedPackage(pkg.name);
    setToastMessage(`Created refactoring upgrade proposal for ${pkg.name}!`);
    setTimeout(() => {
      setUpgradedPackage(null);
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-400" />
              Dependency & Supply Chain Health
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                activeTab === "packages"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-purple-500/10 text-purple-300 border border-purple-500/30"
              }`}
            >
              {activeTab === "packages" ? "Live check" : "Simulated"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time npm & PyPI registry version comparison, security freshness, and infrastructure dependencies
          </p>
        </div>

        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "packages"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Package Manifests ({packages.length})
          </button>
          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "infrastructure"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Infrastructure Services ({dependencies.length})
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <a
            href="/refactoring"
            className="flex items-center gap-1 font-semibold text-emerald-400 hover:underline"
          >
            Open Refactoring & Debt →
          </a>
        </div>
      )}

      {activeTab === "packages" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400">
                <th className="pb-2 font-semibold">Package</th>
                <th className="pb-2 font-semibold">Manifest Path</th>
                <th className="pb-2 font-semibold">Current</th>
                <th className="pb-2 font-semibold">Latest Upstream</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 font-semibold text-right">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-300">
              {packages.map((pkg) => {
                const canUpgrade = pkg.status === "outdated" || pkg.status === "major_behind";
                const isJustUpgraded = upgradedPackage === pkg.name;

                return (
                  <tr key={pkg.name} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-sans font-medium text-slate-200 flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-white/5">
                        {pkg.ecosystem}
                      </span>
                      <span>{pkg.name}</span>
                    </td>
                    <td className="py-2.5 text-slate-400 font-mono text-[11px]">{pkg.manifest}</td>
                    <td className="py-2.5 text-slate-300 font-bold">{pkg.currentVersion}</td>
                    <td className="py-2.5 text-indigo-300 font-bold">{pkg.latestVersion}</td>
                    <td className="py-2.5">{getPackageBadge(pkg.status)}</td>
                    <td className="py-2.5 text-right font-sans">
                      {canUpgrade ? (
                        <button
                          onClick={() => handleCreateUpgradeProposal(pkg)}
                          disabled={isJustUpgraded}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                        >
                          {isJustUpgraded ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-300" /> Proposal Added
                            </>
                          ) : (
                            <>
                              <Wrench className="w-3 h-3" /> Create Upgrade Proposal
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Up to date</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {dependencies.map((dep, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5 mt-0.5">
                  {getCategoryIcon(dep.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{dep.name}</span>
                    {dep.circuitBreakerState && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          dep.circuitBreakerState === "CLOSED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : dep.circuitBreakerState === "HALF_OPEN"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        BREAKER: {dep.circuitBreakerState}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{dep.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:self-center">
                {dep.latencyMs !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Latency</span>
                    <span className="text-xs font-mono font-medium text-slate-300">{dep.latencyMs}ms</span>
                  </div>
                )}
                <div>{getStatusBadge(dep.status)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

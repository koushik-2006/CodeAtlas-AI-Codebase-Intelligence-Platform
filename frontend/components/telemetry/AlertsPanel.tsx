"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Check,
  Sliders,
} from "lucide-react";
import { OperationalAlertIncident, OperationalAlertRule } from "@/types/observability";
import { apiClient } from "@/services/api-client";

interface AlertsPanelProps {
  activeIncidents: OperationalAlertIncident[];
  rules: OperationalAlertRule[];
  onIncidentUpdated: () => void;
}

export function AlertsPanel({ activeIncidents, rules, onIncidentUpdated }: AlertsPanelProps) {
  const [activeTab, setActiveTab] = useState<"incidents" | "rules">("incidents");
  const [ackingId, setAckingId] = useState<string | null>(null);

  const handleAcknowledge = async (incidentId: string) => {
    setAckingId(incidentId);
    try {
      const res = await apiClient.post<any>("/api/telemetry/alerts", {
        incidentId,
        acknowledgedBy: "SRE Operator",
      });
      if (res.success) {
        onIncidentUpdated();
      }
    } catch {
      // ignore
    } finally {
      setAckingId(null);
    }
  };

  const getSeverityBadge = (severity: OperationalAlertIncident["severity"]) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertOctagon className="w-3 h-3" /> Critical
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Warning
          </span>
        );
      case "info":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Operational Alerts & Incident Rules
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated threshold evaluation, deduplicated incident states, and operator acknowledgment
          </p>
        </div>

        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab("incidents")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "incidents"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Active Incidents ({activeIncidents.length})
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === "rules"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Configured Rules ({rules.length})
          </button>
        </div>
      </div>

      {activeTab === "incidents" ? (
        activeIncidents.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">All Metrics Within Thresholds</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              No active operational incidents or breached SLA thresholds detected across API, AI, and storage subsystems.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-lg border border-white/5 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(inc.severity)}
                    <span className="text-sm font-semibold text-slate-200">{inc.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        inc.status === "acknowledged"
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{inc.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Triggered: {new Date(inc.triggeredAt).toLocaleTimeString()}
                    </span>
                    {inc.acknowledgedBy && (
                      <span className="text-indigo-400">
                        Ack by: {inc.acknowledgedBy}
                      </span>
                    )}
                  </div>
                </div>

                {inc.status === "firing" && (
                  <button
                    onClick={() => handleAcknowledge(inc.id)}
                    disabled={ackingId === inc.id}
                    className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {ackingId === inc.id ? "Acknowledging..." : "Acknowledge"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400">
                <th className="pb-2 font-semibold">Rule Name</th>
                <th className="pb-2 font-semibold">Metric</th>
                <th className="pb-2 font-semibold">Threshold</th>
                <th className="pb-2 font-semibold">Severity</th>
                <th className="pb-2 font-semibold">Cooldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-300">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-sans font-medium text-slate-200">{rule.name}</td>
                  <td className="py-2.5 text-indigo-300">{rule.metric}</td>
                  <td className="py-2.5 text-slate-300">
                    {rule.condition} {rule.threshold}
                    {rule.unit}
                  </td>
                  <td className="py-2.5">{getSeverityBadge(rule.severity)}</td>
                  <td className="py-2.5 text-slate-400 font-sans">{rule.cooldownSeconds}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Check,
  Plus,
  Trash2,
  Moon,
  X,
} from "lucide-react";
import { OperationalAlertIncident, OperationalAlertRule, AlertSeverity } from "@/types/observability";
import {
  acknowledgeAlertIncident,
  resolveAlertIncident,
  snoozeAlertIncident,
  addAlertRule,
  deleteAlertRule,
} from "@/lib/demo/store";

interface AlertsPanelProps {
  activeIncidents: OperationalAlertIncident[];
  rules: OperationalAlertRule[];
  onIncidentUpdated: () => void;
}

export function AlertsPanel({ activeIncidents, rules, onIncidentUpdated }: AlertsPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab] = useState<"incidents" | "rules">("incidents");
  const [ackingId, setAckingId] = useState<string | null>(null);

  // Resolve note modal state
  const [resolvingIncident, setResolvingIncident] = useState<OperationalAlertIncident | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  // Create rule modal state
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleMetric, setRuleMetric] = useState("p95_latency_ms");
  const [ruleCondition, setRuleCondition] = useState<"gt" | "lt" | "gte" | "lte">("gt");
  const [ruleThreshold, setRuleThreshold] = useState("1200");
  const [ruleUnit, setRuleUnit] = useState("ms");
  const [ruleSeverity, setRuleSeverity] = useState<AlertSeverity>("warning");
  const [ruleCooldown, setRuleCooldown] = useState("180");
  const [ruleDescription, setRuleDescription] = useState("");

  const handleAcknowledge = (incidentId: string) => {
    setAckingId(incidentId);
    acknowledgeAlertIncident(incidentId, "SRE Operator");
    setTimeout(() => {
      setAckingId(null);
      onIncidentUpdated();
    }, 200);
  };

  const handleOpenResolveModal = (inc: OperationalAlertIncident) => {
    setResolvingIncident(inc);
    setResolveNote("Downstream pool cleared and traffic load normalized.");
  };

  const handleConfirmResolve = () => {
    if (!resolvingIncident) return;
    resolveAlertIncident(resolvingIncident.id, resolveNote);
    setResolvingIncident(null);
    setResolveNote("");
    onIncidentUpdated();
  };

  const handleSnooze = (incidentId: string) => {
    snoozeAlertIncident(incidentId, 30);
    onIncidentUpdated();
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteAlertRule(ruleId);
    onIncidentUpdated();
  };

  const handleSaveRule = (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!ruleName.trim()) return;

    addAlertRule({
      name: ruleName.trim(),
      metric: ruleMetric,
      condition: ruleCondition,
      threshold: Number(ruleThreshold) || 100,
      unit: ruleUnit,
      severity: ruleSeverity,
      cooldownSeconds: Number(ruleCooldown) || 120,
      description: ruleDescription.trim() || `Alert on ${ruleMetric} ${ruleCondition} ${ruleThreshold}${ruleUnit}`,
    });

    setIsCreatingRule(false);
    setRuleName("");
    setRuleDescription("");
    onIncidentUpdated();
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
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
    <div className="rounded-xl border border-white/10 bg-slate-900/80 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Operational Alerts & Incident Rules
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Simulated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated threshold evaluation, deduplicated incident states, and operator acknowledgment
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/5 text-xs">
            <button
              onClick={() => setActiveTab("incidents")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === "incidents"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Active Incidents ({activeIncidents.length})
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === "rules"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Configured Rules ({rules.length})
            </button>
          </div>

          {activeTab === "rules" && (
            <button
              onClick={() => setIsCreatingRule(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Rule
            </button>
          )}
        </div>
      </div>

      {activeTab === "incidents" ? (
        activeIncidents.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">All Metrics Within SLA Thresholds</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              No active operational incidents or breached SLA thresholds detected across API, AI, and storage subsystems.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-lg border border-rose-500/30 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(inc.severity)}
                    <span className="text-sm font-semibold text-white">{inc.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        inc.status === "acknowledged"
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                      }`}
                    >
                      {inc.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{inc.message}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Triggered:{" "}
                      {new Date(inc.triggeredAt).toLocaleTimeString()}
                    </span>
                    {inc.acknowledgedBy && (
                      <span className="text-indigo-400">
                        Ack / State: {inc.acknowledgedBy}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {inc.status === "firing" && (
                    <button
                      onClick={() => handleAcknowledge(inc.id)}
                      disabled={ackingId === inc.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {ackingId === inc.id ? "Acking..." : "Acknowledge"}
                    </button>
                  )}

                  <button
                    onClick={() => handleSnooze(inc.id)}
                    title="Snooze notifications for 30m"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Snooze
                  </button>

                  <button
                    onClick={() => handleOpenResolveModal(inc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                </div>
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
                <th className="pb-2 font-semibold">Condition</th>
                <th className="pb-2 font-semibold">Threshold</th>
                <th className="pb-2 font-semibold">Severity</th>
                <th className="pb-2 font-semibold">Cooldown</th>
                <th className="pb-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-slate-300">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-sans font-medium text-slate-200">{rule.name}</td>
                  <td className="py-2.5 text-indigo-300">{rule.metric}</td>
                  <td className="py-2.5 uppercase text-slate-400">{rule.condition}</td>
                  <td className="py-2.5 text-slate-200 font-bold">
                    {rule.threshold}
                    {rule.unit}
                  </td>
                  <td className="py-2.5">{getSeverityBadge(rule.severity)}</td>
                  <td className="py-2.5 text-slate-400 font-sans">{rule.cooldownSeconds}s</td>
                  <td className="py-2.5 text-right font-sans">
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete alert rule"
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolve Note Modal */}
      {mounted && resolvingIncident && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Resolve Incident
              </h3>
              <button
                onClick={() => setResolvingIncident(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-slate-400">Incident:</span>
                <p className="text-sm font-semibold text-slate-200">{resolvingIncident.name}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Resolution Note / Post-Mortem Summary:
                </label>
                <textarea
                  rows={3}
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Describe remediation steps taken..."
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Alert Rule Modal */}
      {mounted && isCreatingRule && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveRule}
            className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Configure SRE Alert Rule
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Host Memory Pressure Warning"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Metric</label>
                  <select
                    value={ruleMetric}
                    onChange={(e) => {
                      setRuleMetric(e.target.value);
                      if (e.target.value.includes("rate") || e.target.value.includes("usage")) setRuleUnit("%");
                      else if (e.target.value.includes("mb")) setRuleUnit("MB");
                      else setRuleUnit("ms");
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="p95_latency_ms">P95 Latency (p95_latency_ms)</option>
                    <option value="http_5xx_rate">5xx Error Rate (http_5xx_rate)</option>
                    <option value="cpu_usage">CPU Utilization (cpu_usage)</option>
                    <option value="heap_used_mb">Heap Memory (heap_used_mb)</option>
                    <option value="db_latency_ms">DB Pool Latency (db_latency_ms)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Condition</label>
                  <select
                    value={ruleCondition}
                    onChange={(e) => setRuleCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gt">Greater than (&gt;)</option>
                    <option value="gte">Greater than or equal (&gt;=)</option>
                    <option value="lt">Less than (&lt;)</option>
                    <option value="lte">Less than or equal (&lt;=)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Threshold</label>
                  <input
                    type="number"
                    required
                    value={ruleThreshold}
                    onChange={(e) => setRuleThreshold(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={ruleUnit}
                    onChange={(e) => setRuleUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Severity</label>
                  <select
                    value={ruleSeverity}
                    onChange={(e) => setRuleSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Cooldown Seconds</label>
                <input
                  type="number"
                  value={ruleCooldown}
                  onChange={(e) => setRuleCooldown(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-white/10 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description / Remediation</label>
                <textarea
                  rows={2}
                  value={ruleDescription}
                  onChange={(e) => setRuleDescription(e.target.value)}
                  placeholder="Instructions for on-call engineer..."
                  className="w-full p-2.5 rounded-lg bg-slate-800 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreatingRule(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveRule()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Save Alert Rule
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

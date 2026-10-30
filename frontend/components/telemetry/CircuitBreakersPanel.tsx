"use client";

import React, { useState } from "react";
import { Shield, ZapOff, RotateCcw, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { CircuitBreakerStatus } from "@/types/observability";
import { apiClient } from "@/services/api-client";

interface CircuitBreakersPanelProps {
  breakers: CircuitBreakerStatus[];
  onActionComplete: () => void;
}

export function CircuitBreakersPanel({ breakers, onActionComplete }: CircuitBreakersPanelProps) {
  const [loadingBreaker, setLoadingBreaker] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleAction = async (name: string, action: "trip" | "reset") => {
    setLoadingBreaker(`${name}_${action}`);
    setFeedback(null);

    try {
      const res = await apiClient.post<any>("/api/telemetry/circuit-breaker", { name, action });
      const json = res.data || {};
      if (res.success && (json.success !== false)) {
        setFeedback({ message: json.message || "Circuit breaker updated successfully", type: "success" });
        onActionComplete();
      } else {
        setFeedback({
          message: json.error?.message || json.error || res.message || `Failed to ${action} circuit breaker`,
          type: "error",
        });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || "Failed to update circuit breaker", type: "error" });
    } finally {
      setLoadingBreaker(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            External Service Circuit Breakers
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated fault isolation with configurable thresholds, cooldown windows, and SRE manual controls
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-300 border-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakers.map((cb) => {
          const isClosed = cb.state === "CLOSED";
          const isHalfOpen = cb.state === "HALF_OPEN";
          const isOpen = cb.state === "OPEN";

          return (
            <div
              key={cb.name}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isOpen
                  ? "bg-rose-950/20 border-rose-500/40"
                  : isHalfOpen
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-slate-800/40 border-white/5"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-semibold text-slate-200">
                    {cb.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      isClosed
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : isHalfOpen
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isClosed ? "bg-emerald-400" : isHalfOpen ? "bg-amber-400" : "bg-rose-400"
                      }`}
                    />
                    {cb.state}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Consecutive Failures:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {cb.consecutiveFailures} / {cb.threshold}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOpen ? "bg-rose-500" : isHalfOpen ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (cb.consecutiveFailures / cb.threshold) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Total Failures:</span>
                    <span className="font-mono text-slate-300">{cb.failureCount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Cooldown Duration:</span>
                    <span className="font-mono text-slate-300">{cb.cooldownPeriodMs / 1000}s</span>
                  </div>
                  {cb.lastFailureTime && (
                    <div className="flex justify-between text-slate-400">
                      <span>Last Failure:</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {new Date(cb.lastFailureTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                {isOpen ? (
                  <button
                    onClick={() => handleAction(cb.name, "reset")}
                    disabled={loadingBreaker === `${cb.name}_reset`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Closed
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(cb.name, "trip")}
                    disabled={loadingBreaker === `${cb.name}_trip`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <ZapOff className="w-3.5 h-3.5" />
                    Trip Breaker (Test)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { LAYER_COLORS } from "@/lib/demo/architecture-engine";
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";

export function ArchitectureLegend() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)]">
      {/* Layers Color Palette */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">Layers:</span>
        {Object.entries(LAYER_COLORS).map(([layer, color]) => (
          <div key={layer} className="flex items-center gap-1.5 text-[11px] font-medium">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color.hex }}
            />
            <span>{layer}</span>
          </div>
        ))}
      </div>

      {/* Edge Styles & Health Indicators */}
      <div className="flex items-center gap-4 flex-wrap text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-[#7C5CFC]" />
          <span>Imports / Calls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 border-t border-dashed border-slate-400" />
          <span>External</span>
        </div>
        <div className="flex items-center gap-1.5 text-red-400 font-bold">
          <span className="w-5 h-0.5 bg-red-500" />
          <span>Violation / Cycle</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <span className="w-5 h-0.5 bg-amber-400" />
          <span>Active Path</span>
        </div>
      </div>
    </div>
  );
}


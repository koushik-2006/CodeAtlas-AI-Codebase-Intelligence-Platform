"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Repository } from "@/types/repository";
import { AlertTriangle, ShieldCheck, Trash2, X, Loader2 } from "lucide-react";

interface DisconnectRepositoryModalProps {
  repo: Repository | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (repoId: string) => Promise<void>;
}

export function DisconnectRepositoryModal({
  repo,
  isOpen,
  onClose,
  onConfirm,
}: DisconnectRepositoryModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);

  if (!isOpen || !repo) return null;

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await onConfirm(repo.id);
      onClose();
    } catch (err) {
      console.warn("Failed to disconnect repository:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
          isDark
            ? "bg-[#0D111B] border-[#242B39] shadow-[0_0_40px_-10px_rgba(244,63,94,0.15)]"
            : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5 text-rose-500">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Disconnect Repository
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3.5">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            You are about to disconnect <strong className="text-[var(--text-primary)] font-mono">{repo.name}</strong> from CodeAtlas.
          </p>

          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
              isDark ? "bg-[#111725] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-rose-500">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>What will be removed:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-[var(--text-secondary)]">
              <li>All indexed AST functions, classes, and symbols ({repo.symbolCount} total).</li>
              <li>Calculated architecture call graphs and change blast radius models.</li>
              <li>Cached pull request review findings and sessions.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>GitHub Safety Guarantee:</strong> Disconnecting from CodeAtlas will <em>never</em> delete, alter, or commit changes to your actual GitHub repository.
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Disconnect
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

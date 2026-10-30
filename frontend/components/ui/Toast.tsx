"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast({
  type = "info",
  title,
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />,
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-start gap-3 p-4 max-w-sm rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
        isDark
          ? "bg-[#0D111B]/95 border-[#242B39] text-[#F3F5FA]"
          : "bg-white/95 border-[#E8E5F4] text-[#19143D]"
      }`}
    >
      {icons[type]}
      <div className="flex-1 text-xs">
        <h4 className="font-bold">{title}</h4>
        {message && (
          <p className="mt-0.5 text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

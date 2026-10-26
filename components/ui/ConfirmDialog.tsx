"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Surface */}
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all ${
          isDark
            ? "bg-[#0D111B] border-[#242B39] text-[#F3F5FA]"
            : "bg-white border-[#E8E5F4] text-[#19143D]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl shrink-0 ${
                variant === "danger"
                  ? "bg-red-500/15 text-red-500 border border-red-500/30"
                  : variant === "warning"
                  ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  : "bg-[var(--primary)]/15 text-[var(--primary)]"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-base sm:text-lg font-bold">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p id="confirm-dialog-description" className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={variant === "danger" ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

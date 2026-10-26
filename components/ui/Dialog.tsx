"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`relative z-10 w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
              isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <h3 className="text-xl font-bold tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

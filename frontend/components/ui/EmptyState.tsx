"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`app-card p-10 sm:p-14 text-center max-w-lg mx-auto flex flex-col items-center justify-center ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
      } ${className}`}
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-[var(--border-color)]/20 text-[var(--primary)] mb-4">
          <Icon className="w-10 h-10" />
        </div>
      )}
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

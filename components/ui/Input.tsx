"use client";

import React, { useId } from "react";
import { useTheme } from "@/hooks/useTheme";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  icon,
  label,
  error,
  helperText,
  id,
  className = "",
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[var(--text-primary)]"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative w-full">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-medium outline-none border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${
            error
              ? "border-red-500 text-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : isDark
              ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] placeholder-[#9AA4B5]/60 focus:border-[#29D3C2] focus:shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
              : "bg-white border-[#E8E5F4] text-[#19143D] placeholder-[#68677D]/60 focus:border-[#6C4DFF] focus:shadow-soft"
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-[11px] font-semibold text-red-500 pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[11px] text-[var(--text-secondary)] pt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

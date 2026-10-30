"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this section. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`app-card p-8 sm:p-12 text-center max-w-md mx-auto my-6 ${className}`}
    >
      <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

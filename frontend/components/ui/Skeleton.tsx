"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular" | "card";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getVariantStyles = () => {
    switch (variant) {
      case "circular":
        return "rounded-full";
      case "text":
        return "h-4 rounded-md";
      case "card":
        return "rounded-2xl";
      case "rectangular":
      default:
        return "rounded-xl";
    }
  };

  const bgStyle = isDark
    ? "bg-[#111725]/80 animate-pulse"
    : "bg-[#E8E5F4]/70 animate-pulse";

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`${bgStyle} ${getVariantStyles()} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl p-6 border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={36} height={36} />
        <div className="space-y-1.5 flex-1">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" height={10} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={60} />
      <div className="flex justify-between pt-2">
        <Skeleton variant="text" width="30%" height={12} />
        <Skeleton variant="text" width="20%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonTableRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]"
        >
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="35%" />
          </div>
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="15%" />
        </div>
      ))}
    </div>
  );
}

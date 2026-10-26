"use client";

import React from "react";

export interface PageHeaderProps {
  title: string;
  sub?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  sub,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
        {sub && (
          <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
            {sub}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

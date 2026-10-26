"use client";

import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function PageContainer({
  children,
  className = "",
  maxWidth = "full",
}: PageContainerProps) {
  const maxWidthClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div className={`w-full mx-auto pb-16 lg:pb-0 ${maxWidthClass} ${className}`}>
      {children}
    </div>
  );
}

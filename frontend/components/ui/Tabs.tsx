"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: any;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps<T>) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`flex gap-2 flex-wrap ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all active:scale-95 ${
              isSelected
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
                  : "bg-[#19143D] text-white border-[#19143D]"
                : isDark
                ? "bg-[#0D111B] border-[#242B39] text-[#9AA4B5] hover:text-[#F3F5FA]"
                : "bg-white border-[#E8E5F4] text-[#68677D] hover:text-[#19143D]"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { MAIN_NAVIGATION } from "@/lib/navigation";

export function MobileNavigation() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Top 5 primary actions for bottom mobile bar
  const primaryNav = MAIN_NAVIGATION.slice(0, 5);

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 lg:hidden border-t px-2 py-1.5 backdrop-blur-md transition-colors ${
        isDark
          ? "bg-[#070A12]/90 border-[#242B39]"
          : "bg-white/90 border-[#E8E5F4]"
      }`}
    >
      <div className="flex items-center justify-around">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.altHref && pathname === item.altHref) ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? isDark
                    ? "text-[#29D3C2]"
                    : "text-[#6C4DFF]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-[58px]">{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

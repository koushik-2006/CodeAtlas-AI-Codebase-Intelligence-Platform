"use client";

import { useState } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { MobileNavigation } from "@/components/layout/MobileNavigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) */}
      <AppSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AppHeader onMenuClick={() => setMobileOpen(true)} />

        {/* Main Content Workspace Area */}
        <main className="flex-1 overflow-x-hidden min-w-0 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 mb-16 lg:mb-0">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNavigation />
    </div>
  );
}

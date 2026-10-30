"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { ConnectedAccounts } from "@/components/settings/ConnectedAccounts";
import { AIPreferencesSettings } from "@/components/settings/AIPreferencesSettings";
import { workspaceService } from "@/services/workspace-service";
import { useAuth } from "@/hooks/useAuth";
import { User, Shield, Sliders, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const { user } = useAuth();
  // Profile Form state
  const [name, setName] = useState(user?.name || "CodeAtlas Developer");
  const [email, setEmail] = useState(user?.email || "developer@codeatlas.dev");
  const [role, setRole] = useState(user?.role || "Software Engineer");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.role) setRole(user.role);
    }
    async function loadProfile() {
      try {
        const data = await workspaceService.getSettings();
        if (data.profile) {
          if (data.profile.name) setName(data.profile.name);
          if (data.profile.email) setEmail(data.profile.email);
          if (data.profile.role) setRole(data.profile.role);
        }
      } catch (e) {}
    }
    loadProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workspaceService.updateSettings(undefined, { name, email, role });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.warn("Failed to update profile:", e);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        sub="Manage appearance, developer profile, AI preferences, GitHub authorization, and security preferences."
      />

      <div className="max-w-4xl space-y-8">
        <AppearanceSettings />

        <AIPreferencesSettings />

        {/* Section 2: Developer Profile */}
        <section
          className={`app-card p-6 sm:p-8 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
            <User className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold tracking-tight">Developer Profile</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                    isDark
                      ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                      : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                    isDark
                      ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                      : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                    : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
                }`}
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-xs font-semibold text-green-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated successfully.
                </span>
              )}
              <button
                type="submit"
                className={`ml-auto px-5 py-2 rounded-xl text-xs font-bold ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
                }`}
              >
                Save Profile
              </button>
            </div>
          </form>
        </section>

        <ConnectedAccounts />

        {/* Section 4: Privacy & Security Policy */}
        <section
          className={`app-card p-6 sm:p-8 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
            <Shield className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold tracking-tight">Repository Privacy & Security</h2>
          </div>

          <div className="mt-5 space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <p>CodeAtlas follows strict client-to-server integrity standards:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong>Zero Training:</strong> Your source code and extracted AST graphs are never used to train machine learning models.
              </li>
              <li>
                <strong>Ephemerality:</strong> Tokens and sessions are stored in protected client memory and never logged in plain text.
              </li>
              <li>
                <strong>AST Parsing:</strong> Code analysis uses deterministic tree-sitter symbol parsing to compute receipts without third-party leaks.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 5: Application Preferences */}
        <section
          className={`app-card p-6 sm:p-8 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
            <Sliders className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold tracking-tight">Application Preferences</h2>
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Show Line Numbers in Code Viewer
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Displays gutter line indices beside syntax tokens.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--primary)] accent-[var(--primary)]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] cursor-pointer">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Reduced Motion
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Disables marquee and laser scanning animations.
                </span>
              </div>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--primary)] accent-[var(--primary)]"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

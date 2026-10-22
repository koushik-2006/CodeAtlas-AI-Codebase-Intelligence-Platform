"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sun,
  Moon,
  Laptop,
  Shield,
  User,
  Sliders,
  CheckCircle2,
  Lock,
  Eye,
  Bell,
  Code2,
} from "lucide-react";
import { Github } from "@/components/Icons";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [githubConnected, setGithubConnected] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Profile Form state
  const [name, setName] = useState("Alex Mercer");
  const [email, setEmail] = useState("alex@codeatlas.dev");
  const [role, setRole] = useState("Senior Software Engineer");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        sub="Manage appearance, developer profile, GitHub authorization, and security preferences."
      />

      <div className="max-w-4xl space-y-8">
        {/* Section 1: Appearance & Theme */}
        <section
          className={`app-card p-6 sm:p-8 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
            <Sun className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold tracking-tight">Appearance & Theme</h2>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)]">
            Choose your preferred workspace visual identity. Both references are fully supported across all routes.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {/* Light Theme Card */}
            <button
              onClick={() => setTheme("light")}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                theme === "light"
                  ? "border-[#6C4DFF] bg-[#FAF9FF] ring-2 ring-[#6C4DFF]/30 shadow-md"
                  : "border-[#E8E5F4] bg-white hover:border-[#6C4DFF]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#FFC53D]" />
                  <span className="font-bold text-sm text-[#19143D]">Reference 1 — Light Theme</span>
                </div>
                {theme === "light" && (
                  <CheckCircle2 className="w-4 h-4 text-[#6C4DFF]" />
                )}
              </div>
              <p className="mt-2 text-xs text-[#68677D] leading-relaxed">
                Soft lavender background (#FAF9FF), white cards, purple (#6C4DFF) highlights, and 3D isometric city planner aesthetic.
              </p>
              <div className="mt-4 flex gap-1.5">
                <span className="h-4 w-4 rounded-full bg-[#FAF9FF] border border-[#E8E5F4]" />
                <span className="h-4 w-4 rounded-full bg-[#6C4DFF]" />
                <span className="h-4 w-4 rounded-full bg-[#FFC53D]" />
                <span className="h-4 w-4 rounded-full bg-[#2FD6A0]" />
                <span className="h-4 w-4 rounded-full bg-[#FF5A5F]" />
              </div>
            </button>

            {/* Dark Theme Card */}
            <button
              onClick={() => setTheme("dark")}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                theme === "dark"
                  ? "border-[#29D3C2] bg-[#070A12] ring-2 ring-[#29D3C2]/30 shadow-[0_0_20px_-5px_rgba(41,211,194,0.3)]"
                  : "border-[#242B39] bg-[#0D111B] hover:border-[#29D3C2]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-[#29D3C2]" />
                  <span className="font-bold text-sm text-[#F3F5FA]">Reference 2 — Dark Theme</span>
                </div>
                {theme === "dark" && (
                  <CheckCircle2 className="w-4 h-4 text-[#29D3C2]" />
                )}
              </div>
              <p className="mt-2 text-xs text-[#9AA4B5] leading-relaxed">
                Deep near-black (#070A12), cyan (#29D3C2) accents, tech-violet (#8B7CFF), subtle glow, and technical cyber graph aesthetic.
              </p>
              <div className="mt-4 flex gap-1.5">
                <span className="h-4 w-4 rounded-full bg-[#070A12] border border-[#242B39]" />
                <span className="h-4 w-4 rounded-full bg-[#0D111B]" />
                <span className="h-4 w-4 rounded-full bg-[#29D3C2]" />
                <span className="h-4 w-4 rounded-full bg-[#8B7CFF]" />
                <span className="h-4 w-4 rounded-full bg-[#F3C969]" />
              </div>
            </button>
          </div>
        </section>

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

        {/* Section 3: Connected Accounts & GitHub Status */}
        <section
          className={`app-card p-6 sm:p-8 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
            <Github className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl font-bold tracking-tight">Connected Accounts</h2>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">GitHub Integration</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {githubConnected
                    ? "Connected as @koush-dev. Read-only metadata permission active."
                    : "Connect GitHub to import and index your public or private repositories."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setGithubConnected(!githubConnected)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                githubConnected
                  ? "border-red-500/40 text-red-500 hover:bg-red-500/10"
                  : isDark
                  ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                  : "bg-[#19143D] text-white hover:bg-[#2a225f]"
              }`}
            >
              {githubConnected ? "Disconnect" : "Connect GitHub"}
            </button>
          </div>
        </section>

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
            <p>
              CodeAtlas follows strict client-to-server integrity standards:
            </p>
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

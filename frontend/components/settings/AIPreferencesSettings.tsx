"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { DbUserSettings } from "@/types/database";
import { workspaceService, WorkspaceSettingsData } from "@/services/workspace-service";
import { Sparkles, CheckCircle2, Cpu, Sliders, Check, AlertCircle } from "lucide-react";

export function AIPreferencesSettings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [settings, setSettings] = useState<DbUserSettings>({
    userId: "usr_default",
    explanationStyle: "detailed",
    responseDetail: "standard",
    defaultRepoContext: "sample-project",
    preferredModel: "gemini-1.5-pro",
    useStreaming: true,
    showLineNumbers: true,
    reducedMotion: false,
    updatedAt: new Date().toISOString(),
  });

  const [providers, setProviders] = useState<Record<string, { configured: boolean; model: string; status: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await workspaceService.getSettings();
        if (data.settings) setSettings(data.settings);
        if (data.integrations?.ai) setProviders(data.integrations.ai);
      } catch (err) {
        console.warn("Failed to load AI preferences:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await workspaceService.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.warn("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const MODELS = [
    {
      id: "gemini-1.5-pro",
      name: "Google Gemini 1.5 Pro",
      desc: "Multimodal 1M token context. Grounded AST indexing & RAG.",
      status: providers.gemini?.configured ? "configured" : "fallback",
    },
    {
      id: "claude-3-5-sonnet",
      name: "Anthropic Claude 3.5 Sonnet",
      desc: "Architectural synthesis & complex cross-file refactoring.",
      status: providers.anthropic?.configured ? "configured" : "fallback",
    },
    {
      id: "gpt-4o",
      name: "OpenAI GPT-4o",
      desc: "Omni reasoning engine with high coding benchmark accuracy.",
      status: providers.openai?.configured ? "configured" : "fallback",
    },
    {
      id: "offline-ast",
      name: "Tree-sitter Deterministic AST",
      desc: "Local, zero-network syntax analysis. Runs 100% offline.",
      status: "always active",
    },
  ];

  return (
    <section
      className={`app-card p-6 sm:p-8 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-bold tracking-tight">AI & Code Intelligence Preferences</h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-2 py-0.5 rounded">
          Grounded RAG
        </span>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
            Preferred Intelligence Model
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODELS.map((m) => {
              const selected = settings.preferredModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSettings({ ...settings, preferredModel: m.id as any })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selected
                      ? isDark
                        ? "bg-[#111725] border-[#29D3C2] shadow-[0_0_15px_-3px_rgba(41,211,194,0.2)]"
                        : "bg-[#FAF9FF] border-[#6C4DFF] shadow-sm"
                      : isDark
                      ? "bg-[#0A0F19] border-[#242B39] hover:border-[#30363D]"
                      : "bg-white border-[#E8E5F4] hover:border-[#D0C9F0]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{m.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded capitalize ${
                        m.status === "configured" || m.status === "always active"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation Style & Response Detail */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
              Code Explanation Style
            </label>
            <select
              value={settings.explanationStyle}
              onChange={(e) => setSettings({ ...settings, explanationStyle: e.target.value as any })}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            >
              <option value="detailed">Detailed — Step-by-step logic, variables & edge cases</option>
              <option value="concise">Concise — High-density summary & key risks</option>
              <option value="socratic">Socratic — Guiding questions & design trade-offs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
              Response Depth
            </label>
            <select
              value={settings.responseDetail}
              onChange={(e) => setSettings({ ...settings, responseDetail: e.target.value as any })}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            >
              <option value="standard">Standard — Balanced for senior developers</option>
              <option value="exhaustive">Exhaustive — Includes callers, callees & AST receipts</option>
              <option value="beginner">Beginner — Educational context & core concepts</option>
            </select>
          </div>
        </div>

        {/* Streaming Toggle */}
        <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between cursor-pointer"
          onClick={() => setSettings({ ...settings, useStreaming: !settings.useStreaming })}
        >
          <div>
            <span className="text-xs font-bold text-[var(--text-primary)] block">
              Enable Real-Time Streaming Responses
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Streams token chunks incrementally as the AI analyzes AST symbols.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.useStreaming}
            onChange={(e) => setSettings({ ...settings, useStreaming: e.target.checked })}
            className="h-4 w-4 rounded text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
          />
        </div>

        {/* Save Footer */}
        <div className="pt-2 flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Preferences saved successfully.
            </span>
          ) : (
            <span className="text-[11px] text-[var(--text-secondary)]">
              Settings persist across browser sessions.
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
            }`}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </section>
  );
}

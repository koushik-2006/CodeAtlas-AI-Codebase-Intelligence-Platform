"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, AlertCircle, RefreshCw } from "lucide-react";

interface MermaidFlowchartProps {
  chart: string;
  isDark?: boolean;
}

declare global {
  interface Window {
    mermaid?: {
      initialize: (config: any) => void;
      render: (id: string, text: string) => Promise<{ svg: string }>;
    };
  }
}

export function MermaidFlowchart({ chart, isDark = false }: MermaidFlowchartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const cleanChart = chart.trim();

  useEffect(() => {
    let isMounted = true;

    async function loadAndRender() {
      if (!cleanChart) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Ensure mermaid is loaded from cdn.jsdelivr.net (pinned v10.9.1)
        if (!window.mermaid) {
          await new Promise<void>((resolve, reject) => {
            const existingScript = document.getElementById("mermaid-cdn-script");
            if (existingScript) {
              existingScript.addEventListener("load", () => resolve());
              existingScript.addEventListener("error", () => reject(new Error("Failed to load Mermaid from CDN")));
              return;
            }

            const script = document.createElement("script");
            script.id = "mermaid-cdn-script";
            script.src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js";
            script.crossOrigin = "anonymous";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Mermaid script from CDN"));
            document.head.appendChild(script);
          });
        }

        if (!isMounted) return;

        window.mermaid?.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "var(--font-mono, monospace)",
          themeVariables: isDark
            ? {
                primaryColor: "#7C5CFC",
                primaryTextColor: "#F3F5FA",
                primaryBorderColor: "#7C5CFC",
                lineColor: "#29D3C2",
                secondaryColor: "#111725",
                tertiaryColor: "#0A0F19",
              }
            : {
                primaryColor: "#7C5CFC",
                primaryTextColor: "#19143D",
                primaryBorderColor: "#7C5CFC",
                lineColor: "#6C4DFF",
              },
        });

        const id = `mermaid-render-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { svg } = await window.mermaid!.render(id, cleanChart);

        if (isMounted) {
          setSvgHtml(svg);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("[CodeAtlas Mermaid] Render notice:", err);
          setError(err?.message || "Failed to render visual flowchart.");
          setIsLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      isMounted = false;
    };
  }, [cleanChart, isDark]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanChart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Visual Control Flow (Mermaid)
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Mermaid</span>
            </>
          )}
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)] gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
          <span className="text-xs font-mono">Rendering visual diagram...</span>
        </div>
      )}

      {error ? (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Mermaid diagram syntax could not be rendered graphically.</span>
              <p className="text-[11px] opacity-90">{error}</p>
            </div>
          </div>
          <pre
            className={`p-3 rounded-xl font-mono text-xs overflow-x-auto ${
              isDark ? "bg-[#0D1117] text-[#E6EDF3]" : "bg-[#F6F8FA] text-[#1E2022]"
            }`}
          >
            {cleanChart}
          </pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="overflow-x-auto flex justify-center py-4 [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      )}
    </div>
  );
}

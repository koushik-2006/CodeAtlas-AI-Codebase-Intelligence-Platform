"use client";

import { useState, useRef, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import {
  ClipboardPaste,
  UploadCloud,
  Camera,
  Sparkles,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

const MODES = ["Paste", "Upload", "Camera"] as const;
type Mode = (typeof MODES)[number];

const SAMPLE_SNIPPETS = {
  auth: `def login(email, pw):
    user = db.find(email)
    if not user:
        raise AuthError("Invalid user")
    return verify(user, pw)`,
  routes: `@router.post("/auth/login")
async def handle_login(payload: LoginRequest):
    token = login(payload.email, payload.password)
    return {"access_token": token}`,
};

export default function VisualCodeExplorer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mode, setMode] = useState<Mode>("Upload");
  const [code, setCode] = useState(SAMPLE_SNIPPETS.auth);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Analysis result states
  const [analysisMode, setAnalysisMode] = useState<"none" | "standalone" | "workflow">("none");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera on unmount or mode switch
  useEffect(() => {
    if (mode !== "Camera" && cameraActive) {
      stopCamera();
    }
  }, [mode, cameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError(err.message || "Camera access was denied or device not found.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewImage(dataUrl);
      stopCamera();
      // Simulate OCR extraction
      setCode(SAMPLE_SNIPPETS.auth);
    }
  };

  const handleFileUpload = (file?: File) => {
    if (!file) return;
    setUploadError(null);

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid format. Please upload PNG, JPG, or WebP screenshot.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Maximum image size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      // Simulate OCR extraction
      setCode(SAMPLE_SNIPPETS.auth);
    };
    reader.readAsDataURL(file);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const triggerStandaloneAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisMode("none");
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisMode("standalone");
    }, 700);
  };

  const triggerWorkflowAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisMode("none");
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisMode("workflow");
    }, 900);
  };

  return (
    <div>
      <PageHeader
        title="Visual Code Explorer"
        sub="Paste, upload or photograph code"
      />

      {/* Input Mode Tabs (matching page 5 of both PDFs) */}
      <div className="flex gap-2.5 mb-6" role="tablist">
        {MODES.map((m) => {
          const isSelected = mode === m;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setMode(m);
                if (m === "Camera" && !cameraActive) {
                  startCamera();
                }
              }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 border ${
                isSelected
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
                    : "bg-[#19143D] text-white border-[#19143D]"
                  : isDark
                  ? "bg-[#0D111B] border-[#242B39] text-[#9AA4B5] hover:text-[#F3F5FA]"
                  : "bg-white border-[#E8E5F4] text-[#68677D] hover:text-[#19143D]"
              }`}
            >
              {m === "Paste" && <ClipboardPaste className="w-4 h-4" />}
              {m === "Upload" && <UploadCloud className="w-4 h-4" />}
              {m === "Camera" && <Camera className="w-4 h-4" />}
              {m}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Input / Drop Zone (Left) & Extracted Code Preview (Right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel: Mode Specific Input */}
        <div
          className={`app-card overflow-hidden flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                Input Source: {mode}
              </span>
              {mode === "Paste" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCode(SAMPLE_SNIPPETS.auth)}
                    className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    Load auth.py
                  </button>
                  <button
                    onClick={() => setCode(SAMPLE_SNIPPETS.routes)}
                    className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    Load routes.py
                  </button>
                </div>
              )}
            </div>

            {/* Paste Mode */}
            {mode === "Paste" && (
              <div className="space-y-3">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your source snippet here..."
                  aria-label="Paste source code"
                  className={`w-full min-h-[300px] p-4 rounded-2xl font-mono text-xs sm:text-sm outline-none border transition-all ${
                    isDark
                      ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                      : "bg-[#19143D] text-white border-transparent focus:ring-2 focus:ring-[#6C4DFF]"
                  }`}
                />
              </div>
            )}

            {/* Upload Mode with Laser Scan Animation */}
            {mode === "Upload" && (
              <div>
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files?.[0]);
                  }}
                  className={`relative grid min-h-[300px] cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                    isDark
                      ? "border-[#242B39] bg-[#0A0F19] hover:border-[#29D3C2]/50 hover:bg-[#111725]/50"
                      : "border-[#BDB2FF]/60 bg-[#19143D] text-white"
                  }`}
                >
                  {/* Laser scan line animation */}
                  <span className="absolute inset-x-0 h-0.5 animate-scan bg-[#2FD6A0] shadow-[0_0_20px_4px_rgba(47,214,160,0.6)] z-10" />

                  {previewImage ? (
                    <div className="relative z-20">
                      <img
                        src={previewImage}
                        alt="Uploaded preview"
                        className="max-h-48 rounded-xl mx-auto shadow-md border border-[var(--border-color)]"
                      />
                      <p className="mt-3 font-mono text-xs text-[var(--primary)]">
                        Click or drop new image to re-extract
                      </p>
                    </div>
                  ) : (
                    <div className="relative z-20 max-w-sm">
                      <UploadCloud className="w-12 h-12 mx-auto text-[#2FD6A0] mb-3" />
                      <p className="text-base sm:text-lg font-bold">
                        {isDark ? "Drop a screenshot here" : "Point at code or drop an image"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">
                        Supports PNG, JPG or WebP images
                      </p>
                      <span
                        className={`mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          isDark
                            ? "bg-[#111725] border-[#242B39] text-[#29D3C2]"
                            : "bg-white/10 border-white/20 text-white"
                        }`}
                      >
                        Choose image
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="sr-only"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </label>

                {uploadError && (
                  <p className="mt-3 text-xs font-semibold text-red-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {uploadError}
                  </p>
                )}
              </div>
            )}

            {/* Camera Mode */}
            {mode === "Camera" && (
              <div className="space-y-4">
                <div
                  className={`relative min-h-[300px] rounded-2xl overflow-hidden border flex items-center justify-center ${
                    isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-black text-white"
                  }`}
                >
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Viewfinder crosshairs */}
                      <div className="absolute inset-8 border border-white/30 rounded-xl pointer-events-none" />
                      <button
                        onClick={captureCameraSnapshot}
                        className="absolute bottom-4 px-6 py-2.5 rounded-full bg-[#2FD6A0] text-[#070A12] font-bold text-xs shadow-lg hover:scale-105 transition-transform"
                      >
                        Capture Code
                      </button>
                    </>
                  ) : (
                    <div className="p-6 text-center max-w-sm">
                      <Camera className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
                      <p className="text-sm font-bold">
                        {cameraError || "Camera inactive"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Grant camera permission to photograph physical code or whiteboards.
                      </p>
                      <button
                        onClick={startCamera}
                        className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white shadow-sm"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-page)]/50 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>OCR Status: Ready for extraction</span>
            <span className="font-mono text-[11px]">{code.split("\n").length} lines detected</span>
          </div>
        </div>

        {/* Right Panel: Extracted Code Editor (editable) */}
        <div
          className={`app-card overflow-hidden flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                EXTRACTED CODE · editable
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--primary)]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
              {isDark
                ? "Extracted text appears here so you can fix any mistakes before analysis."
                : "Text found in the image appears here so you can fix any mistakes first."}
            </p>

            {/* Editable code editor */}
            <div
              className={`rounded-2xl border p-4 font-mono text-xs sm:text-sm leading-6 ${
                isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
              }`}
            >
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={12}
                aria-label="Editable extracted code"
                className="w-full resize-none bg-transparent outline-none font-mono text-xs sm:text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Two Distinct Analysis Actions */}
          <div className="p-6 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Action 1: Explain This Code */}
              <button
                onClick={triggerStandaloneAnalysis}
                disabled={!code.trim() || isAnalyzing}
                className={`px-5 py-3 rounded-full font-bold text-xs sm:text-sm transition-all active:scale-95 flex items-center gap-2 ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#19143D] text-white hover:bg-[#2a225f]"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Explain This Code
              </button>

              {/* Action 2: Explain Complete Workflow */}
              <button
                onClick={triggerWorkflowAnalysis}
                disabled={!code.trim() || isAnalyzing}
                className={`px-5 py-3 rounded-full font-bold text-xs sm:text-sm border transition-all active:scale-95 flex items-center gap-2 ${
                  isDark
                    ? "border-[#242B39] text-[#F3F5FA] hover:border-[#8B7CFF] bg-[#111725]"
                    : "border-[#19143D] text-[#19143D] hover:bg-[#FAF9FF]"
                }`}
              >
                <GitBranch className="w-4 h-4 text-[var(--primary)]" />
                Explain the Complete Workflow
              </button>
            </div>

            <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
              Workflow tracing connects this snippet to your repository graph.
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Result Displays */}
      {isAnalyzing && (
        <div className="mt-6 app-card p-6 flex items-center gap-3 text-sm font-semibold">
          <div className="h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Parsing AST and computing codebase receipt evidence...</span>
        </div>
      )}

      {/* Result 1: Standalone Code Explanation */}
      {analysisMode === "standalone" && (
        <div className="mt-6 app-card p-6 sm:p-8 border-l-4 border-l-[#29D3C2] animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="text-xl font-bold">Standalone Function Analysis</h3>
            </div>
            <span className="font-mono text-xs text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-full">
              CodeLens AI
            </span>
          </div>

          <div className="mt-5 grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              <p>
                <strong className="text-[var(--text-primary)]">Signature:</strong>{" "}
                <code className="font-mono text-xs">login(email, pw)</code>
              </p>
              <p>
                This function implements a credential validation routine. It searches the database for a user matching the provided email, raises an <code className="font-mono text-xs text-red-500">AuthError</code> if no record exists, and delegates hash verification to <code className="font-mono text-xs">verify()</code>.
              </p>
              <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                <span className="font-bold text-xs uppercase tracking-wide text-[var(--text-primary)] block mb-1">
                  Complexity & Best Practices
                </span>
                <ul className="list-disc pl-4 text-xs space-y-1">
                  <li>Time Complexity: <code className="font-mono">O(1)</code> lookup assuming indexed email field.</li>
                  <li>Timing Attack Consideration: Recommends constant-time password hash comparison.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-[var(--bg-page)] border border-[var(--border-color)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[var(--text-secondary)]">Language</span>
                <p className="text-base font-bold text-[var(--text-primary)] mt-1">Python 3.x</p>
                <span className="text-xs font-mono uppercase text-[var(--text-secondary)] mt-3 block">Security</span>
                <p className="text-xs font-semibold text-green-500 mt-1">No plaintext passwords stored</p>
              </div>
              <button
                onClick={triggerWorkflowAnalysis}
                className="mt-4 w-full py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white"
              >
                Trace Across Repo &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result 2: Complete Workflow Repository Trace */}
      {analysisMode === "workflow" && (
        <div className="mt-6 app-card p-6 sm:p-8 border-l-4 border-l-[#8B7CFF] animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#8B7CFF]" />
              <h3 className="text-xl font-bold">End-to-End Workflow Trace</h3>
            </div>
            <span className="font-mono text-xs text-[#8B7CFF] bg-[#8B7CFF]/15 px-2.5 py-1 rounded-full">
              Connected: my-project
            </span>
          </div>

          <div className="mt-5 space-y-6">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              CodeAtlas successfully matched this snippet to <strong className="text-[var(--text-primary)]">src/auth.py (lines 14–18)</strong> with verified static receipts across your codebase.
            </p>

            {/* Workflow steps sequence */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">1. CALLER</span>
                <h4 className="font-bold text-sm mt-1">LoginForm.tsx</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">HTTP POST submit</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">2. ROUTER</span>
                <h4 className="font-bold text-sm mt-1">POST /auth</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">FastAPI gateway</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--primary)]">
                <span className="font-mono text-[10px] text-[var(--primary)] font-bold">3. THIS SNIPPET</span>
                <h4 className="font-bold text-sm mt-1">auth.py:login()</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">Authenticates token</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">4. SERVICE</span>
                <h4 className="font-bold text-sm mt-1">UserService</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">Issues DB session</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Test Coverage Confirmed: <code>test_auth.py:7</code></span>
              </div>
              <Link
                href="/architecture"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90"
              >
                Inspect in Architecture Graph <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

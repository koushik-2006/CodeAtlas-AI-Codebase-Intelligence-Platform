"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { CodeInputTabs, ExplorerInputMode } from "./CodeInputTabs";
import { CodePasteEditor } from "./CodePasteEditor";
import { ImageUploadZone } from "./ImageUploadZone";
import { CameraCapture } from "./CameraCapture";
import { ExtractedCodeEditor } from "./ExtractedCodeEditor";
import { AnalysisModeButtons } from "./AnalysisModeButtons";
import { CodeExplanationResult } from "./CodeExplanationResult";
import { aiService, CodeAnalysisMode } from "@/services/ai-service";
import { CheckCircle2, Sparkles } from "lucide-react";

const SAMPLE_SNIPPETS = {
  auth: `// src/services/auth.ts
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = await db.users.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or account disabled.");
  }
  const isMatch = await verifyHash(password, user.passwordHash);
  if (!isMatch) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or account disabled.");
  }
  return { token: createToken(user.id), user };
}`,
  ts: `// src/components/LoginForm.tsx
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginUser(email, password);
    localStorage.setItem("auth_token", result.token);
  };
}`,
  routes: `@router.post("/auth/login")
async def handle_login(payload: LoginRequest):
    token = login(payload.email, payload.password)
    return {"access_token": token}`,
};

export function CodeLensWorkspace() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Tab mode
  const [mode, setMode] = useState<ExplorerInputMode>("Paste Code");

  // Code & Language state
  const [code, setCode] = useState<string>(SAMPLE_SNIPPETS.auth);
  const [language, setLanguage] = useState<string>("typescript");
  const [confidence, setConfidence] = useState<number | undefined>(undefined);

  // Upload state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // Analysis target repo
  const [selectedRepo, setSelectedRepo] = useState<string>("sample-project");

  // Active analysis results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<string | null>(null);
  const [activeModeTitle, setActiveModeTitle] = useState<string>("Code Intelligence");
  const [analysisMarkdown, setAnalysisMarkdown] = useState<string>("");
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysisConfig, setLastAnalysisConfig] = useState<{
    mode: CodeAnalysisMode | "flowchart";
    targetLang?: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (mode !== "Camera Capture" && cameraActive) {
      stopCamera();
    }
  }, [mode, cameraActive]);

  // Camera initiation
  const startCamera = async () => {
    setCameraError(null);
    setCapturedSnapshot(null);
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

  // Capture frame from active camera
  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      setCapturedSnapshot(dataUrl);
      stopCamera();
    }
  };

  // Accept snapshot and extract code with Gemini Multimodal
  const acceptCapturedSnapshot = async () => {
    if (!capturedSnapshot) return;
    setIsExtractingImage(true);
    setCameraError(null);

    try {
      // Convert DataURL to Blob and then File
      const res = await fetch(capturedSnapshot);
      const blob = await res.blob();
      const file = new File([blob], "camera-capture.png", { type: "image/png" });

      const extracted = await aiService.explainImage(file);
      setCode(extracted.code);
      if (extracted.language) setLanguage(extracted.language.toLowerCase());
      setConfidence(extracted.confidence || 0.95);
    } catch (err: any) {
      const errInfo = aiService.classifyError(err);
      setCameraError(errInfo.userMessage);
    } finally {
      setIsExtractingImage(false);
    }
  };

  // File upload handler with Gemini Multimodal Extraction
  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    setUploadError(null);

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid format. Please upload PNG, JPEG, or WebP screenshot.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Maximum image size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);
      setIsExtractingImage(true);

      try {
        const extracted = await aiService.explainImage(file);
        setCode(extracted.code);
        if (extracted.language) setLanguage(extracted.language.toLowerCase());
        setConfidence(extracted.confidence || 0.96);
      } catch (err: any) {
        const errInfo = aiService.classifyError(err);
        setUploadError(errInfo.userMessage);
      } finally {
        setIsExtractingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setConfidence(undefined);
  };

  const handleStopAnalysis = () => {
    abortControllerRef.current?.abort();
    setIsAnalyzing(false);
  };

  // Run one of the 7 analysis modes
  const handleRunAnalysis = async (modeName: CodeAnalysisMode, targetLanguage?: string) => {
    if (!code.trim() || isAnalyzing) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLastAnalysisConfig({ mode: modeName, targetLang: targetLanguage });
    setActiveAnalysisMode(modeName);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setMermaidChart(null);
    setAnalysisMarkdown("");

    const titles: Record<CodeAnalysisMode, string> = {
      explain: "Simple Explanation",
      "line-by-line": "Line-by-Line Walkthrough",
      "find-bugs": "Bug & Security Audit",
      optimize: "Performance & Complexity Optimization",
      "add-comments": "Annotated Code Comments",
      convert: `Code Conversion to ${targetLanguage || "Target"}`,
      "generate-tests": "Unit Test Suite",
    };

    setActiveModeTitle(titles[modeName] || "Code Intelligence");

    // Scroll to results area smoothly
    setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      await aiService.explainCode({
        code,
        language,
        mode: modeName,
        targetLanguage,
        onChunk: (accumulated) => {
          setAnalysisMarkdown(accumulated);
        },
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        return;
      }
      const errInfo = aiService.classifyError(err);
      setAnalysisError(errInfo.userMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Mermaid Visual Flowchart
  const handleGenerateFlowchart = async () => {
    if (!code.trim() || isAnalyzing) return;

    abortControllerRef.current?.abort();
    setActiveAnalysisMode("flowchart");
    setActiveModeTitle("Visual Control Flow");
    setIsAnalyzing(true);
    setAnalysisError(null);
    setMermaidChart(null);
    setAnalysisMarkdown("");
    setLastAnalysisConfig({ mode: "flowchart" });

    // Scroll to results
    setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      const diagram = await aiService.generateMermaidFlowchart(code, language);
      setMermaidChart(diagram);
    } catch (err: any) {
      const errInfo = aiService.classifyError(err);
      setAnalysisError(errInfo.userMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryLastAnalysis = () => {
    if (!lastAnalysisConfig) return;
    if (lastAnalysisConfig.mode === "flowchart") {
      handleGenerateFlowchart();
    } else {
      handleRunAnalysis(lastAnalysisConfig.mode, lastAnalysisConfig.targetLang);
    }
  };

  return (
    <div className="space-y-6">
      {/* Three Input Tabs */}
      <CodeInputTabs
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          if (m === "Camera Capture" && !cameraActive && !capturedSnapshot) {
            startCamera();
          }
        }}
      />

      {/* Main 2-Panel Input & Editor Workspace */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel: Mode Specific Input */}
        <div
          className={`app-card overflow-hidden flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                Input Mode: {mode}
              </span>
            </div>

            {mode === "Paste Code" && (
              <CodePasteEditor
                code={code}
                language={language}
                onLanguageChange={setLanguage}
                onChange={setCode}
                onLoadSnippet={(k) => {
                  setCode(SAMPLE_SNIPPETS[k]);
                  if (k === "routes") setLanguage("python");
                  else setLanguage("typescript");
                }}
                onClear={() => setCode("")}
              />
            )}

            {mode === "Upload Screenshot" && (
              <ImageUploadZone
                previewImage={previewImage}
                uploadError={uploadError}
                isExtracting={isExtractingImage}
                onFileUpload={handleFileUpload}
                onRemoveImage={handleRemoveImage}
              />
            )}

            {mode === "Camera Capture" && (
              <CameraCapture
                cameraActive={cameraActive}
                cameraError={cameraError}
                videoRef={videoRef}
                capturedPreview={capturedSnapshot}
                isProcessingSnapshot={isExtractingImage}
                onStartCamera={startCamera}
                onStopCamera={stopCamera}
                onCapture={captureCameraFrame}
                onRetake={() => {
                  setCapturedSnapshot(null);
                  startCamera();
                }}
                onAcceptCapture={acceptCapturedSnapshot}
                onFallbackToUpload={() => setMode("Upload Screenshot")}
              />
            )}
          </div>

          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-page)]/50 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              OCR Engine: Firebase AI Gemini Multimodal
            </span>
            <span className="font-mono text-[11px]">
              {code.split("\n").length} lines in buffer
            </span>
          </div>
        </div>

        {/* Right Panel: Extracted Code Editor + Analysis Modes */}
        <div
          className={`app-card overflow-hidden flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <ExtractedCodeEditor
            code={code}
            language={language}
            confidence={confidence}
            onChange={setCode}
            onLanguageChange={setLanguage}
            onClear={() => setCode("")}
            onResetToInput={() => {
              if (mode === "Upload Screenshot") setPreviewImage(null);
              if (mode === "Camera Capture") setCapturedSnapshot(null);
            }}
          />

          <AnalysisModeButtons
            disabled={!code.trim() || isAnalyzing}
            selectedRepo={selectedRepo}
            onRepoChange={setSelectedRepo}
            onRunAnalysis={handleRunAnalysis}
            onGenerateFlowchart={handleGenerateFlowchart}
            activeMode={activeAnalysisMode}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>

      {/* Analysis Output Section */}
      <div ref={resultSectionRef}>
        {(isAnalyzing || analysisMarkdown || mermaidChart || analysisError) && (
          <CodeExplanationResult
            modeTitle={activeModeTitle}
            markdownText={analysisMarkdown}
            mermaidChart={mermaidChart}
            isLoading={isAnalyzing}
            error={analysisError}
            onReturnToEditor={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onRetry={handleRetryLastAnalysis}
            onStop={handleStopAnalysis}
          />
        )}
      </div>
    </div>
  );
}

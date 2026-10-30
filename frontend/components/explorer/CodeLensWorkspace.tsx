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
import { WorkflowTrace } from "./WorkflowTrace";
import { codeExplanationService } from "@/services/code-explanation-service";
import { repositoryMatchingService } from "@/services/repository-matching-service";
import { codeExtractionService } from "@/services/code-extraction-service";
import { StandaloneExplanation, WorkflowTraceData } from "@/types/codelens";
import {
  Sparkles,
  GitBranch,
  AlertTriangle,
  ArrowRight,
  FolderGit2,
  CheckCircle2,
} from "lucide-react";

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

  // Analysis execution states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingMessage, setAnalyzingMessage] = useState("");
  const [standaloneResult, setStandaloneResult] = useState<StandaloneExplanation | null>(null);
  const [workflowTraceResult, setWorkflowTraceResult] = useState<WorkflowTraceData | null>(null);
  const [unmatchedError, setUnmatchedError] = useState<string | null>(null);
  const [repoRequiredError, setRepoRequiredError] = useState<boolean>(false);

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

  // Accept snapshot and extract code
  const acceptCapturedSnapshot = async () => {
    if (!capturedSnapshot) return;
    setIsExtractingImage(true);
    try {
      const ocrResult = await codeExtractionService.extractFromSnapshot(capturedSnapshot);
      setCode(ocrResult.code);
      if (ocrResult.languageDetected) {
        setLanguage(ocrResult.languageDetected.toLowerCase());
      }
      setConfidence(ocrResult.confidence || 0.95);
    } catch (err: any) {
      setCameraError(err.message || "Failed to extract code from snapshot.");
    } finally {
      setIsExtractingImage(false);
    }
  };

  // File upload handler
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
        const ocrResult = await codeExtractionService.extractFromImage(file);
        setCode(ocrResult.code);
        if (ocrResult.languageDetected) {
          setLanguage(ocrResult.languageDetected.toLowerCase());
        }
        setConfidence(ocrResult.confidence || 0.96);
      } catch (err: any) {
        setUploadError(err.message || "Failed to extract code from screenshot.");
      } finally {
        setIsExtractingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove previewed image
  const handleRemoveImage = () => {
    setPreviewImage(null);
    setConfidence(undefined);
  };

  // Action A: Explain This Code (Standalone)
  const handleExplainCode = async () => {
    if (!code.trim() || isAnalyzing) return;

    // Reset previous results
    setWorkflowTraceResult(null);
    setUnmatchedError(null);
    setRepoRequiredError(false);
    setIsAnalyzing(true);
    setAnalyzingMessage("Analyzing syntax tree, token signatures, and complexity profile...");

    try {
      const result = await codeExplanationService.explainSnippet(code, language);
      setStandaloneResult(result);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Action B: Explain Complete Workflow (Repository-grounded)
  const handleExplainWorkflow = async () => {
    if (!code.trim() || isAnalyzing) return;

    if (!selectedRepo || selectedRepo === "none") {
      setRepoRequiredError(true);
      setWorkflowTraceResult(null);
      setStandaloneResult(null);
      setUnmatchedError(null);
      return;
    }

    setRepoRequiredError(false);
    setStandaloneResult(null);
    setUnmatchedError(null);
    setIsAnalyzing(true);
    setAnalyzingMessage(
      `Searching repository '${selectedRepo}' for matching AST tokens and call references...`
    );

    try {
      const matchResult = await repositoryMatchingService.matchAndTraceWorkflow(code, selectedRepo);

      if (matchResult.matched && matchResult.trace) {
        setWorkflowTraceResult(matchResult.trace);
        setUnmatchedError(null);
      } else {
        // Honest fallback when not matched!
        setWorkflowTraceResult(null);
        setUnmatchedError(
          matchResult.unmatchedReason ||
            "We couldn't verify a matching location in this repository. Here is a standalone explanation of the submitted code instead."
        );
        // Automatically provide standalone fallback as mandated!
        const fallback = await codeExplanationService.explainSnippet(code, language);
        setStandaloneResult(fallback);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
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
              OCR Engine: AST Token Reconstructor
            </span>
            <span className="font-mono text-[11px]">
              {code.split("\n").length} lines in buffer
            </span>
          </div>
        </div>

        {/* Right Panel: Extracted Code Editor + Two Action Buttons */}
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
            onExplainCode={handleExplainCode}
            onExplainWorkflow={handleExplainWorkflow}
          />
        </div>
      </div>

      {/* Loading Progress State */}
      {isAnalyzing && (
        <div className="mt-6 app-card p-6 flex items-center gap-3 text-sm font-semibold border-l-4 border-l-[var(--primary)]">
          <div className="h-5 w-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-[var(--text-primary)]">{analyzingMessage}</span>
        </div>
      )}

      {/* Repository Required Prompt State */}
      {repoRequiredError && (
        <div className="mt-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderGit2 className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Repository Selection Required
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Workflow tracing requires a target codebase to search for symbol references. Please select &apos;sample-project&apos; or connect a repository.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedRepo("sample-project");
                setRepoRequiredError(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90"
            >
              Select sample-project
            </button>
            <Link
              href="/repositories"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Connect Repository...
            </Link>
          </div>
        </div>
      )}

      {/* Honest Unmatched Location Notice */}
      {unmatchedError && (
        <div className="mt-6 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3 text-xs leading-relaxed text-[var(--text-primary)]">
          <AlertTriangle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-blue-500 block mb-0.5">
              Codebase Evidence Transparency:
            </strong>
            {unmatchedError}
          </div>
        </div>
      )}

      {/* Result A: Standalone Code Explanation Result */}
      {standaloneResult && (
        <CodeExplanationResult
          result={standaloneResult}
          onReturnToEditor={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onTraceAcrossRepo={handleExplainWorkflow}
        />
      )}

      {/* Result B: End-to-End Workflow Trace Result */}
      {workflowTraceResult && (
        <WorkflowTrace trace={workflowTraceResult} />
      )}
    </div>
  );
}

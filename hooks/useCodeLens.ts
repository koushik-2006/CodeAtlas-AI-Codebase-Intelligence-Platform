"use client";

import { useState } from "react";
import { DEFAULT_SNIPPET } from "@/lib/constants";
import { codeExtractionService } from "@/services/code-extraction-service";

export type CodeLensMode = "Paste" | "Upload" | "Camera";
export type CodeLensAnalysisType = "none" | "standalone" | "workflow";

export function useCodeLens() {
  const [mode, setMode] = useState<CodeLensMode>("Upload");
  const [code, setCode] = useState(DEFAULT_SNIPPET);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<CodeLensAnalysisType>("none");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    setUploadError(null);

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Invalid format. Please upload PNG, JPG, or WebP screenshot.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setPreviewImage(e.target?.result as string);
      const result = await codeExtractionService.extractFromImage(file);
      setCode(result.code);
    };
    reader.readAsDataURL(file);
  };

  const handleSnapshotCapture = async (dataUrl: string) => {
    setPreviewImage(dataUrl);
    const result = await codeExtractionService.extractFromSnapshot(dataUrl);
    setCode(result.code);
  };

  const explainCode = () => {
    setIsAnalyzing(true);
    setAnalysisType("none");
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisType("standalone");
    }, 600);
  };

  const explainWorkflow = () => {
    setIsAnalyzing(true);
    setAnalysisType("none");
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisType("workflow");
    }, 800);
  };

  return {
    mode,
    setMode,
    code,
    setCode,
    previewImage,
    uploadError,
    analysisType,
    isAnalyzing,
    handleFileUpload,
    handleSnapshotCapture,
    explainCode,
    explainWorkflow,
  };
}

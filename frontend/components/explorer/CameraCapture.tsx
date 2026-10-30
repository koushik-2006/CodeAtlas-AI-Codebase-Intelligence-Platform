"use client";

import { useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Camera,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Upload,
  RefreshCw,
  VideoOff,
} from "lucide-react";

interface CameraCaptureProps {
  cameraActive: boolean;
  cameraError: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  capturedPreview: string | null;
  isProcessingSnapshot?: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapture: () => void;
  onRetake: () => void;
  onAcceptCapture: () => void;
  onFallbackToUpload?: () => void;
}

export function CameraCapture({
  cameraActive,
  cameraError,
  videoRef,
  capturedPreview,
  isProcessingSnapshot = false,
  onStartCamera,
  onStopCamera,
  onCapture,
  onRetake,
  onAcceptCapture,
  onFallbackToUpload,
}: CameraCaptureProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Ensure tracks are cleanly released when unmounted
  useEffect(() => {
    return () => {
      onStopCamera();
    };
  }, [onStopCamera]);

  return (
    <div className="space-y-3">
      <div
        className={`relative min-h-[320px] rounded-2xl overflow-hidden border flex items-center justify-center transition-all ${
          isDark
            ? "bg-[#0A0F19] border-[#242B39]"
            : "bg-[#1E2022] text-white border-[#E8E5F4]"
        }`}
      >
        {/* State 1: Captured photo review */}
        {capturedPreview ? (
          <div className="relative w-full h-full p-4 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#29D3C2] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Photo Captured · Review Snapshot
            </span>

            <div className="relative max-h-56 max-w-full rounded-xl overflow-hidden shadow-lg border border-white/20 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedPreview}
                alt="Captured code preview"
                className="max-h-56 max-w-full object-contain mx-auto"
              />
              {isProcessingSnapshot && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-mono">
                  <div className="h-6 w-6 border-2 border-[#29D3C2] border-t-transparent rounded-full animate-spin mb-2" />
                  <span>Extracting code tokens...</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onRetake}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-white/30 text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>

              <button
                type="button"
                onClick={onAcceptCapture}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#6C4DFF] text-white hover:bg-[#5b3ce6]"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Extract Code From Photo
              </button>
            </div>
          </div>
        ) : cameraActive ? (
          /* State 2: Active camera stream with viewfinder */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full min-h-[320px] object-cover"
            />

            {/* Viewfinder Overlay */}
            <div className="absolute inset-8 border-2 border-white/40 border-dashed rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between text-[10px] font-mono text-white/70">
                <span>[SCANNING VIEWPORT]</span>
                <span>ALIGN SNIPPET</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded">
                  Position code clearly in center
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onCapture}
                className="px-6 py-2.5 rounded-full bg-[#2FD6A0] text-[#070A12] font-bold text-xs shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={onStopCamera}
                className="px-4 py-2.5 rounded-full bg-black/60 text-white font-bold text-xs hover:bg-black/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* State 3: Camera inactive or permission denied */
          <div className="p-6 text-center max-w-sm">
            {cameraError ? (
              <VideoOff className="w-12 h-12 mx-auto text-amber-500 mb-3" />
            ) : (
              <Camera className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
            )}

            <h4 className="text-sm font-bold text-white">
              {cameraError ? "Camera Access Required" : "Live Camera Capture"}
            </h4>

            <p className="mt-1 text-xs text-white/70 leading-relaxed">
              {cameraError ||
                "Grant browser permission to photograph handwritten whiteboards, books, or screen snippets."}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={onStartCamera}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#6C4DFF] text-white hover:bg-[#5b3ce6]"
                }`}
              >
                {cameraError ? "Try Again" : "Start Camera"}
              </button>

              {onFallbackToUpload && (
                <button
                  type="button"
                  onClick={onFallbackToUpload}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/20 text-white/90 hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Screenshot Instead
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
        <strong className="text-[var(--text-primary)]">Camera Note:</strong> Camera capture requests access only when activated and streams stay local to your browser. You can inspect or discard the captured image before any extraction occurs.
      </div>
    </div>
  );
}

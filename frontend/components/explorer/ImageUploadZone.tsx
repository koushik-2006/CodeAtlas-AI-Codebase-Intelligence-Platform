"use client";

import { useTheme } from "@/hooks/useTheme";
import { UploadCloud, AlertTriangle, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface ImageUploadZoneProps {
  previewImage: string | null;
  uploadError: string | null;
  isExtracting?: boolean;
  onFileUpload: (file?: File) => void;
  onRemoveImage: () => void;
}

export function ImageUploadZone({
  previewImage,
  uploadError,
  isExtracting = false,
  onFileUpload,
  onRemoveImage,
}: ImageUploadZoneProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-3">
      {previewImage ? (
        <div
          className={`relative rounded-2xl border p-4 text-center overflow-hidden ${
            isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-[#FAF9FF] border-[#E8E5F4]"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-3">
            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[var(--primary)]" />
              Image Loaded
            </span>
            <button
              type="button"
              onClick={onRemoveImage}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              Remove Image
            </button>
          </div>

          <div className="relative inline-block max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Uploaded screenshot"
              className="max-h-56 max-w-full rounded-xl mx-auto shadow-md border border-[var(--border-color)] object-contain"
            />
            {isExtracting && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-white text-xs font-mono">
                <div className="h-6 w-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-2" />
                <span>Extracting code tokens via OCR...</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="flex items-center gap-1 text-green-500 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Snippet extracted
            </span>
            <span>Edit or correct code in panel &rarr;</span>
          </div>
        </div>
      ) : (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFileUpload(e.dataTransfer.files?.[0]);
          }}
          className={`relative grid min-h-[300px] cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDark
              ? "border-[#30363D] bg-[#0D1117] hover:border-[#29D3C2]/50 hover:bg-[#111725]/50"
              : "border-[#DDD5FE] bg-[#1E2022] text-white hover:border-[#6C4DFF]"
          }`}
        >
          {/* Laser scanning beam */}
          <span className="absolute inset-x-0 h-0.5 animate-scan bg-[#2FD6A0] shadow-[0_0_20px_4px_rgba(47,214,160,0.6)] z-10" />

          <div className="relative z-20 max-w-sm">
            <UploadCloud className="w-12 h-12 mx-auto text-[#29D3C2] mb-3" />
            <p className="text-base sm:text-lg font-bold">
              Drop screenshot or photo here
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">
              Accepts PNG, JPEG or WebP images (max 10MB)
            </p>
            <span
              className={`mt-4 inline-block px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#29D3C2]"
                  : "bg-white/10 border-white/20 text-white"
              }`}
            >
              Choose image file
            </span>
          </div>

          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="sr-only"
            onChange={(e) => onFileUpload(e.target.files?.[0])}
          />
        </label>
      )}

      {uploadError && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </p>
      )}

      <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
        <strong className="text-[var(--text-primary)]">OCR Transparency:</strong> CodeAtlas uses deterministic AST token reconstruction. If characters are misread, use the editor on the right to edit the text before requesting an explanation.
      </div>
    </div>
  );
}

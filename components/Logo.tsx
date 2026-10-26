"use client";

import { useTheme } from "@/hooks/useTheme";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Facet 1 (Leftmost) Gradient */}
        <linearGradient id="logo-p1" x1="10" y1="33" x2="32" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B65FF" />
          <stop offset="100%" stopColor="#1B36C7" />
        </linearGradient>

        {/* Facet 2 (Center-Left) Gradient */}
        <linearGradient id="logo-p2" x1="32" y1="19" x2="52" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#244AE8" />
          <stop offset="100%" stopColor="#0E239E" />
        </linearGradient>

        {/* Facet 3 (Center-Right) Gradient */}
        <linearGradient id="logo-p3" x1="52" y1="33" x2="72" y2="71" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#0077FE" />
        </linearGradient>

        {/* Facet 4 (Rightmost) Gradient */}
        <linearGradient id="logo-p4" x1="72" y1="19" x2="92" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#1D4CE8" />
        </linearGradient>

        {/* Dynamic Chevron Gradient */}
        <linearGradient id="logo-chevron" x1="10" y1="55" x2="92" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="50%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>

      {/* External Circuit Nodes & Traces (extending outside the map folds) */}
      {/* Top Middle Terminal Node */}
      <line x1="56" y1="31" x2="56" y2="10" stroke="#00F0FF" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="56" cy="10" r="3.2" stroke="#00F0FF" strokeWidth="2.2" fill="white" />

      {/* Bottom Left Terminal Node */}
      <line x1="26" y1="78" x2="26" y2="92" stroke="#00F0FF" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="26" cy="92" r="3.2" stroke="#00F0FF" strokeWidth="2.2" fill="white" />

      {/* Panel 1: Leftmost Fold */}
      <polygon points="10,33 32,19 32,71 10,85" fill="url(#logo-p1)" />

      {/* Panel 2: Center-Left Fold */}
      <polygon points="32,19 52,33 52,85 32,71" fill="url(#logo-p2)" />

      {/* Panel 3: Center-Right Fold */}
      <polygon points="52,33 72,19 72,71 52,85" fill="url(#logo-p3)" />

      {/* Panel 4: Rightmost Fold */}
      <polygon points="72,19 92,33 92,85 72,71" fill="url(#logo-p4)" />

      {/* Central Dynamic Chevron Ribbon (Electric cyan fold running across) */}
      <path
        d="M10,65 L32,51 L52,65 L72,51 L92,65 L92,54 L72,40 L52,54 L32,40 L10,54 Z"
        fill="url(#logo-chevron)"
        opacity="0.95"
      />

      {/* Internal Code Elements & Circuit Lines */}
      {/* Left Code Bracket on Panel 1 */}
      <path d="M22,39 L18,43 L22,47" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M26,39 L30,43 L26,47" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Circuit Trace on Panel 1 */}
      <circle cx="24" cy="62" r="2" fill="#00F0FF" />
      <path d="M24,62 L18,68 L26,76" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Circuit Trace & Vias on Panel 2/3 */}
      <path d="M56,31 L56,45 L42,54" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="61" cy="40" r="1.4" fill="#00F0FF" />
      <circle cx="64" cy="44" r="1.4" fill="#00F0FF" />
      <circle cx="67" cy="48" r="1.4" fill="#00F0FF" />

      {/* Right Code Bracket on Panel 4 */}
      <path d="M80,63 L76,67 L80,71" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M84,63 L88,67 L84,71" stroke="#00F0FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Terminal Node on Panel 4 */}
      <circle cx="83" cy="45" r="2.2" stroke="#00F0FF" strokeWidth="1.6" fill="white" />
      <path d="M83,45 L72,52" stroke="#00F0FF" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const iconDimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const textTypography = {
    sm: "text-base tracking-tight",
    md: "text-xl tracking-tight",
    lg: "text-2xl tracking-tight",
    xl: "text-3xl tracking-tight",
  };

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Folded Map & Circuit Icon */}
      <span className="relative flex shrink-0 items-center justify-center transition-transform duration-200 hover:scale-105">
        <LogoIcon className={iconDimensions[size]} />
      </span>

      {/* Two-Tone Wordmark */}
      {showText && (
        <span className={`font-black font-sans leading-none ${textTypography[size]}`}>
          <span className={isDark ? "text-white" : "text-[#0B1A75]"}>
            Code
          </span>
          <span className="text-[#00D4FF] drop-shadow-xs">
            Atlas
          </span>
        </span>
      )}
    </span>
  );
}

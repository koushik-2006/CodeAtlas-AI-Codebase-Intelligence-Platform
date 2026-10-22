"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";

export type Tone = "coral" | "brand" | "sun" | "mint" | "cyan" | "purple";

const TONES_LIGHT: Record<string, [string, string, string]> = {
  coral: ["#FF9A9C", "#FF5A5F", "#D93A40"],
  brand: ["#A99BFF", "#6C4DFF", "#4B31D6"],
  sun: ["#FFE08A", "#FFC53D", "#E0A100"],
  mint: ["#8FEFD0", "#2FD6A0", "#1BA97B"],
};

const TONES_DARK: Record<string, [string, string, string]> = {
  coral: ["#FF7582", "#E83B46", "#A81E27"],
  brand: ["#5CE1E6", "#29D3C2", "#138F83"],
  sun: ["#FFEAA7", "#F3C969", "#C6982E"],
  mint: ["#7BED9F", "#2ED573", "#1B9A50"],
};

export type Building = {
  id: string;
  label: string;
  cx: number;
  cy: number;
  a: number;
  h: number;
  tone: string;
  type?: string;
};

export const BUILDINGS: Building[] = [
  { id: "auth", label: "auth.py", cx: 255, cy: 130, a: 30, h: 110, tone: "coral", type: "Function" },
  { id: "api", label: "api", cx: 345, cy: 125, a: 18, h: 62, tone: "brand", type: "API Route" },
  { id: "login", label: "Login.tsx", cx: 150, cy: 150, a: 26, h: 72, tone: "brand", type: "Component" },
  { id: "service", label: "UserService", cx: 335, cy: 170, a: 28, h: 100, tone: "sun", type: "Service" },
  { id: "db", label: "db", cx: 255, cy: 200, a: 26, h: 46, tone: "mint", type: "Database" },
  { id: "tests", label: "tests", cx: 175, cy: 215, a: 20, h: 30, tone: "mint", type: "Test Suite" },
];

// Dark Graph Nodes matching Reference 2 (PDF 2 Page 1 & 6)
export const GRAPH_NODES = [
  { id: "login", label: "LoginForm.tsx", type: "Component", x: 80, y: 150, color: "#29D3C2", desc: "User entry point" },
  { id: "api", label: "POST /auth", type: "API Route", x: 190, y: 100, color: "#8B7CFF", desc: "Endpoint router" },
  { id: "auth", label: "authorize()", type: "Core Function", x: 300, y: 150, color: "#29D3C2", desc: "Token authentication" },
  { id: "service", label: "UserService", type: "Service", x: 410, y: 100, color: "#F3C969", desc: "User database lookup" },
  { id: "db", label: "users table", type: "Database", x: 500, y: 180, color: "#2FD6A0", desc: "PostgreSQL storage" },
  { id: "tests", label: "test_auth.py", type: "Test", x: 280, y: 240, color: "#FF5A5F", desc: "Unit & Integration test" },
];

function IsometricBox({
  b,
  on,
  onPick,
  isDark,
}: {
  b: Building;
  on: boolean;
  onPick?: (id: string) => void;
  isDark: boolean;
}) {
  const tones = isDark ? TONES_DARK : TONES_LIGHT;
  const [t, l, r] = tones[b.tone] || tones.brand;
  const { cx, cy, a, h } = b;
  const p = (pts: number[][]) => pts.map((q) => q.join(",")).join(" ");

  return (
    <g
      onClick={() => onPick?.(b.id)}
      className="cursor-pointer transition-transform duration-200 hover:opacity-100"
      opacity={on ? 1 : 0.9}
    >
      {/* Left polygon */}
      <polygon fill={l} points={p([[cx - a, cy - h], [cx, cy - h + a / 2], [cx, cy + a / 2], [cx - a, cy]])} />
      {/* Right polygon */}
      <polygon fill={r} points={p([[cx, cy - h + a / 2], [cx + a, cy - h], [cx + a, cy], [cx, cy + a / 2]])} />
      {/* Top polygon */}
      <polygon
        fill={t}
        stroke={on ? (isDark ? "#29D3C2" : "#1B1245") : (isDark ? "#242B39" : "none")}
        strokeWidth={on ? "3" : "1"}
        points={p([[cx, cy - h - a / 2], [cx + a, cy - h], [cx, cy - h + a / 2], [cx - a, cy - h]])}
      />
      {/* Floating Label */}
      <g transform={`translate(${cx},${cy - h - a / 2 - 14})`}>
        <rect
          x={-(b.label.length * 3.6 + 12)}
          y="-10"
          width={b.label.length * 7.2 + 24}
          height="20"
          rx="10"
          fill={isDark ? "#0D111B" : "#FFFFFF"}
          stroke={on ? (isDark ? "#29D3C2" : "#6C4DFF") : (isDark ? "#242B39" : "#E4E0FF")}
          strokeWidth={on ? "2" : "1"}
          filter={on ? "drop-shadow(0 2px 8px rgba(108,77,255,0.4))" : undefined}
        />
        <text
          textAnchor="middle"
          y="4"
          fontSize="9.5"
          fontWeight="600"
          fontFamily="var(--font-mono)"
          fill={isDark ? "#F3F5FA" : "#19143D"}
        >
          {b.label}
        </text>
      </g>
    </g>
  );
}

export default function City({
  selected,
  onPick,
  className = "",
  forceMode,
}: {
  selected?: string;
  onPick?: (id: string) => void;
  className?: string;
  forceMode?: "light" | "dark" | "graph";
}) {
  const { theme } = useTheme();
  const isDark = forceMode === "dark" || (forceMode !== "light" && theme === "dark");
  const showGraph = forceMode === "graph" || isDark;

  if (showGraph) {
    // Dark Theme Technical Node Graph matching Reference 2 (PDF 2)
    return (
      <svg
        viewBox="0 0 580 320"
        className={className}
        role="img"
        aria-label="Interactive architecture workflow graph"
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="dark-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#242B39" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          {/* Glow filter */}
          <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Gradients */}
          <linearGradient id="edge-cyan-purple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#29D3C2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B7CFF" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="edge-purple-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B7CFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#29D3C2" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Ambient Dark Canvas Background */}
        <rect width="100%" height="100%" rx="16" fill="#0A0F19" />
        <rect width="100%" height="100%" rx="16" fill="url(#dark-grid)" />

        {/* Orbital rings */}
        <circle cx="300" cy="150" r="160" fill="none" stroke="#242B39" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
        <circle cx="300" cy="150" r="100" fill="none" stroke="#29D3C2" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.3" />

        {/* Connecting Edges */}
        <g strokeLinecap="round">
          {/* LoginForm -> POST /auth */}
          <path
            d="M 125 150 Q 150 120 170 105"
            stroke="url(#edge-cyan-purple)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* POST /auth -> authorize() */}
          <path
            d="M 230 105 Q 260 120 280 145"
            stroke="url(#edge-purple-cyan)"
            strokeWidth="2.5"
            fill="none"
          />
          {/* authorize() -> UserService */}
          <path
            d="M 335 145 Q 365 115 390 105"
            stroke="#8B7CFF"
            strokeWidth="2.5"
            fill="none"
          />
          {/* UserService -> users table */}
          <path
            d="M 445 105 Q 470 135 485 170"
            stroke="#29D3C2"
            strokeWidth="2.5"
            fill="none"
          />
          {/* authorize() -> test_auth.py */}
          <path
            d="M 300 165 L 290 225"
            stroke="#FF5A5F"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
          />
        </g>

        {/* Animated pulses along the edges */}
        <circle cx="150" cy="125" r="3" fill="#29D3C2" className="animate-ping" opacity="0.75" />
        <circle cx="365" cy="125" r="3" fill="#8B7CFF" className="animate-ping" opacity="0.75" />
        <circle cx="470" cy="135" r="3" fill="#2FD6A0" className="animate-ping" opacity="0.75" />

        {/* Nodes */}
        {GRAPH_NODES.map((node) => {
          const isSelected = selected === node.id || (!selected && node.id === "auth");
          return (
            <g
              key={node.id}
              onClick={() => onPick?.(node.id)}
              className="cursor-pointer transition-transform duration-200"
              transform={`translate(${node.x}, ${node.y})`}
            >
              {/* Glow when selected */}
              {isSelected && (
                <circle cx="0" cy="0" r="32" fill={node.color} opacity="0.15" className="animate-pulse" />
              )}

              {/* Node container */}
              <rect
                x="-48"
                y="-18"
                width="96"
                height="36"
                rx="18"
                fill="#0D111B"
                stroke={isSelected ? node.color : "#242B39"}
                strokeWidth={isSelected ? "2.5" : "1.5"}
                filter={isSelected ? "url(#cyan-glow)" : undefined}
              />

              {/* Type pill */}
              <circle cx="-32" cy="0" r="5" fill={node.color} />

              {/* Label */}
              <text
                x="-20"
                y="4"
                fontSize="10"
                fontWeight="700"
                fontFamily="var(--font-mono)"
                fill="#F3F5FA"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Light Theme Isometric City SVG matching Reference 1 (PDF 1)
  return (
    <svg
      viewBox="0 0 460 300"
      className={className}
      role="img"
      aria-label="Isometric code city, generated from your repository"
    >
      <defs>
        <filter id="city-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#6C4DFF" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Isometric Island Ground */}
      <polygon points="230,285 440,185 440,170 230,270 20,170 20,185" fill="#DADFFC" />
      <polygon points="230,70 440,170 230,270 20,170" fill="#FFFFFF" stroke="#E8E5F4" strokeWidth="1.5" />

      {/* Roads connecting buildings */}
      <g stroke="#E6E9FF" strokeWidth="10" strokeLinecap="round" fill="none">
        <path d="M150 190L255 150L335 190" />
        <path d="M255 150L255 210" />
        <path d="M175 225L255 225L335 190" />
      </g>

      {/* Vehicles / Data Packets */}
      <circle cx="262" cy="170" r="4.5" fill="#FF5A5F" />
      <circle cx="205" cy="212" r="4" fill="#2FD6A0" />
      <circle cx="310" cy="180" r="4" fill="#6C4DFF" />

      {/* Isometric Buildings rendered back to front */}
      {[...BUILDINGS]
        .sort((x, y) => x.cy - y.cy)
        .map((b) => (
          <IsometricBox
            key={b.id}
            b={b}
            on={selected === b.id}
            onPick={onPick}
            isDark={false}
          />
        ))}
    </svg>
  );
}

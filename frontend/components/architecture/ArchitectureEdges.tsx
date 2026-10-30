"use client";

import { useTheme } from "@/hooks/useTheme";

interface Edge {
  from: [number, number];
  to: [number, number];
  label?: string;
}

interface ArchitectureEdgesProps {
  edges: Edge[];
}

export function ArchitectureEdges({ edges }: ArchitectureEdgesProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const strokeColor = isDark ? "#29D3C2" : "#6C4DFF";

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <marker
          id="edge-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} opacity={0.6} />
        </marker>
      </defs>
      {edges.map((edge, idx) => (
        <path
          key={idx}
          d={`M ${edge.from[0]} ${edge.from[1]} C ${(edge.from[0] + edge.to[0]) / 2} ${edge.from[1]}, ${(edge.from[0] + edge.to[0]) / 2} ${edge.to[1]}, ${edge.to[0]} ${edge.to[1]}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={0.5}
          markerEnd="url(#edge-arrow)"
        />
      ))}
    </svg>
  );
}

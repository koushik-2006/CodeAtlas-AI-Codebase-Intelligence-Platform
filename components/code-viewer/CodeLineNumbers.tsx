"use client";

interface CodeLineNumbersProps {
  totalLines: number;
  highlightedLine?: number;
  onLineClick?: (lineNumber: number) => void;
}

export function CodeLineNumbers({
  totalLines,
  highlightedLine,
  onLineClick,
}: CodeLineNumbersProps) {
  const lineArray = Array.from({ length: totalLines }, (_, i) => i + 1);

  return (
    <div className="select-none py-3 px-3 text-right font-mono text-xs text-[var(--text-secondary)]/50 border-r border-[var(--border-color)]">
      {lineArray.map((line) => (
        <div
          key={line}
          onClick={() => onLineClick && onLineClick(line)}
          className={`leading-6 cursor-pointer hover:text-[var(--primary)] transition-colors ${
            highlightedLine === line ? "text-[var(--primary)] font-bold" : ""
          }`}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

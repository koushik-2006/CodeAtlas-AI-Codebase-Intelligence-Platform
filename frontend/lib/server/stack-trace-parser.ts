import { db } from "./db";
import {
  ParsedStackFrame,
  ParsedStackTrace,
  StackTraceRuntime,
} from "@/types/debug";

export interface ParseOptions {
  repositoryId?: string;
  revision?: string;
}

/**
 * Multi-format stack trace parser supporting Node.js/V8, Python, Go, Java, Rust, Ruby, and generic formats.
 * Resolves frame locations against indexed repository files and validates line number bounds.
 */
export function parseStackTrace(
  rawInput: string,
  options?: ParseOptions
): ParsedStackTrace {
  const text = (rawInput || "").trim();
  if (!text) {
    return {
      raw: "",
      runtime: "generic",
      errorType: "UnknownError",
      errorMessage: "No stack trace provided",
      frames: [],
      totalFrames: 0,
      verifiedFramesCount: 0,
      unresolvedFramesCount: 0,
    };
  }

  const lines = text.split(/\r?\n/);
  const runtime = detectRuntime(lines, text);
  const { errorType, errorMessage } = extractErrorTypeAndMessage(lines, runtime);
  const frames = extractFrames(lines, runtime);

  // If repository provided, resolve frames against repository files
  let verifiedCount = 0;
  let unresolvedCount = 0;

  const repoFiles = options?.repositoryId
    ? db.getRepositoryFiles(options.repositoryId)
    : [];
  const repoSymbols = options?.repositoryId
    ? db.getCodeSymbols(options.repositoryId)
    : [];

  const resolvedFrames: ParsedStackFrame[] = frames.map((frame, index) => {
    frame.order = index + 1;

    // Check if frame is external library / runtime frame
    if (checkIsExternal(frame.filePath, frame.functionName, runtime)) {
      frame.isExternal = true;
      frame.isVerified = false;
      frame.unresolvedReason = "External package or runtime frame (not in repository source)";
      unresolvedCount++;
      return frame;
    }

    if (!options?.repositoryId || repoFiles.length === 0) {
      // Standalone mode: cannot verify against repo files
      frame.isVerified = false;
      frame.unresolvedReason = options?.repositoryId
        ? "Repository has no indexed files"
        : "Standalone investigation (no repository connected)";
      unresolvedCount++;
      return frame;
    }

    // Match file path against repository
    const matchedFile = findMatchingRepoFile(frame.filePath, repoFiles);
    if (!matchedFile) {
      frame.isVerified = false;
      frame.unresolvedReason = `File '${frame.filePath}' not found in indexed repository`;
      unresolvedCount++;
      return frame;
    }

    frame.normalizedPath = matchedFile.path;

    // Validate line bounds
    if (frame.line !== undefined) {
      if (frame.line < 1 || frame.line > matchedFile.lineCount) {
        frame.isVerified = false;
        frame.unresolvedReason = `Line ${frame.line} is outside source bounds (1-${matchedFile.lineCount}) for '${matchedFile.path}'`;
        unresolvedCount++;
        return frame;
      }

      // Valid line inside source!
      frame.isVerified = true;
      verifiedCount++;

      // Extract snippet
      const fileLines = matchedFile.content.split(/\r?\n/);
      const targetLine = frame.line;
      const startIdx = Math.max(0, targetLine - 3);
      const endIdx = Math.min(fileLines.length, targetLine + 2);

      frame.sourceSnippet = {
        startLine: startIdx + 1,
        endLine: endIdx,
        focusLine: targetLine,
        lines: fileLines.slice(startIdx, endIdx).map((content, idx) => ({
          lineNumber: startIdx + idx + 1,
          content,
          isHighlighted: startIdx + idx + 1 === targetLine,
        })),
      };

      // Match symbol if available
      const symbolMatch = repoSymbols.find(
        (s) =>
          s.filePath === matchedFile.path &&
          targetLine >= s.startLine &&
          targetLine <= s.endLine
      );
      if (symbolMatch) {
        frame.symbolName = symbolMatch.name;
        if (!frame.functionName || frame.functionName === "<anonymous>") {
          frame.functionName = symbolMatch.name;
        }
      }
    } else {
      frame.isVerified = false;
      frame.unresolvedReason = "Missing line number in frame";
      unresolvedCount++;
    }

    return frame;
  });

  // Check revision mismatch if options provided
  let hasRevisionMismatchWarning = false;
  let revisionWarningMessage: string | undefined;

  if (options?.repositoryId && options.revision) {
    const repo = db.getRepository(options.repositoryId);
    if (repo) {
      const indexedRevision = repo.lastAnalyzed;
      if (indexedRevision && indexedRevision !== options.revision) {
        hasRevisionMismatchWarning = true;
        revisionWarningMessage = `Stack trace captured from revision '${options.revision}', but indexed codebase was analyzed at '${indexedRevision}'. Line numbers and symbols may differ.`;
      }
    }
  }

  return {
    raw: rawInput,
    runtime,
    errorType,
    errorMessage,
    frames: resolvedFrames,
    totalFrames: resolvedFrames.length,
    verifiedFramesCount: verifiedCount,
    unresolvedFramesCount: unresolvedCount,
    hasRevisionMismatchWarning,
    revisionWarningMessage,
  };
}

/**
 * Detect runtime from stack trace structure.
 */
function detectRuntime(lines: string[], fullText: string): StackTraceRuntime {
  if (
    fullText.includes("Traceback (most recent call last):") ||
    lines.some((l) => /^\s*File ".*?", line \d+/.test(l))
  ) {
    return "python";
  }

  if (
    fullText.includes("panic: runtime error:") ||
    fullText.includes("[signal SIG") ||
    lines.some((l) => /\.go:\d+(?: \+0x[0-9a-f]+)?$/.test(l.trim()))
  ) {
    return "go";
  }

  if (
    lines.some((l) => /^\s*at\s+([a-zA-Z0-9_$]+\.)+[a-zA-Z0-9_$]+\(.*\.java:\d+\)/.test(l)) ||
    lines.some((l) => /^[a-zA-Z0-9_$.]+Exception:/.test(l))
  ) {
    return "java";
  }

  if (
    fullText.includes("thread 'main' panicked at") ||
    fullText.includes("stack backtrace:") ||
    lines.some((l) => /\.rs:\d+:\d+/.test(l))
  ) {
    return "rust";
  }

  if (
    lines.some((l) => /:\d+:in `[^']+'/.test(l)) ||
    lines.some((l) => /from .+\.rb:\d+:in /.test(l))
  ) {
    return "ruby";
  }

  if (
    lines.some((l) => /^\s*at\s+(?:async\s+)?(.+?)\s*\((.+?):(\d+):(\d+)\)/.test(l)) ||
    lines.some((l) => /^\s*at\s+(.+?):(\d+):(\d+)/.test(l)) ||
    lines.some((l) => /^(?:TypeError|ReferenceError|SyntaxError|RangeError|URIError|Error):/.test(l))
  ) {
    return "nodejs";
  }

  return "generic";
}

/**
 * Extract error type and error message.
 */
function extractErrorTypeAndMessage(
  lines: string[],
  runtime: StackTraceRuntime
): { errorType: string; errorMessage: string } {
  if (runtime === "python") {
    // In Python, the exception is usually the last non-empty line
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      const match = line.match(/^([a-zA-Z0-9_]+Error|[a-zA-Z0-9_]+Exception|Exception):\s*(.*)$/);
      if (match) {
        return { errorType: match[1], errorMessage: match[2] || "" };
      }
    }
  }

  if (runtime === "go") {
    const panicLine = lines.find((l) => l.startsWith("panic:"));
    if (panicLine) {
      const parts = panicLine.substring(6).trim();
      const splitIdx = parts.indexOf(":");
      if (splitIdx > 0) {
        return {
          errorType: parts.slice(0, splitIdx).trim(),
          errorMessage: parts.slice(splitIdx + 1).trim(),
        };
      }
      return { errorType: "panic", errorMessage: parts };
    }
  }

  // Node.js / Java / General format: first line matching "ErrorType: message"
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([a-zA-Z0-9_$.]+(?:Error|Exception|Panic|Failure))(?::\s*(.*))?$/);
    if (match) {
      return {
        errorType: match[1],
        errorMessage: match[2] || "",
      };
    }
  }

  // Fallback: take first non-frame line
  const firstLine = lines[0]?.trim() || "UnknownError";
  const colonIdx = firstLine.indexOf(":");
  if (colonIdx > 0 && colonIdx < 50) {
    return {
      errorType: firstLine.slice(0, colonIdx).trim(),
      errorMessage: firstLine.slice(colonIdx + 1).trim(),
    };
  }

  return {
    errorType: "RuntimeError",
    errorMessage: firstLine,
  };
}

/**
 * Extract stack frames per runtime.
 */
function extractFrames(lines: string[], runtime: StackTraceRuntime): ParsedStackFrame[] {
  const frames: ParsedStackFrame[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Node.js / V8 frames
    // "    at functionName (path/to/file.ts:12:34)"
    // "    at path/to/file.ts:12:34"
    const nodeParenMatch = line.match(/^\s*at\s+(?:async\s+)?(.+?)\s*\((?:file:\/\/)?(.+?):(\d+):(\d+)\)$/);
    if (nodeParenMatch) {
      frames.push({
        id: `frame_${frames.length + 1}`,
        order: frames.length + 1,
        raw: line,
        functionName: nodeParenMatch[1].trim(),
        filePath: nodeParenMatch[2].trim(),
        line: parseInt(nodeParenMatch[3], 10),
        column: parseInt(nodeParenMatch[4], 10),
        isExternal: false,
        isVerified: false,
      });
      continue;
    }

    const nodeDirectMatch = line.match(/^\s*at\s+(?:file:\/\/)?(.+?):(\d+):(\d+)$/);
    if (nodeDirectMatch) {
      frames.push({
        id: `frame_${frames.length + 1}`,
        order: frames.length + 1,
        raw: line,
        functionName: "<anonymous>",
        filePath: nodeDirectMatch[1].trim(),
        line: parseInt(nodeDirectMatch[2], 10),
        column: parseInt(nodeDirectMatch[3], 10),
        isExternal: false,
        isVerified: false,
      });
      continue;
    }

    // Python frames
    // File "/path/to/file.py", line 42, in my_func
    const pyMatch = line.match(/^File\s+"(.+?)",\s+line\s+(\d+)(?:,\s+in\s+(.+))?/);
    if (pyMatch) {
      frames.push({
        id: `frame_${frames.length + 1}`,
        order: frames.length + 1,
        raw: line,
        functionName: pyMatch[3] ? pyMatch[3].trim() : "<module>",
        filePath: pyMatch[1].trim(),
        line: parseInt(pyMatch[2], 10),
        isExternal: false,
        isVerified: false,
      });
      continue;
    }

    // Java frames
    // at com.example.MyClass.myMethod(MyClass.java:42)
    const javaMatch = line.match(/^\s*at\s+([a-zA-Z0-9_$.]+)\.([a-zA-Z0-9_$]+)\((.+?):(\d+)\)/);
    if (javaMatch) {
      frames.push({
        id: `frame_${frames.length + 1}`,
        order: frames.length + 1,
        raw: line,
        functionName: `${javaMatch[1]}.${javaMatch[2]}`,
        filePath: javaMatch[3].trim(),
        line: parseInt(javaMatch[4], 10),
        isExternal: false,
        isVerified: false,
      });
      continue;
    }

    // Go frames
    // /path/to/file.go:42 +0x123
    const goMatch = line.match(/^(.+?\.go):(\d+)(?:\s+\+0x[0-9a-fA-F]+)?$/);
    if (goMatch) {
      // Previous line often has the function name in Go
      const prevLine = i > 0 ? lines[i - 1].trim() : "";
      const funcName = prevLine.replace(/\(.*?\)$/, "").trim() || "<anonymous>";
      frames.push({
        id: `frame_${frames.length + 1}`,
        order: frames.length + 1,
        raw: line,
        functionName: funcName,
        filePath: goMatch[1].trim(),
        line: parseInt(goMatch[2], 10),
        isExternal: false,
        isVerified: false,
      });
      continue;
    }

    // Rust / Ruby / Generic
    const genericMatch = line.match(/(?:at\s+|from\s+)?([a-zA-Z0-9_\-\.\/\\ ]+\.[a-zA-Z0-9]+):(\d+)(?::(\d+))?/);
    if (genericMatch && !line.startsWith("http://") && !line.startsWith("https://")) {
      const funcMatch = line.match(/in\s+[`']?([a-zA-Z0-9_.:]+)['`]?/);
      frames.push({
        id: `frame_${frames.length + 1}`,
        order: frames.length + 1,
        raw: line,
        functionName: funcMatch ? funcMatch[1] : "<anonymous>",
        filePath: genericMatch[1].trim(),
        line: parseInt(genericMatch[2], 10),
        column: genericMatch[3] ? parseInt(genericMatch[3], 10) : undefined,
        isExternal: false,
        isVerified: false,
      });
    }
  }

  return frames;
}

/**
 * Check if a file or function path belongs to external node_modules or system runtimes.
 */
function checkIsExternal(filePath: string, functionName: string, runtime: StackTraceRuntime): boolean {
  const norm = filePath.replace(/\\/g, "/").toLowerCase();

  if (
    norm.includes("node_modules/") ||
    norm.includes("webpack-internal:") ||
    norm.includes("<anonymous>") ||
    norm.includes("[native code]") ||
    norm.includes("site-packages/") ||
    norm.includes("dist-packages/") ||
    norm.includes("/usr/lib/") ||
    norm.includes("/usr/local/lib/") ||
    norm.includes("/lib/python") ||
    norm.startsWith("internal/") ||
    norm.startsWith("node:")
  ) {
    return true;
  }

  if (runtime === "java") {
    if (
      functionName.startsWith("java.") ||
      functionName.startsWith("javax.") ||
      functionName.startsWith("sun.") ||
      functionName.startsWith("org.springframework.") ||
      functionName.startsWith("org.junit.")
    ) {
      return true;
    }
  }

  if (runtime === "rust") {
    if (
      functionName.startsWith("core::") ||
      functionName.startsWith("std::") ||
      functionName.startsWith("alloc::")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Matches a stack frame filePath against indexed repository files.
 * Handles absolute system paths, relative paths, leading slashes, and Windows path delimiters.
 */
function findMatchingRepoFile(
  framePath: string,
  repoFiles: { path: string; lineCount: number; content: string }[]
): { path: string; lineCount: number; content: string } | null {
  const normalizedFrame = framePath.replace(/\\/g, "/").replace(/^\/+/, "");

  // 1. Exact match
  const exact = repoFiles.find(
    (f) => f.path === normalizedFrame || f.path === framePath
  );
  if (exact) return exact;

  // 2. Suffix match (e.g. /var/www/app/src/services/auth.ts -> src/services/auth.ts)
  const suffixMatch = repoFiles.find((f) => {
    const fNorm = f.path.replace(/\\/g, "/");
    return normalizedFrame.endsWith(`/${fNorm}`) || normalizedFrame === fNorm;
  });
  if (suffixMatch) return suffixMatch;

  // 3. Basename match if unique
  const baseName = normalizedFrame.split("/").pop();
  if (baseName) {
    const matches = repoFiles.filter(
      (f) => f.path.split("/").pop() === baseName
    );
    if (matches.length === 1) {
      return matches[0];
    }
  }

  return null;
}

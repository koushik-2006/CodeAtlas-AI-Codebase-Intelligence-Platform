"use client";

import React, { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  useEffect(() => {
    // Focus first empty input or last input on mount
    const firstEmptyIndex = digits.findIndex((d) => !d);
    const targetIndex = firstEmptyIndex === -1 ? 5 : firstEmptyIndex;
    inputRefs.current[targetIndex]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, ""); // digits only

    if (!char) {
      // Clear current digit
      const nextValue =
        value.substring(0, index) + " " + value.substring(index + 1);
      onChange(nextValue.trimEnd());
      return;
    }

    // Take the last character typed
    const singleDigit = char.slice(-1);
    const chars = value.split("");
    chars[index] = singleDigit;
    const newValue = chars.join("").slice(0, 6);
    onChange(newValue);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValue.length === 6 && onComplete) {
      onComplete(newValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        inputRefs.current[index - 1]?.focus();
        const chars = value.split("");
        chars[index - 1] = "";
        onChange(chars.join("").trimEnd());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    onChange(pasteData);

    const targetFocus = Math.min(pasteData.length, 5);
    inputRefs.current[targetFocus]?.focus();

    if (pasteData.length === 6 && onComplete) {
      onComplete(pasteData);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 my-4">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          aria-label={`Verification code digit ${index + 1} of 6`}
          className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-mono font-bold rounded-2xl border transition-all duration-200 outline-none ${
            hasError
              ? "border-red-500 bg-red-500/10 text-red-500 focus:ring-2 focus:ring-red-500/40"
              : digit
              ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]/40"
              : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)]/50 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/40"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-text"}`}
        />
      ))}
    </div>
  );
}

"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import City from "@/components/City";
import { motion, AnimatePresence } from "framer-motion";

export function CodeCityIllustration({ className = "" }: { className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <figure className={`relative ${className}`}>
      <div className="overflow-hidden rounded-3xl p-3 border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-soft">
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="dark-graph"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <City className="w-full" forceMode="dark" />
            </motion.div>
          ) : (
            <motion.div
              key="light-city"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <City className="w-full" forceMode="light" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <figcaption className="mt-3 text-center font-mono text-xs text-[var(--text-secondary)]">
        {isDark
          ? "Illustrative route. Real graphs come from your repository."
          : "Illustrative city. Yours is generated from your repository."}
      </figcaption>
    </figure>
  );
}

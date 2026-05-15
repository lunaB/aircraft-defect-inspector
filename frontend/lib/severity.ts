import type { Severity } from "./types";

// Single source of truth for severity visual tokens.
// HIGH → red-500, MEDIUM → amber-500, LOW → emerald-500.
export const SEVERITY_RGB: Record<Severity, string> = {
  HIGH: "rgb(239 68 68)", // red-500
  MEDIUM: "rgb(245 158 11)", // amber-500
  LOW: "rgb(16 185 129)", // emerald-500
};

export const SEVERITY_HEX: Record<Severity, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
};

export function severityColor(s: Severity): string {
  return SEVERITY_RGB[s];
}

export function severityBgClass(s: Severity): string {
  switch (s) {
    case "HIGH":
      return "bg-red-500/15 text-red-300 border-red-500/40";
    case "MEDIUM":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "LOW":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  }
}

export function severityLabel(s: Severity): string {
  return s;
}

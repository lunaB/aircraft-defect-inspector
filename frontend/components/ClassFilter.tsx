"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getClassGloss } from "@/lib/class-glossary";

interface ClassFilterProps {
  classes: string[];
  enabled: Set<string>;
  onToggle: (cls: string) => void;
}

export function ClassFilter({ classes, enabled, onToggle }: ClassFilterProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (classes.length === 0) {
    return <div className="text-xs text-zinc-600">No detections yet.</div>;
  }
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        Classes
      </div>
      <div className="flex flex-wrap gap-1">
        {classes.map((c) => {
          const active = enabled.has(c);
          const gloss = getClassGloss(c);
          return (
            <div
              key={c}
              className="relative"
              onMouseEnter={() => setHovered(c)}
              onMouseLeave={() => setHovered((h) => (h === c ? null : h))}
            >
              <button
                onClick={() => onToggle(c)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                  active
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                    : "border-zinc-700 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300",
                )}
                aria-describedby={gloss ? `cls-tip-${c}` : undefined}
              >
                {c}
              </button>
              {gloss && hovered === c && (
                <div
                  id={`cls-tip-${c}`}
                  role="tooltip"
                  className="absolute left-0 top-full z-40 mt-1.5 w-56 rounded-md border border-zinc-800 bg-zinc-950 p-2 text-[10px] leading-relaxed text-zinc-300 shadow-xl"
                >
                  <div className="font-medium text-zinc-100">{gloss.short}</div>
                  <div className="mt-1 text-zinc-500">
                    Typical severity:{" "}
                    <span className="font-mono text-zinc-300">
                      {gloss.severity_typical}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

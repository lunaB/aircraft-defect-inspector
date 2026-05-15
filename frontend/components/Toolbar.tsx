"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getClassGloss } from "@/lib/class-glossary";

interface ToolbarProps {
  onUploadClick: () => void;
  uploadDisabled?: boolean;
  confidence: number;
  onConfidenceChange: (v: number) => void;
  iou: number;
  onIouChange: (v: number) => void;
  classes: string[];
  enabledClasses: Set<string>;
  onToggleClass: (cls: string) => void;
  showLabels: boolean;
  onShowLabelsChange: (v: boolean) => void;
}

export function Toolbar({
  onUploadClick,
  uploadDisabled,
  confidence,
  onConfidenceChange,
  iou,
  onIouChange,
  classes,
  enabledClasses,
  onToggleClass,
  showLabels,
  onShowLabelsChange,
}: ToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
      {/* Upload pill */}
      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploadDisabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition",
          uploadDisabled
            ? "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
            : "border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-200",
        )}
      >
        <Upload className="h-3 w-3" />
        <span>Upload</span>
      </button>

      <Separator />

      {/* Confidence slider */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Confidence
        </span>
        <span className="w-9 font-mono text-[11px] text-zinc-200">
          {confidence.toFixed(2)}
        </span>
        <div className="w-32">
          <Slider
            value={[Math.round(confidence * 100)]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              if (typeof n === "number") onConfidenceChange(n / 100);
            }}
          />
        </div>
      </div>

      <Separator />

      {/* IoU slider (NMS) */}
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="text-[10px] font-medium uppercase tracking-wide text-zinc-500"
          title="Non-maximum suppression IoU threshold — higher = keep more overlapping boxes"
        >
          IoU
        </span>
        <span className="w-9 font-mono text-[11px] text-zinc-200">
          {iou.toFixed(2)}
        </span>
        <div className="w-32">
          <Slider
            value={[Math.round(iou * 20)]}
            min={0}
            max={20}
            step={1}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              if (typeof n === "number") onIouChange(n / 20);
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Class filter chips */}
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Classes
        </span>
        {classes.length === 0 ? (
          <span className="text-[10px] text-zinc-600">No detections yet.</span>
        ) : (
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {classes.map((c) => {
              const active = enabledClasses.has(c);
              const gloss = getClassGloss(c);
              return (
                <div
                  key={c}
                  className="relative"
                  onMouseEnter={() => setHovered(c)}
                  onMouseLeave={() => setHovered((h) => (h === c ? null : h))}
                >
                  <button
                    type="button"
                    onClick={() => onToggleClass(c)}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] transition-colors",
                      active
                        ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200"
                        : "border-zinc-700 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300",
                    )}
                    aria-describedby={gloss ? `tb-cls-tip-${c}` : undefined}
                  >
                    {c}
                  </button>
                  {gloss && hovered === c && (
                    <div
                      id={`tb-cls-tip-${c}`}
                      role="tooltip"
                      className="absolute left-0 top-full z-40 mt-1.5 w-56 rounded-md border border-zinc-800 bg-zinc-950 p-2 text-[10px] leading-relaxed text-zinc-300 shadow-xl"
                    >
                      <div className="font-medium text-zinc-100">
                        {gloss.short}
                      </div>
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
        )}
      </div>

      <Separator />

      {/* Labels toggle (far right) */}
      <button
        type="button"
        onClick={() => onShowLabelsChange(!showLabels)}
        aria-pressed={showLabels}
        title="Toggle bbox class and confidence labels"
        className={cn(
          "shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition",
          showLabels
            ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
            : "border-zinc-700 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300",
        )}
      >
        Labels {showLabels ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      className="h-5 w-px shrink-0 bg-zinc-800"
    />
  );
}

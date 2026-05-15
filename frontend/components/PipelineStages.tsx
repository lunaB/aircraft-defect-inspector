"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StageState = "idle" | "active" | "done" | "error";

interface PipelineStagesProps {
  yolo: StageState;
  llm: StageState;
  mel: StageState;
}

interface StageMeta {
  tier: 1 | 2 | 3;
  title: string;
  subtitle: string;
  micro: string;
}

const STAGES: StageMeta[] = [
  {
    tier: 1,
    title: "YOLO Detection",
    subtitle: "Low-level patterns (bbox)",
    micro: "UTS Aircraft / 3 classes",
  },
  {
    tier: 2,
    title: "Vision-LLM",
    subtitle: "Semantic interpretation (ATA / cause / severity)",
    micro: "gpt-4o / ATA 51-57",
  },
  {
    tier: 3,
    title: "MEL Matching",
    subtitle: "Regulatory matching (MEL)",
    micro: "Deferral cat. A-D",
  },
];

function cardCls(s: StageState): string {
  switch (s) {
    case "active":
      return "border-emerald-500/60 bg-emerald-500/[0.06] text-emerald-100 ring-1 ring-emerald-500/30 shadow-[0_0_28px_-8px_rgba(16,185,129,0.55)] stage-active-ring";
    case "done":
      return "border-emerald-500/40 bg-emerald-500/[0.04] text-emerald-100/90";
    case "error":
      return "border-red-500/50 bg-red-500/10 text-red-200";
    default:
      return "border-zinc-800 bg-zinc-900/40 text-zinc-500";
  }
}

function badgeCls(s: StageState): string {
  switch (s) {
    case "active":
      return "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
    case "done":
      return "border-emerald-500/60 bg-emerald-500 text-zinc-950";
    case "error":
      return "border-red-500/60 bg-red-500/10 text-red-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-500";
  }
}

function Stage({ meta, state }: { meta: StageMeta; state: StageState }) {
  return (
    <div
      className={cn(
        "relative w-[200px] shrink-0 overflow-hidden rounded-lg border px-3 py-2.5 transition-all duration-300",
        cardCls(state),
        state === "active" && "stage-shimmer",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-medium transition",
            badgeCls(state),
          )}
        >
          {state === "done" ? <Check className="h-3 w-3" /> : `T${meta.tier}`}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-semibold uppercase tracking-wide">
            {meta.title}
          </div>
          <div
            className={cn(
              "truncate text-[10px] leading-snug",
              state === "idle" ? "text-zinc-600" : "opacity-80",
            )}
            title={meta.subtitle}
          >
            {meta.subtitle}
          </div>
          <div
            className={cn(
              "mt-1 truncate font-mono text-[9px] uppercase tracking-wider",
              state === "idle" ? "text-zinc-700" : "text-zinc-500",
            )}
          >
            {meta.micro}
          </div>
        </div>
      </div>
    </div>
  );
}

function Arrow({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 40 12"
      className="h-3 w-10 shrink-0"
      aria-hidden
    >
      <line
        x1="0"
        y1="6"
        x2="32"
        y2="6"
        stroke="rgb(63 63 70)"
        strokeWidth="1.5"
      />
      <line
        x1="0"
        y1="6"
        x2="32"
        y2="6"
        stroke="rgb(16 185 129)"
        strokeWidth="1.5"
        strokeDasharray="32"
        strokeDashoffset={filled ? 0 : 32}
        style={{ transition: "stroke-dashoffset 600ms ease-out" }}
      />
      <polyline
        points="28,2 34,6 28,10"
        fill="none"
        stroke={filled ? "rgb(16 185 129)" : "rgb(63 63 70)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: "stroke 300ms ease" }}
      />
    </svg>
  );
}

export function PipelineStages({ yolo, llm, mel }: PipelineStagesProps) {
  const states: StageState[] = [yolo, llm, mel];
  // Arrow N (between stage N and N+1) fills when stage N is done.
  const arrow1Filled = yolo === "done";
  const arrow2Filled = llm === "done";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Stage meta={STAGES[0]} state={states[0]} />
      <Arrow filled={arrow1Filled} />
      <Stage meta={STAGES[1]} state={states[1]} />
      <Arrow filled={arrow2Filled} />
      <Stage meta={STAGES[2]} state={states[2]} />
    </div>
  );
}

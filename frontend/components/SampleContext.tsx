"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { getSampleContextBySrc } from "@/lib/sample-context";

interface SampleContextProps {
  activeSampleSrc: string | null;
}

export function SampleContext({ activeSampleSrc }: SampleContextProps) {
  const ctx = getSampleContextBySrc(activeSampleSrc);
  const [expanded, setExpanded] = useState(false);
  if (!ctx) return null;

  return (
    <div className="rounded-md border border-emerald-500/20 bg-zinc-900/40 p-2 ring-1 ring-emerald-500/10">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-1 py-px font-mono text-[8px] uppercase tracking-wider text-emerald-300">
          Sample
        </span>
        <span className="font-mono text-[9px] text-zinc-500">{ctx.id}</span>
      </div>
      <div className="text-[11px] font-semibold leading-tight text-zinc-100">
        {ctx.title}
      </div>
      <p className="mt-1 text-[10px] leading-snug text-zinc-400">
        {ctx.one_liner}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-1 text-[9px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
        aria-expanded={expanded}
      >
        {expanded ? "Hide pattern …" : "Show pattern …"}
      </button>
      {expanded && (
        <div className="mt-1.5 flex items-start gap-1.5 rounded border border-zinc-800 bg-zinc-950/60 p-1.5">
          <Eye className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
          <div>
            <div className="text-[8px] font-medium uppercase tracking-wider text-zinc-500">
              Pattern to watch
            </div>
            <div className="mt-0.5 text-[10px] leading-snug text-zinc-300">
              {ctx.pattern_to_watch}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

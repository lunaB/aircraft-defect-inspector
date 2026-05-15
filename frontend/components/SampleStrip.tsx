"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSampleContextBySrc } from "@/lib/sample-context";

interface SampleStripProps {
  onSelect: (file: File, src: string) => void;
  disabled?: boolean;
  activeSampleSrc: string | null;
}

export interface SampleStripHandle {
  trigger: (index: number) => void;
}

const SAMPLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
  src: `/samples/sample-${i}.jpg`,
  label: `Sample ${i}`,
  shortcut: i === 10 ? "0" : String(i),
}));

async function urlToFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`failed to load ${url}`);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export const SampleStrip = forwardRef<SampleStripHandle, SampleStripProps>(
  function SampleStrip({ onSelect, disabled, activeSampleSrc }, ref) {
    const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useImperativeHandle(ref, () => ({
      trigger: (index: number) => {
        btnRefs.current[index]?.click();
      },
    }));

    const ctx = getSampleContextBySrc(activeSampleSrc);

    return (
      <div className="flex h-24 shrink-0 items-stretch gap-3 border-t border-zinc-800 px-4 py-2">
        {/* Thumb row */}
        <div className="flex items-center gap-1.5">
          {SAMPLES.map((s, i) => {
            const active = activeSampleSrc === s.src;
            return (
              <button
                key={s.src}
                ref={(el) => {
                  btnRefs.current[i] = el;
                }}
                disabled={disabled}
                onClick={async () => {
                  try {
                    const file = await urlToFile(s.src, `${s.label}.jpg`);
                    onSelect(file, s.src);
                  } catch {
                    alert(
                      `Could not load ${s.label}. Place an image under public/samples/.`,
                    );
                  }
                }}
                title={s.label}
                className={cn(
                  "group relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border bg-zinc-900 text-[9px] text-zinc-500 transition",
                  active
                    ? "border-emerald-500/60 ring-1 ring-emerald-500/40"
                    : "border-zinc-800 hover:border-emerald-500/60 hover:text-zinc-200",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt={s.label}
                  className="h-full w-full object-cover opacity-80 group-hover:opacity-100"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-[1px] text-center font-mono text-[9px] text-zinc-300">
                  {s.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {/* Context / hint */}
        <div className="flex min-w-0 flex-1 items-center">
          {ctx ? (
            <CompactContext
              id={ctx.id}
              title={ctx.title}
              oneLiner={ctx.one_liner}
              pattern={ctx.pattern_to_watch}
            />
          ) : (
            <div className="text-[11px] text-zinc-500">
              Drop or pick a sample.{" "}
              <span className="text-zinc-600">
                Press{" "}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-400">
                  1
                </kbd>
                –
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-400">
                  9
                </kbd>
                ,{" "}
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-400">
                  0
                </kbd>{" "}
                for samples.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

interface CompactContextProps {
  id: string;
  title: string;
  oneLiner: string;
  pattern: string;
}

function CompactContext({
  id,
  title,
  oneLiner,
  pattern,
}: CompactContextProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2 rounded-md border border-emerald-500/20 bg-zinc-900/40 px-2 py-1.5 ring-1 ring-emerald-500/10">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-1 py-px font-mono text-[8px] uppercase tracking-wider text-emerald-300">
            Sample
          </span>
          <span className="shrink-0 font-mono text-[9px] text-zinc-500">
            {id}
          </span>
          <span className="truncate text-[11px] font-semibold text-zinc-100">
            {title}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] leading-snug text-zinc-400">
          {oneLiner}
        </p>
        {expanded && (
          <div className="mt-1 flex items-start gap-1.5 rounded border border-zinc-800 bg-zinc-950/60 p-1.5">
            <Eye className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <div className="text-[8px] font-medium uppercase tracking-wider text-zinc-500">
                Pattern to watch
              </div>
              <div className="mt-0.5 text-[10px] leading-snug text-zinc-300">
                {pattern}
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="shrink-0 text-[9px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
        aria-expanded={expanded}
      >
        {expanded ? "Hide" : "Show pattern"}
      </button>
    </div>
  );
}

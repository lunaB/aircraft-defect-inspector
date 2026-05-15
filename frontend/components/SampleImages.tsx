"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

interface SampleImagesProps {
  onSelect: (file: File, src: string) => void;
  disabled?: boolean;
}

export interface SampleImagesHandle {
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

export const SampleImages = forwardRef<SampleImagesHandle, SampleImagesProps>(
  function SampleImages({ onSelect, disabled }, ref) {
    const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useImperativeHandle(ref, () => ({
      trigger: (index: number) => {
        const btn = btnRefs.current[index];
        btn?.click();
      },
    }));

    return (
      <div>
        <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Samples
        </div>
        <div className="grid grid-cols-5 gap-1">
          {SAMPLES.map((s, i) => (
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
                "group relative aspect-square overflow-hidden rounded-sm border border-zinc-800 bg-zinc-900 text-[9px] text-zinc-500 transition",
                "hover:border-emerald-500/60 hover:text-zinc-200",
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
          ))}
        </div>
      </div>
    );
  },
);

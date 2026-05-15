"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

const METRICS = [
  { key: "mAP50", value: "0.446" },
  { key: "mAP50-95", value: "0.294" },
  { key: "Precision", value: "0.804" },
  { key: "Recall", value: "0.422" },
];

export function ModelCard() {
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 transition hover:text-emerald-300"
        aria-label="Model and dataset info"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[360px] rounded-md border border-zinc-800 bg-zinc-950 p-3 text-left shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-zinc-100">
              Model & Dataset
            </div>
            <span className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
              v3
            </span>
          </div>

          <Block title="Model">
            <Row k="Architecture" v="yolov8n fine-tuned" />
            <Row k="Input size" v="640 × 640" />
            <Row k="Classes" v="Dent · Fastener Damage · Rupture" />
            <Row k="Weights" v="~24 MB" />
            <Row k="Training device" v="Apple M4 Pro / MPS" />
          </Block>

          <Block title="Dataset">
            <Row
              k="Source"
              v="UTS Aircraft Defect Detection v3 (Roboflow Universe)"
            />
            <Row k="Splits" v="5,855 train · 598 val · 350 test" />
            <Row k="License" v="Public Domain" />
            <Row
              k="URL"
              v={
                <a
                  href="https://universe.roboflow.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-emerald-300 underline-offset-2 hover:underline"
                >
                  universe.roboflow.com
                </a>
              }
            />
          </Block>

          <Block title="Performance">
            <dl className="grid grid-cols-4 gap-2">
              {METRICS.map((m) => (
                <div
                  key={m.key}
                  className="rounded border border-zinc-800 bg-zinc-900/60 p-2"
                >
                  <dt className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    {m.key}
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] text-zinc-200">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-1.5 text-[9px] text-zinc-500">
              Trained 2026-05-14 · 20 epochs · M4 Pro MPS (best @ epoch 18)
            </div>
          </Block>
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-2.5 last:mb-0">
      <div className="mb-1 text-[9px] font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      <div className="rounded border border-zinc-800 bg-zinc-900/40 p-2">
        {children}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-0.5 text-[11px]">
      <dt className="font-mono text-[10px] text-zinc-500">{k}</dt>
      <dd className="break-words text-zinc-300">{v}</dd>
    </div>
  );
}

"use client";

// Empty-state hero for the center canvas pane.
// Three-tier pattern-recognition visual that mirrors the pipeline stages.

export function HeroIntro() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-8">
      {/* Subtle grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(82 82 91) 1px, transparent 1px), linear-gradient(to bottom, rgb(82 82 91) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400">
            Aircraft Damage & Defect Inspection Assistant
          </span>
        </div>

        <div className="flex w-full flex-col items-stretch gap-0">
          {/* Tier 1 */}
          <TierRow
            tier={1}
            title="Detection"
            meta="yolo bounding boxes"
            accent
          >
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <BBoxIcon key={i} delay={i * 120} />
              ))}
            </div>
          </TierRow>

          <Connector />

          {/* Tier 2 */}
          <TierRow
            tier={2}
            title="Interpretation"
            meta="ata · cause · severity"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                ATA 53-10
              </span>
              <span className="text-[10px] text-zinc-400">
                Fuselage / Skin
              </span>
            </div>
          </TierRow>

          <Connector />

          {/* Tier 3 */}
          <TierRow
            tier={3}
            title="Compliance"
            meta="mel deferral category"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                MEDIUM
              </span>
              <span className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                MEL Match
              </span>
            </div>
          </TierRow>
        </div>

        <div className="mt-2 text-center text-[11px] leading-relaxed text-zinc-500">
          Upload an image, or pick a sample.
          <br />
          <span className="text-zinc-600">
            Press <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] text-zinc-400">?</kbd>{" "}
            for keyboard shortcuts.
          </span>
        </div>
      </div>
    </div>
  );
}

interface TierRowProps {
  tier: number;
  title: string;
  meta: string;
  accent?: boolean;
  children: React.ReactNode;
}

function TierRow({ tier, title, meta, accent, children }: TierRowProps) {
  return (
    <div
      className={
        "flex items-center gap-4 rounded-md border bg-zinc-900/40 px-3 py-2.5 transition " +
        (accent
          ? "border-emerald-500/30 shadow-[0_0_24px_-8px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/20"
          : "border-zinc-800")
      }
    >
      <div
        className={
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] " +
          (accent
            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-400")
        }
      >
        {String(tier).padStart(2, "0")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold text-zinc-200">{title}</div>
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
          {meta}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Connector() {
  return (
    <div
      aria-hidden
      className="ml-4 flex h-5 w-8 items-end justify-center"
    >
      <svg viewBox="0 0 8 20" className="h-full w-2 text-zinc-700">
        <line
          x1="4"
          y1="0"
          x2="4"
          y2="16"
          stroke="currentColor"
          strokeWidth="1"
        />
        <polyline
          points="1,14 4,18 7,14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function BBoxIcon({ delay }: { delay: number }) {
  return (
    <span
      className="block h-3.5 w-5 rounded-[1px] border border-emerald-400/60"
      style={{
        animation: "heroBboxPulse 2.4s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

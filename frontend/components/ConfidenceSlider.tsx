"use client";

import { Slider } from "@/components/ui/slider";

interface ConfidenceSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="font-medium uppercase tracking-wide text-zinc-500">
          Confidence
        </span>
        <span className="font-mono text-zinc-200">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[Math.round(value * 100)]}
        min={0}
        max={100}
        step={1}
        onValueChange={(v) => {
          const n = Array.isArray(v) ? v[0] : v;
          if (typeof n === "number") onChange(n / 100);
        }}
      />
    </div>
  );
}

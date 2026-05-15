"use client";

import type { InspectionReport, Severity } from "@/lib/types";
import { SEVERITY_HEX } from "@/lib/severity";

interface SeverityChartProps {
  report: InspectionReport | null;
}

export function SeverityChart({ report }: SeverityChartProps) {
  if (!report) return null;

  const counts: Record<Severity, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const d of report.defects) counts[d.severity] += 1;
  const total = counts.LOW + counts.MEDIUM + counts.HIGH;
  if (total === 0) return null;

  const order: Severity[] = ["LOW", "MEDIUM", "HIGH"];

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        <span>Severity distribution</span>
        <span className="text-zinc-400">{total} findings</span>
      </div>
      <div className="flex h-5 w-full overflow-hidden rounded border border-zinc-800 bg-zinc-950">
        {order.map((sev) => {
          const pct = (counts[sev] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={sev}
              className="flex items-center justify-center text-[10px] font-medium text-zinc-950 transition-all duration-500 ease-out"
              style={{
                width: `${pct}%`,
                backgroundColor: SEVERITY_HEX[sev],
              }}
              title={`${counts[sev]} ${sev}`}
            >
              {pct >= 15 ? counts[sev] : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
        {order.map((sev) => (
          <div key={sev} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: SEVERITY_HEX[sev] }}
            />
            <span className="font-mono">
              {counts[sev]} {sev}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

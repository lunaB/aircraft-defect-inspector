"use client";

import { Button } from "@/components/ui/button";
import type { Detection, InspectionReport } from "@/lib/types";
import { ReportCard } from "./ReportCard";
import { ResultsChat } from "./ResultsChat";
import { SeverityChart } from "./SeverityChart";

interface ReportPanelProps {
  report: InspectionReport | null;
  partial: string;
  isStreaming: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onExportPDF: () => void;
  detections: Detection[];
  apiKeyAvailable: boolean;
  /** Bumped by the page each time a new image is analyzed; resets chat. */
  analysisId: number;
}

export function ReportPanel({
  report,
  partial,
  isStreaming,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onExportPDF,
  detections,
  apiKeyAvailable,
  analysisId,
}: ReportPanelProps) {
  // resetKey changes whenever the page bumps analysisId on a new upload.
  // null = no analysis yet (chat shows placeholder).
  const resetKey = analysisId > 0 ? analysisId : null;

  const defects = report?.defects ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header (h-12 to match left toolbar). */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <h2 className="text-sm font-semibold text-zinc-200">
          Inspection Results
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onExportPDF}
          disabled={!report}
        >
          Export PDF
        </Button>
      </div>

      {/* Severity chart strip (auto height, present only when report). */}
      {report && (
        <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
          <SeverityChart report={report} />
          {report.summary && (
            <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/40 p-2 text-[11px] leading-snug text-zinc-200">
              <div className="mb-0.5 text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                Summary
              </div>
              {report.summary}
            </div>
          )}
        </div>
      )}

      {/* Cards list — the scrolling section. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {defects.map((d) => (
            <ReportCard
              key={d.id}
              analysis={d}
              selected={selectedId === d.id}
              hovered={hoveredId === d.id}
              onSelect={onSelect}
              onHover={onHover}
            />
          ))}
          {!report && isStreaming && partial && (
            <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                LLM streaming (raw)
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-[10px] text-zinc-400">
                {partial}
              </pre>
            </div>
          )}
          {!report && !isStreaming && (
            <div className="rounded-md border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-600">
              Upload an image to see analysis results here
            </div>
          )}
        </div>
      </div>

      {/* Chat — fixed h-72, own internal scroll. */}
      <div className="h-72 shrink-0 border-t border-zinc-800">
        <ResultsChat
          detections={detections}
          report={report}
          apiKeyAvailable={apiKeyAvailable}
          resetKey={resetKey}
        />
      </div>
    </div>
  );
}

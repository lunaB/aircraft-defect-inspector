"use client";

import { useCallback, useState, type DragEvent } from "react";
import { DetectionCanvas } from "./DetectionCanvas";
import { cn } from "@/lib/utils";
import type { DefectAnalysis, Detection, DetectResponse } from "@/lib/types";

interface CanvasAreaProps {
  imageUrl: string | null;
  result: DetectResponse | null;
  detections: Detection[];
  analyses: Map<string, DefectAnalysis>;
  selectedId: string | null;
  hoveredId: string | null;
  onSelectDetection: (id: string | null) => void;
  onHoverDetection: (id: string | null) => void;
  onFile: (file: File) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = new Set(["image/png", "image/jpeg", "image/jpg"]);

export function CanvasArea({
  imageUrl,
  result,
  detections,
  analyses,
  selectedId,
  hoveredId,
  onSelectDetection,
  onHoverDetection,
  onFile,
  disabled,
  showLabels = true,
}: CanvasAreaProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      // Only treat as image drag if files are present.
      if (Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!dragActive) setDragActive(true);
      }
    },
    [disabled, dragActive],
  );

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Only deactivate when leaving the section itself.
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const type = file.type.toLowerCase();
      const okType =
        ACCEPTED.has(type) ||
        /\.(png|jpe?g)$/i.test(file.name);
      if (!okType) {
        alert("Only PNG or JPG images are accepted.");
        return;
      }
      if (file.size > MAX_BYTES) {
        alert("File size must be 10MB or less.");
        return;
      }
      onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative min-h-0 flex-1 overflow-auto p-4 transition-colors",
        dragActive && "bg-sky-500/5 ring-1 ring-inset ring-sky-500/40",
      )}
    >
      <div className="h-full w-full">
        <DetectionCanvas
          imageUrl={imageUrl}
          result={result}
          detections={detections}
          analyses={analyses}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelectDetection={onSelectDetection}
          onHoverDetection={onHoverDetection}
          showLabels={showLabels}
        />
      </div>
      {dragActive && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-lg border-2 border-dashed border-sky-500/60 bg-sky-500/10"
        >
          <div className="rounded-md border border-sky-500/40 bg-zinc-950/80 px-3 py-1.5 text-[11px] font-medium text-sky-200">
            Drop image to analyze · PNG / JPG · max 10MB
          </div>
        </div>
      )}
    </div>
  );
}

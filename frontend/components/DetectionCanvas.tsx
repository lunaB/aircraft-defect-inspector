"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DefectAnalysis, Detection, DetectResponse } from "@/lib/types";
import { severityColor } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { HeroIntro } from "./HeroIntro";

interface DetectionCanvasProps {
  imageUrl: string | null;
  result: DetectResponse | null;
  // Detections after confidence + class filtering (used to mark "visible" ones).
  detections: Detection[];
  analyses: Map<string, DefectAnalysis>;
  selectedId: string | null;
  hoveredId: string | null;
  onSelectDetection: (id: string | null) => void;
  onHoverDetection: (id: string | null) => void;
  showLabels?: boolean;
}

export function DetectionCanvas({
  imageUrl,
  result,
  detections,
  analyses,
  selectedId,
  hoveredId,
  onSelectDetection,
  onHoverDetection,
  showLabels = true,
}: DetectionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1, w: 0, h: 0 });

  const recompute = () => {
    const img = imgRef.current;
    if (!img || !result) return;
    const rect = img.getBoundingClientRect();
    setScale({
      x: rect.width / result.image_width,
      y: rect.height / result.image_height,
      w: rect.width,
      h: rect.height,
    });
  };

  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (imgRef.current) ro.observe(imgRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, result]);

  // Set of currently-visible ids (post filter). All raw detections still
  // render — filtered-out ones fade to opacity-0 + pointer-events-none.
  const visibleIds = useMemo(() => {
    const s = new Set<string>();
    detections.forEach((d, i) => s.add(d.id ?? `D${i + 1}`));
    return s;
  }, [detections]);

  // Show hero when there's no image at all.
  if (!imageUrl) {
    return <HeroIntro />;
  }

  // All raw detections from the upstream result (so we can fade in/out).
  const allDetections: Detection[] =
    result?.detections.map((d, i) => ({
      ...d,
      id: d.id ?? `D${i + 1}`,
    })) ?? [];

  // Whether any box is being hovered (in canvas or in card list).
  const anyHovered = hoveredId !== null;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-black/40"
      onClick={() => onSelectDetection(null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt="inspection target"
        onLoad={recompute}
        className="max-h-full max-w-full select-none object-contain"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          width: scale.w,
          height: scale.h,
        }}
      >
        {allDetections.map((d) => {
          const id = d.id!;
          const visible = visibleIds.has(id);
          const analysis = analyses.get(id);
          const color = analysis
            ? severityColor(analysis.severity)
            : "rgb(16 185 129)"; // emerald-500 default
          const selected = selectedId === id;
          const hovered = hoveredId === id;
          const left = d.x * scale.x;
          const top = d.y * scale.y;
          const width = d.w * scale.x;
          const height = d.h * scale.y;

          // Dim other boxes when one is hovered.
          let opacity = 1;
          if (!visible) opacity = 0;
          else if (anyHovered && !hovered) opacity = 0.4;

          return (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDetection(id);
              }}
              onMouseEnter={() => onHoverDetection(id)}
              onMouseLeave={() =>
                onHoverDetection(hoveredId === id ? null : hoveredId)
              }
              className={cn(
                "absolute cursor-pointer border-2 transition-all duration-200 ease-out",
                visible ? "pointer-events-auto" : "pointer-events-none",
                selected && "z-10",
              )}
              style={{
                left,
                top,
                width,
                height,
                borderColor: color,
                borderWidth: hovered || selected ? 3 : 2,
                background:
                  selected || hovered ? `${color}22` : "transparent",
                opacity,
                transform: visible ? "scale(1)" : "scale(0.95)",
                filter: hovered
                  ? `drop-shadow(0 0 6px ${color})`
                  : selected
                  ? "drop-shadow(0 0 0 rgba(255,255,255,0.6))"
                  : undefined,
                boxShadow: selected
                  ? "0 0 0 2px rgba(255,255,255,0.6)"
                  : undefined,
              }}
              aria-label={`detection ${id} (${d.class})`}
            >
              {showLabels && (
                <span
                  className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white transition-opacity"
                  style={{ background: color, opacity: visible ? 1 : 0 }}
                >
                  {id} · {d.class} · {(d.confidence * 100).toFixed(0)}%
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

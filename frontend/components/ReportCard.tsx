"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DefectAnalysis } from "@/lib/types";
import { severityBgClass, severityLabel } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { getATAGloss, getMELCategoryFromId, MEL_EXPLAINER } from "@/lib/ata-glossary";

interface ReportCardProps {
  analysis: DefectAnalysis;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function ReportCard({
  analysis,
  selected,
  hovered,
  onSelect,
  onHover,
}: ReportCardProps) {
  const [open, setOpen] = useState(true);
  const [ataPop, setAtaPop] = useState(false);
  const [melPop, setMelPop] = useState(false);
  const ataRef = useRef<HTMLDivElement>(null);
  const melRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sev = severityBgClass(analysis.severity);
  const ataGloss = getATAGloss(analysis.ata_chapter);
  const melCat = getMELCategoryFromId(analysis.mel_match.mel_id);
  const melCatText = melCat ? MEL_EXPLAINER.categories[melCat] : null;

  // Auto-scroll card into view when hovered/selected from outside.
  useEffect(() => {
    if ((hovered || selected) && cardRef.current) {
      cardRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [hovered, selected]);

  useEffect(() => {
    if (!ataPop && !melPop) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ataRef.current && !ataRef.current.contains(t)) setAtaPop(false);
      if (melRef.current && !melRef.current.contains(t)) setMelPop(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [ataPop, melPop]);

  return (
    <Card
      ref={cardRef}
      onClick={() => onSelect(analysis.id)}
      onMouseEnter={() => onHover(analysis.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "relative cursor-pointer border-zinc-800 bg-zinc-950/60 transition-all duration-200",
        hovered && !selected && "border-l-2 border-l-emerald-400",
        selected && "ring-2 ring-emerald-400/60",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                {analysis.id}
              </span>
              <CardTitle className="truncate text-sm">
                {analysis.yolo_class}{" "}
                <span className="text-zinc-500">
                  · {(analysis.yolo_confidence * 100).toFixed(0)}%
                </span>
              </CardTitle>
            </div>
            <div className="mt-1 text-xs text-zinc-400">
              {analysis.estimated_location}
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0 border", sev)}>
            {severityLabel(analysis.severity)}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <div ref={ataRef} className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAtaPop((o) => !o);
                setMelPop(false);
              }}
              className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-200 transition hover:bg-zinc-700"
              aria-label="What is this ATA chapter?"
            >
              ATA {analysis.ata_chapter}
            </button>
            {ataPop && ataGloss && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full z-30 mt-1.5 w-72 rounded-md border border-zinc-800 bg-zinc-950 p-2.5 shadow-xl"
              >
                <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  ATA {ataGloss.code}
                </div>
                <div className="text-xs font-semibold text-zinc-100">
                  {ataGloss.name}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  {ataGloss.plain}
                </p>
              </div>
            )}
          </div>
          <span className="text-[10px] text-zinc-500">
            {analysis.ata_chapter_title}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3 text-xs">
        <div>
          <div className="mb-0.5 font-medium uppercase tracking-wide text-zinc-500">
            Estimated cause
          </div>
          <div className="text-zinc-200">{analysis.estimated_cause}</div>
        </div>

        <div
          className={cn(
            "rounded-md border p-2",
            analysis.mel_match.satisfies_condition
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-amber-500/40 bg-amber-500/10",
          )}
        >
          <div className="mb-0.5 flex items-center justify-between">
            <span className="font-medium uppercase tracking-wide text-zinc-400">
              MEL match
            </span>
            <div ref={melRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMelPop((o) => !o);
                  setAtaPop(false);
                }}
                className={cn(
                  "font-mono text-[10px] transition",
                  analysis.mel_match.satisfies_condition
                    ? "text-emerald-300 hover:text-emerald-200"
                    : "text-amber-300 hover:text-amber-200",
                )}
                aria-label="What does this MEL id mean?"
              >
                {analysis.mel_match.mel_id ?? "MATCH NONE"} ·{" "}
                {analysis.mel_match.satisfies_condition
                  ? "OK"
                  : "Condition not met"}
              </button>
              {melPop && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full z-30 mt-1.5 w-72 rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-left shadow-xl"
                >
                  <div className="text-xs font-semibold text-zinc-100">
                    {MEL_EXPLAINER.title}
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                    {MEL_EXPLAINER.plain}
                  </p>
                  {melCat && melCatText && (
                    <div className="mt-2 rounded border border-zinc-800 bg-zinc-900/60 p-2">
                      <div className="font-mono text-[10px] text-zinc-500">
                        Category {melCat}
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-200">
                        {melCatText}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-zinc-200">{analysis.mel_match.reasoning}</div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          {open ? "Hide maintenance actions" : "Show maintenance actions"}
        </button>
        {open && (
          <ul className="ml-4 list-disc space-y-1 text-zinc-200">
            {analysis.recommended_actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

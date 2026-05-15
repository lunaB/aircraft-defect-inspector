"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Dropzone, type DropzoneHandle } from "@/components/Dropzone";
import { Toolbar } from "@/components/Toolbar";
import { CanvasArea } from "@/components/CanvasArea";
import {
  SampleStrip,
  type SampleStripHandle,
} from "@/components/SampleStrip";
import type { StageState } from "@/components/PipelineStages";
import { ReportPanel } from "@/components/ReportPanel";
import { ApiKeyInput, readStoredApiKey } from "@/components/ApiKeyInput";
import { ModelCard } from "@/components/ModelCard";
import { ShortcutsOverlay } from "@/components/ShortcutsOverlay";
import { consumeSSE } from "@/lib/sse-client";
import type {
  DefectAnalysis,
  Detection,
  DetectResponse,
  InspectionReport,
} from "@/lib/types";

export default function HomePage() {
  const [, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeSampleSrc, setActiveSampleSrc] = useState<string | null>(null);

  const [detectResp, setDetectResp] = useState<DetectResponse | null>(null);
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [partial, setPartial] = useState("");

  const [, setYolo] = useState<StageState>("idle");
  const [, setLlm] = useState<StageState>("idle");
  const [, setMel] = useState<StageState>("idle");
  const [isStreaming, setIsStreaming] = useState(false);

  const [confidence, setConfidence] = useState(0.15);
  const [iou, setIou] = useState(0.7);
  const [enabledClasses, setEnabledClasses] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);
  const [analysisId, setAnalysisId] = useState(0);

  const objectUrlRef = useRef<string | null>(null);
  const sampleRef = useRef<SampleStripHandle>(null);
  const dropzoneRef = useRef<DropzoneHandle>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Initial sync of API key state from sessionStorage (client-only).
  useEffect(() => {
    setApiKeyAvailable(readStoredApiKey().length > 0);
  }, []);

  const allClasses = useMemo(() => {
    if (!detectResp) return [] as string[];
    return Array.from(new Set(detectResp.detections.map((d) => d.class)));
  }, [detectResp]);

  // Auto-enable all classes on first detection.
  useEffect(() => {
    if (allClasses.length > 0) {
      setEnabledClasses((prev) =>
        prev.size === 0 ? new Set(allClasses) : prev,
      );
    }
  }, [allClasses]);

  const analyses = useMemo(() => {
    const m = new Map<string, DefectAnalysis>();
    report?.defects.forEach((d) => m.set(d.id, d));
    return m;
  }, [report]);

  const filteredDetections = useMemo<Detection[]>(() => {
    if (!detectResp) return [];
    return detectResp.detections
      .map((d, i) => ({ ...d, id: d.id ?? `D${i + 1}` }))
      .filter((d) => d.confidence >= confidence)
      .filter(
        (d) => enabledClasses.size === 0 || enabledClasses.has(d.class),
      );
  }, [detectResp, confidence, enabledClasses]);

  const reset = () => {
    setDetectResp(null);
    setReport(null);
    setPartial("");
    setYolo("idle");
    setLlm("idle");
    setMel("idle");
    setSelectedId(null);
    setHoveredId(null);
    setEnabledClasses(new Set());
  };

  const runAnalyze = useCallback(async (f: File) => {
    setIsStreaming(true);
    setYolo("active");
    try {
      const fd = new FormData();
      fd.append("image", f);
      const apiKey = readStoredApiKey();
      const headers: Record<string, string> = {
        "X-Iou-Threshold": String(iou),
      };
      if (apiKey) headers["X-OpenAI-Key"] = apiKey;
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: fd,
        headers,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      await consumeSSE(res, (evt) => {
        switch (evt.type) {
          case "detections":
            setDetectResp(evt.payload);
            setYolo("done");
            setLlm("active");
            break;
          case "report_chunk":
            setPartial((p) => p + evt.payload);
            break;
          case "report_done":
            setReport(evt.payload);
            setLlm("done");
            setMel("done");
            break;
          case "error":
            toast.warning(evt.payload.message);
            break;
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Analysis failed: ${message}`);
      setYolo("error");
      setLlm("error");
      setMel("error");
    } finally {
      setIsStreaming(false);
    }
  }, [iou]);

  const handleFile = useCallback(
    (f: File, sampleSrc?: string) => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(f);
      objectUrlRef.current = url;
      setFile(f);
      setImageUrl(url);
      setActiveSampleSrc(sampleSrc ?? null);
      reset();
      setAnalysisId((n) => n + 1);
      void runAnalyze(f);
    },
    [runAnalyze],
  );

  const handleSampleSelect = useCallback(
    (f: File, src: string) => handleFile(f, src),
    [handleFile],
  );

  const handleDropzoneFile = useCallback(
    (f: File) => handleFile(f, undefined),
    [handleFile],
  );

  const toggleClass = (c: string) => {
    setEnabledClasses((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const exportPDF = () => {
    if (typeof window !== "undefined") window.print();
  };

  // Keyboard shortcuts: 1..5 → sample, ? → overlay, Esc → clear.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isText =
        tag === "input" ||
        tag === "textarea" ||
        target?.isContentEditable === true;

      if (e.key === "Escape") {
        setSelectedId(null);
        setShortcutsOpen(false);
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      if (isText) return;
      if (isStreaming) return;
      if (/^[0-9]$/.test(e.key)) {
        const idx = e.key === "0" ? 9 : Number(e.key) - 1;
        sampleRef.current?.trigger(idx);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isStreaming]);

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold leading-tight text-zinc-100">
              Aircraft Damage & Defect Inspection Assistant
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>UTS Aircraft Defect Detection v3 + GPT-4o-mini</span>
              <ModelCard />
            </div>
          </div>
          <ApiKeyInput
            onChange={(k) => setApiKeyAvailable(k.length > 0)}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-12">
        {/* Left pane: toolbar + canvas + samples */}
        <section className="col-span-8 flex min-h-0 flex-col border-r border-zinc-800">
          <Toolbar
            onUploadClick={() => dropzoneRef.current?.openPicker()}
            uploadDisabled={isStreaming}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            iou={iou}
            onIouChange={setIou}
            classes={allClasses}
            enabledClasses={enabledClasses}
            onToggleClass={toggleClass}
            showLabels={showLabels}
            onShowLabelsChange={setShowLabels}
          />
          <CanvasArea
            imageUrl={imageUrl}
            result={detectResp}
            detections={filteredDetections}
            analyses={analyses}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelectDetection={setSelectedId}
            onHoverDetection={setHoveredId}
            onFile={handleDropzoneFile}
            disabled={isStreaming}
            showLabels={showLabels}
          />
          <SampleStrip
            ref={sampleRef}
            onSelect={handleSampleSelect}
            disabled={isStreaming}
            activeSampleSrc={activeSampleSrc}
          />
        </section>

        {/* Right pane: results + chat */}
        <aside className="col-span-4 flex min-h-0 flex-col">
          <ReportPanel
            report={report}
            partial={partial}
            isStreaming={isStreaming}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            onExportPDF={exportPDF}
            detections={filteredDetections}
            apiKeyAvailable={apiKeyAvailable}
            analysisId={analysisId}
          />
        </aside>
      </div>

      {/* Hidden dropzone for the Toolbar Upload button. */}
      <Dropzone
        ref={dropzoneRef}
        onFile={handleDropzoneFile}
        disabled={isStreaming}
        hidden
      />

      <ShortcutsOverlay
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </main>
  );
}

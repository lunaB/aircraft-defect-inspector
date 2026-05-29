import OpenAI from "openai";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { MOCK_DETECTIONS } from "@/lib/mock-detections";
import { BACKEND_CANDIDATE_CONFIDENCE } from "@/lib/detection-config";
import { groundReportInDetections } from "@/lib/report-grounding";
import { mapYoloClassToATA } from "@/lib/ata-chapters";
import type {
  AnalyzeEvent,
  Detection,
  DetectResponse,
  InspectionReport,
  Severity,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const USE_MOCK = process.env.MOCK === "1";

function sseEncode(event: AnalyzeEvent): Uint8Array {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  return new TextEncoder().encode(payload);
}

async function callYOLO(
  file: File,
  iou: number | null,
  conf: number,
): Promise<DetectResponse> {
  const fd = new FormData();
  fd.append("image", file, file.name);
  const params = new URLSearchParams({
    conf: conf.toFixed(4),
  });
  if (iou !== null) {
    params.set("iou", iou.toFixed(4));
  }
  const url = `${BACKEND_URL}/detect?${params.toString()}`;
  const res = await fetch(url, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    throw new Error(`Backend /detect returned ${res.status}`);
  }
  return (await res.json()) as DetectResponse;
}

interface MockProfile {
  severity: Severity;
  mel_id: string;
  satisfies: boolean;
  cause: string;
  reasoning: string;
  actions: string[];
}

function mockProfileFor(yoloClass: string): MockProfile {
  switch (yoloClass) {
    case "Rupture":
      return {
        severity: "HIGH",
        mel_id: "MEL-53-10-A2",
        satisfies: true,
        cause:
          "Likely impact damage or fatigue-driven through-thickness skin failure (mock)",
        reasoning:
          "Any through-thickness rupture of the fuselage skin is a no-go condition under MEL-53-10-A2 (mock)",
        actions: [
          "Aircraft no-go; ground the airframe pending structural repair",
          "Apply temporary skin patch per SRM 53-10 and engineering disposition",
          "Inspect adjacent frames, stringers, and fasteners for secondary damage",
        ],
      };
    case "Fastener Damage":
      return {
        severity: "MEDIUM",
        mel_id: "MEL-53-40-B1",
        satisfies: true,
        cause:
          "Likely fastener fatigue or installation defect; possible vibration loading (mock)",
        reasoning:
          "Observed loose or damaged rivet matches the MEL-53-40-B1 condition (mock)",
        actions: [
          "Replace damaged rivet(s) per SRM 53-40 within 72 hours",
          "Inspect surrounding skin for fatigue cracks initiating at the fastener hole",
          "Verify torque on adjacent fasteners in the same row",
        ],
      };
    case "Dent":
      return {
        severity: "LOW",
        mel_id: "MEL-53-10-C1",
        satisfies: true,
        cause:
          "Likely ground equipment contact or minor impact (mock)",
        reasoning:
          "Dent dimensions estimated within MEL-53-10-C1 thresholds (diameter < 25mm, depth < 1mm) (mock)",
        actions: [
          "Log dent in tech log with photo and dimensions",
          "Defer up to 10 days; smooth-blend per SRM 53-10 at next opportunity",
          "Monitor at each daily walk-around for crack propagation",
        ],
      };
    default:
      return {
        severity: "LOW",
        mel_id: "MEL-53-10-D1",
        satisfies: false,
        cause:
          "Unclassified surface anomaly — detailed on-site inspection required (mock)",
        reasoning:
          "Detection class does not match a UTS Aircraft Defect taxonomy entry (mock)",
        actions: [
          "Perform a detailed on-site inspection",
          "Re-assess MEL applicability after damage classification",
          "Re-check at the next scheduled inspection",
        ],
      };
  }
}

function mockReportFor(detections: Detection[]): InspectionReport {
  return {
    summary: `${detections.length} aircraft surface defect(s) detected — maintenance action recommended. (mock)`,
    defects: detections.map((d, i) => {
      const id = d.id ?? `D${i + 1}`;
      const profile = mockProfileFor(d.class);
      const mapping = mapYoloClassToATA(d.class);
      return {
        id,
        yolo_class: d.class,
        yolo_confidence: d.confidence,
        estimated_location: "Right side of forward fuselage (mock estimate)",
        ata_chapter: mapping.code,
        ata_chapter_title: mapping.title,
        severity: profile.severity,
        estimated_cause: profile.cause,
        mel_match: {
          mel_id: profile.mel_id,
          satisfies_condition: profile.satisfies,
          reasoning: profile.reasoning,
        },
        recommended_actions: profile.actions,
      };
    }),
  };
}

function safeParseReport(raw: string): InspectionReport | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.defects)
    ) {
      return parsed as InspectionReport;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("invalid multipart form", { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return new Response("missing 'image' field", { status: 400 });
  }

  // Read once into a buffer so we can both forward to YOLO and embed
  // in the LLM call as a data URL.
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

  // Optional NMS IoU threshold — passed through to backend as ?iou=.
  const iouHeader = req.headers.get("x-iou-threshold");
  let iouValue: number | null = null;
  if (iouHeader !== null) {
    const parsed = Number.parseFloat(iouHeader);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      iouValue = parsed;
    }
  }

  // 1) Get detections from YOLO backend (or mock).
  let detectResp: DetectResponse;
  let backendError: string | null = null;
  if (USE_MOCK) {
    detectResp = MOCK_DETECTIONS;
  } else {
    try {
      // We need to wrap the buffer into a fresh File for forwarding.
      const forwardFile = new File([buf], file.name, { type: mime });
      detectResp = await callYOLO(
        forwardFile,
        iouValue,
        BACKEND_CANDIDATE_CONFIDENCE,
      );
    } catch (err) {
      backendError = err instanceof Error ? err.message : String(err);
      detectResp = MOCK_DETECTIONS;
    }
  }

  const headerKey = req.headers.get("x-openai-key")?.trim();
  const apiKey = headerKey || process.env.OPENAI_API_KEY;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: AnalyzeEvent) => controller.enqueue(sseEncode(e));

      // Surface backend issues as a non-fatal info event.
      if (backendError) {
        send({
          type: "error",
          payload: {
            message: `Backend /detect call failed — falling back to mock detections: ${backendError}`,
          },
        });
      }

      // 1. Immediately emit raw detections so the canvas can render.
      send({ type: "detections", payload: detectResp });

      // 2. If no OpenAI key, return mocked LLM output.
      if (!apiKey) {
        const mock = mockReportFor(detectResp.detections);
        send({
          type: "error",
          payload: {
            message:
              "OPENAI_API_KEY is not set — using mock LLM report.",
          },
        });
        send({
          type: "report_chunk",
          payload: JSON.stringify(mock),
        });
        send({ type: "report_done", payload: mock });
        controller.close();
        return;
      }

      // 3. Stream LLM analysis.
      try {
        const client = new OpenAI({ apiKey });
        const sysPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(detectResp.detections, {
          image_width: detectResp.image_width,
          image_height: detectResp.image_height,
        });

        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          stream: true,
          messages: [
            { role: "system", content: sysPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: { url: dataUrl, detail: "high" },
                },
              ],
            },
          ],
        });

        let buffer = "";
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            buffer += delta;
            send({ type: "report_chunk", payload: delta });
          }
        }

        const parsed = safeParseReport(buffer);
        if (parsed) {
          send({
            type: "report_done",
            payload: groundReportInDetections(parsed, detectResp.detections),
          });
        } else {
          send({
            type: "error",
            payload: {
              message:
                "Could not parse LLM response as JSON — falling back to the mock report.",
            },
          });
          const mock = mockReportFor(detectResp.detections);
          send({ type: "report_done", payload: mock });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({
          type: "error",
          payload: { message: `LLM call failed: ${message}` },
        });
        const mock = mockReportFor(detectResp.detections);
        send({ type: "report_done", payload: mock });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

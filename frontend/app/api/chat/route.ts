import OpenAI from "openai";
import type { Detection, InspectionReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context: {
    detections: Detection[];
    report: InspectionReport | null;
  };
}

function buildSystemPrompt(
  detections: Detection[],
  report: InspectionReport | null,
): string {
  return [
    "You are an inspection assistant for an aircraft surface defect demo.",
    "The user has just received a YOLO + Vision-LLM analysis. They may ask",
    "follow-up questions about specific defects, severity assignments, ATA",
    "chapters, MEL items, or repair priorities. Be terse, technical, and",
    "grounded in the provided analysis. If a question can't be answered from",
    "the analysis alone, say so and suggest what would be needed.",
    "",
    `Detection summary (raw YOLO output): ${JSON.stringify(detections)}`,
    `Inspection report: ${JSON.stringify(report)}`,
  ].join("\n");
}

export async function POST(req: Request): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  const headerKey = req.headers.get("x-openai-key")?.trim();
  const apiKey = headerKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("OpenAI API key not configured", { status: 401 });
  }

  const sysPrompt = buildSystemPrompt(
    body.context?.detections ?? [],
    body.context?.report ?? null,
  );

  const client = new OpenAI({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            { role: "system", content: sysPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        });

        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n[error: ${msg}]`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

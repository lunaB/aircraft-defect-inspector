import type { AnalyzeEvent } from "./types";

// Reads an SSE stream from a fetch Response and invokes onEvent for
// each parsed AnalyzeEvent. Tolerates partial chunks.
export async function consumeSSE(
  res: Response,
  onEvent: (e: AnalyzeEvent) => void,
): Promise<void> {
  if (!res.body) throw new Error("response has no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    let sepIdx;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);
      const dataLine = rawEvent
        .split("\n")
        .find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json) continue;
      try {
        const evt = JSON.parse(json) as AnalyzeEvent;
        onEvent(evt);
      } catch {
        // Skip malformed events.
      }
    }
  }
}

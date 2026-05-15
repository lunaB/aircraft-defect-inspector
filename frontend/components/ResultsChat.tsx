"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { readStoredApiKey } from "@/components/ApiKeyInput";
import { cn } from "@/lib/utils";
import type { Detection, InspectionReport } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ResultsChatProps {
  detections: Detection[];
  report: InspectionReport | null;
  /** Optional image data URL forwarded from the page if available. */
  imageDataUrl?: string;
  apiKeyAvailable: boolean;
  /**
   * Reference identity that changes whenever a new image is analyzed.
   * Triggers a chat reset.
   */
  resetKey: unknown;
}

export function ResultsChat({
  detections,
  report,
  apiKeyAvailable,
  resetKey,
}: ResultsChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset chat when a new image is analyzed.
  useEffect(() => {
    setMessages([]);
    setInput("");
    setSending(false);
    abortRef.current?.abort();
  }, [resetKey]);

  // Auto-scroll on new messages or streaming updates.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const hasResults = resetKey !== null && resetKey !== undefined;
  const canSend =
    hasResults && apiKeyAvailable && !sending && input.trim().length > 0;

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !hasResults || !apiKeyAvailable) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      isStreaming: true,
    };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, assistantMsg]);
    setInput("");
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const apiKey = readStoredApiKey();
      const res = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "X-OpenAI-Key": apiKey } : {}),
        },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: { detections, report },
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              content: `Error: ${errText || res.statusText || "request failed"}`,
              isStreaming: false,
            };
          }
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              content: acc,
              isStreaming: true,
            };
          }
          return copy;
        });
      }
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          copy[copy.length - 1] = {
            role: "assistant",
            content: acc,
            isStreaming: false,
          };
        }
        return copy;
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          copy[copy.length - 1] = {
            role: "assistant",
            content: `Error: ${msg}`,
            isStreaming: false,
          };
        }
        return copy;
      });
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }, [
    input,
    sending,
    hasResults,
    apiKeyAvailable,
    messages,
    detections,
    report,
  ]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) void sendMessage();
    }
  };

  // Show at most the last 6 messages.
  const visibleMessages = useMemo(
    () => messages.slice(-6),
    [messages],
  );

  if (!hasResults) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-zinc-950/40">
        <div className="flex flex-1 items-center justify-center px-4 text-center text-[10px] text-zinc-600">
          Chat available after analysis.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/70">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
      >
        {visibleMessages.length === 0 ? (
          <div className="px-1 py-1 text-[10px] text-zinc-600">
            Ask about a defect, severity, ATA chapter, or MEL match.
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {visibleMessages.map((m, i) => (
              <li
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap break-words rounded-md px-2 py-1.5 text-[11px] leading-snug",
                    m.role === "user"
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-800 text-zinc-200",
                  )}
                >
                  {m.content}
                  {m.isStreaming && m.role === "assistant" && (
                    <span className="ml-1 inline-flex gap-0.5 align-middle">
                      <Dot delay={0} />
                      <Dot delay={150} />
                      <Dot delay={300} />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-800 px-2 py-2">
        {!apiKeyAvailable && (
          <div className="mb-1.5 text-[10px] text-amber-300/80">
            Set an OpenAI key to enable chat.
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!apiKeyAvailable || sending}
            rows={1}
            placeholder={
              apiKeyAvailable
                ? "Ask a follow-up… (Enter to send, Shift+Enter for newline)"
                : "Set an OpenAI key to enable chat."
            }
            className={cn(
              "flex-1 resize-none rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none",
              (!apiKeyAvailable || sending) && "opacity-60",
            )}
            style={{ minHeight: "28px", maxHeight: "96px" }}
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!canSend}
            className={cn(
              "rounded-sm border px-2.5 py-1.5 text-[11px] font-medium transition",
              canSend
                ? "border-emerald-700/60 bg-emerald-900/40 text-emerald-200 hover:border-emerald-600 hover:bg-emerald-900/60"
                : "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600",
            )}
          >
            Send
          </button>
        </div>
        <div className="mt-1 text-[9px] text-zinc-600">
          GPT-4o-mini · resets on new image
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1 w-1 rounded-full bg-zinc-400"
      style={{
        animation: "chatDotPulse 1.2s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

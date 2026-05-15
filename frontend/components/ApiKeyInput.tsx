"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "openai_api_key";

export function readStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

interface ApiKeyInputProps {
  onChange?: (key: string) => void;
}

export function ApiKeyInput({ onChange }: ApiKeyInputProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const [stored, setStored] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = readStoredApiKey();
    if (k) {
      setValue(k);
      setStored(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const save = () => {
    const trimmed = value.trim();
    try {
      if (trimmed) {
        window.sessionStorage.setItem(STORAGE_KEY, trimmed);
        setStored(true);
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
        setStored(false);
      }
    } catch {
      // sessionStorage unavailable — fall through.
    }
    onChange?.(trimmed);
    setOpen(false);
  };

  const clear = () => {
    setValue("");
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setStored(false);
    onChange?.("");
  };

  const masked = value
    ? `${value.slice(0, 3)}…${value.slice(-4)}`
    : "not set";

  return (
    <div className="relative" ref={popRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-mono transition",
          stored
            ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:border-emerald-600"
            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
        )}
        aria-label="OpenAI API key settings"
      >
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            stored ? "bg-emerald-400" : "bg-zinc-600",
          )}
        />
        <span>OpenAI key</span>
        <span className="text-zinc-500">·</span>
        <span>{stored ? masked : "not set"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] rounded-md border border-zinc-800 bg-zinc-950 p-3 shadow-xl">
          <div className="mb-2 text-xs font-medium text-zinc-200">
            OpenAI API key
          </div>
          <p className="mb-2 text-[11px] leading-relaxed text-zinc-500">
            Stored in this browser tab only (sessionStorage). Sent to{" "}
            <code className="font-mono text-zinc-400">/api/analyze</code> via
            an <code className="font-mono text-zinc-400">X-OpenAI-Key</code>{" "}
            header. Leave empty to use the mock LLM fallback.
          </p>
          <div className="flex items-center gap-1.5">
            <input
              type={reveal ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
              className="flex-1 rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              aria-label={reveal ? "Hide key" : "Show key"}
            >
              {reveal ? "hide" : "show"}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={clear}
              className="text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-sm border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-sm border border-emerald-700/60 bg-emerald-900/40 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:border-emerald-600 hover:bg-emerald-900/60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

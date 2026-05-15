"use client";

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string[]; desc: string }> = [
  { keys: ["1", "·", "9", ",", "0"], desc: "Load sample 1–10" },
  { keys: ["?"], desc: "Toggle this overlay" },
  { keys: ["Esc"], desc: "Clear selection / close popovers" },
];

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[360px] rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-zinc-100">
            Keyboard shortcuts
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          >
            Esc
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-xs text-zinc-300"
            >
              <span>{s.desc}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, j) =>
                  k === "·" ? (
                    <span key={j} className="text-zinc-600">
                      …
                    </span>
                  ) : (
                    <kbd
                      key={j}
                      className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-200"
                    >
                      {k}
                    </kbd>
                  ),
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

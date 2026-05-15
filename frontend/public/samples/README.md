# Sample Images

10 aircraft surface inspection photos for the `SampleStrip` on the main page:

- `sample-1.jpg` – `sample-10.jpg`

All 10 samples are sourced from the **UTS Aircraft Defect Detection v3** test split
(Roboflow, Public Domain) — the same dataset the bundled YOLOv8n was trained on.
Class balance: Dent x4, Fastener Damage x3, Rupture x3.

See `frontend/lib/sample-context.ts` for the curator notes and pattern-to-watch
hints surfaced in the `SampleStrip` UI.

Keyboard shortcuts: `1`–`9` for samples 1–9, `0` for sample 10.

When a file is missing the thumbnail simply hides itself; clicking on a missing
sample produces a toast asking the user to add the image.

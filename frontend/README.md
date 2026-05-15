# Aircraft Damage & Defect Inspection Assistant — Frontend

The frontend for a YOLO + Vision-LLM two-stage pipeline demo. A YOLO model (trained on the UTS Aircraft Defect Detection v3 dataset) detects aircraft surface defects, and a Vision-LLM performs semantic analysis grounded in the ATA 100 maintenance taxonomy and a mock MEL (Minimum Equipment List) catalog.

- **Stage 1**: The FastAPI backend (`/detect`) returns YOLO bbox output. (Classes: `Dent`, `Fastener Damage`, `Rupture`)
- **Stage 2**: The `/api/analyze` route in this frontend forwards the original image, the bbox output, the mock MEL items, and the ATA chapter chart to OpenAI `gpt-4o-mini` (vision) and streams back an aircraft maintenance report.

## Stack

- Next.js 16 App Router (Turbopack)
- TypeScript, Tailwind v4, shadcn/ui (base-ui)
- `openai` Node SDK (`gpt-4o-mini`)
- SSE streaming

## Setup

```bash
npm install
cp .env.local.example .env.local   # or write it yourself
npm run dev
```

`.env.local`:

```bash
# OpenAI vision LLM key. Falls back to a mock report when unset.
OPENAI_API_KEY=sk-...

# FastAPI backend URL. Default: http://localhost:8000
BACKEND_URL=http://localhost:8000

# Test the UI without a backend:
# MOCK=1
```

If `MOCK=1` is set, `/api/analyze` skips the FastAPI backend and returns the canned detections from `lib/mock-detections.ts`. If the backend is unreachable the route also auto-falls-back to mock detections.

When `OPENAI_API_KEY` is unset, a mock LLM report is returned so the entire UI can be exercised end-to-end.

## YOLO classes (UTS Aircraft Defect Detection v3)

| YOLO class | ATA mapping | Description |
|---|---|---|
| `Dent` | 53-10 Fuselage – Skin / Plates | Surface dent — impact, hail, ground equipment contact |
| `Fastener Damage` | 53-40 Fuselage – Fasteners | Damaged or missing rivets, bolts, or other fasteners |
| `Rupture` | 53-10 Fuselage – Skin / Plates (Major) | Skin rupture / hole / tear — major structural damage |

## MEL categories

| Category | Deferral window | Use |
|---|---|---|
| A | Immediate (no-go) | Aircraft grounded until repaired |
| B | 72 hours | Repair within 3 days; airworthy with limits |
| C | 10 days | Defer up to 10 days with monitoring |
| D | 120 days | Cosmetic / non-critical |

## Sample images

Place aircraft surface inspection photos at `public/samples/sample-1.jpg` through `sample-5.jpg` to enable one-click analysis from the "Sample images" grid in the left pane. (See `public/samples/README.md` for details.)

## Layout

```
┌──────────────┬───────────────────────┬──────────────────┐
│ Upload pane  │ Image + bbox overlay  │ AI maintenance   │
│ Dropzone     │ Canvas (bbox layer)   │ report           │
│ 5 samples    │ class chips badge     │ Streaming cards  │
│ Confidence   │                       │ per detection    │
│ Class filter │                       │ Export PDF       │
└──────────────┴───────────────────────┴──────────────────┘
```

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build (typecheck included)
- `npm run start` — start prod server
- `npm run lint` — eslint

## Key files

- `lib/types.ts` — domain types (Detection, MELItem, DefectAnalysis, …)
- `lib/ata-chapters.ts` — ATA chapter chart + YOLO→ATA mapping
- `lib/mock-mel.json` — 15 mock MEL entries
- `lib/prompts.ts` — `buildSystemPrompt()`, `buildUserPrompt()`
- `app/api/analyze/route.ts` — multipart receive → YOLO backend call → LLM streaming (SSE)
- `app/page.tsx` — 3-pane main UI page

## Streaming protocol

`/api/analyze` streams the following events over SSE:

- `event: detections` — raw YOLO detection result (sent immediately so the canvas can start rendering)
- `event: report_chunk` — LLM token chunks
- `event: report_done` — the final parsed `InspectionReport` JSON
- `event: error` — non-fatal warning (surfaced via a UI toast)

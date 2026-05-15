# Aircraft Damage & Defect Inspection Assistant

A Pattern Recognition demo built around a 2-stage pipeline: **YOLO** detects low-level visual defects on aircraft surface imagery, then a **Vision-LLM** interprets each detection through aviation maintenance standards (ATA chapters, mock MEL items) to suggest severity and repair actions. A chat panel lets you ask follow-up questions grounded in the analysis.

## Architecture

```
                   ┌─────────────────────────────────┐
                   │  Next.js 16 (frontend)          │
                   │  http://localhost:3000          │
                   │                                 │
                   │  ┌───────────┐  ┌────────────┐  │
                   │  │  Canvas   │  │  Results   │  │
   user upload ───▶│  │  + bbox   │  │  + chat    │  │
                   │  └───────────┘  └────────────┘  │
                   │         │             ▲         │
                   └─────────┼─────────────┼─────────┘
                             │             │
                  POST /api/analyze (multipart)
                             │             │
                  POST /api/chat (json)    │
                             │             │
                             ▼             ▼
                   ┌─────────────────────────────────┐
                   │  Next.js Route Handlers         │
                   │  - forwards image to FastAPI    │
                   │  - streams SSE to client        │
                   │  - calls OpenAI GPT-4o-mini     │
                   └─────────┬───────────────▲───────┘
                             │               │
                             ▼               │
                   ┌─────────────────────────┴───────┐
                   │  FastAPI (backend)              │
                   │  http://localhost:8000          │
                   │  ultralytics YOLOv8n            │
                   │  backend/model/best.pt          │
                   └─────────────────────────────────┘
```

## Repository layout

```
PR/
├── backend/                 FastAPI + ultralytics
│   ├── main.py              /detect, /health endpoints
│   ├── model/best.pt        trained aircraft defect weights
│   └── requirements.txt
├── frontend/                Next.js 16 (App Router, TS, Tailwind v4)
│   ├── app/
│   │   ├── page.tsx         2-pane layout
│   │   └── api/
│   │       ├── analyze/     YOLO + Vision-LLM orchestrator (SSE)
│   │       └── chat/        follow-up Q&A endpoint
│   ├── components/          Toolbar, CanvasArea, SampleStrip,
│   │                        ReportPanel, ResultsChat, ModelCard, ...
│   ├── lib/                 ata-chapters, mock-mel, prompts, glossaries
│   └── public/samples/      10 aircraft defect sample images
├── training/
│   ├── download_dataset.py  pulls UTS Aircraft Defect Detection v3
│   ├── train.py             ultralytics YOLOv8n fine-tune
│   └── runs/aircraft-v1/    training artifacts (weights, plots, csv)
├── dataset/                 Aircraft-Defect-Detection-3/ (gitignored)
└── README.md                this file
```

## Trained model

- **Architecture**: YOLOv8n (3M parameters, ~6 MB weights)
- **Classes**: `Dent`, `Fastener Damage`, `Rupture`
- **Dataset**: [UTS Aircraft Defect Detection v3](https://universe.roboflow.com/university-of-technology-sydney-21uto/aircraft-defect-detection) — Public Domain, 5,855 train / 598 val / 350 test
- **Training**: 20 epochs, batch 16, imgsz 640, Apple M4 Pro (MPS), ~100 min
- **Final metrics** (epoch 18 best):

  | Metric | Value |
  |---|---|
  | mAP50 | 0.446 |
  | mAP50-95 | 0.294 |
  | Precision | 0.804 |
  | Recall | 0.422 |

  Precision-leaning: detections it makes are mostly correct, but it misses ~58% of real defects. Production-grade aircraft inspection systems target mAP50 ≥ 0.85 with one to two orders of magnitude more labeled data.

## Installation

Requires **Python 3.10+** and **Node.js 20+**. Tested on macOS (Apple Silicon).

> The backend refuses to start without `backend/model/best.pt`. If you don't have it yet, go to **[Dataset & training](#dataset--training)** first.

### Backend (FastAPI on :8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

Check: `curl http://localhost:8000/health` should return `{"status":"ok", ...}`.

### Frontend (Next.js on :3000)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

For the Vision-LLM analysis and chat, add an OpenAI key — either in `frontend/.env.local`:

```bash
echo "OPENAI_API_KEY=sk-..." > frontend/.env.local
```

…or paste it at runtime via the header button (stored in `sessionStorage` only).

### How to use

- Click a thumbnail in the bottom strip, or press `1`–`9` / `0` for samples 1–10
- Drag-drop your own JPG/PNG (≤10 MB) into the canvas
- Adjust `Confidence` / `IoU` / `Classes` / `Labels` from the toolbar
- `?` opens the shortcut overlay, `Esc` clears selection

## Dataset & training

The bundled `best.pt` was trained on the **UTS Aircraft Defect Detection v3** dataset (Roboflow, Public Domain). To reproduce or retrain from scratch:

### 1. Get a Roboflow API key

Sign up at [roboflow.com](https://roboflow.com) (free tier works) and copy your private API key from account settings.

```bash
echo "<your-roboflow-key>" > .roboflow_key   # repo root, gitignored
```

### 2. Download the dataset (~600 MB)

```bash
cd backend && source .venv/bin/activate      # reuse the backend venv
python ../training/download_dataset.py
# → dataset/Aircraft-Defect-Detection-3/{train,valid,test}/
```

### 3. Train (~100 min on Apple M4 Pro / MPS)

```bash
python ../training/train.py
# → training/runs/aircraft-v1/weights/best.pt
```

Hyperparameters live at the top of `training/train.py` — `EPOCHS`, `BATCH`, `IMGSZ`, `PATIENCE`.

### 4. Swap the new weights into the backend

```bash
cp training/runs/aircraft-v1/weights/best.pt backend/model/best.pt
# Restart the backend; GET /health should list your 3 classes.
```

The weights must be a YOLOv8 detector with `Dent`, `Fastener Damage`, `Rupture` in that order.

## Demo characteristics

- The model is **rupture-biased** — `Rupture` fires most reliably; `Dent` and `Fastener Damage` are weaker on these public images. This reflects the size of the training set and the difficulty of the rivet-row pattern in the dataset.
- All 10 sample images are pulled from the UTS Aircraft Defect Detection v3 test split (Public Domain, Roboflow) — the same dataset the model was trained on. Class balance: Dent x4, Fastener Damage x3, Rupture x3.
- Mock MEL items and ATA chapter descriptions are illustrative — not authoritative aviation references.
- The Vision-LLM layer uses `gpt-4o-mini`. Output is structured JSON (defects + ATA + MEL + recommended actions) streamed via SSE.

## Notes

- `.roboflow_key`, `dataset/`, `training/runs/`, weights, and `node_modules/` are gitignored.
- The frontend uses Tailwind v4 and shadcn/ui, no chart library — all visuals are inline SVG / CSS.
- The SSE protocol on `/api/analyze` emits `detections`, `report_chunk`, `report_done`, and `error` events. `/api/chat` streams plaintext.

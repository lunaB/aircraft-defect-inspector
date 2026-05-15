"""
Train YOLOv8n on the UTS Aircraft Defect Detection dataset (v3).

Run from anywhere:
    cd /Users/rapidbear/Desktop/PR/backend && source .venv/bin/activate && \
    python /Users/rapidbear/Desktop/PR/training/train.py

Output: /Users/rapidbear/Desktop/PR/training/runs/aircraft-v1/weights/best.pt
"""
from pathlib import Path
import os

import torch
from ultralytics import YOLO


ROOT = Path("/Users/rapidbear/Desktop/PR")
DATA_YAML = ROOT / "dataset" / "Aircraft-Defect-Detection-3" / "data.yaml"
PROJECT_DIR = ROOT / "training" / "runs"
RUN_NAME = "aircraft-v1"

EPOCHS = 20
BATCH = 16
IMGSZ = 640
PATIENCE = 5


def pick_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main() -> None:
    device = pick_device()
    print(f"[train] device={device}")
    print(f"[train] data={DATA_YAML}")
    print(f"[train] epochs={EPOCHS} batch={BATCH} imgsz={IMGSZ}")

    if not DATA_YAML.exists():
        raise SystemExit(f"missing {DATA_YAML} — run download_dataset.py first")

    model = YOLO("yolov8n.pt")
    model.train(
        data=str(DATA_YAML),
        epochs=EPOCHS,
        batch=BATCH,
        imgsz=IMGSZ,
        device=device,
        patience=PATIENCE,
        project=str(PROJECT_DIR),
        name=RUN_NAME,
        exist_ok=True,
        # Performance / determinism
        workers=4,
        seed=42,
        # Save trade-off
        save_period=-1,  # only save best + last
        plots=True,
        verbose=True,
    )

    best = PROJECT_DIR / RUN_NAME / "weights" / "best.pt"
    print(f"\n✅ Training complete.")
    print(f"   best.pt: {best}")
    if best.exists():
        print(f"   size: {best.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()

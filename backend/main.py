"""
Aircraft Damage & Defect Inspection — YOLO inference backend.

Loads a YOLOv8 detector from backend/model/best.pt and exposes POST /detect
for the Next.js frontend.
"""
from __future__ import annotations

import io
import logging
import os
import time
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, ConfigDict, Field
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("inspector")

BACKEND_DIR = Path(__file__).parent
LOCAL_WEIGHTS = BACKEND_DIR / "model" / "best.pt"

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


class Detection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    x: float
    y: float
    w: float
    h: float
    cls: str = Field(serialization_alias="class")
    confidence: float


class DetectResponse(BaseModel):
    image_width: int
    image_height: int
    model_source: str
    inference_ms: float
    detections: list[Detection]


def _resolve_weights() -> tuple[Path, str]:
    if not LOCAL_WEIGHTS.exists():
        raise FileNotFoundError(
            f"Model weights not found at {LOCAL_WEIGHTS}. "
            f"Place a trained YOLOv8 best.pt there before starting the backend."
        )
    log.info("Loading local weights: %s", LOCAL_WEIGHTS)
    return LOCAL_WEIGHTS, f"local:{LOCAL_WEIGHTS.name}"


_model: YOLO | None = None
_model_source: str = ""


def get_model() -> tuple[YOLO, str]:
    global _model, _model_source
    if _model is None:
        weights_path, source = _resolve_weights()
        _model = YOLO(str(weights_path))
        _model_source = source
        log.info("Model loaded. classes=%s", _model.names)
    return _model, _model_source


app = FastAPI(title="Aircraft Defect Inspector", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warmup() -> None:
    try:
        get_model()
    except Exception:
        log.exception("Model warmup failed — will retry on first request")


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        model, source = get_model()
        return {
            "status": "ok",
            "model_source": source,
            "classes": list(model.names.values()) if hasattr(model, "names") else [],
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {e}")


@app.post("/detect", response_model=DetectResponse, response_model_by_alias=True)
async def detect(
    image: UploadFile = File(...),
    conf: float = Query(
        0.05,
        ge=0.0,
        le=1.0,
        description="Detection confidence threshold. Default 0.05 keeps weak candidates for UI filtering.",
    ),
    iou: float = Query(
        0.7,
        ge=0.0,
        le=1.0,
        description="NMS IoU threshold (0.0–1.0). Default 0.7.",
    ),
) -> DetectResponse:
    if image.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported media type: {image.content_type}")

    raw = await image.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    model, source = get_model()
    t0 = time.perf_counter()
    results = model.predict(img, verbose=False, conf=conf, iou=iou)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    detections: list[Detection] = []
    if results:
        r = results[0]
        names = r.names if hasattr(r, "names") else model.names
        boxes = r.boxes
        if boxes is not None and len(boxes) > 0:
            xyxy = boxes.xyxy.cpu().numpy()
            confs = boxes.conf.cpu().numpy()
            clss = boxes.cls.cpu().numpy().astype(int)
            for i in range(len(boxes)):
                x1, y1, x2, y2 = xyxy[i].tolist()
                detections.append(
                    Detection(
                        id=f"D{i + 1}",
                        x=float(x1),
                        y=float(y1),
                        w=float(x2 - x1),
                        h=float(y2 - y1),
                        cls=str(names.get(clss[i], str(clss[i]))),
                        confidence=float(confs[i]),
                    )
                )

    return DetectResponse(
        image_width=img.width,
        image_height=img.height,
        model_source=source,
        inference_ms=round(elapsed_ms, 2),
        detections=detections,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=False,
    )

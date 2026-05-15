# Backend — Aircraft Defect Inspector (FastAPI + YOLOv8)

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
source .venv/bin/activate
python main.py
# → http://localhost:8000
```

Or with hot-reload:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health` — model load status and list of detectable classes
- `POST /detect` — multipart `image` field → JSON response

```bash
curl -F "image=@sample.jpg" http://localhost:8000/detect
```

Response:
```json
{
  "image_width": 1024,
  "image_height": 768,
  "model_source": "local:best.pt",
  "inference_ms": 142.3,
  "detections": [
    { "id": "D1", "x": 234, "y": 112, "w": 88, "h": 64, "class": "Rupture", "confidence": 0.87 }
  ]
}
```

## Swapping the model

The backend loads `backend/model/best.pt` at startup and refuses to start
without it. To use a different YOLOv8 detector:

```bash
cp /path/to/your/best.pt backend/model/best.pt
# restart the backend
```

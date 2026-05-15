"""
Download UTS Aircraft Defect Detection dataset from Roboflow Universe.

Reads API key from /Users/rapidbear/Desktop/PR/.roboflow_key (single line).
Saves dataset zip-extracted into /Users/rapidbear/Desktop/PR/dataset/.

Usage:
    python download_dataset.py [version_number]
        version_number: integer or 'latest' (default: latest)
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path("/Users/rapidbear/Desktop/PR")
KEY_FILE = ROOT / ".roboflow_key"
DATASET_DIR = ROOT / "dataset"

WORKSPACE = "university-of-technology-sydney-21uto"
PROJECT = "aircraft-defect-detection"


def load_api_key() -> str:
    if not KEY_FILE.exists():
        sys.exit(f"missing {KEY_FILE} — paste your Roboflow API key into that file (single line)")
    key = KEY_FILE.read_text(encoding="utf-8").strip()
    if not key:
        sys.exit(f"{KEY_FILE} is empty")
    return key


def main() -> None:
    api_key = load_api_key()
    version_arg = sys.argv[1] if len(sys.argv) > 1 else "latest"

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    os.chdir(DATASET_DIR)

    from roboflow import Roboflow

    print(f"[1/4] Authenticating with Roboflow…")
    rf = Roboflow(api_key=api_key)

    print(f"[2/4] Accessing workspace={WORKSPACE} project={PROJECT}")
    project = rf.workspace(WORKSPACE).project(PROJECT)

    versions = project.versions()
    print(f"      Available versions: {[v.version for v in versions]}")

    if version_arg == "latest":
        version_num = max(int(str(v.version).split('/')[-1]) for v in versions)
    else:
        version_num = int(version_arg)
    print(f"[3/4] Selected version: {version_num}")

    version = project.version(version_num)
    print(f"[4/4] Downloading YOLOv8 format → {DATASET_DIR}")
    dataset = version.download("yolov8")
    print(f"\n✅ Dataset ready at: {dataset.location}")
    print(f"   data.yaml: {Path(dataset.location) / 'data.yaml'}")


if __name__ == "__main__":
    main()

import type { DetectResponse } from "./types";

// Canned detections returned when MOCK=1 or the backend is unreachable.
// Coordinates are absolute pixel values; image_width / image_height
// describe the source frame so the canvas can scale boxes correctly.
// Classes follow the UTS Aircraft Defect Detection v3 model:
// "Dent", "Fastener Damage", "Rupture".
export const MOCK_DETECTIONS: DetectResponse = {
  image_width: 1280,
  image_height: 720,
  detections: [
    {
      id: "D1",
      class: "Dent",
      confidence: 0.87,
      x: 420,
      y: 310,
      w: 280,
      h: 180,
    },
    {
      id: "D2",
      class: "Fastener Damage",
      confidence: 0.74,
      x: 760,
      y: 220,
      w: 320,
      h: 60,
    },
    {
      id: "D3",
      class: "Rupture",
      confidence: 0.62,
      x: 210,
      y: 480,
      w: 160,
      h: 120,
    },
  ],
};

import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Landmark } from "@/types/detection";

// Standard MediaPipe 21 landmarks - keep local alias compatible with both types
export type HandLandmark = Landmark | NormalizedLandmark;

export const HAND_CONNECTIONS: readonly [number, number][] = [
  // Palm
  [0, 1],
  [0, 5],
  [0, 17],
  [5, 9],
  [9, 13],
  [13, 17],
  // Thumb
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [17, 18],
  [18, 19],
  [19, 20],
] as const;

/**
 * Compute the visible rect of the video content inside the element
 * when using object-fit: cover (or contain) to correctly map normalized
 * MediaPipe coords (which correspond to the intrinsic video frame) to
 * the displayed canvas.
 *
 * With object-fit: cover, the source video is scaled to cover the container
 * and cropped. With contain, it's letterboxed. We detect which mode by
 * comparing aspect ratios against the computed style.
 */
const objectFitCache = new WeakMap<HTMLElement, { value: string; time: number }>();
function getObjectFit(element: HTMLElement): string {
  const cached = objectFitCache.get(element);
  const now = performance.now();
  if (cached && now - cached.time < 500) return cached.value;
  const style = window.getComputedStyle(element);
  const value = style.objectFit || "cover";
  objectFitCache.set(element, { value, time: now });
  return value;
}

export function getDisplayedVideoRect(video: HTMLVideoElement): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cw = video.clientWidth;
  const ch = video.clientHeight;

  if (!vw || !vh || !cw || !ch) {
    return { x: 0, y: 0, w: cw, h: ch };
  }

  const fit = getObjectFit(video);
  const videoAR = vw / vh;
  const containerAR = cw / ch;

  if (fit === "contain") {
    // Letterboxed: one dimension fits, other centered
    if (containerAR > videoAR) {
      // container wider -> height fits, horizontal bars
      const w = ch * videoAR;
      const x = (cw - w) / 2;
      return { x, y: 0, w, h: ch };
    } else {
      const h = cw / videoAR;
      const y = (ch - h) / 2;
      return { x: 0, y, w: cw, h };
    }
  }

  // cover (default) and also "fill" fallback
  if (fit === "fill") {
    return { x: 0, y: 0, w: cw, h: ch };
  }

  // cover: scaled to fill, cropped
  if (containerAR > videoAR) {
    // container wider -> width fills, height cropped
    const h = cw / videoAR;
    const y = (ch - h) / 2;
    return { x: 0, y, w: cw, h };
  } else {
    const w = ch * videoAR;
    const x = (cw - w) / 2;
    return { x, y: 0, w, h: ch };
  }
}

/**
 * Synchronize canvas backing store to its displayed size and video rect.
 * Handles DPR for crisp rendering. Caller should call before each draw if
 * container may have resized. DPR capped at 2 for mobile memory/battery.
 */
export function resizeCanvasToVideo(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = video.getBoundingClientRect();
  // Canvas is absolute inset-0 sized to video's client size, so use clientWidth/Height
  // But to be precise, match the bounding rect size
  const displayWidth = Math.round(rect.width);
  const displayHeight = Math.round(rect.height);

  // Only resize if changed to avoid layout thrash
  const targetW = Math.round(displayWidth * dpr);
  const targetH = Math.round(displayHeight * dpr);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    // CSS size stays via class w-full h-full; ensure style matches
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
  }

  // Avoid scaling context multiple times; caller will set transform per draw
}

export function clearCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null
): void {
  if (!ctx) return;
  // Reset transform before clear
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawHandConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  rect: { x: number; y: number; w: number; h: number },
  mirrored: boolean
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(14, 165, 233, 0.35)";
  ctx.shadowBlur = 6;

  for (const [a, b] of HAND_CONNECTIONS) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    if (!lmA || !lmB) continue;

    const ax = rect.x + (mirrored ? 1 - lmA.x : lmA.x) * rect.w;
    const ay = rect.y + lmA.y * rect.h;
    const bx = rect.x + (mirrored ? 1 - lmB.x : lmB.x) * rect.w;
    const by = rect.y + lmB.y * rect.h;

    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  rect: { x: number; y: number; w: number; h: number },
  mirrored: boolean
): void {
  // Draw semi-transparent fill + border for visibility over blurred/bright backgrounds
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm) continue;
    const x = rect.x + (mirrored ? 1 - lm.x : lm.x) * rect.w;
    const y = rect.y + lm.y * rect.h;

    const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
    const isWrist = i === 0;
    const r = isTip ? 5 : isWrist ? 5 : 3.6;

    ctx.save();

    // outer glow
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = isTip
      ? "rgba(56, 189, 248, 0.18)"
      : "rgba(99, 102, 241, 0.14)";
    ctx.fill();

    // main dot
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    // fingertips slightly brighter white core, other joints sky/indigo tinted
    if (isTip) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.95)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (isWrist) {
      ctx.fillStyle = "rgba(251, 146, 60, 0.95)"; // amber for wrist distinguish
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(125, 211, 252, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "rgba(2, 6, 23, 0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function drawHand(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  landmarks: HandLandmark[],
  video: HTMLVideoElement,
  mirrored: boolean
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // Reset and apply DPR transform
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Clear in DPR-scaled space
  // Need to clear using scaled coords: canvas.width/dpr
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  const rect = getDisplayedVideoRect(video);
  // Draw connections first, then points on top
  drawHandConnections(ctx, landmarks, rect, mirrored);
  drawHandLandmarks(ctx, landmarks, rect, mirrored);
}

// --- Drawing canvas helpers ---

export function landmarkToCanvasPoint(
  landmark: HandLandmark,
  video: HTMLVideoElement,
  mirrored: boolean
): { x: number; y: number } {
  const rect = getDisplayedVideoRect(video);
  const x = rect.x + (mirrored ? 1 - landmark.x : landmark.x) * rect.w;
  const y = rect.y + landmark.y * rect.h;
  return { x, y };
}

export function resizeCanvasesToVideo(
  canvases: HTMLCanvasElement[],
  video: HTMLVideoElement
): void {
  canvases.forEach((c) => resizeCanvasToVideo(c, video));
}

export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  strokes: import("@/types/detection").Stroke[]
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  for (const stroke of strokes) {
    if (stroke.points.length < 2) {
      // single dot
      if (stroke.points.length === 1) {
        const p = stroke.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      }
      continue;
    }
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // smooth with quadratic interpolation
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const p = stroke.points[i];
      const next = stroke.points[i + 1];
      const mx = (p.x + next.x) / 2;
      const my = (p.y + next.y) / 2;
      ctx.quadraticCurveTo(p.x, p.y, mx, my);
    }
    const last = stroke.points[stroke.points.length - 1];
    const secondLast = stroke.points[stroke.points.length - 2];
    // handle last segment
    if (stroke.points.length === 2) {
      ctx.lineTo(last.x, last.y);
    } else {
      ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
    }
    ctx.stroke();
  }
}

export function drawCursor(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  pos: { x: number; y: number } | null,
  isDrawing: boolean,
  color: string
): void {
  if (!pos) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // cursor is drawn on landmark canvas after hand, so no clear here - caller handles
  // draw outer ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, isDrawing ? 8 : 10, 0, Math.PI * 2);
  ctx.strokeStyle = isDrawing ? color : "rgba(255,255,255,0.9)";
  ctx.lineWidth = isDrawing ? 2 : 1.8;
  ctx.stroke();
  if (isDrawing) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
  }
  ctx.restore();
}

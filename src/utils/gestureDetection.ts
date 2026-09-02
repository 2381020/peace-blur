import type { Landmark } from "@/types/detection";

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(dx, dy, dz);
}

function fingerExtended(
  landmarks: Landmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
  wristIdx = 0,
  eps = 0.02
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];
  const wrist = landmarks[wristIdx];
  if (!tip || !pip || !mcp || !wrist) return false;
  const tipToWrist = dist(tip, wrist);
  const pipToWrist = dist(pip, wrist);
  const tipToMcp = dist(tip, mcp);
  const pipToMcp = dist(pip, mcp);
  return tipToWrist > pipToWrist + eps && tipToMcp > pipToMcp + eps;
}

function getFingerState(landmarks: Landmark[]) {
  // thumb more forgiving
  return {
    t: fingerExtended(landmarks, 4, 3, 2, 0, 0.035),
    i: fingerExtended(landmarks, 8, 6, 5, 0, 0.02),
    m: fingerExtended(landmarks, 12, 10, 9, 0, 0.02),
    r: fingerExtended(landmarks, 16, 14, 13, 0, 0.02),
    p: fingerExtended(landmarks, 20, 18, 17, 0, 0.02),
  };
}

/** @deprecated kept for backwards compat — y-axis only */
export function fingerUp(landmarks: Landmark[], tipIdx: number, pipIdx: number): boolean {
  if (!landmarks[tipIdx] || !landmarks[pipIdx]) return false;
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

export function isPeaceSign(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { i, m, r, p } = getFingerState(landmarks);
  return i && m && !r && !p;
}
export function isPointing(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return i && !m && !r && !p && !t;
}
export function isOpenPalm(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return t && i && m && r && p;
}
export function isFist(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return !t && !i && !m && !r && !p;
}
export function isThumbsUp(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  if (!t || i || m || r || p) return false;
  const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  if (!thumbTip || !wrist) return false;
  return thumbTip.y < wrist.y - 0.05;
}
export function isMetal(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return i && p && !m && !r && !t;
}
export function isOkGesture(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  if (!thumbTip || !indexTip) return false;
  const d = dist(thumbTip, indexTip);
  if (d > 0.065) return false;
  const { m, r, p } = getFingerState(landmarks);
  return m && r && p;
}
export function isThumbOnly(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return t && !i && !m && !r && !p;
}
export function isMiddleOnly(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { i, m, r, p } = getFingerState(landmarks);
  return !i && m && !r && !p;
}
export function isPinkyOnly(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return !t && !i && !m && !r && p;
}
export function isTripleILY(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return t && !i && m && !r && p;
}
export function isThumbMiddle(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return t && !i && m && !r && !p;
}
export function isMiddlePinky(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return !t && !i && m && !r && p;
}
export function isThumbPinky(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;
  const { t, i, m, r, p } = getFingerState(landmarks);
  return t && !i && !m && !r && p;
}

// Unified scoring engine — picks highest confidence, not first-match
export function detectGesture(landmarks: Landmark[] | null | undefined): { gesture: import("@/types/detection").GestureType; confidence: number } {
  if (!landmarks || landmarks.length < 21) return { gesture: "none", confidence: 0 };
  const state = getFingerState(landmarks);
  const candidates: Array<{ g: import("@/types/detection").GestureType; ok: boolean; conf: number }> = [];

  const okDist = (() => {
    const a = landmarks[4];
    const b = landmarks[8];
    if (!a || !b) return 1;
    return dist(a, b);
  })();
  const okConf = okDist <= 0.065 ? 0.94 + (0.065 - okDist) * 1.2 : 0;

  candidates.push({ g: "fist", ok: isFist(landmarks), conf: 0.96 });
  candidates.push({ g: "palm", ok: isOpenPalm(landmarks), conf: 0.95 });
  candidates.push({ g: "ok", ok: isOkGesture(landmarks), conf: okConf });
  candidates.push({ g: "tripleILY", ok: isTripleILY(landmarks), conf: 0.96 });
  candidates.push({ g: "thumbMiddle", ok: isThumbMiddle(landmarks), conf: 0.95 });
  candidates.push({ g: "middlePinky", ok: isMiddlePinky(landmarks), conf: 0.95 });
  candidates.push({ g: "thumbPinky", ok: isThumbPinky(landmarks), conf: 0.95 });
  candidates.push({ g: "thumbOnly", ok: isThumbOnly(landmarks), conf: 0.93 });
  candidates.push({ g: "middleOnly", ok: isMiddleOnly(landmarks), conf: 0.93 });
  candidates.push({ g: "pinkyOnly", ok: isPinkyOnly(landmarks), conf: 0.93 });
  candidates.push({ g: "metal", ok: isMetal(landmarks), conf: 0.95 });
  candidates.push({ g: "peace", ok: isPeaceSign(landmarks), conf: 0.97 });
  candidates.push({ g: "point", ok: isPointing(landmarks), conf: 0.96 });
  candidates.push({ g: "thumbsup", ok: isThumbsUp(landmarks), conf: 0.93 });

  // priority tie-breaker for equal confidence
  const priority: Record<string, number> = {
    fist: 0, palm: 1, ok: 2, tripleILY: 3, thumbMiddle: 4, middlePinky: 5, thumbPinky: 6,
    thumbOnly: 7, middleOnly: 8, pinkyOnly: 9, metal: 10, peace: 11, point: 12, thumbsup: 13,
  };

  let best: { g: import("@/types/detection").GestureType; conf: number; p: number } | null = null;
  for (const c of candidates) {
    if (!c.ok) continue;
    const p = priority[c.g] ?? 99;
    if (!best || c.conf > best.conf + 0.005 || (Math.abs(c.conf - best.conf) <= 0.005 && p < best.p)) {
      best = { g: c.g, conf: c.conf, p };
    }
  }
  if (best) return { gesture: best.g, confidence: best.conf };
  return { gesture: "none", confidence: 0.5 };
}

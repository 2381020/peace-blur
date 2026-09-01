import type { Landmark } from "@/types/detection";

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.hypot(dx, dy, dz);
}

/**
 * Rotation-invariant finger extension check.
 * A finger is extended if its tip is farther from wrist AND from MCP
 * than its PIP is. Using distances makes it work at 90°, 45°, inverted, etc.
 * Previously only checked tip.y < pip.y which fails when hand is rotated sideways.
 */
function fingerExtended(
  landmarks: Landmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
  wristIdx = 0
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

  // epsilon to avoid noise when finger is barely bent
  const EPS = 0.02;
  // extended if tip is farther than pip from both wrist and mcp
  return tipToWrist > pipToWrist + EPS && tipToMcp > pipToMcp + EPS;
}

/** @deprecated kept for backwards compat / testing — y-axis only */
export function fingerUp(landmarks: Landmark[], tipIdx: number, pipIdx: number): boolean {
  if (!landmarks[tipIdx] || !landmarks[pipIdx]) return false;
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

/**
 * Determines if the hand is showing a peace sign ✌️
 * Index + Middle extended, Ring + Pinky folded.
 * Rotation-invariant: uses radial distance from wrist/MCP instead of y-axis only,
 * so it works when hand is rotated 90° sideways.
 * Preserves original Python logic: index_up && middle_up && !ring_up && !pinky_up
 */
export function isPeaceSign(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const indexUp = fingerExtended(landmarks, 8, 6, 5);
  const middleUp = fingerExtended(landmarks, 12, 10, 9);
  const ringUp = fingerExtended(landmarks, 16, 14, 13);
  const pinkyUp = fingerExtended(landmarks, 20, 18, 17);

  return indexUp && middleUp && !ringUp && !pinkyUp;
}

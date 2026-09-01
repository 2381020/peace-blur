import type { Landmark } from "@/types/detection";

/**
 * Checks if a finger is extended by comparing tip vs PIP y-coordinates.
 * In MediaPipe normalized coordinates, y increases downward,
 * so tip.y < pip.y means finger is up.
 */
function fingerUp(landmarks: Landmark[], tipIdx: number, pipIdx: number): boolean {
  if (!landmarks[tipIdx] || !landmarks[pipIdx]) return false;
  return landmarks[tipIdx].y < landmarks[pipIdx].y;
}

/**
 * Determines if the hand is showing a peace sign ✌️
 * Index + Middle UP, Ring + Pinky DOWN
 * Preserves original Python logic:
 *   index_up = finger_up(8, 6)
 *   middle_up = finger_up(12, 10)
 *   ring_up = finger_up(16, 14)
 *   pinky_up = finger_up(20, 18)
 *   peace = index_up and middle_up and not ring_up and not pinky_up
 */
export function isPeaceSign(landmarks: Landmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const indexUp = fingerUp(landmarks, 8, 6);
  const middleUp = fingerUp(landmarks, 12, 10);
  const ringUp = fingerUp(landmarks, 16, 14);
  const pinkyUp = fingerUp(landmarks, 20, 18);

  return indexUp && middleUp && !ringUp && !pinkyUp;
}

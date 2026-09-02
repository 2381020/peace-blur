export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface DetectionState {
  handDetected: boolean;
  peaceDetected: boolean;
}

export type CameraState = "off" | "starting" | "active" | "error";

export type GestureType = "none" | "point" | "peace" | "palm" | "fist" | "thumbsup" | "metal" | "ok" | "thumbOnly" | "middleOnly" | "pinkyOnly" | "tripleILY" | "thumbMiddle" | "middlePinky" | "thumbPinky";

export interface OverlayLabel {
  word: string;
  pos: Point;
}

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  label: string;
  action: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface CameraError {
  message: string;
  type: "permission" | "notfound" | "unsupported" | "mediapipe" | "unknown";
}

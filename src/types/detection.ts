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

export interface CameraError {
  message: string;
  type: "permission" | "notfound" | "unsupported" | "mediapipe" | "unknown";
}

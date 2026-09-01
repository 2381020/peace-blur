import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { isPeaceSign } from "@/utils/gestureDetection";
import type { CameraError } from "@/types/detection";
import { resizeCanvasToVideo, drawHand, clearCanvas } from "@/utils/handDrawing";

interface UseHandDetectionReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  isStarting: boolean;
  handDetected: boolean;
  peaceDetected: boolean;
  error: CameraError | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useHandDetection(): UseHandDetectionReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [peaceDetected, setPeaceDetected] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);

  const initHandLandmarker = useCallback(async () => {
    if (initializedRef.current && handLandmarkerRef.current) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const e = new Error("offline");
      setError({ message: "You are offline. Connect to the internet to load hand detection, then click Try Again.", type: "mediapipe" });
      throw e;
    }

    const wasmBases = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm",
      "https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm",
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    ];
    const delegates: Array<"GPU" | "CPU"> = ["GPU", "CPU"];

    let lastErr: unknown = null;

    for (const base of wasmBases) {
      for (const delegate of delegates) {
        try {
          const vision = await FilesetResolver.forVisionTasks(base);
          handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate,
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          initializedRef.current = true;
          return;
        } catch (err) {
          lastErr = err;
          const isEvent = err instanceof Event && (err as Event).type === "error";
          console.warn(`[PeaceBlur] HandLandmarker init failed base=${base} delegate=${delegate}`, err);
          // Try next combination if it's a network/script load error or GPU error
          if (isEvent || (err instanceof Error && /wasm|cdn|network|fetch|load|gpu/i.test(err.message))) {
            continue;
          }
          // For unknown errors, also try next fallback
          continue;
        }
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : lastErr instanceof Event ? "Network error loading MediaPipe (check internet / AdBlock)" : "Failed to initialize";
    const friendly = /offline/i.test(msg) ? msg : `Failed to load hand detection. Check your internet / disable AdBlock and click Try Again. (${msg})`;
    setError({ message: friendly, type: "mediapipe" });
    throw new Error(friendly);
  }, []);

  const clearOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      clearCanvas(canvas, ctx);
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
  }, []);

  const stopCameraInternal = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    clearOverlay();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraActive(false);
    setHandDetected(false);
    setPeaceDetected(false);
  }, [clearOverlay]);

  const drawOverlay = useCallback((landmarks: import("@mediapipe/tasks-vision").NormalizedLandmark[] | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d");
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Sync canvas size to displayed video size
    resizeCanvasToVideo(canvas, video);

    if (!landmarks || landmarks.length === 0) {
      clearCanvas(canvas, ctx);
      // need to re-apply DPR transform after clear
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      return;
    }

    // mirrored because video uses scale-x-[-1]
    drawHand(ctx, canvas, landmarks, video, true);
  }, []);

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    try {
      const result = landmarker.detectForVideo(video, performance.now());
      const landmarks = result.landmarks?.[0];
      if (landmarks && landmarks.length > 0) {
        setHandDetected(true);
        setPeaceDetected(isPeaceSign(landmarks));
        drawOverlay(landmarks);
      } else {
        setHandDetected(false);
        setPeaceDetected(false);
        drawOverlay(null);
      }
    } catch {
      // keep loop alive even on single frame error
    }
    animationRef.current = requestAnimationFrame(detectLoop);
  }, [drawOverlay]);

  const startCamera = useCallback(async () => {
    setError(null);

    if (!window.isSecureContext) {
      setError({
        message: "Camera requires a secure context (HTTPS or localhost). Please open via https:// or http://localhost and not as a file://.",
        type: "unsupported",
      });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError({
        message: "Your browser does not support camera access. Please use a modern browser (Chrome, Edge, Firefox).",
        type: "unsupported",
      });
      return;
    }

    setIsStarting(true);
    try {
      await initHandLandmarker();

      const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile
          ? {
              facingMode: "user",
            }
          : {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              aspectRatio: { ideal: 16 / 9 },
            },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      setCameraActive(true);
      setHandDetected(false);
      setPeaceDetected(false);
      animationRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      console.error("[PeaceBlur] getUserMedia / MediaPipe error:", err);

      // If this is a MediaPipe init error, it already set a friendly message — don't overwrite
      const isMediaPipeErr =
        (err instanceof Error && /hand detection|Failed to load hand detection|offline/i.test(err.message)) ||
        (err instanceof Event && (err as Event).type === "error");
      if (isMediaPipeErr) {
        // error already set inside initHandLandmarker
        stopCameraInternal();
        setIsStarting(false);
        return;
      }
      if (err instanceof Error && err.message.includes("hand detection")) {
        stopCameraInternal();
        setIsStarting(false);
        return;
      }

      let cameraError: CameraError = {
        message: "Unable to access your camera. Make sure your camera is connected and not being used by another application.",
        type: "unknown",
      };
      const name = err instanceof DOMException || err instanceof Error ? err.name : "";
      const msg = err instanceof Error ? err.message.toLowerCase() : "";

      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError" || msg.includes("permission") || msg.includes("denied")) {
        cameraError = {
          message: "Camera permission was denied. Click the lock icon in your address bar → Allow camera, then click Try Again. (Also check Windows Settings → Privacy → Camera).",
          type: "permission",
        };
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") {
        cameraError = {
          message: "No camera found. Make sure your camera is connected and not disabled.",
          type: "notfound",
        };
      } else if (name === "NotReadableError" || name === "AbortError") {
        cameraError = {
          message: "Camera is in use by another app (Zoom/Teams/OBS) or permission was not granted. Close other apps and click Try Again.",
          type: "notfound",
        };
      } else if (!window.isSecureContext) {
        cameraError = {
          message: "Camera requires HTTPS or localhost. Please open via https:// or http://localhost:8080.",
          type: "unsupported",
        };
      }
      setError(cameraError);
      stopCameraInternal();
    } finally {
      setIsStarting(false);
    }
  }, [detectLoop, initHandLandmarker, stopCameraInternal]);

  const stopCamera = useCallback(() => {
    stopCameraInternal();
  }, [stopCameraInternal]);

  // Handle resize / orientation change - keep canvas aligned
  useEffect(() => {
    if (!cameraActive) return;
    const onResize = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) resizeCanvasToVideo(canvas, video);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && videoRef.current) {
      ro = new ResizeObserver(onResize);
      ro.observe(videoRef.current);
      if (canvasRef.current) ro.observe(canvasRef.current);
    }
    const onMetadata = () => onResize();
    const v = videoRef.current;
    v?.addEventListener("loadedmetadata", onMetadata);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      v?.removeEventListener("loadedmetadata", onMetadata);
      if (ro) ro.disconnect();
    };
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (handLandmarkerRef.current) {
        try {
          handLandmarkerRef.current.close();
        } catch {
          // ignore
        }
        handLandmarkerRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);

  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    cameraActive,
    isStarting,
    handDetected,
    peaceDetected,
    error,
    startCamera,
    stopCamera,
  };
}

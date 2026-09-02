import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { isPeaceSign, detectGesture } from "@/utils/gestureDetection";
import type { CameraError, GestureType, Stroke, Point, OverlayLabel } from "@/types/detection";
import { resizeCanvasToVideo, drawHand, clearCanvas, landmarkToCanvasPoint, drawStrokes, drawCursor } from "@/utils/handDrawing";

interface UseHandDetectionReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  drawingCanvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  isStarting: boolean;
  handDetected: boolean;
  peaceDetected: boolean;
  blurActive: boolean;
  gesture: GestureType;
  gestureLabel: string;
  gestureAction: string;
  confidence: number;
  isDrawing: boolean;
  cursorPos: Point | null;
  brushColor: string;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
  captureImage: string | null;
  overlayWord: string | null;
  overlayPos: Point | null;
  overlayLabels: OverlayLabel[] | null;
  error: CameraError | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  setBrushColor: (c: string) => void;
  setBrushSize: (n: number) => void;
  clearDrawing: () => void;
  undo: () => void;
  redo: () => void;
  capture: () => void;
  dismissCapture: () => void;
}

export function useHandDetection(): UseHandDetectionReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  const initializedRef = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [peaceDetected, setPeaceDetected] = useState(false);
  const [blurActive, setBlurActive] = useState(false);
  const [gesture, setGesture] = useState<GestureType>("none");
  const [gestureLabel, setGestureLabel] = useState("None");
  const [gestureAction, setGestureAction] = useState("—");
  const [confidence, setConfidence] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [brushColor, setBrushColor] = useState("#38bdf8");
  const [brushSize, setBrushSize] = useState(4);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [captureImage, setCaptureImage] = useState<string | null>(null);
  const [overlayWord, setOverlayWord] = useState<string | null>(null);
  const [overlayPos, setOverlayPos] = useState<Point | null>(null);
  const [overlayLabels, setOverlayLabels] = useState<OverlayLabel[] | null>(null);

  // refs for real-time mutable state — controllers separated
  const brushColorRef = useRef(brushColor);
  const brushSizeRef = useRef(brushSize);
  const strokesRef = useRef<Stroke[]>([]);
  const redoRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const smoothedRef = useRef<Point | null>(null); // for drawing tip 8
  const smoothedTipsRef = useRef<Map<number, Point>>(new Map()); // per-finger smoothed positions for overlay
  const lastRawRef = useRef<Point | null>(null);
  const cursorRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const gestureRef = useRef<GestureType>("none");
  const lastFistClearRef = useRef(0);
  const lastCaptureRef = useRef(0);
  const lastWordRef = useRef(0);
  const peaceStableRef = useRef(0);
  const noPeaceStableRef = useRef(0);
  const handLossFramesRef = useRef(0);
  const gestureStableRef = useRef<{ g: GestureType; count: number }>({ g: "none", count: 0 });
  const overlayWordTimeoutRef = useRef<number | null>(null);
  const overlayWordRef = useRef<string | null>(null);
  const overlayPosRef = useRef<Point | null>(null);
  const overlayLabelsRef = useRef<OverlayLabel[] | null>(null);

  useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const syncUndoRedo = useCallback(() => {
    setCanUndo(strokesRef.current.length > 0 || currentStrokeRef.current !== null);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  const redrawDrawingCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    if (!drawingCtxRef.current) drawingCtxRef.current = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D | null;
    const ctx = drawingCtxRef.current;
    if (!ctx) return;
    resizeCanvasToVideo(canvas, video);
    const all = currentStrokeRef.current ? [...strokesRef.current, currentStrokeRef.current] : strokesRef.current;
    drawStrokes(ctx, canvas, all);
  }, []);

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
          if (isEvent || (err instanceof Error && /wasm|cdn|network|fetch|load|gpu/i.test(err.message))) {
            continue;
          }
          continue;
        }
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : lastErr instanceof Event ? "Network error loading MediaPipe (check internet / AdBlock)" : "Failed to initialize";
    const friendly = /offline/i.test(msg) ? msg : `Failed to load hand detection. Check your internet / disable AdBlock and click Try Again. (${msg})`;
    setError({ message: friendly, type: "mediapipe" });
    throw new Error(friendly);
  }, []);

  const lastVideoTimeRef = useRef<number>(-1);
  const lastProcessTimeRef = useRef<number>(0);

  const clearOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
      clearCanvas(canvas, ctx);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    const dcanvas = drawingCanvasRef.current;
    const dctx = drawingCtxRef.current;
    if (dcanvas && dctx) {
      clearCanvas(dcanvas, dctx);
    }
  }, []);

  const clearDrawing = useCallback(() => {
    strokesRef.current = [];
    redoRef.current = [];
    currentStrokeRef.current = null;
    smoothedRef.current = null;
    lastRawRef.current = null;
    isDrawingRef.current = false;
    setIsDrawing(false);
    syncUndoRedo();
    const c = drawingCanvasRef.current;
    const ctx = drawingCtxRef.current;
    if (c && ctx) {
      clearCanvas(c, ctx);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, c.width / dpr, c.height / dpr);
    } else {
      redrawDrawingCanvas();
    }
  }, [redrawDrawingCanvas, syncUndoRedo]);

  const undo = useCallback(() => {
    if (currentStrokeRef.current) {
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
      setIsDrawing(false);
      smoothedRef.current = null;
    } else if (strokesRef.current.length > 0) {
      const last = strokesRef.current.pop()!;
      redoRef.current.push(last);
    }
    syncUndoRedo();
    redrawDrawingCanvas();
  }, [redrawDrawingCanvas, syncUndoRedo]);

  const redo = useCallback(() => {
    if (redoRef.current.length > 0) {
      const r = redoRef.current.pop()!;
      strokesRef.current.push(r);
      syncUndoRedo();
      redrawDrawingCanvas();
    }
  }, [redrawDrawingCanvas, syncUndoRedo]);

  const OVERLAY_DEBOUNCE = 350;
  const OVERLAY_TTL_WORD = 1600;
  const OVERLAY_TTL_LABELS = 1800;

  const getSmoothedTip = useCallback((idx: number, raw: Point): Point => {
    const m = smoothedTipsRef.current;
    const prev = m.get(idx);
    if (!prev) {
      m.set(idx, { ...raw });
      return { ...raw };
    }
    const alpha = 0.35;
    const next = { x: prev.x * (1 - alpha) + raw.x * alpha, y: prev.y * (1 - alpha) + raw.y * alpha };
    m.set(idx, next);
    return { ...next };
  }, []);

  const showOverlayWord = useCallback((word: string, pos?: Point | null) => {
    const now = performance.now();
    const smoothedPos = pos ? getSmoothedTip(-1, pos) : null; // reuse map slot -1 for single word anchor
    if (now - lastWordRef.current < OVERLAY_DEBOUNCE) {
      if (smoothedPos) {
        overlayPosRef.current = smoothedPos;
        setOverlayPos({ ...smoothedPos });
      }
      // allow word change even within debounce if different
      if (overlayWordRef.current !== word) {
        overlayWordRef.current = word;
        setOverlayWord(word);
      }
      return;
    }
    lastWordRef.current = now;
    overlayWordRef.current = word;
    setOverlayWord(word);
    overlayLabelsRef.current = null;
    setOverlayLabels(null);
    if (smoothedPos) {
      overlayPosRef.current = smoothedPos;
      setOverlayPos({ ...smoothedPos });
    } else {
      overlayPosRef.current = null;
      setOverlayPos(null);
    }
    if (overlayWordTimeoutRef.current) window.clearTimeout(overlayWordTimeoutRef.current);
    overlayWordTimeoutRef.current = window.setTimeout(() => {
      overlayWordRef.current = null;
      overlayPosRef.current = null;
      setOverlayWord(null);
      setOverlayPos(null);
    }, OVERLAY_TTL_WORD);
  }, [getSmoothedTip]);

  const showOverlayLabels = useCallback((labels: OverlayLabel[]) => {
    // smooth each label position
    const smoothed = labels.map((l) => {
      // use word hash as key: I->4, LOVE->12, YOU->20
      const key = l.word === "I" ? 4 : l.word === "LOVE" ? 12 : 20;
      return { word: l.word, pos: getSmoothedTip(key, l.pos) };
    });
    const now = performance.now();
    if (now - lastWordRef.current < OVERLAY_DEBOUNCE) {
      overlayLabelsRef.current = smoothed;
      setOverlayLabels([...smoothed]);
      return;
    }
    lastWordRef.current = now;
    overlayLabelsRef.current = smoothed;
    setOverlayLabels([...smoothed]);
    overlayWordRef.current = null;
    overlayPosRef.current = null;
    setOverlayWord(null);
    setOverlayPos(null);
    if (overlayWordTimeoutRef.current) window.clearTimeout(overlayWordTimeoutRef.current);
    overlayWordTimeoutRef.current = window.setTimeout(() => {
      overlayLabelsRef.current = null;
      setOverlayLabels(null);
    }, OVERLAY_TTL_LABELS);
  }, [getSmoothedTip]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const lCanvas = canvasRef.current;
    const dCanvas = drawingCanvasRef.current;
    if (!video) return;
    const rect = video.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w === 0 || h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const off = document.createElement("canvas");
    off.width = Math.round(w * dpr);
    off.height = Math.round(h * dpr);
    const ctx = off.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw && vh) {
        const videoAR = vw / vh;
        const containerAR = w / h;
        let sx = 0, sy = 0, sw = vw, sh = vh;
        if (containerAR > videoAR) {
          sh = vw / containerAR;
          sy = (vh - sh) / 2;
        } else {
          sw = vh * containerAR;
          sx = (vw - sw) / 2;
        }
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sw, sh, -w, 0, w, h);
        ctx.restore();
      } else {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -w, 0, w, h);
        ctx.restore();
      }
    } catch {
      try {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -w, 0, w, h);
        ctx.restore();
      } catch { /* ignore */ }
    }
    if (blurActive) {
      ctx.fillStyle = "rgba(14,165,233,0.08)";
      ctx.fillRect(0, 0, w, h);
    }
    if (dCanvas) ctx.drawImage(dCanvas, 0, 0, w, h);
    if (lCanvas) ctx.drawImage(lCanvas, 0, 0, w, h);
    const word = overlayWordRef.current;
    const pos = overlayPosRef.current;
    const labels = overlayLabelsRef.current;
    if (labels && labels.length > 0) {
      for (const lab of labels) {
        const cx = Math.max(18, Math.min(w - 18, lab.pos.x));
        const cy = Math.max(18, lab.pos.y - 30);
        ctx.save();
        ctx.font = `900 ${Math.round(w * 0.045)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(56,189,248,0.85)";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 5;
        ctx.strokeText(lab.word, cx, cy);
        ctx.fillText(lab.word, cx, cy);
        ctx.restore();
      }
    } else if (word) {
      ctx.save();
      const isSmall = word === "I" || word === "LOVE" || word === "YOU";
      const fontSize = isSmall ? Math.round(w * 0.055) : Math.round(w * 0.07);
      ctx.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(56,189,248,0.9)";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 6;
      const cx = pos ? Math.max(30, Math.min(w - 30, pos.x)) : w / 2;
      const cy = pos ? Math.max(24, pos.y - 36) : h / 2;
      ctx.strokeText(word, cx, cy);
      ctx.fillText(word, cx, cy);
      ctx.restore();
    }
    const url = off.toDataURL("image/png");
    setCaptureImage(url);
  }, [blurActive]);

  const dismissCapture = useCallback(() => setCaptureImage(null), []);

  const stopCameraInternal = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    clearOverlay();
    if (overlayWordTimeoutRef.current) window.clearTimeout(overlayWordTimeoutRef.current);
    overlayWordRef.current = null;
    overlayPosRef.current = null;
    overlayLabelsRef.current = null;
    setOverlayWord(null);
    setOverlayPos(null);
    setOverlayLabels(null);
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
    setBlurActive(false);
    setGesture("none");
    setGestureLabel("None");
    setGestureAction("—");
    setConfidence(0);
    setIsDrawing(false);
    isDrawingRef.current = false;
    cursorRef.current = null;
    setCursorPos(null);
    smoothedRef.current = null;
    lastRawRef.current = null;
    currentStrokeRef.current = null;
    peaceStableRef.current = 0;
    noPeaceStableRef.current = 0;
    handLossFramesRef.current = 0;
  }, [clearOverlay]);

  const clearOverlayTexts = useCallback(() => {
    if (overlayWordTimeoutRef.current) window.clearTimeout(overlayWordTimeoutRef.current);
    overlayWordTimeoutRef.current = null;
    overlayWordRef.current = null;
    overlayPosRef.current = null;
    overlayLabelsRef.current = null;
    setOverlayWord(null);
    setOverlayPos(null);
    setOverlayLabels(null);
  }, []);

  const drawOverlay = useCallback((landmarks: import("@mediapipe/tasks-vision").NormalizedLandmark[] | null) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const dCanvas = drawingCanvasRef.current;
    if (!canvas || !video) return;
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D | null;
    }
    if (dCanvas && !drawingCtxRef.current) {
      drawingCtxRef.current = dCanvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D | null;
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    resizeCanvasToVideo(canvas, video);
    if (dCanvas) resizeCanvasToVideo(dCanvas, video);
    if (dCanvas && drawingCtxRef.current) {
      const all = currentStrokeRef.current ? [...strokesRef.current, currentStrokeRef.current] : strokesRef.current;
      drawStrokes(drawingCtxRef.current, dCanvas, all);
    }

    if (!landmarks || landmarks.length === 0) {
      clearCanvas(canvas, ctx);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      // teks langsung hilang saat tangan tidak terdeteksi
      clearOverlayTexts();
      handLossFramesRef.current += 1;
      if (handLossFramesRef.current > 10) {
        if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
          strokesRef.current.push(currentStrokeRef.current);
          redoRef.current = [];
          syncUndoRedo();
        }
        currentStrokeRef.current = null;
        isDrawingRef.current = false;
        setIsDrawing(false);
        cursorRef.current = null;
        setCursorPos(null);
      }
      return;
    }
    handLossFramesRef.current = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    drawHand(ctx, canvas, landmarks, video, true);
    if (cursorRef.current) {
      drawCursor(ctx, canvas, cursorRef.current, isDrawingRef.current, brushColorRef.current);
    }
  }, [syncUndoRedo, clearOverlayTexts]);

  const updateGestureStatus = useCallback((g: GestureType, conf: number) => {
    gestureRef.current = g;
    setGesture(g);
    setConfidence(Math.round(conf * 100));
    const map: Record<GestureType, { label: string; action: string }> = {
      none: { label: "None", action: "—" },
      point: { label: "☝️ Drawing", action: "Air Drawing" },
      peace: { label: "✌️ Peace", action: "Blur Active" },
      palm: { label: "✋ Palm", action: "Drawing Paused" },
      fist: { label: "✊ Fist", action: "Clear" },
      thumbsup: { label: "👍 Thumbs Up", action: "Capture" },
      metal: { label: "🤘 Metal", action: "I Love You" },
      ok: { label: "👌 OK", action: "Capture" },
      thumbOnly: { label: "👍 I", action: "I" },
      middleOnly: { label: "🖕 LOVE", action: "LOVE" },
      pinkyOnly: { label: "🤙 YOU", action: "YOU" },
      tripleILY: { label: "🤟 I LOVE YOU", action: "I LOVE YOU" },
      thumbMiddle: { label: "👍🖕 I LOVE", action: "I LOVE" },
      middlePinky: { label: "🖕🤙 LOVE YOU", action: "LOVE YOU" },
      thumbPinky: { label: "👍🤙 I YOU", action: "I YOU" },
    };
    const m = map[g] ?? map.none;
    setGestureLabel(m.label);
    setGestureAction(m.action);
  }, []);

  const detectLoop = useCallback(() => {
    const video = videoRef.current;
    const landmarker = handLandmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    const now = performance.now();
    if (video.currentTime === lastVideoTimeRef.current) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    if (now - lastProcessTimeRef.current < 28) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    if (typeof document !== "undefined" && document.hidden) {
      animationRef.current = requestAnimationFrame(detectLoop);
      return;
    }
    lastVideoTimeRef.current = video.currentTime;
    lastProcessTimeRef.current = now;
    try {
      const result = landmarker.detectForVideo(video, now);
      const landmarks = result.landmarks?.[0];
      if (landmarks && landmarks.length > 0) {
        setHandDetected(true);
        const rawPeace = isPeaceSign(landmarks);
        // debounce blur with hysteresis
        if (rawPeace) {
          peaceStableRef.current += 1;
          noPeaceStableRef.current = 0;
          if (peaceStableRef.current >= 2) {
            setPeaceDetected(true);
            setBlurActive(true);
          }
        } else {
          noPeaceStableRef.current += 1;
          peaceStableRef.current = 0;
          if (noPeaceStableRef.current >= 4) {
            setPeaceDetected(false);
            setBlurActive(false);
          }
        }

        const { gesture: detected, confidence: conf } = detectGesture(landmarks as unknown as import("@/types/detection").Landmark[]);
        // uniform stabilization — 2 frames for all gestures (no special case for point)
        if (gestureStableRef.current.g === detected) {
          gestureStableRef.current.count += 1;
        } else {
          gestureStableRef.current = { g: detected, count: 1 };
        }
        const STABLE_THRESHOLD = 2;
        const effectiveGesture = gestureStableRef.current.count >= STABLE_THRESHOLD ? detected : gestureRef.current;
        if (effectiveGesture !== gestureRef.current) {
          updateGestureStatus(effectiveGesture, conf);
        } else {
          setConfidence(Math.round(conf * 100));
        }

        // handle gestures
        const g = effectiveGesture;

        // fingertip position for cursor/drawing
        const tip = landmarks[8];
        if (tip) {
          const pt = landmarkToCanvasPoint(tip as unknown as import("@/types/detection").Landmark, video, true);
          // smooth
          if (!smoothedRef.current) smoothedRef.current = { ...pt };
          else {
            const alpha = 0.35;
            smoothedRef.current.x = smoothedRef.current.x * (1 - alpha) + pt.x * alpha;
            smoothedRef.current.y = smoothedRef.current.y * (1 - alpha) + pt.y * alpha;
          }
          // jitter threshold
          const last = lastRawRef.current;
          const dx = last ? pt.x - last.x : 999;
          const dy = last ? pt.y - last.y : 999;
          const dist = Math.hypot(dx, dy);
          lastRawRef.current = pt;
          const smoothedPt = { ...smoothedRef.current };

          if (g === "point") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (!isDrawingRef.current) {
              currentStrokeRef.current = { points: [{ ...smoothedPt }], color: brushColorRef.current, width: brushSizeRef.current };
              isDrawingRef.current = true;
              setIsDrawing(true);
            } else if (currentStrokeRef.current) {
              const pts = currentStrokeRef.current.points;
              const lastP = pts[pts.length - 1];
              const d = Math.hypot(smoothedPt.x - lastP.x, smoothedPt.y - lastP.y);
              if (d > 1.2) {
                if (dist > 80) {
                  if (pts.length >= 1) {
                    strokesRef.current.push(currentStrokeRef.current);
                    redoRef.current = [];
                    syncUndoRedo();
                  }
                  currentStrokeRef.current = { points: [{ ...smoothedPt }], color: brushColorRef.current, width: brushSizeRef.current };
                } else {
                  pts.push({ ...smoothedPt });
                }
              }
            }
          } else if (g === "palm") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              redoRef.current = [];
              syncUndoRedo();
              currentStrokeRef.current = null;
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
          } else if (g === "fist") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const nowMs = performance.now();
            if (nowMs - lastFistClearRef.current > 900) {
              lastFistClearRef.current = nowMs;
              strokesRef.current = [];
              redoRef.current = [];
              syncUndoRedo();
              const dc = drawingCanvasRef.current;
              const dctx = drawingCtxRef.current;
              if (dc && dctx) {
                clearCanvas(dc, dctx);
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                dctx.clearRect(0, 0, dc.width / dpr, dc.height / dpr);
              }
            }
          } else if (g === "ok" || g === "thumbsup") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              redoRef.current = [];
              syncUndoRedo();
              currentStrokeRef.current = null;
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const nowMs = performance.now();
            if (nowMs - lastCaptureRef.current > 1800) {
              lastCaptureRef.current = nowMs;
              setTimeout(() => capture(), 120);
            }
          } else if (g === "tripleILY") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const posThumb = landmarkToCanvasPoint(landmarks[4] as unknown as import("@/types/detection").Landmark, video, true);
            const posMid = landmarkToCanvasPoint(landmarks[12] as unknown as import("@/types/detection").Landmark, video, true);
            const posPinky = landmarkToCanvasPoint(landmarks[20] as unknown as import("@/types/detection").Landmark, video, true);
            showOverlayLabels([
              { word: "I", pos: posThumb },
              { word: "LOVE", pos: posMid },
              { word: "YOU", pos: posPinky },
            ]);
          } else if (g === "thumbMiddle") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const posThumb = landmarkToCanvasPoint(landmarks[4] as unknown as import("@/types/detection").Landmark, video, true);
            const posMid = landmarkToCanvasPoint(landmarks[12] as unknown as import("@/types/detection").Landmark, video, true);
            const mid = { x: (posThumb.x + posMid.x) / 2, y: Math.min(posThumb.y, posMid.y) };
            showOverlayWord("I LOVE", mid);
          } else if (g === "middlePinky") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const posMid = landmarkToCanvasPoint(landmarks[12] as unknown as import("@/types/detection").Landmark, video, true);
            const posPinky = landmarkToCanvasPoint(landmarks[20] as unknown as import("@/types/detection").Landmark, video, true);
            const mid = { x: (posMid.x + posPinky.x) / 2, y: Math.min(posMid.y, posPinky.y) };
            showOverlayWord("LOVE YOU", mid);
          } else if (g === "thumbPinky") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const posThumb = landmarkToCanvasPoint(landmarks[4] as unknown as import("@/types/detection").Landmark, video, true);
            const posPinky = landmarkToCanvasPoint(landmarks[20] as unknown as import("@/types/detection").Landmark, video, true);
            const mid = { x: (posThumb.x + posPinky.x) / 2, y: Math.min(posThumb.y, posPinky.y) };
            showOverlayWord("I YOU", mid);
          } else if (g === "thumbOnly") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const tipPos = landmarkToCanvasPoint(landmarks[4] as unknown as import("@/types/detection").Landmark, video, true);
            showOverlayWord("I", tipPos);
          } else if (g === "middleOnly") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const tipPos = landmarkToCanvasPoint(landmarks[12] as unknown as import("@/types/detection").Landmark, video, true);
            showOverlayWord("LOVE", tipPos);
          } else if (g === "pinkyOnly") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const tipPos = landmarkToCanvasPoint(landmarks[20] as unknown as import("@/types/detection").Landmark, video, true);
            showOverlayWord("YOU", tipPos);
          } else if (g === "metal") {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
              strokesRef.current.push(currentStrokeRef.current);
              currentStrokeRef.current = null;
              syncUndoRedo();
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
            const tipA = landmarkToCanvasPoint(landmarks[8] as unknown as import("@/types/detection").Landmark, video, true);
            const tipB = landmarkToCanvasPoint(landmarks[20] as unknown as import("@/types/detection").Landmark, video, true);
            const midPos = { x: (tipA.x + tipB.x) / 2, y: Math.min(tipA.y, tipB.y) };
            showOverlayWord("I LOVE YOU", midPos);
          } else {
            cursorRef.current = smoothedPt;
            setCursorPos({ ...smoothedPt });
            if (currentStrokeRef.current) {
              if (currentStrokeRef.current.points.length >= 1) {
                strokesRef.current.push(currentStrokeRef.current);
                redoRef.current = [];
                syncUndoRedo();
              }
              currentStrokeRef.current = null;
            }
            isDrawingRef.current = false;
            setIsDrawing(false);
          }
        }

        drawOverlay(landmarks);
      } else {
        setHandDetected(false);
        // blur decays slower when hand lost
        noPeaceStableRef.current += 1;
        if (noPeaceStableRef.current >= 8) {
          setPeaceDetected(false);
          setBlurActive(false);
        }
        if (gestureRef.current !== "none") {
          if (handLossFramesRef.current > 10) updateGestureStatus("none", 0);
        }
        drawOverlay(null);
      }
    } catch {
      // keep loop alive even on single frame error
    }
    animationRef.current = requestAnimationFrame(detectLoop);
  }, [capture, drawOverlay, showOverlayWord, syncUndoRedo, updateGestureStatus]);

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

      const tryGetUserMedia = async (): Promise<MediaStream> => {
        const attempts: Array<MediaStreamConstraints> = isMobile
          ? [
              { video: { facingMode: "user", width: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }, audio: false },
              { video: { facingMode: { ideal: "user" } }, audio: false },
              { video: true, audio: false },
            ]
          : [
              { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: { ideal: 16 / 9 } }, audio: false },
              { video: { facingMode: { ideal: "user" } }, audio: false },
              { video: true, audio: false },
            ];
        let lastErr: unknown = null;
        for (const c of attempts) {
          try {
            return await navigator.mediaDevices.getUserMedia(c);
          } catch (e) {
            lastErr = e;
            const name = e instanceof DOMException || e instanceof Error ? (e as Error).name : "";
            if (name === "OverconstrainedError" || name === "NotFoundError") continue;
            if (name === "NotAllowedError" || name === "SecurityError") throw e;
            continue;
          }
        }
        throw lastErr;
      };

      const stream = await tryGetUserMedia();
      streamRef.current = stream;
      stream.getTracks().forEach((t) => {
        t.onended = () => {
          stopCameraInternal();
        };
      });

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      setCameraActive(true);
      setHandDetected(false);
      setPeaceDetected(false);
      setBlurActive(false);
      strokesRef.current = [];
      redoRef.current = [];
      currentStrokeRef.current = null;
      smoothedRef.current = null;
      setCaptureImage(null);
      animationRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      console.error("[PeaceBlur] getUserMedia / MediaPipe error:", err);

      const isMediaPipeErr =
        (err instanceof Error && /hand detection|Failed to load hand detection|offline/i.test(err.message)) ||
        (err instanceof Event && (err as Event).type === "error");
      if (isMediaPipeErr) {
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

  // Handle resize / orientation change - keep canvases aligned + fullscreen changes
  useEffect(() => {
    if (!cameraActive) return;
    const onResize = () => {
      const canvas = canvasRef.current;
      const dcanvas = drawingCanvasRef.current;
      const video = videoRef.current;
      if (video) {
        if (canvas) resizeCanvasToVideo(canvas, video);
        if (dcanvas) resizeCanvasToVideo(dcanvas, video);
        redrawDrawingCanvas();
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    document.addEventListener("fullscreenchange", onResize);
    document.addEventListener("webkitfullscreenchange", onResize as EventListener);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && videoRef.current) {
      ro = new ResizeObserver(onResize);
      ro.observe(videoRef.current);
      if (canvasRef.current) ro.observe(canvasRef.current);
      if (drawingCanvasRef.current) ro.observe(drawingCanvasRef.current);
    }
    const onMetadata = () => onResize();
    const v = videoRef.current;
    v?.addEventListener("loadedmetadata", onMetadata);
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationRef.current);
      } else if (cameraActive && videoRef.current?.readyState !== undefined) {
        lastVideoTimeRef.current = -1;
        animationRef.current = requestAnimationFrame(detectLoop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("fullscreenchange", onResize);
      document.removeEventListener("webkitfullscreenchange", onResize as EventListener);
      document.removeEventListener("visibilitychange", onVisibility);
      v?.removeEventListener("loadedmetadata", onMetadata);
      if (ro) ro.disconnect();
    };
  }, [cameraActive, detectLoop, redrawDrawingCanvas]);

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
    drawingCanvasRef: drawingCanvasRef as React.RefObject<HTMLCanvasElement>,
    cameraActive,
    isStarting,
    handDetected,
    peaceDetected,
    blurActive,
    gesture,
    gestureLabel,
    gestureAction,
    confidence,
    isDrawing,
    cursorPos,
    brushColor,
    brushSize,
    canUndo,
    canRedo,
    captureImage,
    overlayWord,
    overlayPos,
    overlayLabels,
    error,
    startCamera,
    stopCamera,
    setBrushColor,
    setBrushSize,
    clearDrawing,
    undo,
    redo,
    capture,
    dismissCapture,
  };
}

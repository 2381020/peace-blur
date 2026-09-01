import { AlertTriangle, Video, Loader2, RefreshCw, Maximize, Minimize, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  cameraActive: boolean;
  isStarting: boolean;
  peaceDetected: boolean;
  error: { message: string; type?: string } | null;
  onRetry?: () => void;
}

export function CameraView({ videoRef, canvasRef, cameraActive, isStarting, peaceDetected, error, onRetry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement && !(document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else {
          const w = el as unknown as { webkitRequestFullscreen?: () => Promise<void> };
          await w.webkitRequestFullscreen?.();
        }
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else {
          const d = document as unknown as { webkitExitFullscreen?: () => Promise<void> };
          await d.webkitExitFullscreen?.();
        }
      }
    } catch {
      // ignore - e.g. not allowed without gesture
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement || !!(document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement;
      setIsFullscreen(fs);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as EventListener);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0A0C14] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.04)_inset] md:rounded-[22px] ${isFullscreen ? "flex h-[100dvh] w-[100vw] max-h-[100dvh] items-center justify-center rounded-none border-0 bg-black" : ""}`}
      style={isFullscreen ? { paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" } : undefined}
    >
      <div
        className={`relative w-full bg-black ${isFullscreen ? "flex h-full w-full items-center justify-center bg-black" : "aspect-[4/3] md:aspect-video md:bg-[#0A0C14]"}`}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full bg-black object-cover object-center scale-x-[-1] transition-[filter] duration-500 ${peaceDetected ? "blur-[18px]" : "blur-0"} ${isFullscreen ? "max-h-[100dvh] max-w-[100vw]" : ""}`}
        />

        {/* Canvas overlay - always rendered but only drawn when camera active. Keeps clear when video blurs */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          aria-hidden="true"
        />

        {/* Empty state */}
        {!cameraActive && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0C14] p-6 text-center md:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] md:h-14 md:w-14">
              <Video className="h-5 w-5 text-white/30 md:h-6 md:w-6" />
            </div>
            <p className="mt-4 text-[13px] font-semibold tracking-wide text-white/90">Camera off</p>
            <p className="mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-white/35">
              Start your camera to begin detection. Your feed stays on-device.
            </p>
            <p className="mt-3 max-w-[280px] text-[11px] leading-relaxed text-white/25 md:hidden">
              Tap Start Camera below
            </p>
            {error && (
              <div
                role="alert"
                className="mt-5 w-full max-w-[380px] rounded-2xl border border-red-500/10 bg-red-500/[0.06] px-4 py-3 text-left"
              >
                <div className="flex gap-2.5 text-[12.5px] font-medium leading-relaxed text-red-200/90">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400/80" />
                  <span>{error.message}</span>
                </div>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-black hover:bg-white/90 transition"
                  >
                    <RefreshCw className="h-3 w-3" /> Try Again
                  </button>
                )}
                <p className="mt-2 text-[11px] leading-relaxed text-red-200/40">
                  Tip: Click the 🔒 icon in address bar → Allow camera. Windows: Settings → Privacy → Camera.
                </p>
              </div>
            )}
          </div>
        )}

        {isStarting && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0A0C14]/85 backdrop-blur-[2px]">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            <p className="text-xs font-medium tracking-wide text-white/50">Starting camera…</p>
          </div>
        )}

        {/* HUD - only when camera active */}
        {cameraActive && (
          <>
            {/* top bar - above canvas */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-center justify-between p-3 md:p-4"
              style={{ paddingTop: isFullscreen ? "calc(0.75rem + env(safe-area-inset-top))" : undefined }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md md:px-3 md:py-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${peaceDetected ? "bg-sky-400" : "bg-emerald-400"} ${cameraActive ? "animate-pulse" : ""}`}
                />
                <span className="text-[10px] font-semibold tracking-[0.08em] text-white/90 md:text-[11px]">
                  {peaceDetected ? "✌ PEACE DETECTED" : "LIVE"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md md:px-3 md:py-1.5">
                  <span className="text-[10px] font-medium tracking-[0.1em] text-white/60 md:text-[11px]">AI VISION</span>
                </div>
              </div>
            </div>

            {/* blur tint when peace - below canvas (canvas is z-[1]) so skeleton stays clear */}
            {peaceDetected && <div className="pointer-events-none absolute inset-0 bg-sky-500/[0.035] transition-opacity duration-500" />}

            {/* Fullscreen toggle - bottom-right, safe-area aware, always visible when active */}
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="absolute bottom-3 right-3 z-[3] inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-black/45 p-2.5 text-white/90 backdrop-blur-md transition hover:bg-black/60 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 md:bottom-4 md:right-4"
              style={{
                marginBottom: isFullscreen ? "env(safe-area-inset-bottom)" : undefined,
                marginRight: isFullscreen ? "env(safe-area-inset-right)" : undefined,
              }}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>

            {/* Exit fullscreen X - top-right in fullscreen for easy thumb reach */}
            {isFullscreen && (
              <button
                onClick={toggleFullscreen}
                aria-label="Exit fullscreen"
                className="absolute right-3 top-3 z-[3] inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/15 active:scale-[0.96]"
                style={{
                  marginTop: "env(safe-area-inset-top)",
                  marginRight: "env(safe-area-inset-right)",
                }}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </>
        )}

        {/* Fullscreen affordance when inactive - hint only, not blocking */}
        {!cameraActive && !isStarting && !error && (
          <button
            onClick={toggleFullscreen}
            aria-label="Enter fullscreen"
            className="absolute bottom-3 right-3 z-[2] hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-black/30 p-2.5 text-white/60 backdrop-blur-md transition hover:bg-black/40 hover:text-white/90 md:inline-flex"
          >
            <Maximize className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

import { AlertTriangle, Video, Loader2, RefreshCw } from "lucide-react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraActive: boolean;
  isStarting: boolean;
  peaceDetected: boolean;
  error: { message: string; type?: string } | null;
  onRetry?: () => void;
}

export function CameraView({ videoRef, cameraActive, isStarting, peaceDetected, error, onRetry }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/[0.07] bg-[#0A0C14] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.04)_inset] md:rounded-[22px]">
      <div className="relative aspect-[4/3] w-full bg-black md:aspect-video md:bg-[#0A0C14]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full bg-black object-contain object-center scale-x-[-1] transition-[filter] duration-500 md:object-cover ${peaceDetected ? "blur-[18px]" : "blur-0"}`}
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
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-white/90 transition"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0A0C14]/85 backdrop-blur-[2px]">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            <p className="text-xs font-medium tracking-wide text-white/50">Starting camera…</p>
          </div>
        )}

        {/* HUD - only when camera active */}
        {cameraActive && (
          <>
            {/* top bar */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 md:p-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md md:px-3 md:py-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${peaceDetected ? "bg-sky-400" : "bg-emerald-400"} ${cameraActive ? "animate-pulse" : ""}`}
                />
                <span className="text-[10px] font-semibold tracking-[0.08em] text-white/90 md:text-[11px]">
                  {peaceDetected ? "✌ PEACE DETECTED" : "LIVE"}
                </span>
              </div>
              <div className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 backdrop-blur-md md:px-3 md:py-1.5">
                <span className="text-[10px] font-medium tracking-[0.1em] text-white/60 md:text-[11px]">AI VISION</span>
              </div>
            </div>

            {/* blur tint when peace */}
            {peaceDetected && <div className="pointer-events-none absolute inset-0 bg-sky-500/[0.035] transition-opacity duration-500" />}
          </>
        )}
      </div>
    </div>
  );
}

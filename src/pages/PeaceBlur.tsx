import { Header } from "@/components/peace/Header";
import { CameraView } from "@/components/peace/CameraView";
import { StatusPanel } from "@/components/peace/StatusPanel";
import { ControlPanel } from "@/components/peace/ControlPanel";
import { InfoSection } from "@/components/peace/InfoSection";
import { useHandDetection } from "@/hooks/useHandDetection";
import { PermissionPrimer } from "@/components/peace/PermissionPrimer";
import { useState } from "react";

export default function PeaceBlur() {
  const { videoRef, canvasRef, cameraActive, isStarting, handDetected, peaceDetected, error, startCamera, stopCamera } =
    useHandDetection();
  const [showPrimer, setShowPrimer] = useState(false);

  const handleStart = () => {
    if (cameraActive || isStarting) return;
    setShowPrimer(true);
  };
  const handleConfirm = () => {
    setShowPrimer(false);
    startCamera();
  };

  return (
    <div className="min-h-[100dvh] min-h-[100svh] min-h-screen bg-[#070A14] text-white antialiased selection:bg-white/10 overflow-x-clip [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
      {/* subtle background - restrained */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_-10%,rgba(99,102,241,0.07),transparent_60%),radial-gradient(ellipse_700px_400px_at_85%_85%,rgba(16,185,129,0.04),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.2))]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1120px] overflow-x-clip px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6 md:pt-[calc(2rem+env(safe-area-inset-top))] md:pl-[max(1.5rem,env(safe-area-inset-left))] md:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <Header />

        {/* Main grid - mobile single column, desktop camera + side panel */}
        <div className="mt-8 grid gap-4 md:mt-10 md:grid-cols-[1.7fr_0.9fr] md:gap-5 lg:grid-cols-[1.75fr_0.85fr]">
          {/* Camera - focal point */}
          <div className="min-w-0">
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraActive={cameraActive}
              isStarting={isStarting}
              peaceDetected={peaceDetected}
              error={error}
              onRetry={handleConfirm}
            />
            {/* privacy line under camera - desktop only secondary */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-white/30 md:justify-start">
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>Processed locally · No upload</span>
              <span className="hidden md:inline">· On-device</span>
            </div>
          </div>

          {/* Side panel - detection + controls */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* ControlPanel first on mobile for visibility, sticky bottom with safe-area */}
            <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 order-first md:static md:order-none">
              <ControlPanel cameraActive={cameraActive} isStarting={isStarting} onStart={handleStart} onStop={stopCamera} />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-white/30 md:hidden">
                {cameraActive ? "Tap Stop to turn off camera" : "Tap Start to begin · Body stays fully visible"}
              </p>
            </div>
            <div className="order-last md:order-none">
              <StatusPanel cameraActive={cameraActive} handDetected={handDetected} peaceDetected={peaceDetected} />
            </div>

            {/* desktop helper */}
            <p className="hidden text-center text-[11px] leading-relaxed text-white/20 md:block">
              Show ✌️ to blur. Remove hand to clear.
            </p>
          </div>
        </div>

        {/* How it works + privacy */}
        <div className="mt-5">
          <InfoSection />
        </div>

        <footer className="mt-8 border-t border-white/[0.04] py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-[11px] tracking-wide text-white/20">
          Built with React · Vite · TypeScript · Tailwind · MediaPipe Tasks Vision
        </footer>
      </div>

      <PermissionPrimer open={showPrimer} onClose={() => setShowPrimer(false)} onConfirm={handleConfirm} />
    </div>
  );
}

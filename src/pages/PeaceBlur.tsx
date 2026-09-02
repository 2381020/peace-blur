import { Header } from "@/components/peace/Header";
import { CameraView } from "@/components/peace/CameraView";
import { StatusPanel } from "@/components/peace/StatusPanel";
import { ControlPanel } from "@/components/peace/ControlPanel";
import { InfoSection } from "@/components/peace/InfoSection";
import { DrawingToolbar } from "@/components/peace/DrawingToolbar";
import { CapturePreview } from "@/components/peace/CapturePreview";
import { useHandDetection } from "@/hooks/useHandDetection";
import { PermissionPrimer } from "@/components/peace/PermissionPrimer";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Palette } from "lucide-react";
import { TutorialButton } from "@/components/peace/Tutorial";

export default function PeaceBlur() {
  const {
    videoRef,
    canvasRef,
    drawingCanvasRef,
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
  } = useHandDetection();
  const [showPrimer, setShowPrimer] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_900px_500px_at_50%_-10%,rgba(99,102,241,0.07),transparent_60%),radial-gradient(ellipse_700px_400px_at_85%_85%,rgba(16,185,129,0.04),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.2))]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1220px] overflow-x-clip px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6 md:pt-[calc(2rem+env(safe-area-inset-top))] md:pl-[max(1.5rem,env(safe-area-inset-left))] md:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="flex justify-end">
          <TutorialButton />
        </div>
        <Header />

        <div className="mt-6 grid gap-4 md:mt-8 md:grid-cols-[1.7fr_0.9fr] md:gap-5 lg:grid-cols-[1.75fr_0.85fr]">
          <div className="min-w-0">
            <CameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              drawingCanvasRef={drawingCanvasRef}
              cameraActive={cameraActive}
              isStarting={isStarting}
              peaceDetected={peaceDetected}
              blurActive={blurActive}
              overlayWord={overlayWord}
              overlayPos={overlayPos}
              overlayLabels={overlayLabels}
              error={error}
              onRetry={handleConfirm}
            />
            <div className="mt-3 hidden items-center justify-center gap-2 text-[11px] text-white/30 md:flex md:justify-start">
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>
                🔒 Your camera stays on your device. Nothing is uploaded to a
                server.
              </span>
            </div>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-white/25 md:hidden">
              🔒 On-device · Nothing uploaded
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 order-first md:static md:order-none">
              <ControlPanel
                cameraActive={cameraActive}
                isStarting={isStarting}
                onStart={handleStart}
                onStop={stopCamera}
              />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-white/30 md:hidden">
                {cameraActive
                  ? "☝️ draw · ✌️ blur · ✋ pause · ✊ clear · 👌 capture"
                  : "Tap Start to begin"}
              </p>
            </div>
            <div className="order-last md:order-none">
              <StatusPanel
                cameraActive={cameraActive}
                handDetected={handDetected}
                peaceDetected={peaceDetected}
                blurActive={blurActive}
                gesture={gesture}
                gestureLabel={gestureLabel}
                gestureAction={gestureAction}
                confidence={confidence}
                isDrawing={isDrawing}
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <InfoSection />
        </div>

        <footer className="mt-8 border-t border-white/[0.04] py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center text-[11px] tracking-wide text-white/20">
          Built with React · Vite · TypeScript · Tailwind · MediaPipe Tasks
          Vision · Canvas API · Fully client-side
        </footer>
      </div>

      {/* FAB for air drawing settings — unobtrusive */}
      {cameraActive && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              aria-label="Open drawing settings"
              className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 inline-flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-white text-black shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition hover:bg-white/90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:bottom-6 md:right-6"
            >
              <Palette className="h-6 w-6" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="border-white/10 bg-[#11131F] px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
            <DrawerHeader className="px-0">
              <DrawerTitle className="text-sm text-white">
                Air Drawing Settings
              </DrawerTitle>
            </DrawerHeader>
            <DrawingToolbar
              color={brushColor}
              size={brushSize}
              canUndo={canUndo}
              canRedo={canRedo}
              onColor={setBrushColor}
              onSize={setBrushSize}
              onUndo={undo}
              onRedo={redo}
              onClear={clearDrawing}
              onCapture={capture}
            />
            <p className="mt-3 text-center text-[11px] text-white/30">
              Gesture: 👌 OK to capture · 👍 I · 🖕 LOVE · 🤙 YOU · 🤟 3 jari
              (jempol+tengah+kelingking) = I LOVE YOU
            </p>
          </DrawerContent>
        </Drawer>
      )}

      <PermissionPrimer
        open={showPrimer}
        onClose={() => setShowPrimer(false)}
        onConfirm={handleConfirm}
      />
      <CapturePreview image={captureImage} onClose={dismissCapture} />
    </div>
  );
}

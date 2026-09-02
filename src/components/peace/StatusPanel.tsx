import type { GestureType } from "@/types/detection";

interface Props {
  cameraActive: boolean;
  handDetected: boolean;
  peaceDetected: boolean;
  blurActive?: boolean;
  gesture?: GestureType;
  gestureLabel?: string;
  gestureAction?: string;
  confidence?: number;
  isDrawing?: boolean;
}

function StatusRow({ label, value, active, accent }: { label: string; value: string; active?: boolean; accent?: boolean }) {
  const dotClass = active ? "bg-emerald-400" : accent ? "bg-sky-400" : "bg-white/20";
  const textClass = active ? "text-white" : accent ? "text-sky-300" : "text-white/35";
  const labelClass = "text-white/45";

  return (
    <div className="flex items-center justify-between py-2.5">
      <span className={`text-[12.5px] font-medium ${labelClass}`}>{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${textClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass} ${active || accent ? "shadow-[0_0_6px_rgba(16,185,129,0.5)]" : ""}`} />
        {value}
      </span>
    </div>
  );
}

export function StatusPanel({ cameraActive, handDetected, peaceDetected, blurActive: blurActiveProp, gesture = "none", gestureLabel = "None", gestureAction = "—", confidence = 0, isDrawing = false }: Props) {
  const blurActive = blurActiveProp ?? (cameraActive && peaceDetected);
  const handCount = handDetected ? "1" : "Not detected";
  const gestureValue = handDetected ? gestureLabel : "Not detected";
  const actionValue = blurActive ? "Blur Active" : isDrawing ? "Air Drawing" : gestureAction;
  const showConfidence = handDetected && gesture !== "none";

  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.035] p-5 backdrop-blur-xl md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.12em] text-white/40">GESTURE DETECTION</h2>
        <span className={`h-1.5 w-1.5 rounded-full ${blurActive ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" : handDetected ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-white/15"}`} />
      </div>

      <div className="mt-4 divide-y divide-white/[0.06]">
        <StatusRow label="Hand" value={handCount} active={handDetected} />
        <StatusRow label="Gesture" value={gestureValue} active={gesture !== "none" && handDetected} accent={gesture === "peace"} />
        {showConfidence && (
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[12.5px] font-medium text-white/45">Confidence</span>
            <span className="text-[12.5px] font-medium text-white">{confidence}%</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[12.5px] font-medium text-white/45">Action</span>
          <span className="text-[12.5px] font-medium text-white">{actionValue}</span>
        </div>
        <StatusRow label="Peace sign" value={peaceDetected ? "Detected" : "Not detected"} active={peaceDetected} />
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[12.5px] font-medium text-white/45">Blur</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all duration-300 ${
              blurActive
                ? "border-sky-400/20 bg-sky-400/10 text-sky-300"
                : "border-white/[0.06] bg-white/[0.03] text-white/30"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${blurActive ? "bg-sky-400 animate-pulse" : "bg-white/20"}`} />
            {blurActive ? "ACTIVE" : "OFF"}
          </span>
        </div>
      </div>

      
    </div>
  );
}

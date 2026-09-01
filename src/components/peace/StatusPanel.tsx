interface Props {
  cameraActive: boolean;
  handDetected: boolean;
  peaceDetected: boolean;
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

export function StatusPanel({ cameraActive, handDetected, peaceDetected }: Props) {
  const blurActive = cameraActive && peaceDetected;

  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.035] p-5 backdrop-blur-xl md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold tracking-[0.12em] text-white/40">DETECTION</h2>
        <span className={`h-1.5 w-1.5 rounded-full ${blurActive ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" : "bg-white/15"}`} />
      </div>

      <div className="mt-4 divide-y divide-white/[0.06]">
        <StatusRow label="Camera" value={cameraActive ? "Active" : "Idle"} active={cameraActive} />
        <StatusRow label="Hand" value={handDetected ? "Detected" : "Not detected"} active={handDetected} />
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

      <p className="mt-4 text-[11.5px] leading-relaxed text-white/25">
        Blur activates instantly on ✌️ and clears when the gesture disappears.
      </p>
    </div>
  );
}

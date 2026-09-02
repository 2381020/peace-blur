export function InfoSection() {
  return (
    <div className="space-y-4">
      {/* How it works - horizontal flow */}
      <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-4 py-5 md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:gap-2">
            <Step n="☝️" label="Draw" />
            <Arrow />
            <Step n="✌️" label="Blur" />
            <Arrow />
            <Step n="👌" label="Capture" />
            <Arrow />
            <Step n="🤘" label="I Love You" />
          </div>
          
        </div>
        
      </div>

      {/* Privacy */}
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-center md:flex-row md:justify-center md:gap-4 md:px-6 md:py-3.5">
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-white/60">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[11px]">
            🔒
          </span>
          <span>
            Your camera stays on your device. Video is processed locally in your
            browser. Nothing is uploaded to a server.
          </span>
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        <Pill label="On-device" />
        <Pill label="No upload" />
        <Pill label="Private" />
      </div>
    </div>
  );
}

function Step({ n, label }: { n: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white/70">
        {n}
      </span>
      <span className="text-[12.5px] font-medium text-white/65">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="hidden text-white/15 md:inline md:px-1">→</span>;
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/40">
      {label}
    </span>
  );
}

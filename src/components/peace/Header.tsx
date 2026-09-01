export function Header() {
  return (
    <header className="text-center">
      {/* top badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-3.5 py-1.5 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
        <span className="text-[11px] font-medium tracking-[0.14em] text-white/45">REAL-TIME · PRIVATE · ON-DEVICE</span>
      </div>

      {/* title */}
      <div className="mt-5 flex flex-col items-center">
        <h1 className="flex items-center gap-2.5 text-[32px] font-[650] tracking-[-0.03em] text-white md:text-[42px]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[16px] md:h-9 md:w-9 md:text-[18px]">✌️</span>
          Peace Blur
        </h1>
        <p className="mt-2 text-[15px] font-medium tracking-[-0.01em] text-white/55 md:text-[16px]">
          Real-time peace sign detection
        </p>
        <p className="mt-1.5 text-[13px] font-normal text-white/35 md:text-[14px]">
          Show a peace sign. Get blurred.
        </p>
      </div>
    </header>
  );
}

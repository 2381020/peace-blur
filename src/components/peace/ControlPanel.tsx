interface Props {
  cameraActive: boolean;
  isStarting: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function ControlPanel({ cameraActive, isStarting, onStart, onStop }: Props) {
  if (cameraActive) {
    return (
      <button
        onClick={onStop}
        aria-label="Stop camera"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3.5 text-[13.5px] font-semibold text-white backdrop-blur transition hover:bg-white/[0.09] active:scale-[0.98] md:py-3"
      >
        <span className="h-3 w-3 rounded-[2px] bg-white/80" />
        Stop Camera
      </button>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={isStarting}
      aria-label="Start camera"
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[13.5px] font-semibold text-black shadow-[0_8px_24px_rgba(255,255,255,0.12)] transition hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:py-3"
    >
      <span className="flex h-4 w-4 items-center justify-center text-[10px]">▶</span>
      {isStarting ? "Starting…" : "Start Camera"}
    </button>
  );
}

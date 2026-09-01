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
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-4 text-[14px] font-bold tracking-wide text-white shadow-[0_8px_24px_rgba(220,38,38,0.35)] transition hover:bg-red-700 active:bg-red-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-0 md:py-4 md:text-[14px]"
      >
        <span className="h-3 w-3 rounded-[2px] bg-white" />
        Stop Camera
      </button>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={isStarting}
      aria-label="Start camera"
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-[14px] font-bold text-black shadow-[0_8px_24px_rgba(255,255,255,0.15)] transition hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 md:py-4 md:text-[14px]"
    >
      <span className="flex h-4 w-4 items-center justify-center text-[10px]">▶</span>
      {isStarting ? "Starting…" : "Start Camera"}
    </button>
  );
}

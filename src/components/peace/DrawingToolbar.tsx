import { Undo2, Redo2, Trash2, Camera } from "lucide-react";

const COLORS = ["#38bdf8", "#f472b6", "#facc15", "#4ade80", "#ffffff", "#fb7185", "#a78bfa", "#000000"];
const SIZES = [2, 4, 8, 14];

interface Props {
  color: string;
  size: number;
  canUndo: boolean;
  canRedo: boolean;
  onColor: (c: string) => void;
  onSize: (n: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onCapture: () => void;
}

export function DrawingToolbar({ color, size, canUndo, canRedo, onColor, onSize, onUndo, onRedo, onClear, onCapture }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-3 backdrop-blur-xl md:p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.12em] text-white/40">DRAWING</span>
        <button
          onClick={onCapture}
          aria-label="Capture screenshot"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          <Camera className="h-3.5 w-3.5" /> Capture
        </button>
      </div>

      <div>
        <p className="text-[11px] font-medium text-white/45">Color</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Select color ${c}`}
              onClick={() => onColor(c)}
              className={`h-8 w-8 rounded-full border-2 transition active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${color === c ? "border-white scale-110 shadow-[0_0_0_2px_rgba(255,255,255,0.25)]" : "border-white/15 hover:border-white/30"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium text-white/45">Brush Size</p>
        <div className="mt-2 flex items-center gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              aria-label={`Brush size ${s}`}
              onClick={() => onSize(s)}
              className={`flex min-h-[36px] min-w-[44px] flex-1 items-center justify-center rounded-full border text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${size === s ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"}`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="rounded-full bg-current" style={{ width: Math.max(6, s * 1.1), height: Math.max(6, s * 1.1) }} />
                {s}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between px-1 text-[10px] text-white/20">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last stroke"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <Undo2 className="h-4 w-4" /> Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo stroke"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] font-medium text-white/80 transition hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <Redo2 className="h-4 w-4" /> Redo
        </button>
        <button
          onClick={onClear}
          aria-label="Clear drawing"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[12px] font-medium text-red-200 transition hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
        >
          <Trash2 className="h-4 w-4" /> Clear
        </button>
      </div>
    </div>
  );
}

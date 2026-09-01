import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PermissionPrimer({ open, onClose, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)] [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]">
      <div className="absolute inset-0 bg-[#060712]/70 backdrop-blur-[8px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Allow camera access"
        className="relative w-full max-w-[420px] rounded-[20px] border border-white/[0.07] bg-[#11131F] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] md:p-7"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 text-white/30 hover:bg-white/5 hover:text-white/70 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">✌️</div>
        <h2 className="mt-4 text-[16px] font-semibold tracking-tight text-white">Allow camera access?</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-white/45">
          Peace Blur needs your camera for real-time ✌️ detection. Video is processed <span className="font-medium text-white/70">on-device</span> — never uploaded.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/[0.07] px-2.5 py-1 text-[11px] font-medium text-emerald-300/80">
          🔒 Private · No upload · On-device
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-white/25">
          After clicking Allow Camera, your browser will show a permission prompt — choose <span className="text-white/50">Allow</span>.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-full border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[13px] font-medium text-white/70 hover:bg-white/[0.07] transition"
          >
            Later
          </button>
          <button
            onClick={onConfirm}
            className="min-h-[44px] rounded-full bg-white px-4 py-3.5 text-[13px] font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
          >
            Allow Camera
          </button>
        </div>
      </div>
    </div>
  );
}

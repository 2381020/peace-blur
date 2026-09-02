import { X, Download } from "lucide-react";

interface Props {
  image: string | null;
  onClose: () => void;
}

export function CapturePreview({ image, onClose }: Props) {
  if (!image) return null;
  const download = () => {
    const a = document.createElement("a");
    a.href = image;
    a.download = `air-drawing-${Date.now()}.png`;
    a.click();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px]" onClick={onClose} />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[20px] border border-white/10 bg-[#11131F] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.6)] md:p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Capture preview</h3>
          <button aria-label="Close preview" onClick={onClose} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
          <img src={image} alt="Captured composition" className="h-auto w-full object-contain" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="min-h-[44px] rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] font-medium text-white/70 hover:bg-white/[0.07]">Retake</button>
          <button onClick={download} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-[13px] font-semibold text-black hover:bg-white/90">
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
        <p className="mt-3 text-center text-[11px] text-white/25">Saved locally — nothing uploaded.</p>
      </div>
    </div>
  );
}

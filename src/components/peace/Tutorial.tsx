import { X, HelpCircle } from "lucide-react";
import { useState } from "react";

const STEPS = [
  { icon: "▶️", title: "Start Kamera", desc: "Tap Start Camera → Allow. Semua proses lokal, tidak upload." },
  { icon: "☝️", title: "Gambar (Air Drawing)", desc: "Angkat TELUNJUK saja. Gerakkan ujung jari (landmark #8) untuk menggambar. Putus? Angkat lagi, lanjut." },
  { icon: "✌️", title: "Blur", desc: "Peace ✌️ = blur kamera. Tetap aktif bersamaan dengan gambar. Lepas = clear." },
  { icon: "✋", title: "Pause", desc: "Telapak terbuka ✋ = jeda gambar. Coretan tetap, tidak nambah." },
  { icon: "✊", title: "Hapus", desc: "Kepal ✊ = clear semua coretan (cooldown 0.9s)." },
  { icon: "👌", title: "Capture", desc: "Gesture OK 👌 (jempol+telunjuk nempel) = screenshot. Atau tombol Capture." },
  { icon: "👍", title: "I", desc: "Jempol saja 👍 = teks I di atas jempol." },
  { icon: "🖕", title: "LOVE", desc: "Jari tengah saja 🖕 = LOVE di atas jari tengah. (Jempol tidak dicek, jadi lebih sensitif)." },
  { icon: "🤙", title: "YOU", desc: "Kelingking saja 🤙 = YOU di atas kelingking." },
  { icon: "🤘", title: "I LOVE YOU (Metal)", desc: "Metal 🤘 (telunjuk+kelingking) = I LOVE YOU ❤️ di tengah jari." },
  { icon: "🤟", title: "I LOVE YOU 3 Jari", desc: "Jempol + Tengah + Kelingking bersamaan = I di atas jempol, LOVE di atas tengah, YOU di atas kelingking + ❤️ smooth." },
  { icon: "🎨", title: "Brush", desc: "FAB 🎨 pojok kanan bawah → ganti warna & ukuran, undo/redo." },
];

export function TutorialButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Buka tutorial"
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white/70 backdrop-blur hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        <HelpCircle className="h-4 w-4" /> Tutorial
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 [padding-bottom:env(safe-area-inset-bottom)]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" onClick={() => setOpen(false)} />
          <div className="relative max-h-[85dvh] w-full max-w-[560px] overflow-hidden rounded-t-[20px] border border-white/10 bg-[#11131F] shadow-[0_24px_64px_rgba(0,0,0,0.6)] sm:rounded-[20px]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Cara Pakai</h3>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[65dvh] overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-3">
                {STEPS.map((s) => (
                  <div key={s.title} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[16px]">{s.icon}</span>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{s.title}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-xl bg-sky-500/10 px-3 py-2.5 text-center text-[11px] leading-relaxed text-sky-200/70">
                Tips: Hadap cahaya terang, jarak 40–70cm, miringkan telapak jika LOVE tidak kedetect. Teks muncul 1.8s di atas ujung jari & ikut ke screenshot.
              </p>
            </div>
            <div className="border-t border-white/10 px-4 py-3 sm:px-5">
              <button onClick={() => setOpen(false)} className="min-h-[44px] w-full rounded-full bg-white px-4 py-3 text-[13px] font-semibold text-black hover:bg-white/90">Mengerti</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

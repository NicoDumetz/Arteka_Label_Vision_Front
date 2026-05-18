// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : FullscreenLocalFileModal.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

interface FullscreenLocalFileModalProps {
  file: File;
  fileUrl: string;
  onClose: () => void;
}

export function FullscreenLocalFileModal({ file, fileUrl, onClose }: FullscreenLocalFileModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-8 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/10"
        title="Close"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="relative h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img src={fileUrl} alt={file.name} className="h-full w-full object-contain" />
        <div className="absolute left-5 top-5 rounded-lg border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-md">
          <p className="max-w-[520px] truncate text-xs font-black uppercase tracking-widest text-white">
            {file.name}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/45">
            pending static image
          </p>
        </div>
      </div>
    </div>
  );
}

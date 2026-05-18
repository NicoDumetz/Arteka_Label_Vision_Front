// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : LocalFileCard.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import { useEffect, useState } from "react";
import { IMAGE_EXTENSIONS } from "../constants";
import { getFileExtension } from "../utils";
import { cn } from "~/helpers/Cn";

interface LocalFileCardProps {
  file: File;
  onRemove: () => void;
  onPreview?: (file: File) => void;
  variant?: "portrait" | "square";
  className?: string;
}

export function LocalFileCard({
  file,
  onRemove,
  onPreview,
  variant = "portrait",
  className,
}: LocalFileCardProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const extension = getFileExtension(file);
  const isImage = IMAGE_EXTENSIONS.has(extension);

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]",
        variant === "square" ? "aspect-square" : "aspect-[4/5] min-w-[260px]",
        className,
      )}
    >
      {previewUrl ? (
        <img src={previewUrl} alt={file.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white/30">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="mt-3 rounded-md border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {extension || "file"}
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="truncate text-sm font-black text-white">{file.name}</p>
        <p className="mt-1 font-mono text-[10px] text-white/45">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 opacity-0 backdrop-blur-md transition hover:border-error/40 hover:bg-error/20 hover:text-error group-hover:opacity-100"
        title="Remove"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      {onPreview && previewUrl ? (
        <button
          type="button"
          onClick={() => onPreview(file)}
          className="absolute right-3 top-14 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 opacity-0 backdrop-blur-md transition hover:border-primary-500/50 hover:text-white group-hover:opacity-100"
          title="Preview"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      ) : null}
    </article>
  );
}

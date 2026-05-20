// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : MediaCanvas.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import { useState } from "react";
import { AnnotationOverlay } from "./AnnotationOverlay";
import type { LabelLookup } from "../types";
import { getFileName, getItemMediaUrl } from "../utils";
import { cn } from "~/helpers/Cn";
import type { Annotation, Item } from "~/types/models";

interface MediaCanvasProps {
  item: Item;
  annotation: Annotation | null;
  labelsById: LabelLookup;
  isHidden: boolean;
}

export function MediaCanvas({ item, annotation, labelsById, isHidden }: MediaCanvasProps) {
  const imageUrl = getItemMediaUrl(item);
  const [hasImageError, setHasImageError] = useState(false);
  const hasDimensions = Boolean(item.width && item.height);
  const canvasStyle = hasDimensions ? { aspectRatio: `${item.width} / ${item.height}` } : undefined;

  if (!imageUrl || hasImageError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050508] text-white/20">
        <svg className="h-24 w-24 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span className="mt-4 max-w-[70%] truncate font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          Media unavailable
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={cn("relative max-h-full max-w-full", hasDimensions ? "w-full" : "h-full w-full")} style={canvasStyle}>
        <img
          src={imageUrl}
          alt={getFileName(item)}
          className="absolute inset-0 h-full w-full select-none object-contain"
          draggable={false}
          onError={() => setHasImageError(true)}
        />
        <AnnotationOverlay annotation={annotation} item={item} labelsById={labelsById} isHidden={isHidden} />
      </div>
    </div>
  );
}

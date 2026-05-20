// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : FullscreenItemModal.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import { Icons } from "./Icons";
import { MediaCanvas } from "./MediaCanvas";
import type { LabelLookup } from "../types";
import { getFileName } from "../utils";
import type { Annotation, ID, Item } from "~/types/models";

interface FullscreenItemModalProps {
  item: Item;
  annotationsByItemId: Record<ID, Annotation | null>;
  labelsById: LabelLookup;
  onClose: () => void;
}

export function FullscreenItemModal({
  item,
  annotationsByItemId,
  labelsById,
  onClose,
}: FullscreenItemModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-8 py-5">
        <div>
          <h3 className="text-sm font-manrope-extrabold uppercase tracking-widest text-white">
            {getFileName(item)}
          </h3>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">ID: {item.id}</p>
        </div>
        <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10">
          <Icons.Close />
        </button>
      </div>
      <div className="relative min-h-0 flex-1 p-8">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <MediaCanvas
            item={item}
            annotation={annotationsByItemId[item.id] ?? null}
            labelsById={labelsById}
            isHidden={false}
          />
        </div>
      </div>
    </div>
  );
}

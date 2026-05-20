// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : ItemCard.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import { useState } from "react";
import { Icons } from "./Icons";
import { MediaCanvas } from "./MediaCanvas";
import type { LabelLookup } from "../types";
import { getAnnotationObjects, getClassificationLabels, getFileName } from "../utils";
import { cn } from "~/helpers/Cn";
import type { Annotation, Item, TaskType } from "~/types/models";

interface ItemCardProps {
  item: Item;
  annotation: Annotation | null;
  taskType: TaskType;
  labelsById: LabelLookup;
  deleteNeedsConfirmation: boolean;
  isDeleting: boolean;
  onDelete: (item: Item) => void;
  onFullscreen: (item: Item) => void;
}

export function ItemCard({
  item,
  annotation,
  taskType,
  labelsById,
  deleteNeedsConfirmation,
  isDeleting,
  onDelete,
  onFullscreen,
}: ItemCardProps) {
  const [isMaskHidden, setIsMaskHidden] = useState(false);
  const classificationLabels = getClassificationLabels(annotation, labelsById);
  const hasVisualAnnotation = getAnnotationObjects(annotation).some((object) => object.shape_type === "bbox" || object.shape_type === "polygon");

  return (
    <article className="group relative aspect-[16/9] w-[min(60rem,calc(100vw-8rem))] shrink-0 overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] transition-all duration-500 hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
      <div className="relative h-full w-full overflow-hidden bg-black/60">
        <MediaCanvas item={item} annotation={annotation} labelsById={labelsById} isHidden={isMaskHidden} />

        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/90 via-black/10 to-black/40 opacity-80" />

        <div className="absolute left-6 top-6 z-10 flex flex-col gap-3">
          <button
            onClick={() => onDelete(item)}
            disabled={isDeleting}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-manrope-extrabold uppercase tracking-widest backdrop-blur-md transition-all",
              deleteNeedsConfirmation ? "border-error/50 bg-error/20 text-error shadow-[0_0_15px_rgba(255,0,77,0.3)]" : "border-white/10 bg-black/60 text-white/70 hover:border-error/40 hover:bg-error/20 hover:text-error",
            )}
          >
            <Icons.Delete />
            {isDeleting ? "Deleting..." : deleteNeedsConfirmation ? "Confirm" : "Delete"}
          </button>

          {taskType !== "classification" && hasVisualAnnotation && (
            <button
              onClick={() => setIsMaskHidden((current) => !current)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-all",
                isMaskHidden ? "border-white/10 bg-black/60 text-white/50 hover:text-white" : "border-primary-500/50 bg-primary-500/20 text-primary-300",
              )}
              title="Toggle annotations"
            >
              {isMaskHidden ? <Icons.EyeOff /> : <Icons.Eye />}
            </button>
          )}

          <button
            onClick={() => onFullscreen(item)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white/50 backdrop-blur-md transition-all hover:border-white/30 hover:text-white"
            title="Fullscreen"
          >
            <Icons.Fullscreen />
          </button>
        </div>

        <div className="absolute right-6 top-6 z-10 flex max-w-[45%] flex-col items-end gap-2">
          <span className={cn(
            "rounded-lg border px-3 py-1.5 text-[9px] font-manrope-extrabold uppercase tracking-[0.2em] backdrop-blur-md shadow-lg",
            item.status === "annotated" || item.status === "validated" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
              item.status === "rejected" ? "border-error/30 bg-error/10 text-error" :
                "border-white/10 bg-black/60 text-white/70",
          )}>
            {item.status}
          </span>

          {annotation ? (
            <span className="rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 text-[9px] font-manrope-extrabold uppercase tracking-[0.2em] text-primary-300 backdrop-blur-md">
              {annotation.source} / {annotation.status}
            </span>
          ) : (
            <span className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[9px] font-manrope-extrabold uppercase tracking-[0.2em] text-white/40 backdrop-blur-md">
              No annotation
            </span>
          )}

          {classificationLabels.map((label) => (
            <span key={label} className="max-w-full truncate rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-[9px] font-manrope-extrabold uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
              {label}
            </span>
          ))}
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between">
          <div className="min-w-0">
            <p className="truncate text-lg font-manrope-extrabold uppercase tracking-widest text-white drop-shadow-md">
              {getFileName(item)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-white/40">
              <span>ID: {item.id}</span>
              {item.frame_index !== null && <><span>*</span><span className="text-primary-300">FRM_{item.frame_index}</span></>}
              {item.width && item.height && <span>* {item.width}x{item.height}px</span>}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

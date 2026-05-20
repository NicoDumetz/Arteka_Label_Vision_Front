// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WheelEvent as ReactWheelEvent } from "react";

import { Annotations, Items } from "~/api";
import { useWorkspace } from "~/contexts/Workspace";
import { cn } from "~/helpers/Cn";
import { getApiErrorMessage } from "~/helpers/api";
import type { Annotation, ID, Item } from "~/types/models";

import { FullscreenItemModal } from "./components/FullscreenItemModal";
import { Icons } from "./components/Icons";
import { ItemCard } from "./components/ItemCard";
import { ITEMS_LIMIT, SCROLL_LOAD_THRESHOLD, WHEEL_SCROLL_MULTIPLIER } from "./constants";
import { selectLatestAnnotation } from "./utils";

export default function WorkspaceItems() {
  const { project, labels, isLoading } = useWorkspace();
  const [items, setItems] = useState<Item[]>([]);
  const [annotationsByItemId, setAnnotationsByItemId] = useState<Record<ID, Annotation | null>>({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotationWarning, setAnnotationWarning] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<ID | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<ID | null>(null);
  const [fullscreenItem, setFullscreenItem] = useState<Item | null>(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const labelsById = useMemo(() => new Map(labels.map((label) => [label.id, label])), [labels]);

  const loadLatestAnnotations = useCallback(async (nextItems: Item[]) => {
    const entries = await Promise.all(nextItems.map(async (item) => {
      const listResponse = await Annotations.listByItem(item.id);
      const latestAnnotation = selectLatestAnnotation(listResponse.data);

      if (!latestAnnotation) {
        return [item.id, null] as const;
      }

      const annotationResponse = await Annotations.get(latestAnnotation.id);
      return [item.id, annotationResponse.data] as const;
    }));

    return Object.fromEntries(entries) as Record<ID, Annotation | null>;
  }, []);

  const fetchItems = useCallback(async (cursor: string | null, mode: "append" | "replace") => {
    if (!project || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoadingItems(true);
    setError(null);
    setAnnotationWarning(null);

    try {
      const response = await Items.list(project.id, {
        limit: ITEMS_LIMIT,
        ...(cursor ? { cursor } : {}),
      });
      const nextItems = response.data.data;
      let nextAnnotations: Record<ID, Annotation | null> = {};

      try {
        nextAnnotations = await loadLatestAnnotations(nextItems);
      } catch (annotationError) {
        setAnnotationWarning(getApiErrorMessage(annotationError, "Unable to load item annotations."));
      }

      setItems((currentItems) => (mode === "replace" ? nextItems : [...currentItems, ...nextItems]));
      setAnnotationsByItemId((currentAnnotations) => (
        mode === "replace" ? nextAnnotations : { ...currentAnnotations, ...nextAnnotations }
      ));
      setNextCursor(response.data.pagination.next_cursor);
      setHasMore(response.data.pagination.has_more);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load items from backend."));
    } finally {
      isFetchingRef.current = false;
      setLoadingItems(false);
    }
  }, [loadLatestAnnotations, project]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!project) return;

    setItems([]);
    setAnnotationsByItemId({});
    setNextCursor(null);
    setHasMore(true);
    setDeleteConfirmationId(null);
    void fetchItems(null, "replace");
  }, [fetchItems, project]);

  const handleScroll = () => {
    const container = scrollerRef.current;
    if (!container || loadingItems || !hasMore) return;

    const isNearEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - SCROLL_LOAD_THRESHOLD;

    if (isNearEnd) {
      void fetchItems(nextCursor, "append");
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const container = scrollerRef.current;
    if (!container) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (delta === 0) return;

    event.preventDefault();
    event.stopPropagation();
    container.scrollLeft += delta * WHEEL_SCROLL_MULTIPLIER;
  };

  const scrollBy = (left: number) => {
    scrollerRef.current?.scrollBy({ left, behavior: "smooth" });
  };

  const handleDelete = async (item: Item) => {
    if (deletingItemId) return;

    if (deleteConfirmationId !== item.id) {
      setDeleteConfirmationId(item.id);
      return;
    }

    setDeletingItemId(item.id);
    setError(null);

    try {
      await Items.delete(item.id);
      setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
      setAnnotationsByItemId((currentAnnotations) => {
        const nextAnnotations = { ...currentAnnotations };
        delete nextAnnotations[item.id];
        return nextAnnotations;
      });
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete item."));
    } finally {
      setDeleteConfirmationId(null);
      setDeletingItemId(null);
    }
  };

  if (isLoading || !project) return null;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] w-full flex-col overflow-hidden bg-[#08080c] animate-in fade-in duration-700">
      <div className="z-10 flex shrink-0 items-end justify-between border-b border-white/5 bg-[#0a0a0f] px-12 py-6 shadow-lg">
        <div>
          <div className="mb-3 inline-flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-300">
              {project.task_type} Data
            </span>
          </div>
          <h2 className="text-4xl font-manrope-extrabold tracking-tight text-white">
            Dataset Items
          </h2>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-white/40">
            {items.length} items loaded from backend
          </p>
          {(error || annotationWarning) && (
            <p className="mt-3 max-w-3xl truncate font-mono text-[10px] uppercase tracking-widest text-error">
              {error ?? annotationWarning}
            </p>
          )}
        </div>

        <button
          onClick={() => fetchItems(null, "replace")}
          disabled={loadingItems}
          className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
        >
          <span className={cn("transition-transform", loadingItems && "animate-spin")}><Icons.Refresh /></span>
          Sync
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overscroll-contain bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_60%)]">
        <button onClick={() => scrollBy(-1200)} className="absolute left-8 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-xl transition-all hover:scale-110 hover:border-primary-500/50 hover:bg-primary-500/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <Icons.ChevronLeft />
        </button>
        <button onClick={() => scrollBy(1200)} className="absolute right-8 top-1/2 z-20 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-xl transition-all hover:scale-110 hover:border-primary-500/50 hover:bg-primary-500/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <Icons.ChevronRight />
        </button>

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          className="no-scrollbar flex h-full items-center gap-8 overflow-x-auto overflow-y-hidden overscroll-contain px-32 py-10"
        >
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              annotation={annotationsByItemId[item.id] ?? null}
              taskType={project.task_type}
              labelsById={labelsById}
              deleteNeedsConfirmation={deleteConfirmationId === item.id}
              isDeleting={deletingItemId === item.id}
              onDelete={handleDelete}
              onFullscreen={setFullscreenItem}
            />
          ))}

          {loadingItems && (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="aspect-[16/9] w-[min(60rem,calc(100vw-8rem))] shrink-0 animate-pulse rounded-[2rem] border border-white/5 bg-white/[0.02]" />
            ))
          )}

          {!loadingItems && items.length === 0 && !error && (
            <div className="flex h-full w-full items-center justify-center">
              <span className="rounded-full border border-white/5 bg-black/40 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 backdrop-blur-md">
                No backend items
              </span>
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <div className="flex h-full min-w-[200px] shrink-0 items-center justify-center">
              <span className="rounded-full border border-white/5 bg-black/40 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/30 backdrop-blur-md">
                End of Stream
              </span>
            </div>
          )}
        </div>
      </div>

      {fullscreenItem && (
        <FullscreenItemModal
          item={fullscreenItem}
          annotationsByItemId={annotationsByItemId}
          labelsById={labelsById}
          onClose={() => setFullscreenItem(null)}
        />
      )}
    </div>
  );
}

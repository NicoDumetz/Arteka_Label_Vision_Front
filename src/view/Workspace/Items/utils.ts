// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : utils.ts
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import { FALLBACK_LABEL_COLOR } from "./constants";
import type { LabelLookup } from "./types";
import { getMediaUrl } from "~/helpers/media";
import type { Annotation, AnnotationListItem, AnnotationObject, ID, Item } from "~/types/models";

export function getItemMediaUrl(item: Item) {
  return getMediaUrl(item.preview_path ?? item.file_path);
}

export function getFileName(item: Item) {
  return item.file_path.split("/").pop() || `Item_${item.id}`;
}

export function selectLatestAnnotation(annotations: AnnotationListItem[]) {
  if (annotations.length === 0) return null;

  return [...annotations].sort((left, right) => right.id - left.id)[0] ?? null;
}

export function getLabel(labelsById: LabelLookup, labelId: ID) {
  return labelsById.get(labelId);
}

export function getLabelName(labelsById: LabelLookup, labelId: ID) {
  return getLabel(labelsById, labelId)?.name ?? `Label ${labelId}`;
}

export function getLabelColor(labelsById: LabelLookup, labelId: ID) {
  return getLabel(labelsById, labelId)?.color || FALLBACK_LABEL_COLOR;
}

export function hexToRgba(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return `rgba(99,102,241,${alpha})`;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
}

export function getAnnotationObjects(annotation: Annotation | null): AnnotationObject[] {
  return annotation?.payload.objects ?? [];
}

export function getClassificationLabels(annotation: Annotation | null, labelsById: LabelLookup) {
  return getAnnotationObjects(annotation)
    .filter((object) => object.shape_type === "classification")
    .map((object) => getLabelName(labelsById, object.label_id));
}

export function getStrokeWidth(item: Item) {
  const longestSide = Math.max(item.width ?? 100, item.height ?? 100);
  return Math.max(longestSide * 0.003, 1);
}

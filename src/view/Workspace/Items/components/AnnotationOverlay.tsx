// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : AnnotationOverlay.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

import type { LabelLookup } from "../types";
import { getAnnotationObjects, getLabelColor, getStrokeWidth, hexToRgba } from "../utils";
import type { Annotation, Item } from "~/types/models";

interface AnnotationOverlayProps {
  annotation: Annotation | null;
  item: Item;
  labelsById: LabelLookup;
  isHidden: boolean;
}

export function AnnotationOverlay({ annotation, item, labelsById, isHidden }: AnnotationOverlayProps) {
  const objects = getAnnotationObjects(annotation).filter((object) => object.shape_type === "bbox" || object.shape_type === "polygon");

  if (isHidden || objects.length === 0) return null;

  const viewWidth = item.width ?? 100;
  const viewHeight = item.height ?? 100;
  const strokeWidth = getStrokeWidth(item);

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${viewWidth} ${viewHeight}`} preserveAspectRatio="none">
      {objects.map((object, index) => {
        const color = getLabelColor(labelsById, object.label_id);

        if (object.shape_type === "bbox") {
          const [x, y, width, height] = object.bbox;

          return (
            <rect
              key={`${annotation?.id}-bbox-${index}`}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={hexToRgba(color, 0.18)}
              stroke={color}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          );
        }

        const points = object.polygon.map((point) => `${point[0]},${point[1]}`).join(" ");

        return (
          <polygon
            key={`${annotation?.id}-polygon-${index}`}
            points={points}
            fill={hexToRgba(color, 0.18)}
            stroke={color}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

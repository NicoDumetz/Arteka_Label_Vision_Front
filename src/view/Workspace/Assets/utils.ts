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

import { IMAGE_EXTENSIONS } from "./constants";
import type { FrameCandidateWithSelection } from "./types";
import type { FrameCandidate, ID } from "~/types/models";
import { getFileExtension } from "~/helpers/media";


export const sortFilesByImportPriority = (selectedFiles: File[]) =>
  [...selectedFiles].sort((left, right) => {
    const leftIsImage = IMAGE_EXTENSIONS.has(getFileExtension(left));
    const rightIsImage = IMAGE_EXTENSIONS.has(getFileExtension(right));

    if (leftIsImage === rightIsImage) return 0;
    return leftIsImage ? 1 : -1;
  });

export function addOrUpdateCandidate(
  candidates: FrameCandidateWithSelection[],
  candidate: FrameCandidate,
  selected = candidate.selected_by_default,
) {
  const nextCandidate: FrameCandidateWithSelection = {
    ...candidate,
    selected,
  };
  const existingIndex = candidates.findIndex((currentCandidate) => currentCandidate.id === candidate.id);

  if (existingIndex === -1) {
    return [...candidates, nextCandidate].sort((left, right) => {
      if (left.asset_id !== right.asset_id) return left.asset_id - right.asset_id;
      return left.frame_index - right.frame_index;
    });
  }

  return candidates.map((currentCandidate) => {
    return currentCandidate.id === candidate.id ? { ...currentCandidate, ...nextCandidate } : currentCandidate;
  });
}

export function getSelectedCandidateIdsByAsset(candidates: FrameCandidateWithSelection[]) {
  return candidates.reduce<Record<ID, ID[]>>((accumulator, candidate) => {
    if (!candidate.selected || candidate.status === "accepted") {
      return accumulator;
    }

    accumulator[candidate.asset_id] = accumulator[candidate.asset_id] ?? [];
    accumulator[candidate.asset_id].push(candidate.id);
    return accumulator;
  }, {});
}

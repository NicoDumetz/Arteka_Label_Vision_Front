// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.ts
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import Api from "~/helpers/api";
import type {
  ApiMessageResponse,
  ApiRequest,
  AssetListResponse,
  AssetUploadPayload,
  AssetUploadResponse,
  ConfirmFrameCandidatesPayload,
  ConfirmFrameCandidatesResponse,
  FrameCandidatesResponse,
  ManualFrameCandidatePayload,
} from "~/types/api";
import type { Asset, FrameCandidate, ID } from "~/types/models";

export class Assets {
  static upload(projectId: ID, payload: AssetUploadPayload): ApiRequest<AssetUploadResponse> {
    const formData = new FormData();

    formData.append("file", payload.file);

    return Api.post<AssetUploadResponse, FormData>(`/projects/${projectId}/assets/upload`, formData);
  }

  static list(projectId: ID, params?: Record<string, unknown>): ApiRequest<AssetListResponse> {
    return Api.get<AssetListResponse>(`/projects/${projectId}/assets`, { params });
  }

  static get(assetId: ID): ApiRequest<Asset> {
    return Api.get<Asset>(`/assets/${assetId}`);
  }

  static delete(assetId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/assets/${assetId}`);
  }

  static listFrameCandidates(assetId: ID): ApiRequest<FrameCandidatesResponse> {
    return Api.get<FrameCandidatesResponse>(`/assets/${assetId}/frame-candidates`);
  }

  static createManualFrameCandidate(assetId: ID, payload: ManualFrameCandidatePayload): ApiRequest<FrameCandidate> {
    return Api.post<FrameCandidate, ManualFrameCandidatePayload>(`/assets/${assetId}/frame-candidates/manual`, payload);
  }

  static confirmFrameCandidates(assetId: ID, payload: ConfirmFrameCandidatesPayload): ApiRequest<ConfirmFrameCandidatesResponse> {
    return Api.post<ConfirmFrameCandidatesResponse, ConfirmFrameCandidatesPayload>(`/assets/${assetId}/frame-candidates/confirm`, payload);
  }

  static cancelImport(assetId: ID): ApiRequest<ApiMessageResponse> {
    return Api.post<ApiMessageResponse>(`/assets/${assetId}/cancel`);
  }
}

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
  ApiRequest,
  PredictionBatchPayload,
  PredictionBatchResponse,
  PredictionCreatePayload,
  PredictionJobListResponse,
} from "~/types/api";
import type { ID, PredictionJob } from "~/types/models";

export class Predictions {
  static predictItem(itemId: ID, payload: PredictionCreatePayload = {}): ApiRequest<PredictionJob> {
    return Api.post<PredictionJob, PredictionCreatePayload>(`/items/${itemId}/predict`, payload);
  }

  static predictBatch(projectId: ID, payload: PredictionBatchPayload): ApiRequest<PredictionBatchResponse> {
    return Api.post<PredictionBatchResponse, PredictionBatchPayload>(`/projects/${projectId}/predict-batch`, payload);
  }

  static list(projectId: ID, params?: Record<string, unknown>): ApiRequest<PredictionJobListResponse> {
    return Api.get<PredictionJobListResponse>(`/projects/${projectId}/prediction-jobs`, { params });
  }

  static get(jobId: ID): ApiRequest<PredictionJob> {
    return Api.get<PredictionJob>(`/prediction-jobs/${jobId}`);
  }

  static cancel(jobId: ID): ApiRequest<PredictionJob> {
    return Api.post<PredictionJob>(`/prediction-jobs/${jobId}/cancel`);
  }
}

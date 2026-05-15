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
import type { ApiRequest, TrainingJobCreatePayload, TrainingJobListResponse, TrainingSettingsUpdatePayload } from "~/types/api";
import type { ID, TrainingJob, TrainingSettings } from "~/types/models";

export class Training {
  static getSettings(projectId: ID): ApiRequest<TrainingSettings> {
    return Api.get<TrainingSettings>(`/projects/${projectId}/training-settings`);
  }

  static updateSettings(projectId: ID, payload: TrainingSettingsUpdatePayload): ApiRequest<TrainingSettings> {
    return Api.patch<TrainingSettings, TrainingSettingsUpdatePayload>(`/projects/${projectId}/training-settings`, payload);
  }

  static createJob(projectId: ID, payload: TrainingJobCreatePayload): ApiRequest<TrainingJob> {
    return Api.post<TrainingJob, TrainingJobCreatePayload>(`/projects/${projectId}/training-jobs`, payload);
  }

  static listJobs(projectId: ID, params?: Record<string, unknown>): ApiRequest<TrainingJobListResponse> {
    return Api.get<TrainingJobListResponse>(`/projects/${projectId}/training-jobs`, { params });
  }

  static getJob(jobId: ID): ApiRequest<TrainingJob> {
    return Api.get<TrainingJob>(`/training-jobs/${jobId}`);
  }

  static cancelJob(jobId: ID): ApiRequest<TrainingJob> {
    return Api.post<TrainingJob>(`/training-jobs/${jobId}/cancel`);
  }
}

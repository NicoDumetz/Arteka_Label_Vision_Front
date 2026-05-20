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
  AdapterTemplatesResponse,
  ApiMessageResponse,
  ApiRequest,
  ModelAdapterListParams,
  ModelAdaptersResponse,
  ModelUpdatePayload,
  ModelUploadPayload,
  ModelVersionListResponse,
} from "~/types/api";
import type { ID, ModelAdapter, ModelVersion } from "~/types/models";

export class Models {
  static listAdapters(params?: ModelAdapterListParams): ApiRequest<ModelAdaptersResponse> {
    return Api.get<ModelAdaptersResponse>("/model-adapters", { params });
  }

  static getAdapter(adapterId: ID): ApiRequest<ModelAdapter> {
    return Api.get<ModelAdapter>(`/model-adapters/${adapterId}`);
  }

  static listAdapterTemplates(adapterId: ID): ApiRequest<AdapterTemplatesResponse> {
    return Api.get<AdapterTemplatesResponse>(`/model-adapters/${adapterId}/templates`);
  }

  static upload(projectId: ID, payload: ModelUploadPayload): ApiRequest<ModelVersion> {
    const formData = new FormData();

    formData.append("checkpoint_file", payload.file);
    formData.append("adapter_id", String(payload.adapter_id));
    formData.append("name", payload.name);
    formData.append("task_type", payload.task_type);
    formData.append("config", JSON.stringify(payload.config));

    if (payload.version) {
      formData.append("version", payload.version);
    }

    if (payload.architecture) {
      formData.append("architecture", payload.architecture);
    }

    return Api.post<ModelVersion, FormData>(`/projects/${projectId}/models/upload`, formData);
  }

  static list(projectId: ID, params?: Record<string, unknown>): ApiRequest<ModelVersionListResponse> {
    return Api.get<ModelVersionListResponse>(`/projects/${projectId}/models`, { params });
  }

  static get(modelId: ID): ApiRequest<ModelVersion> {
    return Api.get<ModelVersion>(`/models/${modelId}`);
  }

  static update(modelId: ID, payload: ModelUpdatePayload): ApiRequest<ModelVersion> {
    return Api.patch<ModelVersion, ModelUpdatePayload>(`/models/${modelId}`, payload);
  }

  static delete(modelId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/models/${modelId}`);
  }

  static validate(modelId: ID): ApiRequest<ModelVersion> {
    return Api.post<ModelVersion>(`/models/${modelId}/validate`);
  }

  static activate(modelId: ID): ApiRequest<ModelVersion> {
    return Api.post<ModelVersion>(`/models/${modelId}/activate`);
  }

  static archive(modelId: ID): ApiRequest<ModelVersion> {
    return Api.post<ModelVersion>(`/models/${modelId}/archive`);
  }
}

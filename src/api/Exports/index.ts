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
  DatasetVersionCreatePayload,
  DatasetVersionListResponse,
  ExportCreatePayload,
  ExportJobListResponse,
} from "~/types/api";
import type { DatasetVersion, ExportJob, ID } from "~/types/models";

export class Exports {
  static createDatasetVersion(projectId: ID, payload: DatasetVersionCreatePayload): ApiRequest<DatasetVersion> {
    return Api.post<DatasetVersion, DatasetVersionCreatePayload>(`/projects/${projectId}/dataset-versions`, payload);
  }

  static listDatasetVersions(projectId: ID, params?: Record<string, unknown>): ApiRequest<DatasetVersionListResponse> {
    return Api.get<DatasetVersionListResponse>(`/projects/${projectId}/dataset-versions`, { params });
  }

  static getDatasetVersion(versionId: ID): ApiRequest<DatasetVersion> {
    return Api.get<DatasetVersion>(`/dataset-versions/${versionId}`);
  }

  static freezeDatasetVersion(versionId: ID): ApiRequest<DatasetVersion> {
    return Api.post<DatasetVersion>(`/dataset-versions/${versionId}/freeze`);
  }

  static archiveDatasetVersion(versionId: ID): ApiRequest<DatasetVersion> {
    return Api.post<DatasetVersion>(`/dataset-versions/${versionId}/archive`);
  }

  static createExport(projectId: ID, payload: ExportCreatePayload): ApiRequest<ExportJob> {
    return Api.post<ExportJob, ExportCreatePayload>(`/projects/${projectId}/exports`, payload);
  }

  static listExports(projectId: ID, params?: Record<string, unknown>): ApiRequest<ExportJobListResponse> {
    return Api.get<ExportJobListResponse>(`/projects/${projectId}/exports`, { params });
  }

  static getExport(exportId: ID): ApiRequest<ExportJob> {
    return Api.get<ExportJob>(`/exports/${exportId}`);
  }

  static downloadExport(exportId: ID): ApiRequest<Blob> {
    return Api.get<Blob>(`/exports/${exportId}/download`, { responseType: "blob" });
  }

  static cancelExport(exportId: ID): ApiRequest<ExportJob> {
    return Api.post<ExportJob>(`/exports/${exportId}/cancel`);
  }
}

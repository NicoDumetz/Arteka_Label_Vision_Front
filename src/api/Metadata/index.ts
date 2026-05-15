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
  MetadataExportFormatsResponse,
  MetadataMediaTypesResponse,
  MetadataModelFileTypesResponse,
  MetadataModelOutputModesResponse,
  MetadataModelOutputValuesResponse,
  MetadataStatusesResponse,
  MetadataTaskTypesResponse,
  ProjectExportFormatsResponse,
} from "~/types/api";
import type { ID } from "~/types/models";

export class Metadata {
  static taskTypes(): ApiRequest<MetadataTaskTypesResponse> {
    return Api.get<MetadataTaskTypesResponse>("/metadata/task-types");
  }

  static statuses(): ApiRequest<MetadataStatusesResponse> {
    return Api.get<MetadataStatusesResponse>("/metadata/statuses");
  }

  static modelOutputModes(): ApiRequest<MetadataModelOutputModesResponse> {
    return Api.get<MetadataModelOutputModesResponse>("/metadata/model-output-modes");
  }

  static modelOutputValues(): ApiRequest<MetadataModelOutputValuesResponse> {
    return Api.get<MetadataModelOutputValuesResponse>("/metadata/model-output-values");
  }

  static mediaTypes(): ApiRequest<MetadataMediaTypesResponse> {
    return Api.get<MetadataMediaTypesResponse>("/metadata/media-types");
  }

  static modelFileTypes(): ApiRequest<MetadataModelFileTypesResponse> {
    return Api.get<MetadataModelFileTypesResponse>("/metadata/model-file-types");
  }

  static exportFormats(): ApiRequest<MetadataExportFormatsResponse> {
    return Api.get<MetadataExportFormatsResponse>("/metadata/export-formats");
  }

  static projectExportFormats(projectId: ID): ApiRequest<ProjectExportFormatsResponse> {
    return Api.get<ProjectExportFormatsResponse>(`/projects/${projectId}/export-formats`);
  }
}

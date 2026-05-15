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
import type { ApiMessageResponse, ApiRequest, LabelCreatePayload, LabelsResponse, LabelUpdatePayload } from "~/types/api";
import type { ID, Label } from "~/types/models";

export class Labels {
  static create(projectId: ID, payload: LabelCreatePayload): ApiRequest<Label> {
    return Api.post<Label, LabelCreatePayload>(`/projects/${projectId}/labels`, payload);
  }

  static list(projectId: ID, includeInactive = false): ApiRequest<LabelsResponse> {
    return Api.get<LabelsResponse>(`/projects/${projectId}/labels`, {
      params: {
        include_inactive: includeInactive,
      },
    });
  }

  static update(labelId: ID, payload: LabelUpdatePayload): ApiRequest<Label> {
    return Api.patch<Label, LabelUpdatePayload>(`/labels/${labelId}`, payload);
  }

  static delete(labelId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/labels/${labelId}`);
  }
}

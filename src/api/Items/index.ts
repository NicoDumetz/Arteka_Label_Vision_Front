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
import type { AnnotationQueueResponse, ApiMessageResponse, ApiRequest, ItemListResponse } from "~/types/api";
import type { ID, Item, ItemStatus } from "~/types/models";

export interface ItemUpdatePayload {
  status?: ItemStatus;
  metadata_json?: Record<string, unknown> | null;
}

export class Items {
  static list(projectId: ID, params?: Record<string, unknown>): ApiRequest<ItemListResponse> {
    return Api.get<ItemListResponse>(`/projects/${projectId}/items`, { params });
  }

  static getAnnotationQueue(projectId: ID): ApiRequest<AnnotationQueueResponse> {
    return Api.get<AnnotationQueueResponse>(`/projects/${projectId}/annotation-queue`);
  }

  static get(itemId: ID): ApiRequest<Item> {
    return Api.get<Item>(`/items/${itemId}`);
  }

  static update(itemId: ID, payload: ItemUpdatePayload): ApiRequest<Item> {
    return Api.patch<Item, ItemUpdatePayload>(`/items/${itemId}`, payload);
  }

  static delete(itemId: ID): ApiRequest<ApiMessageResponse> {
    return Api.delete<ApiMessageResponse>(`/items/${itemId}`);
  }
}

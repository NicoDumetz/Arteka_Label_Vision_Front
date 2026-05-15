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
import type { ApiRequest, StorageFileListResponse } from "~/types/api";
import type { ID, StorageFile } from "~/types/models";

export interface CleanupTmpPayload {
  older_than_minutes?: number;
  dry_run?: boolean;
}

export interface CleanupPendingDeletePayload {
  limit?: number;
  dry_run?: boolean;
}

export interface CheckConsistencyPayload {
  project_id?: ID | null;
  scan_orphans?: boolean;
  mark_missing?: boolean;
  mark_orphans?: boolean;
  dry_run?: boolean;
}

export interface MaintenanceResponse {
  dry_run: boolean;
  [key: string]: unknown;
}

export class Storage {
  static listFiles(projectId: ID, params?: Record<string, unknown>): ApiRequest<StorageFileListResponse> {
    return Api.get<StorageFileListResponse>(`/projects/${projectId}/storage-files`, { params });
  }

  static getFile(storageFileId: ID): ApiRequest<StorageFile> {
    return Api.get<StorageFile>(`/storage-files/${storageFileId}`);
  }

  static retryDelete(storageFileId: ID): ApiRequest<StorageFile> {
    return Api.post<StorageFile>(`/storage-files/${storageFileId}/retry-delete`);
  }

  static cleanupTmp(payload: CleanupTmpPayload = {}): ApiRequest<MaintenanceResponse> {
    return Api.post<MaintenanceResponse, CleanupTmpPayload>("/maintenance/storage/cleanup-tmp", payload);
  }

  static cleanupPendingDelete(payload: CleanupPendingDeletePayload = {}): ApiRequest<MaintenanceResponse> {
    return Api.post<MaintenanceResponse, CleanupPendingDeletePayload>("/maintenance/storage/cleanup-pending-delete", payload);
  }

  static checkConsistency(payload: CheckConsistencyPayload = {}): ApiRequest<MaintenanceResponse> {
    return Api.post<MaintenanceResponse, CheckConsistencyPayload>("/maintenance/storage/check-consistency", payload);
  }
}

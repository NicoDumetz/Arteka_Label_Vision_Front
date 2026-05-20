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

import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  AdapterConfigTemplate,
  Annotation,
  AnnotationListItem,
  AnnotationPayload,
  Asset,
  DatasetVersion,
  ExportFormat,
  ExportJob,
  FrameCandidate,
  ID,
  Item,
  JobStatus,
  Label,
  ModelAdapter,
  ModelOutputMode,
  ModelOutputValue,
  ModelVersion,
  PredictionJob,
  Project,
  ProjectMember,
  ProjectMemberRole,
  ProjectStatus,
  StorageFile,
  TaskType,
  TrainingJob,
  User,
  UserRole,
} from "~/types/models";

export type ApiRequest<T> = Promise<AxiosResponse<T>>;

export interface ApiStandardError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error?: ApiStandardError;
  detail?: string;
  message?: string;
  statusCode?: number;
  [key: string]: unknown;
}

export type ApiError = AxiosError<ApiErrorResponse>;

export interface ApiRequestConfig extends AxiosRequestConfig {
  withAuth?: boolean;
}

export interface CursorPagination {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface CursorPage<T> {
  data: T[];
  pagination: CursorPagination;
}

export interface ApiMessageResponse {
  detail: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface UserUpdatePayload {
  email?: string;
  username?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string | null;
  task_type: TaskType;
}

export interface ProjectUpdatePayload {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
}

export interface ProjectPurgeResponse {
  detail: string;
  project_id: ID;
  storage_files_marked_pending_delete: number;
}

export interface ProjectMemberCreatePayload {
  user_id: ID;
  role: ProjectMemberRole;
}

export interface ProjectMemberUpdatePayload {
  role: ProjectMemberRole;
}

export interface LabelCreatePayload {
  name: string;
  color?: string | null;
  description?: string | null;
}

export interface LabelUpdatePayload {
  name?: string;
  color?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface AssetUploadPayload {
  file: File;
}

export interface AssetUploadResponse {
  asset: Asset;
  items: Item[];
}

export interface ManualFrameCandidatePayload {
  frame_index?: number | null;
  timestamp_ms?: number | null;
}

export interface ConfirmFrameCandidatesPayload {
  candidate_ids: ID[];
}

export interface ConfirmFrameCandidateItem {
  candidate: FrameCandidate;
  item: Item;
}

export interface ConfirmFrameCandidatesResponse {
  asset_id: ID;
  created_count: number;
  items: Item[];
  data: ConfirmFrameCandidateItem[];
}

export interface AnnotationCreatePayload {
  payload: AnnotationPayload;
}

export interface AnnotationUpdatePayload {
  payload: AnnotationPayload;
}

export interface AnnotationSubmitResponse {
  id: ID;
  status: string;
  submitted_at: string;
}

export interface AnnotationReviewPayload {
  decision: "approved" | "rejected";
  comment?: string | null;
}

export interface ReviewQueueItem {
  annotation_id: ID;
  item_id: ID;
  task_type: TaskType;
  source: string;
  submitted_at: string | null;
  created_by: {
    id: ID;
    username: string;
  } | null;
}

export interface AnnotationQueueResponse {
  item: Item | null;
  latest_annotation: Annotation | null;
  model_draft: Annotation | null;
}

export interface ModelUploadPayload {
  file: File;
  adapter_id: ID;
  name: string;
  version?: string | null;
  architecture?: string | null;
  task_type: TaskType;
  config: Record<string, unknown>;
}

export interface ModelUpdatePayload {
  name?: string;
  version?: string | null;
  architecture?: string | null;
  config?: Record<string, unknown>;
}

export interface ModelAdapterListParams {
  task_type?: TaskType;
  status?: string;
  limit?: number;
  cursor?: string | null;
  search?: string;
  search_mode?: "contains" | "prefix";
}

export interface PredictionCreatePayload {
  model_version_id?: ID | null;
  config?: Record<string, unknown> | null;
}

export interface PredictionBatchPayload {
  model_version_id?: ID | null;
  item_ids?: ID[];
  config?: Record<string, unknown> | null;
}

export interface PredictionBatchJobSummary {
  id: ID;
  item_id: ID;
  status: JobStatus;
  annotation_id: ID | null;
  error: string | null;
}

export interface PredictionBatchError {
  item_id: ID | null;
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface PredictionBatchResponse {
  created_count: number;
  jobs: PredictionBatchJobSummary[];
  errors: PredictionBatchError[];
}

export interface TrainingSettingsUpdatePayload {
  auto_train_enabled?: boolean;
  auto_train_every_n_validated?: number;
  adapter_id?: ID | null;
  architecture?: string | null;
  config?: Record<string, unknown>;
}

export interface TrainingJobCreatePayload {
  adapter_id: ID;
  architecture: string;
  dataset_version_id: ID;
  config?: Record<string, unknown>;
}

export interface DatasetVersionCreatePayload {
  name: string;
  description?: string | null;
  metadata_json?: Record<string, unknown> | null;
}

export interface ExportCreatePayload {
  dataset_version_id: ID;
  format: ExportFormat;
  config?: Record<string, unknown> | null;
}

export interface MetadataTaskType {
  key: TaskType;
  name: string;
  description: string;
}

export interface MetadataItem {
  key: string;
  name?: string;
  description?: string;
  extension?: string;
  supported_extensions?: string[];
  status?: string;
}

export interface MetadataTaskTypesResponse {
  task_types: MetadataTaskType[];
}

export interface MetadataStatusesResponse {
  project_statuses: string[];
  asset_statuses: string[];
  item_statuses: string[];
  annotation_statuses: string[];
  model_statuses: string[];
  job_statuses: JobStatus[];
  dataset_version_statuses: string[];
}

export interface MetadataModelOutputModesResponse {
  classification: Array<MetadataItem & { key: ModelOutputMode }>;
  detection: Array<MetadataItem & { key: ModelOutputMode }>;
  segmentation: Array<MetadataItem & { key: ModelOutputMode }>;
}

export interface MetadataModelOutputValuesResponse {
  output_values: Array<MetadataItem & { key: ModelOutputValue }>;
}

export interface MetadataMediaTypesResponse {
  media_types: MetadataItem[];
}

export interface MetadataModelFileTypesResponse {
  supported_model_file_extensions: MetadataItem[];
  planned_model_file_extensions: MetadataItem[];
}

export type MetadataExportFormatsResponse = Record<TaskType, MetadataItem[]>;

export interface ProjectExportFormatsResponse {
  project_id: ID;
  task_type: TaskType;
  formats: MetadataItem[];
}

export type UserListResponse = CursorPage<User>;
export type ProjectListResponse = CursorPage<Project>;
export type AssetListResponse = CursorPage<Asset>;
export type ItemListResponse = CursorPage<Item>;
export type ReviewQueueResponse = CursorPage<ReviewQueueItem>;
export type StorageFileListResponse = CursorPage<StorageFile>;
export type DatasetVersionListResponse = CursorPage<DatasetVersion>;
export type ExportJobListResponse = CursorPage<ExportJob>;
export type TrainingJobListResponse = CursorPage<TrainingJob>;
export type ModelVersionListResponse = CursorPage<ModelVersion>;
export type PredictionJobListResponse = CursorPage<PredictionJob>;

export type ModelAdaptersResponse = CursorPage<ModelAdapter>;
export type AdapterTemplatesResponse = AdapterConfigTemplate[];
export type LabelsResponse = Label[];
export type ProjectMembersResponse = ProjectMember[];
export type FrameCandidatesResponse = FrameCandidate[];
export type AnnotationsResponse = AnnotationListItem[];

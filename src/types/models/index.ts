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

export type ID = number;
export type ISODateString = string;

export type UserRole = "user" | "admin";
export type ProjectMemberRole = "owner" | "manager" | "annotator" | "validator" | "viewer";

export type TaskType = "classification" | "detection" | "segmentation";

export type ProjectStatus = "draft" | "active" | "archived";
export type AssetMediaType = "image" | "video";
export type AssetStatus = "uploaded" | "processing" | "ready" | "failed" | "archived";
export type ItemStatus = "pending" | "annotating" | "annotated" | "submitted" | "validated" | "rejected" | "skipped";

export type AnnotationSource = "manual" | "model" | "imported";
export type AnnotationStatus = "draft" | "submitted" | "validated" | "rejected" | "archived";
export type ReviewDecision = "approved" | "rejected";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type DatasetVersionStatus = "draft" | "frozen" | "archived";

export type ModelSource = "uploaded" | "trained";
export type ModelStatus = "draft" | "validating" | "ready" | "failed" | "archived";
export type AdapterStatus = "active" | "disabled";

export type ModelOutputMode = "single_label" | "multi_label" | "binary_mask" | "multiclass_mask" | "instance_masks" | "adapter_postprocessed";
export type ModelOutputValue = "logits" | "probabilities" | "class_indices" | "adapter_postprocessed";

export type FrameCandidateStatus = "proposed" | "accepted" | "rejected";
export type FrameCandidateSelectionSource = "auto" | "manual";

export type StorageFileKind =
  | "asset_source"
  | "asset_preview"
  | "frame_candidate"
  | "model_checkpoint"
  | "training_log"
  | "training_artifact"
  | "export_archive"
  | "temp_file";

export type StorageFileStatus = "active" | "pending_delete" | "deleted" | "missing" | "orphan";

export type ExportFormat =
  | "classification_json"
  | "classification_csv_auto"
  | "classification_csv_single_label"
  | "classification_csv_multi_label"
  | "classification_imagenet"
  | "classification_folder_per_class"
  | "detection_yolo"
  | "detection_coco"
  | "detection_labelme"
  | "detection_pascal_voc"
  | "detection_csv"
  | "segmentation_coco"
  | "segmentation_png_masks"
  | "segmentation_rle_json"
  | "segmentation_labelme";

export interface User {
  id: ID;
  email: string;
  username: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: ISODateString;
  updated_at?: ISODateString;
}

export interface Project {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  task_type: TaskType;
  status: ProjectStatus;
  created_by: ID;
  current_user_role?: ProjectMemberRole | null;
  created_at: ISODateString;
  updated_at?: ISODateString;
}

export interface ProjectMember {
  id: ID;
  project_id: ID;
  user_id: ID;
  role: ProjectMemberRole;
  user?: User;
  created_at: ISODateString;
  updated_at?: ISODateString;
}

export interface Label {
  id: ID;
  project_id: ID;
  name: string;
  color: string | null;
  description: string | null;
  is_active: boolean;
  created_at: ISODateString;
  updated_at?: ISODateString;
}

export interface Asset {
  id: ID;
  project_id: ID;
  uploaded_by: ID | null;
  filename: string;
  original_filename: string | null;
  storage_path: string;
  playback_path: string | null;
  preview_path: string | null;
  media_type: AssetMediaType;
  mime_type: string | null;
  file_extension: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  fps: number | null;
  frame_count: number | null;
  status: AssetStatus;
  metadata_json?: Record<string, unknown> | null;
  processing_error?: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Item {
  id: ID;
  project_id: ID;
  asset_id: ID | null;
  file_path: string;
  preview_path: string | null;
  frame_index: number | null;
  timestamp_ms: number | null;
  width: number | null;
  height: number | null;
  status: ItemStatus;
  metadata_json?: Record<string, unknown> | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface FrameCandidate {
  id: ID;
  asset_id: ID;
  created_item_id: ID | null;
  frame_index: number;
  timestamp_ms: number | null;
  frame_path: string;
  preview_path: string | null;
  analysis_path: string | null;
  sharpness_score: number | null;
  contrast_score: number | null;
  similarity_score: number | null;
  quality_score: number | null;
  hash_value: string | null;
  similarity_group: number | null;
  selected_by_default: boolean;
  status: FrameCandidateStatus;
  selection_source: FrameCandidateSelectionSource;
  created_at: ISODateString;
}

export interface MaskRle {
  encoding: "rle";
  size: [number, number];
  counts: number[];
}

export interface ClassificationAnnotationObject {
  label_id: ID;
  shape_type: "classification";
  confidence?: number | null;
}

export interface BboxAnnotationObject {
  label_id: ID;
  shape_type: "bbox";
  bbox: [number, number, number, number];
  confidence?: number | null;
}

export interface PolygonAnnotationObject {
  label_id: ID;
  shape_type: "polygon";
  polygon: [number, number][];
  confidence?: number | null;
}

export interface MaskAnnotationObject {
  label_id: ID;
  shape_type: "mask";
  mask_rle: MaskRle;
  confidence?: number | null;
}

export type AnnotationObject =
  | ClassificationAnnotationObject
  | BboxAnnotationObject
  | PolygonAnnotationObject
  | MaskAnnotationObject;

export interface AnnotationPayload {
  task_type: TaskType;
  objects: AnnotationObject[];
}

export interface Annotation {
  id: ID;
  project_id: ID;
  item_id: ID;
  task_type: TaskType;
  source: AnnotationSource;
  status: AnnotationStatus;
  payload: AnnotationPayload;
  created_by: ID | null;
  model_version_id: ID | null;
  submitted_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface AnnotationListItem {
  id: ID;
  item_id: ID;
  task_type: TaskType;
  source: AnnotationSource;
  status: AnnotationStatus;
  created_by: ID | null;
  model_version_id: ID | null;
  created_at: ISODateString;
}

export interface AnnotationReview {
  id: ID;
  annotation_id: ID;
  reviewed_by: ID;
  decision: ReviewDecision;
  comment: string | null;
  created_at: ISODateString;
  annotation_status?: AnnotationStatus;
}

export interface ModelAdapter {
  id: ID;
  key: string;
  name: string;
  description?: string | null;
  task_type: TaskType;
  status: AdapterStatus;
  supported_architectures: string[];
  supported_output_modes: ModelOutputMode[];
  supported_output_values: ModelOutputValue[];
  default_config?: Record<string, unknown>;
  config_schema?: Record<string, unknown>;
  created_at?: ISODateString;
  updated_at?: ISODateString;
}

export interface AdapterConfigTemplate {
  id: ID;
  adapter_id: ID;
  name: string;
  architecture: string | null;
  description: string | null;
  config: Record<string, unknown>;
  is_default: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface ModelVersion {
  id: ID;
  project_id: ID;
  created_by: ID | null;
  adapter_id: ID;
  adapter?: {
    id: ID;
    key: string;
  } | null;
  name: string;
  version: string | null;
  source: ModelSource;
  task_type: TaskType;
  architecture: string | null;
  status: ModelStatus;
  is_active: boolean;
  checkpoint_path: string | null;
  original_filename?: string | null;
  config: Record<string, unknown>;
  metrics: Record<string, unknown> | null;
  validation_error: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PredictionJob {
  id: ID;
  project_id: ID;
  item_id: ID;
  model_version_id: ID | null;
  annotation_id: ID | null;
  status: JobStatus;
  config?: Record<string, unknown> | null;
  error: string | null;
  created_by: ID | null;
  created_at: ISODateString;
  started_at: ISODateString | null;
  finished_at: ISODateString | null;
}

export interface TrainingSettings {
  id: ID;
  project_id: ID;
  adapter_id: ID | null;
  auto_train_enabled: boolean;
  auto_train_every_n_validated: number;
  architecture: string | null;
  config: Record<string, unknown>;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface TrainingJob {
  id: ID;
  project_id: ID;
  task_type: TaskType;
  adapter_id: ID | null;
  architecture: string | null;
  dataset_version_id: ID;
  base_model_version_id: ID | null;
  output_model_version_id: ID | null;
  trigger_type: "manual" | "auto";
  status: JobStatus;
  config: Record<string, unknown>;
  metrics: Record<string, unknown> | null;
  logs_path: string | null;
  error: string | null;
  created_at: ISODateString;
  started_at: ISODateString | null;
  finished_at: ISODateString | null;
}

export interface DatasetVersion {
  id: ID;
  project_id: ID;
  name: string;
  description: string | null;
  task_type: TaskType;
  status: DatasetVersionStatus;
  metadata_json: Record<string, unknown> | null;
  created_by: ID | null;
  created_at: ISODateString;
  frozen_at: ISODateString | null;
  archived_at: ISODateString | null;
}

export interface ExportJob {
  id: ID;
  project_id: ID;
  dataset_version_id: ID;
  format: ExportFormat;
  status: JobStatus;
  config: Record<string, unknown> | null;
  archive_path: string | null;
  error: string | null;
  created_by: ID | null;
  created_at: ISODateString;
  started_at: ISODateString | null;
  finished_at: ISODateString | null;
}

export interface StorageFile {
  id: ID;
  project_id: ID | null;
  kind: StorageFileKind;
  status: StorageFileStatus;
  owner_type: string | null;
  owner_id: ID | null;
  path: string;
  mime_type: string | null;
  size_bytes: number | null;
  checksum: string | null;
  delete_error: string | null;
  last_checked_at: ISODateString | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  deleted_at: ISODateString | null;
}

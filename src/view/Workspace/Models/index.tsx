// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Wednesday May 20 2026
//
// =============================================================

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import { Metadata, Models, Predictions } from "~/api";
import { ConfirmModal } from "~/components/ConfirmModal";
import { useWorkspace } from "~/contexts/Workspace";
import { cn } from "~/helpers/Cn";
import { getApiErrorMessage } from "~/helpers/api";
import type {
  CursorPage,
  MetadataModelFileTypesResponse,
  ModelUpdatePayload,
  ModelUploadPayload,
  PredictionBatchResponse,
} from "~/types/api";
import type {
  AdapterConfigTemplate,
  ID,
  JobStatus,
  Label,
  ModelAdapter,
  ModelOutputMode,
  ModelOutputValue,
  ModelStatus,
  ModelVersion,
  PredictionJob,
  TaskType,
} from "~/types/models";

type ViewMode = "registry" | "upload" | "detail" | "jobs";
type ModelAction = "validate" | "activate" | "archive" | "delete";

const MODEL_STATUS_STYLES: Record<ModelStatus, string> = {
  draft: "border-white/10 bg-white/5 text-white/60",
  validating: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-error/30 bg-error/10 text-error",
  archived: "border-white/10 bg-white/5 text-white/35",
};

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  pending: "border-white/10 bg-white/5 text-white/55",
  running: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-error/30 bg-error/10 text-error",
  cancelled: "border-white/10 bg-white/5 text-white/35",
};

const TASK_DEFAULT_CONFIG: Record<TaskType, Record<string, unknown>> = {
  classification: {
    input_size: [224, 224],
    output_mode: "multi_label",
    output_values: "logits",
    threshold: 0.5,
    label_map: {},
  },
  detection: {
    input_size: [640, 640],
    output_mode: "adapter_postprocessed",
    output_values: "adapter_postprocessed",
    confidence_threshold: 0.25,
    iou_threshold: 0.45,
    label_map: {},
  },
  segmentation: {
    input_size: [512, 512],
    output_mode: "binary_mask",
    output_values: "logits",
    threshold: 0.5,
    label_map: {},
  },
};

const FALLBACK_OUTPUT_MODES: Record<TaskType, ModelOutputMode[]> = {
  classification: ["single_label", "multi_label"],
  detection: ["adapter_postprocessed"],
  segmentation: ["binary_mask", "multiclass_mask", "instance_masks"],
};

const FALLBACK_OUTPUT_VALUES: Record<TaskType, ModelOutputValue[]> = {
  classification: ["logits", "probabilities", "class_indices"],
  detection: ["adapter_postprocessed"],
  segmentation: ["logits", "probabilities", "class_indices", "adapter_postprocessed"],
};

const OUTPUT_MODE_DESCRIPTIONS: Record<ModelOutputMode, string> = {
  single_label: "The model keeps exactly one class per image. Use this for mutually exclusive categories.",
  multi_label: "The model can return several labels for the same image, using a threshold for each class.",
  binary_mask: "The model returns a foreground/background mask. `label_map` links the foreground output to a project label.",
  multiclass_mask: "Each pixel gets a class index. `label_map` links each output index to a project label.",
  instance_masks: "The model returns separate objects with masks, labels, and scores.",
  adapter_postprocessed: "The adapter already returns the backend's expected internal prediction format.",
};

const OUTPUT_VALUE_DESCRIPTIONS: Record<ModelOutputValue, string> = {
  logits: "Raw model outputs. The backend applies the appropriate activation step.",
  probabilities: "Scores already normalized between 0 and 1.",
  class_indices: "Class indices already computed by the model.",
  adapter_postprocessed: "Outputs already post-processed by the adapter.",
};

const Icons = {
  Upload: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Refresh: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 9A8 8 0 006.4 4.6L4 10m16 4-2.4 5.4A8 8 0 014 15" />
    </svg>
  ),
  Check: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Lightning: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Archive: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l2-3h10l2 3M5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8zm5 4h4" />
    </svg>
  ),
  Delete: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

function getCursorPageData<T>(value: T[] | CursorPage<T>): T[] {
  return Array.isArray(value) ? value : value.data;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stringifyConfig(config: Record<string, unknown>) {
  return JSON.stringify(config, null, 2);
}

function parseConfig(input: string) {
  if (!input.trim()) return {};

  const parsed = JSON.parse(input) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("La config doit être un objet JSON.");
  }

  return parsed as Record<string, unknown>;
}

function safeParseConfig(input: string) {
  try {
    return { config: parseConfig(input), error: null };
  } catch (error) {
    return {
      config: null,
      error: error instanceof Error ? error.message : "Config JSON invalide.",
    };
  }
}

function mergeConfig(base: Record<string, unknown>, patch?: Record<string, unknown> | null) {
  return {
    ...base,
    ...(patch ?? {}),
    label_map: {
      ...((base.label_map as Record<string, unknown> | undefined) ?? {}),
      ...((patch?.label_map as Record<string, unknown> | undefined) ?? {}),
    },
  };
}

function buildInitialConfig(taskType: TaskType, adapter?: ModelAdapter | null, template?: AdapterConfigTemplate | null) {
  return mergeConfig(mergeConfig(TASK_DEFAULT_CONFIG[taskType], adapter?.default_config), template?.config);
}

function readInputSize(config: Record<string, unknown>) {
  const inputSize = config.input_size;
  if (Array.isArray(inputSize) && inputSize.length === 2) {
    return [Number(inputSize[0]) || 0, Number(inputSize[1]) || 0] as const;
  }

  return [0, 0] as const;
}

function configNumber(config: Record<string, unknown>, key: string, fallback = "") {
  const value = config[key];
  return typeof value === "number" ? String(value) : fallback;
}

function updateConfigText(
  currentText: string,
  updater: (config: Record<string, unknown>) => Record<string, unknown>,
) {
  const parsed = parseConfig(currentText);
  return stringifyConfig(updater(parsed));
}

function getModelAdapterKey(model: ModelVersion) {
  return model.adapter?.key ?? `adapter #${model.adapter_id}`;
}

function splitItemIds(value: string) {
  const uniqueIds = new Set<number>();

  value
    .split(/[,\s;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const rangeMatch = entry.match(/^(\d+)\s*-\s*(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;

        const step = start <= end ? 1 : -1;
        for (let current = start; step > 0 ? current <= end : current >= end; current += step) {
          uniqueIds.add(current);
        }
        return;
      }

      if (/^\d+$/.test(entry)) {
        const numericValue = Number(entry);
        uniqueIds.add(numericValue);
      }
    });

  return Array.from(uniqueIds);
}

export default function WorkspaceModels() {
  const { project, labels, canManageModels } = useWorkspace();
  const [view, setView] = useState<ViewMode>("registry");
  const [selectedModelId, setSelectedModelId] = useState<ID | null>(null);
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [jobs, setJobs] = useState<PredictionJob[]>([]);
  const [modelFileTypes, setModelFileTypes] = useState<MetadataModelFileTypesResponse | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === selectedModelId) ?? null,
    [models, selectedModelId],
  );

  const readyModels = useMemo(() => models.filter((model) => model.status === "ready"), [models]);
  const activeModel = useMemo(() => readyModels.find((model) => model.is_active) ?? null, [readyModels]);

  const loadModels = async () => {
    if (!project) return;

    setIsLoadingModels(true);
    setError(null);

    try {
      const [modelsResponse, fileTypesResponse] = await Promise.all([
        Models.list(project.id, { limit: 100 }),
        Metadata.modelFileTypes(),
      ]);

      setModels(getCursorPageData(modelsResponse.data));
      setModelFileTypes(fileTypesResponse.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de charger les modèles."));
    } finally {
      setIsLoadingModels(false);
    }
  };

  const loadJobs = async () => {
    if (!project) return;

    setIsLoadingJobs(true);
    setError(null);

    try {
      const response = await Predictions.list(project.id, { limit: 50 });
      setJobs(getCursorPageData(response.data));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de charger les jobs de prédiction."));
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (!project) return;

    void loadModels();
    void loadJobs();
  }, [project?.id]);

  const upsertModel = (nextModel: ModelVersion) => {
    setModels((current) => {
      const normalized = nextModel.is_active
        ? current.map((model) => (
            model.project_id === nextModel.project_id && model.task_type === nextModel.task_type && model.id !== nextModel.id
              ? { ...model, is_active: false }
              : model
          ))
        : current;

      const exists = normalized.some((model) => model.id === nextModel.id);
      if (!exists) return [nextModel, ...normalized];
      return normalized.map((model) => (model.id === nextModel.id ? { ...model, ...nextModel } : model));
    });
    setSelectedModelId(nextModel.id);
  };

  const removeModel = (modelId: ID) => {
    setModels((current) => current.filter((model) => model.id !== modelId));
    if (selectedModelId === modelId) {
      setSelectedModelId(null);
    }
  };

  if (!project) return null;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] w-full flex-col overflow-y-auto bg-[#08080c] animate-in fade-in duration-500">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-8 py-7 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-300">
                {project.task_type} AI runtime
              </span>
            </div>
            <h2 className="text-4xl font-manrope-extrabold tracking-tight text-white">Workspace Models</h2>
            <p className="mt-2 text-xs font-mono uppercase tracking-widest text-white/40">
              {models.length} versions · {readyModels.length} ready · {activeModel ? `active: ${activeModel.name}` : "no active model"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SegmentedNavigation view={view} onChange={setView} />
            <button
              type="button"
              onClick={() => {
                void loadModels();
                void loadJobs();
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              <Icons.Refresh />
              Refresh
            </button>
            {canManageModels && (
              <button
                type="button"
                onClick={() => setView("upload")}
                className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-black transition-all hover:bg-primary-100"
              >
                <Icons.Upload />
                Upload
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col px-8 py-8 md:px-12">
        {error && (
          <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error">
            ERR: {error}
          </div>
        )}

        {view === "registry" && (
          <ModelsRegistry
            models={models}
            activeModel={activeModel}
            isLoading={isLoadingModels}
            canManage={canManageModels}
            onUpload={() => setView("upload")}
            onDetails={(model) => {
              setSelectedModelId(model.id);
              setView("detail");
            }}
          />
        )}

        {view === "upload" && (
          <ModelUpload
            projectId={project.id}
            taskType={project.task_type}
            labels={labels}
            modelFileTypes={modelFileTypes}
            onCancel={() => setView("registry")}
            onSuccess={(model) => {
              upsertModel(model);
              setView("detail");
            }}
          />
        )}

        {view === "detail" && selectedModel && (
          <ModelDetails
            model={selectedModel}
            labels={labels}
            canManage={canManageModels}
            onBack={() => setView("registry")}
            onUpdated={upsertModel}
            onDeleted={(modelId) => {
              removeModel(modelId);
              setView("registry");
            }}
          />
        )}

        {view === "jobs" && (
          <PredictionJobs
            projectId={project.id}
            models={readyModels}
            activeModel={activeModel}
            jobs={jobs}
            isLoading={isLoadingJobs}
            canManage={canManageModels}
            onRefresh={loadJobs}
            onJobCreated={(response, modelVersionId) => {
              const createdJobs: PredictionJob[] = response.jobs.map((job) => ({
                id: job.id,
                project_id: project.id,
                item_id: job.item_id,
                model_version_id: modelVersionId,
                annotation_id: job.annotation_id,
                status: job.status,
                config: null,
                error: job.error,
                created_by: null,
                created_at: new Date().toISOString(),
                started_at: null,
                finished_at: null,
              }));
              setJobs((current) => [...createdJobs, ...current]);
            }}
            onJobUpdated={(job) => {
              setJobs((current) => current.map((candidate) => (candidate.id === job.id ? job : candidate)));
            }}
          />
        )}
      </div>
    </div>
  );
}

interface SegmentedNavigationProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

function SegmentedNavigation({ view, onChange }: SegmentedNavigationProps) {
  const items: Array<{ key: ViewMode; label: string }> = [
    { key: "registry", label: "Registry" },
    { key: "jobs", label: "Jobs" },
  ];

  return (
    <div className="flex rounded-lg border border-white/10 bg-black/30 p-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-md px-4 py-2 text-[10px] font-manrope-extrabold uppercase tracking-widest transition-all",
            view === item.key ? "bg-white text-black" : "text-white/45 hover:text-white",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

interface ModelsRegistryProps {
  models: ModelVersion[];
  activeModel: ModelVersion | null;
  isLoading: boolean;
  canManage: boolean;
  onUpload: () => void;
  onDetails: (model: ModelVersion) => void;
}

function ModelsRegistry({ models, activeModel, isLoading, canManage, onUpload, onDetails }: ModelsRegistryProps) {
  const counts = useMemo(
    () => ({
      draft: models.filter((model) => model.status === "draft").length,
      ready: models.filter((model) => model.status === "ready").length,
      failed: models.filter((model) => model.status === "failed").length,
      archived: models.filter((model) => model.status === "archived").length,
    }),
    [models],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Active" value={activeModel?.name ?? "None"} tone={activeModel ? "good" : "muted"} />
        <Metric label="Ready" value={counts.ready} tone="good" />
        <Metric label="Draft" value={counts.draft} tone="muted" />
        <Metric label="Failed" value={counts.failed} tone={counts.failed ? "bad" : "muted"} />
        <Metric label="Archived" value={counts.archived} tone="muted" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.01] text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-white/40">No model version in this workspace</p>
          {canManage && (
            <button
              type="button"
              onClick={onUpload}
              className="mt-6 rounded-lg bg-white px-6 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-black transition-all hover:bg-primary-100"
            >
              Upload first model
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => onDetails(model)}
              className="group min-h-[260px] rounded-lg border border-white/5 bg-white/[0.02] p-6 text-left transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <StatusBadge status={model.status} />
                <div className="flex flex-col items-end gap-2">
                  {model.is_active && (
                    <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-emerald-300">
                      Active
                    </span>
                  )}
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/35">{model.source}</span>
                </div>
              </div>

              <h3 className="mt-5 line-clamp-2 text-xl font-manrope-extrabold text-white">{model.name}</h3>
              <p className="mt-2 text-xs font-mono uppercase tracking-widest text-white/40">
                {model.version ?? "No version"} · {model.architecture || "No architecture"}
              </p>
              <p className="mt-1 text-xs font-mono uppercase tracking-widest text-white/30">
                {getModelAdapterKey(model)}
              </p>
              <p className="mt-1 text-xs font-mono uppercase tracking-widest text-white/30">
                Created {formatDate(model.created_at)}
              </p>

              {model.validation_error && (
                <p className="mt-4 line-clamp-3 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-[11px] text-error">
                  {model.validation_error}
                </p>
              )}

              <div className="mt-6 text-xs font-manrope-extrabold uppercase tracking-widest text-primary-300 transition-colors group-hover:text-white">
                Inspect model
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
  tone: "good" | "bad" | "muted";
}

function Metric({ label, value, tone }: MetricProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-5 py-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{label}</p>
      <p className={cn(
        "mt-2 truncate text-lg font-manrope-extrabold",
        tone === "good" && "text-emerald-300",
        tone === "bad" && "text-error",
        tone === "muted" && "text-white",
      )}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  return (
    <span className={cn("rounded border px-2 py-1 text-[9px] font-mono uppercase tracking-widest", MODEL_STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

interface JobStatusBadgeProps {
  status: JobStatus;
}

function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return (
    <span className={cn("rounded border px-2 py-1 text-[9px] font-mono uppercase tracking-widest", JOB_STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

interface ModelUploadProps {
  projectId: ID;
  taskType: TaskType;
  labels: Label[];
  modelFileTypes: MetadataModelFileTypesResponse | null;
  onCancel: () => void;
  onSuccess: (model: ModelVersion) => void;
}

function ModelUpload({ projectId, taskType, labels, modelFileTypes, onCancel, onSuccess }: ModelUploadProps) {
  const [adapters, setAdapters] = useState<ModelAdapter[]>([]);
  const [templates, setTemplates] = useState<AdapterConfigTemplate[]>([]);
  const [loadingAdapters, setLoadingAdapters] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [adapterId, setAdapterId] = useState<ID | "">("");
  const [templateId, setTemplateId] = useState<ID | "">("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [configText, setConfigText] = useState(stringifyConfig(TASK_DEFAULT_CONFIG[taskType]));

  const selectedAdapter = adapters.find((adapter) => adapter.id === adapterId) ?? null;

  const supportedExtensions = (modelFileTypes?.supported_model_file_extensions ?? [])
    .map((entry) => entry.extension ?? entry.key)
    .filter(Boolean);

  useEffect(() => {
    let isActive = true;

    async function loadAdapters() {
      setLoadingAdapters(true);
      setError(null);

      try {
        const response = await Models.listAdapters({ task_type: taskType, status: "active", limit: 100 });
        if (!isActive) return;

        const nextAdapters = getCursorPageData(response.data).filter((adapter) => adapter.status === "active");
        setAdapters(nextAdapters);

        const defaultAdapter = nextAdapters[0] ?? null;
        setAdapterId(defaultAdapter?.id ?? "");
        setArchitecture(defaultAdapter?.supported_architectures?.[0] ?? "");
        setConfigText(stringifyConfig(buildInitialConfig(taskType, defaultAdapter)));
      } catch (requestError) {
        if (!isActive) return;
        setError(getApiErrorMessage(requestError, "Impossible de charger les adapters."));
      } finally {
        if (isActive) setLoadingAdapters(false);
      }
    }

    void loadAdapters();

    return () => {
      isActive = false;
    };
  }, [taskType]);

  useEffect(() => {
    if (!selectedAdapter) {
      setTemplates([]);
      setTemplateId("");
      return;
    }

    let isActive = true;
    const adapterForTemplates = selectedAdapter;

    async function loadTemplates() {
      setLoadingTemplates(true);
      setError(null);

      try {
        const response = await Models.listAdapterTemplates(adapterForTemplates.id);
        if (!isActive) return;

        const nextTemplates = response.data;
        const defaultTemplate = nextTemplates.find((template) => template.is_default) ?? nextTemplates[0] ?? null;

        setTemplates(nextTemplates);
        setTemplateId(defaultTemplate?.id ?? "");
        setArchitecture(defaultTemplate?.architecture ?? adapterForTemplates.supported_architectures?.[0] ?? "");
        setConfigText(stringifyConfig(buildInitialConfig(taskType, adapterForTemplates, defaultTemplate)));
      } catch (requestError) {
        if (!isActive) return;
        setTemplates([]);
        setTemplateId("");
        setConfigText(stringifyConfig(buildInitialConfig(taskType, adapterForTemplates)));
        setError(getApiErrorMessage(requestError, "Impossible de charger les templates de config."));
      } finally {
        if (isActive) setLoadingTemplates(false);
      }
    }

    void loadTemplates();

    return () => {
      isActive = false;
    };
  }, [selectedAdapter?.id, taskType]);

  const handleTemplateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value ? Number(event.target.value) : "";
    setTemplateId(nextId);

    const template = templates.find((candidate) => candidate.id === nextId) ?? null;
    setArchitecture(template?.architecture ?? selectedAdapter?.supported_architectures?.[0] ?? "");
    setConfigText(stringifyConfig(buildInitialConfig(taskType, selectedAdapter, template)));
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Le fichier checkpoint est requis.");
      return;
    }

    if (!selectedAdapter) {
      setError("Un adapter actif est requis.");
      return;
    }

    if (!name.trim()) {
      setError("Le nom du modèle est requis.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: ModelUploadPayload = {
        file,
        adapter_id: selectedAdapter.id,
        name: name.trim(),
        version: version.trim() || null,
        task_type: taskType,
        architecture: architecture.trim() || null,
        config: parseConfig(configText),
      };

      const response = await Models.upload(projectId, payload);
      onSuccess(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible d'uploader le modèle."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h3 className="text-2xl font-manrope-extrabold text-white">Upload Model</h3>
            <p className="mt-2 text-sm text-white/50">
              New uploads start as drafts. Validate them before activation.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error">
            ERR: {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Field label="Checkpoint file">
            <input
              type="file"
              accept={supportedExtensions.join(",")}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                if (nextFile && !name.trim()) {
                  setName(nextFile.name.replace(/\.[^.]+$/, ""));
                }
              }}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-black"
            />
          </Field>

          <Field label="Model name">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-primary-500 focus:outline-none"
              placeholder="ResNet18 voitures"
            />
          </Field>

          <Field label="Version">
            <input
              type="text"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-primary-500 focus:outline-none"
              placeholder="v1"
            />
          </Field>

          <Field label="Adapter">
            <select
              value={adapterId}
              onChange={(event) => setAdapterId(event.target.value ? Number(event.target.value) : "")}
              disabled={loadingAdapters || adapters.length === 0}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">{loadingAdapters ? "Loading adapters..." : "Select adapter"}</option>
              {adapters.map((adapter) => (
                <option key={adapter.id} value={adapter.id}>{adapter.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Template">
            <select
              value={templateId}
              onChange={handleTemplateChange}
              disabled={!selectedAdapter || loadingTemplates || templates.length === 0}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">{loadingTemplates ? "Loading templates..." : "No template"}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Architecture">
            {selectedAdapter?.supported_architectures?.length ? (
              <select
                value={architecture}
                onChange={(event) => setArchitecture(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="">No architecture</option>
                {selectedAdapter.supported_architectures.map((candidate) => (
                  <option key={candidate} value={candidate}>{candidate}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={architecture}
                onChange={(event) => setArchitecture(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-primary-500 focus:outline-none"
                placeholder="Optional"
              />
            )}
          </Field>
        </div>

        <ConfigBuilder
          className="mt-7"
          taskType={taskType}
          adapter={selectedAdapter}
          labels={labels}
          configText={configText}
          onChange={setConfigText}
        />

        <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || loadingAdapters}
            className="rounded-lg bg-primary-500 px-6 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-primary-400 disabled:opacity-50"
          >
            {isSubmitting ? "Uploading..." : "Create draft"}
          </button>
        </div>
      </div>

      <AdapterPanel adapter={selectedAdapter} modelFileTypes={modelFileTypes} templates={templates} />
    </div>
  );
}

interface FieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function Field({ label, description, children }: FieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-white/50">{label}</label>
      {children}
      {description && (
        <p className="mt-2 text-[11px] leading-relaxed text-white/35">{description}</p>
      )}
    </div>
  );
}

interface AdapterPanelProps {
  adapter: ModelAdapter | null;
  templates: AdapterConfigTemplate[];
  modelFileTypes: MetadataModelFileTypesResponse | null;
}

function AdapterPanel({ adapter, templates, modelFileTypes }: AdapterPanelProps) {
  const supportedExtensions = modelFileTypes?.supported_model_file_extensions ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-sm font-manrope-extrabold text-white">Adapter Contract</h3>
        <p className="mt-3 text-sm text-white/50">
          {adapter?.description || "Select an adapter to inspect the supported architectures and output formats."}
        </p>

        <div className="mt-5 space-y-4">
          <InfoRow label="Key" value={adapter?.key ?? "-"} />
          <InfoRow label="Task" value={adapter?.task_type ?? "-"} />
          <InfoRow label="Status" value={adapter?.status ?? "-"} />
          <InfoRow label="Architectures" value={adapter?.supported_architectures?.join(", ") || "-"} />
          <InfoRow label="Output modes" value={adapter?.supported_output_modes?.join(", ") || "-"} />
          <InfoRow label="Output values" value={adapter?.supported_output_values?.join(", ") || "-"} />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-sm font-manrope-extrabold text-white">Templates</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {templates.length === 0 ? (
            <span className="text-xs text-white/35">No template loaded.</span>
          ) : templates.map((template) => (
            <span key={template.id} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60">
              {template.name}{template.is_default ? " · default" : ""}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-sm font-manrope-extrabold text-white">Files</h3>
        <div className="mt-4 space-y-3">
          {supportedExtensions.length === 0 ? (
            <p className="text-xs text-white/40">Supported file metadata unavailable.</p>
          ) : supportedExtensions.map((entry) => (
            <div key={entry.extension ?? entry.key} className="rounded border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-xs font-mono text-white">{entry.extension ?? entry.key}</p>
              <p className="mt-1 text-[11px] text-white/40">{entry.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/35">{label}</p>
      <p className="mt-1 break-words text-sm text-white/70">{value}</p>
    </div>
  );
}

interface ConfigBuilderProps {
  className?: string;
  taskType: TaskType;
  adapter: ModelAdapter | null;
  labels: Label[];
  configText: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ConfigBuilder({ className, taskType, adapter, labels, configText, onChange, disabled }: ConfigBuilderProps) {
  const parsed = safeParseConfig(configText);
  const config = parsed.config ?? {};
  const [inputWidth, inputHeight] = readInputSize(config);
  const outputMode = typeof config.output_mode === "string" ? config.output_mode : "";
  const outputValues = typeof config.output_values === "string" ? config.output_values : "";
  const outputModeOptions = adapter?.supported_output_modes?.length
    ? adapter.supported_output_modes
    : FALLBACK_OUTPUT_MODES[taskType];
  const outputValueOptions = adapter?.supported_output_values?.length
    ? adapter.supported_output_values
    : FALLBACK_OUTPUT_VALUES[taskType];

  const setConfig = (updater: (current: Record<string, unknown>) => Record<string, unknown>) => {
    try {
      onChange(updateConfigText(configText, updater));
    } catch {
      onChange(configText);
    }
  };

  const setField = (key: string, value: unknown) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const setInputSize = (index: 0 | 1, value: string) => {
    const parsedValue = Number(value);
    setConfig((current) => {
      const nextSize = [...readInputSize(current)] as [number, number];
      nextSize[index] = Number.isFinite(parsedValue) ? parsedValue : 0;
      return { ...current, input_size: nextSize };
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-5 rounded-lg border border-white/10 bg-black/20 p-5">
        <div>
          <h4 className="text-sm font-manrope-extrabold text-white">Model Config</h4>
          <p className="mt-1 text-xs text-white/40">These fields build the config sent to the backend. The advanced JSON stays in sync.</p>
        </div>

        {parsed.error && (
          <div className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-xs font-mono text-error">
            {parsed.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Input width" description="Resize width applied before inference.">
            <input
              type="number"
              min={1}
              value={inputWidth || ""}
              onChange={(event) => setInputSize(0, event.target.value)}
              disabled={disabled || !!parsed.error}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
          </Field>
          <Field label="Input height" description="Resize height applied before inference. Keep it consistent with the model training setup.">
            <input
              type="number"
              min={1}
              value={inputHeight || ""}
              onChange={(event) => setInputSize(1, event.target.value)}
              disabled={disabled || !!parsed.error}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ConfigSelect
            label="Output mode"
            value={outputMode}
            options={outputModeOptions}
            descriptions={OUTPUT_MODE_DESCRIPTIONS}
            disabled={disabled || !!parsed.error}
            onChange={(value) => setField("output_mode", value)}
          />
          <ConfigSelect
            label="Output values"
            value={outputValues}
            options={outputValueOptions}
            descriptions={OUTPUT_VALUE_DESCRIPTIONS}
            disabled={disabled || !!parsed.error}
            onChange={(value) => setField("output_values", value)}
          />
        </div>

        {taskType === "classification" && outputMode === "multi_label" && (
          <ThresholdInput
            label="Threshold"
            description="Minimum score required to keep a class in multi-label mode. `0.5` is a reasonable starting point."
            value={configNumber(config, "threshold", "0.5")}
            disabled={disabled || !!parsed.error}
            onChange={(value) => setField("threshold", Number(value))}
          />
        )}

        {taskType === "segmentation" && outputMode === "binary_mask" && (
          <ThresholdInput
            label="Mask threshold"
            description="Threshold applied to the binary mask to decide foreground versus background."
            value={configNumber(config, "threshold", "0.5")}
            disabled={disabled || !!parsed.error}
            onChange={(value) => setField("threshold", Number(value))}
          />
        )}

        {taskType === "detection" && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ThresholdInput
              label="Confidence"
              description="Minimum score required to keep a detected bounding box."
              value={configNumber(config, "confidence_threshold", "0.25")}
              disabled={disabled || !!parsed.error}
              onChange={(value) => setField("confidence_threshold", Number(value))}
            />
            <ThresholdInput
              label="IOU"
              description="Overlap threshold used to suppress duplicate detections during post-processing."
              value={configNumber(config, "iou_threshold", "0.45")}
              disabled={disabled || !!parsed.error}
              onChange={(value) => setField("iou_threshold", Number(value))}
            />
          </div>
        )}

        <LabelMapEditor
          labels={labels}
          config={config}
          disabled={disabled || !!parsed.error}
          onChange={(labelMap) => setField("label_map", labelMap)}
        />
      </div>

      <details className="rounded-lg border border-white/10 bg-black/20 p-5">
        <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-widest text-white/50">
          Advanced JSON
        </summary>
        <p className="mt-3 text-xs text-white/40">
          Technical view of the same config. Editing this JSON also updates the fields above as long as it stays valid.
        </p>
        <textarea
          rows={14}
          value={configText}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          spellCheck={false}
          className="mt-4 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs leading-relaxed text-white placeholder:text-white/25 focus:border-primary-500 focus:outline-none disabled:opacity-60"
        />
      </details>
    </div>
  );
}

interface ConfigSelectProps<T extends string> {
  label: string;
  value: string;
  options: T[];
  descriptions: Record<T, string>;
  disabled?: boolean;
  onChange: (value: T) => void;
}

function ConfigSelect<T extends ModelOutputMode | ModelOutputValue>({ label, value, options, descriptions, disabled, onChange }: ConfigSelectProps<T>) {
  const selectedDescription = value && value in descriptions ? descriptions[value as T] : "Select a value supported by the current adapter.";

  return (
    <Field label={label} description={selectedDescription}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        disabled={disabled || options.length === 0}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </Field>
  );
}

function ThresholdInput({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} description={description}>
      <input
        type="number"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
      />
    </Field>
  );
}

interface LabelMapEditorProps {
  labels: Label[];
  config: Record<string, unknown>;
  disabled?: boolean;
  onChange: (labelMap: Record<string, number>) => void;
}

function LabelMapEditor({ labels, config, disabled, onChange }: LabelMapEditorProps) {
  const labelMap = config.label_map && typeof config.label_map === "object" && !Array.isArray(config.label_map)
    ? config.label_map as Record<string, unknown>
    : {};

  const rows = Object.entries(labelMap).map(([outputKey, labelId]) => ({
    outputKey,
    labelId: Number(labelId),
  }));

  const commitRows = (nextRows: Array<{ outputKey: string; labelId: number }>) => {
    onChange(Object.fromEntries(
      nextRows
        .filter((row) => row.outputKey.trim() && Number.isFinite(row.labelId))
        .map((row) => [row.outputKey.trim(), row.labelId]),
    ));
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50">Label map</label>
          <p className="mt-1 text-[11px] leading-relaxed text-white/35">
            Map each model output key to a project label. Example: output `0` can point to the backend label `Car`.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || labels.length === 0}
          onClick={() => commitRows([...rows, { outputKey: String(rows.length), labelId: labels[0]?.id ?? 0 }])}
          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-white/60 hover:bg-white/10 disabled:opacity-40"
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {rows.length > 0 && (
          <div className="grid grid-cols-[90px_minmax(0,1fr)_34px] gap-2 px-1 text-[10px] font-mono uppercase tracking-widest text-white/30">
            <span>Output</span>
            <span>Project label</span>
            <span />
          </div>
        )}
        {rows.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-xs text-white/35">
            No mapping defined yet. Strict backend validation may require a `label_map`.
          </p>
        ) : rows.map((row, index) => (
          <div key={`${row.outputKey}-${index}`} className="grid grid-cols-[90px_minmax(0,1fr)_34px] gap-2">
            <input
              type="text"
              value={row.outputKey}
              disabled={disabled}
              onChange={(event) => {
                const nextRows = rows.map((candidate, candidateIndex) => (
                  candidateIndex === index ? { ...candidate, outputKey: event.target.value } : candidate
                ));
                commitRows(nextRows);
              }}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
              placeholder="0"
            />
            <select
              value={row.labelId}
              disabled={disabled || labels.length === 0}
              onChange={(event) => {
                const nextRows = rows.map((candidate, candidateIndex) => (
                  candidateIndex === index ? { ...candidate, labelId: Number(event.target.value) } : candidate
                ));
                commitRows(nextRows);
              }}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
            >
              {labels.map((label) => (
                <option key={label.id} value={label.id}>{label.name}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled}
              onClick={() => commitRows(rows.filter((_, candidateIndex) => candidateIndex !== index))}
              className="rounded-lg border border-white/10 bg-white/5 text-white/50 hover:bg-error/10 hover:text-error disabled:opacity-40"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ModelDetailsProps {
  model: ModelVersion;
  labels: Label[];
  canManage: boolean;
  onBack: () => void;
  onUpdated: (model: ModelVersion) => void;
  onDeleted: (modelId: ID) => void;
}

function ModelDetails({ model, labels, canManage, onBack, onUpdated, onDeleted }: ModelDetailsProps) {
  const [currentModel, setCurrentModel] = useState(model);
  const [adapter, setAdapter] = useState<ModelAdapter | null>(null);
  const [name, setName] = useState(model.name);
  const [version, setVersion] = useState(model.version ?? "");
  const [architecture, setArchitecture] = useState(model.architecture ?? "");
  const [configText, setConfigText] = useState(stringifyConfig(model.config ?? {}));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<ModelAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ModelAction | null>(null);

  useEffect(() => {
    setCurrentModel(model);
    setName(model.name);
    setVersion(model.version ?? "");
    setArchitecture(model.architecture ?? "");
    setConfigText(stringifyConfig(model.config ?? {}));
    setError(null);
  }, [model]);

  useEffect(() => {
    let isActive = true;

    async function loadAdapter() {
      try {
        const response = await Models.getAdapter(model.adapter_id);
        if (isActive) setAdapter(response.data);
      } catch {
        if (isActive) setAdapter(null);
      }
    }

    void loadAdapter();

    return () => {
      isActive = false;
    };
  }, [model.adapter_id]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const payload: ModelUpdatePayload = {
        name: name.trim() || currentModel.name,
        version: version.trim() || null,
        architecture: architecture.trim() || null,
        config: parseConfig(configText),
      };

      const response = await Models.update(currentModel.id, payload);
      setCurrentModel(response.data);
      onUpdated(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de mettre à jour le modèle."));
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (action: Exclude<ModelAction, "delete">) => {
    setActionLoading(action);
    setError(null);

    try {
      const response = await (
        action === "validate"
          ? Models.validate(currentModel.id)
          : action === "activate"
            ? Models.activate(currentModel.id)
            : Models.archive(currentModel.id)
      );

      setCurrentModel(response.data);
      onUpdated(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Impossible d'exécuter l'action ${action}.`));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading("delete");
    setError(null);

    try {
      await Models.delete(currentModel.id);
      onDeleted(currentModel.id);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de supprimer le modèle."));
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 text-xs font-manrope-extrabold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            Back to registry
          </button>

          {error && (
            <div className="mb-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error">
              ERR: {error}
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={currentModel.status} />
            {currentModel.is_active && (
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-emerald-300">
                Active in project
              </span>
            )}
            <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-white/50">
              {currentModel.source}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canManage}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-60"
              />
            </Field>

            <Field label="Version">
              <input
                type="text"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                disabled={!canManage}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-60"
              />
            </Field>

            <Field label="Architecture">
              {adapter?.supported_architectures?.length ? (
                <select
                  value={architecture}
                  onChange={(event) => setArchitecture(event.target.value)}
                  disabled={!canManage}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="">No architecture</option>
                  {adapter.supported_architectures.map((candidate) => (
                    <option key={candidate} value={candidate}>{candidate}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={architecture}
                  onChange={(event) => setArchitecture(event.target.value)}
                  disabled={!canManage}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none disabled:opacity-60"
                />
              )}
            </Field>
          </div>

          <ConfigBuilder
            className="mt-7"
            taskType={currentModel.task_type}
            adapter={adapter}
            labels={labels}
            configText={configText}
            onChange={setConfigText}
            disabled={!canManage}
          />

          {canManage && (
            <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-lg bg-white px-6 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-black transition-all hover:bg-primary-100 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save draft config"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-manrope-extrabold text-white">Runtime</h3>
            <div className="mt-4 space-y-4">
              <InfoRow label="Model ID" value={String(currentModel.id)} />
              <InfoRow label="Adapter" value={getModelAdapterKey(currentModel)} />
              <InfoRow label="Task type" value={currentModel.task_type} />
              <InfoRow label="Created" value={formatDate(currentModel.created_at)} />
              <InfoRow label="Updated" value={formatDate(currentModel.updated_at)} />
              <InfoRow label="Checkpoint" value={currentModel.original_filename || currentModel.checkpoint_path || "-"} />
            </div>
          </div>

          {currentModel.metrics && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-manrope-extrabold text-white">Metrics</h3>
              <pre className="mt-4 overflow-x-auto rounded-lg bg-black/30 p-4 font-mono text-[11px] text-white/70">
                {stringifyConfig(currentModel.metrics)}
              </pre>
            </div>
          )}

          {currentModel.validation_error && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-6">
              <h3 className="text-sm font-manrope-extrabold text-error">Validation Error</h3>
              <p className="mt-3 text-sm text-error">{currentModel.validation_error}</p>
            </div>
          )}

          {canManage && (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-manrope-extrabold text-white">Actions</h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => void runAction("validate")}
                  disabled={actionLoading !== null || !["draft", "failed"].includes(currentModel.status)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-40"
                >
                  <Icons.Check />
                  {actionLoading === "validate" ? "Validating..." : "Validate"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("activate")}
                  disabled={actionLoading !== null || currentModel.status !== "ready"}
                  className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-40"
                >
                  <Icons.Lightning />
                  {actionLoading === "activate" ? "Activating..." : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => void runAction("archive")}
                  disabled={actionLoading !== null || currentModel.status === "archived"}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-40"
                >
                  <Icons.Archive />
                  {actionLoading === "archive" ? "Archiving..." : "Archive"}
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmAction("delete")}
                  disabled={actionLoading !== null}
                  className="flex items-center justify-center gap-2 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-error transition-all hover:bg-error/20 disabled:opacity-40"
                >
                  <Icons.Delete />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction === "delete"}
        type="delete"
        title="Delete Model"
        message={`Supprimer "${currentModel.name}" ?`}
        onConfirm={handleDelete}
        onClose={() => setConfirmAction(null)}
        isLoading={actionLoading === "delete"}
      />
    </>
  );
}

interface PredictionJobsProps {
  projectId: ID;
  models: ModelVersion[];
  activeModel: ModelVersion | null;
  jobs: PredictionJob[];
  isLoading: boolean;
  canManage: boolean;
  onRefresh: () => Promise<void>;
  onJobCreated: (response: PredictionBatchResponse, modelVersionId: ID | null) => void;
  onJobUpdated: (job: PredictionJob) => void;
}

function PredictionJobs({ projectId, models, activeModel, jobs, isLoading, canManage, onRefresh, onJobCreated, onJobUpdated }: PredictionJobsProps) {
  const [modelId, setModelId] = useState<ID | "">("");
  const [itemIdsText, setItemIdsText] = useState("");
  const [configText, setConfigText] = useState("{}");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<PredictionBatchResponse | null>(null);

  const terminalStatuses: JobStatus[] = ["completed", "failed", "cancelled"];

  const handleBatchPredict = async () => {
    setIsSubmitting(true);
    setError(null);
    setBatchResult(null);

    try {
      const itemIds = splitItemIds(itemIdsText);
      const response = await Predictions.predictBatch(projectId, {
        model_version_id: modelId || null,
        item_ids: itemIds.length ? itemIds : undefined,
        config: parseConfig(configText),
      });

      setBatchResult(response.data);
      onJobCreated(response.data, (modelId || activeModel?.id) ?? null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible de créer les jobs de prédiction."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (jobId: ID) => {
    try {
      const response = await Predictions.cancel(jobId);
      onJobUpdated(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Impossible d'annuler le job."));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-lg font-manrope-extrabold text-white">Create Prediction Jobs</h3>
        <p className="mt-2 text-sm text-white/50">
          If no model is selected, the backend uses the project's active ready model.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error">
            ERR: {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
          <Field label="Model">
            <select
              value={modelId}
              onChange={(event) => setModelId(event.target.value ? Number(event.target.value) : "")}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="">Use active model{activeModel ? ` (${activeModel.name})` : ""}</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>{model.name} {model.version ? `· ${model.version}` : ""}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Item IDs"
            description="Optional. Use commas, spaces, or ranges such as `1-10 18 22-24`. Leave empty to let the backend pick pending items."
          >
            <input
              type="text"
              value={itemIdsText}
              onChange={(event) => setItemIdsText(event.target.value)}
              placeholder="1-10 18 22-24"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-primary-500 focus:outline-none"
            />
          </Field>

          <Field label="Runtime config">
            <textarea
              rows={8}
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
              spellCheck={false}
              className="w-full resize-none rounded-lg border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-white focus:border-primary-500 focus:outline-none"
            />
          </Field>

          <button
            type="button"
            onClick={() => void handleBatchPredict()}
            disabled={!canManage || isSubmitting}
            className="w-full rounded-lg bg-primary-500 px-5 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-primary-400 disabled:opacity-40"
          >
            {isSubmitting ? "Creating..." : "Create batch jobs"}
          </button>
        </div>

        {batchResult && (
          <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-white/50">
              Created {batchResult.created_count} jobs
            </p>
            {batchResult.errors.length > 0 && (
              <div className="mt-3 space-y-2">
                {batchResult.errors.map((entry, index) => (
                  <p key={`${entry.code}-${index}`} className="text-xs text-error">
                    {entry.item_id ? `Item ${entry.item_id}: ` : ""}{entry.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-manrope-extrabold text-white">Prediction Jobs</h3>
            <p className="mt-1 text-xs text-white/40">A completed job creates a draft annotation with `source=model`.</p>
          </div>
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 hover:bg-white/10"
          >
            <Icons.Refresh />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-lg border border-white/5 bg-white/[0.02]" />
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/20 px-5 py-12 text-center text-xs font-mono uppercase tracking-widest text-white/35">
            No prediction jobs yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Annotation</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="bg-white/[0.02] text-sm text-white/70">
                    <td className="rounded-l-lg px-3 py-3 font-mono text-white">{job.id}</td>
                    <td className="px-3 py-3 font-mono">{job.item_id}</td>
                    <td className="px-3 py-3 font-mono">{job.model_version_id ?? "active"}</td>
                    <td className="px-3 py-3"><JobStatusBadge status={job.status} /></td>
                    <td className="px-3 py-3 font-mono">{job.annotation_id ?? "-"}</td>
                    <td className="px-3 py-3 font-mono text-xs">{formatDate(job.created_at)}</td>
                    <td className="rounded-r-lg px-3 py-3 text-right">
                      {!terminalStatuses.includes(job.status) ? (
                        <button
                          type="button"
                          onClick={() => void handleCancel(job.id)}
                          disabled={!canManage}
                          className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/60 hover:bg-error/10 hover:text-error disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-white/25">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

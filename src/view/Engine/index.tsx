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
// Created     : Friday May 15 2026
//
// =============================================================

import { useEffect, useState } from "react";
import { Metadata, Models } from "~/api";
import { getApiErrorMessage } from "~/helpers/api";
import type {
  MetadataExportFormatsResponse,
  MetadataStatusesResponse,
  MetadataTaskTypesResponse,
} from "~/types/api";
import type { AdapterConfigTemplate, ID, ModelAdapter } from "~/types/models";

function readListResponse<T>(payload: T[] | { data?: T[] }) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export default function AdminEnginePage() {
  const [adapters, setAdapters] = useState<ModelAdapter[]>([]);
  const [templatesByAdapter, setTemplatesByAdapter] = useState<Record<ID, AdapterConfigTemplate[]>>({});
  const [taskTypes, setTaskTypes] = useState<MetadataTaskTypesResponse | null>(null);
  const [statuses, setStatuses] = useState<MetadataStatusesResponse | null>(null);
  const [exportFormats, setExportFormats] = useState<MetadataExportFormatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadEngine() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [adaptersResponse, taskTypesResponse, statusesResponse, exportFormatsResponse] = await Promise.all([
          Models.listAdapters(),
          Metadata.taskTypes(),
          Metadata.statuses(),
          Metadata.exportFormats(),
        ]);

        if (!isActive) return;

        const nextAdapters = readListResponse<ModelAdapter>(adaptersResponse.data);

        setAdapters(nextAdapters);
        setTaskTypes(taskTypesResponse.data);
        setStatuses(statusesResponse.data);
        setExportFormats(exportFormatsResponse.data);

        const templatePairs = await Promise.all(
          nextAdapters.map(async (adapter) => {
            const response = await Models.listAdapterTemplates(adapter.id);
            return [adapter.id, readListResponse<AdapterConfigTemplate>(response.data)] as const;
          }),
        );

        if (!isActive) return;

        setTemplatesByAdapter(Object.fromEntries(templatePairs));
      } catch (error) {
        if (!isActive) return;
        setErrorMessage(getApiErrorMessage(error, "Unable to load neural engine metadata."));
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadEngine();

    return () => {
      isActive = false;
    };
  }, []);

  const exportFormatCount = exportFormats
    ? Object.values(exportFormats).reduce((total, formats) => total + formats.length, 0)
    : 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-manrope-extrabold tracking-tight text-white">Neural Engine</h1>
        <p className="mt-2 text-sm font-manrope-medium text-white/50">Manage AI adapters, model templates, and backend metadata.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-manrope-medium text-error">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-white/70">Available Adapters</h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              {isLoading ? "Loading" : `${adapters.length} adapters`}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#161620] p-8 text-center text-xs font-mono uppercase tracking-widest text-white/40">
              Loading adapters...
            </div>
          ) : adapters.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#161620] p-8 text-center text-xs font-mono uppercase tracking-widest text-white/40">
              No adapters found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {adapters.map((adapter) => {
                const templates = templatesByAdapter[adapter.id] ?? [];

                return (
                  <div key={adapter.id} className="rounded-2xl border border-white/10 bg-[#161620] p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="inline-block rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-mono uppercase text-primary-300">
                        {adapter.task_type}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[9px] font-mono uppercase ${adapter.status === "active" ? "border-secondary/30 bg-secondary/10 text-secondary-300" : "border-white/10 bg-white/5 text-white/50"}`}>
                        {adapter.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-manrope-extrabold text-white">{adapter.name}</h3>
                    <p className="mt-2 min-h-[2rem] text-xs leading-relaxed text-white/40">
                      {adapter.description || adapter.key}
                    </p>

                    <div className="mt-5 border-t border-white/5 pt-4">
                      <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-white/35">
                        Templates
                      </div>
                      {templates.length === 0 ? (
                        <div className="text-xs text-white/35">No templates available.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {templates.map((template) => (
                            <span key={template.id} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60">
                              {template.name}
                              {template.is_default ? " *" : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
          <h2 className="mb-6 text-sm font-mono font-bold uppercase tracking-widest text-white/70">Core Metadata</h2>
          <div className="flex flex-col gap-3 font-mono text-[10px] text-white/50">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>TASK_TYPES</span>
              <span className="text-white">{taskTypes?.task_types.length ?? "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>PROJECT_STATUSES</span>
              <span className="text-white">{statuses?.project_statuses.length ?? "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>MODEL_STATUSES</span>
              <span className="text-white">{statuses?.model_statuses.length ?? "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>JOB_STATUSES</span>
              <span className="text-white">{statuses?.job_statuses.length ?? "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>SUPPORTED_EXPORTS</span>
              <span className="text-white">{exportFormats ? exportFormatCount : "N/A"}</span>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">Task Types</h3>
            <div className="flex flex-wrap gap-2">
              {taskTypes?.task_types.map((taskType) => (
                <span key={taskType.key} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-widest text-white/60">
                  {taskType.key}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

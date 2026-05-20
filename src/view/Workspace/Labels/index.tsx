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

import { useEffect, useState } from "react";
import { useWorkspace } from "~/contexts/Workspace";
import { Labels } from "~/api/Labels";
import { cn } from "~/helpers/Cn";
import { getApiErrorMessage } from "~/helpers/api";
import { ConfirmModal } from "~/components/ConfirmModal";
import type { Label } from "~/types/models";
import { LabelFormModal } from "./components";

function normalizeLabelsPayload(payload: unknown): Label[] {
  if (Array.isArray(payload)) {
    return payload as Label[];
  }

  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Label[] }).data;
  }

  return [];
}


export const Icons = {
  Add: () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Delete: () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Lock: () => <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Close: () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
};


export default function WorkspaceLabels() {
  const { project, canManageProject, isLoading, refreshWorkspace } = useWorkspace();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [formModal, setFormModal] = useState<{ isOpen: boolean; label: Label | null }>({ isOpen: false, label: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; label: Label | null }>({ isOpen: false, label: null });

  const fetchLabels = async () => {
    if (!project) return;
    setLoadingLabels(true);
    setError(null);

    try {
      const response = await Labels.list(project.id);
      setLabels(normalizeLabelsPayload(response.data));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load labels from backend."));
    } finally {
      setLoadingLabels(false);
    }
  };

  useEffect(() => {
    if (project) void fetchLabels();
  }, [project?.id]);

  const handleSaveLabel = async (payload: Partial<Label>) => {
    if (!project) return;

    try {
      if (formModal.label) {
        const response = await Labels.update(formModal.label.id, {
          name: payload.name,
          color: payload.color ?? null,
          description: payload.description ?? null,
        });

        setLabels((prev) => prev.map((label) => (
          label.id === formModal.label?.id ? response.data : label
        )));
      } else {
        const response = await Labels.create(project.id, {
          name: payload.name ?? "",
          color: payload.color ?? null,
          description: payload.description ?? null,
        });

        setLabels((prev) => [...prev, response.data]);
      }

      setError(null);
      await refreshWorkspace();
    } catch (requestError) {
      throw new Error(getApiErrorMessage(requestError, "Unable to save label."));
    }
  };

  const handleDeleteLabel = async () => {
    if (!deleteModal.label) return;

    try {
      await Labels.delete(deleteModal.label.id);
      setLabels((prev) => prev.filter((label) => label.id !== deleteModal.label?.id));
      setDeleteModal({ isOpen: false, label: null });
      setError(null);
      await refreshWorkspace();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to delete label."));
    }
  };

  if (isLoading || !project) return null;

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] w-full flex-col overflow-y-auto bg-[#08080c] animate-in fade-in duration-700">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />

      <div className="sticky top-0 z-20 flex shrink-0 flex-col items-start justify-between gap-6 border-b border-white/5 bg-[#0a0a0f]/95 px-12 py-8 shadow-lg backdrop-blur-xl md:flex-row md:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-300">
              {project.task_type} Schema
            </span>
          </div>
          <h2 className="text-4xl font-manrope-extrabold tracking-tight text-white">
            Workspace Labels
          </h2>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-white/40">
            {labels.length} classes defined
          </p>
        </div>

        {canManageProject && (
          <button
            onClick={() => setFormModal({ isOpen: true, label: null })}
            className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-manrope-extrabold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:bg-primary-100"
          >
            <Icons.Add />
            Add New Label
          </button>
        )}
      </div>

      <div className="relative z-10 flex-1">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col p-8 md:p-12">
          {error && (
            <div className="mb-8 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error shadow-inner">
              ERR: {error}
            </div>
          )}

          {/* RULES PANEL */}
          <div className="mb-10 flex flex-col items-start gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-md md:flex-row md:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-manrope-extrabold text-white">Schema Rules for {project.task_type}</h3>
              <div className="space-y-1 text-[11px] font-mono text-white/50">
                {project.task_type === "detection" && (
                  <><p>• 1 label minimum required. Background is implicit.</p><p>• Each bounding box must have exactly 1 label.</p></>
                )}
                {project.task_type === "segmentation" && (
                  <><p>• Label ID 0 ("Nothing") is reserved for background pixels and cannot be removed.</p><p>• Add at least 1 foreground class. Each mask takes one label.</p></>
                )}
                {project.task_type === "classification" && (
                  <><p>• 1 label = Presence/Absence schema.</p><p>• 2+ labels = Multi-class or Multi-label depending on item assignment.</p></>
                )}
              </div>
            </div>
          </div>

          {/* LABELS LIST */}
          <div className="flex flex-col gap-4 pb-8">
            {loadingLabels ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]" />
              ))
            ) : labels.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.01]">
                <p className="text-xs font-mono uppercase tracking-widest text-white/40">No labels configured</p>
              </div>
            ) : (
              labels.map((label, index) => {
                const isLocked = project.task_type === "segmentation" && index === 0;

                return (
                  <div 
                    key={label.id} 
                    className={cn(
                      "group flex flex-col justify-between gap-6 rounded-2xl border p-5 transition-all md:flex-row md:items-center",
                      isLocked ? "border-primary-500/20 bg-primary-500/5" : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-inner">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: label.color || "#fff" }} />
                        <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-[10px] font-black shadow-lg" style={{ backgroundColor: label.color || "#fff", color: "#000" }}>
                          {index}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-manrope-extrabold text-white">{label.name}</h3>
                          {isLocked && (
                            <span className="flex items-center gap-1 rounded border border-primary-500/30 bg-primary-500/20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-primary-300">
                              <Icons.Lock /> Background
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-mono text-white/40">
                          {label.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    {canManageProject && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFormModal({ isOpen: true, label })}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
                          title="Edit Label"
                        >
                          <Icons.Edit />
                        </button>
                        
                        {!isLocked && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, label })}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-white/30 transition-all hover:border-error/30 hover:bg-error/10 hover:text-error"
                            title="Delete Label"
                          >
                            <Icons.Delete />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <LabelFormModal 
        isOpen={formModal.isOpen} 
        onClose={() => setFormModal({ isOpen: false, label: null })} 
        onSave={handleSaveLabel} 
        initialData={formModal.label} 
        taskType={project.task_type}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        type="delete"
        title="Delete Label"
        message={`Are you sure you want to permanently delete the label "${deleteModal.label?.name}"? Any items uniquely annotated with this class may lose their annotation context.`}
        onConfirm={handleDeleteLabel}
        onClose={() => setDeleteModal({ isOpen: false, label: null })}
      />

    </div>
  );
}

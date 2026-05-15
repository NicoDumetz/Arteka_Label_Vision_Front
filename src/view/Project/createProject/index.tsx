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

import { useState } from "react";
import type { FormEvent } from "react";
import { Projects } from "~/api/Projects";
import type { TaskType, Project } from "~/types/models";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

const TASK_TYPES: { id: TaskType; label: string; icon: string }[] = [
  { id: "classification", label: "Classification", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { id: "detection", label: "Object Detection", icon: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" },
  { id: "segmentation", label: "Segmentation", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2-1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
];

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("detection");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await Projects.create({ 
        name: name.trim(), 
        description: description.trim() || null, 
        task_type: taskType 
      });
      onSuccess(response.data);
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initialize workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#161620] shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
        {/* Glow Header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-full max-w-md bg-primary-500/20 blur-[80px] pointer-events-none" />

        <div className="relative p-8 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-manrope-extrabold text-white">Initialize Workspace</h2>
              <p className="mt-1 text-sm font-manrope-medium text-white/50">Configure your new computer vision environment.</p>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/20 hover:text-white transition-colors border border-white/5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative p-8 flex flex-col gap-8">
          {error && (
            <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error shadow-inner">
              ERR: {error}
            </div>
          )}

          <div>
            <label className="mb-3 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
              Task Type <span className="text-primary-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {TASK_TYPES.map((type) => {
                const isSelected = taskType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTaskType(type.id)}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all ${
                      isSelected 
                        ? "border-primary-400 bg-primary-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-primary-300" 
                        : "border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.05] hover:text-white hover:border-white/20"
                    }`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                    </svg>
                    <span className="text-[10px] font-manrope-extrabold uppercase tracking-widest">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
              Workspace Name <span className="text-primary-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Medical MRI Scans"
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm font-manrope-medium text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
              Description <span className="text-white/30">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the purpose of this dataset..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm font-manrope-medium text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-white/10 pt-6 mt-2">
            <button 
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-white text-background px-6 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest transition-all hover:bg-primary-100 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
            >
              {isLoading ? "Initializing..." : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
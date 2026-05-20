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

import type { FormEvent } from "react";
import type { Label, TaskType } from "~/types/models";
import { useEffect, useState } from "react";
import { Icons } from "..";

interface LabelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: Partial<Label>) => Promise<void>;
  initialData?: Label | null;
  taskType: TaskType;
}

export function LabelFormModal({ isOpen, onClose, onSave, initialData, taskType }: LabelFormModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setColor(initialData?.color || "#8b5cf6");
      setDescription(initialData?.description || "");
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Label name is required.");
    
    if (taskType === "segmentation" && !initialData && (name.toLowerCase() === "nothing" || name.toLowerCase() === "background")) {
      return setError("Background is already handled. Please add a foreground class.");
    }

    setIsLoading(true);
    try {
      await onSave({ name: name.trim(), color, description: description.trim() || null });
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#161620] shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
        <div className="absolute left-1/2 top-0 h-32 w-full max-w-sm -translate-x-1/2 bg-primary-500/20 blur-[80px] pointer-events-none" />
        
        <div className="relative flex items-center justify-between border-b border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-manrope-extrabold text-white">
            {initialData ? "Edit Schema Label" : "Add New Label"}
          </h2>
          <button onClick={onClose} className="rounded-full bg-white/5 p-2 text-white/60 hover:bg-white/20 hover:text-white transition-colors">
            <Icons.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error">{error}</div>}

          <div>
            <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-white/40">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pedestrian"
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-white/40">Color</label>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0a0f] p-2">
              <div className="h-8 w-8 rounded-lg border border-white/20" style={{ backgroundColor: color }} />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full cursor-pointer bg-transparent text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-mono uppercase tracking-widest text-white/40">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context for annotators..."
              className="w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-white/10 pt-6">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/50 hover:bg-white/5 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="rounded-xl bg-white px-6 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-black hover:bg-primary-100 disabled:opacity-50">
              {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Label"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
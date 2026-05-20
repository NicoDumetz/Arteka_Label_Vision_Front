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
import { useNavigate } from "react-router-dom";
import { Labels } from "~/api/Labels";
import { Projects } from "~/api/Projects";
import { cn } from "~/helpers/Cn";
import type { Project, TaskType } from "~/types/models";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

interface LabelDraft {
  name: string;
  color: string;
  description: string;
}

const TASK_TYPES: { id: TaskType; label: string; icon: string }[] = [
  { id: "classification", label: "Classification", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
  { id: "detection", label: "Object Detection", icon: "M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" },
  { id: "segmentation", label: "Segmentation", icon: "M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2-1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" },
];

const STEP_LABELS = [
  { id: 1, title: "Project Setup" },
  { id: 2, title: "Labels Configuration" },
  { id: 3, title: "AI Setup" },
];

const DEFAULT_LABELS_BY_TASK: Record<TaskType, LabelDraft[]> = {
  classification: [
    { name: "Class A", color: "#10b981", description: "Desc class A" },
    { name: "Class B", color: "#f59e0b", description: "Desc class B" },
  ],
  detection: [
    { name: "Object", color: "#38bdf8", description: "Desc Main target" },
  ],
  segmentation: [
    { name: "Nothing", color: "#111827", description: "Background pixels (ID 0)" },
    { name: "Foreground", color: "#f97316", description: "Desc Target segmentation" },
  ],
};

function cloneDefaultLabels(taskType: TaskType): LabelDraft[] {
  return DEFAULT_LABELS_BY_TASK[taskType].map((label) => ({ ...label }));
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<"import_data" | "upload_model" | "configure_training">("import_data");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("detection");
  const [labels, setLabels] = useState<LabelDraft[]>(() => cloneDefaultLabels("detection"));
  const [draftLabel, setDraftLabel] = useState<LabelDraft>({ name: "", color: "#8b5cf6", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinalSuccess = (project: Project) => {
    onSuccess(project);
    resetForm();
    switch(intent) {
      case "upload_model":
        navigate(`/workspaces/${project.id}/models`);
        break;
      case "import_data":
        navigate(`/workspaces/${project.id}/assets`);
        break;
      case "configure_training":
      default:
        navigate(`/workspaces/${project.id}/training`);
        break;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
  }, [isOpen]);

  useEffect(() => {
    setLabels(cloneDefaultLabels(taskType));
  }, [taskType]);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setTaskType("detection");
    setLabels(cloneDefaultLabels("detection"));
    setDraftLabel({ name: "", color: "#8b5cf6", description: "" });
    setIntent("import_data");
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const updateLabel = (index: number, field: keyof LabelDraft, value: string) => {
    setLabels((current) =>
      current.map((label, labelIndex) => (
        labelIndex === index ? { ...label, [field]: value } : label
      )),
    );
  };

  const removeLabel = (index: number) => {
    setLabels((current) => current.filter((_, labelIndex) => labelIndex !== index));
  };

  const handleAddNewLabel = () => {
    if (!draftLabel.name.trim()) {
      setError("Please enter a name for the new label.");
      return;
    }
    setError(null);
    setLabels((current) => [...current, { ...draftLabel }]);
    setDraftLabel({ name: "", color: "#8b5cf6", description: "" });
  };

  const handleProjectCreation = async () => {
    if (!name.trim()) {
      setError("Project name is required.");
      setStep(1);
      return;
    }

    const sanitizedLabels = labels
      .map((label) => ({
        name: label.name.trim(),
        color: label.color.trim() || null,
        description: label.description.trim() || null,
      }))
      .filter((label) => Boolean(label.name));

    if (taskType === "detection" && sanitizedLabels.length < 1) {
      setError("Object Detection requires at least 1 target label.");
      return;
    }

    if (taskType === "segmentation") {
      if (sanitizedLabels[0]?.name.toLowerCase() !== "nothing") {
        setError('For segmentation, keep the first label as "Nothing" so background stays consistent.');
        return;
      }
      if (sanitizedLabels.length < 2) {
        setError("Segmentation requires at least 1 foreground class in addition to the implicit background ('Nothing').");
        return;
      }
      
      const hasExtraBackground = sanitizedLabels.slice(1).some(
        l => l.name.toLowerCase() === "background" || l.name.toLowerCase() === "nothing"
      );
      if (hasExtraBackground) {
        setError("Background is already implicitly handled by label 0 ('Nothing'). Do not add duplicate background classes.");
        return;
      }
    }

    if (taskType === "classification" && sanitizedLabels.length < 1) {
      setError("Classification requires at least 1 label (Presence/Absence validation schema).");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await Projects.create({
        name: name.trim(),
        description: description.trim() || null,
        task_type: taskType,
      });

      await Promise.all(
        sanitizedLabels.map((label) => Labels.create(response.data.id, label))
      );

      onFinalSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initialize workspace.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#161620] shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300">
        
        {/* Glow Header */}
        <div className="absolute left-1/2 top-0 h-32 w-full max-w-md -translate-x-1/2 bg-primary-500/20 blur-[80px] pointer-events-none" />

        {/* HEADER MODAL */}
        <div className="relative shrink-0 border-b border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-manrope-extrabold text-white">Create Project</h2>
              <p className="mt-1 text-sm font-manrope-medium text-white/50">
                Setup your workspace and define the neural classification schema.
              </p>
            </div>
            <button onClick={handleClose} className="rounded-full border border-white/5 bg-white/5 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            {STEP_LABELS.map((item, index) => {
              const isActive = step === item.id;
              const isComplete = step > item.id;
              return (
                <div key={item.id} className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-mono font-bold transition-all ${
                    isActive ? "border-primary-400/70 bg-primary-500/10 text-primary-200 shadow-[0_0_16px_rgba(99,102,241,0.18)]" : 
                    isComplete ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200" : 
                    "border-white/10 bg-white/[0.03] text-white/35"
                  }`}>
                    {isComplete ? "✓" : `0${item.id}`}
                  </div>
                  <span className={`truncate text-xs font-manrope-extrabold uppercase tracking-widest transition-colors ${
                    isActive ? "text-white" : isComplete ? "text-white/80" : "text-white/30"
                  }`}>
                    {item.title}
                  </span>
                  {(index === 0 || index === 1) && <div className="mx-2 h-px w-8 bg-white/10" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ERREUR GLOBALE */}
        {error && (
          <div className="mx-8 mt-6 shrink-0 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-mono text-error shadow-inner">
            ERR: {error}
          </div>
        )}

        {/* CONTENT */}
        <div className="relative flex min-h-0 flex-1 flex-col p-8">
          
          {/* STEP 1: SETUP */}
          {step === 1 && (
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto no-scrollbar">
              <div>
                <label className="mb-3 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
                  Task Type <span className="text-primary-400">*</span>
                </label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {TASK_TYPES.map((type) => {
                    const isSelected = taskType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setTaskType(type.id)}
                        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 transition-all ${
                          isSelected ? "border-primary-400 bg-primary-500/10 text-primary-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} /></svg>
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
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="e.g., Autonomous Driving V2"
                  className="w-full rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm font-manrope-medium text-white placeholder:text-white/30 shadow-inner transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* DESCRIPTION */}
              <div className="flex flex-1 flex-col min-h-0">
                <label htmlFor="description" className="mb-2 block text-[10px] font-mono font-bold uppercase tracking-widest text-white/60">
                  Description <span className="text-white/30">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief context for the annotators..."
                  className="flex-1 w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0f] px-4 py-3 text-sm font-manrope-medium text-white placeholder:text-white/30 shadow-inner transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[140px]"
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex h-full min-h-0 flex-col gap-6 md:flex-row">
              
              {/* COLONNE GAUCHE : LISTE SCROLLABLE DES LABELS */}
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-4 flex items-center justify-between shrink-0">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">
                    Schema ({labels.length})
                  </h3>
                  {taskType === "segmentation" && (
                    <span className="rounded border border-primary-400/20 bg-primary-500/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] text-primary-300">
                      Segmentation Rule Applied
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-4 space-y-3 no-scrollbar pb-4">
                  {labels.map((label, index) => {
                    const isLocked = taskType === "segmentation" && index === 0;

                    return (
                      <div key={index} className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                        isLocked ? "border-primary-500/30 bg-primary-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}>
                        
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[9px] font-black ${
                          isLocked ? "border-primary-500/30 bg-primary-500/20 text-primary-300" : "border-white/10 bg-black/40 text-white/50"
                        }`}>
                          {index}
                        </span>

                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={label.name}
                            onChange={(e) => updateLabel(index, "name", e.target.value)}
                            disabled={isLocked}
                            placeholder="Label name"
                            className="w-full rounded-lg bg-transparent text-sm font-manrope-extrabold text-white placeholder:text-white/20 focus:bg-black/30 focus:px-2 focus:outline-none disabled:opacity-80"
                          />
                          <input
                            type="text"
                            value={label.description}
                            onChange={(e) => updateLabel(index, "description", e.target.value)}
                            disabled={isLocked}
                            placeholder={isLocked ? "Reserved Background" : "Note (optional)"}
                            className="w-full rounded-lg bg-transparent text-[10px] font-mono text-white/50 placeholder:text-white/20 focus:bg-black/30 focus:px-2 focus:outline-none disabled:opacity-50"
                          />
                        </div>

                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 overflow-hidden cursor-pointer">
                          <div className="h-4 w-4 rounded-full border border-white/30" style={{ backgroundColor: label.color }} />
                          <input
                            type="color"
                            value={label.color}
                            onChange={(e) => updateLabel(index, "color", e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </div>

                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => removeLabel(index)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-white/30 transition-colors hover:border-error/30 hover:bg-error/10 hover:text-error"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLONNE DROITE */}
              <div className="flex w-full shrink-0 flex-col border-t border-white/10 pt-6 md:w-[280px] md:border-l md:border-t-0 md:pl-6 md:pt-0 overflow-y-auto no-scrollbar">
                <h3 className="mb-4 text-xs font-mono font-bold uppercase tracking-widest text-white">
                  Add New Label
                </h3>
                
                <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                  <div>
                    <label className="mb-1.5 block text-[9px] font-mono uppercase tracking-widest text-white/40">Name</label>
                    <input
                      type="text"
                      value={draftLabel.name}
                      onChange={(e) => setDraftLabel({ ...draftLabel, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNewLabel()}
                      placeholder="e.g. Pedestrian"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[9px] font-mono uppercase tracking-widest text-white/40">Color</label>
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0f] px-2 py-1.5">
                      <div className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: draftLabel.color }} />
                      <input
                        type="color"
                        value={draftLabel.color}
                        onChange={(e) => setDraftLabel({ ...draftLabel, color: e.target.value })}
                        className="w-full cursor-pointer bg-transparent text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[9px] font-mono uppercase tracking-widest text-white/40">Description</label>
                    <input
                      type="text"
                      value={draftLabel.description}
                      onChange={(e) => setDraftLabel({ ...draftLabel, description: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNewLabel()}
                      placeholder="Optional details"
                      className="w-full rounded-lg border border-white/10 bg-[#0a0a0f] px-3 py-2 text-xs font-mono text-white placeholder:text-white/30 focus:border-primary-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewLabel}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[10px] font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-white/10 hover:text-white"
                  >
                    + Add to Schema
                  </button>
                </div>

                {/* --- RÈGLES DYNAMIQUES --- */}
                <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <h4 className="mb-3 text-[9px] font-mono font-bold uppercase tracking-widest text-white/50">
                    Task Rules: {TASK_TYPES.find(t => t.id === taskType)?.label}
                  </h4>
                  <ul className="space-y-2 text-[9px] font-manrope-medium text-white/40">
                    {taskType === "detection" && (
                      <>
                        <li className="flex gap-2"><span>•</span> 1 label minimum required.</li>
                        <li className="flex gap-2"><span>•</span> No Background label.</li>
                        <li className="flex gap-2"><span>•</span> Each bbox has exactly 1 label</li>
                        <li className="flex gap-2"><span>•</span> An image can have 0 bboxes</li>
                      </>
                    )}
                    {taskType === "segmentation" && (
                      <>
                        <li className="flex gap-2"><span>•</span> Keep 'Nothing' as label 0.</li>
                        <li className="flex gap-2"><span>•</span> Add at least 1 foreground class.</li>
                        <li className="flex gap-2"><span>•</span> Each polygon/mask has exactly one label other than background</li>
                        <li className="flex gap-2"><span>•</span> An image can have 0 masks</li>
                      </>
                    )}
                   {taskType === "classification" && (
                      <>
                        <li className="flex gap-2"><span>•</span> Minimum 1 label required.</li>
                        <li className="flex gap-2"><span>•</span> 1 label = presence/absence, with absence implicit.</li>
                        <li className="flex gap-2"><span>•</span> 2+ labels = classic multi-class if only one label per item.</li>
                        <li className="flex gap-2"><span>•</span> Several labels on one item = multi-label.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: AI SETUP */}
          {step === 3 && (
            <div className="flex h-full flex-col gap-6 overflow-y-auto no-scrollbar">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60 mb-1">
                  Workflow Strategy
                </h3>
                <p className="text-[11px] font-manrope-medium text-white/40">
                  Choose how you want to handle AI for this workspace. This selection defines your initial onboarding flow.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setIntent("import_data")}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border p-6 text-left transition-all",
                    intent === "import_data" ? "border-primary-500 bg-primary-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-manrope-extrabold text-white">Manual Start</h4>
                    <p className="mt-1 text-[10px] text-white/40">Start with raw data import and manual annotation. No AI influence.</p>
                  </div>
                </button>

                {/* 2. Upload Model */}
                <button
                  onClick={() => setIntent("upload_model")}
                  className={cn(
                    "flex items-start gap-4 rounded-2xl border p-6 text-left transition-all",
                    intent === "upload_model" ? "border-primary-500 bg-primary-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-manrope-extrabold text-white">Upload Existing Model</h4>
                    <p className="mt-1 text-[10px] text-white/40">Import a pre-trained model (PyTorch, YOLO, etc.) immediately.</p>
                  </div>
                </button>

                {taskType === "classification" && (
                  <button
                    type="button"
                    onClick={() => setIntent("configure_training")}
                    className={cn(
                      "flex items-start gap-4 rounded-2xl border p-6 text-left transition-all",
                      intent === "configure_training"
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-manrope-extrabold text-white">
                        Configure Auto-Training
                      </h4>
                      <p className="mt-1 text-[10px] text-white/40">
                        Set classification training options now. Training will start later when enough annotations are validated.
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="shrink-0 border-t border-white/10 bg-white/[0.01] p-6">
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={step === 1 ? handleClose : handleBack}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step === 1 || step === 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-background shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:bg-primary-100"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProjectCreation}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3 text-xs font-manrope-extrabold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:bg-primary-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] disabled:opacity-50"
              >
                {isLoading ? "Provisioning..." : "Initialize Workspace"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
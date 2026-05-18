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
// Created     : Monday May 18 2026
//
// =============================================================

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Assets, Items, Models } from "~/api";
import { useWorkspace } from "~/contexts/Workspace";
import { getApiErrorMessage } from "~/helpers/api";
import type { CursorPage } from "~/types/api";
import type { ID, Item, ItemStatus, ModelVersion } from "~/types/models";

type KpiColor = "white" | "indigo" | "emerald" | "pink";

interface WorkspaceStats {
  totalAssets: number;
  totalItems: number;
  annotatedItems: number;
  pendingReview: number;
  activeModels: number;
  latestModelName: string | null;
}

interface ProjectMetric {
  label: string;
  value: string;
  trend: string;
  color: KpiColor;
  progress: number;
  icon: string;
}

const ANNOTATED_STATUSES: ItemStatus[] = ["annotated", "submitted", "validated"];

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

const getPercent = (value: number, total: number) => {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
};

async function collectCursorPage<T>(
  list: (params: Record<string, unknown>) => Promise<{ data: CursorPage<T> }>,
  params: Record<string, unknown> = {},
) {
  const records: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  do {
    const response = await list({
      ...params,
      limit: 100,
      ...(cursor ? { cursor } : {}),
    });

    records.push(...response.data.data);

    const nextCursor = response.data.pagination.next_cursor;
    if (!response.data.pagination.has_more || !nextCursor || seenCursors.has(nextCursor)) {
      cursor = null;
    } else {
      seenCursors.add(nextCursor);
      cursor = nextCursor;
    }
  } while (cursor);

  return records;
}

export default function WorkspaceHome() {
  const { project, projectId, canAnnotate, canManageModels } = useWorkspace();
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadWorkspaceStats(nextProjectId: ID) {
      setIsStatsLoading(true);
      setStatsError(null);

      try {
        const [assets, items, models] = await Promise.all([
          collectCursorPage((params) => Assets.list(nextProjectId, params)),
          collectCursorPage((params) => Items.list(nextProjectId, params)),
          collectCursorPage((params) => Models.list(nextProjectId, params)),
        ]);

        if (!isActive) return;

        const annotatedItems = (items as Item[]).filter((item) => ANNOTATED_STATUSES.includes(item.status)).length;
        const pendingReview = (items as Item[]).filter((item) => item.status === "submitted").length;
        const activeModels = (models as ModelVersion[]).filter((model) => model.is_active).length;
        const latestActiveModel = (models as ModelVersion[])
          .filter((model) => model.is_active)
          .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())[0];

        setStats({
          totalAssets: assets.length,
          totalItems: items.length,
          annotatedItems,
          pendingReview,
          activeModels,
          latestModelName: latestActiveModel?.name ?? null,
        });
      } catch (error) {
        if (!isActive) return;
        setStats(null);
        setStatsError(getApiErrorMessage(error, "Unable to load workspace telemetry."));
      } finally {
        if (isActive) {
          setIsStatsLoading(false);
        }
      }
    }

    if (project) {
      loadWorkspaceStats(projectId);
    }

    return () => {
      isActive = false;
    };
  }, [project, projectId]);

  const taskTypeName = {
    detection: "Object Detection",
    segmentation: "Pixel Segmentation",
    classification: "Classification"
  };

  const projectMetrics = useMemo<ProjectMetric[]>(() => {
    const completion = stats ? getPercent(stats.annotatedItems, stats.totalItems) : 0;
    const reviewPressure = stats ? getPercent(stats.pendingReview, stats.totalItems) : 0;

    return [
      {
        label: "Total Assets",
        value: stats ? formatNumber(stats.totalAssets) : "0",
        trend: stats ? `${formatNumber(stats.totalItems)} generated items` : "No telemetry loaded",
        color: "white",
        progress: stats && stats.totalAssets > 0 ? 100 : 0,
        icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      },
      {
        label: "Annotated Items",
        value: stats ? formatNumber(stats.annotatedItems) : "0",
        trend: `${completion}% completion`,
        color: "indigo",
        progress: completion,
        icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
      },
      {
        label: "Pending Review",
        value: stats ? formatNumber(stats.pendingReview) : "0",
        trend: stats && stats.pendingReview > 0 ? "Requires attention" : "Queue clear",
        color: "pink",
        progress: reviewPressure,
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        label: "Active Models",
        value: stats ? formatNumber(stats.activeModels) : "0",
        trend: stats?.latestModelName ?? "No active model",
        color: "emerald",
        progress: stats && stats.activeModels > 0 ? 100 : 0,
        icon: "M13 10V3L4 14h7v7l9-11h-7z",
      },
    ];
  }, [stats]);

  if (!project) return null;

  const canAnnotateActive = project.status === 'active' && canAnnotate;
  const canTrainActive = project.status === 'active' && canManageModels;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1400px] flex-col justify-between px-8 py-12 md:px-12 lg:pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 selection:bg-indigo-500/20">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 flex max-w-4xl flex-col items-center">
          
          <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
            <div className={`inline-flex items-center gap-3 rounded-full border px-3 py-1.5 backdrop-blur-xl ${project.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
              <span className={`relative flex h-2 w-2 ${project.status === 'active' ? 'text-emerald-400' : 'text-white'}`}>
                {project.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${project.status === 'active' ? 'text-emerald-300' : 'text-white/60'}`}>
                STATUS: {project.status}
              </span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-xl text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-indigo-300">
              TASK: {taskTypeName[project.task_type]}
            </div>
          </div>

          <h1 className="mb-4 text-6xl md:text-8xl font-manrope-extrabold tracking-tight text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            {project.name}
          </h1>
          
          <p className="mx-auto max-w-2xl text-base md:text-lg font-manrope-medium leading-relaxed text-white/50">
            {project.description || "System requires detailed operational intelligence. Initialize dataset documentation via system settings."}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link 
              to={`/workspaces/${project.id}/assets`} 
              className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-xs font-manrope-extrabold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20"
            >
              <svg className="h-4 w-4 text-white/50 transition-colors group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Manage Assets
            </Link>

            {canAnnotateActive && (
              <Link 
                to={`/workspaces/${project.id}/annotate`} 
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-indigo-500 px-8 py-4 text-xs font-manrope-extrabold uppercase tracking-widest text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all hover:scale-105 hover:bg-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[size:10rem_100%] group-hover:animate-shimmer" />
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Neural Lab Studio
              </Link>
            )}

            {canTrainActive && (
              <Link 
                to={`/workspaces/${project.id}/models`} 
                className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-xs font-manrope-extrabold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <svg className="h-4 w-4 text-white/50 transition-colors group-hover:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1h-6L8 4z" /></svg>
                Train Models
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-16 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 fill-mode-both">
        <div className="mb-4 flex flex-col items-center justify-between gap-2 md:flex-row">
          <h2 className="text-center text-xs font-mono font-semibold uppercase tracking-[0.2em] text-white/30 md:text-left">
            System Telemetry
          </h2>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
            {isStatsLoading ? "Syncing backend metrics..." : statsError ? statsError : "Live backend metrics"}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {projectMetrics.map((kpi, idx) => (
            <div 
              key={idx} 
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-3xl transition-all duration-500 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="pointer-events-none absolute -inset-x-20 inset-y-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[size:10rem_100%] group-hover:animate-shimmer" />

              <div className="relative z-10 flex h-full flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="mb-1 block text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-white/40 transition-colors group-hover:text-white/60">
                      {kpi.label}
                    </span>
                    <div className={`text-4xl font-manrope-extrabold tracking-tight ${kpi.color === 'indigo' ? 'text-indigo-300' : kpi.color === 'emerald' ? 'text-emerald-300' : kpi.color === 'pink' ? 'text-pink-300' : 'text-white'}`}>
                      {kpi.value}
                    </div>
                  </div>
                  <svg className={`h-8 w-8 opacity-10 transition-opacity group-hover:opacity-20 ${kpi.color === 'indigo' ? 'text-indigo-400' : kpi.color === 'emerald' ? 'text-emerald-400' : kpi.color === 'pink' ? 'text-pink-400' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={kpi.icon} />
                  </svg>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-[9px] font-mono font-medium uppercase tracking-[0.1em] text-white/30 transition-colors group-hover:text-white/50">
                    <span>{kpi.trend}</span>
                  </div>
                  <div className="relative h-1 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-[2000ms] ease-out animate-bar-load ${kpi.color === 'indigo' ? 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.7)]' : kpi.color === 'emerald' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]' : kpi.color === 'pink' ? 'bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.7)]' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]'}`} style={{ width: `${kpi.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        @keyframes bar-load { 0% { width: 0%; } }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .animate-bar-load { animation: bar-load 2s ease-out fill-mode-both; }
      `}</style>

    </div>
  );
}

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

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Projects } from "~/api/Projects";
import { useAuth } from "~/contexts/Auth";
import { GlobalHeader } from "~/components/GlobalHeader";
import { SearchInput } from "~/components/SearchInput";
import { ConfirmModal } from "~/components/ConfirmModal";
import { CreateProjectModal } from "./createProject";
import { getApiErrorMessage } from "~/helpers/api";
import { useListQueryParams } from "~/hooks/useListQueryParams";
import type { Project, ProjectStatus, TaskType } from "~/types/models";

type ProjectFilters = {
  task_type: TaskType | "";
  status: ProjectStatus | "";
};

const PROJECT_TASK_TYPES: TaskType[] = ["classification", "detection", "segmentation"];
const PROJECT_STATUSES: ProjectStatus[] = ["draft", "active", "archived"];

const getTaskIcon = (type: TaskType) => {
  switch (type) {
    case "detection":
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" />;
    case "segmentation":
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2-1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />;
    case "classification":
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />;
  }
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);
  
  const loadMoreMarkerRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);

  const { search, filters, cursor, backendParams, setSearch, setFilter, setCursor } = useListQueryParams<ProjectFilters>({
    searchMode: "contains",
    initialFilters: { task_type: "", status: "" },
    limit: 50,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "archive" | null;
    project: Project | null;
  }>({ isOpen: false, type: null, project: null });

  useEffect(() => {
    let isActive = true;
    const requestId = requestIdRef.current + 1;
    const isNextPage = Boolean(cursor);
    requestIdRef.current = requestId;

    const fetchProjects = async () => {
      if (isNextPage) setIsLoadingMore(true);
      else { setIsLoading(true); setErrorMessage(null); }

      try {
        const response = await Projects.list(backendParams);
        if (!isActive || requestIdRef.current !== requestId) return;

        setProjects((current) => isNextPage ? [...current, ...response.data.data] : response.data.data);
        setNextCursor(response.data.pagination.next_cursor);
        setHasMore(response.data.pagination.has_more);
      } catch (error) {
        if (!isActive || requestIdRef.current !== requestId) return;
        if (!isNextPage) setProjects([]);
        setErrorMessage("Unable to load workspaces from the database.");
      } finally {
        if (!isActive || requestIdRef.current !== requestId) return;
        isNextPage ? setIsLoadingMore(false) : setIsLoading(false);
      }
    };

    fetchProjects();
    return () => { isActive = false; };
  }, [backendParams, cursor]);

  const loadMoreProjects = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || !nextCursor) return;
    setCursor(nextCursor);
  }, [hasMore, isLoading, isLoadingMore, nextCursor, setCursor]);

  useEffect(() => {
    const marker = loadMoreMarkerRef.current;
    if (!marker || !hasMore || !nextCursor) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loadMoreProjects();
    }, { rootMargin: "320px" });

    observer.observe(marker);
    return () => observer.disconnect();
  }, [hasMore, loadMoreProjects, nextCursor]);

  const handleActionClick = (e: MouseEvent, type: "delete" | "archive", project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmModal({ isOpen: true, type, project });
  };

  const executeConfirmAction = async () => {
    if (!confirmModal.project || !confirmModal.type) return;

    setIsConfirmingAction(true);
    setErrorMessage(null);

    try {
      if (confirmModal.type === "delete") {
        await Projects.purge(confirmModal.project.id);
        setProjects(prev => prev.filter(p => p.id !== confirmModal.project!.id));
      } else if (confirmModal.type === "archive") {
        await Projects.archive(confirmModal.project.id);
        setProjects(prev => prev.map(p => p.id === confirmModal.project!.id ? { ...p, status: "archived" } : p));
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, `Unable to ${confirmModal.type} workspace.`));
      return;
    } finally {
      setIsConfirmingAction(false);
    }

    setConfirmModal({ isOpen: false, type: null, project: null });
  };

  const handleProjectCreated = (newProject: Project) => {
    setIsCreateModalOpen(false);
    setProjects(prev => [newProject, ...prev]);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#08080c] font-manrope text-white selection:bg-primary-500/30 overflow-x-hidden">
      
      
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#08080c_100%)] pointer-events-none" />

      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_100%_80%_at_50%_0%,#000_50%,transparent_100%)] pointer-events-none" />
      
      <div className="fixed top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-primary-600/30 blur-[150px] mix-blend-screen pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] h-[800px] w-[800px] rounded-full bg-tertiary-600/25 blur-[150px] mix-blend-screen pointer-events-none z-0" />
      <div className="fixed top-[30%] right-[15%] h-[500px] w-[500px] rounded-full bg-primary-400/10 blur-[150px] mix-blend-screen pointer-events-none z-0" />
      
      <GlobalHeader transparent={true}/>

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-8 py-10 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-300">
                Network Storage
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-manrope-extrabold tracking-tight text-white drop-shadow-md">
              Workspaces.
            </h1>
            <p className="mt-3 text-sm font-manrope-medium text-white/60">
              Manage your datasets, configure AI adapters, and review annotations.
            </p>
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-white px-6 py-3.5 text-xs font-manrope-extrabold uppercase tracking-widest text-background shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all hover:scale-105 hover:bg-primary-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Initialize Project
          </button>
        </div>

        <div className="mb-8 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_220px_180px] shadow-lg">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search workspaces by name or ID..."
          />

          <select
            value={filters.task_type}
            onChange={(e) => setFilter("task_type", e.target.value as ProjectFilters["task_type"])}
            className="h-12 rounded-xl border border-white/10 bg-[#08080c] px-4 text-xs font-manrope-extrabold uppercase tracking-widest text-white outline-none transition-colors focus:border-primary-400/60 shadow-inner"
          >
            <option value="">All task types</option>
            {PROJECT_TASK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value as ProjectFilters["status"])}
            className="h-12 rounded-xl border border-white/10 bg-[#08080c] px-4 text-xs font-manrope-extrabold uppercase tracking-widest text-white outline-none transition-colors focus:border-primary-400/60 shadow-inner"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-xs font-mono text-error">
            ERR: {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <span className="text-xs font-mono tracking-widest text-white/50 uppercase animate-pulse">Scanning local storage...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-64 w-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <span className="text-sm font-manrope-extrabold text-white">No active workspaces found.</span>
            <span className="mt-2 text-xs font-mono text-white/40">AWAITING_INITIALIZATION</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  onClick={() => navigate(`/workspaces/${project.id}`)}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                >
                  <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-500/0 blur-[50px] mix-blend-screen transition-colors duration-500 group-hover:bg-primary-500/30" />

                  <div className="relative z-10 flex flex-col">
                    <div className="mb-6 flex items-center justify-between">
                      <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-manrope-extrabold uppercase tracking-widest shadow-sm ${
                        project.status === 'active' ? 'border-secondary-500/40 bg-secondary-500/10 text-secondary-300' : 
                        project.status === 'archived' ? 'border-white/10 bg-white/5 text-white/50' : 
                        'border-white/20 bg-white/10 text-white'
                      }`}>
                        {project.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-secondary-400 animate-pulse shadow-[0_0_5px_rgba(0,204,142,0.8)]" />}
                        {project.status}
                      </div>
                      <span className="rounded bg-black/40 px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-primary-300 border border-white/10 shadow-inner">
                        Role: {project.current_user_role || "Viewer"}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-primary-200 shadow-inner group-hover:bg-primary-500/20 group-hover:text-primary-100 group-hover:border-primary-400/50 transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">{getTaskIcon(project.task_type)}</svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-manrope-extrabold tracking-tight text-white drop-shadow-sm group-hover:text-primary-100 transition-colors line-clamp-1">
                          {project.name}
                        </h2>
                        <span className="mt-1 block text-[10px] font-mono uppercase tracking-widest text-white/60">
                          {project.task_type} • ID:{project.id}
                        </span>
                      </div>
                    </div>

                    <p className="mt-5 text-xs font-manrope-medium leading-relaxed text-white/50 line-clamp-2 min-h-[2rem]">
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 flex items-end justify-between border-t border-white/10 pt-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">Created</span>
                      <span className="text-[11px] font-mono font-bold text-white/80">{formatDate(project.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {(user?.role === "admin" || project.current_user_role === "owner") && (
                        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <button 
                            onClick={(e) => handleActionClick(e, "archive", project)}
                            className="rounded-lg p-2 text-white/50 hover:bg-white/20 hover:text-white transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                          </button>
                          <button 
                            onClick={(e) => handleActionClick(e, "delete", project)}
                            className="rounded-lg p-2 text-error/70 hover:bg-error/20 hover:text-error transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-primary-300 transition-all group-hover:bg-primary-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]">
                        <svg className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div ref={loadMoreMarkerRef} className="flex h-20 items-center justify-center">
              {isLoadingMore && <span className="text-xs font-mono uppercase tracking-widest text-white/40 animate-pulse">Loading more...</span>}
            </div>
          </>
        )}
      </main>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleProjectCreated}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type || "warning"}
        title={confirmModal.type === "delete" ? "Delete Workspace" : "Archive Workspace"}
        message={
          confirmModal.type === "delete" 
            ? `You are about to purge "${confirmModal.project?.name}". Assets, items, annotations, reviews, jobs, models and storage references will be removed or queued for cleanup. This cannot be undone.`
            : `You are about to archive "${confirmModal.project?.name}". The workspace will be locked in read-only mode.`
        }
        onConfirm={executeConfirmAction}
        onClose={() => setConfirmModal({ isOpen: false, type: null, project: null })}
        isLoading={isConfirmingAction}
      />
    </div>
  );
}

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
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { Labels, Metadata, Projects } from "~/api";
import type { CursorPage, ProjectExportFormatsResponse } from "~/types/api";
import type { ID, Label, Project, ProjectMemberRole } from "~/types/models";

interface WorkspaceContextValue {
  projectId: ID;
  project: Project | null;
  labels: Label[];
  exportFormats: ProjectExportFormatsResponse | null;
  role: ProjectMemberRole | null;
  isLoading: boolean;
  canManageProject: boolean;
  canAnnotate: boolean;
  canReview: boolean;
  canManageModels: boolean;
  canExport: boolean;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function getPageData<T>(value: T[] | CursorPage<T>): T[] {
  if (Array.isArray(value)) return value;
  return value.data;
}

function canManage(role: ProjectMemberRole | null) {
  return role === "owner" || role === "manager";
}

function canUseAnnotation(role: ProjectMemberRole | null) {
  return role === "owner" || role === "manager" || role === "annotator";
}

function canUseReview(role: ProjectMemberRole | null) {
  return role === "owner" || role === "manager" || role === "validator";
}

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const { projectId } = useParams();

  const numericProjectId = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [exportFormats, setExportFormats] = useState<ProjectExportFormatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = project?.current_user_role ?? null;

  const refreshWorkspace = useCallback(async () => {
    const nextProjectId = Number(projectId);

    if (!Number.isFinite(nextProjectId)) return;

    setIsLoading(true);

    try {
      const [projectResponse, labelsResponse, exportFormatsResponse] = await Promise.all([
        Projects.get(nextProjectId),
        Labels.list(nextProjectId),
        Metadata.projectExportFormats(nextProjectId),
      ]);

      setProject(projectResponse.data);
      setLabels(getPageData(labelsResponse.data));
      setExportFormats(exportFormatsResponse.data);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      projectId: numericProjectId,
      project,
      labels,
      exportFormats,
      role,
      isLoading,
      canManageProject: canManage(role),
      canAnnotate: canUseAnnotation(role),
      canReview: canUseReview(role),
      canManageModels: canManage(role),
      canExport: canManage(role),
      refreshWorkspace,
    }),
    [numericProjectId, project, labels, exportFormats, role, isLoading, refreshWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : router.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth, RequireGuest, RequireGlobalRole, RequireProjectRole } from "~/components/RouteGuard";
import Home from "~/view/Home";
import Login from "./view/Login";
import NotFound from "./view/NotFound";
import ProjectsPage from "./view/Project";
import AdminEnginePage from "./view/Engine";
import { AdminLayout } from "./view/Admin/Layout";
import AdminInfraPage from "./view/Admin/infra";
import AdminUsersPage from "./view/Admin/Access";
import Workspace from "./view/Workspace/Layout";
import WorkspaceHome from "./view/Workspace/Home";
import WorkspaceItems from "./view/Workspace/Data";
import WorkspaceAssetImport from "./view/Workspace/Import";
import WorkspaceLabels from "./view/Workspace/Labels";
import WorkspaceModels from "./view/Workspace/Models";

export const router = createBrowserRouter([
  {
    path: "/",
    element:
    <RequireAuth>
      <Home />
    </RequireAuth>,
  },
  {
    path: "/login",
    element: (
      <RequireGuest>
        <Login/>
      </RequireGuest>
    ),
  },
  {
    path: "/projects",
    element: (
      <RequireAuth>
        <ProjectsPage/>
      </RequireAuth>
    ),
  },
  {
    path: "/admin",
    element: (
      <RequireGlobalRole roles={["admin"]}>
        <AdminLayout />
      </RequireGlobalRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/users" replace />,
      },
      {
        path: "users",
        element: <AdminUsersPage />,
      },
      {
        path: "infrastructure",
        element: <AdminInfraPage />,
      },
      {
        path: "engine",
        element: <AdminEnginePage />,
      },
    ],
  },
  {
    path: "/workspaces/:projectId",
    element: (
      <RequireProjectRole roles={["owner", "manager", "annotator", "validator", "viewer"]}>
        <Workspace />
      </RequireProjectRole>
    ),
    children: [
      {
        index: true,
        element: <WorkspaceHome/>,
      },
      {
        path: "import",
        element: <WorkspaceAssetImport/>,
      },
      {
        path: "Data",
        element: <WorkspaceItems/>,
      },
      {
        path: "annotate",
        element: (
          <RequireProjectRole roles={["owner", "manager", "annotator"]}>
            <></>
          </RequireProjectRole>
        ),
      },
      {
        path: "review",
        element: (
          <RequireProjectRole roles={["owner", "manager", "validator"]}>
            <></>
          </RequireProjectRole>
        ),
      },
      {
        path: "labels",
        element: (
          <RequireProjectRole roles={["owner", "manager"]}>
            <WorkspaceLabels/>
          </RequireProjectRole>
        ),
      },
      {
        path: "models",
        element: (
          <RequireProjectRole roles={["owner", "manager"]}>
            <WorkspaceModels/>
          </RequireProjectRole>
        ),
      },
      {
        path: "exports",
        element: <></>,
      },
      {
        path: "training",
        element: (
          <RequireProjectRole roles={["owner", "manager"]}>
            <></>
          </RequireProjectRole>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireProjectRole roles={["owner", "manager"]}>
            <></>
          </RequireProjectRole>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

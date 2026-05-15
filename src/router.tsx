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

import { createBrowserRouter } from "react-router-dom";
import { RequireAuth, RequireGuest, RequireGlobalRole, RequireProjectRole } from "~/components/RouteGuard";
import Home from "~/view/Home";
import Temp from "./view/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/temp",
    element:
    <RequireGlobalRole roles={["admin"]}>
      <Temp />
    </RequireGlobalRole>,
  },
  {
    path: "/login",
    element: (
      <RequireGuest>
        <></>
      </RequireGuest>
    ),
  },
  // {
  //   path: "/projects",
  //   element: (
  //     <RequireAuth>
  //       <ProjectsPage />
  //     </RequireAuth>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager", "annotator", "validator", "viewer"]}>
  //       <ProjectDetailPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId/labels",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager"]}>
  //       <ProjectLabelsPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId/assets",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager", "annotator", "validator", "viewer"]}>
  //       <ProjectAssetsPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId/annotate",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager", "annotator"]}>
  //       <ProjectAnnotationPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId/review",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager", "validator"]}>
  //       <ProjectReviewPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId/models",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager"]}>
  //       <ProjectModelsPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/projects/:projectId/exports",
  //   element: (
  //     <RequireProjectRole roles={["owner", "manager", "annotator", "validator", "viewer"]}>
  //       <ProjectExportsPage />
  //     </RequireProjectRole>
  //   ),
  // },
  // {
  //   path: "/admin/users",
  //   element: (
  //     <RequireGlobalRole roles={["admin"]}>
  //       <AdminUsersPage />
  //     </RequireGlobalRole>
  //   ),
  // },
]);
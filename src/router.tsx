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
import { RequireAuth, RequireGuest, RequireGlobalRole } from "~/components/RouteGuard";
import Home from "~/view/Home";
import Login from "./view/Login";
import NotFound from "./view/NotFound";
import ProjectsPage from "./view/Project";
import AdminEnginePage from "./view/Engine";
import { AdminLayout } from "./view/Admin/Layout";
import AdminInfraPage from "./view/Admin/infra";
import AdminUsersPage from "./view/Admin/Access";

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
        <AdminLayout /> {/* Le layout contenant la sidebar admin */}
      </RequireGlobalRole>
    ),
    children: [
      {
        index: true,
        // Redirection par défaut vers les utilisateurs
        element: <Navigate to="/admin/users" replace />,
      },
      {
        path: "users",
        element: <AdminUsersPage />, // Identity & Access
      },
      {
        path: "infrastructure",
        element: <AdminInfraPage />, // Contient des sous-onglets (Health, Storage)
      },
      {
        path: "engine",
        element: <AdminEnginePage />, // Contient des sous-onglets (Adapters, Metadata)
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

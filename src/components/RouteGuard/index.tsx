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
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Projects } from "~/api";
import { useAuth } from "~/contexts/Auth";
import type { ProjectMemberRole, UserRole } from "~/types/models";

interface RequireAuthProps extends PropsWithChildren {
  redirectTo?: string;
}

interface RequireGuestProps extends PropsWithChildren {
  redirectTo?: string;
}

interface RequireGlobalRoleProps extends PropsWithChildren {
  roles: UserRole[];
  redirectTo?: string;
}

interface RequireProjectRoleProps extends PropsWithChildren {
  roles: ProjectMemberRole[];
  redirectTo?: string;
}

const ROLE_WEIGHT: Record<ProjectMemberRole, number> = {
  viewer: 1,
  annotator: 2,
  validator: 2,
  manager: 3,
  owner: 4,
};

function hasProjectRole(currentRole: ProjectMemberRole | null | undefined, allowedRoles: ProjectMemberRole[]) {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
}

export function RequireAuth({ children, redirectTo = "/login" }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export function RequireGuest({ children, redirectTo = "/projects" }: RequireGuestProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export function RequireGlobalRole({ children, roles, redirectTo = "/projects" }: RequireGlobalRoleProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export function RequireProjectRole({ children, roles, redirectTo = "/projects" }: RequireProjectRoleProps) {
  const { projectId } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkPermission() {
      const numericProjectId = Number(projectId);

      if (!isAuthenticated || !user || !Number.isFinite(numericProjectId)) {
        if (mounted) {
          setIsAllowed(false);
          setIsLoading(false);
        }
        return;
      }

      if (user.role === "admin") {
        if (mounted) {
          setIsAllowed(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await Projects.get(numericProjectId);
        const currentRole = response.data.current_user_role;

        if (mounted) {
          setIsAllowed(hasProjectRole(currentRole, roles));
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setIsAllowed(false);
          setIsLoading(false);
        }
      }
    }

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [projectId, isAuthenticated, user, roles]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return null;
  }

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export function hasAtLeastProjectRole(currentRole: ProjectMemberRole | null | undefined, minimumRole: ProjectMemberRole) {
  if (!currentRole) return false;

  return ROLE_WEIGHT[currentRole] >= ROLE_WEIGHT[minimumRole];
}
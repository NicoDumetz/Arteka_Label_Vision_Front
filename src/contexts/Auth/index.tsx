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

import { Auth as AuthApi } from "~/api";
import { readStorage, removeStorage, writeStorage } from "~/helpers/Storage";
import { setUnauthorizedHandler } from "~/helpers/api";
import type { AuthContextValue, AuthSession } from "~/types/auth";
import type { User } from "~/types/models";

const AUTH_STORAGE_KEY = "auth.session";

function getInitialSession(): AuthSession | null {
  return readStorage<AuthSession>(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getInitialSession());

  const saveSession = useCallback((accessToken: string, user: User) => {
    const nextSession: AuthSession = {
      access_token: accessToken,
      user,
    };

    setSession(nextSession);
    writeStorage(AUTH_STORAGE_KEY, nextSession);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    removeStorage(AUTH_STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await AuthApi.login({ email, password });

      saveSession(response.data.access_token, response.data.user);
    },
    [saveSession],
  );

  const register = useCallback(
    async (email: string, password: string, username: string) => {
      const response = await AuthApi.register({ email, password, username });

      saveSession(response.data.access_token, response.data.user);
    },
    [saveSession],
  );

  const refreshUser = useCallback(async () => {
    const response = await AuthApi.me();

    if (!session) return;

    saveSession(session.access_token, response.data);
  }, [session, saveSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      role: session?.user.role ?? null,
      isAuthenticated: session !== null,
      login,
      register,
      logout,
      refreshUser,
    }),
    [session, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

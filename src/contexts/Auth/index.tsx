import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { readStorage, removeStorage, writeStorage } from "../../helpers/Storage";

const AUTH_STORAGE_KEY = "auth.session";

interface AuthSession {
  email: string;
  token: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createSession(email: string): AuthSession {
  return {
    email: email.toLowerCase(),
    token: `local-${email.toLowerCase()}`,
  };
}

function getInitialSession(): AuthSession | null {
  return readStorage<AuthSession>(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getInitialSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session ? { id: session.email, email: session.email } : null,
      isAuthenticated: session !== null,
      login: async (email: string) => {
        const nextSession = createSession(email);
        setSession(nextSession);
        writeStorage(AUTH_STORAGE_KEY, nextSession);
      },
      register: async (email: string) => {
        const nextSession = createSession(email);
        setSession(nextSession);
        writeStorage(AUTH_STORAGE_KEY, nextSession);
      },
      logout: () => {
        setSession(null);
        removeStorage(AUTH_STORAGE_KEY);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

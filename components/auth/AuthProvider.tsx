"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  apiRequest,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  registerRequest,
  SESSION_HINT_KEY,
} from "@/lib/auth/client";
import type { AuthSession, AuthUser } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  /** Pretend-payment: no gateway, no form — flips the current user to premium. */
  upgrade(): Promise<void>;
  logout(): Promise<void>;
  request<T>(path: string, init?: RequestInit): Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function hasSessionHint(): boolean {
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionHint(active: boolean) {
  try {
    if (active) window.localStorage.setItem(SESSION_HINT_KEY, "1");
    else window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Storage can be disabled; the current in-memory session still works.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const accessToken = useRef<string | null>(null);

  const applySession = useCallback((session: AuthSession | null) => {
    accessToken.current = session?.access_token ?? null;
    setUser(session?.user ?? null);
    setStatus(session ? "authenticated" : "anonymous");
    writeSessionHint(Boolean(session));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const session = await refreshSessionRequest();
      applySession(session);
      return session.access_token;
    } catch {
      applySession(null);
      throw new ApiError(401, "Sesi telah berakhir. Silakan masuk kembali.");
    }
  }, [applySession]);

  useEffect(() => {
    let active = true;
    if (!hasSessionHint()) {
      queueMicrotask(() => {
        if (active) setStatus("anonymous");
      });
      return () => {
        active = false;
      };
    }

    refreshSessionRequest()
      .then((session) => {
        if (active) applySession(session);
      })
      .catch(() => {
        if (active) applySession(null);
      });

    return () => {
      active = false;
    };
  }, [applySession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginRequest(email, password);
      applySession(session);
    },
    [applySession],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const session = await registerRequest(email, password);
      applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      let token = accessToken.current;
      if (!token) token = await refresh();

      try {
        return await apiRequest<T>(path, init, token);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        const renewedToken = await refresh();
        return apiRequest<T>(path, init, renewedToken);
      }
    },
    [refresh],
  );

  const upgrade = useCallback(async () => {
    const session = await request<AuthSession>("/auth/upgrade", {
      method: "POST",
    });
    applySession(session);
  }, [request, applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, upgrade, logout, request }),
    [status, user, login, register, upgrade, logout, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

/**
 * 認証状態を提供するContext。
 * Web版 (app/frontend/features/auth/useAuth.ts) と同じ三段構えの起動時チェック:
 * 1. 保存済み id_token で /me を検証
 * 2. 失敗したら refreshIdToken() で再試行
 * 3. それでも失敗したら未ログイン扱い
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { router } from "expo-router";
import { cognitoConfig, cognitoDiscovery } from "./cognitoConfig";
import { clearTokens, getIdToken, getRefreshToken } from "./tokenStorage";
import { refreshIdToken } from "./refreshToken";
import { useCognitoAuth } from "./useCognitoAuth";
import { registerSessionExpiredHandler } from "@/lib/api/client";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function verifySession(): Promise<boolean> {
  const idToken = await getIdToken();
  if (!idToken) return false;

  const meResponse = await fetch(`${cognitoConfig.apiBaseUrl}/api/v1/auth/me/`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (meResponse.ok) return true;

  const refreshed = await refreshIdToken();
  return refreshed !== null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { login: loginWithHostedUi } = useCognitoAuth();

  const handleSessionExpired = useCallback(() => {
    setIsAuthenticated(false);
    router.replace("/login");
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  useEffect(() => {
    let ignore = false;
    verifySession()
      .then((ok) => {
        if (!ignore) setIsAuthenticated(ok);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async () => {
    const tokens = await loginWithHostedUi();
    if (tokens) setIsAuthenticated(true);
  }, [loginWithHostedUi]);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${cognitoDiscovery.revocationEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: cognitoConfig.clientId,
            token: refreshToken,
          }).toString(),
        });
      } catch {
        // 失効リクエストが失敗してもローカルのトークン削除は続行する
      }
    }
    await clearTokens();
    setIsAuthenticated(false);
    router.replace("/login");
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, login, logout }),
    [isAuthenticated, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider の内側で使用してください。");
  }
  return ctx;
}

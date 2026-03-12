/**
 * 認証状態を管理するカスタム hook。
 * トークンの保存・削除と認証済みユーザー情報の取得を担う。
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, login, logout as apiLogout, refreshToken, register } from "@/lib/api/auth";
import type { LoginRequest, RegisterRequest, UserResponse } from "@/lib/types/auth";

type AuthState = {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type UseAuthReturn = AuthState & {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<boolean>;
};

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /** 起動時にトークンが有効か確認してユーザー情報を取得する。 */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    getMe()
      .then((user) => {
        setState({ user, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        // アクセストークンが無効な場合はリフレッシュを試みる
        const refresh = localStorage.getItem("refresh_token");
        if (!refresh) {
          setState({ user: null, isLoading: false, isAuthenticated: false });
          return;
        }
        refreshToken(refresh)
          .then(() => getMe())
          .then((user) => {
            setState({ user, isLoading: false, isAuthenticated: true });
          })
          .catch(() => {
            apiLogout();
            setState({ user: null, isLoading: false, isAuthenticated: false });
          });
      });
  }, []);

  const handleLogin = useCallback(async (data: LoginRequest): Promise<void> => {
    await login(data);
    const user = await getMe();
    setState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const handleRegister = useCallback(async (data: RegisterRequest): Promise<void> => {
    await register(data);
    // 登録後は自動でログインする
    await handleLogin({ email: data.email, password: data.password });
  }, [handleLogin]);

  const handleLogout = useCallback((): void => {
    apiLogout();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const handleRefresh = useCallback(async (): Promise<boolean> => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return false;
    try {
      await refreshToken(refresh);
      return true;
    } catch {
      handleLogout();
      return false;
    }
  }, [handleLogout]);

  return {
    ...state,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refresh: handleRefresh,
  };
}

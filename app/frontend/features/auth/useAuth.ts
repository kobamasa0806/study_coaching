/**
 * 認証状態を管理するカスタム hook。
 * Cognito SDK 経由のトークン管理と認証済みユーザー情報の取得を担う。
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
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /**
   * 起動時に Cognito の現在のセッションを確認してユーザー情報を取得する。
   * Cognito SDK はローカルストレージに保存されたセッションを自動的に復元する。
   */
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
        // アクセストークンが期限切れの場合は Cognito SDK でセッションを更新する
        refreshToken()
          .then((tokens) => {
            if (!tokens) {
              setState({ user: null, isLoading: false, isAuthenticated: false });
              return;
            }
            return getMe();
          })
          .then((user) => {
            if (user) {
              setState({ user, isLoading: false, isAuthenticated: true });
            }
          })
          .catch(() => {
            void apiLogout();
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

  const handleLogout = useCallback(async (): Promise<void> => {
    await apiLogout();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const handleRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const tokens = await refreshToken();
      return tokens !== null;
    } catch {
      await handleLogout();
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

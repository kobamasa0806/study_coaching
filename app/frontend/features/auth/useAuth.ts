/**
 * 認証状態を管理するカスタム hook。
 * Cognito id_token の有無でログイン状態を判定し、バックエンドからユーザー情報を取得する。
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe } from "@/lib/api/auth";
import {
  clearTokens,
  cognitoLogout,
  getIdToken,
  initiateLogin,
  refreshIdToken,
} from "@/lib/auth/cognito";
import type { UserResponse } from "@/lib/types/auth";

type AuthState = {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type UseAuthReturn = AuthState & {
  loginWithCognito: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  /** 起動時に id_token が存在するか確認してユーザー情報を取得する */
  useEffect(() => {
    const idToken = getIdToken();
    if (!idToken) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    getMe()
      .then((user) => {
        setState({ user, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        // id_token が期限切れの場合はリフレッシュを試みる
        refreshIdToken()
          .then((tokens) => {
            if (!tokens) throw new Error("リフレッシュ失敗");
            return getMe();
          })
          .then((user) => {
            setState({ user, isLoading: false, isAuthenticated: true });
          })
          .catch(() => {
            clearTokens();
            setState({ user: null, isLoading: false, isAuthenticated: false });
          });
      });
  }, []);

  const handleLoginWithCognito = useCallback(async (): Promise<void> => {
    await initiateLogin();
    // Cognito Hosted UI へリダイレクトするため、この後の処理は /callback で行う
  }, []);

  const handleLogout = useCallback(async (): Promise<void> => {
    await cognitoLogout();
  }, []);

  const handleRefresh = useCallback(async (): Promise<boolean> => {
    const tokens = await refreshIdToken();
    if (!tokens) {
      clearTokens();
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return false;
    }
    return true;
  }, []);

  return {
    ...state,
    loginWithCognito: handleLoginWithCognito,
    logout: handleLogout,
    refresh: handleRefresh,
  };
}

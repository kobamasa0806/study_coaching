/**
 * useAuth hook の単体テスト。
 * Cognito ベースの認証（Cookie に id_token を保存）に対応。
 */

// API・Cognito ユーティリティをモックする
jest.mock("@/lib/api/auth", () => ({
  getMe: jest.fn(),
}));

jest.mock("@/lib/auth/cognito", () => ({
  getIdToken: jest.fn(),
  initiateLogin: jest.fn(),
  cognitoLogout: jest.fn(),
  refreshIdToken: jest.fn(),
  clearTokens: jest.fn(),
}));

import { act, renderHook } from "@testing-library/react";
import * as authApi from "@/lib/api/auth";
import * as cognito from "@/lib/auth/cognito";
import { useAuth } from "../useAuth";

const mockGetMe = authApi.getMe as jest.Mock;
const mockGetIdToken = cognito.getIdToken as jest.Mock;
const mockInitiateLogin = cognito.initiateLogin as jest.Mock;
const mockCognitoLogout = cognito.cognitoLogout as jest.Mock;
const mockRefreshIdToken = cognito.refreshIdToken as jest.Mock;
const mockClearTokens = cognito.clearTokens as jest.Mock;

const TEST_USER = {
  id: "user-123",
  email: "test@example.com",
  username: "テストユーザー",
  is_staff: false,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  // デフォルト: トークンなし
  mockGetIdToken.mockReturnValue(null);
});

describe("useAuth", () => {
  it("id_token がない場合は未認証状態で初期化されること", async () => {
    mockGetIdToken.mockReturnValue(null);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockGetMe).not.toHaveBeenCalled();
  });

  it("id_token がある場合は getMe を呼んでユーザーを設定すること", async () => {
    mockGetIdToken.mockReturnValue("valid-id-token");
    mockGetMe.mockResolvedValueOnce(TEST_USER);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(mockGetMe).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(TEST_USER);
    expect(result.current.isLoading).toBe(false);
  });

  it("getMe が失敗してリフレッシュに成功した場合はユーザーを設定すること", async () => {
    mockGetIdToken.mockReturnValue("expired-id-token");
    mockGetMe
      .mockRejectedValueOnce(new Error("401"))
      .mockResolvedValueOnce(TEST_USER);
    mockRefreshIdToken.mockResolvedValueOnce({
      id_token: "new-id-token",
      access_token: "new-access-token",
      refresh_token: "existing-refresh-token",
      expires_in: 86400,
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(mockRefreshIdToken).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(TEST_USER);
  });

  it("getMe とリフレッシュが両方失敗した場合は未認証状態になること", async () => {
    mockGetIdToken.mockReturnValue("expired-id-token");
    mockGetMe.mockRejectedValue(new Error("401"));
    mockRefreshIdToken.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(mockClearTokens).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("loginWithCognito を呼ぶと initiateLogin が呼ばれること", async () => {
    mockGetIdToken.mockReturnValue(null);
    mockInitiateLogin.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    await act(async () => {
      await result.current.loginWithCognito();
    });

    expect(mockInitiateLogin).toHaveBeenCalledTimes(1);
  });

  it("logout を呼ぶと cognitoLogout が呼ばれること", async () => {
    mockGetIdToken.mockReturnValue("valid-id-token");
    mockGetMe.mockResolvedValueOnce(TEST_USER);
    mockCognitoLogout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    await act(async () => {
      await result.current.logout();
    });

    expect(mockCognitoLogout).toHaveBeenCalledTimes(1);
  });
});

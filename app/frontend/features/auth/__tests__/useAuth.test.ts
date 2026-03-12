/**
 * useAuth hook の単体テスト。
 * API 呼び出しはすべてモックする。
 */

// API モジュールをモックする
jest.mock("@/lib/api/auth", () => ({
  login: jest.fn(),
  register: jest.fn(),
  getMe: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
}));

import { act, renderHook } from "@testing-library/react";
import * as authApi from "@/lib/api/auth";
import { useAuth } from "../useAuth";

const mockLogin = authApi.login as jest.Mock;
const mockRegister = authApi.register as jest.Mock;
const mockGetMe = authApi.getMe as jest.Mock;
const mockLogout = authApi.logout as jest.Mock;

// localStorage をモックする
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, "localStorage", { value: localStorageMock });

const TEST_USER = {
  id: "user-123",
  email: "test@example.com",
  username: "テストユーザー",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

describe("useAuth", () => {
  it("トークンがない場合は未認証状態で初期化されること", async () => {
    const { result } = renderHook(() => useAuth());

    // isLoading が解決されるまで待つ
    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("トークンがある場合は getMe を呼んでユーザーを設定すること", async () => {
    localStorageMock.setItem("access_token", "valid-token");
    mockGetMe.mockResolvedValueOnce(TEST_USER);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    expect(mockGetMe).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(TEST_USER);
  });

  it("login を呼ぶとユーザーが設定されること", async () => {
    mockLogin.mockResolvedValueOnce({ access: "token", refresh: "refresh" });
    mockGetMe.mockResolvedValueOnce(TEST_USER);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    await act(async () => {
      await result.current.login({ email: "test@example.com", password: "password123" });
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(TEST_USER);
  });

  it("logout を呼ぶとユーザーがクリアされること", async () => {
    localStorageMock.setItem("access_token", "valid-token");
    mockGetMe.mockResolvedValueOnce(TEST_USER);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    act(() => {
      result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("register を呼ぶと登録後に自動ログインすること", async () => {
    mockRegister.mockResolvedValueOnce(TEST_USER);
    mockLogin.mockResolvedValueOnce({ access: "token", refresh: "refresh" });
    mockGetMe.mockResolvedValueOnce(TEST_USER);

    const { result } = renderHook(() => useAuth());
    await act(async () => {});

    await act(async () => {
      await result.current.register({
        email: "new@example.com",
        username: "新規ユーザー",
        password: "password123",
      });
    });

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
  });
});

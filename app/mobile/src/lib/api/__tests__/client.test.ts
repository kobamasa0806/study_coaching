import { apiRequest, registerSessionExpiredHandler } from "../client";
import { getIdToken } from "@/features/auth/tokenStorage";
import { refreshIdToken } from "@/features/auth/refreshToken";

jest.mock("@/features/auth/cognitoConfig", () => ({
  cognitoConfig: {
    domain: "https://example-domain.auth.ap-northeast-1.amazoncognito.com",
    clientId: "test-client-id",
    apiBaseUrl: "https://api.example.com",
  },
}));

jest.mock("@/features/auth/tokenStorage", () => ({
  getIdToken: jest.fn().mockResolvedValue("stub-id-token"),
}));

jest.mock("@/features/auth/refreshToken", () => ({
  refreshIdToken: jest.fn(),
}));

describe("apiRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  it("Authorizationヘッダーを付与してリクエストする", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "1" }),
    });

    const result = await apiRequest("/api/v1/plans/", { requiresAuth: true });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/plans/",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer stub-id-token" }),
      })
    );
    expect(result).toEqual({ id: "1" });
  });

  it("401でリフレッシュ成功時はリトライする", async () => {
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ id: "2" }) });
    (refreshIdToken as jest.Mock).mockResolvedValueOnce({
      id_token: "new-token",
      access_token: "a",
      refresh_token: "r",
      expires_in: 3600,
    });

    const result = await apiRequest("/api/v1/plans/", { requiresAuth: true });

    expect(refreshIdToken).toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: "2" });
  });

  it("401でリフレッシュ失敗時はセッション失効ハンドラーを呼ぶ", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    (refreshIdToken as jest.Mock).mockResolvedValueOnce(null);
    const onExpired = jest.fn();
    registerSessionExpiredHandler(onExpired);

    await expect(apiRequest("/api/v1/plans/", { requiresAuth: true })).rejects.toThrow();
    expect(onExpired).toHaveBeenCalled();
  });

  it("204はundefinedを返す", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 });
    const result = await apiRequest("/api/v1/plans/x/", { method: "DELETE", requiresAuth: true });
    expect(result).toBeUndefined();
  });

  it("エラーレスポンスはボディをthrowする", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: "VALIDATION_ERROR", message: "bad" } }),
    });
    await expect(apiRequest("/api/v1/plans/", { method: "POST", requiresAuth: true })).rejects.toEqual({
      error: { code: "VALIDATION_ERROR", message: "bad" },
    });
  });

  it("getIdTokenが呼ばれることを確認", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    await apiRequest("/api/v1/plans/", { requiresAuth: true });
    expect(getIdToken).toHaveBeenCalled();
  });
});

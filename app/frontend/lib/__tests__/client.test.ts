/**
 * API クライアント (lib/api/client.ts) のユニットテスト。
 * Cognito id_token を Cookie から取得する実装に対応。
 */

// fetch をモックする
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { apiRequest } from "../api/client";

beforeEach(() => {
  mockFetch.mockClear();
  // Cookie をリセットする
  document.cookie = "id_token=; max-age=0";
});

describe("apiRequest", () => {
  it("GET リクエストを正しく送信すること", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "1", name: "test" }),
    });

    const result = await apiRequest<{ id: string; name: string }>("/api/v1/test/");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/test/"),
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual({ id: "1", name: "test" });
  });

  it("POST リクエストで body が JSON シリアライズされること", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/api/v1/test/", {
      method: "POST",
      body: { email: "test@example.com" },
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.body).toBe(JSON.stringify({ email: "test@example.com" }));
  });

  it("requiresAuth=true のとき Cookie の id_token が Authorization ヘッダーに付与されること", async () => {
    document.cookie = "id_token=my-cognito-id-token";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/api/v1/auth/me/", { requiresAuth: true });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer my-cognito-id-token");
  });

  it("requiresAuth=false のとき Authorization ヘッダーが付与されないこと", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiRequest("/api/v1/test/", { method: "POST" });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("レスポンスが ok でない場合はエラーデータを throw すること", async () => {
    const errorData = { error: { code: "NOT_FOUND", message: "見つかりません。" } };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorData,
    });

    await expect(apiRequest("/api/v1/plans/999/")).rejects.toEqual(errorData);
  });
});

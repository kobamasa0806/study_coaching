"use client";

/**
 * ログインページ。
 * - メールアドレスとパスワードでログインする
 * - 成功したら /dashboard にリダイレクトする
 * - 失敗したらエラーメッセージを表示する
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/features/auth/useAuth";
import type { ApiError } from "@/lib/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // フォームの入力値
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // エラーメッセージと送信中フラグ
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** フォーム送信処理：ログイン API を呼び出す */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // ログイン成功 → ダッシュボードへ遷移
      router.push("/dashboard");
    } catch (err) {
      // API エラーのメッセージを取り出して表示する
      const apiError = err as ApiError;
      setError(
        typeof apiError?.error?.message === "string"
          ? apiError.error.message
          : "メールアドレスまたはパスワードが正しくありません。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>
          <p className="mt-2 text-sm text-gray-600">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              新規登録
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="8文字以上"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

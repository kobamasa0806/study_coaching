"use client";

/**
 * 新規登録ページ。
 * Cognito Hosted UI のサインアップページへリダイレクトして登録を行う。
 * 登録完了後は Cognito が /callback にリダイレクトし、通常の認証フローに合流する。
 */

import Link from "next/link";
import { useState } from "react";
import { initiateSignUp } from "@/lib/auth/cognito";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await initiateSignUp();
      // Cognito Hosted UI へリダイレクトするため、ここには到達しない
    } catch {
      setError("登録ページへの遷移に失敗しました。しばらくしてからお試しください。");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">新規登録</h1>
          <p className="mt-2 text-sm text-gray-600">
            アカウントをお持ちの方は{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignUp}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "リダイレクト中..." : "アカウントを作成"}
          </button>
        </div>
      </div>
    </div>
  );
}

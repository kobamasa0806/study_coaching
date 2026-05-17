"use client";

/**
 * ログインページ。
 * Cognito Hosted UI にリダイレクトして認証を行う。
 * ユーザーは Cognito の画面でメールアドレス＋パスワードを入力する。
 */

import { useState } from "react";
import { initiateLogin } from "@/lib/auth/cognito";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await initiateLogin();
      // Cognito Hosted UI へリダイレクトするため、ここには到達しない
    } catch {
      setError("ログインの開始に失敗しました。しばらくしてからお試しください。");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ログイン</h1>
          <p className="mt-2 text-sm text-gray-600">
            学習コーチングアプリへようこそ
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
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "リダイレクト中..." : "ログイン / 新規登録"}
          </button>
        </div>
      </div>
    </div>
  );
}

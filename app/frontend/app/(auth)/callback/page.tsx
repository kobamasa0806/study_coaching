"use client";

/**
 * Cognito OAuth コールバックページ。
 * Cognito から ?code=...&state=... でリダイレクトされたときにトークン交換を行い、/dashboard へ遷移する。
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { exchangeCodeForTokens, saveTokens } from "@/lib/auth/cognito";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const returnedState = searchParams.get("state");

    if (errorParam) {
      setError("認証がキャンセルされたか、エラーが発生しました。ログインをやり直してください。");
      return;
    }

    if (!code) {
      setError("認証コードが見つかりません。ログインをやり直してください。");
      return;
    }

    // CSRF 対策: state パラメータを検証する
    const savedState = sessionStorage.getItem("pkce_state");
    sessionStorage.removeItem("pkce_state");
    if (!returnedState || !savedState || returnedState !== savedState) {
      setError("セキュリティチェックに失敗しました。ログインをやり直してください。");
      return;
    }

    exchangeCodeForTokens(code)
      .then((tokens) => {
        saveTokens(tokens);
        router.replace("/dashboard");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "不明なエラーが発生しました。";
        setError(message);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
            <a
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              ログインページに戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
        <p className="mt-4 text-sm text-gray-600">ログイン処理中...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

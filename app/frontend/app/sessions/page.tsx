"use client";

/**
 * 1on1 セッション一覧ページ。
 * - API からセッション一覧を取得して表示する
 * - 新規セッションの予約（インラインフォーム）
 * - 完了済み以外のセッションを削除できる
 */

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Loader2, CalendarDays } from "lucide-react";
import { getSessions, createSession, deleteSession } from "@/lib/api/sessions";
import type { Session } from "@/lib/types/sessions";

/** ステータスの日本語ラベル */
const STATUS_LABEL: Record<string, string> = {
  scheduled: "予定",
  completed: "完了",
  cancelled: "キャンセル",
};

/** ステータスに対応するバッジの CSS クラス */
const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function SessionsPage() {
  // セッション一覧と UI 状態
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  // 新規予約フォームの入力値
  const [form, setForm] = useState({ scheduled_at: "", memo: "" });

  /** ページ表示時にセッション一覧を取得する */
  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(() => setError("セッションの取得に失敗しました。"))
      .finally(() => setIsLoading(false));
  }, []);

  /** セッション予約フォームの送信処理 */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const created = await createSession({
        scheduled_at: form.scheduled_at,
        memo: form.memo || undefined, // メモが空の場合は送信しない
      });
      // 作成したセッションを一覧の先頭に追加する
      setSessions((prev) => [created, ...prev]);
      setForm({ scheduled_at: "", memo: "" });
      setShowForm(false);
    } catch {
      setError("セッションの作成に失敗しました。");
    } finally {
      setIsCreating(false);
    }
  };

  /** セッション削除処理（確認ダイアログ付き） */
  const handleDelete = async (sessionId: string) => {
    if (!confirm("このセッションを削除しますか？")) return;
    try {
      await deleteSession(sessionId);
      // 削除したセッションを一覧から除外する
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setError("削除に失敗しました。");
    }
  };

  /**
   * ISO 8601 形式の日時文字列を "yyyy/MM/dd HH:mm" 形式に変換する。
   * @param iso - ISO 8601 形式の日時文字列（例: "2026-03-15T14:00:00Z"）
   */
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">1on1 セッション</h1>
            <p className="text-sm text-gray-500 mt-1">コーチとのセッション記録を管理します。</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新規予約
          </button>
        </div>

        {/* 新規作成フォーム */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4"
          >
            <h2 className="font-semibold text-gray-900">セッションを予約</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日時</label>
              <input
                type="datetime-local"
                required
                value={form.scheduled_at}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={2}
                placeholder="事前に確認したいことなど"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                予約する
              </button>
            </div>
          </form>
        )}

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* ローディング */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        ) : sessions.length === 0 ? (
          /* 空状態 */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">セッションがまだありません。</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-violet-600 hover:underline"
            >
              最初のセッションを予約する
            </button>
          </div>
        ) : (
          /* セッション一覧 */
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li key={session.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[session.status]}`}>
                        {STATUS_LABEL[session.status]}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(session.scheduled_at)}
                      </span>
                    </div>
                    {session.memo && (
                      <p className="text-sm text-gray-600 mt-1">メモ: {session.memo}</p>
                    )}
                    {session.summary && (
                      <p className="text-sm text-gray-500 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                        {session.summary}
                      </p>
                    )}
                  </div>
                  {session.status !== "completed" && (
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                    >
                      削除
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

"use client";

/**
 * 学習プラン一覧ページ。
 * - API からプラン一覧を取得して表示する
 * - 新規プランの作成（インラインフォーム）
 * - プランの削除（確認ダイアログ付き）
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import { getPlans, createPlan, deletePlan } from "@/lib/api/plans";
import type { Plan } from "@/lib/types/plans";

/** ステータスの日本語ラベル */
const STATUS_LABEL: Record<string, string> = {
  active: "進行中",
  completed: "完了",
  archived: "アーカイブ",
};

/** ステータスに対応するバッジの CSS クラス */
const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-gray-100 text-gray-500",
};

export default function PlansPage() {
  // プラン一覧と UI 状態
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  // 新規作成フォームの入力値
  const [form, setForm] = useState({ title: "", description: "", target_date: "" });

  /** ページ表示時にプラン一覧を取得する */
  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setError("プランの取得に失敗しました。"))
      .finally(() => setIsLoading(false));
  }, []);

  /** プラン作成フォームの送信処理 */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const created = await createPlan(form);
      // 作成したプランを一覧の先頭に追加する
      setPlans((prev) => [created, ...prev]);
      setForm({ title: "", description: "", target_date: "" });
      setShowForm(false);
    } catch {
      setError("プランの作成に失敗しました。");
    } finally {
      setIsCreating(false);
    }
  };

  /** プラン削除処理（確認ダイアログ付き） */
  const handleDelete = async (planId: string) => {
    if (!confirm("このプランを削除しますか？")) return;
    try {
      await deletePlan(planId);
      // 削除したプランを一覧から除外する
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch {
      setError("削除に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">学習プラン一覧</h1>
            <p className="text-sm text-gray-500 mt-1">作成した学習計画を管理します。</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新規作成
          </button>
        </div>

        {/* 新規作成フォーム */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 space-y-4"
          >
            <h2 className="font-semibold text-gray-900">新しいプランを作成</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例：宅建士 2026年合格プラン"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="プランの概要を入力してください"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目標日</label>
              <input
                type="date"
                required
                value={form.target_date}
                onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                作成する
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
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : plans.length === 0 ? (
          /* 空状態 */
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">まだプランがありません。</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              最初のプランを作成する
            </button>
          </div>
        ) : (
          /* プラン一覧 */
          <ul className="space-y-3">
            {plans.map((plan) => (
              <li key={plan.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[plan.status]}`}>
                        {STATUS_LABEL[plan.status]}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {plan.target_date}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 truncate">{plan.title}</p>
                    {plan.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{plan.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      削除
                    </button>
                    <Link
                      href="/study-plan"
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      ガントチャート
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

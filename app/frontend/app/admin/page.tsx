"use client";

/**
 * 管理画面ページ（コーチ・管理者専用）。
 * ユーザー総数・利用状況の集計と、ユーザー一覧を表示する。
 * is_staff=true でない場合はダッシュボードへリダイレクトする。
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, CheckSquare, UserPlus, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { getAdminStats, getAdminUsers } from "@/lib/api/admin";
import type { AdminStats, AdminUser } from "@/lib/types/admin";
import DashboardHeader from "../components/DashboardHeader";

// ---- サマリーカード -------------------------------------------------------

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
};

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ---- プログレスバー --------------------------------------------------------

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ---- メインページ ----------------------------------------------------------

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 認証・権限チェック
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.is_staff) {
      router.push("/dashboard");
      return;
    }

    // データ取得
    Promise.all([getAdminStats(), getAdminUsers()])
      .then(([statsData, usersData]) => {
        setStats(statsData);
        setUsers(usersData);
      })
      .catch(() => {
        setError("データの取得に失敗しました。");
      })
      .finally(() => setIsLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const taskCompletionRate =
    stats.total_tasks === 0
      ? 0
      : Math.round((stats.tasks_by_status.completed / stats.total_tasks) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* タイトル */}
        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
        </div>

        {/* サマリーカード */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="総ユーザー数"
            value={stats.total_users}
            icon={<Users className="w-4 h-4 text-indigo-600" />}
            color="bg-indigo-100"
            sub={`活動中 ${stats.active_users} 人`}
          />
          <StatCard
            label="今月の新規登録"
            value={stats.new_users_this_month}
            icon={<UserPlus className="w-4 h-4 text-emerald-600" />}
            color="bg-emerald-100"
          />
          <StatCard
            label="総プラン数"
            value={stats.total_plans}
            icon={<BookOpen className="w-4 h-4 text-violet-600" />}
            color="bg-violet-100"
            sub={`完了 ${stats.plans_by_status.completed} 件`}
          />
          <StatCard
            label="タスク完了率"
            value={taskCompletionRate}
            icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
            color="bg-amber-100"
            sub={`${stats.tasks_by_status.completed} / ${stats.total_tasks} 件`}
          />
        </div>

        {/* ステータス内訳 */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-violet-500" />
              プラン ステータス内訳
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>進行中</span><span>{stats.plans_by_status.active} 件</span>
                </div>
                <ProgressBar value={stats.plans_by_status.active} max={stats.total_plans} color="bg-violet-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>完了</span><span>{stats.plans_by_status.completed} 件</span>
                </div>
                <ProgressBar value={stats.plans_by_status.completed} max={stats.total_plans} color="bg-emerald-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>アーカイブ</span><span>{stats.plans_by_status.archived} 件</span>
                </div>
                <ProgressBar value={stats.plans_by_status.archived} max={stats.total_plans} color="bg-gray-300" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-amber-500" />
              タスク ステータス内訳
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>未着手</span><span>{stats.tasks_by_status.pending} 件</span>
                </div>
                <ProgressBar value={stats.tasks_by_status.pending} max={stats.total_tasks} color="bg-gray-300" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>進行中</span><span>{stats.tasks_by_status.in_progress} 件</span>
                </div>
                <ProgressBar value={stats.tasks_by_status.in_progress} max={stats.total_tasks} color="bg-blue-400" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>完了</span><span>{stats.tasks_by_status.completed} 件</span>
                </div>
                <ProgressBar value={stats.tasks_by_status.completed} max={stats.total_tasks} color="bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              ユーザー一覧
              <span className="ml-1 text-xs font-normal text-gray-400">{users.length} 人</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left font-medium">ユーザー</th>
                  <th className="px-6 py-3 text-left font-medium">登録日</th>
                  <th className="px-6 py-3 text-center font-medium">プラン数</th>
                  <th className="px-6 py-3 text-left font-medium">タスク完了率</th>
                  <th className="px-6 py-3 text-center font-medium">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const taskPct =
                    u.task_count === 0
                      ? 0
                      : Math.round((u.completed_task_count / u.task_count) * 100);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{u.username}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-700">{u.plan_count}</span>
                        {u.completed_plan_count > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            (完了 {u.completed_plan_count})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 min-w-[160px]">
                        {u.task_count === 0 ? (
                          <span className="text-xs text-gray-400">タスクなし</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{u.completed_task_count} / {u.task_count}</span>
                              <span>{taskPct}%</span>
                            </div>
                            <ProgressBar
                              value={u.completed_task_count}
                              max={u.task_count}
                              color="bg-emerald-400"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {u.is_staff ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            管理者
                          </span>
                        ) : u.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            有効
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            無効
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                      ユーザーが見つかりません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

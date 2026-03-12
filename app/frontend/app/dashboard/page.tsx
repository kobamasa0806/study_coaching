"use client";

/**
 * ダッシュボードページ。
 * ログイン後のトップ画面として、主要機能へのナビゲーションカードを表示する。
 */

import Link from "next/link";
import { BookOpen, CalendarDays, MessageSquare, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mb-8">学習の進捗を確認しましょう。</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/study-plan"
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">学習計画</h2>
            <p className="text-sm text-gray-500">ガントチャートで進捗を管理する</p>
          </Link>

          <Link
            href="/plans"
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">学習プラン一覧</h2>
            <p className="text-sm text-gray-500">作成したプランを確認・編集する</p>
          </Link>

          <Link
            href="/sessions"
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-violet-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 transition-colors" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">1on1 セッション</h2>
            <p className="text-sm text-gray-500">コーチとのセッション記録を見る</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

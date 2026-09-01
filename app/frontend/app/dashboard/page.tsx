"use client";

/**
 * ダッシュボードページ。
 * ログイン後のトップ画面として、主要機能へのナビゲーションカードを表示する。
 */

import Link from "next/link";
import { CalendarDays, MessageSquare, ArrowRight, HelpCircle } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mb-8">学習の進捗を確認しましょう。</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/plans"
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">学習プラン一覧</h2>
            <p className="text-sm text-gray-500">ガントチャートで進捗を管理する</p>
          </Link>

          {/* 1on1 セッションは準備中のためグレーアウト・非活性表示 */}
          <div
            aria-disabled="true"
            className="bg-white rounded-2xl border border-gray-200 p-6 opacity-60 grayscale cursor-not-allowed select-none"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                準備中
              </span>
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">1on1 セッション</h2>
            <p className="text-sm text-gray-500">コーチとのセッション記録を見る</p>
          </div>

          <Link
            href="/gantt-guide"
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-amber-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-1">ガントチャート 使い方</h2>
            <p className="text-sm text-gray-500">ガントチャートの操作方法を確認する</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

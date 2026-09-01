'use client'

/**
 * 学習プランページ（ガントチャート表示）。
 * - 表示期間をナビゲーションボタンで前後に移動できる
 * - 項目の追加・削除、日付セルのクリック/ドラッグで計画・実績を記録できる
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { addDays, startOfWeek, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import DashboardHeader from '../components/DashboardHeader'
import GanttChart from './components/GanttChart'
import StudyLogPanel from './components/StudyLogPanel'
import { usePlanGantt } from '@/features/plans/usePlanGantt'

/** ガントチャートの1行分のデータ */
export type GanttItem = {
  id: string         // タスクID（UUID）
  name: string       // 項目名
  planDates: string[]   // 計画日付リスト（"YYYY-MM-DD" 形式）
  actualDates: string[] // 実績日付リスト（"YYYY-MM-DD" 形式）
}

/** 初期表示日数（8週間） */
const INITIAL_DAYS = 8 * 7

/**
 * 表示期間内の全日付を配列で返す。
 * @param start - 表示開始日
 * @param days  - 表示日数
 */
function getDisplayDates(start: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => addDays(start, i))
}

function StudyPlanContent() {
  const searchParams = useSearchParams()
  const planIdParam = searchParams.get('planId')

  // 表示開始日（デフォルトは今週の月曜日）
  const [viewStart, setViewStart] = useState<Date>(new Date())
  // 表示する総日数
  const totalDays = INITIAL_DAYS
  // SSR との日付ズレを防ぐためのマウント完了フラグ
  const [mounted, setMounted] = useState(false)

  // ガントチャート用データと操作関数を hook から取得
  const { items, isLoading, planId, targetDate, addItem, removeItem, updateItemName, toggleDates } = usePlanGantt({
    initialPlanId: planIdParam,
  })

  // 項目追加モーダルの状態（連打による大量追加を防ぐため、確定操作を挟む）
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)

  /** 項目追加モーダルを確定し、入力された名前で項目を作成する */
  const handleConfirmAddItem = async () => {
    setIsAddingItem(true)
    try {
      await addItem(newItemName.trim() || '項目名')
      setIsAddModalOpen(false)
      setNewItemName('')
    } finally {
      setIsAddingItem(false)
    }
  }

  useEffect(() => {
    // クライアントサイドで今週の月曜日を設定する
    setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setMounted(true)
  }, [])

  // 表示する日付の配列
  const dates = getDisplayDates(viewStart, totalDays)

  // マウント前・データ読み込み中はローディング表示
  if (!mounted || isLoading) {
    return (
      <>
        <DashboardHeader />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 sm:px-6 py-8">
          {/* ページヘッダー */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">学習プラン</h1>
              <p className="text-gray-500 text-sm mt-1">
                セルをクリック・ドラッグして計画（青）と実績（緑）を記録できます
              </p>
            </div>
            {/* 項目追加ボタン */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="self-start sm:self-auto inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              項目を追加
            </button>
          </div>

          {/* 操作バー（ナビゲーション・凡例・月追加） */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* 週移動ナビゲーション */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setViewStart(d => addDays(d, -7))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="前の週"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* 今日ボタン：今週月曜日に戻る */}
              <button
                onClick={() => setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                今日
              </button>
              <button
                onClick={() => setViewStart(d => addDays(d, 7))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="次の週"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 表示期間のラベル */}
            <span className="text-sm text-gray-500 font-medium">
              {format(viewStart, 'yyyy年M月d日', { locale: ja })}
              {' 〜 '}
              {format(addDays(viewStart, totalDays - 1), 'M月d日', { locale: ja })}
            </span>

            {/* 右端：凡例 */}
            <div className="flex items-center gap-4 ml-auto">
              {/* 色の凡例 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                  <span className="text-xs text-gray-600 font-medium">計画</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-xs text-gray-600 font-medium">実績</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-orange-300" />
                  <span className="text-xs text-gray-600 font-medium">目標日</span>
                </div>
              </div>
            </div>
          </div>

          {/* ガントチャート本体 */}
          <GanttChart
            items={items}
            dates={dates}
            targetDate={targetDate}
            onToggleDates={toggleDates}
            onUpdateName={updateItemName}
            onRemoveItem={removeItem}
          />

          <p className="text-xs text-gray-400 mt-3 text-right">変更は自動保存されます</p>

          {/* 勉強時間の記録パネル */}
          <StudyLogPanel planId={planId} items={items} />
        </div>
      </div>

      {/* 項目追加モーダル */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-semibold text-gray-900 mb-4">項目を追加</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">項目名</label>
            <input
              autoFocus
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAddingItem && handleConfirmAddItem()}
              placeholder="例：第1章 基礎知識"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-3 justify-end mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setNewItemName('')
                }}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmAddItem}
                disabled={isAddingItem}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                確定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function StudyPlanPage() {
  return (
    <Suspense>
      <StudyPlanContent />
    </Suspense>
  )
}

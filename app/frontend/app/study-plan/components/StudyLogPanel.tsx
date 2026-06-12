'use client'

/**
 * 勉強記録パネル。
 * ガントチャート画面の下部に配置し、勉強時間の記録・合計・時間帯別分布を表示する。
 * - 日付・開始/終了時刻・項目・メモを入力して記録する（勉強分数は自動計算）
 * - 合計勉強時間と、時間帯（0〜23時）ごとの勉強分布を可視化する
 */

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Clock, Plus, Trash2 } from 'lucide-react'
import type { GanttItem } from '../page'
import { useStudyLogs } from '@/features/plans/useStudyLogs'
import type { StudyLog } from '@/lib/types/studyLogs'

type StudyLogPanelProps = {
  planId: string | null
  /** ガントチャートの項目（タスク）。記録の紐付け先として選択する */
  items: GanttItem[]
}

/** 分数を「X時間Y分」表記に整形する */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}分`
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

/** "HH:MM" 文字列を 0時からの経過分数に変換する（不正なら null） */
function timeToMinutes(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}

/** 開始・終了から勉強分数を計算する（日跨ぎは翌日扱い・同時刻は null） */
function calcDuration(start: string, end: string): number | null {
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  if (s === null || e === null) return null
  const diff = e <= s ? e + 24 * 60 - s : e - s
  return diff === 0 ? null : diff
}

/** "HH:MM:SS" や "HH:MM" を "HH:MM" に整形する */
function trimSeconds(time: string): string {
  return time.slice(0, 5)
}

export default function StudyLogPanel({ planId, items }: StudyLogPanelProps) {
  const { logs, stats, isLoading, addLog, removeLog } = useStudyLogs(planId)

  // 入力フォームの状態
  const [taskId, setTaskId] = useState<string>('')
  const [studiedOn, setStudiedOn] = useState<string>(() =>
    format(new Date(), 'yyyy-MM-dd')
  )
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [memo, setMemo] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // 項目名を引くためのマップ
  const itemNameById = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((i) => map.set(i.id, i.name))
    return map
  }, [items])

  // 入力中の勉強分数（リアルタイム表示用）
  const liveDuration = calcDuration(startTime, endTime)

  // 時間帯グラフの最大値（バーの高さスケール用。0除算回避で最低1）
  const maxHourly = Math.max(1, ...stats.hourly_minutes)

  const handleSubmit = async () => {
    setError('')

    const selectedTask = taskId || items[0]?.id
    if (!selectedTask) {
      setError('記録する項目がありません。先に項目を追加してください。')
      return
    }
    if (timeToMinutes(startTime) === null || timeToMinutes(endTime) === null) {
      setError('開始・終了時刻を入力してください。')
      return
    }
    if (liveDuration === null) {
      setError('開始時刻と終了時刻が同じです。')
      return
    }

    setIsSaving(true)
    const result = await addLog({
      task_id: selectedTask,
      studied_on: studiedOn,
      start_time: startTime,
      end_time: endTime,
      memo: memo.trim(),
    })
    setIsSaving(false)

    if (result === true) {
      // 成功：時刻とメモをクリアして連続入力しやすくする
      setStartTime('')
      setEndTime('')
      setMemo('')
    } else {
      setError(result)
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-extrabold text-gray-900">勉強時間の記録</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左：入力フォーム＋記録一覧 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          {/* 入力フォーム */}
          <div className="space-y-3">
            {/* 日付 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                日付
              </label>
              <input
                type="date"
                value={studiedOn}
                onChange={(e) => setStudiedOn(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 開始・終了時刻 */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  開始
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <span className="pb-2 text-gray-400">〜</span>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  終了
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 勉強分数の自動表示 */}
            <div className="text-sm text-gray-500">
              勉強時間：
              <span className="font-bold text-indigo-600">
                {liveDuration !== null ? formatMinutes(liveDuration) : '—'}
              </span>
            </div>

            {/* 項目選択 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                項目
              </label>
              <select
                value={taskId || items[0]?.id || ''}
                onChange={(e) => setTaskId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {items.length === 0 ? (
                  <option value="">項目がありません</option>
                ) : (
                  items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                メモ（任意）
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="何を勉強したか"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isSaving ? '保存中...' : '記録する'}
            </button>
          </div>

          {/* 記録一覧 */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 mb-2">最近の記録</h3>
            {isLoading ? (
              <p className="text-xs text-gray-400">読み込み中...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-gray-400">まだ記録がありません。</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {logs.map((log) => (
                  <StudyLogRow
                    key={log.id}
                    log={log}
                    taskName={itemNameById.get(log.task_id) ?? '（削除された項目）'}
                    onDelete={() => removeLog(log.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 右：集計（合計＋時間帯別グラフ） */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          {/* 合計勉強時間 */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500">合計勉強時間</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              {formatMinutes(stats.total_minutes)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              全{stats.log_count}件の記録
            </p>
          </div>

          {/* 時間帯別グラフ */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              時間帯ごとの勉強量
            </p>
            <div className="flex items-end gap-[2px] h-32">
              {stats.hourly_minutes.map((minutes, hour) => (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* バー */}
                  <div
                    className="w-full rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors"
                    style={{
                      height: `${(minutes / maxHourly) * 100}%`,
                      minHeight: minutes > 0 ? '2px' : '0',
                    }}
                  />
                  {/* ホバー時のツールチップ */}
                  {minutes > 0 && (
                    <div className="absolute -top-6 hidden group-hover:block whitespace-nowrap text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded">
                      {hour}時 {formatMinutes(minutes)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* 横軸ラベル（0/6/12/18/23時） */}
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
              <span>0時</span>
              <span>6時</span>
              <span>12時</span>
              <span>18時</span>
              <span>23時</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              バーが高い時間帯ほど、よく勉強しています。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/** 記録一覧の1行 */
function StudyLogRow({
  log,
  taskName,
  onDelete,
}: {
  log: StudyLog
  taskName: string
  onDelete: () => void
}) {
  return (
    <li className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">{log.studied_on}</span>
          <span className="text-gray-500">
            {trimSeconds(log.start_time)}〜{trimSeconds(log.end_time)}
          </span>
          <span className="text-indigo-600 font-bold">
            {formatMinutes(log.duration_minutes)}
          </span>
        </div>
        <div className="text-xs text-gray-400 truncate">
          {taskName}
          {log.memo ? ` ・ ${log.memo}` : ''}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
        aria-label="記録を削除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  )
}

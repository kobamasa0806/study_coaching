'use client'

/**
 * ガントチャートコンポーネント。
 * - 年・月・曜日・日付の4行ヘッダーを持つ表形式のガントチャート
 * - 各項目（タスク）は「計画」行と「実績」行の2行で構成される
 * - セルをクリック・ドラッグして日付を塗りつぶす（もしくは消す）
 * - 月ヘッダーをクリックすると列を折りたたみ/展開できる
 * - 項目名はクリックして編集できる
 */

import { Fragment, useEffect, useRef, useState } from 'react'
import { format, isToday, isWeekend } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Check, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { GanttItem } from '../page'

// ---- 型定義 ----

/** コンポーネントの props */
type Props = {
  items: GanttItem[]
  dates: Date[]
  /** 日付セルのクリック/ドラッグ時に呼ばれる */
  onToggleDates: (itemId: string, rowType: 'plan' | 'actual', dates: string[], fill: boolean) => void
  /** 項目名の変更時に呼ばれる */
  onUpdateName: (id: string, name: string) => void
  /** 項目の削除時に呼ばれる */
  onRemoveItem: (id: string) => void
}

/** ドラッグ中の状態を保持する型 */
type DragState = {
  itemId: string              // ドラッグ中の項目ID
  rowType: 'plan' | 'actual'  // 計画行か実績行か
  fill: boolean               // 塗りつぶし（true）か消去（false）か
  startDate: string           // ドラッグ開始日
  lastDate: string            // 最後にホバーした日
}

/** 月ごとの表示情報 */
type MonthInfo = {
  key: string        // "yyyy-MM" 形式（折りたたみの識別子）
  monthLabel: string // 表示用月ラベル（例: "3月"）
  yearLabel: string  // 表示用年ラベル（例: "2026年"）
  dates: Date[]      // この月に含まれる日付の配列
}

/** 年ごとにグループ化した月情報 */
type YearGroup = {
  label: string       // 年ラベル（例: "2026年"）
  months: MonthInfo[] // この年に含まれる月の配列
}

// ---- 定数 ----

const NAME_COL_WIDTH = 210      // 項目名列の幅（px）
const CELL_WIDTH = 30           // 通常の日付セル幅（px）
const COLLAPSED_CELL_WIDTH = 22 // 折りたたまれた月の列幅（px）

// ---- ヘルパー関数 ----

/** Date を "yyyy-MM-dd" 形式の文字列に変換する */
function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * 日付配列から月ごとの情報を構築する。
 * Map を使って同じ月の日付をまとめる。
 */
function buildMonthInfos(dates: Date[]): MonthInfo[] {
  const map = new Map<string, MonthInfo>()
  for (const date of dates) {
    const key = format(date, 'yyyy-MM')
    if (!map.has(key)) {
      map.set(key, {
        key,
        monthLabel: format(date, 'M月'),
        yearLabel: format(date, 'yyyy年'),
        dates: [],
      })
    }
    map.get(key)!.dates.push(date)
  }
  return Array.from(map.values())
}

/**
 * 月情報を年でグループ化する。
 * 同じ年が連続する場合は1つのグループにまとめる。
 */
function buildYearGroups(monthInfos: MonthInfo[]): YearGroup[] {
  const groups: YearGroup[] = []
  for (const m of monthInfos) {
    const last = groups[groups.length - 1]
    if (last && last.label === m.yearLabel) {
      last.months.push(m)
    } else {
      groups.push({ label: m.yearLabel, months: [m] })
    }
  }
  return groups
}

// ---- コンポーネント本体 ----

export default function GanttChart({
  items,
  dates,
  onToggleDates,
  onUpdateName,
  onRemoveItem,
}: Props) {
  // ドラッグ状態（ref で管理して再レンダリングを避ける）
  const drag = useRef<DragState | null>(null)
  // 編集中の項目ID
  const [editingId, setEditingId] = useState<string | null>(null)
  // 編集中のテキスト
  const [editValue, setEditValue] = useState('')
  // 折りたたまれた月のキーセット
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  // 月・年のグループ情報を計算
  const monthInfos = buildMonthInfos(dates)
  const yearGroups = buildYearGroups(monthInfos)
  // 表示範囲の全日付を文字列配列で保持
  const allDateStrs = dates.map(toDateStr)

  /** 指定した月が折りたたまれているかどうかを返す */
  function isCollapsed(key: string) {
    return collapsedMonths.has(key)
  }

  /** 月の折りたたみ/展開をトグルする */
  function toggleMonth(key: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCollapsedMonths(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  /** 月の表示列数を返す（折りたたみ時は1列） */
  function visibleCols(m: MonthInfo) {
    return isCollapsed(m.key) ? 1 : m.dates.length
  }

  /** 年グループ全体の列数を返す */
  function yearColSpan(year: YearGroup) {
    return year.months.reduce((sum, m) => sum + visibleCols(m), 0)
  }

  // テーブルの最小幅（スクロール用）
  const tableMinWidth =
    NAME_COL_WIDTH +
    monthInfos.reduce((sum, m) => sum + visibleCols(m) * CELL_WIDTH, 0)

  // ---- ドラッグ操作 ----

  /**
   * from〜to の間にある日付文字列の配列を返す。
   * allDateStrs 内のインデックスを使って範囲を計算する。
   */
  function getDatesBetween(from: string, to: string): string[] {
    const a = allDateStrs.indexOf(from)
    const b = allDateStrs.indexOf(to)
    if (a === -1 || b === -1) return []
    const [lo, hi] = a <= b ? [a, b] : [b, a]
    return allDateStrs.slice(lo, hi + 1)
  }

  /**
   * クリックされた要素から data-gantt 属性を持つセルを探し、
   * 項目ID・行タイプ・日付文字列を返す。
   */
  function getCellInfo(el: Element | null) {
    const cell = el?.closest('[data-gantt]') as HTMLElement | null
    if (!cell) return null
    return {
      itemId: cell.dataset.itemId!,
      rowType: cell.dataset.rowType as 'plan' | 'actual',
      dateStr: cell.dataset.date!,
    }
  }

  /** マウスボタンを押したとき：ドラッグ開始 */
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const info = getCellInfo(e.target as Element)
    if (!info) return
    e.preventDefault()

    const item = items.find(i => i.id === info.itemId)
    if (!item) return
    // 現在の状態を確認：塗りつぶされていれば消去、そうでなければ塗りつぶし
    const arr = info.rowType === 'plan' ? item.planDates : item.actualDates
    const fill = !arr.includes(info.dateStr)

    drag.current = {
      itemId: info.itemId,
      rowType: info.rowType,
      fill,
      startDate: info.dateStr,
      lastDate: info.dateStr,
    }
    onToggleDates(info.itemId, info.rowType, [info.dateStr], fill)
  }

  /** マウスが別のセルに入ったとき：ドラッグ継続 */
  function handleMouseOver(e: React.MouseEvent<HTMLDivElement>) {
    if (!drag.current) return
    const info = getCellInfo(e.target as Element)
    if (!info) return
    // 別の項目・行には塗らない
    if (info.itemId !== drag.current.itemId || info.rowType !== drag.current.rowType) return
    // 同じセルでは何もしない
    if (info.dateStr === drag.current.lastDate) return

    // 前回の範囲と今回の範囲を比較して差分だけ更新する
    const prevSet = new Set(getDatesBetween(drag.current.startDate, drag.current.lastDate))
    const nextSet = new Set(getDatesBetween(drag.current.startDate, info.dateStr))

    const toApply = [...nextSet].filter(d => !prevSet.has(d)) // 新たに追加する日付
    const toUndo = [...prevSet].filter(d => !nextSet.has(d))  // 元に戻す日付

    if (toApply.length) onToggleDates(info.itemId, info.rowType, toApply, drag.current.fill)
    if (toUndo.length) onToggleDates(info.itemId, info.rowType, toUndo, !drag.current.fill)
    drag.current.lastDate = info.dateStr
  }

  // マウスボタンを離したときにドラッグを終了する
  useEffect(() => {
    const stop = () => { drag.current = null }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  // ---- 項目名編集 ----

  /** 項目名の編集を開始する */
  function startEdit(item: GanttItem, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(item.id)
    setEditValue(item.name)
  }

  /** 項目名の編集を確定する（空の場合は「項目名」に戻す） */
  function commitEdit() {
    if (!editingId) return
    onUpdateName(editingId, editValue.trim() || '項目名')
    setEditingId(null)
  }

  // ---- レンダリング ----

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
    >
      <div className="overflow-x-auto">
        <table
          className="border-collapse"
          style={{ minWidth: `${tableMinWidth}px` }}
        >
          {/* ========== ヘッダー部分 ========== */}
          <thead>

            {/* ---- 1行目: 年ラベル ---- */}
            <tr>
              {/*
                「項目」列のヘッダーセル。
                rowSpan=4 でヘッダーの全4行にわたって表示する。
              */}
              <th
                className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 align-middle"
                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                rowSpan={4}
              >
                <span className="block px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                  項目
                </span>
              </th>

              {/* 年ラベルセル（年をまたぐ場合は複数表示される） */}
              {yearGroups.map(year => (
                <th
                  key={year.label}
                  colSpan={yearColSpan(year)}
                  className="bg-indigo-950 border-b border-r border-indigo-800 text-center text-xs font-bold text-indigo-200 px-2 py-1.5 whitespace-nowrap"
                >
                  {year.label}
                </th>
              ))}
            </tr>

            {/* ---- 2行目: 月ラベル（折りたたみトグル付き） ---- */}
            <tr>
              {monthInfos.map(m => {
                const collapsed = isCollapsed(m.key)
                return collapsed ? (
                  /*
                    折りたたみ中: rowSpan=3 で月・曜日・日付の3行を占有し、
                    幅を COLLAPSED_CELL_WIDTH に縮小して月名を縦書きで表示する。
                  */
                  <th
                    key={m.key}
                    colSpan={1}
                    rowSpan={3}
                    style={{ width: COLLAPSED_CELL_WIDTH, minWidth: COLLAPSED_CELL_WIDTH }}
                    className="border-b border-r border-gray-200 bg-gray-100 text-center align-middle p-0 cursor-pointer hover:bg-indigo-50 transition-colors"
                    onClick={e => toggleMonth(m.key, e)}
                    onMouseDown={e => e.stopPropagation()}
                    title={`${m.monthLabel} を展開`}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5 py-1 h-full">
                      <span
                        className="text-gray-500 font-semibold"
                        style={{ fontSize: 10, writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      >
                        {m.monthLabel}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    </div>
                  </th>
                ) : (
                  /* 展開中: 通常の月ヘッダー。折りたたみボタンを表示する。 */
                  <th
                    key={m.key}
                    colSpan={m.dates.length}
                    rowSpan={1}
                    className="bg-gray-50 border-b border-r border-gray-200 text-center text-xs font-semibold text-gray-700 px-1 py-1.5 whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{m.monthLabel}</span>
                      <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => toggleMonth(m.key, e)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title={`${m.monthLabel} を折りたたむ`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                )
              })}
            </tr>

            {/* ---- 3行目: 曜日（展開中の月のみ） ---- */}
            <tr>
              {monthInfos.flatMap(m => {
                if (isCollapsed(m.key)) return [] // 折りたたみ中は rowSpan=3 で対応済み
                return m.dates.map(date => {
                  const wknd = isWeekend(date)
                  const tdy = isToday(date)
                  return (
                    <th
                      key={toDateStr(date)}
                      style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                      className={`border-b border-r border-gray-200 text-center text-xs font-medium py-1 ${
                        tdy
                          ? 'bg-indigo-600 text-white'     // 今日: 青背景
                          : wknd
                          ? 'bg-red-50 text-red-400'       // 土日: 薄赤
                          : 'bg-gray-50 text-gray-500'     // 平日: グレー
                      }`}
                    >
                      {format(date, 'E', { locale: ja })}
                    </th>
                  )
                })
              })}
            </tr>

            {/* ---- 4行目: 日付（展開中の月のみ） ---- */}
            <tr>
              {monthInfos.flatMap(m => {
                if (isCollapsed(m.key)) return [] // 折りたたみ中は rowSpan=3 で対応済み
                return m.dates.map(date => {
                  const wknd = isWeekend(date)
                  const tdy = isToday(date)
                  return (
                    <th
                      key={toDateStr(date)}
                      className={`border-b border-r border-gray-200 text-center text-xs font-medium py-1 ${
                        tdy
                          ? 'bg-indigo-600 text-white'
                          : wknd
                          ? 'bg-red-50 text-red-400'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {format(date, 'd')}
                    </th>
                  )
                })
              })}
            </tr>
          </thead>

          {/* ========== ボディ部分 ========== */}
          <tbody>
            {items.length === 0 ? (
              /* 項目がない場合のメッセージ */
              <tr>
                <td
                  colSpan={monthInfos.reduce((s, m) => s + visibleCols(m), 0) + 1}
                  className="text-center py-20 text-gray-400 text-sm"
                >
                  項目がありません。「項目を追加」ボタンから追加してください。
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isLast = idx === items.length - 1
                return (
                  <Fragment key={item.id}>

                    {/* ---- 計画行（上の行） ---- */}
                    <tr className="group/item">
                      {/*
                        項目名セル。
                        rowSpan=2 で計画行・実績行の両方に渡って表示する。
                      */}
                      <td
                        className="sticky left-0 z-10 bg-white border-r border-gray-200 p-0"
                        rowSpan={2}
                        style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                      >
                        {/* 項目名エリア（クリックで編集モードに切り替わる） */}
                        <div className="flex items-center gap-1 px-3 py-1.5 min-h-[32px]">
                          {editingId === item.id ? (
                            /* 編集中: テキスト入力フォームを表示 */
                            <div
                              className="flex items-center gap-1 w-full"
                              onMouseDown={e => e.stopPropagation()}
                            >
                              <input
                                autoFocus
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && commitEdit()}
                                onBlur={commitEdit}
                                className="flex-1 min-w-0 text-sm border border-indigo-300 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                              <button
                                onMouseDown={e => { e.stopPropagation(); commitEdit() }}
                                className="text-emerald-500 hover:text-emerald-600 flex-shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            /* 通常表示: 項目名とホバー時に編集・削除ボタンを表示 */
                            <>
                              <span
                                className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate"
                                title={item.name}
                              >
                                {item.name}
                              </span>
                              <div
                                className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                onMouseDown={e => e.stopPropagation()}
                              >
                                {/* 編集ボタン */}
                                <button
                                  onClick={e => startEdit(item, e)}
                                  className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {/* 削除ボタン */}
                                <button
                                  onClick={e => { e.stopPropagation(); onRemoveItem(item.id) }}
                                  className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* 「計画」「実績」のラベル（項目名セルの下半分） */}
                        <div className="flex border-t border-gray-100" style={{ height: 44 }}>
                          <div className="flex-1 flex items-center justify-center bg-indigo-50 text-indigo-600 text-xs font-semibold border-r border-gray-100 tracking-wide">
                            計画
                          </div>
                          <div className="flex-1 flex items-center justify-center bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-wide">
                            実績
                          </div>
                        </div>
                      </td>

                      {/* 計画日付セル（月ごとにレンダリング） */}
                      {monthInfos.flatMap(m => {
                        if (isCollapsed(m.key)) {
                          // 折りたたみ中: 空のセルで列幅を確保
                          return [(
                            <td
                              key={`${item.id}-${m.key}-plan`}
                              style={{ width: COLLAPSED_CELL_WIDTH, height: 22 }}
                              className="border-r border-gray-200 bg-gray-50"
                            />
                          )]
                        }
                        return m.dates.map(date => {
                          const dateStr = toDateStr(date)
                          const filled = item.planDates.includes(dateStr) // 計画日かどうか
                          const wknd = isWeekend(date)
                          const tdy = isToday(date)
                          return (
                            <td
                              key={dateStr}
                              // data-gantt 属性はドラッグ処理で使用する
                              data-gantt="true"
                              data-item-id={item.id}
                              data-row-type="plan"
                              data-date={dateStr}
                              style={{ height: 22, cursor: 'crosshair' }}
                              className={`border-r border-gray-100 transition-colors ${
                                filled
                                  ? 'bg-indigo-500'                      // 計画あり: 青
                                  : tdy
                                  ? 'bg-indigo-50 hover:bg-indigo-200'  // 今日: 薄青
                                  : wknd
                                  ? 'bg-gray-50 hover:bg-indigo-100'    // 土日: グレー
                                  : 'hover:bg-indigo-100'               // 平日: ホバー時薄青
                              }`}
                            />
                          )
                        })
                      })}
                    </tr>

                    {/* ---- 実績行（下の行） ---- */}
                    <tr className={!isLast ? 'border-b-2 border-gray-200' : ''}>
                      {/* 実績日付セル（月ごとにレンダリング） */}
                      {monthInfos.flatMap(m => {
                        if (isCollapsed(m.key)) {
                          // 折りたたみ中: 空のセルで列幅を確保
                          return [(
                            <td
                              key={`${item.id}-${m.key}-actual`}
                              style={{ width: COLLAPSED_CELL_WIDTH, height: 22 }}
                              className="border-r border-gray-200 bg-gray-50"
                            />
                          )]
                        }
                        return m.dates.map(date => {
                          const dateStr = toDateStr(date)
                          const filled = item.actualDates.includes(dateStr) // 実績日かどうか
                          const wknd = isWeekend(date)
                          const tdy = isToday(date)
                          return (
                            <td
                              key={dateStr}
                              data-gantt="true"
                              data-item-id={item.id}
                              data-row-type="actual"
                              data-date={dateStr}
                              style={{ height: 22, cursor: 'crosshair' }}
                              className={`border-r border-gray-100 transition-colors ${
                                filled
                                  ? 'bg-emerald-500'                       // 実績あり: 緑
                                  : tdy
                                  ? 'bg-emerald-50 hover:bg-emerald-200'  // 今日: 薄緑
                                  : wknd
                                  ? 'bg-gray-50 hover:bg-emerald-100'     // 土日: グレー
                                  : 'hover:bg-emerald-100'                // 平日: ホバー時薄緑
                              }`}
                            />
                          )
                        })
                      })}
                    </tr>

                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

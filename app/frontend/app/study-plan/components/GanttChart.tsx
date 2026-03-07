'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { format, isToday, isWeekend } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Check, Pencil, Trash2 } from 'lucide-react'
import type { GanttItem } from '../page'

type Props = {
  items: GanttItem[]
  dates: Date[]
  onToggleDates: (itemId: string, rowType: 'plan' | 'actual', dates: string[], fill: boolean) => void
  onUpdateName: (id: string, name: string) => void
  onRemoveItem: (id: string) => void
}

type DragState = {
  itemId: string
  rowType: 'plan' | 'actual'
  fill: boolean       // true = filling cells, false = clearing cells
  startDate: string
  lastDate: string
}

const NAME_COL_WIDTH = 210
const CELL_WIDTH = 30

function toDateStr(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function buildMonthGroups(dates: Date[]): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = []
  for (const date of dates) {
    const label = format(date, 'yyyy年M月', { locale: ja })
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.span++
    } else {
      groups.push({ label, span: 1 })
    }
  }
  return groups
}

export default function GanttChart({
  items,
  dates,
  onToggleDates,
  onUpdateName,
  onRemoveItem,
}: Props) {
  const drag = useRef<DragState | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const monthGroups = buildMonthGroups(dates)
  const allDateStrs = dates.map(toDateStr)

  // ------ drag helpers ------
  function getDatesBetween(from: string, to: string): string[] {
    const a = allDateStrs.indexOf(from)
    const b = allDateStrs.indexOf(to)
    if (a === -1 || b === -1) return []
    const [lo, hi] = a <= b ? [a, b] : [b, a]
    return allDateStrs.slice(lo, hi + 1)
  }

  function getCellInfo(el: Element | null) {
    const cell = el?.closest('[data-gantt]') as HTMLElement | null
    if (!cell) return null
    return {
      itemId: cell.dataset.itemId!,
      rowType: cell.dataset.rowType as 'plan' | 'actual',
      dateStr: cell.dataset.date!,
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const info = getCellInfo(e.target as Element)
    if (!info) return
    e.preventDefault()

    const item = items.find(i => i.id === info.itemId)
    if (!item) return
    const dates_arr = info.rowType === 'plan' ? item.planDates : item.actualDates
    const fill = !dates_arr.includes(info.dateStr)

    drag.current = {
      itemId: info.itemId,
      rowType: info.rowType,
      fill,
      startDate: info.dateStr,
      lastDate: info.dateStr,
    }
    onToggleDates(info.itemId, info.rowType, [info.dateStr], fill)
  }

  function handleMouseOver(e: React.MouseEvent<HTMLDivElement>) {
    if (!drag.current) return
    const info = getCellInfo(e.target as Element)
    if (!info) return
    if (info.itemId !== drag.current.itemId || info.rowType !== drag.current.rowType) return
    if (info.dateStr === drag.current.lastDate) return

    const prevSet = new Set(getDatesBetween(drag.current.startDate, drag.current.lastDate))
    const nextSet = new Set(getDatesBetween(drag.current.startDate, info.dateStr))

    const toApply = [...nextSet].filter(d => !prevSet.has(d))
    const toUndo = [...prevSet].filter(d => !nextSet.has(d))

    if (toApply.length) onToggleDates(info.itemId, info.rowType, toApply, drag.current.fill)
    if (toUndo.length) onToggleDates(info.itemId, info.rowType, toUndo, !drag.current.fill)
    drag.current.lastDate = info.dateStr
  }

  useEffect(() => {
    const stop = () => { drag.current = null }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  // ------ edit helpers ------
  function startEdit(item: GanttItem, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingId(item.id)
    setEditValue(item.name)
  }

  function commitEdit() {
    if (!editingId) return
    onUpdateName(editingId, editValue.trim() || '項目名')
    setEditingId(null)
  }

  // ------ render ------
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
    >
      <div className="overflow-x-auto">
        <table
          className="border-collapse"
          style={{ minWidth: `${NAME_COL_WIDTH + dates.length * CELL_WIDTH}px` }}
        >
          {/* ========== HEADER ========== */}
          <thead>
            {/* Month row */}
            <tr>
              <th
                className="sticky left-0 z-20 bg-gray-50 border-b border-r border-gray-200 align-middle"
                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                rowSpan={3}
              >
                <span className="block px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                  項目
                </span>
              </th>
              {monthGroups.map(g => (
                <th
                  key={g.label}
                  colSpan={g.span}
                  className="bg-gray-50 border-b border-r border-gray-200 text-center text-xs font-semibold text-gray-700 px-2 py-2 whitespace-nowrap"
                >
                  {g.label}
                </th>
              ))}
            </tr>

            {/* Day-of-week row */}
            <tr>
              {dates.map(date => {
                const wknd = isWeekend(date)
                const tdy = isToday(date)
                return (
                  <th
                    key={toDateStr(date)}
                    style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                    className={`border-b border-r border-gray-200 text-center text-xs font-medium py-1 ${
                      tdy
                        ? 'bg-indigo-600 text-white'
                        : wknd
                        ? 'bg-red-50 text-red-400'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {format(date, 'E', { locale: ja })}
                  </th>
                )
              })}
            </tr>

            {/* Date-number row */}
            <tr>
              {dates.map(date => {
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
              })}
            </tr>
          </thead>

          {/* ========== BODY ========== */}
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={dates.length + 1}
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
                    {/* ---- Plan row ---- */}
                    <tr className="group/item">
                      {/* Sticky name cell (rowspan 2) */}
                      <td
                        className="sticky left-0 z-10 bg-white border-r border-gray-200 p-0"
                        rowSpan={2}
                        style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                      >
                        {/* Name area */}
                        <div className="flex items-center gap-1 px-3 py-1.5 min-h-[32px]">
                          {editingId === item.id ? (
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
                                <button
                                  onClick={e => startEdit(item, e)}
                                  className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
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

                        {/* Plan / Actual labels */}
                        <div className="flex border-t border-gray-100" style={{ height: 44 }}>
                          <div className="flex-1 flex items-center justify-center bg-indigo-50 text-indigo-600 text-xs font-semibold border-r border-gray-100 tracking-wide">
                            計画
                          </div>
                          <div className="flex-1 flex items-center justify-center bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-wide">
                            実績
                          </div>
                        </div>
                      </td>

                      {/* Plan date cells */}
                      {dates.map(date => {
                        const dateStr = toDateStr(date)
                        const filled = item.planDates.includes(dateStr)
                        const wknd = isWeekend(date)
                        const tdy = isToday(date)
                        return (
                          <td
                            key={dateStr}
                            data-gantt="true"
                            data-item-id={item.id}
                            data-row-type="plan"
                            data-date={dateStr}
                            style={{ height: 22, cursor: 'crosshair' }}
                            className={`border-r border-gray-100 transition-colors ${
                              filled
                                ? 'bg-indigo-500'
                                : tdy
                                ? 'bg-indigo-50 hover:bg-indigo-200'
                                : wknd
                                ? 'bg-gray-50 hover:bg-indigo-100'
                                : 'hover:bg-indigo-100'
                            }`}
                          />
                        )
                      })}
                    </tr>

                    {/* ---- Actual row ---- */}
                    <tr className={!isLast ? 'border-b-2 border-gray-200' : ''}>
                      {/* Actual date cells */}
                      {dates.map(date => {
                        const dateStr = toDateStr(date)
                        const filled = item.actualDates.includes(dateStr)
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
                                ? 'bg-emerald-500'
                                : tdy
                                ? 'bg-emerald-50 hover:bg-emerald-200'
                                : wknd
                                ? 'bg-gray-50 hover:bg-emerald-100'
                                : 'hover:bg-emerald-100'
                            }`}
                          />
                        )
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

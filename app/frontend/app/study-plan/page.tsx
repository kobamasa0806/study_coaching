'use client'

import { useState, useEffect } from 'react'
import { addDays, startOfWeek, format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import Navbar from '../components/Navbar'
import GanttChart from './components/GanttChart'

export type GanttItem = {
  id: string
  name: string
  planDates: string[]
  actualDates: string[]
}

const WEEKS_TO_SHOW = 8
const STORAGE_KEY = 'studycoach-gantt-v1'

let _idSeq = 0
function generateId(): string {
  return `${Date.now()}-${++_idSeq}`
}

function getDefaultItems(): GanttItem[] {
  return [
    { id: generateId(), name: '第1章 基礎知識', planDates: [], actualDates: [] },
    { id: generateId(), name: '第2章 重要概念', planDates: [], actualDates: [] },
    { id: generateId(), name: '第3章 応用理論', planDates: [], actualDates: [] },
    { id: generateId(), name: '過去問演習', planDates: [], actualDates: [] },
    { id: generateId(), name: '模擬試験・総復習', planDates: [], actualDates: [] },
  ]
}

function getDisplayDates(start: Date, weeks: number): Date[] {
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
}

export default function StudyPlanPage() {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<GanttItem[]>([])
  const [viewStart, setViewStart] = useState<Date>(new Date())

  useEffect(() => {
    setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed: GanttItem[] = JSON.parse(saved)
        setItems(parsed.length > 0 ? parsed : getDefaultItems())
      } catch {
        setItems(getDefaultItems())
      }
    } else {
      setItems(getDefaultItems())
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, mounted])

  const dates = getDisplayDates(viewStart, WEEKS_TO_SHOW)

  function addItem() {
    setItems(prev => [
      ...prev,
      { id: generateId(), name: '新しい項目', planDates: [], actualDates: [] },
    ])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItemName(id: string, name: string) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, name } : i)))
  }

  function toggleDates(
    itemId: string,
    rowType: 'plan' | 'actual',
    datesToToggle: string[],
    fill: boolean,
  ) {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item
        const field = rowType === 'plan' ? 'planDates' : 'actualDates'
        const current = new Set(item[field])
        datesToToggle.forEach(d => (fill ? current.add(d) : current.delete(d)))
        return { ...item, [field]: Array.from(current) }
      }),
    )
  }

  if (!mounted) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 pt-16" />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="px-4 sm:px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">学習計画</h1>
              <p className="text-gray-500 text-sm mt-1">
                セルをクリック・ドラッグして計画（青）と実績（緑）を記録できます
              </p>
            </div>
            <button
              onClick={addItem}
              className="self-start sm:self-auto inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              項目を追加
            </button>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Navigation */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setViewStart(d => addDays(d, -7))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="前の週"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
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

            {/* Date range label */}
            <span className="text-sm text-gray-500 font-medium">
              {format(viewStart, 'yyyy年M月d日', { locale: ja })}
              {' 〜 '}
              {format(addDays(viewStart, WEEKS_TO_SHOW * 7 - 1), 'M月d日', { locale: ja })}
            </span>

            {/* Legend */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-indigo-500" />
                <span className="text-xs text-gray-600 font-medium">計画</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span className="text-xs text-gray-600 font-medium">実績</span>
              </div>
            </div>
          </div>

          {/* Gantt Chart */}
          <GanttChart
            items={items}
            dates={dates}
            onToggleDates={toggleDates}
            onUpdateName={updateItemName}
            onRemoveItem={removeItem}
          />

          <p className="text-xs text-gray-400 mt-3 text-right">変更は自動保存されます</p>
        </div>
      </div>
    </>
  )
}

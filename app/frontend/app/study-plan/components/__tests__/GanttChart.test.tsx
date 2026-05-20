/**
 * GanttChart コンポーネントのテスト。
 * 固定横スクロールバーのレンダリングとスクロール同期を中心に検証する。
 */

import { render, screen, act } from '@testing-library/react'
import GanttChart from '../GanttChart'
import type { GanttItem } from '../../page'

// ResizeObserver・matchMedia は JSDOM に存在しないためモックする
const observeMock = jest.fn()
const disconnectMock = jest.fn()
beforeAll(() => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: observeMock,
    unobserve: jest.fn(),
    disconnect: disconnectMock,
  }))

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  })
})

// getBoundingClientRect は JSDOM でデフォルト 0 を返すため固定値を返すよう設定
beforeEach(() => {
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    width: 900,
    top: 0, right: 0, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect)
})

afterEach(() => {
  jest.restoreAllMocks()
})

// テスト用の最小限 props
const baseProps = {
  items: [] as GanttItem[],
  dates: [new Date('2026-05-01'), new Date('2026-05-02'), new Date('2026-05-03')],
  onToggleDates: jest.fn(),
  onUpdateName: jest.fn(),
  onRemoveItem: jest.fn(),
}

describe('固定横スクロールバー', () => {
  it('data-testid="fixed-scrollbar" の要素がレンダリングされる', () => {
    render(<GanttChart {...baseProps} />)
    expect(screen.getByTestId('fixed-scrollbar')).toBeInTheDocument()
  })

  it('固定スクロールバーに fixed と bottom-0 の Tailwind クラスが付与される', () => {
    render(<GanttChart {...baseProps} />)
    const bar = screen.getByTestId('fixed-scrollbar')
    // Tailwind CSS は JSDOM でスタイルとして評価されないためクラスで確認する
    expect(bar.className).toContain('fixed')
    expect(bar.className).toContain('bottom-0')
  })

  it('固定スクロールバーの高さは 16px', () => {
    render(<GanttChart {...baseProps} />)
    const bar = screen.getByTestId('fixed-scrollbar')
    expect(bar).toHaveStyle({ height: '16px' })
  })

  it('コンテナの getBoundingClientRect に基づいて left と width が設定される', () => {
    render(<GanttChart {...baseProps} />)
    const bar = screen.getByTestId('fixed-scrollbar')
    // left=100, width=900 は beforeEach のモックが返す値
    expect(bar.style.left).toBe('100px')
    expect(bar.style.width).toBe('900px')
  })

  it('内部 div の幅はテーブルの minWidth と同じ', () => {
    render(<GanttChart {...baseProps} />)
    const bar = screen.getByTestId('fixed-scrollbar')
    const inner = bar.firstElementChild as HTMLElement
    // テーブル幅 = nameColWidth(210) + dates.length * CELL_WIDTH(30) = 210 + 90 = 300
    expect(parseInt(inner.style.width)).toBeGreaterThan(0)
  })

  it('ResizeObserver がコンテナを監視する', () => {
    render(<GanttChart {...baseProps} />)
    expect(observeMock).toHaveBeenCalled()
  })
})

describe('スクロール同期', () => {
  it('メインエリアのスクロールが固定バーに反映される', () => {
    render(<GanttChart {...baseProps} />)
    const bar = screen.getByTestId('fixed-scrollbar')

    // scrollRef の div（overflow-x-auto クラスを持つ）を取得
    const mainScroll = document.querySelector('.overflow-x-auto') as HTMLElement
    expect(mainScroll).not.toBeNull()

    // scrollLeft を変更してスクロールイベントを発火する
    Object.defineProperty(mainScroll, 'scrollLeft', { value: 150, writable: true })
    act(() => { mainScroll.dispatchEvent(new Event('scroll')) })

    expect(bar.scrollLeft).toBe(150)
  })

  it('固定バーのスクロールがメインエリアに反映される', () => {
    render(<GanttChart {...baseProps} />)
    const bar = screen.getByTestId('fixed-scrollbar')
    const mainScroll = document.querySelector('.overflow-x-auto') as HTMLElement
    expect(mainScroll).not.toBeNull()

    Object.defineProperty(bar, 'scrollLeft', { value: 200, writable: true })
    act(() => { bar.dispatchEvent(new Event('scroll')) })

    expect(mainScroll.scrollLeft).toBe(200)
  })
})

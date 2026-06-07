import { BarChart3, CalendarDays, MessageCircle, PenLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Feature = {
  icon: LucideIcon
  color: string
  title: string
  description: string
  badge: string
  badgeColor: string
  // 準備中（未提供）の機能は true にするとグレーアウト表示になる
  comingSoon?: boolean
}

const features: Feature[] = [
  {
    icon: CalendarDays,
    color: 'bg-sky-100 text-sky-600',
    title: 'ガントチャートで計画作成',
    description:
      '試験日から逆算して科目ごとの学習スケジュールをガントチャートで作成。まるでプロジェクトを立ち上げるように、合格への道筋を可視化します。',
    badge: '計画',
    badgeColor: 'bg-sky-100 text-sky-600',
  },
  {
    icon: PenLine,
    color: 'bg-cyan-100 text-cyan-600',
    title: '学習実績の記録',
    description:
      '毎日の学習時間・内容を記録し、計画と実績を比較。プロジェクトの進捗管理と同じ感覚で、遅れや前倒しをリアルタイムに把握できます。',
    badge: '記録',
    badgeColor: 'bg-cyan-100 text-cyan-600',
  },
  {
    icon: BarChart3,
    color: 'bg-sky-100 text-sky-500',
    title: '進捗・差異の分析',
    description:
      '計画対比の進捗率・弱点科目・学習パターンを自動分析。データをもとにリスクを早期発見し、合格に向けた意思決定を支援します。',
    badge: '分析',
    badgeColor: 'bg-sky-100 text-sky-500',
  },
  {
    icon: MessageCircle,
    color: 'bg-green-100 text-green-600',
    title: 'マネージャーとの定期レビュー',
    description:
      'プロのマネージャーが学習データをもとに定期的な1on1を実施。プロジェクトのステークホルダーのように、計画の見直しと軌道修正を一緒に行います。',
    badge: '1on1',
    badgeColor: 'bg-green-100 text-green-600',
    comingSoon: true,
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-sky-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-sky-500 text-sm font-semibold uppercase tracking-wider mb-3">
            サービス機能
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            資格取得をプロジェクトとして管理する
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            計画・実績・分析・マネージャーの4つが揃って、
            はじめてプロジェクトは成功します。
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-sky-100 transition-all group ${
                  feature.comingSoon
                    ? 'opacity-60 grayscale'
                    : 'hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      feature.comingSoon ? 'bg-gray-100 text-gray-400' : feature.color
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      feature.comingSoon ? 'bg-gray-200 text-gray-500' : feature.badgeColor
                    }`}
                  >
                    {feature.comingSoon ? '準備中' : feature.badge}
                  </span>
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

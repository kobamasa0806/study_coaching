import { BarChart3, CalendarDays, MessageCircle, PenLine } from 'lucide-react'

const features = [
  {
    icon: CalendarDays,
    color: 'bg-indigo-100 text-indigo-600',
    title: '学習計画の作成',
    description:
      'ガントチャートで試験日から逆算した最適な学習計画を直感的に作成。科目ごとのスケジュールを一目で把握できます。',
    badge: '計画',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: PenLine,
    color: 'bg-emerald-100 text-emerald-600',
    title: '学習記録',
    description:
      '毎日の学習時間・内容を手軽に記録。積み上げた時間と達成した項目を可視化し、モチベーションを維持します。',
    badge: '記録',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: BarChart3,
    color: 'bg-amber-100 text-amber-600',
    title: '進捗分析',
    description:
      '学習データをもとに進捗率・弱点科目・学習パターンを自動分析。データドリブンで効率的な学習を実現します。',
    badge: '分析',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: MessageCircle,
    color: 'bg-rose-100 text-rose-600',
    title: '1on1コーチング',
    description:
      'プロのコーチが計画・記録データをもとに定期的な1on1を実施。悩みや詰まりを一緒に解決し合格まで伴走します。',
    badge: '1on1',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
]

export default function Features() {
  return (
    <section id="features" className="bg-gray-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-indigo-600 text-sm font-semibold uppercase tracking-wider mb-3">
            サービス機能
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            合格に必要なすべてが、ここに。
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            学習の計画から記録・分析・コーチングまで、
            一貫してサポートする4つの機能を提供します。
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                    {feature.badge}
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

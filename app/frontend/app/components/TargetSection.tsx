import { AlertCircle, Clock, TrendingUp } from 'lucide-react'

const targets = [
  {
    icon: Clock,
    color: 'text-rose-500 bg-rose-50',
    title: '仕事で時間が取れない社会人',
    description: '忙しい中でも「いつ・何を・どれだけやるか」を明確にすることが重要です。ガントチャートで限られた時間を最大限に活用できます。',
  },
  {
    icon: AlertCircle,
    color: 'text-pink-500 bg-pink-50',
    title: '計画倒れを繰り返している方',
    description: '計画を立てても続かないのは、進捗を見える化できていないから。計画と実績の差異をリアルタイムで確認し、軌道修正を繰り返します。',
  },
  {
    icon: TrendingUp,
    color: 'text-green-600 bg-green-50',
    title: '確実に一発合格を目指したい方',
    description: 'プロジェクトマネジメントで学習を管理し、リスクを早期発見。マネージャーのサポートで計画の遅延を防ぎ、確実な合格を目指します。',
  },
]

export default function TargetSection() {
  return (
    <section id="target" className="bg-pink-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-rose-500 text-sm font-semibold uppercase tracking-wider mb-3">
            こんな方に
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            時間のない社会人こそ、プロジェクト管理を
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            感覚で勉強するのではなく、計画・実績・分析で
            合格プロジェクトを確実に完遂しましょう。
          </p>
        </div>

        {/* Target cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {targets.map((target) => {
            const Icon = target.icon
            return (
              <div
                key={target.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-rose-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${target.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-3">{target.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{target.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

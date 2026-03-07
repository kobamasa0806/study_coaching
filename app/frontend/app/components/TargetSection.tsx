import { AlertCircle, Clock, TrendingUp } from 'lucide-react'

const targets = [
  {
    icon: AlertCircle,
    color: 'text-rose-500 bg-rose-50',
    title: '独学で行き詰まっている方',
    description: '参考書を読んでも理解が進まない、問題が解けないと感じている方。コーチが弱点を特定し、的確な学習方法を提案します。',
  },
  {
    icon: Clock,
    color: 'text-amber-500 bg-amber-50',
    title: '計画を立てても続かない方',
    description: '学習計画を作っても三日坊主になってしまう方。定期的な1on1と進捗の可視化でモチベーションを維持します。',
  },
  {
    icon: TrendingUp,
    color: 'text-indigo-500 bg-indigo-50',
    title: '確実に合格を目指したい方',
    description: '一度で合格したい、合格保証がほしい方。データに基づいたコーチングで最短・確実な合格をサポートします。',
  },
]

export default function TargetSection() {
  return (
    <section id="target" className="bg-gray-50 py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-indigo-600 text-sm font-semibold uppercase tracking-wider mb-3">
            こんな方に
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            StudyCoachが力になれます
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            独学の限界を感じているすべての受験生を、
            プロコーチが全力でサポートします。
          </p>
        </div>

        {/* Target cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {targets.map((target) => {
            const Icon = target.icon
            return (
              <div
                key={target.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
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

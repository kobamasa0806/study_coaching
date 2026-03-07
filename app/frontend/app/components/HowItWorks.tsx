import { Flag, GanttChart, Users } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Flag,
    title: '目標を設定する',
    description:
      '受験する資格・試験と受験日を登録。コーチが目標をヒアリングし、あなたに最適なプランの土台を作ります。',
    color: 'text-indigo-600 bg-indigo-50',
    lineColor: 'border-indigo-200',
  },
  {
    step: '02',
    icon: GanttChart,
    title: '学習計画を立てる',
    description:
      'ガントチャートを使って科目・週ごとの学習計画を作成。日々の学習記録と照らし合わせながら進捗を追います。',
    color: 'text-emerald-600 bg-emerald-50',
    lineColor: 'border-emerald-200',
  },
  {
    step: '03',
    icon: Users,
    title: 'コーチと一緒に進む',
    description:
      '定期的な1on1でコーチが学習データを確認しながらフィードバック。詰まったところを一緒に解決し、合格まで伴走します。',
    color: 'text-rose-600 bg-rose-50',
    lineColor: 'border-rose-200',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-indigo-600 text-sm font-semibold uppercase tracking-wider mb-3">
            使い方
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            3ステップで学習を加速
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            シンプルなフローで始められます。
            コーチがステップごとに丁寧にサポートします。
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-indigo-200 via-emerald-200 to-rose-200" />

          <div className="grid lg:grid-cols-3 gap-10">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="relative flex flex-col items-center text-center group">
                  {/* Step number + icon */}
                  <div className="relative mb-6">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${step.color} shadow-sm group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>

                  <h3 className="text-gray-900 font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

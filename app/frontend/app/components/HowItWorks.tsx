import { Flag, GanttChart, Users } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Flag,
    title: '目標（ゴール）を設定する',
    description:
      '受験資格・試験日を登録し、プロジェクトのゴールを明確にします。コーチがヒアリングを行い、合格に必要な学習量と優先度を整理します。',
    color: 'text-yellow-600 bg-yellow-50',
    lineColor: 'border-yellow-200',
  },
  {
    step: '02',
    icon: GanttChart,
    title: 'ガントチャートで計画を立てる',
    description:
      '科目・週ごとの学習スケジュールをガントチャートで作成。毎日の実績を記録して計画との差異を確認しながら、プロジェクトを着実に前進させます。',
    color: 'text-lime-600 bg-lime-50',
    lineColor: 'border-lime-200',
  },
  {
    step: '03',
    icon: Users,
    title: 'コーチと定期レビューを行う',
    description:
      '定期的な1on1でコーチが学習データを確認しフィードバック。遅延リスクを早期に察知し、計画を柔軟に修正しながら合格まで伴走します。',
    color: 'text-amber-600 bg-amber-50',
    lineColor: 'border-amber-200',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block text-yellow-600 text-sm font-semibold uppercase tracking-wider mb-3">
            使い方
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            3ステップで合格プロジェクトを動かす
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            プロジェクトマネジメントの考え方で学習を構造化。
            計画・実行・振り返りのサイクルを回し続けます。
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-yellow-200 via-lime-200 to-amber-200" />

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
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
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

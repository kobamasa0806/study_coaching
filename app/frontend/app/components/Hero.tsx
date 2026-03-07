import { ArrowRight, CheckCircle2 } from 'lucide-react'

const highlights = [
  'ガントチャートで学習計画を可視化',
  'プロコーチによる定期1on1',
  '合格までの進捗をリアルタイム管理',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-indigo-600">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              学習コーチングサービス
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              資格取得への
              <br />
              <span className="text-emerald-400">最短ルート</span>を、
              <br />
              あなただけの
              <br />
              コーチと。
            </h1>

            <p className="text-indigo-200 text-lg leading-relaxed mb-8 max-w-md">
              学習計画の作成から進捗記録、専門コーチとの1on1まで。
              あなたの合格を全力でサポートします。
            </p>

            <ul className="space-y-3 mb-10">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-indigo-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:-translate-y-0.5"
              >
                無料で始める
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all border border-white/20"
              >
                サービス詳細を見る
              </a>
            </div>
          </div>

          {/* Right: Stats Card */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 space-y-6">
              <div className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">
                実績
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '95%', label: '受験合格率' },
                  { value: '1,200+', label: '累計受講者数' },
                  { value: '4.9', label: '満足度（5点満点）' },
                  { value: '6ヶ月', label: '平均合格期間' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-5 text-center">
                    <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
                    <div className="text-indigo-200 text-xs font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="text-white/60 text-xs mb-3 font-medium">対応資格・試験（一例）</div>
                <div className="flex flex-wrap gap-2">
                  {['宅建士', 'TOEIC', '情報処理', '簿記', '医療系', '公務員試験'].map((tag) => (
                    <span
                      key={tag}
                      className="bg-indigo-400/20 text-indigo-100 text-xs font-medium px-3 py-1 rounded-full border border-indigo-400/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="#f9fafb" />
        </svg>
      </div>
    </section>
  )
}

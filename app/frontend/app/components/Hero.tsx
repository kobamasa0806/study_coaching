import { ArrowRight, CheckCircle2 } from 'lucide-react'

const highlights = [
  'ガントチャートで計画と実績を一目で管理',
  '試験日から逆算した学習スケジュールを自動作成',
  'コーチとの1on1でプロジェクトを軌道修正',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-amber-950 to-yellow-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-yellow-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-lime-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              資格取得コーチングサービス
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              資格取得は、
              <br />
              <span className="text-yellow-400">プロジェクト</span>
              <br />
              マネジメントで
              <br />
              解決する。
            </h1>

            <p className="text-yellow-100/80 text-lg leading-relaxed mb-8 max-w-md">
              社会人の資格取得は時間との戦い。
              ガントチャートで計画と実績を管理し、
              コーチと伴走することで確実に合格へ近づきます。
            </p>

            <ul className="space-y-3 mb-10">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-yellow-100/90">
                  <CheckCircle2 className="w-5 h-5 text-lime-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-yellow-400/30 hover:shadow-yellow-300/40 hover:-translate-y-0.5"
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

          {/* Right: Gantt Chart Mockup */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold text-sm">学習プロジェクト：宅建士 合格計画</div>
                <span className="text-xs bg-lime-400/20 text-lime-300 px-2 py-0.5 rounded-full border border-lime-400/30">進行中</span>
              </div>

              {/* Gantt Chart Mock */}
              <div className="space-y-3">
                {[
                  { label: '民法・権利関係', plan: 'w-2/3', actual: 'w-1/2', color: 'bg-yellow-400', actColor: 'bg-yellow-300/60' },
                  { label: '宅建業法', plan: 'w-5/6', actual: 'w-3/4', color: 'bg-lime-400', actColor: 'bg-lime-300/60' },
                  { label: '法令上の制限', plan: 'w-1/2', actual: 'w-2/5', color: 'bg-amber-400', actColor: 'bg-amber-300/60' },
                  { label: '税・その他', plan: 'w-1/3', actual: 'w-1/4', color: 'bg-yellow-500', actColor: 'bg-yellow-400/60' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-xs font-medium w-28 flex-shrink-0">{row.label}</span>
                      <div className="flex-1 ml-2 space-y-1">
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${row.color} rounded-full ${row.plan}`} />
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${row.actColor} rounded-full ${row.actual}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-white/20">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-yellow-400" />
                  <span className="text-white/60 text-xs">計画</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-yellow-300/60" />
                  <span className="text-white/60 text-xs">実績</span>
                </div>
                <div className="ml-auto text-white/80 text-xs font-semibold">
                  全体進捗 <span className="text-yellow-400 text-sm">62%</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-4">
                <div className="text-white/60 text-xs mb-3 font-medium">対応資格・試験（一例）</div>
                <div className="flex flex-wrap gap-2">
                  {['宅建士', 'TOEIC', '情報処理', '簿記', '医療系', '公務員試験'].map((tag) => (
                    <span
                      key={tag}
                      className="bg-yellow-400/20 text-yellow-200 text-xs font-medium px-3 py-1 rounded-full border border-yellow-400/20"
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
          <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="#fefce8" />
        </svg>
      </div>
    </section>
  )
}

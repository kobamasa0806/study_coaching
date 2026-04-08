import { ArrowRight, CheckCircle2 } from 'lucide-react'

const highlights = [
  'ガントチャートで計画と実績を一目で管理',
  '試験日から逆算した学習スケジュールを自動作成',
  'マネージャーとの1on1でプロジェクトを軌道修正',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-rose-100">
      {/* 桜の花びら装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-200/50 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-rose-100/60 blur-2xl" />
        {/* 花びらSVG */}
        <svg className="absolute top-20 right-1/4 w-8 h-8 text-rose-300 opacity-60 animate-bounce" style={{ animationDuration: '3s' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.8 1.3 3.7C7.5 11.5 6 13.5 6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-1.5-4.5-3.3-5.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-1.5-5-4-5z"/>
        </svg>
        <svg className="absolute top-1/3 left-16 w-6 h-6 text-pink-300 opacity-50 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.8 1.3 3.7C7.5 11.5 6 13.5 6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-1.5-4.5-3.3-5.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-1.5-5-4-5z"/>
        </svg>
        <svg className="absolute bottom-40 right-20 w-10 h-10 text-rose-200 opacity-40 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.8 1.3 3.7C7.5 11.5 6 13.5 6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-1.5-4.5-3.3-5.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-1.5-5-4-5z"/>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-32 pt-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 text-rose-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              資格取得コーチングサービス「ケンサン」
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              資格取得は、
              <br />
              <span className="text-rose-500">プロジェクト</span>
              <br />
              マネジメントで
              <br />
              解決する。
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
              社会人の資格取得は時間との戦い。
              WBSとガントチャートで計画と実績を管理し、
              マネージャーと伴走することで確実に合格へ近づきます。
            </p>

            <ul className="space-y-3 mb-10">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-rose-400 hover:bg-rose-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-all shadow-lg shadow-rose-300/40 hover:shadow-rose-400/50 hover:-translate-y-0.5"
              >
                無料で始める
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-gray-700 font-semibold px-8 py-4 rounded-xl text-base transition-all border border-rose-200 hover:border-rose-300"
              >
                サービス詳細を見る
              </a>
            </div>
          </div>

          {/* Right: Gantt Chart Mockup */}
          <div className="hidden lg:block">
            <div className="bg-white/80 backdrop-blur-md border border-rose-200 rounded-2xl p-6 space-y-4 shadow-xl shadow-rose-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-800 font-semibold text-sm">学習プロジェクト：宅建士 合格計画</div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">進行中</span>
              </div>

              {/* Gantt Chart Mock */}
              <div className="space-y-3">
                {[
                  { label: '民法・権利関係', plan: 'w-2/3', actual: 'w-1/2', color: 'bg-rose-400', actColor: 'bg-rose-300/60' },
                  { label: '宅建業法', plan: 'w-5/6', actual: 'w-3/4', color: 'bg-pink-400', actColor: 'bg-pink-300/60' },
                  { label: '法令上の制限', plan: 'w-1/2', actual: 'w-2/5', color: 'bg-rose-300', actColor: 'bg-rose-200/80' },
                  { label: '税・その他', plan: 'w-1/3', actual: 'w-1/4', color: 'bg-pink-300', actColor: 'bg-pink-200/80' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600 text-xs font-medium w-28 flex-shrink-0">{row.label}</span>
                      <div className="flex-1 ml-2 space-y-1">
                        <div className="h-2.5 bg-rose-50 rounded-full overflow-hidden border border-rose-100">
                          <div className={`h-full ${row.color} rounded-full ${row.plan}`} />
                        </div>
                        <div className="h-2.5 bg-rose-50 rounded-full overflow-hidden border border-rose-100">
                          <div className={`h-full ${row.actColor} rounded-full ${row.actual}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-rose-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-400" />
                  <span className="text-gray-500 text-xs">計画</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-300/60" />
                  <span className="text-gray-500 text-xs">実績</span>
                </div>
                <div className="ml-auto text-gray-700 text-xs font-semibold">
                  全体進捗 <span className="text-rose-500 text-sm">62%</span>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-4">
                <div className="text-gray-400 text-xs mb-3 font-medium">対応資格・試験（一例）</div>
                <div className="flex flex-wrap gap-2">
                  {['宅建士', 'TOEIC', '情報処理', '簿記', '医療系', '公務員試験'].map((tag) => (
                    <span
                      key={tag}
                      className="bg-rose-50 text-rose-500 text-xs font-medium px-3 py-1 rounded-full border border-rose-200"
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
          <path d="M0 80L1440 80L1440 40C1200 80 960 0 720 40C480 80 240 0 0 40L0 80Z" fill="#fff1f2" />
        </svg>
      </div>
    </section>
  )
}

import { ArrowRight, Gift, Sparkles } from 'lucide-react'

export default function CampaignSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500 py-20">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-pink-300/20 blur-3xl" />
        {/* 花びら装飾 */}
        <svg className="absolute top-8 left-12 w-12 h-12 text-white/20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.8 1.3 3.7C7.5 11.5 6 13.5 6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-1.5-4.5-3.3-5.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-1.5-5-4-5z"/>
        </svg>
        <svg className="absolute bottom-8 right-16 w-16 h-16 text-white/15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.8 1.3 3.7C7.5 11.5 6 13.5 6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-1.5-4.5-3.3-5.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-1.5-5-4-5z"/>
        </svg>
        <svg className="absolute top-1/2 right-1/4 w-8 h-8 text-white/10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 2.8 1.3 3.7C7.5 11.5 6 13.5 6 16c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-1.5-4.5-3.3-5.3.8-.9 1.3-2.2 1.3-3.7 0-2.5-1.5-5-4-5z"/>
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* バッジ */}
        <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white text-sm font-semibold px-4 py-2 rounded-full mb-8">
          <Gift className="w-4 h-4" />
          リリース記念 特別キャンペーン
          <Sparkles className="w-4 h-4" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
          1年間、
          <span className="underline decoration-white/60 decoration-4 underline-offset-4">完全無料</span>
          で使えます。
        </h2>

        <p className="text-white/90 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          ケンサンはリリースを記念して、<br />
          2026年8月1日〜2027年7月31日の<strong>1年間</strong>、
          全ての機能を完全無料でご利用いただけます。
        </p>

        {/* 期間カード */}
        <div className="inline-flex flex-col sm:flex-row gap-1 sm:gap-0 items-center justify-center bg-white/15 border border-white/25 rounded-2xl p-1 mb-10">
          <div className="px-8 py-4 text-center">
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">キャンペーン開始</p>
            <p className="text-white font-extrabold text-2xl">2026年8月1日</p>
          </div>
          <div className="hidden sm:block w-px h-12 bg-white/30" />
          <div className="block sm:hidden h-px w-32 bg-white/30" />
          <div className="px-8 py-4 text-center">
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">キャンペーン終了</p>
            <p className="text-white font-extrabold text-2xl">2027年7月31日</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-rose-500 font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg hover:-translate-y-0.5"
          >
            今すぐ無料登録する
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        <p className="text-white/60 text-xs mt-6">
          ※ キャンペーン期間終了後の料金については、サービスページをご確認ください
        </p>
      </div>
    </section>
  )
}

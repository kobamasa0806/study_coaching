import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="bg-gradient-to-br from-gray-900 via-rose-950 to-pink-950 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-rose-400/20 border border-rose-400/30 text-rose-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          まずは無料で体験
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
          あなたの合格プロジェクトを、
          <br />
          <span className="text-rose-400">今日からスタートしよう。</span>
        </h2>

        <p className="text-rose-100/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          WBSとガントチャートで計画を立て、実績を記録し、
          マネージャーと一緒に進捗を管理する。
          それが最短・確実な合格への道です。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-rose-400 hover:bg-rose-300 text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg shadow-rose-400/30 hover:-translate-y-0.5"
          >
            無料体験を申し込む
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-xl text-base transition-all border border-white/20"
          >
            資料をダウンロード
          </a>
        </div>

        <p className="text-rose-300/40 text-xs mt-6">
          クレジットカード不要・いつでもキャンセル可能
        </p>
      </div>
    </section>
  )
}

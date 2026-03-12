import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="bg-gradient-to-br from-indigo-950 via-indigo-800 to-indigo-600 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-emerald-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          まずは無料で体験
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
          今日から、あなたの
          <br />
          <span className="text-emerald-400">合格ストーリー</span>を始めよう。
        </h2>

        <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          無料体験セッションで、コーチとの相性や
          学習計画の立て方を実際に体験できます。
          まずは気軽にお問い合わせください。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
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

        <p className="text-indigo-300/60 text-xs mt-6">
          クレジットカード不要・いつでもキャンセル可能
        </p>
      </div>
    </section>
  )
}

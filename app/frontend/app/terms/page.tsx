import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">利用規約</h1>
        <p className="text-sm text-gray-500 mb-12">最終更新日：2025年5月20日</p>

        <div className="space-y-10 text-gray-400 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第1条（適用）</h2>
            <p>
              本規約は、ケンサン（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは本規約に同意した上で本サービスをご利用ください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第2条（利用登録）</h2>
            <p>
              登録希望者が所定の方法で申請し、開発者が承認した時点で利用登録が完了します。
              開発者は、以下の場合に登録を拒否することがあります。
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-500">
              <li>虚偽の情報を申告した場合</li>
              <li>過去に本規約に違反したことがある場合</li>
              <li>その他、開発者が不適切と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第3条（禁止事項）</h2>
            <p>ユーザーは以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-500">
              <li>法令または公序良俗に違反する行為</li>
              <li>他のユーザーまたは第三者の権利を侵害する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>不正アクセスその他の不正行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第4条（サービスの変更・停止）</h2>
            <p>
              開発者は、ユーザーへの事前通知なく本サービスの内容を変更、または提供を停止することがあります。
              これによってユーザーに生じた損害について、開発者は一切責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第5条（免責事項）</h2>
            <p>
              本サービスは現状有姿で提供されます。開発者は、本サービスに関して、完全性・正確性・有用性等について
              いかなる保証も行いません。本サービスの利用により生じた損害について、開発者は責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">第6条（お問い合わせ）</h2>
            <p>
              本規約に関するご質問は、
              <Link href="/contact" className="text-rose-400 hover:text-rose-300 underline mx-1">
                お問い合わせフォーム
              </Link>
              よりご連絡ください。
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

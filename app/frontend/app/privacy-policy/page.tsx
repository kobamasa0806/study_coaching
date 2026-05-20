import Link from 'next/link'
import { Flower2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-gray-500 mb-12">最終更新日：2025年5月20日</p>

        <div className="space-y-10 text-gray-400 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. 収集する情報</h2>
            <p>
              本サービス「ケンサン」は、サービスの提供・改善を目的として、以下の情報を収集することがあります。
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-500">
              <li>氏名・メールアドレス等の登録情報</li>
              <li>学習計画・進捗データ等の利用情報</li>
              <li>アクセスログ・デバイス情報等の技術情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. 情報の利用目的</h2>
            <p>収集した情報は以下の目的にのみ使用します。</p>
            <ul className="list-disc list-inside mt-3 space-y-1 text-gray-500">
              <li>本サービスの提供・運営・改善</li>
              <li>お問い合わせへの対応</li>
              <li>サービスに関する重要なお知らせの送信</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. 第三者への提供</h2>
            <p>
              法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. セキュリティ</h2>
            <p>
              個人情報の漏洩・紛失・改ざんを防ぐため、適切な技術的・組織的安全管理措置を講じます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. お問い合わせ</h2>
            <p>
              本ポリシーに関するご質問は、
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

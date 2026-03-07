import Link from 'next/link'
import { BookOpen } from 'lucide-react'

const footerLinks = {
  サービス: ['機能一覧', '料金プラン', '対応資格・試験', 'コーチ紹介'],
  使い方: ['はじめての方へ', '学習計画の立て方', '1on1の流れ', 'よくある質問'],
  会社情報: ['会社概要', 'プライバシーポリシー', '利用規約', 'お問い合わせ'],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              StudyCoach
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              学習計画・記録・分析・1on1コーチングで、
              あなたの合格を全力サポートします。
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} StudyCoach. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['プライバシーポリシー', '利用規約', 'お問い合わせ'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

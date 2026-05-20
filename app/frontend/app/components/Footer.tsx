import Link from 'next/link'
import { Flower2 } from 'lucide-react'

const footerLinks: Record<string, { label: string; href: string }[]> = {
  開発者情報: [
    { label: '開発者の紹介', href: '#' },
    { label: 'プライバシーポリシー', href: '/privacy-policy' },
    { label: '利用規約', href: '/terms' },
    { label: 'お問い合わせ', href: '/contact' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <Flower2 className="w-6 h-6 text-rose-400" />
              ケンサン
            </Link>
            <p className="text-sm leading-relaxed text-gray-500">
              資格取得はプロジェクトマネジメントで解決する。
              WBS・ガントチャートとマネージャーコーチングで合格を全力サポート。
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} ケンサン. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { label: 'プライバシーポリシー', href: '/privacy-policy' },
              { label: '利用規約', href: '/terms' },
              { label: 'お問い合わせ', href: '/contact' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

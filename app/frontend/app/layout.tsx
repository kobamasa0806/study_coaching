import './globals.css'
import type { Metadata } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'StudyCoach | 資格・試験合格のための学習コーチング',
  description: '学習計画の作成から進捗記録、専門コーチとの1on1まで。あなたの合格を全力でサポートする学習コーチングサービス。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable} font-noto antialiased`}>
        {children}
      </body>
    </html>
  )
}

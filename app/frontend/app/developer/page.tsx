import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { GraduationCap, Award, Briefcase, Code2, Heart, User } from 'lucide-react'

const certifications = [
  { date: '2018年6月', name: '応用情報技術者試験' },
  { date: '2022年3月', name: 'G検定' },
  { date: '2022年10月', name: '統計検定2級' },
  { date: '2024年9月', name: 'E資格' },
  { date: '2024年11月', name: 'Microsoft Certified: Azure Fundamentals' },
  { date: '2024年12月', name: 'Python 3 エンジニア認定基礎試験' },
  { date: '2024年12月', name: 'Python3エンジニア認定データ分析実践試験' },
]

const education = [
  {
    period: '2014年4月 — 2018年3月',
    degree: '東北大学 工学部 機械知能航空工学科 卒業',
  },
  {
    period: '2018年9月 — 2021年3月',
    degree: '東京大学大学院 工学系研究科 精密工学専攻 修了',
  },
]

export default function DeveloperPage() {
  return (
    <div className="min-h-screen bg-sky-50 text-gray-800">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* ヒーローセクション */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 text-white text-4xl font-bold mb-6 shadow-lg shadow-sky-300/40">
            ま
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-900 mb-2">まさふみ</h1>
          <p className="text-sky-500 text-sm font-medium tracking-wide">Developer of ケンサン</p>
        </div>

        <div className="space-y-8">

          {/* プロフィール（職業・得意技術・学歴・取得資格をまとめて） */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-sky-100 shadow-sm shadow-sky-100">
            <div className="flex items-center gap-3 mb-7">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100">
                <User className="w-4 h-4 text-sky-500" />
              </div>
              <h2 className="text-lg font-bold text-sky-900">プロフィール</h2>
            </div>

            <div className="space-y-8">

              {/* 職業 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-sky-700">職業</h3>
                </div>
                <div className="bg-sky-50 rounded-xl px-4 py-3 text-sm text-gray-700">
                  大手SIer 品質管理職
                </div>
              </div>

              {/* 得意な技術 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-sky-700">得意な技術</h3>
                </div>
                <div className="bg-sky-50 rounded-xl px-4 py-3 text-sm text-gray-700">
                  Pythonを用いたデータ分析
                </div>
              </div>

              {/* 学歴 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-sky-700">学歴</h3>
                </div>
                <ol className="relative border-l-2 border-sky-200 space-y-5 pl-6">
                  {education.map((item, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[1.4rem] top-1 w-3 h-3 rounded-full bg-sky-400 ring-4 ring-sky-50" />
                      <p className="text-xs text-sky-400 font-medium mb-0.5">{item.period}</p>
                      <p className="text-sm text-gray-700 font-medium">{item.degree}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 取得資格 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-sky-700">取得資格</h3>
                  <span className="ml-auto text-xs text-sky-400 font-medium">{certifications.length} 件</span>
                </div>
                <ol className="relative border-l-2 border-sky-200 space-y-4 pl-6">
                  {certifications.map((cert, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[1.4rem] top-1.5 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-sky-50" />
                      <p className="text-xs text-sky-400 font-medium mb-0.5">{cert.date}</p>
                      <p className="text-sm text-gray-700 font-medium">{cert.name}</p>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </section>

          {/* ケンサンへの思い */}
          <section className="bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl p-6 sm:p-8 shadow-lg shadow-sky-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">「ケンサン」への思い</h2>
            </div>
            <div className="space-y-5 text-sm text-sky-50 leading-relaxed">
              <p>
                今回私は資格取得のための学習管理サービス「ケンサン」をリリースしました。
                このサービスを作った理由は2点あります。
              </p>
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white font-semibold text-xs mb-2">理由 1 — 自分専用の学習管理ツールが欲しかった</p>
                <p>
                  私が資格取得のための勉強が大好きで、サポートしてくれるようなツールを欲していたためです。
                  今まではExcelやスプレッドシートを使ってガントチャートを作り学習状況を管理していましたが、
                  専用のツールを自作することで資格取得のために最適化されたツールを実現したかったためです。
                </p>
              </div>
              <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white font-semibold text-xs mb-2">理由 2 — 資格取得をプロジェクト管理の場として捉えた</p>
                <p>
                  資格取得を目的にプロジェクト管理できる人間になりたかったからです。
                  現在、生成AIが普及して資格検定そのものの価値がぼやけてきました。
                  しかし、資格取得は自分にとって一大プロジェクトと呼べるもので、
                  その管理は職場でのプロジェクト管理と同じものです。
                  資格取得で得たプロジェクト管理能力はきっと仕事でも活かせるはずです。
                </p>
              </div>
              <p className="text-white font-semibold text-center pt-2">
                ぜひ、このツールを使って資格取得までの道のりを楽しんでください。
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}

"use client";

import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  CalendarDays,
  MousePointer2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  ChevronsLeftRight,
  RotateCcw,
  Save,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ガントチャートの使い所（ユースケース）
const useCases = [
  {
    icon: BookOpen,
    title: "専門書・技術書を読むとき",
    color: "indigo",
    examples: [
      {
        label: "目次をタスクに登録する",
        detail:
          "本の章・節を「項目」として追加し、読み進める期間を計画行に塗ります。読み終わった日を実績行に記録することで、計画とのズレをひと目で確認できます。",
      },
      {
        label: "厚い本は中見出しを細分化する",
        detail:
          "読むのに時間がかかる本は、大見出しではなく中見出し（節・サブセクション）をタスクにすると進捗の粒度が細かくなり、詰まっている箇所を早期に発見できます。",
      },
    ],
    example:
      "例）「アルゴリズムとデータ構造」→ 第1章 配列・連結リスト / 第2章 スタック・キュー / 第3章 木構造 … をそれぞれ1項目として登録",
  },
  {
    icon: GraduationCap,
    title: "資格試験の学習スケジュールを管理するとき",
    color: "rose",
    examples: [
      {
        label: "試験日から逆算してスケジュールを立てる",
        detail:
          "試験日を終点として、各科目の学習期間・過去問演習・模擬試験の時期を計画行に塗り、全体のスケジュールを把握します。",
      },
      {
        label: "実際の学習日を実績行に記録する",
        detail:
          "学習した日を実績行（緑）に塗ることで、計画（青）と実績のギャップを視覚化できます。遅れが出た場合はコーチとの1on1で軌道修正しましょう。",
      },
    ],
    example:
      "例）宅建士受験→ 民法・権利関係 / 宅建業法 / 法令上の制限 / 税・その他 / 過去問演習 / 模擬試験 を項目として登録し、試験3ヶ月前から計画を引く",
  },
];

// 操作ガイドのセクション
const guideSteps = [
  {
    id: "screen-overview",
    title: "画面の見方",
    icon: CalendarDays,
    color: "indigo",
    steps: [
      {
        label: "4行のヘッダー構造",
        detail: (
          <div className="space-y-2">
            <p className="text-gray-600 text-sm">ガントチャートの上部には4行のヘッダーが表示されます。</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { row: "1行目", content: "年（例：2026年）" },
                { row: "2行目", content: "月 — クリックで折りたたみ/展開できます" },
                { row: "3行目", content: "曜日（日〜土）" },
                { row: "4行目", content: "日付（1〜31）" },
              ].map((h) => (
                <div key={h.row} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <span className="font-semibold text-gray-700">{h.row}：</span>
                  <span className="text-gray-600">{h.content}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        label: "計画行（青）と実績行（緑）",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>各項目は上下2行で表示されます。</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex-1">
                <div className="w-5 h-5 rounded bg-indigo-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-indigo-700 text-xs">計画行（上段・青）</div>
                  <div className="text-xs text-indigo-600">これから学習する予定の日を塗ります</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex-1">
                <div className="w-5 h-5 rounded bg-emerald-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-700 text-xs">実績行（下段・緑）</div>
                  <div className="text-xs text-emerald-600">実際に学習した日を塗ります</div>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        label: "今日・土日のハイライト",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex-1">
                <div className="w-5 h-5 rounded bg-blue-400 flex-shrink-0" />
                <span className="text-xs text-blue-700">今日の列は青色でハイライト表示されます</span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-1">
                <div className="w-5 h-5 rounded bg-red-200 flex-shrink-0" />
                <span className="text-xs text-red-700">土曜・日曜は薄い赤色で表示されます</span>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "task-management",
    title: "項目の管理",
    icon: Pencil,
    color: "violet",
    steps: [
      {
        label: "項目を追加する",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>画面左上の <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-medium"><Plus className="w-3 h-3" />項目を追加</span> ボタンをクリックすると、新しい空の行が追加されます。</p>
            <p className="text-xs text-gray-500">初回アクセス時は「第1章 基礎知識」など5つのサンプル項目が自動作成されます。</p>
          </div>
        ),
      },
      {
        label: "項目名を編集する",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>左端の項目名をクリックするとインライン編集モードになります。</p>
            <div className="flex gap-2 text-xs">
              <span className="bg-gray-100 border border-gray-300 rounded px-2 py-1 font-mono">Enter</span>
              <span className="text-gray-500 self-center">または</span>
              <span className="bg-gray-100 border border-gray-300 rounded px-2 py-1">クリック外</span>
              <span className="text-gray-500 self-center">で確定</span>
            </div>
          </div>
        ),
      },
      {
        label: "項目を削除する",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>項目名の行にカーソルを合わせると、右側に <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded"><Trash2 className="w-3 h-3" />削除</span> ボタンが表示されます。クリックすると即座に削除されます（確認ダイアログなし）。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "date-input",
    title: "日付の入力方法",
    icon: MousePointer2,
    color: "emerald",
    steps: [
      {
        label: "1日だけ入力・解除する（クリック）",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>計画行または実績行の日付セルを <strong>クリック</strong> すると、塗り/消しがトグルされます。</p>
            <p className="text-xs text-gray-500">すでに塗られているセルをクリックすると消去、空のセルをクリックすると塗りつぶしになります。</p>
          </div>
        ),
      },
      {
        label: "複数日をまとめて入力する（ドラッグ）",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>セルを <strong>クリックしたまま横にドラッグ</strong> すると、ドラッグした範囲をまとめて塗りつぶし（または消去）できます。</p>
            <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
              <li>ドラッグ開始時のセルの状態（塗り/消し）に合わせて、範囲全体に同じ操作が適用されます</li>
              <li>カーソルが十字（crosshair）になっている間はドラッグ操作が有効です</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "view-navigation",
    title: "表示範囲の操作",
    icon: ChevronsLeftRight,
    color: "amber",
    steps: [
      {
        label: "前週・次週に移動する",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>画面上部の <span className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-xs"><ChevronLeft className="w-3 h-3" />前週</span> / <span className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-xs">次週<ChevronRight className="w-3 h-3" /></span> ボタンで表示開始日を7日単位で移動できます。</p>
          </div>
        ),
      },
      {
        label: "今週に戻る",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-xs"><RotateCcw className="w-3 h-3" />今日</span> ボタンをクリックすると、今週の月曜日から表示する位置に戻ります。</p>
          </div>
        ),
      },
      {
        label: "表示期間を延長する",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-0.5 text-xs"><Plus className="w-3 h-3" />月を追加</span> ボタンをクリックすると、表示範囲が翌月末まで拡張されます。長期の学習計画を立てるときに使います。</p>
            <p className="text-xs text-gray-500">デフォルトでは現在の週から8週間（56日）が表示されます。</p>
          </div>
        ),
      },
      {
        label: "月を折りたたむ/展開する",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>ヘッダーの月名（例：「5月」）をクリックすると、その月の列を折りたたんで表示を圧縮できます。終わった月を折りたたんで先の計画に集中するときに便利です。</p>
            <p className="text-xs text-gray-500">折りたたんだ月は縦書きの月名で表示されます。再度クリックで展開できます。</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "auto-save",
    title: "自動保存",
    icon: Save,
    color: "gray",
    steps: [
      {
        label: "変更は自動保存されます",
        detail: (
          <div className="space-y-2 text-sm text-gray-600">
            <p>項目の追加・削除・名前の変更・日付の塗り替えは、操作後 <strong>約0.8秒</strong> で自動的にサーバーへ保存されます。明示的に「保存」ボタンを押す必要はありません。</p>
            <p className="text-xs text-gray-500">ネットワークエラーなどでサーバー保存に失敗した場合は、ブラウザのローカルストレージに一時保存されます。</p>
          </div>
        ),
      },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; iconBg: string; iconText: string; badge: string }> = {
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
    badge: "bg-indigo-600",
  },
  rose: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    badge: "bg-rose-500",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
    badge: "bg-violet-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    badge: "bg-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    badge: "bg-amber-500",
  },
  gray: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconBg: "bg-gray-100",
    iconText: "text-gray-600",
    badge: "bg-gray-600",
  },
};

export default function GanttGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* ページタイトル */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium mb-2">
            <Link href="/" className="hover:underline">ホーム</Link>
            <span className="text-gray-400">/</span>
            <span>ガントチャート 使い方ガイド</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">ガントチャート 使い方ガイド</h1>
          <p className="text-gray-500 text-sm">学習計画の立て方から日々の記録まで、ガントチャートの使い方をまとめました。</p>
        </div>

        {/* ────────────────────────────────────────────────
            セクション1: ガントチャートの使い所
        ──────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            ガントチャートの使い所
          </h2>

          <div className="space-y-5">
            {useCases.map((uc, idx) => {
              const Icon = uc.icon;
              const c = colorMap[uc.color];
              return (
                <div key={idx} className={`rounded-2xl border ${c.border} ${c.bg} p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${c.iconText}`} />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">{uc.title}</h3>
                  </div>

                  <div className="space-y-3 mb-3">
                    {uc.examples.map((ex, i) => (
                      <div key={i} className="flex gap-3">
                        <span className={`mt-0.5 w-5 h-5 rounded-full ${c.badge} text-white text-xs flex items-center justify-center flex-shrink-0 font-bold`}>
                          {i + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-0.5">{ex.label}</div>
                          <div className="text-sm text-gray-600 leading-relaxed">{ex.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`rounded-lg border ${c.border} bg-white/70 px-4 py-2.5 text-xs text-gray-500 leading-relaxed`}>
                    {uc.example}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ────────────────────────────────────────────────
            セクション2: 操作ガイド
        ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            操作ガイド
          </h2>

          <div className="space-y-6">
            {guideSteps.map((section) => {
              const Icon = section.icon;
              const c = colorMap[section.color];
              return (
                <div key={section.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* セクションヘッダー */}
                  <div className={`flex items-center gap-3 px-5 py-3 ${c.bg} border-b ${c.border}`}>
                    <div className={`w-8 h-8 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${c.iconText}`} />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm">{section.title}</h3>
                  </div>

                  {/* ステップ一覧 */}
                  <div className="divide-y divide-gray-100">
                    {section.steps.map((step, i) => (
                      <div key={i} className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 w-5 h-5 rounded-full ${c.badge} text-white text-xs flex items-center justify-center flex-shrink-0 font-bold`}>
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-700 mb-2">{step.label}</div>
                            <div>{step.detail}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ────────────────────────────────────────────────
            CTA: 無料登録 / ガントチャートを開く
        ──────────────────────────────────────────────── */}
        <div className="mt-12 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl px-6 py-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">さっそくガントチャートを使ってみましょう</h3>
          <p className="text-sm text-gray-600 mb-6">
            無料登録するだけで、ガントチャートによる学習管理とコーチとの1on1がすぐに始められます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-rose-400 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md shadow-rose-200"
            >
              無料で始める
            </Link>
            <Link
              href="/study-plan"
              className="inline-flex items-center justify-center gap-2 bg-white border border-rose-200 hover:border-rose-300 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              ガントチャートを開く（ログイン後）
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            ご不明な点はコーチにお気軽にご相談ください。
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

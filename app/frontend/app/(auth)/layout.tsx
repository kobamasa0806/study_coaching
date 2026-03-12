/**
 * 認証ページ共通レイアウト。
 * ログイン・登録ページで共有する。
 */
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="py-4 px-6">
        <Link href="/" className="text-lg font-bold text-blue-600">
          StudyCoach
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}

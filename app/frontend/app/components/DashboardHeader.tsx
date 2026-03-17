'use client'

/**
 * 認証済みユーザー向けのダッシュボードヘッダー。
 * ユーザー名とログアウトボタンを表示する。
 */

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

export default function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* ロゴ */}
          <Link href="/dashboard" className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
            <BookOpen className="w-5 h-5" />
            <span>StudyCoach</span>
          </Link>

          {/* ユーザー情報 & ログアウト */}
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
import icon from '@/app/icon.svg'

const navLinks = [
  { label: 'サービス', href: '/#features' },
  { label: 'ガントチャートの使い方', href: '/gantt-guide' },
  { label: '学習プラン', href: '/plans' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, isLoading, logout } = useAuth()

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
  }

  /** 認証状態に応じた右上ボタンを返す */
  const renderAuthButton = (mobile = false) => {
    if (isLoading) return null

    if (isAuthenticated) {
      return (
        <button
          onClick={handleLogout}
          className={
            mobile
              ? 'text-center text-sm font-medium text-gray-600 py-2'
              : 'text-sm font-medium text-gray-600 hover:text-sky-500 transition-colors'
          }
        >
          ログアウト
        </button>
      )
    }

    return (
      <>
        <Link
          href="/login"
          onClick={() => setMenuOpen(false)}
          className={
            mobile
              ? 'text-center text-sm font-medium text-gray-600 py-2'
              : 'text-sm font-medium text-gray-600 hover:text-sky-500 transition-colors'
          }
        >
          ログイン
        </Link>
        <Link
          href="/register"
          onClick={() => setMenuOpen(false)}
          className={
            mobile
              ? 'text-center bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-lg'
              : 'bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors'
          }
        >
          新規登録
        </Link>
      </>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-sky-500 font-bold text-xl">
            <img src={icon.src} alt="ケンサン" className="w-6 h-6" />
            <span>ケンサン</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-sky-500 font-semibold'
                      : 'text-gray-600 hover:text-sky-500'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {renderAuthButton()}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-sky-500"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-sky-100 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-gray-700 hover:text-sky-500 font-medium py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {renderAuthButton(true)}
          </div>
        </div>
      )}
    </header>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'サービス', href: '#features' },
  { label: '使い方', href: '#how-it-works' },
  { label: '学習計画', href: '/study-plan' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-yellow-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-yellow-600 font-bold text-xl">
            <BookOpen className="w-6 h-6" />
            <span>StudyCoach</span>
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
                      ? 'text-yellow-600 font-semibold'
                      : 'text-gray-600 hover:text-yellow-600'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-yellow-600 transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              無料で始める
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-600 hover:text-yellow-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-yellow-100 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-gray-700 hover:text-yellow-600 font-medium py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="text-center text-sm font-medium text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              ログイン
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="text-center bg-yellow-400 text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg"
            >
              無料で始める
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

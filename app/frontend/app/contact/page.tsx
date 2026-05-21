'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

type FormState = { name: string; email: string; subject: string; message: string }
type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.message ?? 'エラーが発生しました。')
      }

      setStatus('success')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'エラーが発生しました。')
      setStatus('error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">お問い合わせ</h1>
        <p className="text-sm text-gray-500 mb-10">
          ご質問・ご要望はこちらからお気軽にお送りください。
        </p>

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <CheckCircle className="w-12 h-12 text-rose-400" />
            <p className="text-lg font-semibold text-white">お問い合わせを受け付けました</p>
            <p className="text-sm text-gray-500">
              内容を確認の上、ご連絡いたします。しばらくお待ちください。
            </p>
            <button
              onClick={() => { setStatus('idle'); setForm({ name: '', email: '', subject: '', message: '' }) }}
              className="mt-4 text-sm text-rose-400 hover:text-rose-300 underline"
            >
              別のお問い合わせをする
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="name">
                お名前 <span className="text-rose-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="山田 太郎"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">
                メールアドレス <span className="text-rose-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="subject">
                件名 <span className="text-rose-400">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                value={form.subject}
                onChange={handleChange}
                placeholder="お問い合わせの件名"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="message">
                お問い合わせ内容 <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="ご質問・ご要望をご記入ください"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              {status === 'loading' ? '送信中...' : '送信する'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}

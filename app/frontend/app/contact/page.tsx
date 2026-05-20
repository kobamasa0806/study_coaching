'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mailtoUrl =
      `mailto:kobamasahighhigh@gmail.com` +
      `?subject=${encodeURIComponent(`[ケンサン お問い合わせ] ${form.subject}`)}` +
      `&body=${encodeURIComponent(
        `お名前: ${form.name}\nメールアドレス: ${form.email}\n\n${form.message}`
      )}`
    window.location.href = mailtoUrl
    setSubmitted(true)
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

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <CheckCircle className="w-12 h-12 text-rose-400" />
            <p className="text-lg font-semibold text-white">メールアプリが開きました</p>
            <p className="text-sm text-gray-500">
              送信内容をご確認の上、メールを送信してください。
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 text-sm text-rose-400 hover:text-rose-300 underline"
            >
              フォームに戻る
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

            <button
              type="submit"
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              送信する
            </button>

            <p className="text-xs text-gray-600">
              送信ボタンを押すと、メールアプリが開きます。内容をご確認の上、メールを送信してください。
            </p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  )
}

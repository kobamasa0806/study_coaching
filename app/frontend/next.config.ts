import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

// CSP: 開発時は Next.js HMR のために unsafe-eval を許可する
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'"

const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? ''
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${apiBase} ${cognitoDomain} https://cognito-idp.ap-northeast-1.amazonaws.com`,
  "font-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ')

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // カメラ・マイク・位置情報へのアクセスを禁止する
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default config

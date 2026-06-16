import type { MetadataRoute } from 'next'

// 全クローラーに対して全パスのクロールを拒否する（検索避け）
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}

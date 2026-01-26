// Mock API for local development
// 用于本地开发时模拟 API 响应

export async function mockShorten(url: string): Promise<{
  slug: string
  shortUrl: string
  url: string
}> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 生成随机 slug
  const slug = Math.random().toString(36).substring(2, 9)

  return {
    slug,
    shortUrl: `http://localhost:5173/${slug}`,
    url,
  }
}

// 判断是否在本地开发环境
export const isDevelopment = import.meta.env.DEV

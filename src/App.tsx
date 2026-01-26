import { useEffect, useState } from 'react'
import UrlInput from './components/UrlInput'
import RecentLinks from './components/RecentLinks'

interface Link {
  slug: string
  shortUrl: string
  url: string
}

function App() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const path = window.location.pathname.slice(1) // 移除开头的 /

    // 如果是根路径或 API 路径，不处理
    if (!path || path.startsWith('api/')) {
      return
    }

    // 从 localStorage 读取历史记录
    const history = JSON.parse(localStorage.getItem('recentLinks') || '[]') as Link[]
    const link = history.find(l => l.slug === path)

    if (link) {
      // 找到匹配的短链接，重定向到目标 URL
      setIsRedirecting(true)
      window.location.href = link.url
    } else {
      // 未找到，返回首页
      window.history.pushState({}, '', '/')
    }
  }, [])

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在重定向...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            短链接生成工具
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            快速生成短链接，优化分享体验
          </p>
        </div>

        <UrlInput />

        <div className="mt-8">
          <RecentLinks />
        </div>
      </div>
    </div>
  )
}

export default App

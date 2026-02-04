import { useState } from 'react'
import ResultCard from './ResultCard'
import { mockShorten, isDevelopment } from '../api/mock'

interface ShortenResponse {
  slug: string
  shortUrl: string
  url: string
}

function UrlInput() {
  const [url, setUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ShortenResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('请输入 URL')
      return
    }

    // 验证自定义 slug 格式（如果提供）
    if (customSlug.trim() && !/^[A-Za-z0-9_-]{3,64}$/.test(customSlug.trim())) {
      setError('自定义短码只能包含字母、数字、下划线和连字符，长度 3-64 位')
      return
    }

    setLoading(true)

    try {
      let data: ShortenResponse

      // 开发环境使用 Mock API
      if (isDevelopment) {
        data = await mockShorten(url.trim(), customSlug.trim() || undefined)
      } else {
        // 生产环境使用真实 API
        const requestBody: { url: string; slug?: string } = { url: url.trim() }
        if (customSlug.trim()) {
          requestBody.slug = customSlug.trim()
        }

        const response = await fetch('/api/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        data = await response.json() as ShortenResponse

        if (!response.ok) {
          setError((data as { error?: string }).error || '生成失败')
          return
        }
      }

      setResult(data)

      const history = JSON.parse(localStorage.getItem('recentLinks') || '[]')
      history.unshift(data)
      localStorage.setItem('recentLinks', JSON.stringify(history.slice(0, 5)))

      setUrl('')
      setCustomSlug('')
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            输入长链接
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className={`w-full px-4 py-3 rounded-lg border ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } focus:ring-2 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="customSlug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            自定义短码（可选）
          </label>
          <input
            type="text"
            id="customSlug"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            placeholder="my-custom-link"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:ring-2 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            只能包含字母、数字、下划线和连字符，长度 3-64 位
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </>
          ) : (
            '生成短链接'
          )}
        </button>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  )
}

export default UrlInput

import { useState, useEffect } from 'react'

interface Link {
  slug: string
  shortUrl: string
  url: string
}

function RecentLinks() {
  const [links, setLinks] = useState<Link[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('recentLinks')
    if (stored) {
      setLinks(JSON.parse(stored))
    }
  }, [])

  const handleCopy = async (shortUrl: string, index: number) => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('recentLinks')
    setLinks([])
  }

  if (links.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          最近生成
        </h2>
        <button
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          清空
        </button>
      </div>

      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {link.shortUrl}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {link.url}
              </p>
            </div>
            <button
              onClick={() => handleCopy(link.shortUrl, index)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              {copiedIndex === index ? '已复制' : '复制'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentLinks

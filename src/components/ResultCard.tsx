import { useState } from 'react'

interface ResultCardProps {
  result: {
    slug: string
    shortUrl: string
    url: string
  }
}

function ResultCard({ result }: ResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-green-800 dark:text-green-300">
          短链接已生成
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={result.shortUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm"
        />
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  )
}

export default ResultCard

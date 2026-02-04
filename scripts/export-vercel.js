import fs from 'node:fs'
import path from 'node:path'

let createClient
try {
  const kvModule = await import('@vercel/kv')
  createClient = kvModule.createClient
} catch (error) {
  console.log('Skipping static export (@vercel/kv not installed)')
  process.exit(0)
}

const outputRoot = path.join(process.cwd(), 'public', 's')
const slugPattern = /^[A-Za-z0-9_-]{3,64}$/

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderRedirectHtml(targetUrl) {
  const escaped = escapeHtml(targetUrl)
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${escaped}">
  <script>window.location.href="${escaped}"</script>
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="${escaped}">${escaped}</a></p>
</body>
</html>`
}

async function exportStatic() {
  const isVercelBuild = process.env.VERCEL === '1'

  if (!isVercelBuild) {
    console.log('Skipping static export (not in Vercel build environment)')
    return
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.log('Skipping static export (KV credentials not found)')
    return
  }

  const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })

  try {
    const pinnedSlugs = await kv.smembers('links:pinned')

    if (!pinnedSlugs || pinnedSlugs.length === 0) {
      console.log('No pinned links to export')
      return
    }

    fs.mkdirSync(outputRoot, { recursive: true })

    let exportedCount = 0
    for (const slug of pinnedSlugs) {
      if (!slugPattern.test(String(slug))) continue

      const link = await kv.get(`link:${slug}`)
      if (!link || !link.url) continue

      const dir = path.join(outputRoot, String(slug))
      fs.mkdirSync(dir, { recursive: true })

      const html = renderRedirectHtml(link.url)
      fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
      exportedCount++
    }

    console.log(`Exported ${exportedCount} static redirects`)
  } catch (error) {
    console.error('Failed to export static redirects:', error)
  }
}

exportStatic()

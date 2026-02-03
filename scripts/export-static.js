import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const databaseName = process.env.D1_DATABASE_NAME || 'short_links'
const outputRoot = path.join(process.cwd(), 'public', 's')
const slugPattern = /^[A-Za-z0-9_-]{3,64}$/
const dbNamePattern = /^[A-Za-z0-9_-]+$/

if (!dbNamePattern.test(databaseName)) {
  console.error('Invalid D1 database name')
  process.exit(1)
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderRedirectHtml(targetUrl) {
  const escaped = escapeHtml(targetUrl)
  const jsonUrl = JSON.stringify(targetUrl)
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${escaped}">
    <link rel="canonical" href="${escaped}">
    <meta name="robots" content="noindex">
    <title>Redirecting</title>
  </head>
  <body>
    <script>location.replace(${jsonUrl});</script>
    <noscript><meta http-equiv="refresh" content="0; url=${escaped}"></noscript>
  </body>
</html>`
}

function queryPinnedLinks() {
  const sql =
    "SELECT slug, target_url FROM links WHERE pinned = 1 AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))"
  const command = `wrangler d1 execute ${databaseName} --command "${sql}" --json`
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const payload = JSON.parse(output)
    if (!payload?.[0]?.results) return []
    return payload[0].results
  } catch (error) {
    // 在 Cloudflare Pages 构建环境中，wrangler 不可用，返回空数组而不是退出
    console.log('Wrangler not available in build environment, skipping static export')
    return []
  }
}

function writeRedirect(slug, targetUrl) {
  if (!slugPattern.test(slug)) return
  const dir = path.join(outputRoot, slug)
  fs.mkdirSync(dir, { recursive: true })
  const html = renderRedirectHtml(targetUrl)
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
}

function main() {
  // 检测是否在 Cloudflare Pages 环境
  const isCloudflarePages = process.env.CF_PAGES === '1' || process.env.CF_PAGES_BRANCH

  if (!isCloudflarePages) {
    console.log('Skipping static export (not in Cloudflare Pages environment)')
    return
  }

  fs.mkdirSync(outputRoot, { recursive: true })
  const links = queryPinnedLinks()
  let exportedCount = 0
  for (const link of links) {
    if (!link?.slug || !link?.target_url) continue
    writeRedirect(String(link.slug), String(link.target_url))
    exportedCount++
  }
  console.log(`Exported ${exportedCount} static redirects`)
}

main()

import { kv } from '@vercel/kv'
import { customAlphabet } from 'nanoid'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const slugAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const maxSlugAttempts = 3
const generateSlug = customAlphabet(slugAlphabet, 7)
const reservedSlugs = new Set(['api', 's'])
const slugPattern = /^[A-Za-z0-9_-]{3,64}$/

function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidSlug(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!slugPattern.test(value)) return false
  if (reservedSlugs.has(value)) return false
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url, slug: customSlug } = req.body as { url?: string; slug?: string }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const trimmedSlug = customSlug?.trim()
  if (trimmedSlug && !isValidSlug(trimmedSlug)) {
    return res.status(400).json({ error: 'Invalid slug' })
  }

  const targetUrl = url
  let slug = trimmedSlug || generateSlug()
  let attempt = 0

  while (attempt < maxSlugAttempts) {
    const exists = await kv.exists(`link:${slug}`)

    if (!exists) {
      await kv.set(`link:${slug}`, {
        url: targetUrl,
        visits: 0,
        pinned: false,
        created: Date.now(),
        expires: null
      })
      break
    }

    if (trimmedSlug) {
      return res.status(409).json({ error: 'Slug already exists' })
    }

    attempt += 1
    if (attempt >= maxSlugAttempts) {
      return res.status(409).json({ error: 'Slug collision, retry' })
    }
    slug = generateSlug()
  }

  const host = req.headers.host || 'localhost'
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const shortUrl = `${protocol}://${host}/${slug}`

  return res.status(201).json({ slug, shortUrl, url: targetUrl })
}

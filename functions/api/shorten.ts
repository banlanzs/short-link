import { customAlphabet } from 'nanoid'

interface Env {
  DB: D1Database
}

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

export async function onRequestPost(context: EventContext<Env, string, Record<string, unknown>>) {
  const { request, env } = context

  // 调试：检查 DB 绑定
  if (!env.DB) {
    console.error('DB binding not found in env:', Object.keys(env))
    return Response.json({ error: 'Database not configured' }, { status: 500 })
  }

  let body: { url?: string; slug?: string } = {}
  try {
    body = await request.json()
  } catch (error) {
    console.error('JSON parse error:', error)
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isValidUrl(body.url)) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const customSlug = body.slug?.trim()
  if (customSlug && !isValidSlug(customSlug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const targetUrl = body.url
  let slug = customSlug || generateSlug()
  let attempt = 0

  while (attempt < maxSlugAttempts) {
    try {
      await env.DB.prepare(
        'INSERT INTO links (slug, target_url) VALUES (?, ?)'
      )
        .bind(slug, targetUrl)
        .run()
      break
    } catch (error) {
      console.error('Database error:', error)
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('UNIQUE constraint failed')) {
        if (customSlug) {
          return Response.json({ error: 'Slug already exists' }, { status: 409 })
        }
        attempt += 1
        if (attempt >= maxSlugAttempts) {
          return Response.json({ error: 'Slug collision, retry' }, { status: 409 })
        }
        slug = generateSlug()
        continue
      }
      return Response.json({ error: 'Database error', details: message }, { status: 500 })
    }
  }

  const origin = new URL(request.url).origin
  const shortUrl = `${origin}/${slug}`

  return Response.json({ slug, shortUrl, url: targetUrl }, { status: 201 })
}

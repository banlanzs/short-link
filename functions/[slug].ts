interface Env {
  DB: D1Database
}

type LinkRow = {
  target_url: string
  expires_at: string | null
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const ts = Date.parse(expiresAt)
  if (Number.isNaN(ts)) return true
  return ts <= Date.now()
}

export async function onRequestGet(context: EventContext<Env, string, Record<string, unknown>>) {
  const { env, params, waitUntil } = context
  const slug = params.slug as string

  const row = await env.DB.prepare(
    'SELECT target_url, expires_at FROM links WHERE slug = ?'
  )
    .bind(slug)
    .first<LinkRow>()

  if (!row) {
    return new Response('Not Found', { status: 404 })
  }

  if (isExpired(row.expires_at)) {
    return new Response('Gone', { status: 410 })
  }

  waitUntil(
    env.DB.prepare(
      "UPDATE links SET hit_count = hit_count + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE slug = ?"
    )
      .bind(slug)
      .run()
  )

  const headers = new Headers({
    Location: row.target_url,
    'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400',
  })

  return new Response(null, { status: 301, headers })
}

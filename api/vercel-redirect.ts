import { kv } from '@vercel/kv'

export const config = {
  runtime: 'edge',
}

interface LinkData {
  url: string
  visits: number
  pinned: boolean
  created: number
  expires: number | null
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const slug = url.pathname.slice(1)

  if (!slug || slug.startsWith('api/') || slug.startsWith('s/')) {
    return new Response('Not Found', { status: 404 })
  }

  const link = await kv.get<LinkData>(`link:${slug}`)

  if (!link) {
    return new Response('Not Found', { status: 404 })
  }

  if (link.expires && link.expires < Date.now()) {
    return new Response('Gone', { status: 410 })
  }

  kv.hincrby(`link:${slug}`, 'visits', 1).catch(() => {})

  return Response.redirect(link.url, 301)
}

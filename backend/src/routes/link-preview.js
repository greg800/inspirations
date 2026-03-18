import { Router } from 'express'
const router = Router()

// GET /api/link-preview?url=https://...
router.get('/', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url requis' })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspirationsBot/1.0)' },
    })
    clearTimeout(timeout)

    const html = await response.text()

    // Extraire og:image, og:title, og:description
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1]
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]

    const domain = new URL(url).hostname.replace('www.', '')

    res.json({
      image: ogImage || null,
      title: ogTitle?.trim() || domain,
      domain,
      url,
    })
  } catch (e) {
    const domain = (() => { try { return new URL(url).hostname.replace('www.', '') } catch { return url } })()
    res.json({ image: null, title: domain, domain, url })
  }
})

export default router

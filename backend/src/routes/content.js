import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { mkdirSync } from 'fs'
import { requireApproved, requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

const UPLOADS_DIR = process.env.UPLOADS_PATH || 'uploads/'
mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// GET all unique contributor names — filtrés par bulles de l'utilisateur
router.get('/contributors', optionalAuth, async (req, res) => {
  if (!req.user) return res.json([])

  const memberships = await prisma.bubbleMembership.findMany({
    where: { userId: req.user.id },
    select: { bubbleId: true },
  })
  const bubbleIds = memberships.map(m => m.bubbleId)
  if (bubbleIds.length === 0) return res.json([])

  const contents = await prisma.content.findMany({
    where: { bubbles: { some: { bubbleId: { in: bubbleIds } } } },
    select: { id: true, user: { select: { name: true } } },
  })
  const contentIds = contents.map(c => c.id)

  const reviewers = await prisma.review.findMany({
    where: { contentId: { in: contentIds } },
    select: { user: { select: { name: true } } },
    distinct: ['userId'],
  })

  const names = [...new Set([
    ...contents.map(c => c.user.name),
    ...reviewers.map(r => r.user.name),
  ])].sort()
  res.json(names)
})

// GET all contents with pagination, sorting and filters
router.get('/', optionalAuth, async (req, res) => {
  const { support, genre, minRating, maxRating, contributor, search, sort = 'recent', page = 1, limit = 20, bubbleId: bubbleIdFilter } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20))

  let bubbleIds = null
  if (req.user?.id) {
    const memberships = await prisma.bubbleMembership.findMany({
      where: { userId: req.user.id },
      select: { bubbleId: true },
    })
    bubbleIds = memberships.map(m => m.bubbleId)
  }

  const where = {}

  if (bubbleIds !== null && bubbleIds.length > 0) {
    if (bubbleIdFilter) {
      const specific = parseInt(bubbleIdFilter)
      if (!bubbleIds.includes(specific)) return res.json({ items: [], total: 0, page: pageNum, hasMore: false })
      where.bubbles = { some: { bubbleId: specific } }
    } else {
      where.bubbles = { some: { bubbleId: { in: bubbleIds } } }
    }
  } else if (bubbleIds !== null && bubbleIds.length === 0) {
    return res.json({ items: [], total: 0, page: pageNum, hasMore: false })
  } else if (bubbleIds === null) {
    return res.json({ items: [], total: 0, page: pageNum, hasMore: false })
  }

  if (support) where.support = support
  if (genre) where.genre = genre
  if (minRating || maxRating) {
    where.rating = {}
    if (minRating) where.rating.gte = parseFloat(minRating)
    if (maxRating) where.rating.lte = parseFloat(maxRating)
  }
  if (contributor) {
    where.OR = [
      { user: { name: contributor } },
      { reviews: { some: { user: { name: contributor } } } },
    ]
  }
  if (search && search.trim()) {
    const s = search.trim()
    const searchConditions = [
      { title:  { contains: s } },
      { author: { contains: s } },
    ]
    where.AND = [{ OR: searchConditions }]
    if (where.OR) { where.AND.push({ OR: where.OR }); delete where.OR }
  }

  const contents = await prisma.content.findMany({
    where,
    include: {
      user: { select: { name: true } },
      votes: { select: { type: true, userId: true, createdAt: true } },
      reviews: { select: { rating: true, createdAt: true } },
    },
  })

  const userId = req.user?.id || null

  const enriched = contents.map(c => {
    const up   = c.votes.filter(v => v.type === 'UP').length
    const down = c.votes.filter(v => v.type === 'DOWN').length
    const votesScore = up + down > 0 ? 10 + ((up - down) / (up + down)) * 10 : 10
    const reviewAvg = c.reviews.length > 0
      ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length
      : c.rating
    const globalScore = (c.rating + reviewAvg + votesScore) / 3
    const lastActivity = Math.max(
      new Date(c.createdAt).getTime(),
      ...c.reviews.map(r => new Date(r.createdAt).getTime()),
      ...c.votes.map(v => new Date(v.createdAt).getTime()),
    )

    return {
      ...c,
      upCount:    up,
      downCount:  down,
      myVote:     userId ? (c.votes.find(v => v.userId === userId)?.type || null) : null,
      votes:      undefined,
      reviews:    undefined,
      _score:     globalScore,
      _lastActivity: lastActivity,
    }
  })

  if (sort === 'score') {
    enriched.sort((a, b) => b._score - a._score)
  } else {
    enriched.sort((a, b) => b._lastActivity - a._lastActivity)
  }

  const total = enriched.length
  const start = (pageNum - 1) * limitNum
  const items = enriched
    .slice(start, start + limitNum)
    .map(({ _score, _lastActivity, ...item }) => item)

  res.json({ items, total, page: pageNum, hasMore: start + limitNum < total })
})

// GET single content
router.get('/:id', async (req, res) => {
  const content = await prisma.content.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      user: { select: { name: true } },
      bubbles: { include: { bubble: { select: { id: true, name: true } } } },
    },
  })
  if (!content) return res.status(404).json({ error: 'Non trouvé' })
  const result = {
    ...content,
    bubbles: content.bubbles.map(cb => ({ id: cb.bubbleId, name: cb.bubble.name })),
  }
  res.json(result)
})

// POST /:id/bubbles — ajouter le contenu dans une bulle (auteur uniquement)
router.post('/:id/bubbles', requireApproved, async (req, res) => {
  const contentId = parseInt(req.params.id)
  const { bubbleId } = req.body
  if (!bubbleId) return res.status(400).json({ error: 'bubbleId requis' })

  const content = await prisma.content.findUnique({ where: { id: contentId } })
  if (!content) return res.status(404).json({ error: 'Non trouvé' })
  if (content.userId !== req.user.id) {
    return res.status(403).json({ error: 'Seul le créateur peut modifier les bulles' })
  }

  const bId = parseInt(bubbleId)
  const membership = await prisma.bubbleMembership.findUnique({
    where: { userId_bubbleId: { userId: req.user.id, bubbleId: bId } },
  })
  if (!membership) return res.status(403).json({ error: 'Vous n\'êtes pas membre de cette bulle' })

  await prisma.contentBubble.upsert({
    where: { contentId_bubbleId: { contentId, bubbleId: bId } },
    create: { contentId, bubbleId: bId },
    update: {},
  })

  const bubble = await prisma.bubble.findUnique({ where: { id: bId }, select: { name: true } })
  res.json({ bubbleId: bId, bubbleName: bubble.name })
})

// DELETE /:id/bubbles/:bubbleId — retirer le contenu d'une bulle
router.delete('/:id/bubbles/:bubbleId', requireApproved, async (req, res) => {
  const contentId = parseInt(req.params.id)
  const bubbleId = parseInt(req.params.bubbleId)

  const content = await prisma.content.findUnique({ where: { id: contentId } })
  if (!content) return res.status(404).json({ error: 'Non trouvé' })
  if (content.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  await prisma.contentBubble.deleteMany({ where: { contentId, bubbleId } })

  const remaining = await prisma.contentBubble.count({ where: { contentId } })
  if (remaining === 0) {
    await prisma.vote.deleteMany({ where: { contentId } })
    await prisma.review.deleteMany({ where: { contentId } })
    await prisma.content.delete({ where: { id: contentId } })
    return res.json({ deleted: true })
  }

  res.json({ deleted: false, remaining })
})

// POST create content (auth + approved)
router.post('/', requireApproved, upload.single('coverImage'), async (req, res) => {
  const { title, author, summary, whyRead, rating, support, genre, publishDate, url, bubbleId } = req.body
  const sponsor = req.user.name

  if (!title || !whyRead || !rating) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }
  if (!req.file) return res.status(400).json({ error: 'Image de couverture requise' })
  if (wordCount(whyRead) < 20) return res.status(400).json({ error: `"Pourquoi en faire l'expérience" trop court (${wordCount(whyRead)} mots, minimum 20)` })
  if (!bubbleId) return res.status(400).json({ error: 'Bulle requise' })

  const ratingNum = parseFloat(rating)
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 20) {
    return res.status(400).json({ error: 'Note invalide (0 à 20)' })
  }

  const bId = parseInt(bubbleId)
  const membership = await prisma.bubbleMembership.findUnique({
    where: { userId_bubbleId: { userId: req.user.id, bubbleId: bId } },
  })
  if (!membership) return res.status(403).json({ error: 'Vous n\'êtes pas membre de cette bulle' })

  const content = await prisma.content.create({
    data: {
      title,
      author,
      coverImage: `/uploads/${req.file.filename}`,
      summary,
      whyRead,
      rating: ratingNum,
      sponsor,
      support: support || null,
      genre: genre || null,
      url: url || null,
      publishDate: publishDate ? new Date(publishDate) : null,
      userId: req.user.id,
      bubbles: { create: { bubbleId: bId } },
    },
  })
  res.status(201).json(content)
})

// PUT update content (own content only)
router.put('/:id', requireApproved, upload.single('coverImage'), async (req, res) => {
  const content = await prisma.content.findUnique({ where: { id: parseInt(req.params.id) } })
  if (!content) return res.status(404).json({ error: 'Non trouvé' })
  if (content.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  const { title, author, summary, whyRead, rating, support, genre, publishDate, url } = req.body
  const sponsor = req.user.name

  if (whyRead && wordCount(whyRead) < 20) return res.status(400).json({ error: `"Pourquoi en faire l'expérience" trop court (${wordCount(whyRead)} mots, minimum 20)` })

  const data = {}
  if (title) data.title = title
  if (author) data.author = author
  if (summary) data.summary = summary
  if (whyRead) data.whyRead = whyRead
  if (rating) data.rating = parseFloat(rating)
  if (sponsor) data.sponsor = sponsor
  if (support !== undefined) data.support = support || null
  if (genre !== undefined) data.genre = genre || null
  if (url !== undefined) data.url = url || null
  if (publishDate !== undefined) data.publishDate = publishDate ? new Date(publishDate) : null
  if (req.file) data.coverImage = `/uploads/${req.file.filename}`

  const updated = await prisma.content.update({ where: { id: parseInt(req.params.id) }, data })
  res.json(updated)
})

// DELETE (own or admin) — suppression complète
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const content = await prisma.content.findUnique({ where: { id } })
    if (!content) return res.status(404).json({ error: 'Non trouvé' })
    if (content.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Non autorisé' })
    }
    await prisma.contentBubble.deleteMany({ where: { contentId: id } })
    await prisma.vote.deleteMany({ where: { contentId: id } })
    await prisma.review.deleteMany({ where: { contentId: id } })
    await prisma.content.delete({ where: { id } })
    res.json({ message: 'Supprimé' })
  } catch (err) {
    console.error('DELETE content error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router

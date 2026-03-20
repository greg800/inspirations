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

// GET all unique contributor names (publishers + reviewers)
router.get('/contributors', async (req, res) => {
  const [publishers, reviewers] = await Promise.all([
    prisma.content.findMany({ select: { user: { select: { name: true } } }, distinct: ['userId'] }),
    prisma.review.findMany({ select: { user: { select: { name: true } } }, distinct: ['userId'] }),
  ])
  const names = [...new Set([
    ...publishers.map(c => c.user.name),
    ...reviewers.map(r => r.user.name),
  ])].sort()
  res.json(names)
})

// GET all contents (public) with optional filters
router.get('/', optionalAuth, async (req, res) => {
  const { support, genre, minRating, maxRating, contributor } = req.query
  const where = {}
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
  const contents = await prisma.content.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      votes: { select: { type: true, userId: true } },
    },
  })
  const userId = req.user?.id || null
  res.json(contents.map(c => ({
    ...c,
    upCount:   c.votes.filter(v => v.type === 'UP').length,
    downCount: c.votes.filter(v => v.type === 'DOWN').length,
    myVote:    userId ? (c.votes.find(v => v.userId === userId)?.type || null) : null,
    votes: undefined,
  })))
})

// GET single content (public)
router.get('/:id', async (req, res) => {
  const content = await prisma.content.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { user: { select: { name: true } } },
  })
  if (!content) return res.status(404).json({ error: 'Non trouvé' })
  res.json(content)
})

// POST create content (auth + approved)
router.post('/', requireApproved, upload.single('coverImage'), async (req, res) => {
  const { title, author, summary, whyRead, rating, support, genre, publishDate, url } = req.body; const sponsor = req.user.name

  if (!title || !author || !summary || !whyRead || !rating) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' })
  }
  if (!req.file) return res.status(400).json({ error: 'Image de couverture requise' })
  if (wordCount(summary) < 100) return res.status(400).json({ error: `Résumé trop court (${wordCount(summary)} mots, minimum 100)` })
  if (wordCount(whyRead) < 30) return res.status(400).json({ error: `"Pourquoi le lire" trop court (${wordCount(whyRead)} mots, minimum 30)` })

  const ratingNum = parseFloat(rating)
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 20) {
    return res.status(400).json({ error: 'Note invalide (0 à 20)' })
  }

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

  const { title, author, summary, whyRead, rating, support, genre, publishDate, url } = req.body; const sponsor = req.user.name

  if (summary && wordCount(summary) < 100) return res.status(400).json({ error: `Résumé trop court (${wordCount(summary)} mots, minimum 100)` })
  if (whyRead && wordCount(whyRead) < 30) return res.status(400).json({ error: `"Pourquoi le lire" trop court (${wordCount(whyRead)} mots, minimum 30)` })

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

// DELETE (own or admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const content = await prisma.content.findUnique({ where: { id } })
    if (!content) return res.status(404).json({ error: 'Non trouvé' })
    if (content.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Non autorisé' })
    }
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

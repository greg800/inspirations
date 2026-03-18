import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireApproved } from '../middleware/auth.js'

const router = Router({ mergeParams: true })
const prisma = new PrismaClient()

// GET reviews for a content (public)
router.get('/', async (req, res) => {
  const contentId = parseInt(req.params.id)
  const reviews = await prisma.review.findMany({
    where: { contentId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  const avg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null
  res.json({ reviews, avg, count: reviews.length })
})

// POST create or update own review (auth + approved, not the content author)
router.post('/', requireApproved, async (req, res) => {
  const contentId = parseInt(req.params.id)
  const { rating, comment } = req.body

  if (!rating || !comment) return res.status(400).json({ error: 'Note et commentaire requis' })
  const ratingNum = parseFloat(rating)
  if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 20) {
    return res.status(400).json({ error: 'Note invalide (0 à 20)' })
  }
  if (!comment.trim()) return res.status(400).json({ error: 'Commentaire requis' })

  const content = await prisma.content.findUnique({ where: { id: contentId } })
  if (!content) return res.status(404).json({ error: 'Contenu introuvable' })
  if (content.userId === req.user.id) {
    return res.status(403).json({ error: 'Vous ne pouvez pas noter votre propre publication' })
  }

  const review = await prisma.review.upsert({
    where: { userId_contentId: { userId: req.user.id, contentId } },
    create: { rating: ratingNum, comment, userId: req.user.id, contentId },
    update: { rating: ratingNum, comment },
    include: { user: { select: { name: true } } },
  })
  res.json(review)
})

// DELETE own review
router.delete('/', requireApproved, async (req, res) => {
  const contentId = parseInt(req.params.id)
  const existing = await prisma.review.findUnique({
    where: { userId_contentId: { userId: req.user.id, contentId } },
  })
  if (!existing) return res.status(404).json({ error: 'Avis introuvable' })
  await prisma.review.delete({ where: { userId_contentId: { userId: req.user.id, contentId } } })
  res.json({ message: 'Avis supprimé' })
})

export default router

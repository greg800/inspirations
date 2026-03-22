import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/notifications — retourne les notifs du sponsor connecté
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationsReadAt: true },
  })

  // Critiques reçues sur mes œuvres (pas les miennes)
  const reviews = await prisma.review.findMany({
    where: {
      content: { userId },
      userId: { not: userId },
    },
    include: {
      user:    { select: { name: true } },
      content: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Votes reçus sur mes œuvres (pas les miens)
  const votes = await prisma.vote.findMany({
    where: {
      content: { userId },
      userId: { not: userId },
    },
    include: {
      user:    { select: { name: true } },
      content: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fusionner et trier par date
  const items = [
    ...reviews.map(r => ({
      type:      'review',
      date:      r.createdAt,
      person:    r.user.name,
      rating:    r.rating,
      voteType:  null,
      contentId: r.content.id,
      contentTitle: r.content.title,
      isNew: !user.notificationsReadAt || r.createdAt > user.notificationsReadAt,
    })),
    ...votes.map(v => ({
      type:      'vote',
      date:      v.createdAt,
      person:    v.user.name,
      rating:    null,
      voteType:  v.type,
      contentId: v.content.id,
      contentTitle: v.content.title,
      isNew: !user.notificationsReadAt || v.createdAt > user.notificationsReadAt,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const unread = items.filter(i => i.isNew).length

  res.json({ unread, items })
})

// POST /api/notifications/read — marque tout comme lu
router.post('/read', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { notificationsReadAt: new Date() },
  })
  res.json({ unread: 0 })
})

export default router

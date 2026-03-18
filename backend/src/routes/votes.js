import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })
const prisma = new PrismaClient()

// GET votes pour un contenu (public, myVote si connecté)
router.get('/', optionalAuth, async (req, res) => {
  const contentId = parseInt(req.params.id)
  const votes = await prisma.vote.findMany({
    where: { contentId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const upVotes   = votes.filter(v => v.type === 'UP')
  const downVotes = votes.filter(v => v.type === 'DOWN')
  const myVote    = req.user ? (votes.find(v => v.userId === req.user.id)?.type || null) : null

  res.json({
    up: upVotes.length,
    down: downVotes.length,
    upVoters:   upVotes.map(v => v.user.name),
    downVoters: downVotes.map(v => v.user.name),
    myVote,
  })
})

// POST vote (auth requis) — toggle si même type, switch si différent
router.post('/', requireAuth, async (req, res) => {
  const contentId = parseInt(req.params.id)
  const { type } = req.body

  if (!['UP', 'DOWN'].includes(type))
    return res.status(400).json({ error: 'Type invalide (UP ou DOWN)' })

  const existing = await prisma.vote.findUnique({
    where: { userId_contentId: { userId: req.user.id, contentId } },
  })

  if (existing) {
    if (existing.type === type) {
      await prisma.vote.delete({ where: { id: existing.id } })
      return res.json({ myVote: null })
    }
    await prisma.vote.update({ where: { id: existing.id }, data: { type } })
    return res.json({ myVote: type })
  }

  await prisma.vote.create({ data: { type, userId: req.user.id, contentId } })
  res.json({ myVote: type })
})

export default router

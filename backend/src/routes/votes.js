import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router({ mergeParams: true })
const prisma = new PrismaClient()

// GET votes pour un contenu — filtrés par bulle du viewer
router.get('/', optionalAuth, async (req, res) => {
  const contentId = parseInt(req.params.id)
  let where = { contentId }

  if (req.user) {
    const contentBubbles = await prisma.contentBubble.findMany({
      where: { contentId },
      select: { bubbleId: true },
    })
    const contentBubbleIds = contentBubbles.map(cb => cb.bubbleId)

    if (contentBubbleIds.length > 0) {
      const viewerMemberships = await prisma.bubbleMembership.findMany({
        where: { userId: req.user.id, bubbleId: { in: contentBubbleIds } },
        select: { bubbleId: true },
      })
      const sharedBubbleIds = viewerMemberships.map(m => m.bubbleId)

      if (sharedBubbleIds.length > 0) {
        const members = await prisma.bubbleMembership.findMany({
          where: { bubbleId: { in: sharedBubbleIds } },
          select: { userId: true },
        })
        const memberIds = [...new Set(members.map(m => m.userId))]
        where.userId = { in: memberIds }
      }
    }
  }

  const votes = await prisma.vote.findMany({
    where,
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

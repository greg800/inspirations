import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

function getCutoff(period) {
  if (period === '1d') return new Date(Date.now() - 86400000)
  if (period === '7d') return new Date(Date.now() - 7 * 86400000)
  return null
}

// Récupère les IDs de bulles de l'utilisateur, ou null si non connecté
async function getUserBubbleIds(userId) {
  if (!userId) return null
  const memberships = await prisma.bubbleMembership.findMany({
    where: { userId },
    select: { bubbleId: true },
  })
  return memberships.map(m => m.bubbleId)
}

// GET /api/activity?period=1d|7d|all&view=works|contributors
router.get('/', optionalAuth, async (req, res) => {
  const { period = 'all', view = 'works' } = req.query
  const cutoff = getCutoff(period)
  const dateFilter = cutoff ? { gte: cutoff } : undefined

  // Filtre par bulles de l'utilisateur connecté
  const bubbleIds = await getUserBubbleIds(req.user?.id)
  if (bubbleIds !== null && bubbleIds.length === 0) return res.json([])

  const bubbleWhere = bubbleIds ? { bubbleId: { in: bubbleIds } } : {}

  if (view === 'works') {
    const contents = await prisma.content.findMany({
      where: bubbleWhere,
      select: {
        id: true,
        title: true,
        createdAt: true,
        reviews: {
          where: dateFilter ? { createdAt: dateFilter } : {},
          select: { rating: true },
        },
        votes: {
          where: dateFilter ? { createdAt: dateFilter } : {},
          select: { type: true },
        },
      },
    })

    const works = contents
      .map(c => {
        const inPeriod = !cutoff || c.createdAt >= cutoff
        const reviewCount = c.reviews.length
        const upCount = c.votes.filter(v => v.type === 'UP').length
        const downCount = c.votes.filter(v => v.type === 'DOWN').length
        const avgRating = reviewCount > 0
          ? Math.round(c.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount * 10) / 10
          : null
        const score = reviewCount * 5 + upCount + downCount
        if (cutoff && !inPeriod && score === 0) return null
        return { id: c.id, title: c.title, reviewCount, avgRating, upCount, downCount, score }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    return res.json(works)
  }

  if (view === 'contributors') {
    // Récupérer les IDs de contenus accessibles à l'utilisateur
    const accessibleContents = await prisma.content.findMany({
      where: bubbleWhere,
      select: { id: true },
    })
    const contentIds = accessibleContents.map(c => c.id)

    const [contents, reviews, votes] = await Promise.all([
      prisma.content.findMany({
        where: {
          ...bubbleWhere,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { userId: true, user: { select: { name: true } } },
      }),
      prisma.review.findMany({
        where: {
          contentId: { in: contentIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { userId: true, user: { select: { name: true } } },
      }),
      prisma.vote.findMany({
        where: {
          contentId: { in: contentIds },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { userId: true, user: { select: { name: true } } },
      }),
    ])

    const map = new Map()
    const ensure = (userId, name) => {
      if (!map.has(userId)) map.set(userId, { name, worksCount: 0, reviewCount: 0, voteCount: 0 })
    }
    contents.forEach(c => { ensure(c.userId, c.user.name); map.get(c.userId).worksCount++ })
    reviews.forEach(r => { ensure(r.userId, r.user.name); map.get(r.userId).reviewCount++ })
    votes.forEach(v => { ensure(v.userId, v.user.name); map.get(v.userId).voteCount++ })

    const contributors = [...map.entries()]
      .map(([, data]) => ({
        name: data.name,
        worksCount: data.worksCount,
        reviewCount: data.reviewCount,
        voteCount: data.voteCount,
        score: data.worksCount * 10 + data.reviewCount * 5 + data.voteCount,
      }))
      .sort((a, b) => b.score - a.score)

    return res.json(contributors)
  }

  res.status(400).json({ error: 'view invalide' })
})

export default router

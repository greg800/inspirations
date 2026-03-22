import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET all users with activity stats (admin)
router.get('/users', requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, isApproved: true, isAdmin: true, createdAt: true,
      _count: { select: { contents: true, reviews: true } },
      votes: { select: { type: true } },
    },
  })

  const result = users.map(u => {
    const votesUp = u.votes.filter(v => v.type === 'UP').length
    const votesDown = u.votes.filter(v => v.type === 'DOWN').length
    const total = u._count.contents + u._count.reviews + u.votes.length
    const { votes, _count, ...base } = u
    return { ...base, stats: { publications: u._count.contents, reviews: u._count.reviews, votesUp, votesDown, total } }
  })

  result.sort((a, b) => b.stats.total - a.stats.total)
  res.json(result)
})

// PATCH approve user
router.patch('/users/:id/approve', requireAdmin, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: { isApproved: true },
    select: { id: true, email: true, name: true, isApproved: true },
  })
  res.json(user)
})

// PATCH reject / revoke user
router.patch('/users/:id/revoke', requireAdmin, async (req, res) => {
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: { isApproved: false },
    select: { id: true, email: true, name: true, isApproved: true },
  })
  res.json(user)
})

// DELETE user (and their content)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    // Votes on this user's content
    await prisma.vote.deleteMany({ where: { content: { userId } } })
    // Reviews on this user's content
    await prisma.review.deleteMany({ where: { content: { userId } } })
    // This user's own content
    await prisma.content.deleteMany({ where: { userId } })
    // Votes cast BY this user on others' content
    await prisma.vote.deleteMany({ where: { userId } })
    // Reviews written BY this user on others' content
    await prisma.review.deleteMany({ where: { userId } })
    // Finally delete the user
    await prisma.user.delete({ where: { id: userId } })
    res.json({ message: 'Utilisateur supprimé' })
  } catch (err) {
    console.error('DELETE user error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE all content (admin purge — used for migrations)
router.delete('/content/purge-all', requireAdmin, async (req, res) => {
  await prisma.vote.deleteMany()
  await prisma.review.deleteMany()
  await prisma.content.deleteMany()
  res.json({ message: 'Tout le contenu supprimé' })
})

export default router

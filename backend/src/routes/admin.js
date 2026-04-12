import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET all users (admin)
router.get('/users', requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, isApproved: true, isAdmin: true,
      createdAt: true, lastLoginAt: true, loginCount: true,
    },
    orderBy: { lastLoginAt: { sort: 'desc', nulls: 'last' } },
  })
  res.json(users)
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

// POST seed CastelGreg — ajoute tous les users + contenus orphelins à CastelGreg
router.post('/seed-castelgreg', requireAdmin, async (req, res) => {
  try {
    let bubble = await prisma.bubble.findFirst({ where: { name: 'CastelGreg' } })

    if (!bubble) {
      const firstUser = await prisma.user.findFirst({ orderBy: { id: 'asc' } })
      if (!firstUser) return res.status(400).json({ error: 'Aucun utilisateur en base' })
      bubble = await prisma.bubble.create({
        data: { name: 'CastelGreg', createdById: firstUser.id },
      })
    }

    const users = await prisma.user.findMany()
    await prisma.bubbleMembership.createMany({
      data: users.map(u => ({ userId: u.id, bubbleId: bubble.id })),
      skipDuplicates: true,
    })

    await prisma.content.updateMany({ where: { bubbleId: null }, data: { bubbleId: bubble.id } })

    res.json({ message: `CastelGreg synchronisée — ${users.length} membres, contenus rattachés` })
  } catch (err) {
    console.error('Seed CastelGreg error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET all users (admin)
router.get('/users', requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isApproved: true, isAdmin: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
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
  const userId = parseInt(req.params.id)
  await prisma.vote.deleteMany({ where: { content: { userId } } })
  await prisma.review.deleteMany({ where: { content: { userId } } })
  await prisma.content.deleteMany({ where: { userId } })
  await prisma.user.delete({ where: { id: userId } })
  res.json({ message: 'Utilisateur supprimé' })
})

// DELETE all content (admin purge — used for migrations)
router.delete('/content/purge-all', requireAdmin, async (req, res) => {
  await prisma.vote.deleteMany()
  await prisma.review.deleteMany()
  await prisma.content.deleteMany()
  res.json({ message: 'Tout le contenu supprimé' })
})

export default router

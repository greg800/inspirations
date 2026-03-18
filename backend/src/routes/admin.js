import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// Route temporaire de setup admin (à supprimer après usage)
router.post('/setup-first-admin', async (req, res) => {
  const { email, secret } = req.body
  if (secret !== process.env.JWT_SECRET) return res.status(403).json({ error: 'Interdit' })
  const user = await prisma.user.update({
    where: { email },
    data: { isAdmin: true, isApproved: true },
  })
  res.json({ message: 'Admin activé', email: user.email })
})

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
  await prisma.content.deleteMany({ where: { userId: parseInt(req.params.id) } })
  await prisma.user.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Utilisateur supprimé' })
})

export default router

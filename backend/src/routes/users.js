import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// PATCH /api/users/me — update user preferences and profile
router.patch('/me', requireAuth, async (req, res) => {
  const { zoomLevel, name } = req.body
  if (zoomLevel !== undefined && (typeof zoomLevel !== 'number' || zoomLevel < 10 || zoomLevel > 100)) {
    return res.status(400).json({ error: 'zoomLevel invalide (10-100)' })
  }
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    return res.status(400).json({ error: 'Pseudo trop court (minimum 2 caractères)' })
  }
  const data = {}
  if (zoomLevel !== undefined) data.zoomLevel = zoomLevel
  if (name !== undefined) data.name = name.trim()

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: { id: true, zoomLevel: true, name: true },
  })
  res.json(user)
})

export default router

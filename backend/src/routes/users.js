import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// PATCH /api/users/me — update user preferences
router.patch('/me', requireAuth, async (req, res) => {
  const { zoomLevel } = req.body
  if (zoomLevel !== undefined && (typeof zoomLevel !== 'number' || zoomLevel < 10 || zoomLevel > 100)) {
    return res.status(400).json({ error: 'zoomLevel invalide (10-100)' })
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(zoomLevel !== undefined && { zoomLevel }) },
    select: { id: true, zoomLevel: true },
  })
  res.json(user)
})

export default router

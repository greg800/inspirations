import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/tags?type=support|genre  (public)
router.get('/', async (req, res) => {
  const { type } = req.query
  const where = type ? { type } : {}
  const tags = await prisma.tag.findMany({ where, orderBy: { value: 'asc' } })
  res.json(tags)
})

// POST /api/tags  (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { type, value } = req.body
  if (!type || !value) return res.status(400).json({ error: 'type et value requis' })
  if (!['support', 'genre'].includes(type)) return res.status(400).json({ error: 'type invalide' })
  try {
    const tag = await prisma.tag.create({ data: { type, value: value.trim() } })
    res.json(tag)
  } catch {
    res.status(409).json({ error: 'Ce tag existe déjà' })
  }
})

// DELETE /api/tags/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id)
  await prisma.tag.delete({ where: { id } })
  res.json({ message: 'Supprimé' })
})

export default router

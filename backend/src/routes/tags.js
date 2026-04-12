import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAdmin, optionalAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/tags?type=support|genre
// Retourne uniquement les valeurs utilisées dans les bulles de l'utilisateur connecté
router.get('/', optionalAuth, async (req, res) => {
  const { type } = req.query

  // Non connecté → liste vide
  if (!req.user) return res.json([])

  const memberships = await prisma.bubbleMembership.findMany({
    where: { userId: req.user.id },
    select: { bubbleId: true },
  })
  const bubbleIds = memberships.map(m => m.bubbleId)
  if (bubbleIds.length === 0) return res.json([])

  // Pour support ou genre : retourner les valeurs distinctes réellement utilisées
  if (type === 'support' || type === 'genre') {
    const contents = await prisma.content.findMany({
      where: { bubbleId: { in: bubbleIds }, [type]: { not: null } },
      select: { [type]: true },
      distinct: [type],
    })
    const values = contents.map(c => c[type]).filter(Boolean).sort()
    return res.json(values.map(v => ({ value: v, type })))
  }

  // Sans filtre de type (ex: admin) → tous les tags
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

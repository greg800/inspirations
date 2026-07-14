import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

// GET /api/stories — les histoires de l'utilisateur connecté, lui seul
router.get('/', requireAuth, async (req, res) => {
  const stories = await prisma.story.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(stories)
})

// POST /api/stories — créer une histoire (titre seul pour l'instant)
router.post('/', requireAuth, async (req, res) => {
  const { title } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: 'Titre requis' })

  const story = await prisma.story.create({
    data: { title: title.trim(), userId: req.user.id },
  })
  res.status(201).json(story)
})

// PATCH /api/stories/:id — modifier une histoire
router.patch('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id)
  const { title } = req.body
  if (!title || !title.trim()) return res.status(400).json({ error: 'Titre requis' })

  const existing = await prisma.story.findUnique({ where: { id } })
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Histoire introuvable' })
  }

  const story = await prisma.story.update({
    where: { id },
    data: { title: title.trim() },
  })
  res.json(story)
})

// DELETE /api/stories/:id — supprimer une histoire
router.delete('/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id)

  const existing = await prisma.story.findUnique({ where: { id } })
  if (!existing || existing.userId !== req.user.id) {
    return res.status(404).json({ error: 'Histoire introuvable' })
  }

  await prisma.story.delete({ where: { id } })
  res.json({ message: 'Histoire supprimée' })
})

export default router

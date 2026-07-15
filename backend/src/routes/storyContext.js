import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { STEPS } from '../lib/steps.js'

// mergeParams : monté sous /api/stories/:storyId/context-summary
const router = Router({ mergeParams: true })
const prisma = new PrismaClient()

// GET — pour chaque étape, l'élément retenu (le mieux noté), afin d'afficher
// sur chaque page « où vous en êtes ». Ne renvoie que du texte + note, pas tout.
router.get('/', requireAuth, async (req, res) => {
  const storyId = parseInt(req.params.storyId)
  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story || story.userId !== req.user.id) {
    return res.status(404).json({ error: 'Histoire introuvable' })
  }

  const steps = []
  for (const step of STEPS) {
    const best = await prisma[step.model].findFirst({
      where: { storyId },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    })
    steps.push({ key: step.key, best: best ? { text: best.text, score: best.score } : null })
  }

  res.json({ story: { id: story.id, title: story.title }, steps })
})

export default router

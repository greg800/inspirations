import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { askClaude } from '../lib/ai.js'
import { PROMPT_KEYS, defaultPrompt } from '../lib/prompts.js'

// mergeParams : le routeur est monté sous /api/stories/:storyId, il doit voir ce param.
const router = Router({ mergeParams: true })
const prisma = new PrismaClient()

export const MAX_WORDS = 200

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// Toutes les routes sont montées sous /api/stories/:storyId/premises.
// On vérifie systématiquement que l'histoire appartient à l'utilisateur connecté.
async function ownedStory(storyId, userId) {
  const story = await prisma.story.findUnique({ where: { id: storyId } })
  if (!story || story.userId !== userId) return null
  return story
}

function validateText(text) {
  if (!text || !text.trim()) return 'Prémisse requise'
  if (countWords(text) > MAX_WORDS) return `La prémisse ne doit pas dépasser ${MAX_WORDS} mots`
  return null
}

function validateScore(score) {
  if (score === undefined || score === null) return null
  if (!Number.isInteger(score) || score < 0 || score > 20) return 'La note doit être un entier entre 0 et 20'
  return null
}

// GET /api/stories/:storyId/premises — triées par note décroissante
router.get('/', requireAuth, async (req, res) => {
  const storyId = parseInt(req.params.storyId)
  const story = await ownedStory(storyId, req.user.id)
  if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

  const premises = await prisma.premise.findMany({
    where: { storyId },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
  })
  res.json({ story: { id: story.id, title: story.title }, premises })
})

// POST /api/stories/:storyId/premises — ajouter une prémisse telle quelle
router.post('/', requireAuth, async (req, res) => {
  const storyId = parseInt(req.params.storyId)
  const story = await ownedStory(storyId, req.user.id)
  if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

  const { text } = req.body
  const error = validateText(text)
  if (error) return res.status(400).json({ error })

  const premise = await prisma.premise.create({
    data: { text: text.trim(), storyId },
  })
  res.status(201).json(premise)
})

// POST /api/stories/:storyId/premises/improve — passer la prémisse à l'IA puis l'ajouter
router.post('/improve', requireAuth, async (req, res) => {
  const storyId = parseInt(req.params.storyId)
  const story = await ownedStory(storyId, req.user.id)
  if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

  const { text } = req.body
  const error = validateText(text)
  if (error) return res.status(400).json({ error })

  const custom = await prisma.aiPrompt.findUnique({
    where: { userId_key: { userId: req.user.id, key: PROMPT_KEYS.PREMISE_IMPROVE } },
  })
  const system = custom?.content || defaultPrompt(PROMPT_KEYS.PREMISE_IMPROVE)

  try {
    const improved = await askClaude({
      feature: 'Prémisse — simplifier et améliorer le style',
      system,
      prompt: text.trim(),
      userId: req.user.id,
    })

    const premise = await prisma.premise.create({
      data: { text: improved, storyId },
    })
    res.status(201).json(premise)
  } catch (err) {
    console.error('[premises/improve]', err)
    res.status(502).json({ error: err.message || "L'appel à l'IA a échoué" })
  }
})

// PATCH /api/stories/:storyId/premises/:id — modifier le texte et/ou la note
router.patch('/:id', requireAuth, async (req, res) => {
  const storyId = parseInt(req.params.storyId)
  const id = parseInt(req.params.id)
  const story = await ownedStory(storyId, req.user.id)
  if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

  const existing = await prisma.premise.findUnique({ where: { id } })
  if (!existing || existing.storyId !== storyId) {
    return res.status(404).json({ error: 'Prémisse introuvable' })
  }

  const { text, score } = req.body
  const textError = validateText(text)
  if (textError) return res.status(400).json({ error: textError })
  const scoreError = validateScore(score)
  if (scoreError) return res.status(400).json({ error: scoreError })

  const premise = await prisma.premise.update({
    where: { id },
    data: { text: text.trim(), ...(score !== undefined ? { score } : {}) },
  })
  res.json(premise)
})

// DELETE /api/stories/:storyId/premises/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const storyId = parseInt(req.params.storyId)
  const id = parseInt(req.params.id)
  const story = await ownedStory(storyId, req.user.id)
  if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

  const existing = await prisma.premise.findUnique({ where: { id } })
  if (!existing || existing.storyId !== storyId) {
    return res.status(404).json({ error: 'Prémisse introuvable' })
  }

  await prisma.premise.delete({ where: { id } })
  res.json({ message: 'Prémisse supprimée' })
})

export default router

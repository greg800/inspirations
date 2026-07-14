import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { askClaude } from './ai.js'
import { defaultPrompt } from './prompts.js'

const prisma = new PrismaClient()

export const MAX_WORDS = 200

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Prémisses et profondeurs sont deux listes de la même forme, rattachées à une
 * histoire : un texte de 200 mots maximum, une note de 0 à 20, ajoutables telles
 * quelles ou après passage par l'IA. Cette fabrique construit le routeur commun.
 *
 * @param delegate   le modèle Prisma (prisma.premise, prisma.depth)
 * @param promptKey  la clé du prompt IA à utiliser pour /improve
 * @param feature    le libellé affiché dans la page Coûts IA
 * @param notFound   le message d'erreur quand la ligne n'existe pas
 */
export function createStoryItemRouter({ delegate, promptKey, feature, notFound }) {
  // mergeParams : le routeur est monté sous /api/stories/:storyId.
  const router = Router({ mergeParams: true })

  async function ownedStory(storyId, userId) {
    const story = await prisma.story.findUnique({ where: { id: storyId } })
    if (!story || story.userId !== userId) return null
    return story
  }

  function validateText(text) {
    if (!text || !text.trim()) return 'Texte requis'
    if (countWords(text) > MAX_WORDS) return `Le texte ne doit pas dépasser ${MAX_WORDS} mots`
    return null
  }

  function validateScore(score) {
    if (score === undefined || score === null) return null
    if (!Number.isInteger(score) || score < 0 || score > 20) {
      return 'La note doit être un entier entre 0 et 20'
    }
    return null
  }

  // Charge la ligne en s'assurant qu'elle appartient bien à l'histoire visée.
  async function ownedItem(id, storyId) {
    const item = await delegate.findUnique({ where: { id } })
    return item && item.storyId === storyId ? item : null
  }

  // Liste, triée par note décroissante
  router.get('/', requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.storyId)
    const story = await ownedStory(storyId, req.user.id)
    if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

    const items = await delegate.findMany({
      where: { storyId },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    })
    res.json({ story: { id: story.id, title: story.title }, items })
  })

  // Ajouter tel quel
  router.post('/', requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.storyId)
    const story = await ownedStory(storyId, req.user.id)
    if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

    const { text } = req.body
    const error = validateText(text)
    if (error) return res.status(400).json({ error })

    const item = await delegate.create({ data: { text: text.trim(), storyId } })
    res.status(201).json(item)
  })

  // Passer par l'IA puis ajouter
  router.post('/improve', requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.storyId)
    const story = await ownedStory(storyId, req.user.id)
    if (!story) return res.status(404).json({ error: 'Histoire introuvable' })

    const { text } = req.body
    const error = validateText(text)
    if (error) return res.status(400).json({ error })

    const custom = await prisma.aiPrompt.findUnique({
      where: { userId_key: { userId: req.user.id, key: promptKey } },
    })
    const system = custom?.content || defaultPrompt(promptKey)

    try {
      const improved = await askClaude({
        feature,
        system,
        prompt: text.trim(),
        userId: req.user.id,
      })
      const item = await delegate.create({ data: { text: improved, storyId } })
      res.status(201).json(item)
    } catch (err) {
      console.error(`[${feature}]`, err)
      res.status(502).json({ error: err.message || "L'appel à l'IA a échoué" })
    }
  })

  // Modifier texte et/ou note
  router.patch('/:id', requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.storyId)
    const id = parseInt(req.params.id)
    const story = await ownedStory(storyId, req.user.id)
    if (!story) return res.status(404).json({ error: 'Histoire introuvable' })
    if (!(await ownedItem(id, storyId))) return res.status(404).json({ error: notFound })

    const { text, score } = req.body
    const textError = validateText(text)
    if (textError) return res.status(400).json({ error: textError })
    const scoreError = validateScore(score)
    if (scoreError) return res.status(400).json({ error: scoreError })

    const item = await delegate.update({
      where: { id },
      data: { text: text.trim(), ...(score !== undefined ? { score } : {}) },
    })
    res.json(item)
  })

  // Supprimer
  router.delete('/:id', requireAuth, async (req, res) => {
    const storyId = parseInt(req.params.storyId)
    const id = parseInt(req.params.id)
    const story = await ownedStory(storyId, req.user.id)
    if (!story) return res.status(404).json({ error: 'Histoire introuvable' })
    if (!(await ownedItem(id, storyId))) return res.status(404).json({ error: notFound })

    await delegate.delete({ where: { id } })
    res.json({ message: 'Supprimé' })
  })

  return router
}

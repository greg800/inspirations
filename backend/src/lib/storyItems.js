import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '../middleware/auth.js'
import { askClaude, askClaudeStructured, summarizeText } from './ai.js'
import { defaultPrompt } from './prompts.js'
import { buildContext, buildUserMessage, stepHasSummary, backfillSummaries } from './steps.js'

const prisma = new PrismaClient()

export const MAX_WORDS = 200

export function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Chaque étape du pipeline (prémisse, profondeur, …) est une liste de la même
 * forme rattachée à une histoire : un texte de 200 mots maximum, une note de 0 à
 * 20, ajoutable telle quelle ou après passage par l'IA. Cette fabrique construit
 * le routeur commun à partir d'une entrée de STEPS (voir lib/steps.js).
 */
export function createStoryItemRouter(step) {
  const { model, promptKey, feature, notFound } = step
  const delegate = prisma[model]
  const hasSummary = stepHasSummary(step.key)

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
      // L'IA doit tenir compte de ce qui a déjà été établi : élément retenu de
      // chaque étape précédente, et tous les textes déjà écrits à cette étape.
      const context = await buildContext(prisma, storyId, step.key)
      const prompt = buildUserMessage(context, text.trim())

      let item
      if (hasSummary) {
        // Réponse + phrase de synthèse produites dans le même appel.
        const { answer, summary } = await askClaudeStructured({ feature, system, prompt, userId: req.user.id })
        item = await delegate.create({ data: { text: answer, summary, storyId } })
      } else {
        const answer = await askClaude({ feature, system, prompt, userId: req.user.id })
        item = await delegate.create({ data: { text: answer, storyId } })
      }
      res.status(201).json(item)

      // À chaque « améliorer et ajouter », on complète les synthèses manquantes
      // du reste de l'histoire (textes ajoutés tels quels, ou plus anciens).
      // En arrière-plan : la réponse ci-dessus reste immédiate.
      backfillSummaries(prisma, storyId, req.user.id).catch(err =>
        console.error('[backfill]', err.message)
      )
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
    const existing = await ownedItem(id, storyId)
    if (!existing) return res.status(404).json({ error: notFound })

    const { text, score } = req.body
    const textError = validateText(text)
    if (textError) return res.status(400).json({ error: textError })
    const scoreError = validateScore(score)
    if (scoreError) return res.status(400).json({ error: scoreError })

    // Si le texte change, l'ancienne synthèse ne le décrit plus : on la
    // régénère. En cas d'échec IA, on la vide plutôt que de garder un faux
    // résumé (le backfill la recréera plus tard).
    let summaryUpdate = {}
    if (hasSummary && text.trim() !== existing.text) {
      try {
        summaryUpdate = { summary: await summarizeText(text.trim(), req.user.id) }
      } catch (err) {
        console.error(`[resummarize ${step.key} #${id}]`, err.message)
        summaryUpdate = { summary: null }
      }
    }

    const item = await delegate.update({
      where: { id },
      data: { text: text.trim(), ...(score !== undefined ? { score } : {}), ...summaryUpdate },
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

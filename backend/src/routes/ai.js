import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { USD_PER_EUR } from '../lib/ai.js'
import { PROMPT_KEYS, PROMPT_LABELS, defaultPrompt } from '../lib/prompts.js'

const router = Router()
const prisma = new PrismaClient()

const KNOWN_KEYS = Object.values(PROMPT_KEYS)

// GET /api/ai/prompts/:key — prompt de l'utilisateur, ou le prompt par défaut
router.get('/prompts/:key', requireAuth, async (req, res) => {
  const { key } = req.params
  if (!KNOWN_KEYS.includes(key)) return res.status(404).json({ error: 'Prompt inconnu' })

  const custom = await prisma.aiPrompt.findUnique({
    where: { userId_key: { userId: req.user.id, key } },
  })
  res.json({
    key,
    label: PROMPT_LABELS[key],
    content: custom?.content || defaultPrompt(key),
    isCustom: Boolean(custom),
    defaultContent: defaultPrompt(key),
  })
})

// PUT /api/ai/prompts/:key — enregistrer une version personnalisée
router.put('/prompts/:key', requireAuth, async (req, res) => {
  const { key } = req.params
  if (!KNOWN_KEYS.includes(key)) return res.status(404).json({ error: 'Prompt inconnu' })

  const { content } = req.body
  if (!content || !content.trim()) return res.status(400).json({ error: 'Le prompt ne peut pas être vide' })

  const prompt = await prisma.aiPrompt.upsert({
    where: { userId_key: { userId: req.user.id, key } },
    update: { content: content.trim() },
    create: { userId: req.user.id, key, content: content.trim() },
  })
  res.json({ key, label: PROMPT_LABELS[key], content: prompt.content, isCustom: true, defaultContent: defaultPrompt(key) })
})

// DELETE /api/ai/prompts/:key — revenir au prompt par défaut
router.delete('/prompts/:key', requireAuth, async (req, res) => {
  const { key } = req.params
  if (!KNOWN_KEYS.includes(key)) return res.status(404).json({ error: 'Prompt inconnu' })

  await prisma.aiPrompt.deleteMany({ where: { userId: req.user.id, key } })
  res.json({ key, label: PROMPT_LABELS[key], content: defaultPrompt(key), isCustom: false, defaultContent: defaultPrompt(key) })
})

// GET /api/ai/costs — montants réellement engagés, agrégés par fonctionnalité (admin)
router.get('/costs', requireAdmin, async (req, res) => {
  const grouped = await prisma.aiCall.groupBy({
    by: ['feature'],
    _sum: { inputTokens: true, outputTokens: true, costUsd: true },
    _count: { _all: true },
    _max: { createdAt: true },
  })

  const features = grouped
    .map(g => {
      const costUsd = g._sum.costUsd || 0
      return {
        feature: g.feature,
        calls: g._count._all,
        tokens: (g._sum.inputTokens || 0) + (g._sum.outputTokens || 0),
        costUsd,
        costEur: costUsd / USD_PER_EUR,
        lastCallAt: g._max.createdAt,
      }
    })
    .sort((a, b) => b.costUsd - a.costUsd)

  const total = features.reduce(
    (acc, f) => ({
      calls: acc.calls + f.calls,
      tokens: acc.tokens + f.tokens,
      costUsd: acc.costUsd + f.costUsd,
      costEur: acc.costEur + f.costEur,
    }),
    { calls: 0, tokens: 0, costUsd: 0, costEur: 0 }
  )

  res.json({ total, features, usdPerEur: USD_PER_EUR })
})

export default router

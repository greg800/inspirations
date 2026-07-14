import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const MODEL = 'claude-opus-4-8'

// Tarifs Anthropic en dollars par million de tokens.
const PRICING = {
  'claude-opus-4-8': { input: 5, output: 25 },
}

// Taux de conversion affiché sur la page Coûts IA.
export const USD_PER_EUR = 0.92

function computeCostUsd(model, inputTokens, outputTokens) {
  const rate = PRICING[model]
  if (!rate) return 0
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000
}

let client = null
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("La clé ANTHROPIC_API_KEY n'est pas configurée sur le serveur")
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

/**
 * Appelle Claude, journalise l'appel (tokens + coût) et renvoie le texte produit.
 * `feature` sert de libellé dans la page Coûts IA.
 */
export async function askClaude({ feature, system, prompt, userId, maxTokens = 1024 }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: prompt }],
  })

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costUsd = computeCostUsd(MODEL, inputTokens, outputTokens)

  // La journalisation ne doit jamais faire échouer l'appel lui-même.
  prisma.aiCall
    .create({
      data: { feature, model: MODEL, inputTokens, outputTokens, costUsd, userId },
    })
    .catch(err => console.error('[ai] journalisation échouée:', err))

  if (response.stop_reason === 'refusal') {
    throw new Error("L'IA a refusé de traiter cette demande")
  }

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()

  if (!text) throw new Error("L'IA n'a produit aucun texte")
  return text
}

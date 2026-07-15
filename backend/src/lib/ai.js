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

// Appel bas niveau : journalise (tokens + coût), gère le refus, renvoie la
// réponse brute. `feature` est le libellé affiché dans la page Coûts IA.
async function callClaude({ feature, system, prompt, userId, maxTokens, outputConfig }) {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: prompt }],
    ...(outputConfig ? { output_config: outputConfig } : {}),
  })

  const inputTokens = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const costUsd = computeCostUsd(MODEL, inputTokens, outputTokens)

  // La journalisation ne doit jamais faire échouer l'appel lui-même.
  prisma.aiCall
    .create({ data: { feature, model: MODEL, inputTokens, outputTokens, costUsd, userId } })
    .catch(err => console.error('[ai] journalisation échouée:', err))

  if (response.stop_reason === 'refusal') {
    throw new Error("L'IA a refusé de traiter cette demande")
  }
  return response
}

function extractText(response) {
  return response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
}

/** Appel simple : renvoie le texte produit. */
export async function askClaude({ feature, system, prompt, userId, maxTokens = 1024 }) {
  const response = await callClaude({ feature, system, prompt, userId, maxTokens })
  const text = extractText(response)
  if (!text) throw new Error("L'IA n'a produit aucun texte")
  return text
}

// Consigne ajoutée au prompt de l'utilisateur pour la sortie à deux champs.
const STRUCTURED_SUFFIX = `

---
TON RENDU. Tu produis un objet JSON avec exactement deux champs :
- "answer" : le texte demandé, rédigé selon les consignes ci-dessus.
- "summary" : UNE seule phrase, ultra concise, qui enveloppe toute l'idée du champ "answer". C'est la synthèse qui sera affichée en un coup d'œil. Pas de préambule, pas de « En résumé ».`

const STRUCTURED_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string', description: 'Le texte demandé, selon les consignes.' },
    summary: {
      type: 'string',
      description: "Une phrase unique et ultra concise résumant toute l'idée du texte.",
    },
  },
  required: ['answer', 'summary'],
  additionalProperties: false,
}

/**
 * Appel structuré : renvoie { answer, summary }. Le format JSON est imposé par
 * l'API (output_config.format), donc le prompt de l'utilisateur ne peut pas le
 * casser — le résumé est toujours produit, dans le même appel que la réponse.
 */
export async function askClaudeStructured({ feature, system, prompt, userId, maxTokens = 2048 }) {
  const response = await callClaude({
    feature,
    system: system + STRUCTURED_SUFFIX,
    prompt,
    userId,
    maxTokens,
    outputConfig: { format: { type: 'json_schema', schema: STRUCTURED_SCHEMA } },
  })

  const raw = extractText(response)
  if (!raw) throw new Error("L'IA n'a produit aucun texte")

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("La réponse de l'IA n'est pas au format attendu")
  }
  const answer = (parsed.answer || '').trim()
  const summary = (parsed.summary || '').trim()
  if (!answer) throw new Error("L'IA n'a produit aucun texte")
  return { answer, summary }
}

/** Génère une phrase de synthèse pour un texte existant (backfill). */
export async function summarizeText(text, userId) {
  return askClaude({
    feature: 'Synthèse — génération de la phrase de résumé',
    system:
      "Tu résumes un texte en UNE seule phrase, ultra concise, qui enveloppe toute l'idée. " +
      'Réponds uniquement par cette phrase, sans guillemets, sans préambule, sans « En résumé ».',
    prompt: text,
    userId,
    maxTokens: 512,
  })
}

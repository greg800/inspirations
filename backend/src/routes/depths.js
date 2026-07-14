import { PrismaClient } from '@prisma/client'
import { createStoryItemRouter } from '../lib/storyItems.js'
import { PROMPT_KEYS } from '../lib/prompts.js'

const prisma = new PrismaClient()

export default createStoryItemRouter({
  delegate: prisma.depth,
  promptKey: PROMPT_KEYS.DEPTH_IMPROVE,
  feature: 'Profondeur — améliorer et ajouter',
  notFound: 'Analyse introuvable',
})

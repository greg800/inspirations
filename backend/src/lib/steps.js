import { PROMPT_KEYS } from './prompts.js'

/**
 * Le pipeline d'écriture, dans l'ordre. Chaque étape s'appuie sur les précédentes.
 *
 * Ajouter une étape = ajouter un modèle Prisma de même forme (text, score,
 * storyId) et une entrée ici. Le contexte IA et les routes en découlent.
 *
 * Champs :
 * - key         identifiant d'étape (route, config front)
 * - model       nom du délégué Prisma (prisma[model])
 * - promptKey   clé du prompt IA
 * - feature     libellé dans la page Coûts IA
 * - notFound    message d'erreur quand la ligne n'existe pas
 * - contextMode 'best' → seul le mieux noté nourrit les étapes suivantes
 *               'all'  → tous les textes, les mieux notés comptant le plus
 * - ctxRetained titre du bloc en mode 'best'
 * - ctxAll      titre du bloc en mode 'all'
 * - ctxWritten  titre du bloc « déjà écrit à cette étape »
 */
export const STEPS = [
  {
    key: 'premise', model: 'premise', promptKey: PROMPT_KEYS.PREMISE_IMPROVE,
    feature: 'Prémisse — simplifier et améliorer le style', notFound: 'Prémisse introuvable',
    contextMode: 'best',
    ctxRetained: 'Prémisse retenue',
    ctxWritten: 'Autres prémisses déjà proposées',
  },
  {
    key: 'depth', model: 'depth', promptKey: PROMPT_KEYS.DEPTH_IMPROVE,
    feature: 'Profondeur — améliorer et ajouter', notFound: 'Analyse introuvable',
    contextMode: 'all',
    ctxAll: 'Analyses de profondeur (les mieux notées comptent le plus)',
    ctxWritten: 'Autres analyses de profondeur déjà écrites',
  },
  {
    key: 'problems', model: 'problem', promptKey: PROMPT_KEYS.PROBLEMS_IMPROVE,
    feature: 'Problèmes et défis — améliorer et ajouter', notFound: 'Note introuvable',
    contextMode: 'all',
    ctxAll: 'Problèmes et défis identifiés (les mieux notés comptent le plus)',
    ctxWritten: 'Autres problèmes/défis déjà écrits',
  },
  {
    key: 'principle', model: 'principle', promptKey: PROMPT_KEYS.PRINCIPLE_IMPROVE,
    feature: 'Principe directeur — améliorer et ajouter', notFound: 'Principe introuvable',
    contextMode: 'best',
    ctxRetained: 'Principe directeur retenu',
    ctxWritten: 'Autres principes directeurs déjà proposés',
  },
  {
    key: 'character', model: 'character', promptKey: PROMPT_KEYS.CHARACTER_IMPROVE,
    feature: 'Meilleur personnage — améliorer et ajouter', notFound: 'Personnage introuvable',
    contextMode: 'all',
    ctxAll: 'Personnages proposés (les mieux notés comptent le plus)',
    ctxWritten: 'Autres personnages déjà proposés',
  },
  {
    key: 'conflict', model: 'conflict', promptKey: PROMPT_KEYS.CONFLICT_IMPROVE,
    feature: 'Conflit central — améliorer et ajouter', notFound: 'Conflit introuvable',
    contextMode: 'best',
    ctxRetained: 'Conflit central retenu',
    ctxWritten: 'Autres formulations du conflit déjà proposées',
  },
  {
    key: 'sequence', model: 'sequence', promptKey: PROMPT_KEYS.SEQUENCE_IMPROVE,
    feature: 'Séquence de cause à effet — améliorer et ajouter', notFound: 'Séquence introuvable',
    contextMode: 'best',
    ctxRetained: 'Séquence de cause à effet retenue',
    ctxWritten: 'Autres séquences déjà proposées',
  },
  {
    key: 'transformation', model: 'transformation', promptKey: PROMPT_KEYS.TRANSFORMATION_IMPROVE,
    feature: 'Transformation du héros — améliorer et ajouter', notFound: 'Note introuvable',
    contextMode: 'best',
    ctxRetained: 'Transformation du héros retenue',
    ctxWritten: 'Autres transformations déjà proposées',
  },
  {
    key: 'dilemma', model: 'dilemma', promptKey: PROMPT_KEYS.DILEMMA_IMPROVE,
    feature: 'Dilemme moral — améliorer et ajouter', notFound: 'Dilemme introuvable',
    contextMode: 'best',
    ctxRetained: 'Dilemme moral retenu',
    ctxWritten: 'Autres dilemmes déjà proposés',
  },
  {
    key: 'reception', model: 'reception', promptKey: PROMPT_KEYS.RECEPTION_IMPROVE,
    feature: 'Réception du public — améliorer et ajouter', notFound: 'Note introuvable',
    contextMode: 'all',
    ctxAll: 'Notes sur la réception du public (les mieux notées comptent le plus)',
    ctxWritten: 'Autres notes de réception déjà écrites',
  },
]

export function stepByKey(key) {
  return STEPS.find(s => s.key === key)
}

async function bestOf(prisma, model, storyId) {
  return prisma[model].findFirst({
    where: { storyId },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
  })
}

async function allOf(prisma, model, storyId) {
  return prisma[model].findMany({
    where: { storyId },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
  })
}

/**
 * Contexte transmis à l'IA pour une étape donnée :
 *
 *   - pour chaque étape PRÉCÉDENTE : selon son contextMode, soit son élément
 *     retenu (le mieux noté), soit TOUS ses textes triés par note décroissante
 *     (les mieux notés comptent le plus). Garde la cohérence avec l'acquis.
 *   - pour l'étape COURANTE : tous les textes déjà écrits, pour que le nouveau
 *     texte les prolonge sans les répéter.
 */
export async function buildContext(prisma, storyId, stepKey) {
  const index = STEPS.findIndex(s => s.key === stepKey)
  if (index === -1) return ''

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  const sections = []

  if (story?.title) sections.push(`Titre de l'histoire : ${story.title}`)

  for (const step of STEPS.slice(0, index)) {
    if (step.contextMode === 'all') {
      const items = await allOf(prisma, step.model, storyId)
      if (items.length > 0) {
        const list = items.map(i => `- (${i.score}/20) ${i.text}`).join('\n')
        sections.push(`${step.ctxAll} :\n${list}`)
      }
    } else {
      const best = await bestOf(prisma, step.model, storyId)
      if (best) sections.push(`${step.ctxRetained} (${best.score}/20) :\n${best.text}`)
    }
  }

  const current = STEPS[index]
  const written = await allOf(prisma, current.model, storyId)
  if (written.length > 0) {
    const list = written.map(w => `- (${w.score}/20) ${w.text}`).join('\n')
    sections.push(`${current.ctxWritten} :\n${list}`)
  }

  return sections.length === 0 ? '' : sections.join('\n\n')
}

/**
 * Message utilisateur : le contexte, puis le texte à réécrire. Le prompt éditable
 * part dans le `system` — l'utilisateur garde la main sur les consignes sans
 * pouvoir casser la structure du contexte.
 */
export function buildUserMessage(context, text) {
  if (!context) return `Texte à réécrire :\n${text}`
  return [
    "CONTEXTE — ce qui a déjà été établi pour cette histoire. Tu dois en tenir compte : le texte que tu produis doit rester cohérent avec ces éléments et les intégrer, sans les répéter mot pour mot.",
    context,
    '---',
    `Texte à réécrire :\n${text}`,
  ].join('\n\n')
}

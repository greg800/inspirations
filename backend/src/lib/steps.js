import { PROMPT_KEYS } from './prompts.js'

/**
 * Le pipeline d'écriture, dans l'ordre. Chaque étape s'appuie sur les précédentes.
 *
 * Pour ajouter une étape (conflit central, principe directeur, personnage…),
 * il suffit d'ajouter un modèle Prisma de la même forme (text, score, storyId)
 * et une entrée ici : le contexte IA et les routes en découlent automatiquement.
 *
 * - model    : nom du délégué Prisma (prisma[model])
 * - retained : comment nommer l'élément retenu de cette étape dans le contexte
 * - written  : comment nommer les textes déjà écrits à cette étape
 */
export const STEPS = [
  {
    key: 'premise',
    model: 'premise',
    promptKey: PROMPT_KEYS.PREMISE_IMPROVE,
    feature: 'Prémisse — simplifier et améliorer le style',
    notFound: 'Prémisse introuvable',
    retained: 'Prémisse retenue',
    written: 'Autres prémisses déjà proposées',
  },
  {
    key: 'depth',
    model: 'depth',
    promptKey: PROMPT_KEYS.DEPTH_IMPROVE,
    feature: 'Profondeur — améliorer et ajouter',
    notFound: 'Analyse introuvable',
    retained: 'Analyse de profondeur retenue',
    written: 'Autres analyses de profondeur déjà écrites',
  },
]

export function stepByKey(key) {
  return STEPS.find(s => s.key === key)
}

/**
 * Assemble le contexte transmis à l'IA pour une étape donnée :
 *
 *   - l'élément RETENU (le mieux noté) de chacune des étapes PRÉCÉDENTES,
 *     pour que le texte produit reste cohérent avec ce qui a été décidé ;
 *   - TOUS les textes déjà écrits à l'étape COURANTE, pour que le nouveau
 *     texte les intègre et ne se contente pas de les répéter.
 *
 * Renvoie une chaîne vide s'il n'y a rien à transmettre.
 */
export async function buildContext(prisma, storyId, stepKey) {
  const index = STEPS.findIndex(s => s.key === stepKey)
  if (index === -1) return ''

  const story = await prisma.story.findUnique({ where: { id: storyId } })
  const sections = []

  if (story?.title) sections.push(`Titre de l'histoire : ${story.title}`)

  // Étapes précédentes : uniquement l'élément retenu.
  for (const step of STEPS.slice(0, index)) {
    const best = await prisma[step.model].findFirst({
      where: { storyId },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    })
    if (best) sections.push(`${step.retained} (${best.score}/20) :\n${best.text}`)
  }

  // Étape courante : tout ce qui a déjà été écrit.
  const current = STEPS[index]
  const written = await prisma[current.model].findMany({
    where: { storyId },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
  })
  if (written.length > 0) {
    const list = written.map(w => `- (${w.score}/20) ${w.text}`).join('\n')
    sections.push(`${current.written} :\n${list}`)
  }

  if (sections.length === 0) return ''
  return sections.join('\n\n')
}

/**
 * Message utilisateur envoyé à Claude : le contexte, puis le texte à réécrire.
 * Le prompt éditable, lui, part dans le `system` — l'utilisateur garde donc la
 * main sur les consignes sans pouvoir casser la structure du contexte.
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

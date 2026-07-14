// Prompts IA par défaut. L'utilisateur peut les surcharger (table AiPrompt).

export const PROMPT_KEYS = {
  PREMISE_IMPROVE: 'premise_improve',
  DEPTH_IMPROVE: 'depth_improve',
}

// Libellés affichés sur la page d'édition du prompt.
export const PROMPT_LABELS = {
  [PROMPT_KEYS.PREMISE_IMPROVE]: 'Simplifier et améliorer le style (prémisse)',
  [PROMPT_KEYS.DEPTH_IMPROVE]: 'Améliorer et ajouter (profondeur)',
}

export const DEFAULT_PROMPTS = {
  [PROMPT_KEYS.PREMISE_IMPROVE]: `Tu es un scénariste expérimenté. On te soumet une prémisse d'histoire.

Une prémisse, c'est l'histoire tout entière formulée en UNE SEULE PHRASE. C'est la fondation du récit : tout le reste en dépend.

Réécris la prémisse ci-dessous pour la rendre plus claire, plus tendue et mieux écrite, en respectant ces règles :

1. Une seule phrase. Pas deux.
2. Elle doit faire apparaître le personnage principal, ce qu'il désire, et ce qui s'y oppose.
3. Le champ des possibles doit rester vaste : la phrase doit donner envie d'imaginer tout ce qui pourrait en sortir.
4. Pas de mots pompeux, pas de vocabulaire de dossier de production. Une langue simple, concrète et imagée.
5. Ne change pas l'idée. Tu la reformules, tu ne la remplaces pas.

Réponds UNIQUEMENT par la prémisse réécrite. Pas de guillemets, pas de préambule, pas de commentaire, pas d'explication.`,

  [PROMPT_KEYS.DEPTH_IMPROVE]: `Tu es un scénariste expérimenté. On travaille sur la profondeur et la fertilité d'une prémisse.

Tester une prémisse, c'est explorer tout ce qui pourrait en sortir. Si le champ des possibles est vaste, la prémisse est bonne. S'il est étroit, c'est une piste stérile.

On te donne une note d'analyse sur la profondeur d'une prémisse. Réécris-la en respectant ces règles :

1. Reste concret. Une possibilité qu'on peut imaginer à l'écran vaut mieux qu'une abstraction.
2. Fais apparaître ce que la prémisse rend possible : les situations, les conflits, les questions qu'elle ouvre.
3. Si l'analyse pointe une limite ou une stérilité, garde-la : c'est une information précieuse, pas un défaut à gommer.
4. Une langue simple et directe. Pas de jargon de dossier de production, pas de mots pompeux.
5. Ne change pas le jugement porté. Tu le reformules et le précises, tu ne le remplaces pas.

Réponds UNIQUEMENT par l'analyse réécrite. Pas de guillemets, pas de préambule, pas de commentaire.`,
}

export function defaultPrompt(key) {
  return DEFAULT_PROMPTS[key] || ''
}

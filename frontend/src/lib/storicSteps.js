// Configuration UI des étapes de Storic. L'ordre et les clés reflètent le
// pipeline backend (lib/steps.js). Ajouter une étape = une entrée ici + une
// entrée backend. Chaque étape porte tout ce dont la page a besoin.
//
// - key        identifiant (route /storic/:storyId/<key>, sauf premise à la racine)
// - block      bloc de la méthode auquel l'étape appartient (voir STORIC_BLOCKS)
// - path       sous-chemin API (premises, depths, problems…)
// - label      libellé court (bandeau « où vous en êtes », fil d'Ariane du bas)
// - title      titre de la page
// - subtitle   phrase de la méthode qui cadre l'étape
// - guidance   aides détaillées pour bien remplir (puces)
// - placeholder texte du champ de saisie
// - tableHeader en-tête de la colonne texte du tableau
// - promptKey  clé du prompt IA (page crayon)
// - ctaImprove libellé du bouton IA
// - ctaAdd     libellé du bouton « ajouter tel quel »

// Les 7 grands blocs de la méthode, dans l'ordre — fil d'Ariane du header.
// `pending` : bloc pas encore développé (flèche grise, non cliquable).
export const STORIC_BLOCKS = [
  { key: 'premise', letter: 'P', label: 'Prémisse' },
  { key: 'structure', letter: 'S', label: 'Structure' },
  { key: 'hero', letter: 'H', label: 'Héros', pending: true },
  { key: 'theme', letter: 'T', label: 'Thème et univers', pending: true },
  { key: 'plot', letter: 'I', label: 'Intrigue', pending: true },
  { key: 'scene', letter: 'S', label: 'Scène', pending: true },
  { key: 'dialogue', letter: 'D', label: 'Dialogues', pending: true },
]

export const STORIC_STEPS = [
  {
    key: 'premise',
    block: 'premise',
    path: 'premises',
    label: 'Prémisse',
    title: 'Prémisse',
    subtitle: "Une prémisse, c'est l'histoire tout entière formulée en une seule phrase.",
    guidance: [
      "C'est la fondation : tout le reste en dépendra. Une bonne prémisse tient en UNE phrase.",
      "Elle fait apparaître le personnage principal, ce qu'il désire, et ce qui s'y oppose.",
      "Bon test : imaginez tout ce qui pourrait en sortir. Si le champ des possibles est vaste, la prémisse est bonne.",
      "Exemple (Tootsie) : « Un acteur sans travail se déguise en femme, décroche un rôle dans une série, puis tombe amoureux d'une comédienne de l'équipe. »",
    ],
    placeholder: "Proposez une prémisse en une phrase…",
    tableHeader: 'Prémisse',
    promptKey: 'premise_improve',
    ctaImprove: 'Simplifier et améliorer le style',
    ctaAdd: 'Ajouter sans modifier',
  },
  {
    key: 'depth',
    block: 'premise',
    path: 'depths',
    label: 'Profondeur',
    title: 'Profondeur',
    subtitle: "Si le champ des possibles est vaste, la prémisse est bonne. S'il est étroit, c'est une piste stérile.",
    guidance: [
      "Décrivez ce que la prémisse retenue rend POSSIBLE : les situations, les conflits, les questions qu'elle ouvre.",
      "Testez-la comme on teste Jurassic Park : « et si le système de sécurité tombait en panne ? et si les animaux se reproduisaient ? »",
      "Une piste jugée pauvre est une information utile, pas un défaut : notez-la telle quelle.",
      "Ajoutez plusieurs analyses : elles comptent toutes dans la suite, les mieux notées davantage.",
    ],
    placeholder: "Que rend possible cette prémisse ? Explorez sa fertilité…",
    tableHeader: 'Profondeur',
    promptKey: 'depth_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'problems',
    block: 'premise',
    path: 'problems',
    label: 'Problèmes et défis',
    title: 'Problèmes et défis',
    subtitle: "Chaque bonne histoire pose une difficulté centrale qu'elle devra surmonter.",
    guidance: [
      "Nommez le vrai défi : celui qui ferait échouer l'histoire s'il n'était pas relevé.",
      "Formulez-le comme une question concrète, pas comme une généralité.",
      "Exemple (Star Wars) : comment rendre un futur crédible ?",
      "Exemple (Forrest Gump) : comment un héros handicapé peut-il mener l'intrigue en tenant l'équilibre entre fantaisie et sentiments authentiques ?",
    ],
    placeholder: "Quel défi cette histoire doit-elle relever pour fonctionner ?",
    tableHeader: 'Problème / défi',
    promptKey: 'problems_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'principle',
    block: 'premise',
    path: 'principle',
    label: 'Principe directeur',
    title: 'Principe directeur',
    subtitle: "Ce qui organise l'histoire en tant que tout : sa logique interne, ce qui la rend originale.",
    guidance: [
      "Ce n'est PAS la prémisse. C'est le ciment qui relie toutes les parties et rend l'histoire unique.",
      "Une seule phrase, à garder en tête tout au long de l'écriture.",
      "Exemple (Tootsie) : « Forcer un macho à vivre dans la peau d'une femme. »",
      "Exemple (Harry Potter) : « Un prince magicien apprend à devenir un homme et un roi en passant sept années dans une école de sorciers. »",
    ],
    placeholder: "La logique interne qui organise toute l'histoire, en une phrase…",
    tableHeader: 'Principe directeur',
    promptKey: 'principle_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'character',
    block: 'premise',
    path: 'character',
    label: 'Meilleur personnage',
    title: 'Meilleur personnage',
    subtitle: "Le meilleur personnage n'est pas le plus sympathique, mais le plus fascinant, complexe et stimulant.",
    guidance: [
      "Cherchez la contradiction, le mystère, la faille : ce qui le rend fascinant.",
      "Ce qui compte, c'est que le public le comprenne — pas qu'il l'approuve.",
      "Si ce personnage n'est pas le héros pressenti, dites-le : l'histoire gagnerait à le mettre au centre.",
      "Décrivez faiblesse, désir et valeurs : c'est ce qui le rend vivant.",
    ],
    placeholder: "Qui est le personnage le plus fascinant que cette histoire fait naître ?",
    tableHeader: 'Personnage',
    promptKey: 'character_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'conflict',
    block: 'premise',
    path: 'conflict',
    label: 'Conflit central',
    title: 'Conflit central',
    subtitle: "Le conflit central répond en une phrase simple : qui combat qui, pour quoi ?",
    guidance: [
      "Une seule phrase : qui / contre qui / pour quel enjeu.",
      "Le héros et son adversaire doivent viser le MÊME objectif — c'est ce qui rend le combat serré.",
      "L'adversaire n'est pas forcément le mal : c'est un concurrent qui veut la même chose que le héros.",
      "Comme au tennis, une partie n'est intéressante qu'avec deux excellents joueurs sur le terrain.",
    ],
    placeholder: "Qui combat qui, pour quoi ?",
    tableHeader: 'Conflit central',
    promptKey: 'conflict_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'sequence',
    block: 'premise',
    path: 'sequence',
    label: 'Séquence de cause à effet',
    title: 'Séquence unique de cause à effet',
    subtitle: "Quelle est l'action principale de mon héros, du début à la fin ?",
    guidance: [
      "Une seule phrase qui nomme l'action principale du héros.",
      "Elle relie ce que le héros FAIT à ce qu'il cherche à obtenir.",
      "Exemple (Star Wars) : « Un jeune homme utilise ses talents de combattant pour vaincre l'empire galactique. »",
      "C'est le fil que le public suivra d'un bout à l'autre.",
    ],
    placeholder: "L'action principale du héros, en une phrase…",
    tableHeader: 'Séquence de cause à effet',
    promptKey: 'sequence_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'transformation',
    block: 'premise',
    path: 'transformation',
    label: 'Transformation du héros',
    title: 'Transformation du héros',
    subtitle: "Au début, le héros a des faiblesses. L'action principale doit l'obliger à les affronter et à changer.",
    guidance: [
      "Nommez le point de départ et le point d'arrivée : d'où part le héros, où il arrive.",
      "Montrez comment l'action principale le force à affronter sa faiblesse.",
      "La graine du changement doit être présente dès le début et éclore à la fin.",
      "Axes possibles : d'enfant à adulte, d'adulte à leader, de cynique à engagé…",
    ],
    placeholder: "De quelle faiblesse le héros part-il, et vers quoi se transforme-t-il ?",
    tableHeader: 'Transformation',
    promptKey: 'transformation_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'dilemma',
    block: 'premise',
    path: 'dilemma',
    label: 'Dilemme moral',
    title: 'Dilemme moral',
    subtitle: "Vers la fin, le héros hésite entre deux choix proches — souvent deux choix positifs.",
    guidance: [
      "Formulez les DEUX options entre lesquelles le héros doit trancher.",
      "Les deux doivent être défendables : pas un bien contre un mal évident, mais deux valeurs qui s'affrontent.",
      "C'est la difficulté de l'arbitrage qui donne sa valeur au choix.",
      "Le dilemme découle de la transformation et du conflit déjà posés.",
    ],
    placeholder: "Entre quels deux choix proches le héros doit-il trancher ?",
    tableHeader: 'Dilemme moral',
    promptKey: 'dilemma_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'reception',
    block: 'premise',
    path: 'reception',
    label: 'Réception du public',
    title: 'Réception du public',
    subtitle: "Une histoire doit être personnelle (pour être originale) et universelle (pour toucher d'autres que l'auteur).",
    guidance: [
      "Dites en quoi l'histoire est singulière, et en quoi elle est universelle.",
      "Nommez l'émotion ou la question que n'importe quel spectateur pourra faire sienne.",
      "Exemple (Breaking Bad) : une situation très particulière (un prof de chimie qui fabrique de la méthamphétamine) qui touche à des peurs universelles : la mort, l'argent, protéger les siens.",
      "Appuyez-vous sur tout ce qui a été établi aux étapes précédentes.",
    ],
    placeholder: "En quoi cette histoire est-elle à la fois personnelle et universelle ?",
    tableHeader: 'Réception du public',
    promptKey: 'reception_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },

  // ---- Bloc « Structure » : les 7 étapes de la charpente narrative ----
  {
    key: 'weakness',
    block: 'structure',
    path: 'weakness',
    label: 'Faiblesse et besoin',
    title: 'Faiblesse et besoin',
    subtitle: "Le héros a des faiblesses importantes qu'il tentera de supprimer au fil de l'histoire.",
    guidance: [
      "Deux besoins, pas un. Le besoin PSYCHOLOGIQUE : régler un défaut qui le fait souffrir lui. Le besoin MORAL : apprendre à ne plus faire souffrir les autres.",
      "Le test qui tranche : il n'y a besoin moral QUE si le héros blesse au moins un autre personnage au début. Sinon, la faiblesse n'est que psychologique — et c'est l'erreur la plus fréquente.",
      "Ordre de construction : partez du besoin psychologique, déduisez-en la faiblesse morale qu'il entraîne, puis le besoin moral.",
      "Exemple (Le Silence des agneaux) : Clarice est inexpérimentée et hantée par ses souvenirs d'enfance ; elle a besoin de vaincre ses peurs pour devenir une professionnelle respectée.",
    ],
    placeholder: "Quelle est sa faiblesse ? Son besoin psychologique ? Qui blesse-t-il au début ?",
    tableHeader: 'Faiblesse et besoin',
    promptKey: 'weakness_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'desire',
    block: 'structure',
    path: 'desire',
    label: 'Désir',
    title: 'Désir',
    subtitle: "Ce que le héros veut obtenir à tout prix : la piste que le public suit d'un bout à l'autre.",
    guidance: [
      "Le désir naît du besoin : un lion a besoin de manger, il voit une antilope, il désire l'attraper.",
      "Désir et besoin ne sont pas au même niveau. Le désir est ce que le public croit être le sujet — la surface. Le besoin reste invisible, sous la surface : c'est le vrai sujet.",
      "Trois règles : une SEULE ligne de désir, un désir PRÉCIS, et un désir ACCOMPLI à la fin.",
      "Précis veut dire vérifiable : on doit pouvoir dire à la dernière page s'il l'a obtenu ou non.",
    ],
    placeholder: "Que veut le héros, précisément, du début à la fin ?",
    tableHeader: 'Désir',
    promptKey: 'desire_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'adversary',
    block: 'structure',
    path: 'adversary',
    label: 'Adversaire',
    title: 'Adversaire',
    subtitle: "L'adversaire n'incarne pas le mal : c'est un concurrent qui veut le même objectif que le héros.",
    guidance: [
      "Méthode : partez de l'objectif du héros. Toute personne qui cherche à l'empêcher de l'atteindre est un adversaire.",
      "Héros et adversaire se battent pour imposer leur version de la réalité. Comme au tennis, la partie n'est intéressante qu'avec deux excellents joueurs.",
      "Multipliez : un adversaire principal et deux secondaires. Avec quatre personnages, il y a six relations ; avec un seul adversaire, une seule.",
      "Pour chaque adversaire, déterminez les mêmes cinq attributs que pour le héros : faiblesse, besoin, désir, valeurs, transformation.",
    ],
    placeholder: "Qui veut la même chose que le héros, et pourquoi a-t-il raison de la vouloir ?",
    tableHeader: 'Adversaire',
    promptKey: 'adversary_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'plan',
    block: 'structure',
    path: 'plan',
    label: 'Plan du héros',
    title: 'Plan du héros',
    subtitle: "La stratégie que le héros élabore pour vaincre l'adversaire et atteindre son objectif.",
    guidance: [
      "Le plan initial DOIT échouer. Si le héros n'a qu'à le suivre, l'intrigue devient prévisible et le héros superficiel.",
      "À ce stade l'adversaire est encore trop fort : le héros devra se creuser la cervelle et bâtir une meilleure stratégie, qui tienne compte des armes de l'adversaire.",
      "Décrivez aussi le plan de l'ADVERSAIRE : la force de l'intrigue est indexée dessus. Plus il est développé et ingénieux, plus l'histoire est forte.",
      "Un plan se raconte en actes concrets, pas en intentions.",
    ],
    placeholder: "Quel est son plan ? Pourquoi va-t-il échouer ? Et quel est le plan de l'adversaire ?",
    tableHeader: 'Plan du héros',
    promptKey: 'plan_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'confrontation',
    block: 'structure',
    path: 'confrontation',
    label: 'Confrontation finale',
    title: 'Confrontation finale',
    subtitle: "Vers le milieu de l'histoire, puis à son terme, héros et adversaire s'affrontent directement.",
    guidance: [
      "C'est là que se décide lequel des deux impose sa version de la réalité.",
      "L'enjeu doit être maximal pour les deux camps : dites ce que chacun risque de perdre.",
      "L'arène se rétrécit toujours pour les scènes finales, aussi vaste soit-elle au départ.",
      "Cherchez le face-à-face physique, pas l'affrontement d'idées à distance.",
    ],
    placeholder: "Où et comment s'affrontent-ils ? Que risque chacun ?",
    tableHeader: 'Confrontation finale',
    promptKey: 'confrontation_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'awareness',
    block: 'structure',
    path: 'awareness',
    label: 'Prise de conscience',
    title: 'Prise de conscience',
    subtitle: "Le héros comprend — sur lui-même, et sur le monde.",
    guidance: [
      "C'est le sommet de l'histoire. La méthode recommande d'ailleurs de COMMENCER la construction par là, puis de revenir au début préciser le besoin et le désir.",
      "Elle résout les deux besoins posés à la première étape : le psychologique et le moral.",
      "Elle doit être gagnée par l'épreuve, jamais énoncée. Dites ce qui la déclenche.",
      "La révélation ne touche pas que le héros : le public aussi entrevoit comment il faudrait agir et vivre. Nommez ce qu'il comprend, lui.",
    ],
    placeholder: "Que comprend le héros sur lui-même, et sur le monde ?",
    tableHeader: 'Prise de conscience',
    promptKey: 'awareness_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
  {
    key: 'equilibrium',
    block: 'structure',
    path: 'equilibrium',
    label: 'Nouvel équilibre',
    title: 'Nouvel équilibre',
    subtitle: "L'état du monde et du héros après la transformation.",
    guidance: [
      "Tout revient au calme, mais à un niveau différent : le héros a adopté un nouveau comportement moral.",
      "Montrez ce qu'il fait maintenant qu'il ne faisait pas au début. C'est la preuve de la transformation.",
      "Le monde est l'expression physique de ce qu'est devenu le héros : un héros libéré crée souvent un monde de liberté.",
      "Le désir posé à la deuxième étape doit trouver ici son aboutissement — accompli, ou payé.",
    ],
    placeholder: "Où en sont le héros et le monde à la fin ?",
    tableHeader: 'Nouvel équilibre',
    promptKey: 'equilibrium_improve',
    ctaImprove: 'Améliorer et ajouter',
    ctaAdd: 'Ajouter',
  },
]

export function stepByKey(key) {
  return STORIC_STEPS.find(s => s.key === key)
}

export function stepIndex(key) {
  return STORIC_STEPS.findIndex(s => s.key === key)
}

// Les étapes d'un bloc, dans l'ordre du pipeline.
export function stepsOfBlock(blockKey) {
  return STORIC_STEPS.filter(s => s.block === blockKey)
}

// Chemin d'une étape : la prémisse vit à la racine de l'histoire.
export function stepPath(storyId, stepKey) {
  return stepKey === 'premise' ? `/storic/${storyId}` : `/storic/${storyId}/${stepKey}`
}

/**
 * Avancement d'un bloc, de 0 à 1 : la part de ses étapes qui portent au moins
 * un élément. `filled` est un Set des clés d'étapes déjà renseignées.
 * Un bloc pas encore développé n'a aucune étape — il reste à 0.
 */
export function blockProgress(blockKey, filled) {
  const steps = stepsOfBlock(blockKey)
  if (steps.length === 0) return 0
  return steps.filter(s => filled.has(s.key)).length / steps.length
}

// La prémisse et le principe directeur s'affichent en entier dans « Où vous en
// êtes » ; toutes les autres étapes y montrent leur phrase de synthèse.
const NO_SUMMARY = new Set(['premise', 'principle'])

export function stepHasSummary(key) {
  return !NO_SUMMARY.has(key)
}

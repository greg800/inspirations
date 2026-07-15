// Configuration UI des étapes de Storic. L'ordre et les clés reflètent le
// pipeline backend (lib/steps.js). Ajouter une étape = une entrée ici + une
// entrée backend. Chaque étape porte tout ce dont la page a besoin.
//
// - key        identifiant (route /storic/:storyId/<key>, sauf premise à la racine)
// - path       sous-chemin API (premises, depths, problems…)
// - label      libellé court (bandeau « où vous en êtes »)
// - title      titre de la page
// - subtitle   phrase de la méthode qui cadre l'étape
// - guidance   aides détaillées pour bien remplir (puces)
// - placeholder texte du champ de saisie
// - tableHeader en-tête de la colonne texte du tableau
// - promptKey  clé du prompt IA (page crayon)
// - ctaImprove libellé du bouton IA
// - ctaAdd     libellé du bouton « ajouter tel quel »
// - next       { key, label } de l'étape suivante, ou null pour la dernière

export const STORIC_STEPS = [
  {
    key: 'premise',
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
    next: { key: 'depth', label: 'Évaluer la profondeur' },
  },
  {
    key: 'depth',
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
    next: { key: 'problems', label: 'Évaluer les problèmes et défis' },
  },
  {
    key: 'problems',
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
    next: { key: 'principle', label: 'Définir le principe directeur' },
  },
  {
    key: 'principle',
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
    next: { key: 'character', label: 'Choisir le meilleur personnage' },
  },
  {
    key: 'character',
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
    next: { key: 'conflict', label: 'Cerner le conflit central' },
  },
  {
    key: 'conflict',
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
    next: { key: 'sequence', label: 'Décrire la séquence de cause à effet' },
  },
  {
    key: 'sequence',
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
    next: { key: 'transformation', label: 'Explorer la transformation du héros' },
  },
  {
    key: 'transformation',
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
    next: { key: 'dilemma', label: 'Définir le dilemme moral' },
  },
  {
    key: 'dilemma',
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
    next: { key: 'reception', label: 'Penser à la réception du public' },
  },
  {
    key: 'reception',
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
    next: null,
  },
]

export function stepByKey(key) {
  return STORIC_STEPS.find(s => s.key === key)
}

export function stepIndex(key) {
  return STORIC_STEPS.findIndex(s => s.key === key)
}

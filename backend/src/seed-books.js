import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

// Helper pour télécharger une image
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) { resolve(destPath); return }
    const proto = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)
    proto.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close()
        try { fs.unlinkSync(destPath) } catch(e) {}
        downloadImage(res.headers.location, destPath).then(resolve).catch(reject)
        return
      }
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        const stats = fs.statSync(destPath)
        if (stats.size < 1000) {
          fs.unlinkSync(destPath)
          reject(new Error('Image trop petite (probablement placeholder)'))
        } else {
          resolve(destPath)
        }
      })
    }).on('error', (err) => {
      try { fs.unlinkSync(destPath) } catch(e) {}
      reject(err)
    })
  })
}

// Générer un SVG placeholder si pas d'image trouvée
function createPlaceholderSVG(destPath, title, author) {
  const shortTitle = title.substring(0, 22)
  const svg = `<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="400" fill="#3D1A00"/>
  <rect x="20" y="20" width="260" height="360" fill="#E8752A" opacity="0.15"/>
  <text x="150" y="180" font-family="Georgia,serif" font-size="18" fill="white" text-anchor="middle" dominant-baseline="middle">${shortTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
  <text x="150" y="220" font-family="Georgia,serif" font-size="13" fill="#E8752A" text-anchor="middle">${author.substring(0, 25).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
</svg>`
  fs.writeFileSync(destPath, svg)
  return destPath
}

const books = [
  {
    title: "Art of the Deal",
    author: "Donald Trump",
    genre: "Business",
    rating: 12,
    coverFile: "book-art-of-the-deal.jpg",
    whyRead: "Le plus grand actif que tu puisses construire, ce n'est pas un projet — c'est ton nom. Trump démontre que le deal n'est pas un plan figé mais un flux continu de conversations, d'options maximisées et de marque construite comme actif principal.",
    summary: `Le deal n'est pas un plan mais un flux continu de conversations. Penser grand, protéger le downside, maximiser les options et construire sa marque comme actif principal.

La méthode Trump en 9 règles:
1. Think Big — un grand projet attire médias, politiques et financiers. La taille est un outil de négociation.
2. Protect the Downside — avant de penser au gain, structurer pour ne pas perdre.
3. Maximize Your Options — celui qui a le plus d'options gagne la négociation.
4. Know Your Market — connaître les chiffres mieux que les autres pour repérer où ils se trompent.
5. Use Your Leverage — qui a le plus besoin de ce deal ?
6. Enhance Your Location — vendre une vision, pas un bien.
7. Get the Word Out — la publicité vaut plus que l'argent.
8. Fight Back — ne jamais laisser une attaque sans réponse.
9. Deliver the Goods — une fois le deal signé, livrer vite.

La leçon du Grand Hyatt: Trump n'avait pas l'argent. Il a orchestré la ville, Hyatt, les banques et les propriétaires du terrain. Il ne possède rien. Il orchestre tout. Il devient la solution commune.

La marque comme actif ultime: Il ne vend plus des m², des hôtels ou des casinos. Il vend la marque TRUMP. Plus tard, il fera des tours qu'il ne finance même pas — il prête son nom et prend un pourcentage.

L'art de la négociation: Le silence laisse l'autre parler longtemps. Faire durer fatigue l'autre. Créer de l'incertitude : ne jamais montrer qu'il a besoin du deal. Règle d'or : celui qui semble le moins pressé gagne.`,
  },
  {
    title: "Why Information Grows",
    author: "César Hidalgo",
    genre: "Sciences",
    rating: 8,
    coverFile: "book-why-information-grows.jpg",
    whyRead: "Un iPhone n'existe d'abord que dans l'imagination humaine. Les objets sont de la cristallisation de l'imagination. La balance commerciale en dollars oublie l'essentiel : la vraie richesse des nations réside dans leur capacité à cristalliser du savoir-faire en objets.",
    summary: `La richesse des nations réside dans leur capacité à cristalliser de l'imagination en objets. La connaissance et le savoir-faire s'accumulent dans les personnes, les firmes et les réseaux.

L'idée centrale: La différence entre une fleur et un iPhone : la fleur n'existe pas d'abord dans l'imagination. L'iPhone, si. Les objets sont de la cristallisation de l'imagination. La richesse réelle d'un pays, c'est sa capacité à cumuler cette cristallisation.

L'exemple Chili vs Corée du Sud: Le Chili exporte du cuivre, importe des voitures et de l'électronique. En dollars, le Chili est bénéficiaire. Mais en cristallisation de l'imagination, il est grandement déficitaire.

Connaissance vs Savoir-faire:
- Connaissance : fumer provoque le cancer — peut être transmise par écrit
- Savoir-faire : marcher — s'apprend seulement par pratique
Le savoir-faire ne s'exporte pas facilement. Il réside dans les personnes.

Les limites de traitement:
- 1 personbyte : maximum qu'une personne peut maîtriser
- 1 firmbyte : maximum qu'une firme peut maîtriser
Pour créer des objets complexes sans être limité : travailler en réseau. Plus les connexions sont cheap, plus le système accumule de connaissances.

La confiance comme actif économique: La confiance réduit le coût des connexions. Faire confiance est plus rapide que rédiger un contrat de 100 pages. Le réseau social compte pour 50% de notre capacité à accéder à des opportunités.

Un bon coach n'est pas celui qui construit le meilleur plan. C'est celui qui arrive à le faire rentrer dans la tête de son équipe. C'est pour ça que coacher des robots n'a aucun intérêt.`,
  },
  {
    title: "Stellar",
    author: "Tony Seba",
    genre: "Énergie",
    rating: 16,
    coverFile: "book-stellar.jpg",
    whyRead: "Le futur Stellar ne se programme pas, il se gouverne. La vraie question : qui écrit les règles de l'abondance ? La rareté n'est pas une loi naturelle — c'est une contrainte technologique. La convergence solaire, batteries et IA va tout changer.",
    summary: `La rareté n'est pas une loi naturelle — c'est une contrainte technologique. La convergence solaire + batteries + IA crée l'abondance énergétique, qui redistribue toute la valeur économique.

En une phrase : L'énergie devient abondante, distribuée et quasi gratuite — et cela change tout.

Diagnostic : une civilisation fondée sur la rareté: Toute civilisation est structurée par son système énergétique. Pendant des millénaires, l'humanité a vécu dans un monde où l'énergie était rare et chère, la production était difficile, la coordination à grande échelle était limitée. Ce modèle extractif produit mécaniquement : inégalités, conflits, destruction écologique. Ces problèmes ne sont pas des accidents — ils sont structurels.

L'idée centrale : la rareté n'est pas une loi naturelle: La rareté est une conséquence du niveau technologique et du coût de l'énergie. Quand ces paramètres changent, la rareté cesse d'organiser la société. Dans un monde extractif, chaque unité coûte autant que la précédente. Dans un monde technologique, le coût marginal chute, puis tend vers zéro.

La convergence technologique: Aucune technologie seule ne change une civilisation. Les ruptures viennent de la convergence : énergie solaire (source abondante), batteries (stockage et pilotabilité), intelligence artificielle (optimisation globale), robotique (automatisation). Ensemble, elles font chuter les coûts structurels et rendent les systèmes pilotables.

Le monde Stellar : nouvelle logique de valeur: Dans le monde Stellar, la valeur ne vient plus de la possession mais de l'orchestration des systèmes. La question centrale : comment coordonner une abondance massive sans chaos ? Le vrai danger : l'abondance peut aggraver les inégalités via les effets réseau et la captation des données.`,
  },
  {
    title: "Quel est notre problème ?",
    author: "Tim Urban",
    genre: "Philosophie",
    rating: 20,
    coverFile: "book-quel-est-notre-probleme.jpg",
    whyRead: "Nous avons la puissance des dieux avec la psychologie des papillons de nuit. Notre problème n'est pas la technologie mais notre incapacité collective à l'accompagner de sagesse. L'Échelle (scientifique → fan de sport → avocat → zélote) est le cadre le plus utile que j'aie trouvé pour comprendre le débat public.",
    summary: `La société moderne a une puissance de dieux avec la psychologie de papillons de nuit. Notre problème n'est pas la technologie mais notre incapacité collective à l'accompagner de sagesse.

La thèse centrale: Nous avons la puissance des dieux avec la psychologie des papillons de nuit. La technologie est exponentielle. Les enjeux augmentent. La société régresse. Ce décalage est notre problème collectif le plus urgent.

L'Échelle — le cadre conceptuel clé: Tim Urban classe la pensée humaine en 4 niveaux : 1) Scientifique — Cherche la vérité, révise ses croyances. 2) Fan de sport — Veut la vérité mais préférerait gagner. 3) Avocat — Défend une position, ignore les preuves contraires. 4) Zélote — La croyance est sacrée, tout désaccord est une attaque. Notre problème : la politique, les médias et les réseaux sociaux nous poussent vers les échelons 3 et 4.

Le tribalisme suralimenté: Du tribalisme distribué (normal et gérable) au tribalisme concentré (la politique comme tribu unique) au tribalisme suralimenté (algorithmes + chambre d'écho). Chaque étape rend le débat démocratique plus impossible.

La métaphore Motte & Bailey: Technique rhétorique : avancer une thèse radicale (Bailey), se replier sur une évidence (Motte) quand critiqué, puis retourner au Bailey comme si la thèse radicale avait été validée.

Le message d'espoir: L'avenir n'est pas écrit. Chacun peut remonter l'Échelle en cultivant l'humilité intellectuelle et en acceptant de réviser ses croyances. Collectivement : reconstruire des universités libres, des médias qui valorisent la nuance, des institutions qui protègent la liberté d'expression.`,
  },
  {
    title: "2052 : A Global Forecast for the Next Forty Years",
    author: "Jørgen Randers",
    genre: "Sciences",
    rating: 12,
    coverFile: "book-2052.jpg",
    whyRead: "Le monde n'agira pas assez vite pour éviter un réchauffement dangereux, mais certaines régions et technologies montreront la voie. Randers, co-auteur du rapport Limites à la croissance de 1972, livre 40 ans plus tard une projection quantitative et sans complaisance du monde en 2052.",
    summary: `Une projection quantitative du monde à l'horizon 2052 : croissance ralentie, émission de carbone persistante malgré les efforts, et les sociétés qui se transforment par nécessité plutôt que par vision.

La démarche: Jorgen Randers, co-auteur du rapport Limites à la croissance (1972), livre 40 ans plus tard une projection quantitative du monde en 2052.

Les grandes tendances projetées:
- Démographie : la population mondiale plafonne plus tôt que prévu, vers 8 milliards
- Économie : la croissance mondiale ralentit structurellement
- Énergie : transition forcée par l'épuisement et le coût, pas par la volonté politique
- Climat : les émissions persistent, le réchauffement dépasse 2°C
- Société : les sociétés s'adaptent par nécessité plutôt que par anticipation

Le dilemme fondamental: Les démocraties modernes ont du mal à agir sur des horizons de 40 ans. Les systèmes électoraux favorisent le court terme. Les changements viendront non pas des décisions politiques mais des contraintes physiques et économiques.

L'idée clé: Le monde n'agira pas assez vite pour éviter un réchauffement dangereux. Mais certaines régions et technologies montreront la voie, et l'adaptation forcera les changements que la prévision n'a pas réussi à déclencher.`,
  },
  {
    title: "Les 4 accords toltèques",
    author: "Don Miguel Ruiz",
    genre: "Développement personnel",
    rating: 16,
    coverFile: "book-4-accords-tolteques.jpg",
    whyRead: "Que ta parole soit impeccable. N'en fais pas une affaire personnelle. Ne fais pas de suppositions. Fais toujours de ton mieux. Ces 4 accords suffisent pour se libérer de la domestication et du rêve collectif dans lequel nous vivons depuis l'enfance.",
    summary: `Nous vivons dans un rêve collectif. Nos croyances ont été installées pendant l'enfance. 4 accords suffisent pour se libérer de la domestication.

Le cadre : le rêve de la planète: Nous vivons dans un rêve permanent — parfois individuel, parfois collectif. Pendant l'enfance (la domestication), le système de croyances du monde nous est transmis et devient notre livre de la loi intérieure. Nous passons 99% de notre temps prisonniers et agissons pour faire plaisir aux autres afin d'être acceptés.

Les 4 accords:
1. Que ta parole soit impeccable: La parole est l'arme la plus puissante d'un être humain. Impeccable = sans péché = sans aller contre soi-même. Une parole peut changer une vie ou la détruire. C'est de la magie pure — et son mauvais usage est de la magie noire.
2. N'en fais pas une affaire personnelle: Ce que les autres font dépend d'eux, pas de toi. Celui qui critique a peur de quelque chose. Celui qui n'a pas peur ne critique pas. Connaître ta propre valeur te rend imperméable aux opinions extérieures.
3. Ne fais pas de suppositions: Nous supposons parce que nous n'avons pas le courage de poser les questions. Nous imaginons des réponses puis les confondons avec la réalité. La seule solution : poser autant de questions que nécessaire.
4. Fais toujours de ton mieux: Faire plus → épuisement. Faire moins → regrets. Le juste milieu est ton mieux, qui varie selon le jour. L'action pour l'action, pas pour le résultat.

Les 3 geôliers de ta liberté: Le Juge (intérieur), la Victime, ton système de croyances. Ces 3 geôliers survivent grâce aux émotions nées de la peur. S'en libérer demande de maîtriser : l'attention, la transformation, l'intention.

L'exercice de l'ange de la mort: S'il te restait une semaine à vivre, que ferais-tu ? Pleurer sur ton sort ou en profiter pleinement ? Pour profiter, nul besoin d'avoir peur du regard des autres.`,
  },
  {
    title: "21 leçons pour le 21ème siècle",
    author: "Yuval Noah Harari",
    genre: "Philosophie",
    rating: 12,
    coverFile: "book-21-lecons.jpg",
    whyRead: "L'IA possède 2 atouts que l'homme n'a pas : connectivité et actualisation. Un apprentissage sur une machine, et toutes les machines apprennent. Harari analyse les grandes questions de notre époque avec une clarté redoutable et sans concession.",
    summary: `Le libéralisme est désorienté face aux révolutions de l'IA et des biotech. L'homme moyen se sent de plus en plus inutile. Les algorithmes vont bientôt nous connaître mieux que nous-mêmes.

Contexte: 3 grands récits du 20ème siècle : Fascisme (mort en 1945), Communisme (mort en 1990), Libéralisme (en crise depuis 2016 avec Trump et le Brexit). Les libéraux annoncent la fin du monde... mais ils se trompent. C'est juste la fin de leur monde.

L'IA et le futur du travail: L'homme a 2 capacités : physique et cognitive. Les machines ont remplacé les capacités physiques. Bientôt elles remplaceront les capacités cognitives. Les 2 avantages de l'IA sur l'homme : Connectivité (un apprentissage partagé par tous les systèmes) et Actualisation (apprentissage continu en temps réel).

Leçons clés:
- Le libre arbitre est une illusion — nos décisions reposent sur un calcul biochimique inconscient que l'IA peut analyser mieux que nous
- Avant, les riches et les pauvres avaient les mêmes capacités physiques et cognitives. Avec les biotech, cette égalité disparaît
- Celui qui contrôlera la data contrôlera le monde
- En éducation : enseigner les 4C plutôt que des savoirs factuels : Pensée Critique, Collaboration, Communication, Créativité

La réponse personnelle : la méditation: Harari pratique la méditation Vipassana. Sa découverte majeure : La source de ma souffrance réside dans les configurations de mon esprit. Quand je désire quelque chose qui n'arrive pas, mon esprit réagit en engendrant la souffrance. Apprendre cela est un premier pas pour cesser d'en produire.

La phrase clé: La technologie améliore sa capacité à hacker l'humain. Progressivement les algorithmes vont prendre le pouvoir… sauf si l'humain garde un train d'avance. Mais pour aller vite, il ne faut pas beaucoup de bagages.`,
  },
  {
    title: "Délivrer du bonheur",
    author: "Tony Hsieh",
    genre: "Business",
    rating: 16,
    coverFile: "book-delivrer-du-bonheur.jpg",
    whyRead: "Bonheur des employés → meilleur service → clients ravis → fidélité → croissance → profit durable. Le ROI du bonheur est réel. Tony Hsieh démontre qu'on peut être ultra rentable et grandir très vite sans sacrifier la culture, en faisant du bonheur une priorité stratégique.",
    summary: `Zappos ne vend pas des chaussures, il vend du bonheur. Le profit est une conséquence d'un but bien choisi. La culture est le produit n°1.

L'idée centrale: Zappos ne vend pas des chaussures. Zappos vend du bonheur. Le profit est une conséquence, pas un objectif. Tony Hsieh démontre qu'on peut être ultra rentable et grandir très vite sans sacrifier la culture.

Les 3 piliers du bonheur:
1. Le plaisir — expériences positives, surprises, service wow. Un appel client peut durer 5 heures. Personne ne se fait engueuler.
2. La passion — faire un boulot qui a du sens, appartenir à une communauté. On recrute sur la culture avant les compétences.
3. Le sens — contribuer à quelque chose de plus grand. On veut améliorer la vie des gens, pas être numéro 1.

Le recrutement radical: À la fin de la période d'essai, Zappos propose 2 000 dollars pour partir. Message clair : si tu n'es pas heureux ici, pars maintenant. Résultat : seuls restent les gens alignés → engagement fort → culture ultra solide.

La chaîne de valeur du bonheur: Bonheur employés → meilleur service → clients ravis → fidélité → croissance → profit durable. Pas de marketing agressif. Pas de coût d'acquisition client délirant. Le bouche-à-oreille fait tout.

Le message final: Une entreprise peut être performante, humaine, joyeuse et durable. Mais seulement si le dirigeant est sincère, la culture est vécue, et le bonheur est une vraie priorité — pas un slogan RH.`,
  },
  {
    title: "Out of Control : The New Biology of Machines",
    author: "Kevin Kelly",
    genre: "Technologie",
    rating: 16,
    coverFile: "book-out-of-control.jpg",
    whyRead: "Une fourmi est stupide, une colonie est brillante. L'intelligence n'est pas dans les éléments mais dans leurs interactions. Kevin Kelly, dans les années 90, a prédit internet comme organisme vivant, les plateformes, et les réseaux énergétiques distribués. Ce livre est une prophétie devenue réalité.",
    summary: `Les machines deviennent vivantes et le vivant devient programmable. On ne contrôle plus les systèmes complexes — on les nourrit, on les oriente, on les laisse évoluer.

L'idée centrale: Les machines deviennent vivantes. Et le vivant devient programmable. On ne construit plus des systèmes contrôlés, mais des systèmes qui émergent. On crée des règles locales — le comportement global apparaît tout seul.

Le changement de paradigme: L'ancien monde repose sur des machines déterministes, centralisées, prévisibles et contrôlées. Le nouveau monde est fait de systèmes adaptatifs, distribués, émergents et auto-organisés.

L'émergence : quand personne ne décide, mais tout marche: Une fourmi est stupide. Une colonie est brillante. Même logique pour Internet, les marchés, les réseaux électriques, les IA et les écosystèmes énergétiques. L'intelligence n'est pas dans les éléments, mais dans leurs interactions.

Le futur se cultive, il ne se programme pas: Le rôle de l'ingénieur évolue : moins architecte, plus jardinier de systèmes. La méthode : poser des règles simples, observer, corriger doucement, accepter la surprise.

Le mythe du contrôle total est mort: Plus un système est complexe, moins il est contrôlable. La redondance, le désordre local et la diversité rendent les systèmes robustes. Le chaos bien structuré bat l'ordre rigide.

Ce livre prédit (écrit dans les années 90): L'IA moderne, Internet comme organisme vivant, les plateformes, les réseaux énergétiques distribués, les communautés énergétiques locales. Le refus de la complexité est plus dangereux que la complexité elle-même.`,
  },
  {
    title: "Antidote au culte de la performance",
    author: "Olivier Hamant",
    genre: "Sciences",
    rating: 16,
    coverFile: "book-antidote-performance.jpg",
    whyRead: "Un système performant est optimisé pour un scénario précis — au moindre aléa, il s'effondre. Le vivant, lui, n'est pas optimal. Il est robuste. Hamant, biologiste, propose un changement de boussole radical : ne pas être moins ambitieux, mais être moins fragile.",
    summary: `Le culte de la performance optimise tout pour un monde stable qui n'existe plus. Ce qui dure n'est pas performant mais robuste. Il faut accepter la lenteur, la diversité, les marges et l'imperfection.

Le diagnostic: Le culte de la performance applique la logique du tableur Excel à un monde qui n'est ni stable, ni prévisible. Climats, pandémies, tensions géopolitiques : nous entrons dans une ère de chocs permanents. Et là, la performance devient un poison.

Performance = fragilité (contre-intuitif mais implacable): Un système performant est optimisé pour un seul scénario, supprime les marges, élimine les redondances, standardise et spécialise à l'extrême. Au moindre aléa : tout s'effondre.

Le vivant fait exactement l'inverse: Hamant est biologiste. Il observe que le vivant n'est pas performant, gaspille de l'énergie, est lent et redondant. Mais il est robuste. La robustesse du vivant repose sur : diversité, redondance, décorrélation, temps long, essais et erreurs.

Performance vs Robustesse: La performance vise l'optimisation, la vitesse, la prédiction, la standardisation et le court terme. La robustesse vise l'adaptabilité, la résilience, la capacité à absorber l'imprévu, la diversité et le long terme. Un système robuste n'est pas excellent, il est durable.

Ce que Hamant propose: Ce n'est pas un retour à la bougie ni un discours nostalgique. C'est un changement de boussole : accepter une part d'inefficacité, recréer des marges, ralentir certains processus, encourager la diversité des solutions, redonner une valeur positive à l'erreur. Il ne dit pas soyons moins ambitieux. Il dit : soyons moins fragiles.`,
  },
  {
    title: "Sapiens : une brève histoire de l'humanité",
    author: "Yuval Noah Harari",
    genre: "Histoire",
    rating: 20,
    coverFile: "book-sapiens.jpg",
    whyRead: "Toutes nos institutions sont des fictions intersubjectives. Ce qui les rend réelles c'est qu'on y croit collectivement. Sapiens est le livre qui m'a le plus changé la façon de voir le monde — une mise en perspective radicale de ce que nous sommes et pourquoi nous fonctionnons comme ça.",
    summary: `Ce qui rend Sapiens unique c'est sa capacité à croire et partager des fictions — dieux, argent, nations, droits — qui permettent la coopération à grande échelle.

L'idée fondatrice: Ce qui distingue Sapiens des autres animaux : sa capacité à croire en des choses qui n'existent pas vraiment. Dieux, nations, monnaies, droits de l'homme, sociétés anonymes — tout cela n'existe que dans l'imaginaire collectif. Mais cela suffit pour que des millions d'inconnus coopèrent.

Les grandes révolutions:
- Révolution cognitive (~70 000 av. J.-C.) : L'homme peut parler de choses abstraites → coopération de masse possible → massacre des mégafaunes partout où Sapiens arrive.
- Révolution agricole (~7 000 av. J.-C.) : Sapiens passe de chasseur-cueilleur à agriculteur. Il travaille plus pour moins de confort. Mais la population explose — le piège se referme.
- Révolution scientifique (~1 500) : L'Europe utilise la science pour conquérir le monde. Leur force : connaître les pays conquis mieux qu'eux-mêmes.

Les grandes forces unificatrices: Par ordre d'importance décroissant : 1) La monnaie (universelle, échangeable), 2) Les empires (la culture de l'empire survit à l'empire), 3) La religion.

Le bonheur — le sujet le plus important, le moins étudié: Le bonheur n'est pas réductible au bien-être physique. Un paraplégique peut être plus heureux qu'un millionnaire en bonne santé. Ce qui compte : réduire ses désirs. Chaque désir comblé génère un nouveau désir plus difficile à atteindre.

La phrase clé: L'homme est monté vite du milieu au sommet de la chaîne alimentaire. Il se comporte comme un dictateur peu sûr de lui, prêt à abuser de sa force par peur d'être renversé.`,
  },
  {
    title: "Le Grand Tout (The Big Picture)",
    author: "Sean Carroll",
    genre: "Philosophie",
    rating: 16,
    coverFile: "book-le-grand-tout.jpg",
    whyRead: "Nous sommes des morceaux de l'univers qui ont appris à se comprendre eux-mêmes. Carroll répond à la question fondamentale : comment comprendre le sens, la morale, la conscience et la liberté dans un univers gouverné uniquement par les lois de la physique ? Sa réponse est à la fois rigoureuse et libératrice.",
    summary: `Un seul monde, celui de la physique. Mais plusieurs niveaux réels : vie, esprit, société. Pas de Dieu nécessaire, mais pas de nihilisme non plus. Le sens est créé, pas donné.

L'idée centrale: Comment comprendre le sens, la morale, la conscience et la liberté dans un univers gouverné uniquement par les lois de la physique ? Réponse de Carroll : tout ce qui existe est dans les lois de la physique. Et pourtant le sens, la vie, la morale et la conscience sont réels.

Le naturalisme poétique: Le naturalisme signifie que l'univers est entièrement décrit par la physique fondamentale. Le côté poétique : les niveaux supérieurs (vie, pensée, morale) ont leur propre langage valide. Il n'y a qu'un seul monde, mais plusieurs façons légitimes d'en parler.

Le temps, l'entropie et la flèche du temps: Les lois de la physique sont réversibles dans le temps. Pourtant le passé est figé et le futur est ouvert. La clé : l'entropie. L'univers a commencé dans un état très ordonné. Depuis, l'entropie augmente → ce qui crée le temps, la causalité, la mémoire.

Le libre arbitre existe: Carroll démonte deux idées fausses : si tout est déterministe, le libre arbitre n'existe pas (FAUX), et s'il y a du hasard quantique, le libre arbitre existe (FAUX). Le libre arbitre est une propriété émergente de systèmes complexes (cerveaux). Compatible avec la physique.

La morale sans Dieu: La morale n'est pas absolue, mais pas arbitraire non plus. Elle émerge naturellement chez des êtres sociaux via : l'empathie, la coopération, la souffrance évitée, l'évolution.

Le sens de la vie: Le sens de la vie n'est pas donné par l'univers. Il est créé par les êtres conscients. Tu n'es pas un pion cosmique. Tu es un système complexe capable de créer du sens. Tes projets comptent parce que tu les valorises.`,
  },
  {
    title: "Le chaos et l'harmonie : La fabrication du Réel",
    author: "Trinh Xuan Thuan",
    genre: "Sciences",
    rating: 12,
    coverFile: "book-chaos-harmonie.jpg",
    whyRead: "Toute théorie mathématique est fondée sur du sable : il est impossible de démontrer la solidité de ses hypothèses de base (Théorème de Gödel). Thuan explore la beauté en science et les limites fondamentales de notre capacité à comprendre le réel.",
    summary: `La beauté en science repose sur 3 piliers : inévitable, simple, conforme avec le tout. La science est limitée aux domaines où la nature est linéaire. Dès que l'imprévisibilité entre en jeu, elle est impuissante.

La beauté en science: Une théorie est belle si elle est : 1) Inévitable (rien à modifier sans perdre l'équilibre), 2) Simple (minimum d'idées ou d'hypothèses, Rasoir d'Occam), 3) Conforme avec le tout (permet de mieux comprendre la nature et s'y inscrit).

L'apparition de la vie: La vie sur Terre est liée à deux choses : les lois de la physique (explosion supernova → effondrement nuage → création du soleil → planètes) et un enchaînement historique totalement aléatoire (agrégation des cailloux, taille de la Lune, inclinaison, vitesse de rotation).

Les niveaux d'émergence: De la matière à la conscience, en passant par les atomes, les étoiles, la vie monocellulaire, multicellulaire, la conscience de soi, la pensée abstraite et la technologie. Chaque niveau est irréductible au précédent.

Les limites de la science: 100% de la science est fondée sur une logique réductionniste, utilisant des approximations, limitée aux domaines où la nature se comporte de manière linéaire. Dès que l'imprévisibilité entre en action, la science est impuissante.

Gödel et les mathématiques: Gödel (ami d'Einstein) a démontré qu'il est impossible de démontrer la solidité des hypothèses de base de toute théorie mathématique. Pour les démontrer, il faudrait sortir du système. Toute théorie mathématique est fondée sur du sable.`,
  },
]

async function main() {
  const uploadsDir = path.join(__dirname, '../uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  // Trouver l'admin
  let admin = await prisma.user.findFirst({ where: { isAdmin: true, isApproved: true } })
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { email: 'greg@starvolt.fr' } })
  }
  if (!admin) {
    console.log('Aucun admin trouvé. Liste des utilisateurs:')
    const users = await prisma.user.findMany()
    console.log(JSON.stringify(users, null, 2))
    throw new Error("Pas d'admin trouvé")
  }
  console.log(`Insertion en tant que: ${admin.name} (${admin.email})`)

  for (const book of books) {
    // Check si existe déjà
    const existing = await prisma.content.findFirst({ where: { title: book.title } })
    if (existing) { console.log(`Skip (existe déjà): ${book.title}`); continue }

    // Télécharger l'image
    const destPathJpg = path.join(uploadsDir, book.coverFile)
    const destPathSvg = destPathJpg.replace('.jpg', '.svg')
    let finalCoverFile = book.coverFile

    // Essaie Open Library avec plusieurs formats de titre
    const titleBase = book.title.split(':')[0].trim()
    const titleEncoded = encodeURIComponent(titleBase)
    const urls = [
      `https://covers.openlibrary.org/b/title/${titleEncoded}-L.jpg`,
      `https://covers.openlibrary.org/b/title/${titleEncoded}-M.jpg`,
    ]

    let imageDownloaded = false
    for (const url of urls) {
      try {
        await downloadImage(url, destPathJpg)
        imageDownloaded = true
        console.log(`  Image: ${book.coverFile}`)
        break
      } catch (e) {
        // continue vers l'URL suivante
      }
    }

    if (!imageDownloaded) {
      createPlaceholderSVG(destPathSvg, book.title, book.author)
      finalCoverFile = book.coverFile.replace('.jpg', '.svg')
      console.log(`  Placeholder SVG: ${finalCoverFile}`)
    }

    // Insérer dans la DB
    await prisma.content.create({
      data: {
        title: book.title,
        author: book.author,
        sponsor: admin.name,
        coverImage: finalCoverFile,
        summary: book.summary,
        whyRead: book.whyRead,
        rating: book.rating,
        genre: book.genre,
        userId: admin.id,
      }
    })
    console.log(`Créé: ${book.title}`)
  }

  console.log('\nSeed terminé!')
}

main().catch(console.error).finally(() => prisma.$disconnect())

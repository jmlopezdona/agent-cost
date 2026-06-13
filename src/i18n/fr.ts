import type { Strings } from './es'

/** Traducción francesa; satisface la forma canónica `Strings` (D1). */
export const fr: Strings = {
  app: {
    title: 'Agent Cost',
    subtitle: "Calculateur de coût d'agents d'IA sur l'API d'Anthropic",
  },
  header: {
    presetsLabel: 'Scénarios prédéfinis',
    customized: (presetName: string) => `Personnalisé (basé sur ${presetName})`,
    copyLink: 'Partager',
    copied: 'Lien copié',
    reset: 'Réinitialiser',
    resetAria: 'Réinitialiser le scénario au préréglage par défaut',
    themeToggle: 'Basculer entre le mode clair et sombre',
    currencyLabel: "Devise d'affichage",
    currencyEur: '€',
    currencyUsd: '$',
    currencyEurAria: 'Afficher les chiffres en euros',
    currencyUsdAria: 'Afficher les chiffres en dollars',
    languageLabel: "Langue de l'interface",
  },
  staleVersion: (urlVersion: string, currentVersion: string) =>
    `Ce scénario a été partagé avec la version de prix ${urlVersion} ; les prix actuels sont la version ${currentVersion}. Le calcul utilise les prix actuels.`,
  dismiss: "Fermer l'avis",
  tokens: {
    sectionTitle: 'Taux de tokens E/S',
    sectionHint: "Tokens consommés par heure active de l'agent",
    input: {
      label: 'Input frais',
      unit: 'k tok/h',
      help: "Tokens d'entrée non mis en cache que le modèle lit pour la première fois. Exemple : 42k/h équivaut à envoyer environ 30 pages de texte nouveau chaque heure.",
    },
    output: {
      label: 'Output',
      unit: 'k tok/h',
      help: 'Tokens générés par le modèle, y compris le raisonnement (thinking). Exemple : 210k/h représentent environ 150 pages générées par heure, code et raisonnement compris.',
    },
    cacheRead: {
      label: 'Cache read',
      unit: 'M tok/h',
      help: "30M de cache read/h ≈ un contexte moyen de ~150k tokens relu sur ~200 appels/heure. C'est souvent le poste de coût dominant : le levier est l'ingénierie de contexte.",
    },
    cacheWrite: {
      label: 'Cache write',
      unit: 'k tok/h',
      help: 'Écritures de cache de prompt (TTL 5 min, tarif 1,25× input). Exemple : 530k/h équivaut à mettre en cache environ 3 à 4 fois par heure un contexte de ~150k tokens.',
    },
    helpButton: (label: string) => `Aide sur ${label}`,
    categoryDetail: (cost: string, share: string) => `${cost} · ${share} du blend`,
  },
  mix: {
    sectionTitle: 'Mélange de modèles',
    sectionHint: "Répartition du temps actif entre les modèles ; Haiku absorbe le reste jusqu'à 100 %",
    haikuRest: 'reste',
    blendLabel: 'Tarif du blend',
    rateLabel: (rate: string) => `${rate} actif`,
  },
  schedule: {
    sectionTitle: 'Régime et utilisation',
    hoursPerDay: 'Heures par jour',
    daysPerWeek: 'Jours par semaine',
    dutyCycle: 'Duty cycle',
    agents: "Nombre d'agents",
    hoursUnit: 'h/jour',
    daysUnit: 'jours',
    dutyUnit: '%',
    agentsUnit: 'agents',
    regimes: { full: '24×7', extended: '12×5', office: '8×5' },
    regimeGroupLabel: 'Préréglages de régime horaire',
    dutyHelp:
      "Fraction du temps programmé pendant laquelle l'agent consomme réellement des tokens. Le reste est du temps mort (attentes de build/test, approbations humaines, inactivité) qui ne facture pas. Un duty de 100 % suppose l'agent actif en continu ; le coût pondéré est le plafond × duty cycle.",
    helpButton: (label: string) => `Aide sur ${label}`,
    contextLine: (scheduled: string, active: string, duty: string) =>
      `${scheduled}/mois programmées par agent · ${active} actives avec un duty de ${duty}`,
    dutyGuide:
      'Guide : supervisé avec un humain dans la boucle ≈ 30–40 % · agent en CI avec attentes de build/test ≈ 50–65 % · autonome sans approbations ≈ 75–85 %',
  },
  metrics: {
    blend: 'Blend par heure active',
    ceiling: 'Plafond mensuel',
    weighted: 'Pondéré mensuel',
    weightedHint: 'plafond × duty cycle',
    annual: 'Pondéré annuel',
  },
  charts: {
    breakdownTitle: 'Répartition du coût par catégorie de token',
    breakdownHint: 'Coût par heure active du blend actuel',
    categories: {
      cacheRead: 'Cache read',
      output: 'Output',
      cacheWrite: 'Cache write',
      input: 'Input frais',
    },
    ceilingVsWeightedTitle: 'Plafond vs. pondéré mensuel',
    ceilingBar: 'Plafond (duty 100 %)',
    weightedBar: 'Pondéré (duty actuel)',
    tableCaption: 'Données du graphique sous forme de tableau',
    colCategory: 'Catégorie',
    colCost: (symbol: string) => `${symbol}/h`,
    colShare: '% du blend',
    tabsLabel: 'Graphiques de résultats',
    tabBreakdown: 'Répartition par token',
    tabCeiling: 'Coût plafond vs. pondéré',
  },
  salary: {
    sectionTitle: 'Comparaison avec le coût employeur en Espagne',
    fxLabel: 'Taux de change',
    fxUnit: '€ par USD',
    agentMonthly: (money: string) => `Coût pondéré du scénario : ${money}/mois`,
    agentPerHour: (rate: string) => `Coût par heure active de l'agent : ${rate}`,
    hoursLine: (agentHours: string, fteHours: string, ratio: string) =>
      `${agentHours} actives/mois du scénario ≈ ${ratio} les ~${fteHours} effectives/mois d'un ETP`,
    colProfile: 'Profil',
    colGross: 'Brut annuel (€)',
    colEmployerYear: 'Coût employeur/an',
    colEmployerMonth: 'Coût employeur/mois',
    colPerHour: (symbol: string) => `${symbol}/h effective`,
    colFte: 'Équivalence ETP',
    fteValue: (ratio: string) => `≈ ${ratio}`,
    grossInputLabel: (profile: string) => `Brut annuel de ${profile}`,
    chartTitle: (code: string) => `Coût mensuel : scénario d'agents vs. profils (${code})`,
    agentBarLabel: 'Agents (scénario)',
    disclaimer:
      "Les salaires sont indicatifs (moyennes nationales, sans premium de ville ni variable) et le multiplicateur de coût employeur est une approximation. Cette comparaison n'implique pas une équivalence de capacités ni une substituabilité : c'est une référence d'ordre de grandeur pour les business cases.",
    multiplierNote: (multiplier: string, hours: string) =>
      `Coût employeur = brut × ${multiplier} · ${hours} h effectives/an`,
  },
  learnings: {
    label: 'À observer',
  },
  advanced: {
    sectionTitle: 'Configuration avancée',
    sectionHint: 'Prix, Batch API, surcoût régional, taux de change et coût employeur',
    toggleExpand: 'Afficher ou masquer la configuration avancée',
    pricingTitle: 'Prix par modèle (USD/MTok)',
    pricingHint:
      'Modifiez les tarifs officiels ; les changements ne vivent que dans cette session et dans le lien.',
    restoreOfficial: 'Restaurer les officiels',
    priceFields: {
      input: 'Input',
      output: 'Output',
      cache_read: 'Cache read',
      cache_write: 'Cache write',
    },
    priceCellAria: (model: string, field: string) => `Prix ${field} de ${model} (USD/MTok)`,
    colModel: 'Modèle',
    batchTitle: 'Batch API (−50%)',
    batchToggle: 'Activer la Batch API',
    batchHelp:
      "La Batch API traite les requêtes de manière asynchrone avec une remise de 50 %. Indiquez quelle fraction du travail ne nécessite pas de latence et peut passer par batch.",
    batchFractionLabel: '% du travail éligible',
    batchUnit: '%',
    regionalTitle: 'Surcoût régional/Bedrock (+10%)',
    regionalToggle: 'Activer le surcoût régional/Bedrock',
    regionalHelp:
      "Certaines régions et l'accès via Amazon Bedrock appliquent un surcoût d'environ 10 % sur toutes les catégories.",
    fxLabel: 'Taux de change',
    fxUnit: '€ par USD',
    employerMultiplierLabel: 'Multiplicateur de coût employeur',
    employerMultiplierHelp:
      'Facteur qui convertit le brut annuel en coût employeur total (sécurité sociale, équipement, etc.). Par défaut 1,30.',
    effectiveHoursLabel: 'Heures effectives annuelles (ETP)',
    effectiveHoursUnit: 'h/an',
    effectiveHoursHelp:
      "Heures réellement productives d'un employé à temps plein par an, hors congés, jours fériés et temps non facturable. Par défaut 1 720.",
  },
  badges: {
    batch: (percent: string) => `batch ${percent} appliqué`,
    bedrock: 'Bedrock +10%',
    pricesEdited: 'prix modifiés',
    label: 'Modificateurs actifs',
  },
  presentation: {
    toggle: 'Présentation',
    toggleAria: 'Activer ou désactiver le mode présentation',
    exit: 'Calculatrice',
  },
  exporting: {
    sectionTitle: 'Exporter',
    menuAria: "Options d'exportation",
    json: 'Exporter JSON',
    csv: 'Exporter CSV',
    pngChart: "Exporter l'image",
    pngChartAria: (chart: string) => `Exporter ${chart} en image PNG`,
    pngAll: 'Tout exporter (PNG)',
    fileBase: 'agentcost-scenario',
    csvColKey: 'clé',
    csvColValue: 'valeur',
    fields: {
      preset: 'préréglage',
      parameters: 'paramètres',
      modifiers: 'modificateurs',
      results: 'résultats',
    },
  },
  footer: {
    pricingVersion: (version: string, date: string) =>
      `Prix de l'API Anthropic version ${version} (effectifs depuis le ${date})`,
    pricingLink: "Table officielle des prix de l'API Anthropic",
    salarySources: (sources: string, reviewed: string) =>
      `Sources salariales : ${sources} · Dernière révision : ${reviewed}`,
    estimateDisclaimer:
      'Tous les chiffres sont des estimations indicatives basées sur les paramètres saisis ; ils ne constituent pas une prévision de facturation.',
    noBackend: 'Outil 100 % statique : aucune donnée ne quitte votre navigateur.',
    observationsLabel: 'Observations',
  },
  presets: {
    p1: {
      name: 'Pair programming supervisé',
      description:
        "Un développeur travaille avec un agent de type Claude Code en session interactive. L'humain révise et approuve ; l'agent passe la majeure partie du temps à attendre. Profil de tokens représentatif d'une session interactive de développement.",
      learnings:
        "Le duty faible (l'agent attend l'humain) fait que le coût réel n'est qu'une fraction du plafond : le levier ici est la part du temps programmé qui facture vraiment, pas le tarif horaire.",
    },
    p2: {
      name: 'Agent de delivery équilibré',
      description:
        "Agent intégré au flux d'une équipe : Opus planifie la fonctionnalité et révise la PR finale, Sonnet implémente, Haiku exécute le cycle de tests/lint. Tourne en continu en traitant une file de tâches avec des attentes de build et de CI.",
      learnings:
        "Le cache read concentre la majeure partie du coût horaire ; le levier d'économie est l'ingénierie de contexte, pas le changement de modèle.",
    },
    p3: {
      name: 'Conception intensive / greenfield',
      description:
        "Démarrage de produit ou architecture complexe : le modèle frontière (Fable) et Opus portent le poids de la conception, des ADR et de la revue approfondie ; Sonnet prototype. Output élevé dû aux documents et au raisonnement étendu. Journée de travail avec supervision fréquente.",
      learnings:
        "Seul scénario avec le modèle frontière : cette part, ajoutée au poids d'Opus, fait grimper le tarif horaire face aux scénarios Sonnet-first à tokens comparables. Le levier est la part du raisonnement que l'on peut descendre vers Sonnet sans perdre en qualité de conception.",
    },
    p4: {
      name: 'Évolutions sur code mature',
      description:
        "Maintenance et évolutions sur code mature : Sonnet résout la majorité des tâches et Opus n'intervient qu'en escalade lorsque l'agent bloque. Haiku absorbe le travail trivial. Forte autonomie.",
      learnings:
        'Avec Sonnet-first et Haiku absorbant le trivial, le tarif horaire baisse ; le coût mensuel est dicté par le duty élevé et le régime 24×7, pas par le prix du modèle.',
    },
    p5: {
      name: 'Essaim QA nocturne',
      description:
        "Une flotte d'agents de test (personas synthétiques, régression E2E, evals et analyse de vulnérabilités) qui tourne hors des heures. Majoritairement Haiku-heavy sur des contextes courts, avec une part du modèle frontière (Fable) pour l'analyse de sécurité approfondie. Candidat idéal à la Batch API (−50%) car sans besoin de latence.",
      learnings:
        "La Batch API (−50%) sur les 80 % éligibles est le plus grand levier d'économie et le coût évolue linéairement avec le nombre d'agents ; pour autant, une simple part de 5 % de Fable pour l'analyse de sécurité suffit à concentrer ~¼ du coût horaire : surveillez la part de travail routée vers le modèle frontière.",
    },
    p6: {
      name: 'Agent autonome de maintenance',
      description:
        "Agent sans humain dans la boucle qui trie les issues, met à jour les dépendances et ouvre des PR 24×7. Duty élevé car il n'attend pas d'approbations ; contexte volumineux dû aux dépôts étendus — le cache read domine le coût.",
      learnings:
        "Le cache read concentre >70 % du coût — le levier est l'ingénierie de contexte, pas le modèle. Le duty élevé, sans attente d'approbations, rapproche le coût mensuel du plafond.",
    },
  },
  salaryRoles: {
    junior: { name: 'Junior', experience: '0–2 ans' },
    mid: { name: 'Mid', experience: '2–5 ans' },
    senior: { name: 'Senior', experience: '5+ ans' },
    techlead: { name: 'Tech Lead / Architecte', experience: '8+ ans' },
  },
  salarySource:
    "Glassdoor Espagne, InfoJobs Rapport TIC, LinkedIn Salary Insights, INE Enquête sur la structure des salaires",
}

import type { Strings } from './es'

/** Traducción francesa; satisface la forma canónica `Strings` (D1). */
export const fr: Strings = {
  app: {
    title: 'Agent Cost',
    subtitle: "Calculateur de coût d'agents d'IA (Anthropic, OpenAI, Google)",
  },
  providers: {
    selectorLabel: 'Famille de modèles',
    anthropic: 'Anthropic · Claude',
    openai: 'OpenAI · ChatGPT',
    google: 'Google · Gemini',
  },
  header: {
    providerLabel: 'Famille de modèles',
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
    cachedInput: {
      label: 'Cached input',
      unit: 'M tok/h',
      help: "Tokens d'entrée servis depuis le cache d'OpenAI à tarif réduit. Équivaut au cache read : contexte répété que le modèle relit à prix remisé.",
    },
    cacheStorage: {
      label: 'Tokens retenus en cache',
      unit: 'M tok',
      help: "Volume de tokens conservés dans le cache explicite de Gemini. Facturé au stockage et à l'heure programmée, pas à l'appel. N'affecte le coût mensuel que si vous activez le terme de stockage.",
    },
    helpButton: (label: string) => `Aide sur ${label}`,
    categoryDetail: (cost: string, share: string) => `${cost} · ${share} du blend`,
  },
  mix: {
    sectionTitle: 'Mélange de modèles',
    sectionHint:
      "Répartition du temps actif entre les modèles ; le modèle le moins cher absorbe le reste jusqu'à 100 %",
    haikuRest: 'reste',
    blendLabel: 'Tarif du blend',
    rateLabel: (rate: string) => `${rate} actif`,
    tabsLabel: 'Famille de modèles',
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
    storage: 'Stockage de cache',
    storageHint: 'coût mensuel distinct du blend',
  },
  charts: {
    breakdownTitle: 'Répartition du coût par catégorie de token',
    breakdownHint: 'Coût par heure active du blend actuel',
    categories: {
      cacheRead: 'Cache read',
      output: 'Output',
      cacheWrite: 'Cache write',
      input: 'Input frais',
      cachedInput: 'Cached input',
      cacheStorage: 'Stockage',
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
    sectionHint:
      'Prix, Batch API, surcoût régional, stockage de cache, taux de change et coût employeur',
    toggleExpand: 'Afficher ou masquer la configuration avancée',
    pricingTitle: 'Prix par modèle (USD/MTok)',
    pricingHint:
      'Modifiez les tarifs officiels ; les changements ne vivent que dans cette session et dans le lien.',
    pricingTabsLabel: 'Famille de prix',
    restoreOfficial: 'Restaurer les officiels',
    priceFields: {
      input: 'Input',
      output: 'Output',
      cache_read: 'Cache read',
      cache_write: 'Cache write',
      cached_input: 'Cached input',
      cache_storage: 'Stockage /h',
    },
    priceCellAria: (model: string, field: string) => `Prix ${field} de ${model} (USD/MTok)`,
    colModel: 'Modèle',
    batchTitle: 'Batch API (−50%)',
    batchToggle: 'Activer la Batch API',
    batchHelp:
      'La Batch API traite les requêtes de manière asynchrone avec une remise de 50 %. Indiquez quelle fraction du travail ne nécessite pas de latence et peut passer par batch.',
    batchFractionLabel: '% du travail éligible',
    batchUnit: '%',
    regionalTitle: 'Surcoût régional/Bedrock (+10%)',
    regionalToggle: 'Activer le surcoût régional/Bedrock',
    regionalHelp:
      "Certaines régions appliquent un surcoût d'environ 10 % sur toutes les catégories : l'accès via Amazon Bedrock chez Anthropic, les endpoints de résidence régionale chez OpenAI.",
    storageTitle: 'Stockage de cache (Gemini)',
    storageToggle: 'Activer le coût de stockage de cache',
    storageHelp:
      "Gemini facture le cache explicite au stockage et à l'heure programmée, en plus de la lecture. Activez-le et indiquez les tokens retenus pour inclure ce coût mensuel.",
    storageDisclaimer:
      'Le cache explicite de Gemini est une estimation : le coût de stockage est modélisé séparément du blend horaire et suppose que vous retenez ce volume pendant toutes les heures programmées.',
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
    storage: 'stockage de cache',
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
        'Démarrage de produit ou architecture complexe : le modèle frontière (Fable) et Opus portent le poids de la conception, des ADR et de la revue approfondie ; Sonnet prototype. Output élevé dû aux documents et au raisonnement étendu. Journée de travail avec supervision fréquente.',
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
    o1: {
      name: 'Pair programming supervisé',
      description:
        "Un développeur travaille avec un agent ChatGPT en session interactive. GPT-5.4 mini porte l'essentiel et GPT-5.4 nano le trivial ; l'humain révise et approuve, avec un duty faible.",
      learnings:
        "Le duty faible (l'agent attend l'humain) fait que le coût réel n'est qu'une fraction du plafond : le levier est la part du temps programmé qui facture, pas le tarif.",
    },
    o2: {
      name: 'Agent de delivery équilibré',
      description:
        "Agent intégré au flux d'une équipe : GPT-5.4 planifie et révise la PR, GPT-5.4 mini implémente et GPT-5.4 nano exécute tests et lint. Tourne en continu sur une file avec attentes de CI.",
      learnings:
        "Le cached input concentre une bonne part du coût horaire ; le levier est l'ingénierie de contexte et la réutilisation du prompt en cache, pas le changement de modèle.",
    },
    o3: {
      name: 'Conception intensive / greenfield',
      description:
        'Démarrage de produit : GPT-5.5 (frontière) et GPT-5.4 portent la conception, les ADR et la revue approfondie ; GPT-5.4 mini prototype. Output élevé, raisonnement étendu, supervision fréquente.',
      learnings:
        'Seul scénario avec le modèle frontière (GPT-5.5) : cette part fait grimper le tarif horaire face aux scénarios mini-first. Le levier est la part de raisonnement descendue vers mini sans perte de qualité.',
    },
    o4: {
      name: 'Évolutions sur code mature',
      description:
        "Maintenance sur code mature : GPT-5.4 mini résout la majorité des tâches et GPT-5.4 n'intervient qu'en escalade ; GPT-5.4 nano absorbe le trivial. Forte autonomie 24×7.",
      learnings:
        'Avec mini-first et nano absorbant le trivial, le tarif horaire baisse ; le coût mensuel est dicté par le duty élevé et le régime 24×7, pas par le prix du modèle.',
    },
    o5: {
      name: 'Essaim QA nocturne',
      description:
        "Une flotte d'agents de test hors heures, majoritairement GPT-5.4 nano sur contextes courts avec une part de GPT-5.5 pour l'analyse de sécurité. Candidat idéal à la Batch API (−50%).",
      learnings:
        "La Batch API (−50%) sur les 80 % éligibles est le plus grand levier et le coût évolue avec le nombre d'agents ; une part de 5 % de GPT-5.5 concentre le coût horaire : surveillez ce que vous routez vers la frontière.",
    },
    o6: {
      name: 'Agent autonome de maintenance',
      description:
        "Agent sans humain dans la boucle qui trie les issues, met à jour les dépendances et ouvre des PR 24×7 sur ChatGPT. Duty élevé sans attente d'approbations ; contexte volumineux, cached input dominant.",
      learnings:
        "Le cached input concentre le coût — le levier est l'ingénierie de contexte. Le duty élevé, sans attente d'approbations, rapproche le coût mensuel du plafond.",
    },
    g1: {
      name: 'Pair programming supervisé',
      description:
        "Un développeur travaille avec un agent Gemini en session interactive. Gemini 3.5 Flash porte l'essentiel et Flash-Lite le trivial ; l'humain révise et approuve, avec un duty faible.",
      learnings:
        "Le duty faible (l'agent attend l'humain) fait que le coût réel n'est qu'une fraction du plafond : le levier est la part du temps programmé qui facture, pas le tarif.",
    },
    g2: {
      name: 'Agent de delivery équilibré',
      description:
        'Agent intégré au flux : Gemini 3.1 Pro planifie et révise, Gemini 3.5 Flash implémente et Flash-Lite exécute les tests. Tourne en continu sur une file avec attentes de CI.',
      learnings:
        "Le cache read concentre une bonne part du coût horaire ; si vous activez le stockage explicite, il facture à l'heure retenue, séparément du blend.",
    },
    g3: {
      name: 'Conception intensive / greenfield',
      description:
        'Démarrage de produit : Gemini 3.1 Pro porte la conception, les ADR et la revue approfondie ; Gemini 3.5 Flash prototype. Output élevé, raisonnement étendu, supervision fréquente.',
      learnings:
        'Le poids de Gemini 3.1 Pro (frontière, Preview) fait grimper le tarif horaire face aux scénarios Flash-first. Le levier est la part de raisonnement descendue vers Flash sans perte de qualité.',
    },
    g4: {
      name: 'Évolutions sur code mature',
      description:
        "Maintenance sur code mature : Gemini 3.5 Flash résout la majorité des tâches et Gemini 3.1 Pro n'intervient qu'en escalade ; Flash-Lite absorbe le trivial. Forte autonomie 24×7.",
      learnings:
        'Avec Flash-first et Flash-Lite absorbant le trivial, le tarif horaire baisse ; le coût mensuel est dicté par le duty élevé et le régime 24×7, pas par le prix du modèle.',
    },
    g5: {
      name: 'Essaim QA nocturne',
      description:
        "Une flotte d'agents de test hors heures, majoritairement Flash-Lite sur contextes courts avec une part de Gemini 3.1 Pro pour l'analyse de sécurité. Candidat idéal à la Batch API (−50%).",
      learnings:
        "La Batch API (−50%) sur les 80 % éligibles est le plus grand levier et le coût évolue avec le nombre d'agents ; une part de 5 % de Gemini 3.1 Pro concentre le coût horaire : surveillez ce que vous routez vers la frontière.",
    },
    g6: {
      name: 'Agent autonome de maintenance',
      description:
        "Agent sans humain dans la boucle qui trie les issues, met à jour les dépendances et ouvre des PR 24×7 sur Gemini. Duty élevé sans attente d'approbations ; contexte volumineux, cache read dominant.",
      learnings:
        "Le cache read concentre le coût — le levier est l'ingénierie de contexte. Le duty élevé, sans attente d'approbations, rapproche le coût mensuel du plafond.",
    },
  },
  salaryRoles: {
    junior: { name: 'Junior', experience: '0–2 ans' },
    mid: { name: 'Mid', experience: '2–5 ans' },
    senior: { name: 'Senior', experience: '5+ ans' },
    techlead: { name: 'Tech Lead / Architecte', experience: '8+ ans' },
  },
  salarySource:
    'Glassdoor Espagne, InfoJobs Rapport TIC, LinkedIn Salary Insights, INE Enquête sur la structure des salaires',
}

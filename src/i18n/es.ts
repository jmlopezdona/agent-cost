/** Todos los textos de UI (D9). Añadir EN = crear en.ts con esta misma forma. */
export const strings = {
  app: {
    title: 'AgentCost',
    subtitle: 'Calculadora de costes de agentes de IA sobre la API de Anthropic',
  },
  header: {
    presetsLabel: 'Escenarios predefinidos',
    customized: (presetName: string) => `Personalizado (basado en ${presetName})`,
    copyLink: 'Copiar enlace del escenario',
    copied: 'Enlace copiado',
    themeToggle: 'Cambiar entre modo claro y oscuro',
    currencyLabel: 'Moneda de presentación',
    currencyEur: '€',
    currencyUsd: '$',
    currencyEurAria: 'Mostrar cifras en euros',
    currencyUsdAria: 'Mostrar cifras en dólares',
  },
  staleVersion: (urlVersion: string, currentVersion: string) =>
    `Este escenario se compartió con la versión de precios ${urlVersion}; los precios actuales son la versión ${currentVersion}. El cálculo usa los precios actuales.`,
  dismiss: 'Cerrar aviso',
  tokens: {
    sectionTitle: 'Tasa de tokens E/S',
    sectionHint: 'Tokens consumidos por hora activa del agente',
    input: {
      label: 'Input fresco',
      unit: 'k tok/h',
      help: 'Tokens de entrada no cacheados que el modelo lee por primera vez. Ejemplo: 42k/h equivale a enviar unas 30 páginas de texto nuevo cada hora.',
    },
    output: {
      label: 'Output',
      unit: 'k tok/h',
      help: 'Tokens generados por el modelo, incluido el razonamiento (thinking). Ejemplo: 210k/h son unas 150 páginas generadas por hora, código y razonamiento incluidos.',
    },
    cacheRead: {
      label: 'Cache read',
      unit: 'M tok/h',
      help: '30M de cache read/h ≈ contexto medio de ~150k tokens releído en ~200 llamadas/hora. Suele ser la partida dominante del coste: la palanca es la ingeniería de contexto.',
    },
    cacheWrite: {
      label: 'Cache write',
      unit: 'k tok/h',
      help: 'Escrituras de caché de prompt (TTL 5 min, tarifa 1,25× input). Ejemplo: 530k/h equivale a cachear unas 3-4 veces por hora un contexto de ~150k tokens.',
    },
    helpButton: (label: string) => `Ayuda sobre ${label}`,
    categoryDetail: (cost: string, share: string) => `${cost} · ${share} del blend`,
  },
  mix: {
    sectionTitle: 'Mezcla de modelos',
    sectionHint: 'Reparto del tiempo activo entre modelos; Haiku absorbe el resto hasta 100%',
    haikuRest: 'resto',
    blendLabel: 'Tarifa del blend',
    rateLabel: (rate: string) => `${rate} activa`,
  },
  schedule: {
    sectionTitle: 'Régimen y utilización',
    hoursPerDay: 'Horas al día',
    daysPerWeek: 'Días a la semana',
    dutyCycle: 'Duty cycle',
    agents: 'Número de agentes',
    hoursUnit: 'h/día',
    daysUnit: 'días',
    dutyUnit: '%',
    agentsUnit: 'agentes',
    regimes: { full: '24×7', extended: '12×5', office: '8×5' },
    regimeGroupLabel: 'Presets de régimen horario',
    dutyHelp:
      'Fracción del tiempo programado en que el agente consume tokens de verdad. El resto es tiempo muerto (esperas de build/test, aprobaciones humanas, inactividad) que no factura. Un duty del 100% supone el agente activo de forma continua; el coste ponderado es el techo × duty cycle.',
    helpButton: (label: string) => `Ayuda sobre ${label}`,
    contextLine: (scheduled: string, active: string, duty: string) =>
      `${scheduled}/mes programadas por agente · ${active} activas con duty ${duty}`,
    dutyGuide:
      'Guía: supervisado con humano en el loop ≈ 30–40% · agente en CI con esperas de build/test ≈ 50–65% · autónomo sin aprobaciones ≈ 75–85%',
  },
  metrics: {
    blend: 'Blend por hora activa',
    ceiling: 'Techo mensual',
    weighted: 'Ponderado mensual',
    weightedHint: 'techo × duty cycle',
    annual: 'Ponderado anual',
  },
  charts: {
    breakdownTitle: 'Desglose del coste por categoría de token',
    breakdownHint: 'Coste por hora activa del blend actual',
    categories: {
      cacheRead: 'Cache read',
      output: 'Output',
      cacheWrite: 'Cache write',
      input: 'Input fresco',
    },
    ceilingVsWeightedTitle: 'Techo vs. ponderado mensual',
    ceilingBar: 'Techo (100% duty)',
    weightedBar: 'Ponderado (duty actual)',
    tableCaption: 'Datos del gráfico en formato de tabla',
    colCategory: 'Categoría',
    colCost: (symbol: string) => `${symbol}/h`,
    colShare: '% del blend',
  },
  salary: {
    sectionTitle: 'Comparativa con coste empresa en España',
    fxLabel: 'Tipo de cambio',
    fxUnit: '€ por USD',
    agentMonthly: (money: string) => `Coste ponderado del escenario: ${money}/mes`,
    agentPerHour: (rate: string) => `Coste por hora activa del agente: ${rate}`,
    hoursLine: (agentHours: string, fteHours: string, ratio: string) =>
      `${agentHours} activas/mes del escenario ≈ ${ratio} las ~${fteHours} efectivas/mes de un FTE`,
    colProfile: 'Perfil',
    colGross: 'Bruto anual (€)',
    colEmployerYear: 'Coste empresa/año',
    colEmployerMonth: 'Coste empresa/mes',
    colPerHour: (symbol: string) => `${symbol}/h efectiva`,
    colFte: 'Equivalencia FTE',
    fteValue: (ratio: string) => `≈ ${ratio}`,
    grossInputLabel: (profile: string) => `Bruto anual de ${profile}`,
    chartTitle: (code: string) => `Coste mensual: escenario de agentes vs. perfiles (${code})`,
    agentBarLabel: 'Agentes (escenario)',
    disclaimer:
      'Los salarios son orientativos (medias nacionales, sin premium de ciudad ni variable) y el multiplicador de coste empresa es una aproximación. Esta comparativa no implica equivalencia de capacidades ni sustituibilidad: es una referencia de orden de magnitud para business cases.',
    multiplierNote: (multiplier: string, hours: string) =>
      `Coste empresa = bruto × ${multiplier} · ${hours} h efectivas/año`,
  },
  learnings: {
    label: 'Qué observar',
  },
  advanced: {
    sectionTitle: 'Configuración avanzada',
    sectionHint: 'Precios, Batch API, recargo regional, tipo de cambio y coste empresa',
    toggleExpand: 'Mostrar u ocultar la configuración avanzada',
    pricingTitle: 'Precios por modelo (USD/MTok)',
    pricingHint: 'Edita las tarifas oficiales; los cambios solo viven en esta sesión y en el enlace.',
    restoreOfficial: 'Restaurar oficiales',
    priceFields: {
      input: 'Input',
      output: 'Output',
      cache_read: 'Cache read',
      cache_write: 'Cache write',
    },
    priceCellAria: (model: string, field: string) => `Precio de ${field} de ${model} (USD/MTok)`,
    colModel: 'Modelo',
    batchTitle: 'Batch API (−50%)',
    batchToggle: 'Activar Batch API',
    batchHelp:
      'La Batch API procesa peticiones de forma asíncrona con un 50% de descuento. Indica qué fracción del trabajo no requiere latencia y puede ir por batch.',
    batchFractionLabel: '% del trabajo elegible',
    batchUnit: '%',
    regionalTitle: 'Recargo regional/Bedrock (+10%)',
    regionalToggle: 'Activar recargo regional/Bedrock',
    regionalHelp:
      'Algunas regiones y el acceso vía Amazon Bedrock aplican un recargo aproximado del 10% sobre todas las categorías.',
    fxLabel: 'Tipo de cambio',
    fxUnit: '€ por USD',
    employerMultiplierLabel: 'Multiplicador de coste empresa',
    employerMultiplierHelp:
      'Factor que convierte el bruto anual en coste empresa total (seguridad social, equipamiento, etc.). Por defecto 1,30.',
    effectiveHoursLabel: 'Horas efectivas anuales (FTE)',
    effectiveHoursUnit: 'h/año',
    effectiveHoursHelp:
      'Horas realmente productivas de un empleado a tiempo completo al año, descontando vacaciones, festivos y tiempo no facturable. Por defecto 1.720.',
  },
  badges: {
    batch: (percent: string) => `batch ${percent} aplicado`,
    bedrock: 'Bedrock +10%',
    pricesEdited: 'precios editados',
    label: 'Modificadores activos',
  },
  presentation: {
    toggle: 'Modo presentación',
    toggleAria: 'Activar o desactivar el modo presentación',
    exit: 'Salir del modo presentación',
  },
  exporting: {
    sectionTitle: 'Exportar',
    json: 'Exportar JSON',
    csv: 'Exportar CSV',
    pngChart: 'Exportar imagen',
    pngChartAria: (chart: string) => `Exportar ${chart} como imagen PNG`,
    pngAll: 'Exportar todo (PNG)',
    fileBase: 'agentcost-escenario',
  },
  footer: {
    pricingVersion: (version: string, date: string) =>
      `Precios API de Anthropic versión ${version} (efectivos desde ${date})`,
    pricingLink: 'Tabla oficial de precios de la API de Anthropic',
    salarySources: (sources: string, reviewed: string) =>
      `Fuentes salariales: ${sources} · Última revisión: ${reviewed}`,
    estimateDisclaimer:
      'Todas las cifras son estimaciones orientativas basadas en los parámetros introducidos; no constituyen una previsión de facturación.',
    noBackend: 'Herramienta 100% estática: ningún dato sale de tu navegador.',
  },
} as const

export type Strings = typeof strings

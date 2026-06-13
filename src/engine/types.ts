export const PROVIDER_IDS = ['anthropic', 'openai', 'google'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export function isProviderId(v: unknown): v is ProviderId {
  return typeof v === 'string' && (PROVIDER_IDS as readonly string[]).includes(v)
}

/** Clave local de un modelo dentro de su proveedor (p. ej. 'opus', 'gpt-5.5') */
export type ModelKey = string

/** Identificador público con namespace de proveedor (p. ej. 'anthropic:opus') */
export type ModelId = `${ProviderId}:${string}`

export function modelId(provider: ProviderId, key: ModelKey): ModelId {
  return `${provider}:${key}`
}

/**
 * Cómo se mide y se cobra una categoría de coste de un proveedor (D1):
 * - `rate`: coste/h activa = (tasa / escala) × precio
 * - `storage`: coste mensual = tokens_retenidos × precio × horas_programadas
 */
export type CostKind = 'rate' | 'storage'

export interface CostCategory {
  /** 'input' | 'output' | 'cache_read' | 'cache_write' | 'cached_input' | 'cache_storage' */
  key: string
  kind: CostKind
  /** Clave de la tasa de tokens que dirige esta categoría en el perfil del escenario */
  rateKey: string
  /** Escala de la tasa frente a $/MTok: 'k' → /1000, 'M' → /1 */
  unit: 'k' | 'M'
}

/** Modificadores que un proveedor ofrece (D5); ausente = no aplicable */
export interface ProviderModifiers {
  /** Batch API; `discount` 0.5 = −50% */
  batch?: { discount: number }
  /** Recargo regional; `surcharge` 1.10 = +10% */
  regional?: { surcharge: number }
}

export interface ModelPricing {
  name: string
  /** USD/MTok por categoría; clave = CostCategory.key */
  prices: Record<string, number>
  /** Fuente y fecha del precio (auditoría); opcional */
  source?: string
  effective_date?: string
}

export interface ProviderData {
  name: string
  costModel: CostCategory[]
  modifiers: ProviderModifiers
  /** Modelo (clave local) que absorbe el resto hasta 100% en la mezcla */
  remainderModel: ModelKey
  /** Catálogo de modelos del proveedor, por clave local */
  models: Record<ModelKey, ModelPricing>
}

export interface PricingTable {
  version: string
  effective_date: string
  unit: string
  providers: Record<ProviderId, ProviderData>
}

/** Overrides de precios por modelo (namespaced) y categoría aplicados sobre la tabla versionada (D3) */
export type PriceOverrides = Partial<Record<ModelId, Record<string, number>>>

/** Tasas de tokens por hora activa, indexadas por `rateKey` de las categorías del proveedor */
export type TokenRates = Record<string, number>

/** Fracciones por modelo (clave local del proveedor activo); deben sumar 1 */
export type ModelMix = Record<ModelKey, number>

export interface Scenario {
  /** Proveedor activo del escenario (single-provider) */
  providerId: ProviderId
  tokens: TokenRates
  mix: ModelMix
  hoursPerDay: number
  daysPerWeek: number
  /** Fracción 0–1 */
  dutyCycle: number
  agents: number
}

/** Modificadores por defecto que un preset puede declarar (Fase 2, D1) */
export interface PresetModifiers {
  batchEnabled?: boolean
  /** Fracción 0–1 de trabajo elegible para Batch API */
  batchFraction?: number
}

export interface Preset extends Scenario {
  id: string
  /** Proveedor de la familia del preset (== providerId del escenario que genera) */
  provider: ProviderId
  /** Defaults de modificadores del preset (p. ej. P5 → Batch 80%) */
  modifiers?: PresetModifiers
  // La prosa (name/description/learnings) vive en i18n, resuelta por id (D4)
}

export interface CategoryCost {
  /** Clave de la categoría (CostCategory.key) */
  category: string
  usdPerHour: number
  /** Fracción del blend (0–1) */
  share: number
}

export interface Results {
  /** Tarifa USD/h activa de cada modelo (clave local) con el perfil de tokens actual */
  perModelRate: Record<ModelKey, number>
  /** Tarifa USD/h activa del blend */
  blendedRate: number
  /** h/mes programadas por agente */
  scheduledHoursMonth: number
  /** h/mes activas por agente (programadas × duty) */
  activeHoursMonth: number
  ceilingMonthlyUSD: number
  weightedMonthlyUSD: number
  weightedAnnualUSD: number
  /** Coste mensual de almacenamiento de caché (todos los agentes); 0 si no aplica */
  storageMonthlyUSD: number
  byCategory: CategoryCost[]
  /** USD/h que cada modelo (clave local) aporta al blend (mix × tarifa) */
  byModel: Record<ModelKey, number>
}

/** Hooks del motor con defaults neutros; los modificadores se aplican según el proveedor */
export interface EngineOptions {
  /** Fracción del trabajo elegible para Batch API (0 = sin batch) */
  batchFraction?: number
  /** Descuento batch (sobrescribe el declarado por el proveedor) */
  batchDiscount?: number
  /** Recargo regional (1 = sin recargo) */
  regionalSurcharge?: number
  /** Activa el término de almacenamiento de caché (categorías `storage`) */
  storageEnabled?: boolean
}

export const MODEL_IDS = ['fable', 'opus', 'sonnet', 'haiku'] as const
export type ModelId = (typeof MODEL_IDS)[number]

export interface ModelPricing {
  name: string
  /** USD/MTok */
  input: number
  output: number
  cache_read: number
  cache_write: number
}

export interface PricingTable {
  version: string
  effective_date: string
  unit: string
  models: Record<ModelId, ModelPricing>
}

export interface TokenRates {
  /** k tokens por hora activa */
  inputK: number
  /** k tokens por hora activa */
  outputK: number
  /** M tokens por hora activa */
  cacheReadM: number
  /** k tokens por hora activa */
  cacheWriteK: number
}

/** Fracciones por modelo; deben sumar 1 */
export type ModelMix = Record<ModelId, number>

export interface Scenario {
  tokens: TokenRates
  mix: ModelMix
  hoursPerDay: number
  daysPerWeek: number
  /** Fracción 0–1 */
  dutyCycle: number
  agents: number
}

export interface Preset extends Scenario {
  id: string
  name: string
  description: string
}

export const TOKEN_CATEGORIES = ['cacheRead', 'output', 'cacheWrite', 'input'] as const
export type TokenCategory = (typeof TOKEN_CATEGORIES)[number]

export interface CategoryCost {
  category: TokenCategory
  usdPerHour: number
  /** Fracción del blend (0–1) */
  share: number
}

export interface Results {
  /** Tarifa USD/h activa de cada modelo con el perfil de tokens actual */
  perModelRate: Record<ModelId, number>
  /** Tarifa USD/h activa del blend */
  blendedRate: number
  /** h/mes programadas por agente */
  scheduledHoursMonth: number
  /** h/mes activas por agente (programadas × duty) */
  activeHoursMonth: number
  ceilingMonthlyUSD: number
  weightedMonthlyUSD: number
  weightedAnnualUSD: number
  byCategory: CategoryCost[]
  /** USD/h que cada modelo aporta al blend (mix × tarifa) */
  byModel: Record<ModelId, number>
}

/** Hooks de Fase 2 con defaults neutros; la firma del motor no cambiará */
export interface EngineOptions {
  /** Fracción del trabajo elegible para Batch API (0 = sin batch) */
  batchFraction?: number
  /** Descuento batch (0.5 = −50%) */
  batchDiscount?: number
  /** Recargo regional/Bedrock (1 = sin recargo) */
  regionalSurcharge?: number
}

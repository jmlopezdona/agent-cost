import {
  MODEL_IDS,
  TOKEN_CATEGORIES,
  type CategoryCost,
  type EngineOptions,
  type ModelId,
  type ModelMix,
  type ModelPricing,
  type PricingTable,
  type Results,
  type Scenario,
  type TokenCategory,
  type TokenRates,
} from './types'

const WEEKS_PER_MONTH = 52 / 12

function priceModifier(opts: EngineOptions): number {
  const batchFraction = opts.batchFraction ?? 0
  const batchDiscount = opts.batchDiscount ?? 0.5
  const surcharge = opts.regionalSurcharge ?? 1
  return (1 - batchFraction * batchDiscount) * surcharge
}

/** USD/h activa que aporta cada categoría de token para un modelo (RF-01) */
export function categoryCosts(
  tokens: TokenRates,
  pricing: ModelPricing,
  opts: EngineOptions = {},
): Record<TokenCategory, number> {
  const m = priceModifier(opts)
  return {
    input: (tokens.inputK / 1000) * pricing.input * m,
    output: (tokens.outputK / 1000) * pricing.output * m,
    cacheRead: tokens.cacheReadM * pricing.cache_read * m,
    cacheWrite: (tokens.cacheWriteK / 1000) * pricing.cache_write * m,
  }
}

/** Tarifa USD/h activa de un modelo (RF-01) */
export function hourlyRate(
  tokens: TokenRates,
  pricing: ModelPricing,
  opts: EngineOptions = {},
): number {
  const c = categoryCosts(tokens, pricing, opts)
  return c.input + c.output + c.cacheRead + c.cacheWrite
}

/** Tarifa USD/h activa del blend: Σ mix × tarifa(modelo) */
export function blendedRate(
  tokens: TokenRates,
  mix: ModelMix,
  table: PricingTable,
  opts: EngineOptions = {},
): number {
  return MODEL_IDS.reduce(
    (sum, id) => sum + mix[id] * hourlyRate(tokens, table.models[id], opts),
    0,
  )
}

/** h/mes programadas: horas_dia × dias_semana × 52/12 */
export function scheduledHoursPerMonth(hoursPerDay: number, daysPerWeek: number): number {
  return hoursPerDay * daysPerWeek * WEEKS_PER_MONTH
}

export function computeResults(
  scenario: Scenario,
  table: PricingTable,
  opts: EngineOptions = {},
): Results {
  const { tokens, mix } = scenario

  const perModelRate = {} as Record<ModelId, number>
  const byModel = {} as Record<ModelId, number>
  const categoryTotals: Record<TokenCategory, number> = {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
  }

  for (const id of MODEL_IDS) {
    const costs = categoryCosts(tokens, table.models[id], opts)
    const rate = costs.input + costs.output + costs.cacheRead + costs.cacheWrite
    perModelRate[id] = rate
    byModel[id] = mix[id] * rate
    for (const cat of TOKEN_CATEGORIES) {
      categoryTotals[cat] += mix[id] * costs[cat]
    }
  }

  const blend = MODEL_IDS.reduce((sum, id) => sum + byModel[id], 0)

  const byCategory: CategoryCost[] = TOKEN_CATEGORIES.map((category) => ({
    category,
    usdPerHour: categoryTotals[category],
    share: blend > 0 ? categoryTotals[category] / blend : 0,
  }))

  const scheduledHoursMonth = scheduledHoursPerMonth(scenario.hoursPerDay, scenario.daysPerWeek)
  const activeHoursMonth = scheduledHoursMonth * scenario.dutyCycle
  const ceilingMonthlyUSD = blend * scheduledHoursMonth * scenario.agents
  const weightedMonthlyUSD = ceilingMonthlyUSD * scenario.dutyCycle
  const weightedAnnualUSD = weightedMonthlyUSD * 12

  return {
    perModelRate,
    blendedRate: blend,
    scheduledHoursMonth,
    activeHoursMonth,
    ceilingMonthlyUSD,
    weightedMonthlyUSD,
    weightedAnnualUSD,
    byCategory,
    byModel,
  }
}

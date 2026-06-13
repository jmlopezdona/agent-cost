import {
  type CategoryCost,
  type EngineOptions,
  type ModelMix,
  type ModelPricing,
  type PricingTable,
  type ProviderData,
  type ProviderModifiers,
  type Results,
  type Scenario,
  type TokenRates,
} from './types'

const WEEKS_PER_MONTH = 52 / 12

/** Escala de una tasa de tokens frente a $/MTok: 'k' → /1000, 'M' → /1 */
function scaleOf(unit: 'k' | 'M'): number {
  return unit === 'k' ? 1000 : 1
}

/**
 * Modificador de precio del proveedor (D5): aplica solo los modificadores que el proveedor
 * declara. Batch reduce el coste; el recargo regional lo aumenta. Si el proveedor no ofrece un
 * modificador, se ignora aunque se pase en `opts`.
 */
function priceModifier(opts: EngineOptions, modifiers: ProviderModifiers): number {
  const batchFraction = modifiers.batch ? (opts.batchFraction ?? 0) : 0
  const batchDiscount = modifiers.batch ? (opts.batchDiscount ?? modifiers.batch.discount) : 0
  const surcharge = modifiers.regional ? (opts.regionalSurcharge ?? 1) : 1
  return (1 - batchFraction * batchDiscount) * surcharge
}

/** USD/h activa que aporta cada categoría `rate` de un modelo (RF-01 generalizado) */
export function categoryCosts(
  tokens: TokenRates,
  model: ModelPricing,
  provider: ProviderData,
  opts: EngineOptions = {},
): Record<string, number> {
  const m = priceModifier(opts, provider.modifiers)
  const out: Record<string, number> = {}
  for (const cat of provider.costModel) {
    if (cat.kind !== 'rate') continue
    const rate = tokens[cat.rateKey] ?? 0
    out[cat.key] = (rate / scaleOf(cat.unit)) * (model.prices[cat.key] ?? 0) * m
  }
  return out
}

/** Tarifa USD/h activa de un modelo: suma de sus categorías `rate` (RF-01) */
export function hourlyRate(
  tokens: TokenRates,
  model: ModelPricing,
  provider: ProviderData,
  opts: EngineOptions = {},
): number {
  const c = categoryCosts(tokens, model, provider, opts)
  return Object.values(c).reduce((sum, v) => sum + v, 0)
}

/** Tarifa USD/h activa del blend: Σ mix × tarifa(modelo) sobre los modelos del proveedor */
export function blendedRate(
  tokens: TokenRates,
  mix: ModelMix,
  provider: ProviderData,
  opts: EngineOptions = {},
): number {
  return Object.keys(provider.models).reduce(
    (sum, key) => sum + (mix[key] ?? 0) * hourlyRate(tokens, provider.models[key], provider, opts),
    0,
  )
}

/** h/mes programadas: horas_dia × dias_semana × 52/12 */
export function scheduledHoursPerMonth(hoursPerDay: number, daysPerWeek: number): number {
  return hoursPerDay * daysPerWeek * WEEKS_PER_MONTH
}

/**
 * Coste mensual de almacenamiento de caché por agente (D3): para las categorías de tipo
 * `storage`, Σ mix × tokens_retenidos × precio × horas_programadas. Fuera del blend $/h.
 */
function storageMonthlyPerAgent(
  tokens: TokenRates,
  mix: ModelMix,
  provider: ProviderData,
  scheduledHoursMonth: number,
  opts: EngineOptions,
): number {
  if (!opts.storageEnabled) return 0
  let total = 0
  for (const cat of provider.costModel) {
    if (cat.kind !== 'storage') continue
    const retained = (tokens[cat.rateKey] ?? 0) / scaleOf(cat.unit)
    for (const key of Object.keys(provider.models)) {
      total += (mix[key] ?? 0) * retained * (provider.models[key].prices[cat.key] ?? 0)
    }
  }
  return total * scheduledHoursMonth
}

export function computeResults(
  scenario: Scenario,
  table: PricingTable,
  opts: EngineOptions = {},
): Results {
  const { tokens, mix } = scenario
  const provider = table.providers[scenario.providerId]
  const modelKeys = Object.keys(provider.models)
  const rateCats = provider.costModel.filter((c) => c.kind === 'rate')

  const perModelRate: Record<string, number> = {}
  const byModel: Record<string, number> = {}
  const categoryTotals: Record<string, number> = {}
  for (const cat of rateCats) categoryTotals[cat.key] = 0

  for (const key of modelKeys) {
    const costs = categoryCosts(tokens, provider.models[key], provider, opts)
    const rate = Object.values(costs).reduce((sum, v) => sum + v, 0)
    perModelRate[key] = rate
    byModel[key] = (mix[key] ?? 0) * rate
    for (const cat of rateCats) categoryTotals[cat.key] += (mix[key] ?? 0) * (costs[cat.key] ?? 0)
  }

  const blend = modelKeys.reduce((sum, key) => sum + byModel[key], 0)

  const byCategory: CategoryCost[] = rateCats.map((cat) => ({
    category: cat.key,
    usdPerHour: categoryTotals[cat.key],
    share: blend > 0 ? categoryTotals[cat.key] / blend : 0,
  }))

  const scheduledHoursMonth = scheduledHoursPerMonth(scenario.hoursPerDay, scenario.daysPerWeek)
  const activeHoursMonth = scheduledHoursMonth * scenario.dutyCycle
  const storagePerAgent = storageMonthlyPerAgent(tokens, mix, provider, scheduledHoursMonth, opts)
  const storageMonthlyUSD = storagePerAgent * scenario.agents
  // El almacenamiento entra en el techo antes del duty cycle, fuera del blend $/h (D3)
  const ceilingMonthlyUSD = (blend * scheduledHoursMonth + storagePerAgent) * scenario.agents
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
    storageMonthlyUSD,
    byCategory,
    byModel,
  }
}

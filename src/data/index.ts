import {
  PROVIDER_IDS,
  isProviderId,
  type CostCategory,
  type ModelPricing,
  type Preset,
  type PricingTable,
  type ProviderData,
  type ProviderId,
} from '../engine/types'
import type { SalaryConfig, SalaryProfile } from '../engine/salary'
import pricingJson from './pricing.json'
import presetsJson from './presets.json'
import salariesJson from './salaries.json'

export interface SalaryData extends SalaryConfig {
  last_reviewed: string
  profiles: SalaryProfile[]
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

function isCostCategory(v: unknown): v is CostCategory {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    isNonEmptyString(c.key) &&
    (c.kind === 'rate' || c.kind === 'storage') &&
    isNonEmptyString(c.rateKey) &&
    (c.unit === 'k' || c.unit === 'M')
  )
}

const SWE_PRO_BASIS = ['standard', 'vendor', 'estimate']
const CONFIDENCE = ['high', 'medium', 'low']

/** Valida el bloque `swePro` cuando existe: score ∈ [0,100], basis y confidence en dominio (D6) */
function isSwePro(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    isFiniteNumber(s.score) &&
    s.score >= 0 &&
    s.score <= 100 &&
    typeof s.basis === 'string' &&
    SWE_PRO_BASIS.includes(s.basis) &&
    typeof s.confidence === 'string' &&
    CONFIDENCE.includes(s.confidence)
  )
}

/** Valida un modelo: nombre + un precio finito por cada categoría del `costModel` */
function isModelPricing(v: unknown, costModel: CostCategory[]): v is ModelPricing {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  if (!isNonEmptyString(p.name)) return false
  const prices = p.prices as Record<string, unknown> | undefined
  if (prices == null || typeof prices !== 'object') return false
  if (!costModel.every((cat) => isFiniteNumber(prices[cat.key]))) return false
  // `swePro` es opcional a nivel de tipo; si existe, debe cumplir su dominio (D6)
  if (p.swePro !== undefined && !isSwePro(p.swePro)) return false
  return true
}

function isProviderData(v: unknown): v is ProviderData {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  if (!isNonEmptyString(p.name)) return false
  if (!Array.isArray(p.costModel) || p.costModel.length === 0) return false
  if (!p.costModel.every(isCostCategory)) return false
  const costModel = p.costModel as CostCategory[]
  // `modifiers` declarado (puede estar vacío) con magnitudes válidas si presentes
  const mods = p.modifiers as Record<string, unknown> | undefined
  if (mods == null || typeof mods !== 'object') return false
  if (mods.batch !== undefined && !isFiniteNumber((mods.batch as Record<string, unknown>).discount))
    return false
  if (
    mods.regional !== undefined &&
    !isFiniteNumber((mods.regional as Record<string, unknown>).surcharge)
  )
    return false
  const models = p.models as Record<string, unknown> | undefined
  if (models == null || typeof models !== 'object') return false
  const keys = Object.keys(models)
  if (keys.length === 0) return false
  if (!keys.every((k) => isModelPricing(models[k], costModel))) return false
  // El `remainderModel` debe existir entre los modelos del proveedor
  return isNonEmptyString(p.remainderModel) && keys.includes(p.remainderModel as string)
}

function isPricingTable(v: unknown): v is PricingTable {
  if (typeof v !== 'object' || v === null) return false
  const t = v as Record<string, unknown>
  if (!isNonEmptyString(t.version) || !isNonEmptyString(t.effective_date)) return false
  const providers = t.providers as Record<string, unknown> | undefined
  return providers != null && PROVIDER_IDS.every((id) => isProviderData(providers[id]))
}

function isSalaryProfile(v: unknown): v is SalaryProfile {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  // El nombre de rol y la experiencia viven en i18n por id (D4); el JSON es solo numérico
  return (
    isNonEmptyString(p.id) &&
    isFiniteNumber(p.grossAnnualEUR) &&
    Array.isArray(p.rangeEUR) &&
    p.rangeEUR.length === 2 &&
    p.rangeEUR.every(isFiniteNumber)
  )
}

function isSalaryData(v: unknown): v is SalaryData {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  // La fuente salarial mostrada vive en i18n (D4); el JSON conserva fecha y datos numéricos
  return (
    isNonEmptyString(s.last_reviewed) &&
    isFiniteNumber(s.employerCostMultiplier) &&
    isFiniteNumber(s.effectiveHoursPerYear) &&
    Array.isArray(s.profiles) &&
    s.profiles.length > 0 &&
    s.profiles.every(isSalaryProfile)
  )
}

function validate<T>(value: unknown, guard: (v: unknown) => v is T, file: string): T {
  if (!guard(value)) {
    throw new Error(`Datos inválidos en ${file}: la estructura no cumple el esquema esperado`)
  }
  return value
}

export const pricingTable: PricingTable = validate(pricingJson, isPricingTable, 'pricing.json')

/** Claves de las categorías de tipo `rate` de un proveedor (las que dirigen el perfil de tokens) */
export function rateCategories(providerId: ProviderId): CostCategory[] {
  return pricingTable.providers[providerId].costModel.filter((c) => c.kind === 'rate')
}

/** Categoría de almacenamiento del proveedor (Google), si la declara */
export function storageCategory(providerId: ProviderId): CostCategory | undefined {
  return pricingTable.providers[providerId].costModel.find((c) => c.kind === 'storage')
}

/** Claves locales de los modelos del proveedor (orden de declaración: frontera → barato) */
export function modelKeys(providerId: ProviderId): string[] {
  return Object.keys(pricingTable.providers[providerId].models)
}

// Valida presets cerrando sobre la tabla ya validada: la mezcla solo referencia modelos del
// proveedor del preset y suma 1 (D7); la prosa (name/description/learnings) vive en i18n (D4)
function isPreset(v: unknown): v is Preset {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  if (!isNonEmptyString(p.id)) return false
  if (!isProviderId(p.provider)) return false
  const provider = pricingTable.providers[p.provider]
  const tokens = p.tokens as Record<string, unknown> | undefined
  const mix = p.mix as Record<string, unknown> | undefined
  // Cada categoría `rate` del proveedor debe tener su tasa en el perfil del preset
  if (tokens == null || typeof tokens !== 'object') return false
  if (
    !provider.costModel
      .filter((c) => c.kind === 'rate')
      .every((c) => isFiniteNumber(tokens[c.rateKey]))
  )
    return false
  // La mezcla solo referencia modelos del proveedor del preset y suma 1
  if (mix == null || typeof mix !== 'object') return false
  const keys = Object.keys(provider.models)
  if (!Object.keys(mix).every((k) => keys.includes(k))) return false
  if (!keys.every((k) => isFiniteNumber(mix[k]))) return false
  const mixSum = keys.reduce((s, k) => s + (mix[k] as number), 0)
  if (Math.abs(mixSum - 1) > 1e-9) return false
  if (p.modifiers !== undefined) {
    const m = p.modifiers as Record<string, unknown>
    if (typeof m !== 'object' || m === null) return false
    if (m.batchEnabled !== undefined && typeof m.batchEnabled !== 'boolean') return false
    if (m.batchFraction !== undefined && !isFiniteNumber(m.batchFraction)) return false
  }
  return (
    isFiniteNumber(p.hoursPerDay) &&
    isFiniteNumber(p.daysPerWeek) &&
    isFiniteNumber(p.dutyCycle) &&
    isFiniteNumber(p.agents)
  )
}

export const presets: Preset[] = validate(
  presetsJson,
  (v): v is { presets: Preset[] } =>
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as Record<string, unknown>).presets) &&
    (v as { presets: unknown[] }).presets.length > 0 &&
    (v as { presets: unknown[] }).presets.every(isPreset),
  'presets.json',
).presets

export const salaryData: SalaryData = validate(salariesJson, isSalaryData, 'salaries.json')

export const DEFAULT_PRESET_ID = 'P2'
export const DEFAULT_PROVIDER: ProviderId = 'anthropic'
export const DEFAULT_FX_EUR_PER_USD = 0.92

/** true si el proveedor declara el modificador de recargo regional (Anthropic, OpenAI) */
export function offersRegional(providerId: ProviderId): boolean {
  return pricingTable.providers[providerId].modifiers.regional !== undefined
}

/** true si el proveedor declara el modificador Batch API (los tres lo declaran) */
export function offersBatch(providerId: ProviderId): boolean {
  return pricingTable.providers[providerId].modifiers.batch !== undefined
}

/**
 * Default del recargo regional por proveedor (D5): Anthropic ON (Bedrock como caso base),
 * OpenAI OFF (residencia regional opt-in), Google sin recargo.
 */
export function defaultRegional(providerId: ProviderId): boolean {
  return providerId === 'anthropic'
}

/** Preset de entrada de cada familia (análogo a P2: delivery balanceado 24×7) */
export const DEFAULT_PRESET_BY_PROVIDER: Record<ProviderId, string> = {
  anthropic: 'P2',
  openai: 'O2',
  google: 'G2',
}

/** Preset por defecto de una familia; cae al primero declarado si el mapeado no existe */
export function defaultPresetFor(providerId: ProviderId): Preset {
  const id = DEFAULT_PRESET_BY_PROVIDER[providerId]
  const preset =
    presets.find((p) => p.id === id && p.provider === providerId) ??
    presets.find((p) => p.provider === providerId)
  if (!preset) throw new Error(`Sin preset para el proveedor: ${providerId}`)
  return preset
}

/** Prefijo de id de preset por familia (P1–P6 · O1–O6 · G1–G6) */
const PROVIDER_PRESET_PREFIX: Record<ProviderId, string> = {
  anthropic: 'P',
  openai: 'O',
  google: 'G',
}

/**
 * Preset análogo (mismo caso de uso) en otra familia: P3 → O3 → G3. Permite conservar el
 * escenario al cambiar de proveedor. Cae al preset por defecto de la familia si no hay análogo.
 */
export function analogPresetFor(presetId: string, providerId: ProviderId): Preset {
  const num = presetId.replace(/^[A-Za-z]+/, '')
  const candidate = PROVIDER_PRESET_PREFIX[providerId] + num
  return (
    presets.find((p) => p.id === candidate && p.provider === providerId) ??
    defaultPresetFor(providerId)
  )
}

/** Defaults neutros de los modificadores de configuración avanzada (Fase 2) */
export const DEFAULT_BATCH_ENABLED = false
/** % elegible que muestra el slider al activar Batch API */
export const DEFAULT_BATCH_FRACTION = 0.5
/** Descuento de la Batch API (−50%) */
export const BATCH_DISCOUNT = 0.5
/** Recargo regional/Bedrock activo por defecto (acceso vía Bedrock como caso base) */
export const DEFAULT_REGIONAL = true
/** Recargo regional/Bedrock cuando está activo (+10%) */
export const REGIONAL_SURCHARGE = 1.1
/** Término de almacenamiento de caché (Gemini) apagado por defecto (caché implícita, D3) */
export const DEFAULT_STORAGE_ENABLED = false
export const DEFAULT_EMPLOYER_MULTIPLIER = salaryData.employerCostMultiplier
export const DEFAULT_EFFECTIVE_HOURS = salaryData.effectiveHoursPerYear

/** Moneda de presentación; el motor siempre calcula en USD */
export type Currency = 'eur' | 'usd'
export const DEFAULT_CURRENCY: Currency = 'eur'

export function isCurrency(v: unknown): v is Currency {
  return v === 'eur' || v === 'usd'
}

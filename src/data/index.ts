import { MODEL_IDS, type ModelPricing, type Preset, type PricingTable } from '../engine/types'
import type { SalaryConfig, SalaryProfile } from '../engine/salary'
import pricingJson from './pricing.json'
import presetsJson from './presets.json'
import salariesJson from './salaries.json'

export interface SalaryData extends SalaryConfig {
  source: string
  last_reviewed: string
  profiles: SalaryProfile[]
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

function isModelPricing(v: unknown): v is ModelPricing {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return (
    isNonEmptyString(p.name) &&
    isFiniteNumber(p.input) &&
    isFiniteNumber(p.output) &&
    isFiniteNumber(p.cache_read) &&
    isFiniteNumber(p.cache_write)
  )
}

function isPricingTable(v: unknown): v is PricingTable {
  if (typeof v !== 'object' || v === null) return false
  const t = v as Record<string, unknown>
  if (!isNonEmptyString(t.version) || !isNonEmptyString(t.effective_date)) return false
  const models = t.models as Record<string, unknown> | undefined
  return models != null && MODEL_IDS.every((id) => isModelPricing(models[id]))
}

function isPreset(v: unknown): v is Preset {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  const tokens = p.tokens as Record<string, unknown> | undefined
  const mix = p.mix as Record<string, unknown> | undefined
  if (!isNonEmptyString(p.id) || !isNonEmptyString(p.name) || !isNonEmptyString(p.description))
    return false
  if (
    tokens == null ||
    !isFiniteNumber(tokens.inputK) ||
    !isFiniteNumber(tokens.outputK) ||
    !isFiniteNumber(tokens.cacheReadM) ||
    !isFiniteNumber(tokens.cacheWriteK)
  )
    return false
  if (mix == null || !MODEL_IDS.every((id) => isFiniteNumber(mix[id]))) return false
  const mixSum = MODEL_IDS.reduce((s, id) => s + (mix[id] as number), 0)
  if (Math.abs(mixSum - 1) > 1e-9) return false
  return (
    isFiniteNumber(p.hoursPerDay) &&
    isFiniteNumber(p.daysPerWeek) &&
    isFiniteNumber(p.dutyCycle) &&
    isFiniteNumber(p.agents)
  )
}

function isSalaryProfile(v: unknown): v is SalaryProfile {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return (
    isNonEmptyString(p.id) &&
    isNonEmptyString(p.name) &&
    isNonEmptyString(p.experience) &&
    isFiniteNumber(p.grossAnnualEUR) &&
    Array.isArray(p.rangeEUR) &&
    p.rangeEUR.length === 2 &&
    p.rangeEUR.every(isFiniteNumber)
  )
}

function isSalaryData(v: unknown): v is SalaryData {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return (
    isNonEmptyString(s.source) &&
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
export const DEFAULT_FX_EUR_PER_USD = 0.92

/** Moneda de presentación; el motor siempre calcula en USD */
export type Currency = 'eur' | 'usd'
export const DEFAULT_CURRENCY: Currency = 'eur'

export function isCurrency(v: unknown): v is Currency {
  return v === 'eur' || v === 'usd'
}

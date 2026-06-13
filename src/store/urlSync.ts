import {
  MODEL_IDS,
  PRICE_FIELDS,
  type ModelId,
  type Preset,
  type PriceField,
  type PriceOverrides,
  type Scenario,
} from '../engine/types'
import { isCurrency, type Currency } from '../data'
import { clamp, RANGES, type Range } from '../lib/ranges'

/**
 * Serialización compacta del escenario en query string (RF-09, D6).
 * Solo se escriben los parámetros que difieren del preset base; `p` y `pv`
 * van siempre. La escritura usa history.replaceState (sin entradas de historial).
 */

/** Estado de los modificadores de configuración avanzada (Fase 2, D2) */
export interface ModifierState {
  batchEnabled: boolean
  /** Fracción 0–1 de trabajo elegible para Batch API */
  batchFraction: number
  regional: boolean
  employerMultiplier: number
  effectiveHours: number
  priceOverrides: PriceOverrides
  /** Modo presentación: flag de vista, no de escenario (D6) */
  presentation: boolean
}

/** Defaults neutros frente a los que se serializan los modificadores */
export interface ModifierDefaults {
  batchFraction: number
  employerMultiplier: number
  effectiveHours: number
}

export interface UrlState extends ModifierState {
  presetId: string
  scenario: Scenario
  fx: number
  /** Moneda de presentación (defecto EUR); solo viaja en la URL si difiere */
  currency: Currency
  isCustomized: boolean
  /** Versión de precios de la URL cuando difiere de la actual (aviso CA-09.1) */
  staleVersion: string | null
}

/** `px` = overrides como `modelo.campo:valor` separados por comas (D4) */
function serializeOverrides(overrides: PriceOverrides): string {
  const parts: string[] = []
  for (const id of MODEL_IDS) {
    const fields = overrides[id]
    if (!fields) continue
    for (const field of PRICE_FIELDS) {
      const value = fields[field]
      if (value !== undefined) parts.push(`${id}.${field}:${compact(value)}`)
    }
  }
  return parts.join(',')
}

function isModelId(v: string): v is ModelId {
  return (MODEL_IDS as readonly string[]).includes(v)
}

function isPriceField(v: string): v is PriceField {
  return (PRICE_FIELDS as readonly string[]).includes(v)
}

/** Deserializa `px` validando modelo/campo/valor; descarta entradas inválidas (D4) */
function deserializeOverrides(raw: string): PriceOverrides {
  const overrides: PriceOverrides = {}
  if (!raw) return overrides
  for (const entry of raw.split(',')) {
    const [path, rawValue] = entry.split(':')
    if (path === undefined || rawValue === undefined) continue
    const [model, field] = path.split('.')
    if (!isModelId(model) || !isPriceField(field)) continue
    const value = Number(rawValue)
    if (!Number.isFinite(value) || value < 0) continue
    overrides[model] = { ...overrides[model], [field]: value }
  }
  return overrides
}

/** Evita restos de coma flotante al pasar fracciones a porcentaje */
function compact(n: number): string {
  return String(Number(n.toFixed(6)))
}

/** Haiku = 100 − suma, redondeado para que el resto no arrastre coma flotante */
export function mixRemainder(fable: number, opus: number, sonnet: number): number {
  return Math.max(0, Number((1 - (fable + opus + sonnet)).toFixed(6)))
}

type NumericParam = {
  key: string
  range: Range
  get: (s: Scenario) => number
  set: (s: Scenario, v: number) => void
  /** Factor de presentación en URL (p. ej. fracción → %) */
  scale: number
}

const PARAMS: NumericParam[] = [
  {
    key: 'i',
    range: RANGES.inputK,
    get: (s) => s.tokens.inputK,
    set: (s, v) => (s.tokens.inputK = v),
    scale: 1,
  },
  {
    key: 'o',
    range: RANGES.outputK,
    get: (s) => s.tokens.outputK,
    set: (s, v) => (s.tokens.outputK = v),
    scale: 1,
  },
  {
    key: 'cr',
    range: RANGES.cacheReadM,
    get: (s) => s.tokens.cacheReadM,
    set: (s, v) => (s.tokens.cacheReadM = v),
    scale: 1,
  },
  {
    key: 'cw',
    range: RANGES.cacheWriteK,
    get: (s) => s.tokens.cacheWriteK,
    set: (s, v) => (s.tokens.cacheWriteK = v),
    scale: 1,
  },
  {
    key: 'mf',
    range: RANGES.mix,
    get: (s) => s.mix.fable,
    set: (s, v) => (s.mix.fable = v),
    scale: 100,
  },
  {
    key: 'mo',
    range: RANGES.mix,
    get: (s) => s.mix.opus,
    set: (s, v) => (s.mix.opus = v),
    scale: 100,
  },
  {
    key: 'ms',
    range: RANGES.mix,
    get: (s) => s.mix.sonnet,
    set: (s, v) => (s.mix.sonnet = v),
    scale: 100,
  },
  {
    key: 'h',
    range: RANGES.hoursPerDay,
    get: (s) => s.hoursPerDay,
    set: (s, v) => (s.hoursPerDay = v),
    scale: 1,
  },
  {
    key: 'd',
    range: RANGES.daysPerWeek,
    get: (s) => s.daysPerWeek,
    set: (s, v) => (s.daysPerWeek = v),
    scale: 1,
  },
  {
    key: 'dc',
    range: RANGES.dutyCycle,
    get: (s) => s.dutyCycle,
    set: (s, v) => (s.dutyCycle = v),
    scale: 100,
  },
  { key: 'n', range: RANGES.agents, get: (s) => s.agents, set: (s, v) => (s.agents = v), scale: 1 },
]

export function scenarioFromPreset(preset: Preset): Scenario {
  return {
    tokens: { ...preset.tokens },
    mix: { ...preset.mix },
    hoursPerDay: preset.hoursPerDay,
    daysPerWeek: preset.daysPerWeek,
    dutyCycle: preset.dutyCycle,
    agents: preset.agents,
  }
}

export function serializeScenario(
  scenario: Scenario,
  presetId: string,
  fx: number,
  defaultFx: number,
  pricingVersion: string,
  basePreset: Preset,
  currency: Currency,
  defaultCurrency: Currency,
  mods: ModifierState,
  modDefaults: ModifierDefaults,
): string {
  const params = new URLSearchParams()
  params.set('p', presetId)
  params.set('pv', pricingVersion)
  for (const param of PARAMS) {
    const value = param.get(scenario)
    if (value !== param.get(basePreset)) {
      params.set(param.key, compact(value * param.scale))
    }
  }
  if (fx !== defaultFx) params.set('fx', compact(fx))
  if (currency !== defaultCurrency) params.set('cur', currency)
  // Modificadores de configuración avanzada: solo si difieren del defecto (D4)
  if (mods.batchEnabled) params.set('b', compact(mods.batchFraction * 100))
  if (mods.regional) params.set('bd', '1')
  if (mods.employerMultiplier !== modDefaults.employerMultiplier)
    params.set('em', compact(mods.employerMultiplier))
  if (mods.effectiveHours !== modDefaults.effectiveHours)
    params.set('eh', compact(mods.effectiveHours))
  const px = serializeOverrides(mods.priceOverrides)
  if (px) params.set('px', px)
  // Modo presentación: flag de vista fuera del diff de escenario (D6)
  if (mods.presentation) params.set('present', '1')
  return params.toString()
}

export function deserializeScenario(
  search: string,
  presets: Preset[],
  defaultPresetId: string,
  defaultFx: number,
  pricingVersion: string,
  defaultCurrency: Currency,
  modDefaults: ModifierDefaults,
): UrlState {
  const params = new URLSearchParams(search)

  const requestedPreset = params.get('p')
  const basePreset =
    presets.find((p) => p.id === requestedPreset) ??
    presets.find((p) => p.id === defaultPresetId) ??
    presets[0]

  const scenario = scenarioFromPreset(basePreset)
  let isCustomized = false

  for (const param of PARAMS) {
    const raw = params.get(param.key)
    if (raw === null) continue
    const parsed = Number(raw) / param.scale
    // Parámetro inválido → se descarta con fallback al valor del preset base
    if (!Number.isFinite(parsed)) continue
    const value = clamp(parsed, param.range)
    if (value !== param.get(basePreset)) {
      param.set(scenario, value)
      isCustomized = true
    }
  }

  // Haiku es el resto; reclamp por si la suma de la URL superase 1
  const sumThree = scenario.mix.fable + scenario.mix.opus + scenario.mix.sonnet
  if (sumThree > 1) {
    const factor = 1 / sumThree
    scenario.mix.fable *= factor
    scenario.mix.opus *= factor
    scenario.mix.sonnet *= factor
  }
  scenario.mix.haiku = mixRemainder(scenario.mix.fable, scenario.mix.opus, scenario.mix.sonnet)

  const rawFx = params.get('fx')
  const parsedFx = rawFx === null ? NaN : Number(rawFx)
  const fx = Number.isFinite(parsedFx) ? clamp(parsedFx, RANGES.fx) : defaultFx

  // Moneda inválida o ausente → defecto
  const rawCurrency = params.get('cur')
  const currency = isCurrency(rawCurrency) ? rawCurrency : defaultCurrency

  const urlVersion = params.get('pv')
  const staleVersion = urlVersion !== null && urlVersion !== pricingVersion ? urlVersion : null

  // Modificadores de configuración avanzada (D4); inválido/ausente → defecto neutro
  const rawBatch = params.get('b')
  const parsedBatch = rawBatch === null ? NaN : Number(rawBatch) / 100
  const batchEnabled = rawBatch !== null && Number.isFinite(parsedBatch)
  const batchFraction = batchEnabled
    ? clamp(parsedBatch, RANGES.batchFraction)
    : modDefaults.batchFraction

  const regional = params.get('bd') === '1'

  const rawEm = params.get('em')
  const parsedEm = rawEm === null ? NaN : Number(rawEm)
  const employerMultiplier = Number.isFinite(parsedEm)
    ? clamp(parsedEm, RANGES.employerMultiplier)
    : modDefaults.employerMultiplier

  const rawEh = params.get('eh')
  const parsedEh = rawEh === null ? NaN : Number(rawEh)
  const effectiveHours = Number.isFinite(parsedEh)
    ? clamp(parsedEh, RANGES.effectiveHours)
    : modDefaults.effectiveHours

  const priceOverrides = deserializeOverrides(params.get('px') ?? '')
  const presentation = params.get('present') === '1'

  return {
    presetId: basePreset.id,
    scenario,
    fx,
    currency,
    isCustomized,
    staleVersion,
    batchEnabled,
    batchFraction,
    regional,
    employerMultiplier,
    effectiveHours,
    priceOverrides,
    presentation,
  }
}

/** Reescribe la query sin crear entradas de historial; no-op fuera del navegador */
export function writeUrl(query: string): void {
  if (typeof window === 'undefined' || typeof history === 'undefined') return
  const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  history.replaceState(null, '', url)
}

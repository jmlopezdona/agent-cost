import {
  isProviderId,
  modelId,
  type Preset,
  type PriceOverrides,
  type ProviderData,
  type ProviderId,
  type Scenario,
} from '../engine/types'
import {
  DEFAULT_PROVIDER,
  defaultRegional,
  isCurrency,
  modelKeys,
  pricingTable,
  rateCategories,
  storageCategory,
  type Currency,
} from '../data'
import { clamp, RANGES, type Range } from '../lib/ranges'

/**
 * Serialización compacta del escenario en query string (RF-09, D6/D8).
 * Solo se escriben los parámetros que difieren del preset base; `p` y `pv` van siempre.
 * El proveedor activo viaja como `pr` (omitido si es el default). Las claves de mezcla
 * (`m.<modelKey>`) y de perfil de tokens (`t.<rateKey>`) se generan por proveedor.
 * La escritura usa history.replaceState (sin entradas de historial).
 */

/** Estado de los modificadores de configuración avanzada (Fase 2, D2) */
export interface ModifierState {
  batchEnabled: boolean
  /** Fracción 0–1 de trabajo elegible para Batch API */
  batchFraction: number
  regional: boolean
  /** Término de almacenamiento de caché (Gemini) activo (D3) */
  storageEnabled: boolean
  employerMultiplier: number
  effectiveHours: number
  priceOverrides: PriceOverrides
  /** Modo presentación: flag de vista, no de escenario (D6) */
  presentation: boolean
}

/** Defaults frente a los que se serializan los modificadores (solo se escribe el diff) */
export interface ModifierDefaults {
  batchFraction: number
  regional: boolean
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

/** Aliases legacy (enlaces previos a multi-proveedor, proveedor anthropic) → claves nuevas (D8) */
const LEGACY_TOKEN: Record<string, string> = {
  inputK: 'i',
  outputK: 'o',
  cacheReadM: 'cr',
  cacheWriteK: 'cw',
}
const LEGACY_MIX: Record<string, string> = { fable: 'mf', opus: 'mo', sonnet: 'ms' }

function rangeFor(key: string): Range {
  return (RANGES as Record<string, Range>)[key] ?? { min: 0, max: Number.MAX_SAFE_INTEGER }
}

/** Categorías de precio editables/serializables de un proveedor (rate + storage) */
function categoryKeys(provider: ProviderData): string[] {
  return provider.costModel.map((c) => c.key)
}

/** rateKeys únicos del perfil de tokens de un proveedor (incl. el de storage si existe) */
function tokenRateKeys(providerId: ProviderId): string[] {
  const keys = rateCategories(providerId).map((c) => c.rateKey)
  const storage = storageCategory(providerId)
  if (storage) keys.push(storage.rateKey)
  return [...new Set(keys)]
}

/** `px` = overrides como `modeloLocal.categoria:valor` separados por comas, del proveedor activo (D4/D8) */
function serializeOverrides(overrides: PriceOverrides, providerId: ProviderId): string {
  const provider = pricingTable.providers[providerId]
  const parts: string[] = []
  for (const key of modelKeys(providerId)) {
    const fields = overrides[modelId(providerId, key)]
    if (!fields) continue
    for (const cat of categoryKeys(provider)) {
      const value = fields[cat]
      if (value !== undefined) parts.push(`${key}.${cat}:${compact(value)}`)
    }
  }
  return parts.join(',')
}

/**
 * Deserializa `px` validando modelo/categoría/valor dentro del proveedor activo; los model keys
 * pueden contener puntos (p. ej. `gpt-5.5`), así que se parte por el ÚLTIMO punto antes de la
 * categoría. Se namespacea al proveedor activo (`provider:modelo`). Descarta entradas inválidas.
 */
function deserializeOverrides(raw: string, providerId: ProviderId): PriceOverrides {
  const overrides: PriceOverrides = {}
  if (!raw) return overrides
  const provider = pricingTable.providers[providerId]
  const validModels = new Set(modelKeys(providerId))
  const validCats = new Set(categoryKeys(provider))
  for (const entry of raw.split(',')) {
    const [path, rawValue] = entry.split(':')
    if (path === undefined || rawValue === undefined) continue
    const dot = path.lastIndexOf('.')
    if (dot <= 0) continue
    const model = path.slice(0, dot)
    const field = path.slice(dot + 1)
    if (!validModels.has(model) || !validCats.has(field)) continue
    const value = Number(rawValue)
    if (!Number.isFinite(value) || value < 0) continue
    const id = modelId(providerId, model)
    overrides[id] = { ...overrides[id], [field]: value }
  }
  return overrides
}

/** Evita restos de coma flotante al pasar fracciones a porcentaje */
function compact(n: number): string {
  return String(Number(n.toFixed(6)))
}

/** Resto = 100 − Σ(no-resto), redondeado para que no arrastre coma flotante */
export function remainderValue(others: number[]): number {
  return Math.max(0, Number((1 - others.reduce((s, v) => s + v, 0)).toFixed(6)))
}

/** Recalcula la fracción del `remainderModel` del proveedor a partir de la mezcla actual */
export function applyRemainder(mix: Record<string, number>, provider: ProviderData): void {
  const others = Object.keys(provider.models).filter((k) => k !== provider.remainderModel)
  const sum = others.reduce((s, k) => s + (mix[k] ?? 0), 0)
  if (sum > 1) {
    const factor = 1 / sum
    for (const k of others) mix[k] = (mix[k] ?? 0) * factor
  }
  mix[provider.remainderModel] = remainderValue(others.map((k) => mix[k] ?? 0))
}

/** Parámetros escalares provider-agnósticos (régimen) */
type NumericParam = {
  key: string
  range: Range
  get: (s: Scenario) => number
  set: (s: Scenario, v: number) => void
  scale: number
}

const SCHEDULE_PARAMS: NumericParam[] = [
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
    providerId: preset.provider,
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
  if (scenario.providerId !== DEFAULT_PROVIDER) params.set('pr', scenario.providerId)

  // Perfil de tokens: una clave `t.<rateKey>` por cada tasa del proveedor; solo diffs
  for (const rk of tokenRateKeys(scenario.providerId)) {
    const value = scenario.tokens[rk] ?? 0
    if (value !== (basePreset.tokens[rk] ?? 0)) params.set(`t.${rk}`, compact(value))
  }
  // Mezcla: una clave `m.<modelKey>` por modelo no-resto; solo diffs
  const provider = pricingTable.providers[scenario.providerId]
  for (const key of modelKeys(scenario.providerId)) {
    if (key === provider.remainderModel) continue
    const value = scenario.mix[key] ?? 0
    if (value !== (basePreset.mix[key] ?? 0)) params.set(`m.${key}`, compact(value * 100))
  }
  // Régimen
  for (const param of SCHEDULE_PARAMS) {
    const value = param.get(scenario)
    if (value !== param.get(basePreset)) params.set(param.key, compact(value * param.scale))
  }

  if (fx !== defaultFx) params.set('fx', compact(fx))
  if (currency !== defaultCurrency) params.set('cur', currency)
  // Modificadores de configuración avanzada: solo si difieren del defecto (D4)
  if (mods.batchEnabled) params.set('b', compact(mods.batchFraction * 100))
  // Recargo regional deshabilitado por defecto en todas las familias; solo se serializa si difiere
  if (mods.regional !== defaultRegional())
    params.set('bd', mods.regional ? '1' : '0')
  if (mods.storageEnabled) params.set('st', '1')
  if (mods.employerMultiplier !== modDefaults.employerMultiplier)
    params.set('em', compact(mods.employerMultiplier))
  if (mods.effectiveHours !== modDefaults.effectiveHours)
    params.set('eh', compact(mods.effectiveHours))
  const px = serializeOverrides(mods.priceOverrides, scenario.providerId)
  if (px) params.set('px', px)
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

  const rawPr = params.get('pr')
  const providerId: ProviderId = isProviderId(rawPr) ? rawPr : DEFAULT_PROVIDER
  const provider = pricingTable.providers[providerId]

  const requestedPreset = params.get('p')
  const basePreset =
    presets.find((p) => p.id === requestedPreset && p.provider === providerId) ??
    presets.find((p) => p.id === defaultPresetId && p.provider === providerId) ??
    presets.find((p) => p.provider === providerId) ??
    presets[0]

  const scenario = scenarioFromPreset(basePreset)
  let isCustomized = false

  // Perfil de tokens (clave nueva `t.<rateKey>` o alias legacy en anthropic)
  for (const rk of tokenRateKeys(providerId)) {
    const legacy = providerId === DEFAULT_PROVIDER ? LEGACY_TOKEN[rk] : undefined
    const raw = params.get(`t.${rk}`) ?? (legacy ? params.get(legacy) : null)
    if (raw === null) continue
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) continue
    const value = clamp(parsed, rangeFor(rk))
    if (value !== (scenario.tokens[rk] ?? 0)) {
      scenario.tokens[rk] = value
      isCustomized = true
    }
  }

  // Mezcla (clave nueva `m.<modelKey>` o alias legacy en anthropic)
  for (const key of modelKeys(providerId)) {
    if (key === provider.remainderModel) continue
    const legacy = providerId === DEFAULT_PROVIDER ? LEGACY_MIX[key] : undefined
    const raw = params.get(`m.${key}`) ?? (legacy ? params.get(legacy) : null)
    if (raw === null) continue
    const parsed = Number(raw) / 100
    if (!Number.isFinite(parsed)) continue
    const value = clamp(parsed, RANGES.mix)
    if (value !== (scenario.mix[key] ?? 0)) {
      scenario.mix[key] = value
      isCustomized = true
    }
  }
  applyRemainder(scenario.mix, provider)

  // Régimen
  for (const param of SCHEDULE_PARAMS) {
    const raw = params.get(param.key)
    if (raw === null) continue
    const parsed = Number(raw) / param.scale
    if (!Number.isFinite(parsed)) continue
    const value = clamp(parsed, param.range)
    if (value !== param.get(basePreset)) {
      param.set(scenario, value)
      isCustomized = true
    }
  }

  const rawFx = params.get('fx')
  const parsedFx = rawFx === null ? NaN : Number(rawFx)
  const fx = Number.isFinite(parsedFx) ? clamp(parsedFx, RANGES.fx) : defaultFx

  const rawCurrency = params.get('cur')
  const currency = isCurrency(rawCurrency) ? rawCurrency : defaultCurrency

  const urlVersion = params.get('pv')
  const staleVersion = urlVersion !== null && urlVersion !== pricingVersion ? urlVersion : null

  // Modificadores (D4); inválido/ausente → defecto neutro
  const rawBatch = params.get('b')
  const parsedBatch = rawBatch === null ? NaN : Number(rawBatch) / 100
  const batchEnabled = rawBatch !== null && Number.isFinite(parsedBatch)
  const batchFraction = batchEnabled
    ? clamp(parsedBatch, RANGES.batchFraction)
    : modDefaults.batchFraction

  const rawBd = params.get('bd')
  const regional = rawBd === null ? defaultRegional() : rawBd === '1'

  const storageEnabled = params.get('st') === '1'

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

  const priceOverrides = deserializeOverrides(params.get('px') ?? '', providerId)
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
    storageEnabled,
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

/**
 * Persistencia del escenario por pestaña en sessionStorage (D1/D2). Mismo formato
 * que la URL de compartir; sobrevive al refresco, se descarta al cerrar la pestaña.
 */
const SESSION_KEY = 'agentcost-scenario'

/** Prefijos de claves dinámicas reconocidas como estado de escenario (D3) */
const DYNAMIC_PREFIXES = ['t.', 'm.']

/** Claves fijas reconocidas como "estado de escenario" en una query entrante (D3) */
const RECOGNIZED_KEYS = new Set<string>([
  'p',
  'pr',
  // régimen
  ...SCHEDULE_PARAMS.map((param) => param.key),
  // alias legacy de tokens y mezcla (anthropic)
  ...Object.values(LEGACY_TOKEN),
  ...Object.values(LEGACY_MIX),
  'fx',
  'cur',
  'b',
  'bd',
  'st',
  'em',
  'eh',
  'px',
  'present',
])

/** true si la query trae al menos una clave de escenario reconocida (D3) */
export function hasScenarioParams(search: string): boolean {
  if (!search) return false
  for (const key of new URLSearchParams(search).keys()) {
    if (RECOGNIZED_KEYS.has(key)) return true
    if (DYNAMIC_PREFIXES.some((prefix) => key.startsWith(prefix))) return true
  }
  return false
}

/** Guarda la query serializada en sessionStorage; no-op fuera del navegador */
export function writeSession(query: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, query)
}

/** Lee la query persistida; null si no hay nada o fuera del navegador */
export function readSession(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(SESSION_KEY)
}

/** Vacía el escenario persistido (usado por Reset); no-op fuera del navegador */
export function clearSession(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}

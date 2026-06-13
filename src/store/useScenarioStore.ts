import { create } from 'zustand'
import type {
  ModelId,
  ModelKey,
  Preset,
  ProviderId,
  PriceOverrides,
  Scenario,
  TokenRates,
} from '../engine/types'
import {
  DEFAULT_BATCH_FRACTION,
  DEFAULT_CURRENCY,
  DEFAULT_EFFECTIVE_HOURS,
  DEFAULT_EMPLOYER_MULTIPLIER,
  DEFAULT_FX_EUR_PER_USD,
  DEFAULT_PRESET_ID,
  DEFAULT_REGIONAL,
  DEFAULT_STORAGE_ENABLED,
  analogPresetFor,
  defaultRegional,
  presets,
  pricingTable,
  salaryData,
  type Currency,
} from '../data'
import { clamp, RANGES, type Range } from '../lib/ranges'
import {
  applyRemainder,
  clearSession,
  deserializeScenario,
  hasScenarioParams,
  readSession,
  scenarioFromPreset,
  serializeScenario,
  writeSession,
  writeUrl,
  type ModifierDefaults,
} from './urlSync'

type ScheduleField = 'hoursPerDay' | 'daysPerWeek' | 'dutyCycle' | 'agents'

/**
 * Estado de una familia memorizado para restaurarlo al volver a ella (mezcla, escenario).
 * El régimen/utilización (horas/día, días/semana, duty, agentes) NO es propio de la familia: es
 * GLOBAL y se arrastra de la familia activa, igual que las tasas de token compartidas, batch y
 * recargo regional. El almacenamiento de caché sí es propio de Gemini, así que se recuerda por familia.
 */
interface ProviderMemory {
  scenario: Scenario
  presetId: string
  storageEnabled: boolean
}

interface ScenarioStore {
  scenario: Scenario
  /** Preset base del escenario actual */
  presetId: string
  /** true → "Personalizado (basado en …)" */
  isCustomized: boolean
  /** Memoria por familia del último escenario editado; memoria de sesión, no se serializa */
  providerCache: Partial<Record<ProviderId, ProviderMemory>>
  /** Tipo de cambio EUR por USD */
  fx: number
  /** Moneda de presentación global (defecto EUR) */
  currency: Currency
  /** Versión de precios de una URL compartida cuando difiere de la actual */
  staleVersion: string | null
  /** Brutos anuales editados en sesión (sin persistencia) */
  profileGross: Record<string, number>

  // Modificadores de configuración avanzada (Fase 2, D2).
  // Batch y recargo regional son GLOBALES: se aplican a las tres familias a la vez.
  batchEnabled: boolean
  batchFraction: number
  regional: boolean
  /** Término de almacenamiento de caché (Gemini) activo; propio de cada familia (D3) */
  storageEnabled: boolean
  employerMultiplier: number
  effectiveHours: number
  priceOverrides: PriceOverrides
  /** Modo presentación (flag de vista, D6) */
  presentation: boolean

  setProvider: (providerId: ProviderId) => void
  loadPreset: (id: string) => void
  setToken: (field: keyof TokenRates, value: number) => void
  setMix: (model: ModelKey, value: number) => void
  setSchedule: (field: ScheduleField, value: number) => void
  applyRegime: (hoursPerDay: number, daysPerWeek: number) => void
  setFx: (value: number) => void
  setCurrency: (c: Currency) => void
  setProfileGross: (profileId: string, value: number) => void
  dismissStaleVersion: () => void

  setBatchEnabled: (value: boolean) => void
  setBatchFraction: (value: number) => void
  setRegional: (value: boolean) => void
  setStorageEnabled: (value: boolean) => void
  setEmployerMultiplier: (value: number) => void
  setEffectiveHours: (value: number) => void
  setPriceOverride: (model: ModelId, category: string, value: number) => void
  resetPriceOverrides: () => void
  togglePresentation: () => void
  /** Query serializada del estado actual (compartir + persistencia, D4) */
  serializeCurrent: () => string
  /** Vacía sessionStorage y vuelve al preset por defecto (D5) */
  reset: () => void
}

const TOKEN_RANGE = RANGES as Record<string, Range>

const SCHEDULE_RANGE = {
  hoursPerDay: RANGES.hoursPerDay,
  daysPerWeek: RANGES.daysPerWeek,
  dutyCycle: RANGES.dutyCycle,
  agents: RANGES.agents,
} as const

const MOD_DEFAULTS: ModifierDefaults = {
  batchFraction: DEFAULT_BATCH_FRACTION,
  regional: DEFAULT_REGIONAL,
  employerMultiplier: DEFAULT_EMPLOYER_MULTIPLIER,
  effectiveHours: DEFAULT_EFFECTIVE_HOURS,
}

function presetById(id: string) {
  const preset = presets.find((p) => p.id === id)
  if (!preset) throw new Error(`Preset desconocido: ${id}`)
  return preset
}

/** true si el escenario coincide exactamente con su preset base (para derivar `isCustomized`) */
function sameScenarioAsPreset(s: Scenario, preset: Preset): boolean {
  if (
    s.hoursPerDay !== preset.hoursPerDay ||
    s.daysPerWeek !== preset.daysPerWeek ||
    s.dutyCycle !== preset.dutyCycle ||
    s.agents !== preset.agents
  )
    return false
  const tokenKeys = new Set([...Object.keys(s.tokens), ...Object.keys(preset.tokens)])
  for (const k of tokenKeys) if (s.tokens[k] !== preset.tokens[k]) return false
  const mixKeys = new Set([...Object.keys(s.mix), ...Object.keys(preset.mix)])
  for (const k of mixKeys) if (s.mix[k] !== preset.mix[k]) return false
  return true
}

// Precedencia al cargar (D3): URL con estado → sessionStorage → preset por defecto.
const incomingSearch = typeof window === 'undefined' ? '' : window.location.search
const fromUrl = hasScenarioParams(incomingSearch)
const initialQuery = fromUrl ? incomingSearch : (readSession() ?? '')
const initial = deserializeScenario(
  initialQuery,
  presets,
  DEFAULT_PRESET_ID,
  DEFAULT_FX_EUR_PER_USD,
  pricingTable.version,
  DEFAULT_CURRENCY,
  MOD_DEFAULTS,
)

export const useScenarioStore = create<ScenarioStore>((set, get) => {
  // Query serializada del estado actual; reutilizada por la persistencia y por "Copiar enlace"
  const buildQuery = () => {
    const {
      scenario,
      presetId,
      fx,
      currency,
      batchEnabled,
      batchFraction,
      regional,
      storageEnabled,
      employerMultiplier,
      effectiveHours,
      priceOverrides,
      presentation,
    } = get()
    return serializeScenario(
      scenario,
      presetId,
      fx,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
      presetById(presetId),
      currency,
      DEFAULT_CURRENCY,
      {
        batchEnabled,
        batchFraction,
        regional,
        storageEnabled,
        employerMultiplier,
        effectiveHours,
        priceOverrides,
        presentation,
      },
      MOD_DEFAULTS,
    )
  }

  // Persiste el escenario en sessionStorage (la URL ya no se ensucia durante la edición, D2)
  const syncSession = () => writeSession(buildQuery())

  const update = (partial: Partial<ScenarioStore>) => {
    set(partial)
    syncSession()
  }

  // Aplica un preset: su bloque de batch (P5/O5/G5 lo activan); el almacenamiento (propio de
  // Gemini) se resetea al cambiar de familia. El recargo regional es global y no se toca aquí.
  const applyPreset = (id: string) => {
    const preset = presetById(id)
    const providerChanged = preset.provider !== get().scenario.providerId
    update({
      scenario: scenarioFromPreset(preset),
      presetId: id,
      isCustomized: false,
      batchEnabled: preset.modifiers?.batchEnabled ?? false,
      batchFraction: preset.modifiers?.batchFraction ?? DEFAULT_BATCH_FRACTION,
      ...(providerChanged ? { storageEnabled: DEFAULT_STORAGE_ENABLED } : {}),
    })
  }

  return {
    scenario: initial.scenario,
    presetId: initial.presetId,
    isCustomized: initial.isCustomized,
    providerCache: {},
    fx: initial.fx,
    currency: initial.currency,
    staleVersion: initial.staleVersion,
    profileGross: Object.fromEntries(salaryData.profiles.map((p) => [p.id, p.grossAnnualEUR])),

    batchEnabled: initial.batchEnabled,
    batchFraction: initial.batchFraction,
    regional: initial.regional,
    storageEnabled: initial.storageEnabled,
    employerMultiplier: initial.employerMultiplier,
    effectiveHours: initial.effectiveHours,
    priceOverrides: initial.priceOverrides,
    presentation: initial.presentation,

    // Cambio de proveedor activo. Modelo "globales": las tasas de token con clave compartida
    // (input/output/cache read) describen la carga del agente Y el régimen/utilización completo
    // (horas/día, días/semana, duty, agentes) se aplican a las tres familias. Solo la mezcla y las
    // categorías de token propias (cache write, almacenamiento) se recuerdan POR FAMILIA. Batch y
    // recargo regional también son GLOBALES: no se memorizan ni se resetean al cambiar de familia,
    // persisten tal cual. Al volver a una familia ya visitada se restaura su estado (no se resetea
    // por el ida y vuelta); la primera vez se ancla a su preset análogo (P3↔O3↔G3). En ambos casos
    // las tasas compartidas y el régimen se sincronizan con los globales actuales.
    setProvider: (providerId) => {
      const state = get()
      const { scenario, presetId } = state
      if (providerId === scenario.providerId) return

      // Memoriza el estado per-familia de la que se abandona (sin batch/regional, que son globales)
      const providerCache = {
        ...state.providerCache,
        [scenario.providerId]: {
          scenario,
          presetId,
          storageEnabled: state.storageEnabled,
        },
      }

      // Aplica los globales sobre el escenario de la familia destino: tasas de token compartidas
      // (claves presentes en ambos) y el régimen/utilización completo. La mezcla y las categorías de
      // token propias (cache write, almacenamiento) quedan tal cual las trae la familia destino.
      const withGlobals = (familyScenario: Scenario): Scenario => {
        const tokens = { ...familyScenario.tokens }
        for (const key of Object.keys(tokens)) {
          if (scenario.tokens[key] !== undefined) tokens[key] = scenario.tokens[key]
        }
        return {
          ...familyScenario,
          tokens,
          hoursPerDay: scenario.hoursPerDay,
          daysPerWeek: scenario.daysPerWeek,
          dutyCycle: scenario.dutyCycle,
          agents: scenario.agents,
        }
      }

      // El CASO DE USO es global: el régimen y las tasas de token compartidas (globales) describen el
      // caso activo, así que la familia destino se ancla SIEMPRE al análogo del caso actual (mismo
      // número: P5→O5→G5). Su memoria por familia solo se restaura si corresponde al MISMO caso (mismo
      // análogo); si entre medias se cargó otro caso de uso, esa memoria es obsoleta y se descarta para
      // no arrastrar la mezcla/tokens propios de un caso que ya no está activo (lo que marcaba
      // "Personalizado" sin que el usuario tocara nada).
      const preset = analogPresetFor(presetId, providerId)
      const cached = state.providerCache[providerId]
      const restoreCache = cached?.presetId === preset.id
      const next = withGlobals(restoreCache ? cached!.scenario : scenarioFromPreset(preset))
      update({
        providerCache,
        scenario: next,
        presetId: preset.id,
        isCustomized: !sameScenarioAsPreset(next, preset),
        storageEnabled: restoreCache ? cached!.storageEnabled : DEFAULT_STORAGE_ENABLED,
      })
    },

    loadPreset: (id) => applyPreset(id),

    setToken: (field, value) => {
      const { scenario } = get()
      const clamped = clamp(value, TOKEN_RANGE[field] ?? { min: 0, max: Number.MAX_SAFE_INTEGER })
      update({
        scenario: { ...scenario, tokens: { ...scenario.tokens, [field]: clamped } },
        isCustomized: true,
      })
    },

    setMix: (model, value) => {
      const { scenario } = get()
      const provider = pricingTable.providers[scenario.providerId]
      const mix = { ...scenario.mix }
      // Clamping bidireccional: el slider movido se frena en 100 − (resto de no-resto) (D7)
      const othersSum = Object.keys(provider.models)
        .filter((k) => k !== provider.remainderModel && k !== model)
        .reduce((s, k) => s + (mix[k] ?? 0), 0)
      mix[model] = clamp(Math.min(value, Number((1 - othersSum).toFixed(6))), RANGES.mix)
      applyRemainder(mix, provider)
      update({ scenario: { ...scenario, mix }, isCustomized: true })
    },

    setSchedule: (field, value) => {
      const { scenario } = get()
      const clamped = clamp(value, SCHEDULE_RANGE[field])
      update({ scenario: { ...scenario, [field]: clamped }, isCustomized: true })
    },

    applyRegime: (hoursPerDay, daysPerWeek) => {
      const { scenario } = get()
      update({
        scenario: {
          ...scenario,
          hoursPerDay: clamp(hoursPerDay, RANGES.hoursPerDay),
          daysPerWeek: clamp(daysPerWeek, RANGES.daysPerWeek),
        },
        isCustomized: true,
      })
    },

    setFx: (value) => {
      update({ fx: clamp(value, RANGES.fx) })
    },

    setCurrency: (c) => {
      update({ currency: c })
    },

    setProfileGross: (profileId, value) => {
      set({ profileGross: { ...get().profileGross, [profileId]: Math.max(0, value) } })
    },

    dismissStaleVersion: () => set({ staleVersion: null }),

    setBatchEnabled: (value) => update({ batchEnabled: value }),
    setBatchFraction: (value) => update({ batchFraction: clamp(value, RANGES.batchFraction) }),
    setRegional: (value) => update({ regional: value }),
    setStorageEnabled: (value) => update({ storageEnabled: value }),
    setEmployerMultiplier: (value) =>
      update({ employerMultiplier: clamp(value, RANGES.employerMultiplier) }),
    setEffectiveHours: (value) => update({ effectiveHours: clamp(value, RANGES.effectiveHours) }),

    setPriceOverride: (model, category, value) => {
      const { priceOverrides } = get()
      update({
        priceOverrides: {
          ...priceOverrides,
          [model]: { ...priceOverrides[model], [category]: Math.max(0, value) },
        },
      })
    },

    resetPriceOverrides: () => update({ priceOverrides: {} }),

    togglePresentation: () => update({ presentation: !get().presentation }),

    serializeCurrent: buildQuery,

    reset: () => {
      // Vacía la sesión y vuelve al preset por defecto con modificadores neutros (D5).
      clearSession()
      const preset = presetById(DEFAULT_PRESET_ID)
      set({
        scenario: scenarioFromPreset(preset),
        presetId: DEFAULT_PRESET_ID,
        isCustomized: false,
        providerCache: {},
        staleVersion: null,
        batchEnabled: false,
        batchFraction: DEFAULT_BATCH_FRACTION,
        regional: defaultRegional(),
        storageEnabled: DEFAULT_STORAGE_ENABLED,
        employerMultiplier: DEFAULT_EMPLOYER_MULTIPLIER,
        effectiveHours: DEFAULT_EFFECTIVE_HOURS,
        priceOverrides: {},
        presentation: false,
      })
    },
  }
})

// Adopción de un enlace entrante (D3): se guarda en sessionStorage y la URL se limpia.
if (fromUrl) {
  writeSession(useScenarioStore.getState().serializeCurrent())
  writeUrl('')
}

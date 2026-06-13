import { create } from 'zustand'
import type {
  ModelId,
  ModelKey,
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
  defaultPresetFor,
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

interface ScenarioStore {
  scenario: Scenario
  /** Preset base del escenario actual */
  presetId: string
  /** true → "Personalizado (basado en …)" */
  isCustomized: boolean
  /** Tipo de cambio EUR por USD */
  fx: number
  /** Moneda de presentación global (defecto EUR) */
  currency: Currency
  /** Versión de precios de una URL compartida cuando difiere de la actual */
  staleVersion: string | null
  /** Brutos anuales editados en sesión (sin persistencia) */
  profileGross: Record<string, number>

  // Modificadores de configuración avanzada (Fase 2, D2)
  batchEnabled: boolean
  batchFraction: number
  regional: boolean
  /** Término de almacenamiento de caché (Gemini) activo (D3) */
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

  // Aplica un preset: su bloque de modificadores; al cambiar de familia resetea regional/storage
  const applyPreset = (id: string) => {
    const preset = presetById(id)
    const providerChanged = preset.provider !== get().scenario.providerId
    update({
      scenario: scenarioFromPreset(preset),
      presetId: id,
      isCustomized: false,
      batchEnabled: preset.modifiers?.batchEnabled ?? false,
      batchFraction: preset.modifiers?.batchFraction ?? DEFAULT_BATCH_FRACTION,
      ...(providerChanged
        ? { regional: defaultRegional(preset.provider), storageEnabled: DEFAULT_STORAGE_ENABLED }
        : {}),
    })
  }

  return {
    scenario: initial.scenario,
    presetId: initial.presetId,
    isCustomized: initial.isCustomized,
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

    // Cambio de proveedor activo: carga el preset por defecto de la familia (D7)
    setProvider: (providerId) => applyPreset(defaultPresetFor(providerId).id),

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
        staleVersion: null,
        batchEnabled: false,
        batchFraction: DEFAULT_BATCH_FRACTION,
        regional: defaultRegional(preset.provider),
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

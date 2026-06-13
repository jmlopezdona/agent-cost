import { create } from 'zustand'
import type { ModelId, PriceField, PriceOverrides, Scenario, TokenRates } from '../engine/types'
import {
  DEFAULT_BATCH_FRACTION,
  DEFAULT_CURRENCY,
  DEFAULT_EFFECTIVE_HOURS,
  DEFAULT_EMPLOYER_MULTIPLIER,
  DEFAULT_FX_EUR_PER_USD,
  DEFAULT_PRESET_ID,
  presets,
  pricingTable,
  salaryData,
  type Currency,
} from '../data'
import { clamp, RANGES } from '../lib/ranges'
import {
  deserializeScenario,
  mixRemainder,
  scenarioFromPreset,
  serializeScenario,
  writeUrl,
  type ModifierDefaults,
} from './urlSync'

type MixSliderId = 'fable' | 'opus' | 'sonnet'
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
  employerMultiplier: number
  effectiveHours: number
  priceOverrides: PriceOverrides
  /** Modo presentación (flag de vista, D6) */
  presentation: boolean

  loadPreset: (id: string) => void
  setToken: (field: keyof TokenRates, value: number) => void
  setMix: (model: MixSliderId, value: number) => void
  setSchedule: (field: ScheduleField, value: number) => void
  applyRegime: (hoursPerDay: number, daysPerWeek: number) => void
  setFx: (value: number) => void
  setCurrency: (c: Currency) => void
  setProfileGross: (profileId: string, value: number) => void
  dismissStaleVersion: () => void

  setBatchEnabled: (value: boolean) => void
  setBatchFraction: (value: number) => void
  setRegional: (value: boolean) => void
  setEmployerMultiplier: (value: number) => void
  setEffectiveHours: (value: number) => void
  setPriceOverride: (model: ModelId, field: PriceField, value: number) => void
  resetPriceOverrides: () => void
  togglePresentation: () => void
}

const TOKEN_RANGE = {
  inputK: RANGES.inputK,
  outputK: RANGES.outputK,
  cacheReadM: RANGES.cacheReadM,
  cacheWriteK: RANGES.cacheWriteK,
} as const

const SCHEDULE_RANGE = {
  hoursPerDay: RANGES.hoursPerDay,
  daysPerWeek: RANGES.daysPerWeek,
  dutyCycle: RANGES.dutyCycle,
  agents: RANGES.agents,
} as const

const MOD_DEFAULTS: ModifierDefaults = {
  batchFraction: DEFAULT_BATCH_FRACTION,
  employerMultiplier: DEFAULT_EMPLOYER_MULTIPLIER,
  effectiveHours: DEFAULT_EFFECTIVE_HOURS,
}

function presetById(id: string) {
  const preset = presets.find((p) => p.id === id)
  if (!preset) throw new Error(`Preset desconocido: ${id}`)
  return preset
}

const initial = deserializeScenario(
  typeof window === 'undefined' ? '' : window.location.search,
  presets,
  DEFAULT_PRESET_ID,
  DEFAULT_FX_EUR_PER_USD,
  pricingTable.version,
  DEFAULT_CURRENCY,
  MOD_DEFAULTS,
)

export const useScenarioStore = create<ScenarioStore>((set, get) => {
  const syncUrl = () => {
    const {
      scenario,
      presetId,
      fx,
      currency,
      batchEnabled,
      batchFraction,
      regional,
      employerMultiplier,
      effectiveHours,
      priceOverrides,
      presentation,
    } = get()
    writeUrl(
      serializeScenario(
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
          employerMultiplier,
          effectiveHours,
          priceOverrides,
          presentation,
        },
        MOD_DEFAULTS,
      ),
    )
  }

  const update = (partial: Partial<ScenarioStore>) => {
    set(partial)
    syncUrl()
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
    employerMultiplier: initial.employerMultiplier,
    effectiveHours: initial.effectiveHours,
    priceOverrides: initial.priceOverrides,
    presentation: initial.presentation,

    loadPreset: (id) => {
      // El preset aplica su bloque de modificadores; los demás quedan neutros (D1)
      const preset = presetById(id)
      const batchEnabled = preset.modifiers?.batchEnabled ?? false
      const batchFraction = preset.modifiers?.batchFraction ?? DEFAULT_BATCH_FRACTION
      update({
        scenario: scenarioFromPreset(preset),
        presetId: id,
        isCustomized: false,
        batchEnabled,
        batchFraction,
      })
    },

    setToken: (field, value) => {
      const { scenario } = get()
      const clamped = clamp(value, TOKEN_RANGE[field])
      update({
        scenario: { ...scenario, tokens: { ...scenario.tokens, [field]: clamped } },
        isCustomized: true,
      })
    },

    setMix: (model, value) => {
      const { scenario } = get()
      const mix = { ...scenario.mix }
      const othersSum = (['fable', 'opus', 'sonnet'] as const)
        .filter((id) => id !== model)
        .reduce((s, id) => s + mix[id], 0)
      // Clamping bidireccional: el slider movido se frena en 100 − resto (D7)
      mix[model] = clamp(Math.min(value, Number((1 - othersSum).toFixed(6))), RANGES.mix)
      mix.haiku = mixRemainder(mix.fable, mix.opus, mix.sonnet)
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
      // El tipo de cambio no forma parte de los presets: no marca "Personalizado"
      update({ fx: clamp(value, RANGES.fx) })
    },

    setCurrency: (c) => {
      // La moneda es estado de presentación: no marca "Personalizado"
      update({ currency: c })
    },

    setProfileGross: (profileId, value) => {
      // Edición de sesión, sin persistencia ni URL
      set({ profileGross: { ...get().profileGross, [profileId]: Math.max(0, value) } })
    },

    dismissStaleVersion: () => set({ staleVersion: null }),

    // Modificadores: como fx/currency, no marcan "Personalizado" (D2)
    setBatchEnabled: (value) => update({ batchEnabled: value }),
    setBatchFraction: (value) => update({ batchFraction: clamp(value, RANGES.batchFraction) }),
    setRegional: (value) => update({ regional: value }),
    setEmployerMultiplier: (value) =>
      update({ employerMultiplier: clamp(value, RANGES.employerMultiplier) }),
    setEffectiveHours: (value) => update({ effectiveHours: clamp(value, RANGES.effectiveHours) }),

    setPriceOverride: (model, field, value) => {
      const { priceOverrides } = get()
      update({
        priceOverrides: {
          ...priceOverrides,
          [model]: { ...priceOverrides[model], [field]: Math.max(0, value) },
        },
      })
    },

    resetPriceOverrides: () => update({ priceOverrides: {} }),

    togglePresentation: () => update({ presentation: !get().presentation }),
  }
})

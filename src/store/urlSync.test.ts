import { describe, expect, it } from 'vitest'
import {
  deserializeScenario,
  scenarioFromPreset,
  serializeScenario,
  type ModifierDefaults,
  type ModifierState,
} from './urlSync'
import {
  DEFAULT_BATCH_FRACTION,
  DEFAULT_CURRENCY,
  DEFAULT_EFFECTIVE_HOURS,
  DEFAULT_EMPLOYER_MULTIPLIER,
  DEFAULT_FX_EUR_PER_USD,
  DEFAULT_PRESET_ID,
  presets,
  pricingTable,
  type Currency,
} from '../data'

const P2 = presets.find((p) => p.id === 'P2')!

const MOD_DEFAULTS: ModifierDefaults = {
  batchFraction: DEFAULT_BATCH_FRACTION,
  employerMultiplier: DEFAULT_EMPLOYER_MULTIPLIER,
  effectiveHours: DEFAULT_EFFECTIVE_HOURS,
}

const NEUTRAL_MODS: ModifierState = {
  batchEnabled: false,
  batchFraction: DEFAULT_BATCH_FRACTION,
  regional: false,
  employerMultiplier: DEFAULT_EMPLOYER_MULTIPLIER,
  effectiveHours: DEFAULT_EFFECTIVE_HOURS,
  priceOverrides: {},
  presentation: false,
}

function deserialize(query: string) {
  return deserializeScenario(
    query,
    presets,
    DEFAULT_PRESET_ID,
    DEFAULT_FX_EUR_PER_USD,
    pricingTable.version,
    DEFAULT_CURRENCY,
    MOD_DEFAULTS,
  )
}

function roundTrip(
  scenario: ReturnType<typeof scenarioFromPreset>,
  presetId: string,
  fx: number,
  currency: Currency = DEFAULT_CURRENCY,
  mods: ModifierState = NEUTRAL_MODS,
) {
  const query = serializeScenario(
    scenario,
    presetId,
    fx,
    DEFAULT_FX_EUR_PER_USD,
    pricingTable.version,
    presets.find((p) => p.id === presetId)!,
    currency,
    DEFAULT_CURRENCY,
    mods,
    MOD_DEFAULTS,
  )
  return { query, restored: deserialize(query) }
}

describe('serialización en URL', () => {
  it('preset sin modificar serializa solo p y pv', () => {
    const { query } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD)
    const params = new URLSearchParams(query)
    expect(params.get('p')).toBe('P2')
    expect(params.get('pv')).toBe(pricingTable.version)
    expect([...params.keys()].sort()).toEqual(['p', 'pv'])
  })

  it('round-trip de un escenario personalizado es idéntico', () => {
    const scenario = scenarioFromPreset(P2)
    scenario.tokens.cacheReadM = 60
    scenario.tokens.outputK = 305
    scenario.dutyCycle = 0.7
    scenario.agents = 5
    scenario.mix = { fable: 0.1, opus: 0.25, sonnet: 0.45, haiku: 0.2 }

    const { restored } = roundTrip(scenario, 'P2', 0.95)

    expect(restored.scenario).toEqual(scenario)
    expect(restored.presetId).toBe('P2')
    expect(restored.fx).toBe(0.95)
    expect(restored.isCustomized).toBe(true)
    expect(restored.staleVersion).toBeNull()
  })

  it('round-trip de cada preset sin modificar no marca personalizado', () => {
    for (const preset of presets) {
      const { restored } = roundTrip(scenarioFromPreset(preset), preset.id, DEFAULT_FX_EUR_PER_USD)
      expect(restored.scenario).toEqual(scenarioFromPreset(preset))
      expect(restored.isCustomized).toBe(false)
    }
  })

  it('sin query usa el preset por defecto P2', () => {
    const restored = deserialize('')
    expect(restored.presetId).toBe('P2')
    expect(restored.scenario).toEqual(scenarioFromPreset(P2))
    expect(restored.isCustomized).toBe(false)
  })

  it('parámetro no numérico se descarta con fallback al preset', () => {
    const restored = deserialize('p=P2&pv=x&cr=abc&dc=70')
    expect(restored.scenario.tokens.cacheReadM).toBe(P2.tokens.cacheReadM)
    expect(restored.scenario.dutyCycle).toBeCloseTo(0.7, 10)
  })

  it('parámetro fuera de rango se clampa', () => {
    const restored = deserialize('p=P2&i=9999&n=500')
    expect(restored.scenario.tokens.inputK).toBe(500)
    expect(restored.scenario.agents).toBe(100)
  })

  it('preset desconocido cae al preset por defecto', () => {
    const restored = deserialize('p=P99')
    expect(restored.presetId).toBe('P2')
  })

  it('pv distinto de la versión actual produce aviso', () => {
    const restored = deserialize('p=P2&pv=2025-01')
    expect(restored.staleVersion).toBe('2025-01')
  })

  it('mezcla cuya suma supera 100 en la URL se normaliza y Haiku queda en 0', () => {
    const restored = deserialize('p=P2&mf=60&mo=60&ms=60')
    const { fable, opus, sonnet, haiku } = restored.scenario.mix
    expect(fable + opus + sonnet + haiku).toBeCloseTo(1, 10)
    expect(haiku).toBeCloseTo(0, 10)
  })

  it('moneda por defecto (EUR) no aparece en la URL', () => {
    const { query, restored } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD, 'eur')
    expect(new URLSearchParams(query).has('cur')).toBe(false)
    expect(restored.currency).toBe('eur')
  })

  it('moneda USD se serializa como cur y se restaura', () => {
    const { query, restored } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD, 'usd')
    expect(new URLSearchParams(query).get('cur')).toBe('usd')
    expect(restored.currency).toBe('usd')
  })

  it('valor de moneda inválido cae al defecto EUR', () => {
    const restored = deserialize('p=P2&cur=gbp')
    expect(restored.currency).toBe('eur')
  })

  it('los modificadores activos se serializan y restauran', () => {
    const mods: ModifierState = {
      ...NEUTRAL_MODS,
      batchEnabled: true,
      batchFraction: 0.4,
      regional: true,
    }
    const { query, restored } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD, 'eur', mods)
    const params = new URLSearchParams(query)
    expect(params.get('b')).toBe('40')
    expect(params.get('bd')).toBe('1')
    expect(restored.batchEnabled).toBe(true)
    expect(restored.batchFraction).toBeCloseTo(0.4, 10)
    expect(restored.regional).toBe(true)
  })

  it('batch desactivado y recargo off no aparecen en la URL', () => {
    const { query, restored } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD)
    const params = new URLSearchParams(query)
    expect(params.has('b')).toBe(false)
    expect(params.has('bd')).toBe(false)
    expect(restored.batchEnabled).toBe(false)
    expect(restored.regional).toBe(false)
  })

  it('multiplicador y horas efectivas se serializan solo si difieren del defecto', () => {
    const neutral = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD)
    expect(new URLSearchParams(neutral.query).has('em')).toBe(false)
    expect(new URLSearchParams(neutral.query).has('eh')).toBe(false)

    const edited: ModifierState = { ...NEUTRAL_MODS, employerMultiplier: 1.4, effectiveHours: 1600 }
    const { query, restored } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD, 'eur', edited)
    const params = new URLSearchParams(query)
    expect(params.get('em')).toBe('1.4')
    expect(params.get('eh')).toBe('1600')
    expect(restored.employerMultiplier).toBeCloseTo(1.4, 10)
    expect(restored.effectiveHours).toBe(1600)
  })

  it('los overrides de precios se serializan como deltas y se restauran', () => {
    const mods: ModifierState = {
      ...NEUTRAL_MODS,
      priceOverrides: { opus: { output: 30 }, haiku: { input: 1.2 } },
    }
    const { query, restored } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD, 'eur', mods)
    const px = new URLSearchParams(query).get('px')!
    expect(px).toContain('opus.output:30')
    expect(px).toContain('haiku.input:1.2')
    expect(restored.priceOverrides).toEqual({ opus: { output: 30 }, haiku: { input: 1.2 } })
  })

  it('override con modelo o campo desconocido se descarta', () => {
    const restored = deserialize('p=P2&px=foo.output:30,opus.bar:5,opus.output:abc,sonnet.input:9')
    expect(restored.priceOverrides).toEqual({ sonnet: { input: 9 } })
  })

  it('present=1 activa el modo presentación y se omite por defecto', () => {
    expect(deserialize('p=P2&present=1').presentation).toBe(true)
    const { query } = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD)
    expect(new URLSearchParams(query).has('present')).toBe(false)
    const present = roundTrip(scenarioFromPreset(P2), 'P2', DEFAULT_FX_EUR_PER_USD, 'eur', {
      ...NEUTRAL_MODS,
      presentation: true,
    })
    expect(new URLSearchParams(present.query).get('present')).toBe('1')
    expect(present.restored.presentation).toBe(true)
  })

  it('valores de modificadores inválidos caen al defecto', () => {
    const restored = deserialize('p=P2&b=abc&em=xyz&eh=-5')
    expect(restored.batchEnabled).toBe(false)
    expect(restored.employerMultiplier).toBe(DEFAULT_EMPLOYER_MULTIPLIER)
    // eh=-5 es numérico pero se clampa al mínimo del rango
    expect(restored.effectiveHours).toBe(1)
  })
})

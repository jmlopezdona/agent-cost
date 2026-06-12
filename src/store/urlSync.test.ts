import { describe, expect, it } from 'vitest'
import { deserializeScenario, scenarioFromPreset, serializeScenario } from './urlSync'
import { DEFAULT_FX_EUR_PER_USD, DEFAULT_PRESET_ID, presets, pricingTable } from '../data'

const P2 = presets.find((p) => p.id === 'P2')!

function roundTrip(scenario: ReturnType<typeof scenarioFromPreset>, presetId: string, fx: number) {
  const query = serializeScenario(
    scenario,
    presetId,
    fx,
    DEFAULT_FX_EUR_PER_USD,
    pricingTable.version,
    presets.find((p) => p.id === presetId)!,
  )
  return {
    query,
    restored: deserializeScenario(
      query,
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    ),
  }
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
    const restored = deserializeScenario(
      '',
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    )
    expect(restored.presetId).toBe('P2')
    expect(restored.scenario).toEqual(scenarioFromPreset(P2))
    expect(restored.isCustomized).toBe(false)
  })

  it('parámetro no numérico se descarta con fallback al preset', () => {
    const restored = deserializeScenario(
      'p=P2&pv=x&cr=abc&dc=70',
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    )
    expect(restored.scenario.tokens.cacheReadM).toBe(P2.tokens.cacheReadM)
    expect(restored.scenario.dutyCycle).toBeCloseTo(0.7, 10)
  })

  it('parámetro fuera de rango se clampa', () => {
    const restored = deserializeScenario(
      'p=P2&i=9999&n=500',
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    )
    expect(restored.scenario.tokens.inputK).toBe(500)
    expect(restored.scenario.agents).toBe(100)
  })

  it('preset desconocido cae al preset por defecto', () => {
    const restored = deserializeScenario(
      'p=P99',
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    )
    expect(restored.presetId).toBe('P2')
  })

  it('pv distinto de la versión actual produce aviso', () => {
    const restored = deserializeScenario(
      'p=P2&pv=2025-01',
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    )
    expect(restored.staleVersion).toBe('2025-01')
  })

  it('mezcla cuya suma supera 100 en la URL se normaliza y Haiku queda en 0', () => {
    const restored = deserializeScenario(
      'p=P2&mf=60&mo=60&ms=60',
      presets,
      DEFAULT_PRESET_ID,
      DEFAULT_FX_EUR_PER_USD,
      pricingTable.version,
    )
    const { fable, opus, sonnet, haiku } = restored.scenario.mix
    expect(fable + opus + sonnet + haiku).toBeCloseTo(1, 10)
    expect(haiku).toBeCloseTo(0, 10)
  })
})

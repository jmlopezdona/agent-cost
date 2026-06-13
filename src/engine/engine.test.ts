import { describe, expect, it } from 'vitest'
import { blendedRate, computeResults, hourlyRate, scheduledHoursPerMonth } from './engine'
import { agentEurPerActiveHour, employerCost, fteEquivalence, hoursRatio, usdToEur } from './salary'
import type { Scenario } from './types'
import { pricingTable, presets, salaryData } from '../data'
import { scenarioFromPreset } from '../store/urlSync'

const anthropic = pricingTable.providers.anthropic
const openai = pricingTable.providers.openai
const google = pricingTable.providers.google

const byId = (id: string): Scenario => {
  const preset = presets.find((p) => p.id === id)
  if (!preset) throw new Error(`Preset ${id} no encontrado`)
  return scenarioFromPreset(preset)
}

const P1 = byId('P1')
const P2 = byId('P2')
const P4 = byId('P4')
const anthropicKeys = Object.keys(anthropic.models)

function expectWithin1Percent(actual: number, reference: number) {
  expect(Math.abs(actual - reference) / reference).toBeLessThan(0.01)
}

describe('hourlyRate', () => {
  it('calcula la tarifa de Sonnet con el perfil P2 sin redondeo interno', () => {
    const rate = hourlyRate(P2.tokens, anthropic.models.sonnet, anthropic)
    // 42/1000×3 + 210/1000×15 + 30×0,30 + 530/1000×3,75
    expect(rate).toBeCloseTo(14.2635, 10)
  })

  it('una categoría a cero aporta 0 y el resto se calcula con normalidad', () => {
    const rate = hourlyRate({ ...P2.tokens, cacheReadM: 0 }, anthropic.models.sonnet, anthropic)
    expect(rate).toBeCloseTo(14.2635 - 30 * 0.3, 10)
  })

  it('todas las categorías a cero dan tarifa 0', () => {
    const rate = hourlyRate(
      { inputK: 0, outputK: 0, cacheReadM: 0, cacheWriteK: 0 },
      anthropic.models.opus,
      anthropic,
    )
    expect(rate).toBe(0)
  })

  it('esquema OpenAI (3 categorías) suma input + cached_input + output, sin escritura de caché', () => {
    const tokens = { inputK: 40, cacheReadM: 10, outputK: 200 }
    const rate = hourlyRate(tokens, openai.models['gpt-5.5'], openai)
    // 40/1000×5 + 10×0,5 + 200/1000×30 = 0,2 + 5 + 6 = 11,2
    expect(rate).toBeCloseTo((40 / 1000) * 5 + 10 * 0.5 + (200 / 1000) * 30, 10)
  })
})

describe('blendedRate', () => {
  it('mezcla 100% un modelo coincide con su tarifa', () => {
    const mix = { fable: 0, opus: 1, sonnet: 0, haiku: 0 }
    expect(blendedRate(P2.tokens, mix, anthropic)).toBe(
      hourlyRate(P2.tokens, anthropic.models.opus, anthropic),
    )
  })

  it('mezcla repartida es la suma ponderada de tarifas', () => {
    const expected = anthropicKeys.reduce(
      (sum, id) => sum + P2.mix[id] * hourlyRate(P2.tokens, anthropic.models[id], anthropic),
      0,
    )
    expect(blendedRate(P2.tokens, P2.mix, anthropic)).toBeCloseTo(expected, 10)
  })
})

describe('scheduledHoursPerMonth', () => {
  it('aplica el factor 52/12', () => {
    expect(scheduledHoursPerMonth(24, 7)).toBeCloseTo(728, 10)
    expect(scheduledHoursPerMonth(8, 5)).toBeCloseTo(40 * (52 / 12), 10)
  })
})

describe('caso de referencia dorado P2 (CA-01.3)', () => {
  const results = computeResults(P2, pricingTable)

  it('blend ≈ 13,8 $/h con error < 1%', () => {
    expectWithin1Percent(results.blendedRate, 13.8)
  })

  it('techo ≈ 10.060 $/mes con error < 1%', () => {
    expectWithin1Percent(results.ceilingMonthlyUSD, 10060)
  })

  it('ponderado ≈ 6.040 $/mes con error < 1%', () => {
    expectWithin1Percent(results.weightedMonthlyUSD, 6040)
  })

  it('ponderado anual = mensual × 12', () => {
    expect(results.weightedAnnualUSD).toBeCloseTo(results.weightedMonthlyUSD * 12, 8)
  })

  it('cache read es la categoría dominante del desglose', () => {
    const sorted = [...results.byCategory].sort((a, b) => b.usdPerHour - a.usdPerHour)
    expect(sorted[0].category).toBe('cache_read')
  })

  it('no hay coste de almacenamiento en Anthropic', () => {
    expect(results.storageMonthlyUSD).toBe(0)
  })
})

describe('casos dorados P1 y P4', () => {
  it('P1: blend Sonnet-heavy en régimen 8×5 supervisado', () => {
    const results = computeResults(P1, pricingTable)
    // 0,8 × 14,2635 + 0,2 × 4,7545 = 12,3617 $/h
    expect(results.blendedRate).toBeCloseTo(12.3617, 4)
    expect(results.ceilingMonthlyUSD).toBeCloseTo(12.3617 * 40 * (52 / 12), 2)
    expect(results.weightedMonthlyUSD).toBeCloseTo(results.ceilingMonthlyUSD * 0.3, 8)
  })

  it('P4: blend Evolutivos sobre código maduro', () => {
    const results = computeResults(P4, pricingTable)
    // 0,05 × 22,085 + 0,55 × 13,251 + 0,4 × 4,417 = 10,1591 $/h
    expect(results.blendedRate).toBeCloseTo(10.1591, 4)
    expect(results.weightedMonthlyUSD).toBeCloseTo(10.1591 * 728 * 0.7, 2)
  })
})

describe('término de almacenamiento de caché (storage, Gemini)', () => {
  // Escenario Google 100% Pro Preview; storage cache_storage = 4,50 USD/MTok·h
  const googleKeys = Object.keys(google.models)
  const mix: Record<string, number> = Object.fromEntries(googleKeys.map((k) => [k, 0]))
  mix['gemini-3.1-pro-preview'] = 1
  const base: Scenario = {
    providerId: 'google',
    tokens: { inputK: 40, outputK: 200, cacheReadM: 10, cacheStorageM: 2 },
    mix,
    hoursPerDay: 24,
    daysPerWeek: 7,
    dutyCycle: 0.6,
    agents: 1,
  }

  it('storage desactivado es neutro: no añade coste mensual', () => {
    const off = computeResults(base, pricingTable, { storageEnabled: false })
    expect(off.storageMonthlyUSD).toBe(0)
    const blendOnly = off.blendedRate * off.scheduledHoursMonth
    expect(off.ceilingMonthlyUSD).toBeCloseTo(blendOnly, 8)
  })

  it('storage activo suma R × P × horas_programadas al techo, sin tocar el blend $/h', () => {
    const off = computeResults(base, pricingTable, { storageEnabled: false })
    const on = computeResults(base, pricingTable, { storageEnabled: true })
    // R=2 MTok retenidos, P=4,50 USD/MTok·h, H=728 h/mes
    const expectedStorage = 2 * 4.5 * scheduledHoursPerMonth(24, 7)
    expect(on.storageMonthlyUSD).toBeCloseTo(expectedStorage, 6)
    expect(on.blendedRate).toBe(off.blendedRate)
    expect(on.ceilingMonthlyUSD).toBeCloseTo(off.ceilingMonthlyUSD + expectedStorage, 6)
  })
})

describe('modificadores por proveedor', () => {
  it('batch al 40% reduce el coste un 20% en OpenAI (declara batch)', () => {
    const tokens = { inputK: 40, cacheReadM: 10, outputK: 200 }
    const base = hourlyRate(tokens, openai.models['gpt-5.5'], openai)
    const batched = hourlyRate(tokens, openai.models['gpt-5.5'], openai, { batchFraction: 0.4 })
    expect(batched).toBeCloseTo(base * 0.8, 10)
  })

  it('Google declara regional: aplica el recargo igual que Anthropic y OpenAI', () => {
    const tokens = { inputK: 40, outputK: 200, cacheReadM: 10 }
    const base = hourlyRate(tokens, google.models['gemini-3.5-flash'], google)
    const surcharged = hourlyRate(tokens, google.models['gemini-3.5-flash'], google, {
      regionalSurcharge: 1.1,
    })
    expect(surcharged).toBeCloseTo(base * 1.1, 10)
  })

  it('composición batch 40% + recargo 1,10 en Anthropic multiplica por 0,88', () => {
    const base = computeResults(P2, pricingTable)
    const both = computeResults(P2, pricingTable, { batchFraction: 0.4, regionalSurcharge: 1.1 })
    expect(both.blendedRate).toBeCloseTo(base.blendedRate * 0.88, 10)
    expect(both.weightedMonthlyUSD).toBeCloseTo(base.weightedMonthlyUSD * 0.88, 10)
  })
})

describe('escalado y desglose', () => {
  it('pasar de 1 a 5 agentes multiplica techo y ponderado por 5', () => {
    const base = computeResults(P2, pricingTable)
    const scaled = computeResults({ ...P2, agents: 5 }, pricingTable)
    expect(scaled.ceilingMonthlyUSD).toBeCloseTo(base.ceilingMonthlyUSD * 5, 8)
    expect(scaled.weightedMonthlyUSD).toBeCloseTo(base.weightedMonthlyUSD * 5, 8)
    expect(scaled.weightedAnnualUSD).toBeCloseTo(base.weightedAnnualUSD * 5, 8)
  })

  it('la suma del desglose por categoría es igual al blend y los % suman 100', () => {
    const results = computeResults(P2, pricingTable)
    const sumUsd = results.byCategory.reduce((s, c) => s + c.usdPerHour, 0)
    const sumShare = results.byCategory.reduce((s, c) => s + c.share, 0)
    expect(sumUsd).toBeCloseTo(results.blendedRate, 10)
    expect(sumShare).toBeCloseTo(1, 10)
  })

  it('la suma del desglose por modelo es igual al blend', () => {
    const results = computeResults(P2, pricingTable)
    const sum = anthropicKeys.reduce((s, id) => s + results.byModel[id], 0)
    expect(sum).toBeCloseTo(results.blendedRate, 10)
  })

  it('con blend 0 los porcentajes del desglose son 0, no NaN', () => {
    const zero: Scenario = {
      ...P2,
      tokens: { inputK: 0, outputK: 0, cacheReadM: 0, cacheWriteK: 0 },
    }
    const results = computeResults(zero, pricingTable)
    for (const c of results.byCategory) expect(c.share).toBe(0)
  })
})

describe('hooks neutros del motor', () => {
  it('batchFraction 0 y recargo 1 no alteran el resultado', () => {
    const base = computeResults(P2, pricingTable)
    const withDefaults = computeResults(P2, pricingTable, {
      batchFraction: 0,
      regionalSurcharge: 1,
    })
    expect(withDefaults.blendedRate).toBe(base.blendedRate)
  })

  it('los hooks aplican el modificador esperado cuando se activan', () => {
    const base = computeResults(P2, pricingTable)
    const batched = computeResults(P2, pricingTable, { batchFraction: 0.8 })
    const surcharged = computeResults(P2, pricingTable, { regionalSurcharge: 1.1 })
    expect(batched.blendedRate).toBeCloseTo(base.blendedRate * (1 - 0.8 * 0.5), 10)
    expect(surcharged.blendedRate).toBeCloseTo(base.blendedRate * 1.1, 10)
  })

  it('batch al 40% multiplica el coste por 0,80', () => {
    const base = computeResults(P2, pricingTable)
    const batched = computeResults(P2, pricingTable, { batchFraction: 0.4 })
    expect(batched.weightedMonthlyUSD).toBeCloseTo(base.weightedMonthlyUSD * 0.8, 10)
  })

  it('recargo regional multiplica el coste por 1,10', () => {
    const base = computeResults(P2, pricingTable)
    const surcharged = computeResults(P2, pricingTable, { regionalSurcharge: 1.1 })
    expect(surcharged.weightedMonthlyUSD).toBeCloseTo(base.weightedMonthlyUSD * 1.1, 10)
  })

  it('caso dorado de P2 intacto con defaults neutros explícitos', () => {
    const neutral = computeResults(P2, pricingTable, {
      batchFraction: 0,
      batchDiscount: 0.5,
      regionalSurcharge: 1,
    })
    expectWithin1Percent(neutral.blendedRate, 13.8)
    expectWithin1Percent(neutral.ceilingMonthlyUSD, 10060)
    expectWithin1Percent(neutral.weightedMonthlyUSD, 6040)
  })
})

describe('desempeño SWE-Pro ponderado y coste por punto (D2/D3)', () => {
  it('P2: weightedSwePro ≈ 61,48, cobertura 1 y coste/punto ≈ 98, sin tocar el coste dorado', () => {
    const results = computeResults(P2, pricingTable)
    // 0,15×69,2 + 0,65×62 + 0,20×54 = 61,48 (Fable 0%)
    expect(results.weightedSwePro).toBeCloseTo(61.48, 6)
    expect(results.sweProCoverage).toBeCloseTo(1, 10)
    // ponderado ≈ 6.040 $/mes / 61,48 ≈ 98 $/mes·pto
    expect(results.costPerPointUSD).toBeCloseTo(results.weightedMonthlyUSD / 61.48, 6)
    expectWithin1Percent(results.costPerPointUSD, 98)
    // El score no toca ninguna métrica de coste (caso dorado intacto)
    expectWithin1Percent(results.blendedRate, 13.8)
    expectWithin1Percent(results.weightedMonthlyUSD, 6040)
  })

  it('mezcla 100% en un modelo medido da su score exacto y coste/punto = ponderado / score', () => {
    const mix = { fable: 0, opus: 1, sonnet: 0, haiku: 0 }
    const results = computeResults({ ...P2, mix }, pricingTable)
    expect(results.weightedSwePro).toBe(69.2)
    expect(results.sweProCoverage).toBeCloseTo(1, 10)
    expect(results.costPerPointUSD).toBeCloseTo(results.weightedMonthlyUSD / 69.2, 8)
  })

  it('cobertura parcial: renormaliza sobre los modelos con score y expone coverage < 1', () => {
    // Tabla sin score en Sonnet; el resto del catálogo conserva el suyo
    const stripped = {
      ...pricingTable,
      providers: {
        ...pricingTable.providers,
        anthropic: {
          ...anthropic,
          models: {
            ...anthropic.models,
            sonnet: { ...anthropic.models.sonnet, swePro: undefined },
          },
        },
      },
    }
    const results = computeResults(P2, stripped)
    // Cobertura = 0,15 (opus) + 0,20 (haiku) = 0,35; ponderado renormalizado
    expect(results.sweProCoverage).toBeCloseTo(0.35, 10)
    expect(results.weightedSwePro).toBeCloseTo((0.15 * 69.2 + 0.2 * 54) / 0.35, 6)
  })

  it('ausencia total de scores: weightedSwePro = 0, coste/punto = 0, coverage = 0', () => {
    const noScores = {
      ...pricingTable,
      providers: {
        ...pricingTable.providers,
        anthropic: {
          ...anthropic,
          models: Object.fromEntries(
            Object.entries(anthropic.models).map(([k, m]) => [k, { ...m, swePro: undefined }]),
          ),
        },
      },
    }
    const results = computeResults(P2, noScores)
    expect(results.weightedSwePro).toBe(0)
    expect(results.costPerPointUSD).toBe(0)
    expect(results.sweProCoverage).toBe(0)
    // El coste se sigue calculando con normalidad
    expectWithin1Percent(results.weightedMonthlyUSD, 6040)
  })
})

describe('salary', () => {
  const config = {
    employerCostMultiplier: salaryData.employerCostMultiplier,
    effectiveHoursPerYear: salaryData.effectiveHoursPerYear,
  }

  it('coste empresa del perfil Mid: 52.000 €/año, ≈4.333 €/mes, ≈30,2 €/h', () => {
    const cost = employerCost(40000, config)
    expect(cost.annualEUR).toBe(52000)
    expect(cost.monthlyEUR).toBeCloseTo(4333.33, 2)
    expect(cost.perEffectiveHourEUR).toBeCloseTo(30.23, 2)
  })

  it('convierte USD a EUR con el tipo de cambio dado', () => {
    expect(usdToEur(6000, 0.92)).toBeCloseTo(5520, 10)
  })

  it('equivalencia FTE: 5.556 € de agente ≈ 1,3× un Mid', () => {
    expect(fteEquivalence(5556, 4333.33)).toBeCloseTo(1.28, 2)
  })

  it('ratio de horas: 437 h activas ≈ 3,05× las ~143 h efectivas de un FTE', () => {
    expect(hoursRatio(437, config)).toBeCloseTo(437 / (1720 / 12), 4)
  })

  it('€/h activa del agente', () => {
    expect(agentEurPerActiveHour(5520, 437)).toBeCloseTo(5520 / 437, 10)
    expect(agentEurPerActiveHour(5520, 0)).toBe(0)
  })
})

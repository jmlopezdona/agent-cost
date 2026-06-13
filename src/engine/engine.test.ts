import { describe, expect, it } from 'vitest'
import { blendedRate, computeResults, hourlyRate, scheduledHoursPerMonth } from './engine'
import { agentEurPerActiveHour, employerCost, fteEquivalence, hoursRatio, usdToEur } from './salary'
import { MODEL_IDS, type Scenario } from './types'
import { pricingTable, presets, salaryData } from '../data'

const byId = (id: string) => {
  const preset = presets.find((p) => p.id === id)
  if (!preset) throw new Error(`Preset ${id} no encontrado`)
  return preset
}

const P1 = byId('P1')
const P2 = byId('P2')
const P4 = byId('P4')

function expectWithin1Percent(actual: number, reference: number) {
  expect(Math.abs(actual - reference) / reference).toBeLessThan(0.01)
}

describe('hourlyRate', () => {
  it('calcula la tarifa de Sonnet con el perfil P2 sin redondeo interno', () => {
    const rate = hourlyRate(P2.tokens, pricingTable.models.sonnet)
    // 42/1000×3 + 210/1000×15 + 30×0,30 + 530/1000×3,75
    expect(rate).toBeCloseTo(14.2635, 10)
  })

  it('una categoría a cero aporta 0 y el resto se calcula con normalidad', () => {
    const rate = hourlyRate({ ...P2.tokens, cacheReadM: 0 }, pricingTable.models.sonnet)
    expect(rate).toBeCloseTo(14.2635 - 30 * 0.3, 10)
  })

  it('todas las categorías a cero dan tarifa 0', () => {
    const rate = hourlyRate(
      { inputK: 0, outputK: 0, cacheReadM: 0, cacheWriteK: 0 },
      pricingTable.models.opus,
    )
    expect(rate).toBe(0)
  })
})

describe('blendedRate', () => {
  it('mezcla 100% un modelo coincide con su tarifa', () => {
    const mix = { fable: 0, opus: 1, sonnet: 0, haiku: 0 }
    expect(blendedRate(P2.tokens, mix, pricingTable)).toBe(
      hourlyRate(P2.tokens, pricingTable.models.opus),
    )
  })

  it('mezcla repartida es la suma ponderada de tarifas', () => {
    const expected = MODEL_IDS.reduce(
      (sum, id) => sum + P2.mix[id] * hourlyRate(P2.tokens, pricingTable.models[id]),
      0,
    )
    expect(blendedRate(P2.tokens, P2.mix, pricingTable)).toBeCloseTo(expected, 10)
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
    expect(sorted[0].category).toBe('cacheRead')
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
    const sum = MODEL_IDS.reduce((s, id) => s + results.byModel[id], 0)
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

describe('hooks neutros de Fase 2', () => {
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

  it('recargo Bedrock multiplica el coste por 1,10', () => {
    const base = computeResults(P2, pricingTable)
    const surcharged = computeResults(P2, pricingTable, { regionalSurcharge: 1.1 })
    expect(surcharged.weightedMonthlyUSD).toBeCloseTo(base.weightedMonthlyUSD * 1.1, 10)
  })

  it('composición de batch 40% y recargo 1,10 multiplica por 0,88', () => {
    const base = computeResults(P2, pricingTable)
    const both = computeResults(P2, pricingTable, { batchFraction: 0.4, regionalSurcharge: 1.1 })
    expect(both.blendedRate).toBeCloseTo(base.blendedRate * 0.88, 10)
    expect(both.weightedMonthlyUSD).toBeCloseTo(base.weightedMonthlyUSD * 0.88, 10)
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

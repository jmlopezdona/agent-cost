import { describe, expect, it } from 'vitest'
import { employerCost, eurToUsd, fteEffectiveHoursPerMonth, usdToEur } from './salary'

describe('conversión de moneda', () => {
  it('usdToEur multiplica por el tipo de cambio', () => {
    expect(usdToEur(6038, 0.92)).toBeCloseTo(5554.96, 6)
  })

  it('eurToUsd divide por el tipo de cambio', () => {
    expect(eurToUsd(5555, 0.92)).toBeCloseTo(6038.04, 2)
  })

  it('usdToEur y eurToUsd son inversas', () => {
    const usd = 1234.5678
    expect(eurToUsd(usdToEur(usd, 0.92), 0.92)).toBeCloseTo(usd, 6)
  })

  it('eurToUsd evita dividir por cero', () => {
    expect(eurToUsd(100, 0)).toBe(0)
  })
})

describe('configuración salarial editable (Fase 2)', () => {
  it('el multiplicador de coste empresa es configurable', () => {
    const base = employerCost(40000, { employerCostMultiplier: 1.3, effectiveHoursPerYear: 1720 })
    const higher = employerCost(40000, {
      employerCostMultiplier: 1.4,
      effectiveHoursPerYear: 1720,
    })
    expect(base.annualEUR).toBe(52000)
    expect(higher.annualEUR).toBe(56000)
    expect(higher.annualEUR / base.annualEUR).toBeCloseTo(1.4 / 1.3, 10)
  })

  it('las horas efectivas configurables cambian el coste por hora efectiva', () => {
    const config1720 = { employerCostMultiplier: 1.3, effectiveHoursPerYear: 1720 }
    const config1600 = { employerCostMultiplier: 1.3, effectiveHoursPerYear: 1600 }
    const c1720 = employerCost(40000, config1720)
    const c1600 = employerCost(40000, config1600)
    expect(c1720.perEffectiveHourEUR).toBeCloseTo(52000 / 1720, 6)
    expect(c1600.perEffectiveHourEUR).toBeCloseTo(52000 / 1600, 6)
    expect(fteEffectiveHoursPerMonth(config1600)).toBeCloseTo(1600 / 12, 10)
  })
})

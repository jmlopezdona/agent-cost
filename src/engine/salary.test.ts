import { describe, expect, it } from 'vitest'
import { eurToUsd, usdToEur } from './salary'

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

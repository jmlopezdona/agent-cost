import { describe, expect, it } from 'vitest'
import {
  formatEUR,
  formatEurPerHour,
  formatFx,
  formatHours,
  formatMoney,
  formatMoneyPerHour,
  formatPercent,
  formatRatio,
  formatUSD,
  formatUsdPerHour,
} from './format'

// Intl es-ES usa "." como separador de miles y "," como decimal
describe('format es-ES', () => {
  it('importes mensuales/anuales como enteros con separador de miles', () => {
    // Convención española: sin separador en cifras de 4 dígitos
    expect(formatUSD(6038.4567)).toBe('6038 $')
    expect(formatUSD(10060)).toBe('10.060 $')
    expect(formatEUR(52000)).toBe('52.000 €')
  })

  it('tarifas por hora con 1 decimal', () => {
    expect(formatUsdPerHour(13.788)).toBe('13,8 $/h')
    expect(formatEurPerHour(30.23)).toBe('30,2 €/h')
    expect(formatUsdPerHour(14)).toBe('14,0 $/h')
  })

  it('porcentajes, ratios y horas', () => {
    expect(formatPercent(0.65)).toBe('65 %')
    expect(formatRatio(1.28)).toBe('1,3×')
    expect(formatHours(728.0000000001)).toBe('728 h')
  })

  it('tipo de cambio', () => {
    expect(formatFx(0.92)).toBe('1 USD = 0,92 €')
  })

  it('formateo consciente de moneda: importes en ambas monedas', () => {
    // 4 dígitos sin separador de miles
    expect(formatMoney(6038, 'eur')).toBe('6038 €')
    expect(formatMoney(6038, 'usd')).toBe('6038 $')
    // miles con separador
    expect(formatMoney(10060, 'eur')).toBe('10.060 €')
    expect(formatMoney(10060, 'usd')).toBe('10.060 $')
  })

  it('formateo consciente de moneda: tarifas por hora en ambas monedas', () => {
    expect(formatMoneyPerHour(13.788, 'eur')).toBe('13,8 €/h')
    expect(formatMoneyPerHour(13.788, 'usd')).toBe('13,8 $/h')
  })
})

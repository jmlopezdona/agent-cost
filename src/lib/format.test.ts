import { describe, expect, it } from 'vitest'
import { makeFormatters } from './format'

const es = makeFormatters('es')
const en = makeFormatters('en')
const fr = makeFormatters('fr')

// Intl es-ES usa "." como separador de miles y "," como decimal; símbolo como sufijo
describe('format es-ES', () => {
  it('importes mensuales/anuales como enteros con separador de miles + símbolo sufijo', () => {
    // Separador de millares forzado también en cifras de 4 dígitos (consistencia visual)
    expect(es.formatMoney(6038.4567, 'usd')).toBe('6.038 $')
    expect(es.formatMoney(10060, 'usd')).toBe('10.060 $')
    expect(es.formatMoney(52000, 'eur')).toBe('52.000 €')
  })

  it('tarifas por hora con 1 decimal y símbolo sufijo', () => {
    expect(es.formatMoneyPerHour(13.788, 'usd')).toBe('13,8 $/h')
    expect(es.formatMoneyPerHour(30.23, 'eur')).toBe('30,2 €/h')
    expect(es.formatMoneyPerHour(14, 'usd')).toBe('14,0 $/h')
  })

  it('porcentajes, ratios y horas', () => {
    expect(es.formatPercent(0.65)).toBe('65 %')
    expect(es.formatRatio(1.28)).toBe('1,3×')
    expect(es.formatHours(728.0000000001)).toBe('728 h')
  })

  it('tipo de cambio', () => {
    expect(es.formatFx(0.92)).toBe('1 USD = 0,92 €')
  })
})

// Intl en-US usa "," como separador de miles y "." como decimal; símbolo como prefijo pegado
describe('format en-US', () => {
  it('importes mensuales con separador de miles y símbolo prefijo', () => {
    expect(en.formatMoney(10060, 'usd')).toBe('$10,060')
    expect(en.formatMoney(10060, 'eur')).toBe('€10,060')
    // Separador en los 4 dígitos
    expect(en.formatMoney(6038, 'usd')).toBe('$6,038')
  })

  it('tarifas por hora con 1 decimal y símbolo prefijo pegado', () => {
    expect(en.formatMoneyPerHour(13.788, 'usd')).toBe('$13.8/h')
    expect(en.formatMoneyPerHour(13.788, 'eur')).toBe('€13.8/h')
  })

  it('tipo de cambio con decimal en punto', () => {
    expect(en.formatFx(0.92)).toBe('1 USD = 0.92 €')
  })
})

// Intl fr-FR usa espacio (estrecho) de miles y "," decimal; símbolo como sufijo
describe('format fr-FR', () => {
  it('importes mensuales con separador de miles fr-FR y símbolo sufijo', () => {
    const expected = `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(10060)} $`
    expect(fr.formatMoney(10060, 'usd')).toBe(expected)
    // Símbolo como sufijo, no prefijo
    expect(fr.formatMoney(10060, 'usd').startsWith('$')).toBe(false)
    expect(fr.formatMoney(10060, 'usd').endsWith(' $')).toBe(true)
  })

  it('tarifas por hora con decimal en coma y símbolo sufijo', () => {
    expect(fr.formatMoneyPerHour(13.788, 'usd')).toBe('13,8 $/h')
    expect(fr.formatMoneyPerHour(13.788, 'eur')).toBe('13,8 €/h')
  })
})

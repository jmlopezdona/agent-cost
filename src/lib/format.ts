import type { Currency } from '../data'

const intFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })
const oneDecimalFmt = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** Símbolo de cada moneda de presentación; única fuente de verdad (D2) */
export const CURRENCY_SYMBOL: Record<Currency, string> = { eur: '€', usd: '$' }

/** Importes mensuales/anuales: enteros con separador de miles + símbolo de la moneda activa (CA-01.1) */
export function formatMoney(value: number, currency: Currency): string {
  return `${intFmt.format(value)} ${CURRENCY_SYMBOL[currency]}`
}

/** Tarifas por hora: 1 decimal + símbolo de la moneda activa (CA-01.1) */
export function formatMoneyPerHour(value: number, currency: Currency): string {
  return `${oneDecimalFmt.format(value)} ${CURRENCY_SYMBOL[currency]}/h`
}

/** Importes mensuales/anuales: enteros con separador de miles (CA-01.1) */
export function formatUSD(value: number): string {
  return formatMoney(value, 'usd')
}

export function formatEUR(value: number): string {
  return formatMoney(value, 'eur')
}

/** Tarifas por hora: 1 decimal (CA-01.1) */
export function formatUsdPerHour(value: number): string {
  return formatMoneyPerHour(value, 'usd')
}

export function formatEurPerHour(value: number): string {
  return formatMoneyPerHour(value, 'eur')
}

export function formatInt(value: number): string {
  return intFmt.format(value)
}

export function formatOneDecimal(value: number): string {
  return oneDecimalFmt.format(value)
}

/** Fracción 0–1 → "65 %" */
export function formatPercent(fraction: number): string {
  return `${intFmt.format(fraction * 100)} %`
}

/** Ratio → "1,3×" */
export function formatRatio(value: number): string {
  return `${oneDecimalFmt.format(value)}×`
}

export function formatHours(value: number): string {
  return `${intFmt.format(value)} h`
}

export function formatFx(fxEurPerUsd: number): string {
  return `1 USD = ${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 }).format(fxEurPerUsd)} €`
}

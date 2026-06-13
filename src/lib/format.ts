import type { Currency } from '../data'
import { INTL_LOCALE, type Locale } from '../i18n'

/** Símbolo de cada moneda de presentación; única fuente de verdad, independiente del idioma */
export const CURRENCY_SYMBOL: Record<Currency, string> = { eur: '€', usd: '$' }

/** Conjunto de formatters ligados a un locale concreto (D5) */
export interface Formatters {
  /** Importes mensuales/anuales: enteros + símbolo de la moneda activa */
  formatMoney(value: number, currency: Currency): string
  /** Tarifas por hora: 1 decimal + símbolo de la moneda activa */
  formatMoneyPerHour(value: number, currency: Currency): string
  formatInt(value: number): string
  formatOneDecimal(value: number): string
  /** Fracción 0–1 → "65 %" */
  formatPercent(fraction: number): string
  /** Ratio → "1,3×" */
  formatRatio(value: number): string
  formatHours(value: number): string
  formatFx(fxEurPerUsd: number): string
}

/**
 * Crea los formatters del locale dado: separadores/decimales nativos (`es-ES`/`fr-FR`/`en-US`)
 * y colocación idiomática del símbolo de moneda (prefijo pegado en inglés, sufijo con espacio
 * en español/francés). El motor sigue sin tocar formateo (regla 2).
 */
export function makeFormatters(locale: Locale): Formatters {
  const intl = INTL_LOCALE[locale]
  const intFmt = new Intl.NumberFormat(intl, { maximumFractionDigits: 0 })
  const oneDecimalFmt = new Intl.NumberFormat(intl, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const fxFmt = new Intl.NumberFormat(intl, { maximumFractionDigits: 4 })

  // Inglés: símbolo como prefijo pegado ($6,038); español/francés: sufijo con espacio (6038 $)
  const prefixSymbol = locale === 'en'
  const withSymbol = (numStr: string, currency: Currency, suffix = ''): string => {
    const sym = CURRENCY_SYMBOL[currency]
    return prefixSymbol ? `${sym}${numStr}${suffix}` : `${numStr} ${sym}${suffix}`
  }

  return {
    formatMoney: (value, currency) => withSymbol(intFmt.format(value), currency),
    formatMoneyPerHour: (value, currency) =>
      withSymbol(oneDecimalFmt.format(value), currency, '/h'),
    formatInt: (value) => intFmt.format(value),
    formatOneDecimal: (value) => oneDecimalFmt.format(value),
    formatPercent: (fraction) => `${intFmt.format(fraction * 100)} %`,
    formatRatio: (value) => `${oneDecimalFmt.format(value)}×`,
    formatHours: (value) => `${intFmt.format(value)} h`,
    formatFx: (fxEurPerUsd) => `1 USD = ${fxFmt.format(fxEurPerUsd)} €`,
  }
}

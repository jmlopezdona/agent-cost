import { useLocale } from '../store/useLocale'
import { makeFormatters, type Formatters } from '../lib/format'
import { STRINGS, type Locale, type Strings } from './index'

/** Strings del idioma activo; cambiar de idioma re-renderiza a quien use este hook (D2) */
export function useStrings(): Strings {
  return STRINGS[useLocale((s) => s.lang)]
}

// Los formatters son inmutables por locale: se cachean para no recrear `Intl.NumberFormat` por render
const formattersCache: Partial<Record<Locale, Formatters>> = {}

/** Formatters ligados al locale activo (D5) */
export function useFormat(): Formatters {
  const lang = useLocale((s) => s.lang)
  return (formattersCache[lang] ??= makeFormatters(lang))
}

import { useStrings } from '../../i18n/hooks'
import { LOCALES, type Locale } from '../../i18n'
import { useLocale } from '../../store/useLocale'

/** Endónimos fijos (no traducidos): cada idioma en su propia lengua (D10) */
const ENDONYMS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
}

/** Códigos cortos mostrados en el botón; el endónimo va en `aria-label` para lectores (D8/D10) */
const SHORT: Record<Locale, string> = { es: 'ES', en: 'EN', fr: 'FR' }

/** Selector de idioma ES/EN/FR en la cabecera (D8) */
export function LanguageSelector() {
  const t = useStrings()
  const lang = useLocale((s) => s.lang)
  const setLang = useLocale((s) => s.setLang)

  return (
    <div
      role="group"
      aria-label={t.header.languageLabel}
      className="flex overflow-hidden rounded-md border border-line bg-raised"
    >
      {LOCALES.map((loc) => {
        const active = lang === loc
        return (
          <button
            key={loc}
            type="button"
            aria-pressed={active}
            aria-label={ENDONYMS[loc]}
            onClick={() => setLang(loc)}
            className={`px-2.5 py-1.5 text-sm transition-colors ${
              active ? 'bg-accent-soft text-accent' : 'hover:border-accent'
            }`}
          >
            {SHORT[loc]}
          </button>
        )
      })}
    </div>
  )
}

import { create } from 'zustand'
import { isLocale, LANG_STORAGE_KEY, resolveInitialLocale, type Locale } from '../i18n'

interface LocaleStore {
  /** Idioma activo; el index.html fija `<html lang>` antes del primer paint (D6) */
  lang: Locale
  setLang: (lang: Locale) => void
}

/**
 * Idioma inicial del store: prefiere el `<html lang>` que el script pre-paint ya resolvió;
 * si no es válido (p. ej. en tests sin DOM), reusa la misma lógica de resolución.
 */
function initialLang(): Locale {
  if (typeof document !== 'undefined' && isLocale(document.documentElement.lang)) {
    return document.documentElement.lang
  }
  return resolveInitialLocale()
}

export const useLocale = create<LocaleStore>((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      // localStorage no disponible: la elección vive solo en memoria esta sesión
    }
    if (typeof document !== 'undefined') document.documentElement.lang = lang
    set({ lang })
  },
}))

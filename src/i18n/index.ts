import { es, type Strings } from './es'
import { en } from './en'
import { fr } from './fr'

export type { Strings }

/** Idiomas soportados; `es` es el locale canónico (forma de referencia, D1) */
export type Locale = 'es' | 'en' | 'fr'
export const LOCALES: readonly Locale[] = ['es', 'en', 'fr']

/** Clave de persistencia local del idioma (preferencia del visor, no del escenario, D7) */
export const LANG_STORAGE_KEY = 'agentcost-lang'

/** Tabla de strings por idioma; resolución síncrona e instantánea (D2) */
export const STRINGS: Record<Locale, Strings> = { es, en, fr }

/** Locale Intl por idioma para el formateo nativo (D5) */
export const INTL_LOCALE: Record<Locale, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  en: 'en-US',
}

export function isLocale(v: unknown): v is Locale {
  return v === 'es' || v === 'en' || v === 'fr'
}

/**
 * Lógica pura de resolución del idioma inicial (D6), testeable sin DOM:
 * 1) preferencia guardada válida → ese idioma
 * 2) idioma del navegador que empiece por es/fr/en → ese idioma
 * 3) cualquier otro → inglés (fallback)
 */
export function pickLocale(stored: string | null, navLang: string | undefined): Locale {
  if (isLocale(stored)) return stored
  const nav = (navLang ?? '').toLowerCase()
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('fr')) return 'fr'
  if (nav.startsWith('en')) return 'en'
  return 'en'
}

/** Resuelve el idioma inicial leyendo localStorage + navigator (reutilizado por store y pre-paint) */
export function resolveInitialLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  let stored: string | null = null
  try {
    stored = localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    // localStorage no disponible (modo privado/SSR): se ignora y cae a autodetección
  }
  return pickLocale(stored, navigator.language)
}

/** Prosa del preset resuelta por id (los ids del JSON son P1..P6; la tabla usa p1..p6) */
export function presetProse(t: Strings, presetId: string) {
  return t.presets[presetId.toLowerCase() as keyof Strings['presets']]
}

/** Prosa del rol salarial resuelta por id (junior/mid/senior/techlead) */
export function roleProse(t: Strings, roleId: string) {
  return t.salaryRoles[roleId as keyof Strings['salaryRoles']]
}

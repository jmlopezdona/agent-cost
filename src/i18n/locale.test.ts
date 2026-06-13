import { describe, expect, it } from 'vitest'
import { isLocale, pickLocale } from './index'

describe('resolución del idioma inicial (D6)', () => {
  it('la preferencia guardada válida prevalece sobre el navegador', () => {
    expect(pickLocale('es', 'en-US')).toBe('es')
    expect(pickLocale('fr', 'en-US')).toBe('fr')
    expect(pickLocale('en', 'es-ES')).toBe('en')
  })

  it('ignora una preferencia guardada inválida y autodetecta del navegador', () => {
    expect(pickLocale('de', 'fr-FR')).toBe('fr')
    expect(pickLocale('', 'es-ES')).toBe('es')
  })

  it('autodetecta es/fr/en del navegador cuando no hay preferencia', () => {
    expect(pickLocale(null, 'es-ES')).toBe('es')
    expect(pickLocale(null, 'fr-FR')).toBe('fr')
    expect(pickLocale(null, 'en-GB')).toBe('en')
  })

  it('cae a inglés (fallback) con un idioma no soportado o ausente', () => {
    expect(pickLocale(null, 'de-DE')).toBe('en')
    expect(pickLocale(null, '')).toBe('en')
    expect(pickLocale(null, undefined)).toBe('en')
  })

  it('es insensible a mayúsculas en el código del navegador', () => {
    expect(pickLocale(null, 'FR')).toBe('fr')
    expect(pickLocale(null, 'ES-es')).toBe('es')
  })

  it('isLocale solo acepta es/en/fr', () => {
    expect(isLocale('es')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('fr')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(null)).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

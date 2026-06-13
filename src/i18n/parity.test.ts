import { describe, expect, it } from 'vitest'
import { es } from './es'
import { en } from './en'
import { fr } from './fr'
import { presets } from '../data'
import { salaryData } from '../data'
import { presetProse, roleProse, STRINGS, type Strings } from './index'

/**
 * Recorre el objeto de strings y devuelve un mapa ruta → tipo ('fn' | 'str'), de modo que
 * la comparación detecte tanto claves ausentes/sobrantes como divergencias de firma.
 */
function shape(obj: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof obj === 'function') {
    out[prefix] = 'fn'
  } else if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      Object.assign(out, shape(v, prefix ? `${prefix}.${k}` : k))
    }
  } else {
    out[prefix] = 'str'
  }
  return out
}

describe('paridad de claves entre locales (D1)', () => {
  const esShape = shape(es)

  it('en tiene exactamente las mismas claves y firmas que es', () => {
    expect(shape(en)).toEqual(esShape)
  })

  it('fr tiene exactamente las mismas claves y firmas que es', () => {
    expect(shape(fr)).toEqual(esShape)
  })
})

describe('cobertura de prosa por id en los tres idiomas (D4)', () => {
  const locales: Strings[] = [STRINGS.es, STRINGS.en, STRINGS.fr]

  it('cada preset de presets.json tiene name/description/learnings no vacíos en es/en/fr', () => {
    for (const preset of presets) {
      for (const t of locales) {
        const prose = presetProse(t, preset.id)
        expect(prose, `prosa ausente para ${preset.id}`).toBeDefined()
        expect(prose.name.length).toBeGreaterThan(0)
        expect(prose.description.length).toBeGreaterThan(0)
        expect(prose.learnings.length).toBeGreaterThan(0)
      }
    }
  })

  it('cada perfil salarial tiene name/experience no vacíos en es/en/fr', () => {
    for (const profile of salaryData.profiles) {
      for (const t of locales) {
        const role = roleProse(t, profile.id)
        expect(role, `rol ausente para ${profile.id}`).toBeDefined()
        expect(role.name.length).toBeGreaterThan(0)
        expect(role.experience.length).toBeGreaterThan(0)
      }
    }
  })
})

import { describe, expect, it } from 'vitest'
import { presets } from './index'

describe('presets.json (Fase 2 + multi-proveedor)', () => {
  it('incluye los seis presets del PRD §8 para Anthropic', () => {
    const anthropic = presets.filter((p) => p.provider === 'anthropic').map((p) => p.id)
    expect(anthropic.sort()).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'])
  })

  it('cada familia (anthropic/openai/google) tiene seis presets análogos a P1–P6', () => {
    expect(
      presets
        .filter((p) => p.provider === 'openai')
        .map((p) => p.id)
        .sort(),
    ).toEqual(['O1', 'O2', 'O3', 'O4', 'O5', 'O6'])
    expect(
      presets
        .filter((p) => p.provider === 'google')
        .map((p) => p.id)
        .sort(),
    ).toEqual(['G1', 'G2', 'G3', 'G4', 'G5', 'G6'])
  })

  // La prosa (incluido `learnings`) se migró a i18n por id (D4); su cobertura en los tres
  // idiomas se valida en src/i18n/parity.test.ts. presets.json es solo numérico/estructural.

  it('el QA nocturno (P5/O5/G5) trae el bloque de modificadores con Batch al 80%', () => {
    const withModifiers = presets.filter((p) => p.modifiers !== undefined).map((p) => p.id)
    expect(withModifiers.sort()).toEqual(['G5', 'O5', 'P5'])
    for (const id of ['P5', 'O5', 'G5']) {
      const preset = presets.find((p) => p.id === id)!
      expect(preset.modifiers).toEqual({ batchEnabled: true, batchFraction: 0.8 })
    }
  })

  it('P5 y P6 traen los valores del PRD §8', () => {
    const p5 = presets.find((p) => p.id === 'P5')!
    expect(p5.tokens).toEqual({ inputK: 25, outputK: 120, cacheReadM: 12, cacheWriteK: 300 })
    expect(p5.mix).toEqual({ fable: 0.05, opus: 0, sonnet: 0.25, haiku: 0.7 })
    expect([p5.hoursPerDay, p5.daysPerWeek, p5.dutyCycle, p5.agents]).toEqual([12, 7, 0.85, 5])

    const p6 = presets.find((p) => p.id === 'P6')!
    expect(p6.tokens).toEqual({ inputK: 45, outputK: 220, cacheReadM: 50, cacheWriteK: 600 })
    expect(p6.mix).toEqual({ fable: 0, opus: 0.1, sonnet: 0.7, haiku: 0.2 })
    expect([p6.hoursPerDay, p6.daysPerWeek, p6.dutyCycle, p6.agents]).toEqual([24, 7, 0.8, 1])
  })
})

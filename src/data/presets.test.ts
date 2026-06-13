import { describe, expect, it } from 'vitest'
import { presets } from './index'

describe('presets.json (Fase 2)', () => {
  it('incluye los seis presets del PRD §8', () => {
    expect(presets.map((p) => p.id).sort()).toEqual(['P1', 'P2', 'P3', 'P4', 'P5', 'P6'])
  })

  it('los seis presets tienen learnings no vacíos', () => {
    for (const preset of presets) {
      expect(typeof preset.learnings).toBe('string')
      expect(preset.learnings.length).toBeGreaterThan(0)
    }
  })

  it('solo P5 trae el bloque de modificadores con Batch al 80%', () => {
    const withModifiers = presets.filter((p) => p.modifiers !== undefined)
    expect(withModifiers.map((p) => p.id)).toEqual(['P5'])
    const p5 = presets.find((p) => p.id === 'P5')!
    expect(p5.modifiers).toEqual({ batchEnabled: true, batchFraction: 0.8 })
  })

  it('P5 y P6 traen los valores del PRD §8', () => {
    const p5 = presets.find((p) => p.id === 'P5')!
    expect(p5.tokens).toEqual({ inputK: 25, outputK: 120, cacheReadM: 12, cacheWriteK: 300 })
    expect(p5.mix).toEqual({ fable: 0, opus: 0, sonnet: 0.3, haiku: 0.7 })
    expect([p5.hoursPerDay, p5.daysPerWeek, p5.dutyCycle, p5.agents]).toEqual([12, 7, 0.85, 5])

    const p6 = presets.find((p) => p.id === 'P6')!
    expect(p6.tokens).toEqual({ inputK: 45, outputK: 220, cacheReadM: 50, cacheWriteK: 600 })
    expect(p6.mix).toEqual({ fable: 0, opus: 0.1, sonnet: 0.7, haiku: 0.2 })
    expect([p6.hoursPerDay, p6.daysPerWeek, p6.dutyCycle, p6.agents]).toEqual([24, 7, 0.8, 1])
  })
})

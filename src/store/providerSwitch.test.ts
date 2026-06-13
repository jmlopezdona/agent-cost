import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { presets } from '../data'

// Cambio de familia y derivación de `isCustomized` con el régimen GLOBAL.
// El store lee window.location + sessionStorage al importarse, así que cada caso re-importa el módulo.

function makeStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  }
}

async function loadStore() {
  vi.resetModules()
  vi.stubGlobal('sessionStorage', makeStorage())
  vi.stubGlobal('history', { replaceState: vi.fn() })
  vi.stubGlobal('window', {
    location: { search: '', pathname: '/agent-cost/', origin: 'https://x.test', hash: '' },
  })
  const mod = await import('./useScenarioStore')
  return mod.useScenarioStore
}

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

describe('isCustomized al cambiar de familia (régimen global)', () => {
  it('volver a una familia tras elegir otro caso de uso ancla al análogo del caso activo, NO Personalizado', async () => {
    const store = await loadStore()
    const s = () => store.getState()

    // Anthropic (P2) → Google (primera vez, análogo G2)
    s().setProvider('google')
    expect(s().presetId).toBe('G2')
    expect(s().isCustomized).toBe(false)

    // Elige otro caso de uso en Google: G5 (el caso de uso es global → caso 5 activo)
    s().loadPreset('G5')
    expect(s().isCustomized).toBe(false)

    // Vuelve a Anthropic sin tocar nada: ancla al análogo del caso activo (P5), NO "Personalizado".
    // (Antes restauraba P2 y, con el régimen/tokens globales del caso 5, lo marcaba "Personalizado".)
    s().setProvider('anthropic')
    expect(s().presetId).toBe('P5')
    expect(s().isCustomized).toBe(false)
  })

  it('restaura la personalización por familia cuando se vuelve al MISMO caso de uso', async () => {
    const store = await loadStore()
    const s = () => store.getState()

    // Personaliza la mezcla de Anthropic en P2 (el valor puede clamparse, capturamos el real)
    const m = Object.keys(s().scenario.mix)[0]
    s().setMix(m as never, 0.5)
    expect(s().isCustomized).toBe(true)
    const customMix = s().scenario.mix[m]
    expect(customMix).not.toBe(presets.find((p) => p.id === 'P2')!.mix[m])

    // Va a Google (caso 2 → G2) y vuelve sin cambiar de caso: restaura la mezcla personalizada de P2
    s().setProvider('google')
    expect(s().presetId).toBe('G2')
    s().setProvider('anthropic')
    expect(s().presetId).toBe('P2')
    expect(s().isCustomized).toBe(true)
    expect(s().scenario.mix[m]).toBe(customMix)
  })

  it('cambiar de familia tras elegir un caso de uso (primera visita) NO marca Personalizado', async () => {
    const store = await loadStore()
    const s = () => store.getState()

    s().loadPreset('P5') // régimen 12/7/0,85
    s().setProvider('openai') // análogo O5, primera visita
    expect(s().presetId).toBe('O5')
    expect(s().isCustomized).toBe(false)
  })

  it('editar el régimen con sliders SÍ marca Personalizado y persiste al cambiar de familia', async () => {
    const store = await loadStore()
    const s = () => store.getState()

    s().setSchedule('dutyCycle', 0.99)
    expect(s().isCustomized).toBe(true)

    // El régimen es global: la otra familia también queda personalizada
    s().setProvider('google')
    expect(s().isCustomized).toBe(true)

    // Cargar un caso de uso limpia el régimen editado
    s().loadPreset('G3')
    expect(s().isCustomized).toBe(false)
  })

  it('editar la mezcla personaliza solo su familia (la mezcla es propia de cada familia)', async () => {
    const store = await loadStore()
    const s = () => store.getState()

    const firstModel = Object.keys(s().scenario.mix)[0]
    s().setMix(firstModel as never, 0.5)
    expect(s().isCustomized).toBe(true)

    // La familia destino trae su propia mezcla limpia → no personalizada
    s().setProvider('google')
    expect(s().isCustomized).toBe(false)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PRESET_ID, presets, pricingTable } from '../data'

// Persistencia/precedencia del store (D3/D5). El store ejecuta efectos al importarse
// (lee window.location + sessionStorage y, si el enlace trae estado, lo adopta y limpia
// la URL), así que cada caso re-importa el módulo con los globals correctos.

const SESSION_KEY = 'agentcost-scenario'

function makeStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  }
}

const P2 = presets.find((p) => p.id === 'P2')!

async function loadStore(search: string, sessionValue?: string | null) {
  vi.resetModules()
  const sessionStore = makeStorage()
  if (sessionValue != null) sessionStore.setItem(SESSION_KEY, sessionValue)
  const replaceState = vi.fn()
  vi.stubGlobal('sessionStorage', sessionStore)
  vi.stubGlobal('history', { replaceState })
  vi.stubGlobal('window', {
    location: { search, pathname: '/agent-cost/', origin: 'https://x.test', hash: '' },
  })
  const mod = await import('./useScenarioStore')
  return { store: mod.useScenarioStore, sessionStore, replaceState }
}

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllGlobals())

describe('precedencia de carga (D3)', () => {
  it('una URL con estado gana sobre sessionStorage', async () => {
    const { store } = await loadStore('?p=P2&cr=60', 'p=P2&dc=80')
    expect(store.getState().scenario.tokens.cacheReadM).toBe(60)
    // El valor de la sesión (dc=80) no se aplica porque el enlace tiene precedencia
    expect(store.getState().scenario.dutyCycle).toBe(P2.dutyCycle)
  })

  it('sessionStorage gana sobre el preset por defecto cuando la URL no trae estado', async () => {
    const { store } = await loadStore('', 'p=P2&dc=80')
    expect(store.getState().scenario.dutyCycle).toBeCloseTo(0.8, 10)
  })

  it('sin URL ni sessionStorage carga el preset por defecto', async () => {
    const { store } = await loadStore('', null)
    expect(store.getState().presetId).toBe(DEFAULT_PRESET_ID)
    expect(store.getState().scenario.dutyCycle).toBe(P2.dutyCycle)
    expect(store.getState().isCustomized).toBe(false)
  })
})

describe('adopción y limpieza del enlace entrante (D3)', () => {
  it('abrir con query la guarda en sessionStorage y limpia la URL', async () => {
    const { store, sessionStore, replaceState } = await loadStore('?p=P2&cr=60', null)
    // Adoptado en sessionStorage en formato canónico (incluye el diff cr=60)
    const saved = sessionStore.getItem(SESSION_KEY)!
    expect(saved).toContain('cr=60')
    // serializeCurrent reproduce exactamente lo persistido
    expect(saved).toBe(store.getState().serializeCurrent())
    // URL limpiada a la ruta pelada (sin query)
    expect(replaceState).toHaveBeenCalled()
    const lastUrl = replaceState.mock.calls.at(-1)![2] as string
    expect(lastUrl).toBe('/agent-cost/')
  })
})

describe('reset (D5)', () => {
  it('vacía sessionStorage y vuelve al preset por defecto conservando currency y fx', async () => {
    const { store, sessionStore } = await loadStore('', null)
    // Personaliza y cambia preferencias de presentación
    store.getState().setSchedule('dutyCycle', 0.9)
    store.getState().setCurrency('usd')
    store.getState().setFx(0.8)
    expect(sessionStore.getItem(SESSION_KEY)).not.toBeNull()

    store.getState().reset()

    expect(sessionStore.getItem(SESSION_KEY)).toBeNull()
    expect(store.getState().scenario.dutyCycle).toBe(P2.dutyCycle)
    expect(store.getState().presetId).toBe(DEFAULT_PRESET_ID)
    expect(store.getState().isCustomized).toBe(false)
    // currency y fx se conservan (preferencias de presentación)
    expect(store.getState().currency).toBe('usd')
    expect(store.getState().fx).toBe(0.8)
  })
})

describe('staleVersion (D3)', () => {
  it('una query entrante con pv distinto conserva el aviso aunque la URL se limpie', async () => {
    const { store, sessionStore, replaceState } = await loadStore('?p=P2&pv=2025-01', null)
    expect(store.getState().staleVersion).toBe('2025-01')
    // La sesión adoptada lleva la versión actual, no la obsoleta
    expect(sessionStore.getItem(SESSION_KEY)).toContain(`pv=${pricingTable.version}`)
    expect(replaceState.mock.calls.at(-1)![2]).toBe('/agent-cost/')
  })
})

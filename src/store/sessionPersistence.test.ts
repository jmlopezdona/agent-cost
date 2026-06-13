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
    // Adoptado en sessionStorage en formato canónico: el alias legacy cr=60 se reescribe
    // como la clave nueva t.cacheReadM=60 (retrocompat de lectura, D8)
    const saved = sessionStore.getItem(SESSION_KEY)!
    expect(saved).toContain('t.cacheReadM=60')
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

describe('cambio de proveedor: tokens y modificadores (batch/regional) globales, régimen/mezcla por familia', () => {
  it('sincroniza las tasas de token compartidas pero el régimen viene del preset análogo', async () => {
    const { store } = await loadStore('', null)
    const O3 = presets.find((p) => p.id === 'O3')!
    // Parte de P3 (greenfield) y personaliza régimen + tokens compartidos + batch
    store.getState().loadPreset('P3')
    store.getState().setSchedule('dutyCycle', 0.42)
    store.getState().setSchedule('agents', 7)
    store.getState().setToken('cacheReadM', 99)
    store.getState().setBatchEnabled(true)

    store.getState().setProvider('openai')
    const s = store.getState()

    // Caso de uso conservado: P3 → O3 (no el default O2)
    expect(s.scenario.providerId).toBe('openai')
    expect(s.presetId).toBe('O3')
    // Tasa compartida (cache read) GLOBAL → se aplica a OpenAI
    expect(s.scenario.tokens.cacheReadM).toBe(99)
    // Régimen POR FAMILIA → viene de O3, no del valor editado en Anthropic
    expect(s.scenario.dutyCycle).toBe(O3.dutyCycle)
    expect(s.scenario.agents).toBe(O3.agents)
    // La mezcla pasa a los modelos de OpenAI (no quedan claves de Anthropic)
    expect(Object.keys(s.scenario.mix).sort()).toEqual(
      Object.keys(pricingTable.providers.openai.models).sort(),
    )
    // Batch es GLOBAL → activado en Anthropic, sigue activo al pasar a OpenAI
    expect(s.batchEnabled).toBe(true)
    // Personalizado porque la tasa global difiere del preset O3
    expect(s.isCustomized).toBe(true)
  })

  it('las tasas de token compartidas son globales en ambos sentidos entre familias', async () => {
    const { store } = await loadStore('', null)
    store.getState().setToken('cacheReadM', 60) // en Anthropic
    store.getState().setProvider('google')
    expect(store.getState().scenario.tokens.cacheReadM).toBe(60) // sincronizado a Gemini

    // Editar en Gemini se propaga de vuelta a Anthropic
    store.getState().setToken('cacheReadM', 45)
    store.getState().setProvider('anthropic')
    expect(store.getState().scenario.tokens.cacheReadM).toBe(45)
  })

  it('desde un preset limpio carga el análogo limpio sin marcar personalizado', async () => {
    const { store } = await loadStore('', null)
    store.getState().setProvider('google')
    const s = store.getState()
    // P2 (default Anthropic) → G2 análogo, limpio
    expect(s.presetId).toBe('G2')
    expect(s.isCustomized).toBe(false)
    expect(s.scenario.providerId).toBe('google')
  })

  it('al volver a una familia ya visitada restaura su mix editado (Gemini → ChatGPT → Gemini)', async () => {
    const { store } = await loadStore('', null)
    store.getState().setProvider('google')
    const before = { ...store.getState().scenario.mix }

    // Edita el mix de Gemini
    store.getState().setMix('gemini-3.5-flash', 0.5)
    const edited = { ...store.getState().scenario.mix }
    expect(edited).not.toEqual(before)

    // Va a ChatGPT y vuelve a Gemini
    store.getState().setProvider('openai')
    expect(store.getState().scenario.providerId).toBe('openai')
    store.getState().setProvider('google')

    // El mix editado de Gemini se conserva (no se resetea por el ida y vuelta)
    expect(store.getState().scenario.providerId).toBe('google')
    expect(store.getState().scenario.mix).toEqual(edited)
    expect(store.getState().isCustomized).toBe(true)
  })

  it('batch y recargo regional son globales: configurados en una familia aplican a las tres', async () => {
    const { store } = await loadStore('', null)
    // Configurados en Anthropic
    store.getState().setBatchEnabled(true)
    store.getState().setBatchFraction(0.3)
    store.getState().setRegional(true)

    // Primera visita a Google: se conservan (no se toman del análogo ni se resetean)
    store.getState().setProvider('google')
    expect(store.getState().batchEnabled).toBe(true)
    expect(store.getState().batchFraction).toBeCloseTo(0.3, 10)
    expect(store.getState().regional).toBe(true)

    // Editados en Google: se propagan a OpenAI
    store.getState().setRegional(false)
    store.getState().setProvider('openai')
    expect(store.getState().batchEnabled).toBe(true)
    expect(store.getState().batchFraction).toBeCloseTo(0.3, 10)
    expect(store.getState().regional).toBe(false)

    // Y al volver a Anthropic (familia ya visitada) siguen siendo los globales, no los de origen
    store.getState().setProvider('anthropic')
    expect(store.getState().batchEnabled).toBe(true)
    expect(store.getState().regional).toBe(false)
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

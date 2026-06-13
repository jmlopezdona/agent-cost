import { describe, expect, it } from 'vitest'
import { pricingTable } from './index'
import { PROVIDER_IDS } from '../engine/types'

describe('swePro en pricing.json (cobertura 1, D6)', () => {
  it('todos los modelos de los tres proveedores declaran swePro', () => {
    for (const id of PROVIDER_IDS) {
      const models = pricingTable.providers[id].models
      for (const [key, model] of Object.entries(models)) {
        expect(model.swePro, `${id}:${key} sin swePro`).toBeDefined()
      }
    }
  })

  it('cada score está en [0,100] con basis y confidence en su dominio', () => {
    for (const id of PROVIDER_IDS) {
      for (const model of Object.values(pricingTable.providers[id].models)) {
        const s = model.swePro!
        expect(s.score).toBeGreaterThanOrEqual(0)
        expect(s.score).toBeLessThanOrEqual(100)
        expect(['standard', 'vendor', 'estimate']).toContain(s.basis)
        expect(['high', 'medium', 'low']).toContain(s.confidence)
      }
    }
  })

  it('los flagship llevan score de proveedor (vendor/high) y el resto va estimado', () => {
    expect(pricingTable.providers.anthropic.models.fable.swePro).toMatchObject({
      basis: 'vendor',
      confidence: 'high',
    })
    expect(pricingTable.providers.anthropic.models.opus.swePro).toMatchObject({
      basis: 'vendor',
      confidence: 'high',
    })
    expect(pricingTable.providers.anthropic.models.sonnet.swePro).toMatchObject({
      basis: 'estimate',
      confidence: 'low',
    })
    expect(pricingTable.providers.openai.models['gpt-5.5'].swePro?.basis).toBe('vendor')
    expect(pricingTable.providers.google.models['gemini-3.1-pro-preview'].swePro?.basis).toBe(
      'vendor',
    )
  })
})

import { MODEL_IDS, type ModelId, type ModelPricing, type PriceOverrides, type PricingTable } from '../engine/types'

/**
 * Tabla de precios efectiva = `pricing.json` + overrides de sesión (D3).
 * `pricing.json` permanece intacto; los overrides son una capa compartible.
 */
export function mergePricing(table: PricingTable, overrides: PriceOverrides): PricingTable {
  const hasOverrides = MODEL_IDS.some((id) => overrides[id] !== undefined)
  if (!hasOverrides) return table

  const models = {} as Record<ModelId, ModelPricing>
  for (const id of MODEL_IDS) {
    models[id] = { ...table.models[id], ...overrides[id] }
  }
  return { ...table, models }
}

import {
  modelId,
  type PriceOverrides,
  type PricingTable,
  type ProviderData,
  type ProviderId,
} from '../engine/types'

/**
 * Tabla de precios efectiva = `pricing.json` + overrides de sesión (D3).
 * `pricing.json` permanece intacto; los overrides (clave: modelo namespaced + categoría) son
 * una capa compartible que se aplica sobre los precios del modelo correspondiente.
 */
export function mergePricing(table: PricingTable, overrides: PriceOverrides): PricingTable {
  if (Object.keys(overrides).length === 0) return table

  let changed = false
  const providers = { ...table.providers }
  for (const [provId, provData] of Object.entries(table.providers) as [
    ProviderId,
    ProviderData,
  ][]) {
    let provChanged = false
    const models = { ...provData.models }
    for (const key of Object.keys(provData.models)) {
      const ov = overrides[modelId(provId, key)]
      if (!ov) continue
      models[key] = {
        ...provData.models[key],
        prices: { ...provData.models[key].prices, ...ov },
      }
      provChanged = true
    }
    if (provChanged) {
      providers[provId] = { ...provData, models }
      changed = true
    }
  }
  return changed ? { ...table, providers } : table
}

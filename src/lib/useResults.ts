import { useMemo } from 'react'
import { computeResults } from '../engine/engine'
import type { EngineOptions, PricingTable, Results } from '../engine/types'
import { BATCH_DISCOUNT, pricingTable, REGIONAL_SURCHARGE } from '../data'
import { useScenarioStore } from '../store/useScenarioStore'
import { mergePricing } from './pricing'

/** Tabla de precios efectiva (oficial + overrides de sesión); memoizada (D3) */
export function useEffectivePricing(): PricingTable {
  const priceOverrides = useScenarioStore((s) => s.priceOverrides)
  return useMemo(() => mergePricing(pricingTable, priceOverrides), [priceOverrides])
}

/** Opts del motor compuestas desde los modificadores de configuración avanzada (D2, D5) */
export function useEngineOptions(): EngineOptions {
  const batchEnabled = useScenarioStore((s) => s.batchEnabled)
  const batchFraction = useScenarioStore((s) => s.batchFraction)
  const regional = useScenarioStore((s) => s.regional)
  const storageEnabled = useScenarioStore((s) => s.storageEnabled)
  return useMemo(
    () => ({
      batchFraction: batchEnabled ? batchFraction : 0,
      batchDiscount: BATCH_DISCOUNT,
      regionalSurcharge: regional ? REGIONAL_SURCHARGE : 1,
      storageEnabled,
    }),
    [batchEnabled, batchFraction, regional, storageEnabled],
  )
}

/** Resultados derivados del escenario; no viven en el store (D2) */
export function useResults(): Results {
  const scenario = useScenarioStore((s) => s.scenario)
  const table = useEffectivePricing()
  const opts = useEngineOptions()
  return useMemo(() => computeResults(scenario, table, opts), [scenario, table, opts])
}

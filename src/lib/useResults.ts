import { useMemo } from 'react'
import { computeResults } from '../engine/engine'
import type { Results } from '../engine/types'
import { pricingTable } from '../data'
import { useScenarioStore } from '../store/useScenarioStore'

/** Resultados derivados del escenario; no viven en el store (D2) */
export function useResults(): Results {
  const scenario = useScenarioStore((s) => s.scenario)
  return useMemo(() => computeResults(scenario, pricingTable), [scenario])
}

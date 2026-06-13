import { presets } from '../../data'
import { useStrings } from '../../i18n/hooks'
import { presetProse } from '../../i18n'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import type { ExportInput } from '../../lib/export'

/** Reúne el estado actual para la exportación (coherente con lo mostrado) */
export function useExportInput(): ExportInput {
  const t = useStrings()
  const presetId = useScenarioStore((s) => s.presetId)
  const scenario = useScenarioStore((s) => s.scenario)
  const fx = useScenarioStore((s) => s.fx)
  const currency = useScenarioStore((s) => s.currency)
  const batchEnabled = useScenarioStore((s) => s.batchEnabled)
  const batchFraction = useScenarioStore((s) => s.batchFraction)
  const regional = useScenarioStore((s) => s.regional)
  const employerMultiplier = useScenarioStore((s) => s.employerMultiplier)
  const effectiveHours = useScenarioStore((s) => s.effectiveHours)
  const priceOverrides = useScenarioStore((s) => s.priceOverrides)
  const results = useResults()

  const preset = presets.find((p) => p.id === presetId)
  const presetName = preset ? presetProse(t, preset.id).name : presetId

  return {
    presetId,
    presetName,
    scenario,
    fx,
    currency,
    batchEnabled,
    batchFraction,
    regional,
    employerMultiplier,
    effectiveHours,
    priceOverrides,
    results,
  }
}

import { strings } from '../../i18n/es'
import { presets } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

/** "Qué observar" del escenario activo (PRD §8, Fase 2) */
export function PresetLearnings() {
  const presetId = useScenarioStore((s) => s.presetId)
  const preset = presets.find((p) => p.id === presetId)
  if (!preset) return null

  return (
    <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
      <span className="font-semibold text-ink">{strings.learnings.label}: </span>
      {preset.learnings}
    </p>
  )
}

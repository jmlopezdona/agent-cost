import { useStrings } from '../../i18n/hooks'
import { presetProse } from '../../i18n'
import { presets } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

/** "Qué observar" del escenario activo (PRD §8, Fase 2) */
export function PresetLearnings() {
  const t = useStrings()
  const presetId = useScenarioStore((s) => s.presetId)
  const preset = presets.find((p) => p.id === presetId)
  if (!preset) return null

  return (
    <p className="rounded-md border border-line bg-surface px-3 py-2 text-xs leading-relaxed text-muted">
      <span className="font-semibold text-ink">{t.learnings.label}: </span>
      {presetProse(t, preset.id).learnings}
    </p>
  )
}

import { useStrings } from '../../i18n/hooks'
import { presetProse } from '../../i18n'
import { presets } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Nombre + descripción + learnings del escenario, ampliados para proyectar (D6) */
export function PresentationScenario() {
  const t = useStrings()
  const presetId = useScenarioStore((s) => s.presetId)
  const isCustomized = useScenarioStore((s) => s.isCustomized)
  const preset = presets.find((p) => p.id === presetId)
  if (!preset) return null
  const prose = presetProse(t, preset.id)

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-3xl font-bold">
        {isCustomized ? t.header.customized(prose.name) : prose.name}
      </h2>
      <p className="text-lg text-muted">{prose.description}</p>
      <p className="text-base leading-relaxed">
        <span className="font-semibold">{t.learnings.label}: </span>
        {prose.learnings}
      </p>
    </div>
  )
}

import { strings } from '../../i18n/es'
import { presets } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Nombre + descripción + learnings del escenario, ampliados para proyectar (D6) */
export function PresentationScenario() {
  const presetId = useScenarioStore((s) => s.presetId)
  const isCustomized = useScenarioStore((s) => s.isCustomized)
  const preset = presets.find((p) => p.id === presetId)
  if (!preset) return null

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-3xl font-bold">
        {isCustomized ? strings.header.customized(preset.name) : preset.name}
      </h2>
      <p className="text-lg text-muted">{preset.description}</p>
      <p className="text-base leading-relaxed">
        <span className="font-semibold">{strings.learnings.label}: </span>
        {preset.learnings}
      </p>
    </div>
  )
}

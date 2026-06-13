import { strings } from '../../i18n/es'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Conmutador del modo presentación en la cabecera (RF-10, D6) */
export function PresentationToggle() {
  const presentation = useScenarioStore((s) => s.presentation)
  const togglePresentation = useScenarioStore((s) => s.togglePresentation)

  return (
    <button
      type="button"
      aria-pressed={presentation}
      onClick={togglePresentation}
      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
        presentation ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-raised hover:border-accent'
      }`}
    >
      {presentation ? strings.presentation.exit : strings.presentation.toggle}
    </button>
  )
}

import { useStrings } from '../../i18n/hooks'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Conmutador del modo presentación en la cabecera (RF-10, D6) */
export function PresentationToggle() {
  const t = useStrings()
  const presentation = useScenarioStore((s) => s.presentation)
  const togglePresentation = useScenarioStore((s) => s.togglePresentation)

  return (
    <button
      type="button"
      aria-pressed={presentation}
      onClick={togglePresentation}
      className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm transition-colors hover:border-accent"
    >
      {presentation ? t.presentation.exit : t.presentation.toggle}
    </button>
  )
}

import { useStrings } from '../../i18n/hooks'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Conmutador del modo presentación en la cabecera (RF-10, D6). Solo icono + aria-label. */
export function PresentationToggle() {
  const t = useStrings()
  const presentation = useScenarioStore((s) => s.presentation)
  const togglePresentation = useScenarioStore((s) => s.togglePresentation)

  // En presentación el icono y la etiqueta invitan a volver a la calculadora; si no, a presentar
  const label = presentation ? t.presentation.exit : t.presentation.toggle

  return (
    <button
      type="button"
      aria-pressed={presentation}
      aria-label={label}
      title={label}
      onClick={togglePresentation}
      className="grid size-9 place-items-center rounded-md border border-line bg-raised transition-colors hover:border-accent"
    >
      {presentation ? (
        // Icono calculadora (volver a la calculadora)
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" />
          <line x1="16" y1="14" x2="16" y2="18" />
        </svg>
      ) : (
        // Icono presentación (entrar en modo presentación)
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M2 3h20" />
          <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
          <path d="m7 21 5-5 5 5" />
        </svg>
      )}
    </button>
  )
}

import { useState, type ComponentType } from 'react'
import { useStrings } from '../../i18n/hooks'
import { ScheduleSection } from '../controls/ScheduleSection'
import { ModelMixSection } from '../controls/ModelMixSection'
import { TokenRatesSection } from '../controls/TokenRatesSection'
import { AdvancedConfigSection } from '../controls/AdvancedConfigSection'

type SectionId = 'schedule' | 'mix' | 'tokens' | 'advanced'

/**
 * Acordeón exclusivo de configuración (D1, D2). Estado de UI local: una sola
 * sección abierta a la vez, "Régimen y utilización" por defecto, y siempre hay
 * exactamente una abierta (click en la abierta no la cierra). El orden es
 * Régimen → Mezcla → Tokens → Avanzada.
 */
export function ConfigAccordion() {
  const t = useStrings()
  const [open, setOpen] = useState<SectionId>('schedule')

  const items: Array<{ id: SectionId; title: string; hint?: string; Body: ComponentType }> = [
    { id: 'schedule', title: t.schedule.sectionTitle, Body: ScheduleSection },
    { id: 'mix', title: t.mix.sectionTitle, hint: t.mix.sectionHint, Body: ModelMixSection },
    {
      id: 'tokens',
      title: t.tokens.sectionTitle,
      hint: t.tokens.sectionHint,
      Body: TokenRatesSection,
    },
    {
      id: 'advanced',
      title: t.advanced.sectionTitle,
      hint: t.advanced.sectionHint,
      Body: AdvancedConfigSection,
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ id, title, hint, Body }) => {
        const isOpen = open === id
        const headerId = `config-acc-h-${id}`
        const panelId = `config-acc-p-${id}`
        return (
          <section key={id} className="rounded-lg border border-line bg-raised">
            <h2>
              <button
                id={headerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(id)}
                className="flex w-full items-start justify-between gap-2 p-4 text-left"
              >
                <span>
                  <span className="text-sm font-semibold">{title}</span>
                  {isOpen && hint && (
                    <span className="mt-0.5 block text-xs font-normal text-muted">{hint}</span>
                  )}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className={`mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h2>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="px-4 pb-4"
            >
              <Body />
            </div>
          </section>
        )
      })}
    </div>
  )
}

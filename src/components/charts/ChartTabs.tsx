import { useRef, useState, type ComponentType } from 'react'
import { CategoryDonut, CategoryDonutAlt } from './CategoryDonut'
import { CeilingVsWeightedChart, CeilingVsWeightedAlt } from './CeilingVsWeightedChart'
import { strings } from '../../i18n/es'

type TabId = 'donut' | 'ceiling'

/**
 * Pestañas de gráficos (D3, D4). Estado de UI local: una pestaña activa a la vez,
 * Donut por defecto. Solo se monta el canvas del gráfico activo (evita el canvas
 * a tamaño 0); las alternativas textuales de ambos gráficos se renderizan siempre,
 * fuera de los paneles, para no perder accesibilidad del gráfico no visible.
 */
const TABS: Array<{ id: TabId; label: string; Chart: ComponentType }> = [
  { id: 'donut', label: strings.charts.tabBreakdown, Chart: CategoryDonut },
  { id: 'ceiling', label: strings.charts.tabCeiling, Chart: CeilingVsWeightedChart },
]

export function ChartTabs() {
  const [active, setActive] = useState<TabId>('donut')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Navegación con flechas dentro del tablist (patrón WAI-ARIA)
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = e.key === 'ArrowRight' ? (index + 1) % TABS.length : (index - 1 + TABS.length) % TABS.length
    setActive(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label={strings.charts.tabsLabel} className="flex gap-1">
        {TABS.map(({ id, label }, index) => {
          const isActive = active === id
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={`chart-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`chart-panel-${id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(id)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={`rounded-t-md border-b-2 px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'border-accent font-semibold text-accent'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {TABS.map(({ id, Chart }) => {
        const isActive = active === id
        return (
          <div
            key={id}
            role="tabpanel"
            id={`chart-panel-${id}`}
            aria-labelledby={`chart-tab-${id}`}
            hidden={!isActive}
            className="mt-3"
          >
            {isActive && <Chart />}
          </div>
        )
      })}

      {/* Alternativas textuales siempre presentes (regla 9, D4) */}
      <CategoryDonutAlt />
      <CeilingVsWeightedAlt />
    </div>
  )
}

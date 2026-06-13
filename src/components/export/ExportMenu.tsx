import { useEffect, useRef, useState } from 'react'
import { useStrings } from '../../i18n/hooks'
import { exportAllChartsPNG, exportCSV, exportJSON } from '../../lib/export'
import { useExportInput } from './useExportInput'

/** Botón "Exportar" con desplegable de formatos en la cabecera (RF-09) */
export function ExportMenu() {
  const input = useExportInput()
  const t = useStrings().exporting
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Etiquetas del export en el idioma activo (D9); las cifras no dependen del idioma
  const labels = {
    preset: t.fields.preset,
    parameters: t.fields.parameters,
    modifiers: t.fields.modifiers,
    results: t.fields.results,
    csvColKey: t.csvColKey,
    csvColValue: t.csvColValue,
  }

  const items = [
    { label: t.json, action: () => exportJSON(input, t.fileBase, labels) },
    { label: t.csv, action: () => exportCSV(input, t.fileBase, labels) },
    { label: t.pngAll, action: () => exportAllChartsPNG(t.fileBase) },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm hover:border-accent"
      >
        {t.sectionTitle}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t.menuAria}
          className="absolute right-0 z-20 mt-1 flex min-w-44 flex-col rounded-md border border-line bg-raised py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                item.action()
                setOpen(false)
              }}
              className="px-3 py-1.5 text-left text-sm hover:bg-accent-soft hover:text-accent"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

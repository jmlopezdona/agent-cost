import { strings } from '../../i18n/es'
import { exportAllChartsPNG, exportCSV, exportJSON } from '../../lib/export'
import { useExportInput } from './useExportInput'

const BTN = 'rounded-md border border-line bg-raised px-3 py-1.5 text-sm hover:border-accent'

/** Botones de exportación del escenario (RF-09) */
export function ExportBar() {
  const input = useExportInput()
  const t = strings.exporting

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.sectionTitle}>
      <span className="text-xs font-semibold text-muted">{t.sectionTitle}:</span>
      <button type="button" className={BTN} onClick={() => exportJSON(input, t.fileBase)}>
        {t.json}
      </button>
      <button type="button" className={BTN} onClick={() => exportCSV(input, t.fileBase)}>
        {t.csv}
      </button>
      <button type="button" className={BTN} onClick={() => exportAllChartsPNG(t.fileBase)}>
        {t.pngAll}
      </button>
    </div>
  )
}

import { useStrings } from '../../i18n/hooks'
import { exportChartPNG } from '../../lib/export'
import type { ChartId } from '../../lib/chartRegistry'

/** Botón de exportar un gráfico individual como PNG (RF-09, D7) */
export function ChartExportButton({ id, title }: { id: ChartId; title: string }) {
  const t = useStrings().exporting
  return (
    <button
      type="button"
      aria-label={t.pngChartAria(title)}
      onClick={() => exportChartPNG(id, t.fileBase)}
      className="rounded-md border border-line px-2 py-1 text-xs hover:border-accent"
    >
      {t.pngChart}
    </button>
  )
}

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { CATEGORY_LABELS, chartTheme } from './chartSetup'
import { strings } from '../../i18n/es'
import { formatPercent, formatUsdPerHour } from '../../lib/format'
import { useResults } from '../../lib/useResults'
import { useTheme } from '../../lib/theme'

/** Desglose del coste por categoría de token (RF-07.1) */
export function CategoryDonut() {
  const results = useResults()
  const dark = useTheme((s) => s.dark)

  const { data, options } = useMemo(() => {
    const theme = chartTheme()
    return {
      data: {
        labels: results.byCategory.map((c) => CATEGORY_LABELS[c.category]),
        datasets: [
          {
            data: results.byCategory.map((c) => c.usdPerHour),
            backgroundColor: results.byCategory.map((c) => theme.categoryColors[c.category]),
            borderColor: theme.surface,
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              color: theme.ink,
              // Leyenda con valor + % (CA del spec results-display)
              generateLabels: () =>
                results.byCategory.map((c, i) => ({
                  text: `${CATEGORY_LABELS[c.category]}: ${formatUsdPerHour(c.usdPerHour)} (${formatPercent(c.share)})`,
                  fillStyle: chartTheme().categoryColors[c.category],
                  strokeStyle: chartTheme().categoryColors[c.category],
                  fontColor: chartTheme().ink,
                  index: i,
                })),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx: { dataIndex: number }) => {
                const c = results.byCategory[ctx.dataIndex]
                return `${formatUsdPerHour(c.usdPerHour)} (${formatPercent(c.share)})`
              },
            },
          },
        },
      },
    }
    // `dark` fuerza releer las CSS variables del tema (CA-07.1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, dark])

  return (
    <div className="rounded-lg border border-line bg-raised p-4">
      <h2 className="text-sm font-semibold">{strings.charts.breakdownTitle}</h2>
      <p className="text-xs text-muted">{strings.charts.breakdownHint}</p>
      <div className="mt-3 h-64" aria-hidden="true">
        <Doughnut data={data} options={options} />
      </div>
      {/* Alternativa textual accesible al canvas */}
      <table className="sr-only">
        <caption>{strings.charts.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{strings.charts.colCategory}</th>
            <th scope="col">{strings.charts.colCost}</th>
            <th scope="col">{strings.charts.colShare}</th>
          </tr>
        </thead>
        <tbody>
          {results.byCategory.map((c) => (
            <tr key={c.category}>
              <th scope="row">{CATEGORY_LABELS[c.category]}</th>
              <td>{formatUsdPerHour(c.usdPerHour)}</td>
              <td>{formatPercent(c.share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

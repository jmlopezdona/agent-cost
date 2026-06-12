import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import type { TooltipItem } from 'chart.js'
import { chartTheme } from './chartSetup'
import { strings } from '../../i18n/es'
import { formatUSD } from '../../lib/format'
import { useResults } from '../../lib/useResults'
import { useTheme } from '../../lib/theme'

/** Barras techo vs. ponderado mensual (RF-07.2) */
export function CeilingVsWeightedChart() {
  const results = useResults()
  const dark = useTheme((s) => s.dark)

  const { data, options } = useMemo(() => {
    const theme = chartTheme()
    return {
      data: {
        labels: [strings.charts.ceilingBar, strings.charts.weightedBar],
        datasets: [
          {
            data: [results.ceilingMonthlyUSD, results.weightedMonthlyUSD],
            backgroundColor: [theme.ceiling, theme.agent],
            // Señal secundaria además del color: el ponderado lleva borde
            borderColor: [theme.ceiling, theme.ink],
            borderWidth: [0, 2],
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'bar'>) => formatUSD(Number(ctx.parsed.y)),
            },
          },
        },
        scales: {
          x: { ticks: { color: theme.ink }, grid: { display: false } },
          y: {
            ticks: { color: theme.muted, callback: (v: string | number) => formatUSD(Number(v)) },
            grid: { color: theme.grid },
          },
        },
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, dark])

  const ariaLabel = `${strings.charts.ceilingVsWeightedTitle}: ${strings.charts.ceilingBar} ${formatUSD(results.ceilingMonthlyUSD)}, ${strings.charts.weightedBar} ${formatUSD(results.weightedMonthlyUSD)}`

  return (
    <div className="rounded-lg border border-line bg-raised p-4">
      <h2 className="text-sm font-semibold">{strings.charts.ceilingVsWeightedTitle}</h2>
      <div className="mt-3 h-56" role="img" aria-label={ariaLabel}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

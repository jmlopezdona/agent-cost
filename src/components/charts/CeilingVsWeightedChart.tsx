import { useEffect, useMemo, useRef } from 'react'
import { Bar } from 'react-chartjs-2'
import type { Chart as ChartJS, TooltipItem } from 'chart.js'
import { chartTheme } from './chartSetup'
import { barValueLabels } from './barValueLabels'
import { registerChart } from '../../lib/chartRegistry'
import { ChartExportButton } from '../export/ChartExportButton'
import { strings } from '../../i18n/es'
import { formatMoney } from '../../lib/format'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import { useTheme } from '../../lib/theme'

/** Barras techo vs. ponderado mensual (RF-07.2) */
export function CeilingVsWeightedChart() {
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const presentation = useScenarioStore((s) => s.presentation)
  const dark = useTheme((s) => s.dark)
  const chartRef = useRef<ChartJS<'bar'>>(null)
  useEffect(() => registerChart('ceiling', () => chartRef.current?.canvas ?? null), [])

  // El motor devuelve USD; las barras se expresan en la moneda activa (D3)
  const toDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)
  const ceiling = toDisplay(results.ceilingMonthlyUSD)
  const weighted = toDisplay(results.weightedMonthlyUSD)

  const { data, options } = useMemo(() => {
    const theme = chartTheme()
    return {
      data: {
        labels: [strings.charts.ceilingBar, strings.charts.weightedBar],
        datasets: [
          {
            data: [ceiling, weighted],
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
              label: (ctx: TooltipItem<'bar'>) => formatMoney(Number(ctx.parsed.y), currency),
            },
          },
        },
        scales: {
          x: { ticks: { color: theme.ink }, grid: { display: false } },
          y: {
            // Headroom para que la etiqueta de valor sobre la barra no se recorte
            grace: '12%',
            ticks: {
              color: theme.muted,
              callback: (v: string | number) => formatMoney(Number(v), currency),
            },
            grid: { color: theme.grid },
          },
        },
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ceiling, weighted, currency, dark])

  return (
    <div
      className={`rounded-lg border border-line bg-raised p-4 ${
        presentation ? 'lg:flex lg:h-[28rem] lg:flex-col' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">{strings.charts.ceilingVsWeightedTitle}</h2>
        <ChartExportButton id="ceiling" title={strings.charts.ceilingVsWeightedTitle} />
      </div>
      <div
        className={`mt-3 h-56 ${presentation ? 'lg:h-auto lg:min-h-0 lg:flex-1' : ''}`}
        aria-hidden="true"
      >
        <Bar
          ref={chartRef}
          data={data}
          options={options}
          plugins={[barValueLabels((v) => formatMoney(v, currency))]}
        />
      </div>
    </div>
  )
}

/**
 * Alternativa textual accesible al gráfico de techo vs. ponderado (regla 9, D4).
 * Se renderiza siempre, fuera del canvas condicionado por la pestaña.
 */
export function CeilingVsWeightedAlt() {
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)

  const toDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)

  return (
    <table className="sr-only">
      <caption>{strings.charts.ceilingVsWeightedTitle}</caption>
      <tbody>
        <tr>
          <th scope="row">{strings.charts.ceilingBar}</th>
          <td>{formatMoney(toDisplay(results.ceilingMonthlyUSD), currency)}</td>
        </tr>
        <tr>
          <th scope="row">{strings.charts.weightedBar}</th>
          <td>{formatMoney(toDisplay(results.weightedMonthlyUSD), currency)}</td>
        </tr>
      </tbody>
    </table>
  )
}

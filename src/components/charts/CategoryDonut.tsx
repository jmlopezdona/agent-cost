import { useEffect, useMemo, useRef } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { Chart as ChartJS } from 'chart.js'
import { categoryBorderDash, categoryColor, categoryLabel, chartTheme } from './chartSetup'
import { registerChart } from '../../lib/chartRegistry'
import { ChartExportButton } from '../export/ChartExportButton'
import { useFormat, useStrings } from '../../i18n/hooks'
import { CURRENCY_SYMBOL } from '../../lib/format'
import { usdToEur } from '../../engine/salary'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import { useTheme } from '../../lib/theme'

/** Desglose del coste por categoría de token (RF-07.1) */
export function CategoryDonut() {
  const t = useStrings()
  const { formatMoneyPerHour, formatPercent } = useFormat()
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)
  const presentation = useScenarioStore((s) => s.presentation)
  const dark = useTheme((s) => s.dark)
  const chartRef = useRef<ChartJS<'doughnut'>>(null)
  useEffect(() => registerChart('breakdown', () => chartRef.current?.canvas ?? null), [])

  // Las tasas por categoría son USD/h del motor; se muestran en la moneda activa (D3)
  const rate = (usdPerHour: number) =>
    formatMoneyPerHour(currency === 'eur' ? usdToEur(usdPerHour, fx) : usdPerHour, currency)

  const { data, options } = useMemo(() => {
    const theme = chartTheme()
    return {
      data: {
        labels: results.byCategory.map((c) => categoryLabel(t, c.category)),
        datasets: [
          {
            data: results.byCategory.map((c) => c.usdPerHour),
            backgroundColor: results.byCategory.map((c) => categoryColor(c.category)),
            // Señal secundaria al color: borde con patrón distinto por categoría (CA-07.2)
            borderColor: theme.ink,
            borderWidth: 2,
            borderDash: (ctx: { dataIndex: number }) =>
              categoryBorderDash(results.byCategory[ctx.dataIndex].category),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right' as const,
            labels: {
              color: theme.ink,
              // Leyenda con valor + % (CA del spec results-display)
              generateLabels: () =>
                results.byCategory.map((c, i) => ({
                  text: `${categoryLabel(t, c.category)}: ${rate(c.usdPerHour)} (${formatPercent(c.share)})`,
                  fillStyle: categoryColor(c.category),
                  // El swatch replica el borde de la porción (color + patrón) para
                  // mantener la señal secundaria al color también en la leyenda (CA-07.2)
                  strokeStyle: theme.ink,
                  lineWidth: 2,
                  lineDash: categoryBorderDash(c.category),
                  fontColor: theme.ink,
                  index: i,
                })),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx: { dataIndex: number }) => {
                const c = results.byCategory[ctx.dataIndex]
                return `${rate(c.usdPerHour)} (${formatPercent(c.share)})`
              },
            },
          },
        },
      },
    }
    // `dark` fuerza releer las CSS variables del tema (CA-07.1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, currency, fx, dark, t])

  return (
    <div
      className={`rounded-lg border border-line bg-raised p-4 ${
        presentation ? 'lg:flex lg:h-[28rem] lg:flex-col' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t.charts.breakdownTitle}</h2>
          <p className="text-xs text-muted">{t.charts.breakdownHint}</p>
        </div>
        <ChartExportButton id="breakdown" title={t.charts.breakdownTitle} />
      </div>
      <div
        className={`mt-3 h-64 ${presentation ? 'lg:h-auto lg:min-h-0 lg:flex-1' : ''}`}
        aria-hidden="true"
      >
        <Doughnut ref={chartRef} data={data} options={options} />
      </div>
    </div>
  )
}

/**
 * Alternativa textual accesible al donut (regla 9, D4). Se renderiza siempre,
 * fuera del canvas condicionado por la pestaña, para que los datos del gráfico
 * sigan disponibles aunque su canvas no esté montado.
 */
export function CategoryDonutAlt() {
  const t = useStrings()
  const { formatMoneyPerHour, formatPercent } = useFormat()
  const results = useResults()
  const currency = useScenarioStore((s) => s.currency)
  const fx = useScenarioStore((s) => s.fx)

  const rate = (usdPerHour: number) =>
    formatMoneyPerHour(currency === 'eur' ? usdToEur(usdPerHour, fx) : usdPerHour, currency)

  return (
    <table className="sr-only">
      <caption>{t.charts.breakdownTitle}</caption>
      <thead>
        <tr>
          <th scope="col">{t.charts.colCategory}</th>
          <th scope="col">{t.charts.colCost(CURRENCY_SYMBOL[currency])}</th>
          <th scope="col">{t.charts.colShare}</th>
        </tr>
      </thead>
      <tbody>
        {results.byCategory.map((c) => (
          <tr key={c.category}>
            <th scope="row">{categoryLabel(t, c.category)}</th>
            <td>{rate(c.usdPerHour)}</td>
            <td>{formatPercent(c.share)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

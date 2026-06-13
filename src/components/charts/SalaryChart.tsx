import { useEffect, useMemo, useRef } from 'react'
import { Bar } from 'react-chartjs-2'
import type { Chart as ChartJS, TooltipItem } from 'chart.js'
import { chartTheme } from './chartSetup'
import { barValueLabels } from './barValueLabels'
import { registerChart } from '../../lib/chartRegistry'
import { ChartExportButton } from '../export/ChartExportButton'
import { useFormat, useStrings } from '../../i18n/hooks'
import { roleProse } from '../../i18n'
import { useSalary } from '../../lib/useSalary'
import { useTheme } from '../../lib/theme'

/** Coste mensual: escenario de agentes vs. perfiles humanos (RF-06) */
export function SalaryChart() {
  const t = useStrings()
  const { formatMoney } = useFormat()
  const { rows, currency, fx, agentMonthlyDisplay, eurToDisplay } = useSalary()
  const dark = useTheme((s) => s.dark)
  const chartRef = useRef<ChartJS<'bar'>>(null)
  useEffect(() => registerChart('salary', () => chartRef.current?.canvas ?? null), [])

  const monthlyCostsKey = rows.map((r) => r.cost.monthlyEUR).join(',')

  const { data, options } = useMemo(() => {
    const theme = chartTheme()
    return {
      data: {
        labels: [t.salary.agentBarLabel, ...rows.map((r) => roleProse(t, r.profile.id).name)],
        datasets: [
          {
            data: [agentMonthlyDisplay, ...rows.map((r) => eurToDisplay(r.cost.monthlyEUR))],
            backgroundColor: [theme.agent, ...rows.map(() => theme.human)],
            // Señal secundaria además del color (CA-06.1): la barra del agente lleva borde discontinuo
            borderColor: [theme.ink, ...rows.map(() => theme.human)],
            borderWidth: [2, 0, 0, 0, 0],
            borderDash: [6, 3],
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'bar'>) => formatMoney(Number(ctx.parsed.x), currency),
            },
          },
        },
        scales: {
          x: {
            // Headroom para que la etiqueta de valor al final de la barra no se recorte
            grace: '15%',
            ticks: {
              color: theme.muted,
              callback: (v: string | number) => formatMoney(Number(v), currency),
            },
            grid: { color: theme.grid },
          },
          y: { ticks: { color: theme.ink }, grid: { display: false } },
        },
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentMonthlyDisplay, monthlyCostsKey, currency, fx, dark, t])

  const chartAria = [
    `${t.salary.agentBarLabel}: ${formatMoney(agentMonthlyDisplay, currency)}`,
    ...rows.map(
      (r) =>
        `${roleProse(t, r.profile.id).name}: ${formatMoney(eurToDisplay(r.cost.monthlyEUR), currency)}`,
    ),
  ].join(', ')

  return (
    <div className="rounded-lg border border-line bg-raised p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t.salary.chartTitle(currency === 'eur' ? 'EUR' : 'USD')}
        </h2>
        <ChartExportButton id="salary" title={t.salary.sectionTitle} />
      </div>
      <div className="mt-3 h-56" role="img" aria-label={chartAria}>
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

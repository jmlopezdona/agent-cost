import { useEffect, useMemo, useRef } from 'react'
import { Bar } from 'react-chartjs-2'
import type { Chart as ChartJS, TooltipItem } from 'chart.js'
import { chartTheme } from '../charts/chartSetup'
import { registerChart } from '../../lib/chartRegistry'
import { ChartExportButton } from '../export/ChartExportButton'
import { strings } from '../../i18n/es'
import { salaryData } from '../../data'
import {
  agentEurPerActiveHour,
  employerCost,
  eurToUsd,
  fteEffectiveHoursPerMonth,
  fteEquivalence,
  hoursRatio,
  usdToEur,
} from '../../engine/salary'
import {
  formatFx,
  formatHours,
  formatInt,
  formatMoney,
  formatMoneyPerHour,
  formatOneDecimal,
  formatRatio,
  CURRENCY_SYMBOL,
} from '../../lib/format'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'
import { useTheme } from '../../lib/theme'

export function SalaryComparison() {
  const fx = useScenarioStore((s) => s.fx)
  const setFx = useScenarioStore((s) => s.setFx)
  const currency = useScenarioStore((s) => s.currency)
  const profileGross = useScenarioStore((s) => s.profileGross)
  const setProfileGross = useScenarioStore((s) => s.setProfileGross)
  const employerMultiplier = useScenarioStore((s) => s.employerMultiplier)
  const effectiveHours = useScenarioStore((s) => s.effectiveHours)
  const results = useResults()
  const dark = useTheme((s) => s.dark)
  const chartRef = useRef<ChartJS<'bar'>>(null)
  useEffect(() => registerChart('salary', () => chartRef.current?.canvas ?? null), [])

  // Configuración salarial editable en la configuración avanzada (RF-08, D2)
  const config = {
    employerCostMultiplier: employerMultiplier,
    effectiveHoursPerYear: effectiveHours,
  }

  // Coste del agente: USD nativo → moneda activa. Nóminas: EUR nativo → moneda activa (D3).
  const agentToDisplay = (usd: number) => (currency === 'eur' ? usdToEur(usd, fx) : usd)
  const eurToDisplay = (eur: number) => (currency === 'usd' ? eurToUsd(eur, fx) : eur)

  // Base EUR para las equivalencias FTE (ratio independiente de la moneda mostrada)
  const agentMonthlyEUR = usdToEur(results.weightedMonthlyUSD, fx)
  const agentMonthlyDisplay = agentToDisplay(results.weightedMonthlyUSD)
  const agentPerHourDisplay = agentEurPerActiveHour(agentMonthlyDisplay, results.activeHoursMonth)

  const rows = salaryData.profiles.map((profile) => {
    const gross = profileGross[profile.id] ?? profile.grossAnnualEUR
    const cost = employerCost(gross, config)
    return { profile, gross, cost, fte: fteEquivalence(agentMonthlyEUR, cost.monthlyEUR) }
  })
  const monthlyCostsKey = rows.map((r) => r.cost.monthlyEUR).join(',')

  const { data, options } = useMemo(() => {
    const theme = chartTheme()
    return {
      data: {
        labels: [strings.salary.agentBarLabel, ...rows.map((r) => r.profile.name)],
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
  }, [agentMonthlyDisplay, monthlyCostsKey, currency, fx, dark])

  const chartAria = [
    `${strings.salary.agentBarLabel}: ${formatMoney(agentMonthlyDisplay, currency)}`,
    ...rows.map((r) => `${r.profile.name}: ${formatMoney(eurToDisplay(r.cost.monthlyEUR), currency)}`),
  ].join(', ')

  return (
    <section className="rounded-lg border border-line bg-raised p-4">
      <h2 className="text-sm font-semibold">{strings.salary.sectionTitle}</h2>

      {/* Disclaimer permanente, visible sin scroll dentro de la sección (CA-06.2) */}
      <p className="mt-2 rounded-md bg-warn-bg px-3 py-2 text-xs leading-relaxed text-warn-ink">
        {strings.salary.disclaimer}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tabular-nums">
            {strings.salary.agentMonthly(formatMoney(agentMonthlyDisplay, currency))}
          </p>
          <p className="text-xs text-muted tabular-nums">
            {strings.salary.agentPerHour(formatMoneyPerHour(agentPerHourDisplay, currency))} ·{' '}
            {strings.salary.hoursLine(
              formatHours(results.activeHoursMonth),
              formatInt(fteEffectiveHoursPerMonth(config)),
              formatRatio(hoursRatio(results.activeHoursMonth, config)),
            )}
          </p>
        </div>
        {/* Tipo de cambio siempre visible junto al resultado en EUR (RF-06) */}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs text-muted">
            {strings.salary.fxLabel} ({formatFx(fx)})
          </span>
          <input
            type="number"
            value={fx}
            min={0.1}
            max={10}
            step={0.01}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (Number.isFinite(v)) setFx(v)
            }}
            aria-label={strings.salary.fxLabel}
            className="w-20 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm tabular-nums focus:border-accent focus:outline-none"
          />
          <span className="text-xs text-muted">{strings.salary.fxUnit}</span>
        </label>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th scope="col" className="py-2 pr-2">
                {strings.salary.colProfile}
              </th>
              <th scope="col" className="py-2 pr-2">
                {strings.salary.colGross}
              </th>
              <th scope="col" className="py-2 pr-2 text-right">
                {strings.salary.colEmployerYear}
              </th>
              <th scope="col" className="py-2 pr-2 text-right">
                {strings.salary.colEmployerMonth}
              </th>
              <th scope="col" className="py-2 pr-2 text-right">
                {strings.salary.colPerHour(CURRENCY_SYMBOL[currency])}
              </th>
              <th scope="col" className="py-2 text-right">
                {strings.salary.colFte}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ profile, gross, cost, fte }) => (
              <tr key={profile.id} className="border-b border-line last:border-0">
                <th scope="row" className="py-2 pr-2 text-left font-medium">
                  {profile.name}
                  <span className="block text-xs font-normal text-muted">{profile.experience}</span>
                </th>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    value={gross}
                    min={0}
                    step={1000}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (Number.isFinite(v)) setProfileGross(profile.id, v)
                    }}
                    aria-label={strings.salary.grossInputLabel(profile.name)}
                    className="w-24 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm tabular-nums focus:border-accent focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-2 text-right">
                  {formatMoney(eurToDisplay(cost.annualEUR), currency)}
                </td>
                <td className="py-2 pr-2 text-right">
                  {formatMoney(eurToDisplay(cost.monthlyEUR), currency)}
                </td>
                <td className="py-2 pr-2 text-right">
                  {formatMoneyPerHour(eurToDisplay(cost.perEffectiveHourEUR), currency)}
                </td>
                <td className="py-2 text-right font-semibold">
                  {strings.salary.fteValue(formatRatio(fte))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-muted">
        {strings.salary.multiplierNote(
          formatOneDecimal(employerMultiplier),
          formatInt(effectiveHours),
        )}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-muted">
          {strings.salary.chartTitle(currency === 'eur' ? 'EUR' : 'USD')}
        </h3>
        <ChartExportButton id="salary" title={strings.salary.sectionTitle} />
      </div>
      <div className="mt-2 h-56" role="img" aria-label={chartAria}>
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </section>
  )
}

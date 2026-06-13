import { strings } from '../../i18n/es'
import { fteEffectiveHoursPerMonth, hoursRatio } from '../../engine/salary'
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
import { useSalary } from '../../lib/useSalary'
import { useScenarioStore } from '../../store/useScenarioStore'

export function SalaryComparison() {
  const setFx = useScenarioStore((s) => s.setFx)
  const setProfileGross = useScenarioStore((s) => s.setProfileGross)
  const presentation = useScenarioStore((s) => s.presentation)
  const {
    rows,
    config,
    currency,
    fx,
    activeHoursMonth,
    agentMonthlyDisplay,
    agentPerHourDisplay,
    eurToDisplay,
  } = useSalary()

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
              formatHours(activeHoursMonth),
              formatInt(fteEffectiveHoursPerMonth(config)),
              formatRatio(hoursRatio(activeHoursMonth, config)),
            )}
          </p>
        </div>
        {/* Tipo de cambio editable: control, oculto en modo presentación */}
        {!presentation && (
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
        )}
      </div>

      {/* Tabla con inputs editables: detalle/controles, oculta en presentación */}
      {!presentation && (
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
                    <span className="block text-xs font-normal text-muted">
                      {profile.experience}
                    </span>
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
      )}
      <p className="mt-1 text-xs text-muted">
        {strings.salary.multiplierNote(
          formatOneDecimal(config.employerCostMultiplier),
          formatInt(config.effectiveHoursPerYear),
        )}
      </p>
    </section>
  )
}

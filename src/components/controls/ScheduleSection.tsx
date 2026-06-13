import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { useFormat, useStrings } from '../../i18n/hooks'
import { RANGES } from '../../lib/ranges'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'

export function ScheduleSection() {
  const t = useStrings()
  const { formatHours, formatPercent } = useFormat()
  const scenario = useScenarioStore((s) => s.scenario)
  const setSchedule = useScenarioStore((s) => s.setSchedule)
  const applyRegime = useScenarioStore((s) => s.applyRegime)
  const results = useResults()

  const regimes = [
    { label: t.schedule.regimes.full, hoursPerDay: 24, daysPerWeek: 7 },
    { label: t.schedule.regimes.extended, hoursPerDay: 12, daysPerWeek: 5 },
    { label: t.schedule.regimes.office, hoursPerDay: 8, daysPerWeek: 5 },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={t.schedule.regimeGroupLabel} className="flex gap-2">
        {regimes.map((regime) => {
          const active =
            scenario.hoursPerDay === regime.hoursPerDay &&
            scenario.daysPerWeek === regime.daysPerWeek
          return (
            <button
              key={regime.label}
              type="button"
              aria-pressed={active}
              onClick={() => applyRegime(regime.hoursPerDay, regime.daysPerWeek)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'border-accent bg-accent-soft font-semibold text-accent'
                  : 'border-line bg-surface hover:border-accent'
              }`}
            >
              {regime.label}
            </button>
          )
        })}
      </div>

      <SliderInput
        label={t.schedule.hoursPerDay}
        unit={t.schedule.hoursUnit}
        value={scenario.hoursPerDay}
        min={RANGES.hoursPerDay.min}
        max={RANGES.hoursPerDay.max}
        onChange={(v) => setSchedule('hoursPerDay', v)}
      />
      <SliderInput
        label={t.schedule.daysPerWeek}
        unit={t.schedule.daysUnit}
        value={scenario.daysPerWeek}
        min={RANGES.daysPerWeek.min}
        max={RANGES.daysPerWeek.max}
        onChange={(v) => setSchedule('daysPerWeek', v)}
      />
      <SliderInput
        label={t.schedule.dutyCycle}
        unit={t.schedule.dutyUnit}
        value={Math.round(scenario.dutyCycle * 100)}
        min={RANGES.dutyCycle.min * 100}
        max={RANGES.dutyCycle.max * 100}
        onChange={(v) => setSchedule('dutyCycle', v / 100)}
        labelExtra={
          <HelpTip label={t.schedule.helpButton(t.schedule.dutyCycle)} text={t.schedule.dutyHelp} />
        }
        detail={t.schedule.dutyGuide}
      />
      <SliderInput
        label={t.schedule.agents}
        unit={t.schedule.agentsUnit}
        value={scenario.agents}
        min={RANGES.agents.min}
        max={RANGES.agents.max}
        onChange={(v) => setSchedule('agents', v)}
      />

      <p className="rounded-md bg-surface px-3 py-2 text-xs text-muted tabular-nums">
        {t.schedule.contextLine(
          formatHours(results.scheduledHoursMonth),
          formatHours(results.activeHoursMonth),
          formatPercent(scenario.dutyCycle),
        )}
      </p>
    </div>
  )
}

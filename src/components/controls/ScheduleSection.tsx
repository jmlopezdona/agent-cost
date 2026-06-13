import { SliderInput } from './SliderInput'
import { HelpTip } from './HelpTip'
import { strings } from '../../i18n/es'
import { RANGES } from '../../lib/ranges'
import { formatHours, formatPercent } from '../../lib/format'
import { useResults } from '../../lib/useResults'
import { useScenarioStore } from '../../store/useScenarioStore'

const REGIMES = [
  { label: strings.schedule.regimes.full, hoursPerDay: 24, daysPerWeek: 7 },
  { label: strings.schedule.regimes.extended, hoursPerDay: 12, daysPerWeek: 5 },
  { label: strings.schedule.regimes.office, hoursPerDay: 8, daysPerWeek: 5 },
]

export function ScheduleSection() {
  const scenario = useScenarioStore((s) => s.scenario)
  const setSchedule = useScenarioStore((s) => s.setSchedule)
  const applyRegime = useScenarioStore((s) => s.applyRegime)
  const results = useResults()

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={strings.schedule.regimeGroupLabel} className="flex gap-2">
        {REGIMES.map((regime) => {
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
        label={strings.schedule.hoursPerDay}
        unit={strings.schedule.hoursUnit}
        value={scenario.hoursPerDay}
        min={RANGES.hoursPerDay.min}
        max={RANGES.hoursPerDay.max}
        onChange={(v) => setSchedule('hoursPerDay', v)}
      />
      <SliderInput
        label={strings.schedule.daysPerWeek}
        unit={strings.schedule.daysUnit}
        value={scenario.daysPerWeek}
        min={RANGES.daysPerWeek.min}
        max={RANGES.daysPerWeek.max}
        onChange={(v) => setSchedule('daysPerWeek', v)}
      />
      <SliderInput
        label={strings.schedule.dutyCycle}
        unit={strings.schedule.dutyUnit}
        value={Math.round(scenario.dutyCycle * 100)}
        min={RANGES.dutyCycle.min * 100}
        max={RANGES.dutyCycle.max * 100}
        onChange={(v) => setSchedule('dutyCycle', v / 100)}
        labelExtra={
          <HelpTip
            label={strings.schedule.helpButton(strings.schedule.dutyCycle)}
            text={strings.schedule.dutyHelp}
          />
        }
        detail={strings.schedule.dutyGuide}
      />
      <SliderInput
        label={strings.schedule.agents}
        unit={strings.schedule.agentsUnit}
        value={scenario.agents}
        min={RANGES.agents.min}
        max={RANGES.agents.max}
        onChange={(v) => setSchedule('agents', v)}
      />

      <p className="rounded-md bg-surface px-3 py-2 text-xs text-muted tabular-nums">
        {strings.schedule.contextLine(
          formatHours(results.scheduledHoursMonth),
          formatHours(results.activeHoursMonth),
          formatPercent(scenario.dutyCycle),
        )}
      </p>
    </div>
  )
}

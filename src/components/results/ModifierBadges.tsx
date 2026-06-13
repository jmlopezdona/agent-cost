import { useFormat, useStrings } from '../../i18n/hooks'
import { MODEL_IDS } from '../../engine/types'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Badges de los modificadores activos junto a los resultados (CA-08.1) */
export function ModifierBadges() {
  const t = useStrings()
  const { formatPercent } = useFormat()
  const batchEnabled = useScenarioStore((s) => s.batchEnabled)
  const batchFraction = useScenarioStore((s) => s.batchFraction)
  const regional = useScenarioStore((s) => s.regional)
  const priceOverrides = useScenarioStore((s) => s.priceOverrides)

  const hasOverrides = MODEL_IDS.some((id) => priceOverrides[id] !== undefined)

  const badges: string[] = []
  if (batchEnabled) badges.push(t.badges.batch(formatPercent(batchFraction)))
  if (regional) badges.push(t.badges.bedrock)
  if (hasOverrides) badges.push(t.badges.pricesEdited)

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t.badges.label}>
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full border border-accent bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent"
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

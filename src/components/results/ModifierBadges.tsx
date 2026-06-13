import { useFormat, useStrings } from '../../i18n/hooks'
import { offersRegional, storageCategory } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Badges de los modificadores activos junto a los resultados (CA-08.1) */
export function ModifierBadges() {
  const t = useStrings()
  const { formatPercent } = useFormat()
  const providerId = useScenarioStore((s) => s.scenario.providerId)
  const batchEnabled = useScenarioStore((s) => s.batchEnabled)
  const batchFraction = useScenarioStore((s) => s.batchFraction)
  const regional = useScenarioStore((s) => s.regional)
  const storageEnabled = useScenarioStore((s) => s.storageEnabled)
  const priceOverrides = useScenarioStore((s) => s.priceOverrides)

  const hasOverrides = Object.keys(priceOverrides).length > 0

  const badges: string[] = []
  if (batchEnabled) badges.push(t.badges.batch(formatPercent(batchFraction)))
  // El recargo regional solo aplica si el proveedor activo lo ofrece
  if (regional && offersRegional(providerId)) badges.push(t.badges.bedrock)
  if (storageEnabled && storageCategory(providerId)) badges.push(t.badges.storage)
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

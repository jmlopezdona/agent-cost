import { useStrings } from '../../i18n/hooks'
import { pricingTable } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Aviso cuando la URL se compartió con otra versión de precios (CA-09.1) */
export function StaleVersionBanner() {
  const t = useStrings()
  const staleVersion = useScenarioStore((s) => s.staleVersion)
  const dismiss = useScenarioStore((s) => s.dismissStaleVersion)

  if (!staleVersion) return null

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-md bg-warn-bg px-3 py-2 text-sm text-warn-ink"
    >
      <p>{t.staleVersion(staleVersion, pricingTable.version)}</p>
      <button type="button" onClick={dismiss} aria-label={t.dismiss} className="font-bold">
        ×
      </button>
    </div>
  )
}

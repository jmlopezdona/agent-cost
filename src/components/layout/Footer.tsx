import { useStrings } from '../../i18n/hooks'
import { pricingTable, salaryData } from '../../data'
import { PROVIDER_IDS } from '../../engine/types'
import { useScenarioStore } from '../../store/useScenarioStore'

/** Marca corta del proveedor para el texto del enlace ("Anthropic · Claude" → "Anthropic") */
function providerBrand(name: string): string {
  return name.split(' · ')[0] ?? name
}

export function Footer() {
  const t = useStrings()
  const presentation = useScenarioStore((s) => s.presentation)
  return (
    <footer className="mt-8 border-t border-line pt-4 pb-8 text-xs leading-relaxed text-muted">
      {/* En presentación, el disclaimer de la comparativa salarial se traslada aquí como observaciones */}
      {presentation && (
        <p className="mb-3">
          <span className="font-semibold">{t.footer.observationsLabel}: </span>
          {t.salary.disclaimer}
        </p>
      )}
      <p>
        {t.footer.pricingVersion(pricingTable.version, pricingTable.effective_date)} ·{' '}
        {t.footer.pricingSourcesLabel}:{' '}
        {PROVIDER_IDS.map((id, i) => {
          const provider = pricingTable.providers[id]
          return (
            <span key={id}>
              {i > 0 && ' · '}
              <a
                href={provider.pricingUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-accent"
              >
                {providerBrand(provider.name)}
              </a>
            </span>
          )
        })}
      </p>
      <p className="mt-1">{t.footer.salarySources(t.salarySource, salaryData.last_reviewed)}</p>
      <p className="mt-1">{t.footer.estimateDisclaimer}</p>
      <p className="mt-1">{t.footer.noBackend}</p>
    </footer>
  )
}

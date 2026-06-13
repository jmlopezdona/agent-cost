import { useStrings } from '../../i18n/hooks'
import { pricingTable, salaryData } from '../../data'
import { useScenarioStore } from '../../store/useScenarioStore'

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
        <a
          href="https://claude.com/pricing#api"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-accent"
        >
          {t.footer.pricingLink}
        </a>
      </p>
      <p className="mt-1">{t.footer.salarySources(t.salarySource, salaryData.last_reviewed)}</p>
      <p className="mt-1">{t.footer.estimateDisclaimer}</p>
      <p className="mt-1">{t.footer.noBackend}</p>
    </footer>
  )
}

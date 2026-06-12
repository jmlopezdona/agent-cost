import { strings } from '../../i18n/es'
import { pricingTable, salaryData } from '../../data'

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line pt-4 pb-8 text-xs leading-relaxed text-muted">
      <p>
        {strings.footer.pricingVersion(pricingTable.version, pricingTable.effective_date)} ·{' '}
        <a
          href="https://claude.com/pricing#api"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-accent"
        >
          {strings.footer.pricingLink}
        </a>
      </p>
      <p className="mt-1">
        {strings.footer.salarySources(salaryData.source, salaryData.last_reviewed)}
      </p>
      <p className="mt-1">{strings.footer.estimateDisclaimer}</p>
      <p className="mt-1">{strings.footer.noBackend}</p>
    </footer>
  )
}
